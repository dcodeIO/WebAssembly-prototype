var stream = require("stream"),
    util   = require("./util"),
    types  = require("./types"),
    stmt   = require("./stmt/");

var BaseStmt = stmt.BaseStmt,
    StmtList = stmt.StmtList,
    Stmt = stmt.Stmt;

var verbose = 0; // For debugging

/**
 * An abstract syntax tree reader.
 * @constructor
 * @param {!FunctionDefinition} functionDefinition
 * @param {number} globalOffset
 * @param {!Object.<string,*>=} options
 */
var AstReader = module.exports = function(functionDefinition, globalOffset, options) {
    stream.Writable.call(this, options);

    /**
     * Global function body offset.
     * @type {number}
     */
    this.globalOffset = globalOffset;

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
     * Read offset.
     * @type {number}
     */
    this.offset = 0;

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
    EXPR_I32: 2,
    EXPR_F32: 3,
    EXPR_F64: 4,
    EXPR_VOID: 5,
    SWITCH: 6,
    POP: 7
};

/**
 * Returns the reader state suitable for the specified statement type.
 * @param {number} type
 * @param {boolean=} exprVoid
 * @returns {number}
 * @inner
 */
function stateForType(type, exprVoid) {
    switch (type) {
        case types.RType.I32:
            return AstReader.STATE.EXPR_I32;
            break;
        case types.RType.F32:
            return AstReader.STATE.EXPR_F32;
            break;
        case types.RType.F64:
            return AstReader.STATE.EXPR_F64;
            break;
        case types.RType.Void:
            return exprVoid ? AstReader.STATE.EXPR_VOID : AstReader.STATE.STMT;
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
            if (this.stack.length !== 1)
                throw Error("illegal state: stack not cleared: "+this.stack.length);
            var stmtList = this.stack[0];
            if (!(stmtList instanceof StmtList))
                throw Error("illegal state: last stack item is not a StmtList: "+stmtList);
            if (stmtList.length > 0) {
                stmtList.forEach(function (stmt) {
                    if (!(stmt instanceof BaseStmt))
                        throw Error("illegal state: StmtList contains non-Stmt: " + stmt);
                });
            }
            callback();
            this.emit("ast", stmtList);
            this.emit("end");
            return;
        }
        var state = this.state.pop();
        if (verbose >= 2) {
            console.log("---");
            console.log("state " + state);
            if (this.state.length > 10)
                console.log("state stack: +"+(this.state.length-10)+" "+this.state.slice(-10));
            else
                console.log("state stack: "+this.state);
        }
        try {
            switch (state) {
                case AstReader.STATE.STMT_LIST:
                    this._readStmtList();
                    break;
                case AstReader.STATE.STMT:
                    this._readStmt();
                    break;
                case AstReader.STATE.EXPR_I32:
                    this._readExprI32();
                    break;
                case AstReader.STATE.EXPR_F32:
                    this._readExprF32();
                    break;
                case AstReader.STATE.EXPR_F64:
                    this._readExprF64();
                    break;
                case AstReader.STATE.EXPR_VOID:
                    this._readExprVoid();
                    break;
                case AstReader.STATE.SWITCH:
                    this._readSwitch();
                    break;
                case AstReader.STATE.POP:
                    var last = this.stack.pop();
                    if (verbose >= 1)
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
            console.log(this.inspect());
            throw err;
        }
    } while (true);
};

AstReader.prototype._advance = function (nBytes) {
    this.buffer = this.buffer.slice(nBytes);
    this.offset += nBytes;
    // console.log("advancing to "+(this.readerOffset + this.offset).toString(16)+" : "+(this.buffer.length === 0 ? "EOF" : this.buffer[0].toString(16)));
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
        codeU8: function() {
            if (off >= ar.buffer.length)
                throw util.E_MORE;
            return code = ar.buffer[off++];
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
        f32: function() {
            if (off >= ar.buffer.length - 4)
                throw util.E_MORE;
            var value = ar.buffer.readFloatLE(off);
            off += 4;
            return value;
        },
        f64: function() {
            if (off >= ar.buffer.length - 8)
                throw util.E_MORE;
            var value = ar.buffer.readDoubleLE(off);
            off += 8;
            return value;
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
            var args = Array.isArray(state) ? state : Array.prototype.slice.call(arguments);
            if (args.length === 0)
                throw Error("s.expect called with zero args");
            if (st) {
                if (verbose >= 2)
                    console.log("push to stack: "+st);
                ar.stack.push(st);
            }
            if (st)
                args.push(AstReader.STATE.POP);
            if (verbose >= 2)
                console.log("expecting state: "+args.join(","));
            for (var i=args.length-1; i>=0; --i)
                ar.state.push(args[i]);
        },
        stmt: function(operands) {
            st = new stmt.Stmt(code.op, operands);
            parent.add(st);
            return st;
        },
        exprI32: function(operands) {
            st = new stmt.I32Stmt(code.op, operands);
            parent.add(st);
            return st;
        },
        exprF32: function(operands) {
            st = new stmt.F32Stmt(code.op, operands);
            parent.add(st);
            return st;
        },
        exprF64: function(operands) {
            st = new stmt.F64Stmt(code.op, operands);
            parent.add(st);
            return st;
        },
        exprVoid : function(operands) {
            st = new stmt.VoidStmt(code, operands);
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
    var s = S(this);
    var code = s.code();
    var STATE = AstReader.STATE;
    var temp, temp2, i, j;

    if (code.imm === null) {
        if (verbose >= 1)
            console.log("processing Stmt:" + types.StmtNames[code.op]);
        var Op = types.Stmt;
        switch (code.op) {

            // opcode + local variable index + Stmt<local variable type>
            case Op.SetLoc:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                s.expect(stateForType(s.localType(temp)));
                break;

            // opcode + global variable index + Stmt<global variable type>
            case Op.SetGlo:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                s.expect(stateForType(s.globalType(temp)));
                break;

            // opcode + Stmt<I32> heap index + Stmt<I32> value
            case Op.I32Store8:
            case Op.I32Store16:
            case Op.I32Store32:
                s.advance();
                s.stmt();
                s.expect(STATE.EXPR_I32, STATE.EXPR_I32);
                break;

            // opcode + offset + Stmt<I32> heap index + Stmt<I32> value
            case Op.I32StoreOff8:
            case Op.I32StoreOff16:
            case Op.I32StoreOff32:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                s.expect(STATE.EXPR_I32, STATE.EXPR_I32);
                break;

            // opcode + Stmt<I32> heap index + Stmt<F32> value
            case Op.F32Store:
                s.advance();
                s.stmt();
                s.expect(STATE.EXPR_I32, STATE.EXPR_F32);
                break;

            // opcode + offset + Stmt<I32> heap index + Stmt<F32> value
            case Op.F32StoreOff:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                s.expect(STATE.EXPR_I32, STATE.EXPR_F32);
                break;

            // opcode + Stmt<I32> heap index + Stmt<F64> value
            case Op.F64Store:
                s.advance();
                s.stmt();
                s.expect(STATE.EXPR_I32, STATE.EXPR_F64);
                break;

            // opcode + offset + Stmt<I32> heap index + Stmt<F64> value
            case Op.F64StoreOff:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                s.expect(STATE.EXPR_I32, STATE.EXPR_F64);
                break;

            // opcode + internal function index + argument list as Stmt<args[i] type>
            case Op.CallInt:
                temp2 = s.internalSig;

            // opcode + imported function index + argument list as Stmt<args[i] type>
            case Op.CallImp:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                temp2 = (temp2 || s.importSig)(temp).argumentTypes;
                if (temp2.length > 0) {
                    var expectFromArgs = [];
                    temp2.forEach(function (type) {
                        expectFromArgs.push(stateForType(type));
                    });
                    s.expect(expectFromArgs);
                }
                break;

            // opcode + function pointer table index + Stmt<I32> element index + argument list as Stmt<args[i] type>
            case Op.CallInd:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                var expectFromArgs = [STATE.EXPR_I32];
                temp2 = s.indirectSig(temp).argumentTypes;
                if (temp2.length > 0) {
                    temp2.forEach(function (type) {
                        expectFromArgs.push(stateForType(type));
                    });
                }
                s.expect(expectFromArgs);
                break;

            // opcode if this function's return type is Void
            // opcode + Stmt<return type> otherwise
            case Op.Ret:
                s.advance();
                s.stmt();
                if (s.rtype !== types.RType.Void)
                    s.expect(stateForType(s.rtype));
                break;

            // opcode + count + count * Stmt<Void>
            case Op.Block:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                if (temp > 0) {
                    var expectFromCount = [];
                    for (i = 0; i < temp; ++i)
                        expectFromCount.push(STATE.STMT);
                    s.expect(expectFromCount);
                }
                break;

            // opcode + Stmt<I32> condition + Stmt<Void> then
            case Op.IfThen:
                s.advance();
                s.stmt();
                s.expect(STATE.EXPR_I32, STATE.STMT);
                break;

            // opcode + Stmt<I32> condition + Stmt<Void> then + Stmt<Void> else
            case Op.IfElse:
                s.advance();
                s.stmt();
                s.expect(STATE.EXPR_I32, STATE.STMT, STATE.STMT);
                break;

            // opcode + Stmt<I32> condition + Stmt<Void> body
            case Op.While:
                s.advance();
                s.stmt();
                s.expect(STATE.EXPR_I32, STATE.STMT);
                break;

            // opcode + Stmt<void> body + Stmt<I32> condition
            case Op.Do:
                s.advance();
                s.stmt();
                s.expect(STATE.STMT, STATE.EXPR_I32);
                break;

            // opcode + Stmt<void> body
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

            // opcode + label index
            case Op.BreakLabel:
            case Op.ContinueLabel:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                break;

            // opcode + number of cases + Stmt<I32> condition + number of cases * ( SwitchCase type + respective (list of) Stmt<Void> )
            case Op.Switch:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                var expectFromSwitch = [STATE.EXPR_I32];
                if (temp > 0) {
                    for (i = 0; i < temp; ++i)
                        expectFromSwitch.push(STATE.SWITCH);
                }
                s.expect(expectFromSwitch);
                break;

            default:
                throw Error("illegal Stmt OpCode: " + code.op);
        }
    } else {
        if (verbose >= 1)
            console.log("processing StmtWithImm:" + types.StmtWithImmNames[code.op]);
        var Op = types.StmtWithImm;
        switch (code.op) {

            // opcodeWithImm (imm=local variable index) + Stmt<local variable type>
            case Op.SetLoc:
                temp = code.imm;
                s.advance();
                s.stmt(temp);
                s.expect(stateForType(s.localType(temp)));
                break;

            // opcodeWithImm (imm=global variable index) + Stmt<global variable type>
            case Op.SetGlo:
                temp = code.imm;
                s.advance();
                s.stmt(temp);
                s.expect(stateForType(s.globalType(temp)));
                break;

            default:
                throw Error("illegal StmtWithImm OpCode: " + code.op);
        }
    }
};

AstReader.prototype._readSwitch = function() {
    var sw = this.stack[this.stack.length-1];
    if (sw.code !== types.Stmt.Switch)
        throw Error("illegal state: not a switch statement: "+sw);
    var STATE = AstReader.STATE;
    var s = S(this);
    var cas = s.u8();
    var switchOperands = [cas];
    var expectWithinSwitch = [];
    var temp, i;
    switch (cas) {
        case types.SwitchCase.Case0:
            switchOperands.push(s.varint());
            s.advance();
            break;
        case types.SwitchCase.Case1:
            switchOperands.push(s.varint());
            s.advance();
            expectWithinSwitch.push(STATE.STMT);
            break;
        case types.SwitchCase.CaseN:
            var w = s.varint();
            switchOperands.push(w);
            temp = s.varint();
            s.advance();
            for (i=0; i<temp; ++i)
                expectWithinSwitch.push(STATE.STMT);
            break;
        case types.SwitchCase.Default0:
            s.advance();
            break;
        case types.SwitchCase.Default1:
            s.advance();
            expectWithinSwitch.push(STATE.STMT);
            break;
        case types.SwitchCase.DefaultN:
            temp = s.varint();
            s.advance();
            for (i=0; i<temp; ++i)
                expectWithinSwitch.push(STATE.STMT);
            break;
        default:
            throw Error("illegal switch case type: " + cas);
    }
    Array.prototype.push.apply(sw.operands, switchOperands);
    if (expectWithinSwitch.length > 0)
        s.expect(expectWithinSwitch);
};

AstReader.prototype._readExprI32 = function() {
    var s = S(this); s.stmt = s.exprI32;
    var code = s.code();
    var STATE = AstReader.STATE;
    var temp, temp2, i, j;

    if (code.imm === null) {
        if (verbose >= 1)
            console.log("processing I32:" + types.I32Names[code.op]);
        var Op = types.I32;
        switch (code.op) {

            // opcode + value
            case Op.LitImm:

            // opcode + I32 constant index
            case Op.LitPool:

            // opcode + local variable index
            case Op.GetLoc:

            // opcode + global variable index
            case Op.GetGlo:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                break;

            // opcode + local variable index + Stmt<I32> value
            case Op.SetLoc:

            // opcode + global variable index + Stmt<I32> value
            case Op.SetGlo:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                s.expect(STATE.EXPR_I32);
                break;

            // opcode + Stmt<I32> heap index
            case Op.SLoad8:
            case Op.ULoad8:
            case Op.SLoad16:
            case Op.ULoad16:
            case Op.Load32:
                s.advance();
                s.stmt();
                s.expect(STATE.EXPR_I32);
                break;

            // opcode + offset + Stmt<I32> heap index
            case Op.SLoadOff8:
            case Op.ULoadOff8:
            case Op.SLoadOff16:
            case Op.ULoadOff16:
            case Op.LoadOff32:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                s.expect(STATE.EXPR_I32);
                break;

            // opcode + Stmt<I32> heap index + Stmt<I32>
            case Op.Store8:
            case Op.Store16:
            case Op.Store32:
                s.advance();
                s.stmt();
                s.expect(STATE.EXPR_I32, STATE.EXPR_I32);
                break;

            // opcode + offset + Stmt<I32> heap index + Stmt<I32> value
            case Op.StoreOff8:
            case Op.StoreOff16:
            case Op.StoreOff32:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                s.expect(STATE.EXPR_I32, STATE.EXPR_I32);
                break;

            // opcode + internal function index + argument list as Stmt<args[i] type>
            case Op.CallInt:
                temp2 = s.internalSig;

            // opcode + imported function index + argument list as Stmt<args[i] type>
            case Op.CallImp:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                temp2 = (temp2 || s.importSig)(temp).argumentTypes;
                if (temp2.length > 0) {
                    var expectFromArgs = [];
                    temp2.forEach(function (type) {
                        expectFromArgs.push(stateForType(type));
                    });
                    s.expect(expectFromArgs);
                }
                break;

            // opcode + function pointer table index + Stmt<I32> element index + argument list as Stmt<args[i] type>
            case Op.CallInd:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                expectFromArgs = [STATE.EXPR_I32];
                temp2 = s.indirectSig(temp).argumentTypes;
                if (temp2.length > 0) {
                    temp2.forEach(function (type) {
                        expectFromArgs.push(stateForType(type));
                    });
                }
                s.expect(expectFromArgs);
                break;

            // opcode + Stmt<I32> condition + Stmt<I32> then + Stmt<I32> else
            case Op.Cond:
                s.advance();
                s.stmt();
                s.expect(STATE.EXPR_I32, STATE.EXPR_I32, STATE.EXPR_I32);
                break;

            // opcode + U8 RType + Stmt<previous RType> + Stmt<I32>
            case Op.Comma:
                temp = s.u8();
                s.advance();
                s.stmt(temp);
                s.expect(stateForType(temp, true), STATE.EXPR_I32);
                break;

            // opcode + Stmt<F32> value
            case Op.FromF32:
                s.advance();
                s.stmt();
                s.expect(STATE.EXPR_F32);
                break;

            // opcode + Stmt<F64> value
            case Op.FromF64:
                s.advance();
                s.stmt();
                s.expect(STATE.EXPR_F64);
                break;

            // opcode + Stmt<I32> value
            case Op.Neg:
            case Op.BitNot:
            case Op.Clz:
            case Op.LogicNot:
            case Op.Abs:
                s.advance();
                s.stmt();
                s.expect(STATE.EXPR_I32);
                break;

            // opcode + Stmt<I32> left + Stmt<I32> right
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
            case Op.NEqI32:
            case Op.SLeThI32:
            case Op.ULeThI32:
            case Op.SLeEqI32:
            case Op.ULeEqI32:
            case Op.SGrThI32:
            case Op.UGrThI32:
            case Op.SGrEqI32:
            case Op.UGrEqI32:
                s.advance();
                s.stmt();
                s.expect(STATE.EXPR_I32, STATE.EXPR_I32);
                break;

            // opcode + Stmt<F32> left + Stmt<F32> right
            case Op.EqF32:
            case Op.NEqF32:
            case Op.LeThF32:
            case Op.LeEqF32:
            case Op.GrThF32:
            case Op.GrEqF32:
                s.advance();
                s.stmt();
                s.expect(STATE.EXPR_F32, STATE.EXPR_F32);
                break;

            // opcode + Stmt<F64> left + Stmt<F64> right
            case Op.EqF64:
            case Op.NEqF64:
            case Op.LeThF64:
            case Op.LeEqF64:
            case Op.GrThF64:
            case Op.GrEqF64:
                s.advance();
                s.stmt();
                s.expect(STATE.EXPR_F64, STATE.EXPR_F64);
                break;

            // opcode + num args + num args * Stmt<I32>
            case Op.SMin:
            case Op.UMin:
            case Op.SMax:
            case Op.UMax:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                if (temp > 0) {
                    var expectFromCount = [];
                    for (i = 0; i < temp; ++i)
                        expectFromCount.push(STATE.EXPR_I32);
                    s.expect(expectFromCount);
                }
                break;

            default:
                throw Error("illegal I32 OpCode: "+code.op);
        }
    } else {
        if (verbose >= 1)
            console.log("processing I32WithImm:" + types.I32WithImmNames[code.op]);

        var Op = types.I32WithImm;
        switch (code.op) {

            // opcodeWithImm (imm = value)
            case Op.LitImm:

            // opcodeWithImm (imm = I32 constant index)
            case Op.LitPool:

            // opcodeWithImm (imm = local variable index)
            case Op.GetLoc:
                s.advance();
                s.stmt(code.imm);
                break;

            default:
                throw Error("illegal I32WithImm OpCode: "+code.op+" at "+(this.globalOffset + this.offset).toString(16));
        }
    }
};

AstReader.prototype._readExprF32 = function() {
    var s = S(this); s.stmt = s.exprF32;
    var code = s.code();
    var STATE = AstReader.STATE;
    var temp, temp2, i, j;

    if (verbose >= 1)
        console.log("processing F32:" + types.F32Names[code.op]);

    if (code.imm === null) {
        var Op = types.F32;
        switch (code.op) {

            // opcode + value
            case Op.LitImm:
                temp = s.f32();
                s.advance();
                s.stmt(temp);
                break;

            // opcode + F32 constant index
            case Op.LitPool:

            // opcode + local variable index
            case Op.GetLoc:

            // opcode + global variable index
            case Op.GetGlo:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                break;

            // opcode + local variable index + Stmt<F32> value
            case Op.SetLoc:

            // opcode + global variable index + Stmt<F32> value
            case Op.SetGlo:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                s.expect(STATE.EXPR_F32);
                break;

            // opcode + Stmt<I32> heap index
            case Op.Load:
                s.advance();
                s.stmt();
                s.expect(STATE.EXPR_I32);
                break;

            // opcode + offset + Stmt<I32> heap index
            case Op.LoadOff:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                s.expect(STATE.EXPR_I32);
                break;

            // opcode + Stmt<I32> heap index + Stmt<F32> value
            case Op.Store:
                s.advance();
                s.stmt();
                s.expect(STATE.EXPR_I32, STATE.EXPR_F32);
                break;

            // opcode + offset + Stmt<I32> heap index + Stmt<F32> value
            case Op.StoreOff:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                s.expect(STATE.EXPR_I32, STATE.EXPR_F32);
                break;

            // opcode + internal function index + argument list as Stmt<args[i] type>, ...
            case Op.CallInt:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                temp2 = s.internalSig(temp).argumentTypes;
                if (temp2.length > 0) {
                    var expectFromArgs = [];
                    temp2.forEach(function (type) {
                        expectFromArgs.push(stateForType(type));
                    });
                    s.expect(expectFromArgs);
                }
                break;

            // opcode + function pointer table index + Stmt<I32> element index + argument list as Stmt<args[i] type>, ...
            case Op.CallInd:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                expectFromArgs = [STATE.EXPR_I32];
                s.indirectSig(temp).argumentTypes.forEach(function (type) {
                    expectFromArgs.push(stateForType(type));
                });
                s.expect(expectFromArgs);
                break;

            // opcode + Stmt<I32> condition + Stmt<F32> then + Stmt<F32> else
            case Op.Cond:
                s.advance();
                s.stmt();
                s.expect(STATE.EXPR_I32, STATE.EXPR_F32, STATE.EXPR_F32);
                break;

            // opcode + U8 RType + Stmt<previous RType> left + Stmt<F32> right
            case Op.Comma:
                temp = s.u8();
                s.advance();
                s.stmt(temp);
                s.expect(stateForType(temp, true), STATE.EXPR_F32);
                break;

            // opcode + Stmt<I32> value
            case Op.FromS32:
            case Op.FromU32:
                s.advance();
                s.stmt();
                s.expect(STATE.EXPR_I32);
                break;

            // opcode + Stmt<F64> value
            case Op.FromF64:
                s.advance();
                s.stmt();
                s.expect(STATE.EXPR_F64);
                break;

            // opcode + Stmt<F32> value
            case Op.Neg:
            case Op.Abs:
            case Op.Ceil:
            case Op.Floor:
            case Op.Sqrt:
                s.advance();
                s.stmt();
                s.expect(STATE.EXPR_F32);
                break;

            // opcode + Stmt<F32> left + Stmt<F32> right
            case Op.Add:
            case Op.Sub:
            case Op.Mul:
            case Op.Div:
                s.advance();
                s.stmt();
                s.expect(STATE.EXPR_F32, STATE.EXPR_F32);
                break;

            default:
                throw Error("illegal F32 OpCode: "+code.op);
        }
    } else {
        var Op = types.F32WithImm;
        switch (code.op) {

            // opcode + F32 constant index
            case Op.LitPool:

            // opcode + local variable index
            case Op.GetLoc:
                s.advance();
                s.stmt(code.imm);
                break;

            default:
                throw Error("illegal F32WithImm OpCode: "+code.op);
        }
    }
};

AstReader.prototype._readExprF64 = function() {
            var s = S(this); s.stmt = s.exprF64;
            var code = s.code();
            var STATE = AstReader.STATE;
            var temp, temp2, i, j;

            if (code.imm === null) {
                if (verbose >= 1)
                    console.log("processing F64:" + types.F64Names[code.op]);

                var Op = types.F64;
                switch (code.op) {

            // opcode + value
            case Op.LitImm:
                temp = s.f64();
                s.advance();
                s.stmt(temp);
                break;

            // opcode + F64 constant index
            case Op.LitPool:

            // opcode + local variable index
            case Op.GetLoc:

            // opcode + global variable index
            case Op.GetGlo:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                break;

            // opcode + local variable index + Stmt<F64> value
            case Op.SetLoc:

            // opcode + global variable index + Stmt<F64> value
            case Op.SetGlo:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                s.expect(STATE.EXPR_F64);
                break;

            // opcode + Stmt<I32> heap index
            case Op.Load:
                s.advance();
                s.stmt();
                s.expect(STATE.EXPR_I32);
                break;

            // opcode + offset + Stmt<I32> heap index
            case Op.LoadOff:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                s.expect(STATE.EXPR_I32);
                break;

            // opcode + Stmt<I32> heap index + Stmt<F64> value
            case Op.Store:
                s.advance();
                s.stmt();
                s.expect(STATE.EXPR_I32, STATE.EXPR_F64);
                break;

            // opcode + offset + Stmt<I32> heap index + Stmt<F64> value
            case Op.StoreOff:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                s.expect(STATE.EXPR_I32, STATE.EXPR_F64);
                break;

            // opcode + internal function index + argument list as Stmt<args[i] type>
            case Op.CallInt:
                temp2 = s.internalSig;

            // opcode + imported function index + argument list as Stmt<args[i] type>
            case Op.CallImp:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                temp2 = (temp2 || s.importSig)(temp).argumentTypes;
                if (temp2.length > 0) {
                    var expectFromArgs = [];
                    temp2.forEach(function (type) {
                        expectFromArgs.push(stateForType(type));
                    });
                    s.expect(expectFromArgs);
                }
                break;

            // opcode + function pointer table index + Stmt<I32> element index + argument list as Stmt<args[i] type>
            case Op.CallInd:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                expectFromArgs = [STATE.EXPR_I32];
                s.indirectSig(temp).argumentTypes.forEach(function (type) {
                    expectFromArgs.push(stateForType(type));
                });
                s.expect(expectFromArgs);
                break;

            // opcode + Stmt<I32> condition + Stmt<F64> then + Stmt<F64> else
            case Op.Cond:
                s.advance();
                s.stmt();
                s.expect(STATE.EXPR_I32, STATE.EXPR_F64, STATE.EXPR_F64);
                break;

            // opcode + U8 RType + Stmt<previous RType> left + Stmt<F64> right
            case Op.Comma:
                temp = s.u8();
                s.advance();
                s.stmt(temp);
                s.expect(stateForType(temp, true), STATE.EXPR_F64);
                break;

            // opcode + Stmt<I32> value
            case Op.FromS32:
            case Op.FromU32:
                s.advance();
                s.stmt();
                s.expect(STATE.EXPR_I32);
                break;

            // opcode + Stmt<F32> value
            case Op.FromF32:
                s.advance();
                s.stmt();
                s.expect(STATE.EXPR_F32);
                break;

            // opcode + Stmt<F64> value
            case Op.Neg:
            case Op.Abs:
            case Op.Ceil:
            case Op.Floor:
            case Op.Sqrt:
            case Op.Cos:
            case Op.Sin:
            case Op.Tan:
            case Op.ACos:
            case Op.ASin:
            case Op.ATan:
            case Op.Exp:
            case Op.Ln:
                s.advance();
                s.stmt();
                s.expect(STATE.EXPR_F64);
                break;

            // opcode + Stmt<F64> left + Stmt<F64> right
            case Op.Add:
            case Op.Sub:
            case Op.Mul:
            case Op.Div:
            case Op.Mod:

            // opcode + Stmt<F64> y + Stmt<F64> x
            case Op.ATan2:

            // opcode + Stmt<F64> base + Stmt<F64> exponent
            case Op.Pow:

                s.advance();
                s.stmt();
                s.expect(STATE.EXPR_F64, STATE.EXPR_F64);
                break;

            // opcode + num args + num args * Stmt<F64>
            case Op.Min:
            case Op.Max:
                temp = s.varint();
                s.advance();
                s.stmt(temp);
                if (temp > 0) {
                    var expectFromCount = [];
                    for (i = 0; i < temp; ++i)
                        expectFromCount.push(STATE.EXPR_F64);
                    s.expect(expectFromCount);
                }
                break;

            default:
                throw Error("illegal F64 OpCode: "+code.op);
        }
    } else {
        if (verbose >= 1)
            console.log("processing F64WithImm:" + types.F64WithImmNames[code.op]);

        var Op = types.F64WithImm;
        switch (code.op) {

            // opcode + F64 constant index
            case Op.LitPool:

            // opcode + local variable index
            case Op.GetLoc:
                s.advance();
                s.stmt(code.imm);
                break;

            default:
                throw Error("illegal F64WithImm OpCode: "+code.op);
        }
    }
};

AstReader.prototype._readExprVoid = function() {
    var s = S(this); s.stmt = s.exprVoid;
    var code = s.codeU8();
    var STATE = AstReader.STATE;
    var temp, temp2, i, j;

    if (verbose >= 1)
        console.log("processing Void:" + types.VoidNames[code]);

    var Op = types.Void;
    switch (code) {

        // opcode + internal function index + argument list as Stmt<args[i] type>
        case Op.CallInt:
            temp2 = s.internalSig;

        // opcode + imported function index + argument list as Stmt<args[i] type>
        case Op.CallImp:
            temp = s.varint();
            s.advance();
            s.stmt(temp);
            temp2 = (temp2 || s.importSig)(temp).argumentTypes;
            if (temp2.length > 0) {
                var expectFromArgs = [];
                temp2.forEach(function (type) {
                    expectFromArgs.push(stateForType(type));
                });
                s.expect(expectFromArgs);
            }
            break;

        // opcode + function pointer table index + Stmt<I32> element index + argument list as Stmt<args[i] type>
        case types.Void.CallInd:
            temp = s.varint();
            s.advance();
            s.stmt(temp);
            expectFromArgs = [STATE.EXPR_I32];
            s.indirectSig(temp).argumentTypes.forEach(function (type) {
                expectFromArgs.push(stateForType(type));
            });
            s.expect(expectFromArgs);
            break;

        default:
            throw Error("illegal Void OpCode: "+code);
    }
};

function inspect(stmt, depth) {
    depth = depth || 0;
    var indent = "";
    for (var i=0; i<depth; ++i)
        indent += "  ";
    if (typeof stmt === 'number')
        return indent + stmt.toString(10);
    var sb = [];
    if (stmt instanceof StmtList) {
        sb.push(indent + "StmtList["+stmt.length+"]");
        stmt.forEach(function(stmt) {
            sb.push("\n", inspect(stmt, depth + 1));
        });
        return sb.join("");
    }
    if (stmt instanceof BaseStmt) {
        sb.push(indent + stmt.name);
        stmt.operands.forEach(function(oper) {
            sb.push("\n", inspect(oper, depth + 1));
        });
        return sb.join("");
    }
    throw Error("cannot inspect "+stmt);
}

/**
 * Returns a string representation of this AST reader's state.
 * @returns {string}
 */
AstReader.prototype.inspect = function() {
    var sb = [];
    sb.push("AstReader debug\n---------------\n");
    sb.push("Global offset: ", this.globalOffset.toString(16), "\n");
    sb.push("Current offset: ", (this.globalOffset + this.offset).toString(16), "\n");
    sb.push("Stack size: ", this.stack.length.toString(10), "\n");
    sb.push("State size: "+this.state.length.toString(10), "\n\n");
    sb.push(inspect(this.stack[0]));
    return sb.join("");
};
