var stream = require("stream"),
    util   = require("./util"),
    types  = require("./types"),
    Stmt   = require("./Stmt"),
    StmtList = require("./StmtList");

var AstReader = module.exports = function(reader, functionDefinition, options) {
    stream.Writable.call(this, options);

    /**
     * Parent reader instance.
     * @type {!Reader}
     */
    this.reader = reader;

    /**
     * Function definition.
     * @type {!{sig: number, signature: !{rtype: number, args: !Array.<number>}, vars: !Array.<number>, ast: StmtList }}
     */
    this.definition = functionDefinition;

    /**
     * Function signature.
     * @type {!{rtype: number, args: !Array.<number>}|*}
     */
    this.signature = this.reader.signatures[functionDefinition.sig];

    /**
     * Read buffer.
     * @type {Buffer}
     */
    this.buffer = null;

    /**
     * State queue.
     * @type {!Array.<number>}
     */
    this.state = [AstReader.STATE.STMT_LIST];

    /**
     * Processing stack.
     * @type {Array.<*>}
     */
    this.stack = [];
};

// Extends stream.Writable
AstReader.prototype = Object.create(stream.Writable.prototype);

/**
 * States.
 * @type {!Object.<string,number>}
 * @const
 */
AstReader.STATE = {
    STMT_LIST: 0,
    STMT: 1,
    STMT_I32: 2,
    STMT_F32: 3,
    STMT_F64: 4,
    POP: 5
};

AstReader.prototype._write = function (chunk, encoding, callback) {
    if (encoding)
        chunk = new Buffer(chunk, encoding);
    this.buffer = this.buffer === null ? chunk : Buffer.concat([this.buffer, chunk]);
    if (this.state.length === 0) {
        // Done
        callback();
        this.emit("end");
        return;
    }
    do {
        var state = this.state.shift();
        try {
            switch (state) {
                case AstReader.STATE.STMT_LIST:
                    this._readStmtList();
                    break;
                case AstReader.STATE.STMT:
                    this._readStmt();
                    break;
                case AstReader.STATE.STMT_I32:
                    this._readStmtI32();
                    break;
                case AstReader.STATE.STMT_F32:
                    this._readStmtF32();
                    break;
                case AstReader.STATE.STMT_F64:
                    this._readStmtF64();
                    break;
                case AstReader.STATE.POP:
                    this.stack.pop();
                    break;
                default:
                    throw Error("illegal state: " + this.state);
            }
        } catch (err) {
            if (err === util.E_MORE) {
                console.log("E_MORE");
                this.state.unshift(state);
                callback();
                return;
            }
            throw err;
        }
    } while (true);
};

AstReader.prototype._advance = function (nBytes) {
    this.buffer = this.buffer.slice(nBytes);
    this.offset += nBytes;
};

AstReader.prototype._readStmtList = function() {
    var off = 0;
    var vi = util.readVarint(this.buffer, off); off += vi.length;
    this._advance(off);
    var size = vi.value;
    this.stack.push(new StmtList(size));
    // Assemble from `size` statements
    for (var i=0; i<size; ++i)
        this.state.push(AstReader.STATE.STMT);
};

// A closure holding state of and providing utility for the current read operation.
function S(ar) {
    var off = 0;
    var code;
    var parent = ar.stack[ar.stack.length-1];
    return {
        code: function() {
            return code = util.readCode(ar.buffer, off++);
        },
        varint: function() {
            var vi = util.readVarint(ar.buffer, off); off += vi.length;
            return vi.value;
        },
        u8: function() {
            if (off >= ar.buffer.length)
                throw util.E_MORE;
            return ar.buffer[off++];
        },
        advance: function() {
            ar._advance(off);
            off = 0;
        },
        localType: function(index) {
            if (index >= ar.definition.vars.length)
                throw Error("illegal local variable index: "+index);
            return ar.definition.vars[index];
        },
        globalType: function(index) {
            if (index >= ar.reader.globalVars.length)
                throw Error("illegal global variable index: "+index);
            return ar.reader.globalVars[index].type;
        },
        expect: function(state) {
            var args = Array.prototype.slice.call(arguments);
            for (var i=args.length-1; i>=0; --i)
                ar.state.unshift(args[i]);
        },
        stmt: function(operands) {
            var stmt = new Stmt.Stmt(code.op, operands);
            ar.stack.push(stmt);
            parent.add(stmt);
            return stmt;
        },
        stmtName: function(op) {
            return types.StmtNames[op];
        },
        stmtI32: function(operands) {
            var stmt = new Stmt.I32Stmt(code.op, operands);
            ar.stack.push(stmt);
            return stmt;
        },
        stmtI32Name: function(op) {
            return types.I32Names[op];
        },
        stmtF32: function(operands) {
            var stmt = new Stmt.F32Stmt(code.op, operands);
            ar.stack.push(stmt);
            return stmt;
        },
        stmtF32Name: function(op) {
            return types.F32Names[op];
        },
        stmtF64: function(operands) {
            var stmt = new Stmt.F64Stmt(code.op, operands);
            ar.stack.push(stmt);
            return stmt;
        },
        stmtF64Name: function(op) {
            return types.F64Names[op];
        },
        rtype: ar.signature.rtype
    };
}

function typeToState(type) {
    switch (type) {
        case types.Type.I32:
            return AstReader.STATE.STMT_I32;
            break;
        case types.Type.F32:
            return AstReader.STATE.STMT_F32;
            break;
        case types.Type.F64:
            return AstReader.STATE.STMT.F64;
            break;
        default:
            throw Error("illegal type: "+type);
    }
}

AstReader.prototype._readStmt = function() {
    var s = S(this);
    var STATE = AstReader.STATE;

    var code = s.code();

    console.log(s.stmtName(code.op)+":void", code);

    if (code.imm === null) {
        switch (code.op) {

            // opcode + local variable index + Stmt<variable type>
            case types.Stmt.SetLoc:
                var index = s.varint();
                s.advance();
                s.stmt(index);
                s.expect(typeToState(s.localType(index)));
                break;

            // opcode + global variable index + Stmt<variable type>
            case types.Stmt.SetGlo:
                var index = s.varint();
                s.advance();
                s.stmt(index);
                s.expect(typeToState(s.globalType(index)));
                break;

            // opcode + heap index + Stmt<I32>
            case types.Stmt.I32Store8:
            case types.Stmt.I32StoreOff8:
            case types.Stmt.I32Store16:
            case types.Stmt.I32StoreOff16:
            case types.Stmt.I32Store32:
            case types.Stmt.I32StoreOff32:
                var index = s.varint();
                s.advance();
                s.stmt(index);
                s.expect(STATE.STMT_I32);
                break;

            // opcode + heap index + Stmt<F32>
            case types.Stmt.F32Store:
            case types.Stmt.F32StoreOff:
                var index = s.varint();
                s.advance();
                s.stmt(index);
                s.expect(STATE.STMT_F32);
                break;

            // opcode + heap index + Stmt<F64>
            case types.Stmt.F64Store:
            case types.Stmt.F64StoreOff:
                var index = s.varint();
                s.advance();
                s.stmt(index);
                s.expect(STATE.STMT_F64);
                break;

            // opcode + internal function index + args as Stmt<arg type>
            case types.Stmt.CallInt:

            // opcode + function pointer index + args oas Stmt<arg type>
            case types.Stmt.CallInd:

            // opcode + imported function index + args as Stmt<arg type>
            case types.Stmt.CallImp:
                throw "todo";
                /* var index = varint();
                 var sigIndex = this.reader.functionDeclarations[index];
                 var sig = this.reader.signatures[sigIndex];
                 stmt(index);
                 switch (sig.rtype) {
                 case types.RType.I32:
                 break;
                 case types.RType.F32:
                 break;
                 case types.RType.F64:
                 break;
                 default:
                 throw Error("illegal return type: "+sig.rtype);
                 }
                 advance(); */

            // opcode + Stmt<this function's return type>
            case types.Stmt.Ret:
                s.advance();
                s.stmt();
                s.expect(typeToState(s.rtype));
                break;

            // opcode + StmtList
            case types.Stmt.Block:
                var total = s.varint();
                s.advance();
                s.stmt(total);
                for (var i=0; i<total; ++i)
                    s.expect(STATE.STMT);
                break;

            // opcode + Stmt<I32> + Stmt<void>
            case types.Stmt.IfThen:
                s.advance();
                s.stmt();
                s.expect(STATE.STMT_I32, STATE.STMT);
                break;

            // opcode + Stmt<I32> + Stmt<void>
            case types.Stmt.IfElse:
                s.advance();
                s.stmt();
                s.expect(STATE.STMT_I32, STATE.STMT, STATE.STMT);
                break;

            // opcode + Stmt<I32> + Stmt<void>
            case types.Stmt.While:
                s.advance();
                s.stmt();
                s.expect(STATE.STMT_I32, STATE.STMT);
                break;

            // opcode + Stmt<void> + Stmt<I32>
            case types.Stmt.Do:
                s.advance();
                s.stmt();
                s.expect(STATE.STMT, STATE.STMT_I32);
                break;

            // opcode + Stmt<void>
            case types.Stmt.Label:
                s.advance();
                s.stmt();
                s.expect(STATE.STMT);
                break;

            // opcode + break depth + Stmt<void>
            case types.Stmt.Break:
                var depth = s.varint();
                s.advance();
                s.stmt(depth);
                s.expect(STATE.STMT);
                break;

            // opcode + break depth + Stmt<void>
            case types.Stmt.Continue:
                var depth = s.varint();
                s.advance();
                s.stmt(depth);
                s.expect(STATE.STMT);
                break;

            // opcode + break depth + Stmt<void>
            case types.Stmt.BreakLabel:
                var label = s.varint();
                s.advance();
                s.stmt(label);
                s.expect(STATE.STMT);
                break;

            // opcode + continue depth + Stmt<void>
            case types.Stmt.ContinueLabel:
                var label = s.varint();
                s.advance();
                s.stmt(label);
                s.expect(STATE.STMT);
                break;

            // opcode + number of cases + number of cases times SwitchCase type + respective (list of) Stmt<void>
            case types.Stmt.Switch:
                var nCases = s.varint();
                var _operands = [nCases];
                var _expect = [];
                for (var i=0; i<nCases; ++i) {
                    var cas = s.u8();
                    _operands.push(cas);
                    switch (cas) {
                        case types.SwitchCase.Case0:
                            _operands.push(s.varint());
                            break;
                        case types.SwitchCase.Case1:
                            _operands.push(s.varint());
                            _expect.push(STATE.STMT);
                            break;
                        case types.SwitchCase.CaseN:
                            _operands.push(s.varint());
                            var nStmts = s.varint();
                            for (var j=0; j<nStmts; ++j)
                                _expect.push(STATE.STMT);
                            break;
                        case types.SwitchCase.Default0:
                            break;
                        case types.SwitchCase.Default1:
                            _expect.push(STATE.STMT);
                            break;
                        case types.SwitchCase.DefaultN:
                            var nStmts = s.varint();
                            for (var j=0; j<nStmts; ++j)
                                _expect.push(STATE.STMT);
                            break;
                        default:
                            throw Error("illegal switch case: " + cas);
                    }
                }
                s.advance();
                s.stmt(_operands);
                s.expect.apply(s, _expect);
                break;

            default:
                throw Error("illegal opcode: " + code.op);
        }
    } else {
        switch (code.op) {

            // opcodeWithImm (imm=local variable index) + Stmt<variable type>
            case types.StmtWithImm.SetLoc:
                var index = code.imm;
                s.advance();
                s.stmt(index);
                s.expect(typeToState(s.localType(index)));
                break;

            // opcodeWithImm (imm=global variable index) + Stmt<variable type>
            case types.StmtWithImm.SetGlo:
                var index = code.imm;
                s.advance();
                s.stmt(index);
                s.expect(typeToState(s.localType(index)));
                break;

            default:
                throw Error("illegal opcode: " + code.op);
        }
    }
};

AstReader.prototype._readStmtI32 = function() {

    var s = S(this);
    var code = s.code();

    console.log(s.stmtI32Name(code.op)+":I32", code);

    if (code.imm === null) {
        switch (code.op) {

            // imm
            case types.I32.LitImm:
                var imm = s.varint();
                s.advance();
                s.stmt(imm);
                break;

            case types.I32.LitPool:
                var index = s.varint();
                s.advance();
                s.stmt(index);
                break;

            case types.I32.GetLoc:
                var index = s.varint();
                s.advance();
                s.stmt(index);
                break;

            case types.I32.GetGlo:
                var index = s.varint();
                s.advance();
                s.stmt(index);
                break;

            case types.I32.SetLoc:
            case types.I32.SetGlo:
                throw "todo";
                break;

            case types.I32.SLoad8:
            case types.I32.SLoadOff8:
            case types.I32.ULoad8:
            case types.I32.ULoadOff8:
            case types.I32.SLoad16:
            case types.I32.SLoadOff16:
            case types.I32.ULoad16:
            case types.I32.ULoadOff16:
            case types.I32.Load32:
            case types.I32.LoadOff32:
                throw "todo";
                break;

            case types.I32.Store8:
            case types.I32.StoreOff8:
            case types.I32.Store16:
            case types.I32.StoreOff16:
            case types.I32.Store32:
            case types.I32.StoreOff32:
                throw "todo";
                break;

            case types.I32.CallInt:
            case types.I32.CallInd:
            case types.I32.CallImp:
                throw "todo";
                break;

            case types.I32.Cond:
            case types.I32.Comma:
            case types.I32.FromF32:
            case types.I32.FromF64:
            case types.I32.Neg:
            case types.I32.Add:
            case types.I32.Sub:
            case types.I32.Mul:
                throw "todo";
                break;

            default:
                throw Error("illegal i32 opcode: "+code.op);
        }
    } else {
        switch (code.op) {
            case types.I32WithImm.LitImm:
            case types.I32WithImm.LitPool:
            case types.I32WithImm.GetLoc:
                expr = new Stmt.I32WithImm(code.op, code.imm);
                break;
            default:
                throw Error("unreachable");
        }
    }
};

AstReader.read = function(buffer, offset) {
    return new AstReader(buffer, offset).readStmtList();
};
