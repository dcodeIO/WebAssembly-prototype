var stream = require("stream"),
    util   = require("./util"),
    types  = require("./types"),
    stmt   = require("./stmt/"),
    BaseStmt = stmt.BaseStmt,
    StmtList = stmt.StmtList;

var verbose = false; // For debugging

/**
 * An abstract syntax tree reader.
 * @constructor
 * @param {!Reader} reader
 * @param {!FunctionDefinition} functionDefinition
 * @param {!Object.<string,*>=} options
 */
var AstReader = module.exports = function(functionDefinition, options) {
    stream.Writable.call(this, options);

    /**
     * Function definition.
     * @type {!FunctionDefinition}
     */
    this.definition = functionDefinition;

    /**
     * Function declaration.
     * @type {!FunctionDeclaration}
     */
    this.declaration = functionDefinition.declaration;

    /**
     * Function signature.
     * @type {!FunctionSignature}
     */
    this.signature = this.declaration.signature;

    /**
     * Assembly.
     * @type {!Assembly}
     */
    this.assembly = this.declaration.assembly;

    /**
     * Read buffer.
     * @type {Buffer}
     */
    this.buffer = null;

    /**
     * State stack.
     * @type {!Array.<number>}
     */
    this.state = [AstReader.STATE.STMT_LIST];

    /**
     * Processing stack.
     * @type {Array.<!StmtList|!BaseStmt>}
     */
    this.stack = []; // Expected to contain the root StmtList only when finished
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

/**
 * Returns the reader state suitable for the specified statement type.
 * @param {number} type
 * @returns {number}
 * @inner
 */
function stateForType(type) {
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

AstReader.prototype._write = function (chunk, encoding, callback) {
    if (encoding)
        chunk = new Buffer(chunk, encoding);
    this.buffer = this.buffer === null ? chunk : Buffer.concat([this.buffer, chunk]);
    if (this.state.length === 0) { // Already done
        callback();
        return;
    }
    do {
        if (this.state.length == 0) { // Done
            callback();
            this.emit("end");
            return;
        }
        var state = this.state.pop();
        if (verbose) {
            console.log("---");
            console.log("switch state to " + state);
            if (this.state.length > 10)
                console.log("state stack: +"+(this.state.length-10)+" "+this.state.slice(-10));
            else
                console.log("state stack:", this.state);
        }
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
                    var last = this.stack.pop();
                    if (verbose)
                        console.log("pop from stack: "+last.toString());
                    break;
                default:
                    throw Error("illegal state: " + this.state);
            }
        } catch (err) {
            if (err === util.E_MORE) {
                this.state.push(state);
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

// A closure holding state of and providing utility for the current read operation.
function S(ar) {
    var off = 0;
    var code;
    var parent = ar.stack[ar.stack.length-1];
    var st = null;
    return {
        code: function() {
            return code = util.readCode(ar.buffer, off++);
        },
        varint: function() {
            var vi = util.readVarint(ar.buffer, off); off += vi.length;
            return vi.value;
        },
        /* ifI32Lit: function() {
            var lit = util.readIfI32Lit(ar.buffer, off); off += lit.length;
            return {
                op: lit.op,
                value: lit.value
            };
        }, */
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
            if (index < ar.signature.argumentTypes.length)
                return ar.signature.argumentTypes[index];
            index -= ar.signature.argumentTypes.length;
            if (index >= ar.definition.variables.length)
                throw Error("illegal local variable index: "+index);
            return ar.definition.variables[index].type;
        },
        globalType: function(index) {
            if (index >= ar.assembly.globalVariables.length)
                throw Error("illegal global variable index: "+index);
            return ar.assembly.globalVariables[index].type;
        },
        internalSig: function(index) {
            if (index >= ar.assembly.functionDeclarations.length)
                throw Error("illegal internal function index: "+index);
            return ar.assembly.functionDeclarations[index].signature;
        },
        indirectSig: function(index) {
            if (index >= ar.assembly.functionPointerTables.length)
                throw Error("illegal indirect function index: "+index);
            return ar.assembly.functionPointerTables[index].signature;
        },
        importSig: function(index) {
            if (index >= ar.assembly.functionImports.length)
                throw Error("illegal import function index: "+index);
            if (ar.assembly.functionImports[index].signatures.length === 0)
                throw Error("import function "+index+" has no signatures");
            return ar.assembly.functionImports[index].signatures[0]; // FIXME: I have no idea how this is determined
        },
        expect: function(state) {
            if (!st)
                throw Error("illegal statement: "+st);
            ar.stack.push(st);
            var args = Array.isArray(state) ? state : Array.prototype.slice.call(arguments);
            args.push(AstReader.STATE.POP);
            if (verbose)
                console.log("expecting state:", args);
            for (var i=args.length-1; i>=0; --i)
                ar.state.push(args[i]);
        },
        stmtVoid: function(operands) {
            st = new stmt.Stmt(code.op, operands);
            parent.add(st);
            return st;
        },
        stmtI32: function(operands) {
            st = new stmt.I32Stmt(code.op, operands);
            parent.add(st);
            return st;
        },
        stmtF32: function(operands, hasMoreOperands) {
            st = new stmt.F32Stmt(code.op, operands);
            parent.add(st);
            return st;
        },
        stmtF64: function(operands, hasMoreOperands) {
            st = new stmt.F64Stmt(code.op, operands);
            parent.add(st);
            return st;
        },
        rtype: ar.signature.returnType
    };
}

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

AstReader.prototype._readStmt = function() {
    var s = S(this); s.stmt = s.stmtVoid;
    var code = s.code();
    var STATE = AstReader.STATE;
    var temp, temp2, i, j;

    if (verbose)
        console.log("processing Void:" + types.StmtNames[code.op]);

    if (code.imm === null) {
        var Op = types.Stmt;
        switch (code.op) {
            // opcode + local variable index + Stmt<variable type>
            case Op.SetLoc:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                s.expect(stateForType(s.localType(temp)));
                break;

            // opcode + global variable index + Stmt<variable type>
            case Op.SetGlo:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                s.expect(stateForType(s.globalType(temp)));
                break;

            // opcode + Stmt<I32> + Stmt<I32>
            case Op.I32Store8:
            case Op.I32Store16:
            case Op.I32Store32:
                s.advance();
                s.stmt();
                s.expect(STATE.STMT_I32, STATE.STMT_I32);
                break;

            // opcode + offset + Stmt<I32> + Stmt<I32>
            case Op.I32StoreOff8:
            case Op.I32StoreOff16:
            case Op.I32StoreOff32:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                s.expect(STATE.STMT_I32, STATE.STMT_I32);
                break;

            // opcode + Stmt<I32> + Stmt<F32>
            case Op.F32Store:
            case Op.F32StoreOff:
                s.advance();
                s.stmt();
                s.expect(STATE.STMT_I32, STATE.STMT_F32);
                break;

            // opcode + offset + Stmt<I32> + Stmt<F64>
            case Op.F64Store:
            case Op.F64StoreOff:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                s.expect(STATE.STMT_I32, STATE.STMT_F64);
                break;

            // opcode + internal function index + args as Stmt<arg type>
            case Op.CallInt:
                temp2 = s.internalSig;

            // opcode + function pointer index + args oas Stmt<arg type>
            case Op.CallInd:
                temp2 = temp2 || s.indirectSig;

            // opcode + imported function index + args as Stmt<arg type>
            case Op.CallImp:
                temp = s.varint();
                s.advance();
                var expectFromArgs = [];
                s.stmt(temp);
                (temp2 || s.importSig)(temp).argumentTypes.forEach(function(type) {
                    expectFromArgs.push(stateForType(type));
                });
                s.expect(expectFromArgs);
                break;

            // opcode + Stmt<this function's return type>
            case Op.Ret:
                s.advance();
                s.stmt();
                s.expect(stateForType(s.rtype));
                break;

            // opcode + count + count * Stmt<Void>
            case Op.Block:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                var expectFromCount = [];
                for (i=0; i<temp; ++i)
                    expectFromCount.push(STATE.STMT);
                s.expect(expectFromCount);
                break;

            // opcode + Stmt<I32> + Stmt<Void>
            case Op.IfThen:
                s.advance();
                s.stmt();
                s.expect(STATE.STMT_I32, STATE.STMT);
                break;

            // opcode + Stmt<I32> + Stmt<Void>
            case Op.IfElse:
                s.advance();
                s.stmt();
                s.expect(STATE.STMT_I32, STATE.STMT, STATE.STMT);
                break;

            // opcode + Stmt<I32> + Stmt<Void>
            case Op.While:
                s.advance();
                s.stmt();
                s.expect(STATE.STMT_I32, STATE.STMT);
                break;

            // opcode + Stmt<void> + Stmt<I32>
            case Op.Do:
                s.advance();
                s.stmt();
                s.expect(STATE.STMT, STATE.STMT_I32);
                break;

            // opcode + Stmt<void>
            case Op.Label:
                s.advance();
                s.stmt();
                s.expect(STATE.STMT);
                break;

            // opcode
            case Op.Break:
            case Op.Continue:
                s.advance();
                s.stmt();
                break;

            // opcode + depth
            case Op.BreakLabel:
            case Op.ContinueLabel:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                break;

            // opcode + number of cases + number of cases times SwitchCase type + respective (list of) Stmt<void>
            case Op.Switch:
                temp = s.varint();
                var switchOperands = [temp];
                var expectFromSwitch = [];
                for (i=0; i<temp; ++i) {
                    var cas = s.u8();
                    switchOperands.push(cas);
                    switch (cas) {
                        case types.SwitchCase.Case0:
                            switchOperands.push(s.varint());
                            break;
                        case types.SwitchCase.Case1:
                            switchOperands.push(s.varint());
                            expectFromSwitch.push(STATE.STMT);
                            break;
                        case types.SwitchCase.CaseN:
                            switchOperands.push(s.varint());
                            var nStmts = s.varint();
                            for (j=0; j<nStmts; ++j)
                                expectFromSwitch.push(STATE.STMT);
                            break;
                        case types.SwitchCase.Default0:
                            break;
                        case types.SwitchCase.Default1:
                            expectFromSwitch.push(STATE.STMT);
                            break;
                        case types.SwitchCase.DefaultN:
                            temp2 = s.varint();
                            for (j=0; j<temp2; ++j)
                                expectFromSwitch.push(STATE.STMT);
                            break;
                        default:
                            throw Error("illegal switch case: " + cas);
                    }
                }
                s.advance();
                s.stmt(switchOperands);
                s.expect(expectFromSwitch);
                break;

            default:
                throw Error("illegal Void OpCode: " + code.op);
        }
    } else {
        var Op = types.StmtWithImm;
        switch (code.op) {

            // opcodeWithImm (imm=local variable index) + Stmt<variable type>
            case Op.SetLoc:
                temp = code.imm;
                s.advance();
                s.stmt(temp);
                s.expect(stateForType(s.localType(temp)));
                break;

            // opcodeWithImm (imm=global variable index) + Stmt<variable type>
            case Op.SetGlo:
                temp = code.imm;
                s.advance();
                s.stmt(temp);
                s.expect(stateForType(s.localType(temp)));
                break;

            default:
                throw Error("illegal opcode: " + code.op);
        }
    }
};

AstReader.prototype._readStmtI32 = function() {
    var s = S(this); s.stmt = s.stmtI32;
    var code = s.code();
    var STATE = AstReader.STATE;
    var temp, temp2, i, j;

    if (verbose)
        console.log("processing I32:" + types.I32Names[code.op]);

    if (code.imm === null) {
        var Op = types.I32;
        switch (code.op) {

            // opcode + value
            case Op.LitImm:

            // opcode + constant index
            case Op.LitPool:

            // opcode + local variable index
            case Op.GetLoc:

            // opcode + global variable index
            case Op.GetGlo:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                break;

            // opcode + local variable index + STMT<I32>
            case Op.SetLoc:

            // opcode + global variable index + STMT<I32>
            case Op.SetGlo:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                s.expect(STATE.STMT_I32);
                break;

            // opcode + STMT<I32>
            case Op.SLoad8:
            case Op.ULoad8:
            case Op.SLoad16:
            case Op.ULoad16:
            case Op.Load32:
                s.advance();
                s.stmt();
                s.expect(STATE.STMT_I32);
                break;

            // opcode + offset + STMT<I32>
            case Op.SLoadOff8:
            case Op.ULoadOff8:
            case Op.SLoadOff16:
            case Op.ULoadOff16:
            case Op.LoadOff32:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                s.expect(STATE.STMT_I32);
                break;

            // opcode + STMT<I32> + STMT<I32>
            case Op.Store8:
            case Op.Store16:
            case Op.Store32:
                s.advance();
                s.stmt();
                s.expect(STATE.STMT_I32, STATE.STMT_I32);
                break;

            // opcode + offset + STMT<I32> + STMT<I32>
            case Op.StoreOff8:
            case Op.StoreOff16:
            case Op.StoreOff32:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                s.expect(STATE.STMT_I32, STATE.STMT_I32);
                break;

            // opcode + internal function index + args as Stmt<arg type>
            case Op.CallInt:
                temp2 = s.internalSig;

            // opcode + function pointer index + args oas Stmt<arg type>
            case Op.CallInd:
                temp2 = temp2 || s.indirectSig;

            // opcode + imported function index + args as Stmt<arg type>
            case Op.CallImp:
                temp = s.varint();
                s.advance();
                var expectFromArgs = [];
                s.stmt(temp);
                (temp2 || s.importSig)(temp).argumentTypes.forEach(function(type) {
                    expectFromArgs.push(stateForType(type));
                });
                s.expect(expectFromArgs);
                break;

            // opcode + STMT<I32> condition + STMT<I32> then + STMT<I32> else
            case Op.Cond:
                s.advance();
                s.stmt();
                s.expect(STATE.STMT_I32, STATE.STMT_I32, STATE.STMT_I32);
                break;

            // opcode + U8 RType + STMT<previous RType> + STMT<I32>
            case Op.Comma:
                temp = s.u8();
                s.advance();
                s.stmt(temp);
                s.expect(stateForType(temp), STATE.STMT_I32);
                break;

            // opcode + STMT<F32>
            case Op.FromF32:
                s.advance();
                s.stmt();
                s.expect(STATE.STMT_F32);
                break;

            // opcode + STMT<F64>
            case Op.FromF64:
                s.advance();
                s.stmt();
                s.expect(STATE.STMT_F64);
                break;

            // opcode + STMT<I32>
            case Op.Neg:
            case Op.BitNot:
            case Op.Clz:
            case Op.LogicNot:
            case Op.Abs:
                s.advance();
                s.stmt();
                s.expect(STATE.STMT_I32);
                break;

            // opcode + STMT<I32> + STMT<I32>
            case Op.Add:
            case Op.Sub:
            case Op.Mul:
            case Op.SDiv:
            case Op.UDiv:
            case Op.SMod:
            case Op.UMod:
            case Op.BitOr:
            case Op.BitAnd:
            case Op.BitXor:
            case Op.Lsh:
            case Op.ArithRsh:
            case Op.LogicRsh:
            case Op.EqI32:
            case Op.EqF32:
            case Op.EqF64:
            case Op.NEqI32:
            case Op.NEqF32:
            case Op.NEqF64:
            case Op.SLeThI32:
            case Op.ULeThI32:
            case Op.LeThF32:
            case Op.LeThF64:
            case Op.SLeEqI32:
            case Op.ULeEqI32:
            case Op.LeEqF32:
            case Op.LeEqF64:
            case Op.SGrThI32:
            case Op.UGrThI32:
            case Op.GrThF32:
            case Op.GrThF64:
            case Op.SGrEqI32:
            case Op.UGrEqI32:
            case Op.GrEqF32:
            case Op.GrEqF64:
                s.advance();
                s.stmt();
                s.expect(STATE.STMT_I32, STATE.STMT_I32);
                break;

            // opcode + num args + num args * STMT<I32>
            case Op.SMin:
            case Op.UMin:
            case Op.SMax:
            case Op.UMax:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                var expectFromCount = [];
                for (i=0; i<temp; ++i)
                    expectFromCount.push(STATE.STMT_I32);
                s.expect(expectFromCount);
                break;

            default:
                throw Error("illegal I32 OpCode: "+code.op);
        }
    } else {
        var Op = types.I32WithImm;
        switch (code.op) {

            // opcodeWithImm (imm = literal)
            case Op.LitImm:

            // opcodeWithImm (imm = constant index)
            case Op.LitPool:

            // opcodeWIthImm (imm = local variable index)
            case Op.GetLoc:
                s.advance();
                s.stmt(code.imm);
                break;

            default:
                throw Error("unreachable");
        }
    }
};

AstReader.prototype._readStmtF32 = function() {
    var s = S(this); s.stmt = s.stmtF32;
    var code = s.code();
    var STATE = AstReader.STATE;
    var temp, temp2, i, j;

    if (verbose)
        console.log("processing F32:" + types.F32Names[code.op]);

    if (code.imm === null) {
        var Op = types.F32;
        switch (code.op) {
            default:
                throw "todo";
        }
    } else {
        var Op = types.F32WithImm;
        switch (code.op) {
            default:
                throw "todo";
        }
    }
};

AstReader.prototype._readStmtF64 = function() {
    var s = S(this); s.stmt = s.stmtF64;
    var code = s.code();
    var STATE = AstReader.STATE;
    var temp, temp2, i, j;

    if (verbose)
        console.log("processing F64:" + types.F64Names[code.op]);

    if (code.imm === null) {
        var Op = types.F64;
        switch (code.op) {
            default:
                throw "todo";
        }
    } else {
        var Op = types.F64WithImm;
        switch (code.op) {
            default:
                throw "todo";
        }
    }
};
