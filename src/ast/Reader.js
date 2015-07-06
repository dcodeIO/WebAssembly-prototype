/*
 Copyright 2015 Daniel Wirtz <dcode@dcode.io>

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
var stream = require("stream"),
    util   = require("../util"),
    types  = require("../types"),
    stmt   = require("../stmt/");

var ReadState = require("./ReadState");

var Constant = require("../reflect/Constant"),
    GlobalVariable = require("../reflect/GlobalVariable"),
    FunctionSignature = require("../reflect/FunctionSignature"),
    FunctionDeclaration = require("../reflect/FunctionDeclaration"),
    FunctionImport = require("../reflect/FunctionImport"),
    FunctionImportSignature = require("../reflect/FunctionImportSignature"),
    FunctionPointerTable = require("../reflect/FunctionPointerTable"),
    LocalVariable = require("../reflect/LocalVariable");

var BaseStmt = stmt.BaseStmt,
    StmtList = stmt.StmtList,
    Stmt = stmt.Stmt;

var verbose = 0; // For debugging

/**
 * An abstract syntax tree reader.
 * @constructor
 * @param {!reflect.FunctionDefinition} functionDefinition
 * @param {!util.BufferQueue=} bufferQueue
 * @param {!Object.<string,*>=} options
 * @exports ast.Reader
 */
function Reader(functionDefinition, bufferQueue, options) {
    stream.Writable.call(this, options);

    if (!(bufferQueue instanceof util.BufferQueue)) {
        options = bufferQueue;
        bufferQueue = undefined;
    }

    /**
     * Function definition.
     * @type {!reflect.FunctionDefinition}
     */
    this.definition = functionDefinition;

    /**
     * Function declaration.
     * @type {!reflect.FunctionDeclaration}
     */
    this.declaration = functionDefinition.declaration;

    /**
     * Function signature.
     * @type {!reflect.FunctionSignature}
     */
    this.signature = this.declaration.signature;

    /**
     * Assembly.
     * @type {!reflect.Assembly}
     */
    this.assembly = this.declaration.assembly;

    /**
     * Read buffer queue.
     * @type {!util.BufferQueue}
     */
    this.bufferQueue = bufferQueue || new util.BufferQueue();

    /**
     * State stack.
     * @type {!Array.<number>}
     */
    this.state = [Reader.State.STMT_LIST];

    /**
     * Processing stack.
     * @type {Array.<!stmt.StmtList|!stmt.BaseStmt>}
     */
    this.stack = []; // Expected to contain the root StmtList only when finished

    /**
     * Read state closure.
     * @type {!ast.ReadState}
     */
    this.readState = new ReadState(this, Reader.State.POP);

    /**
     * Whether to skip ahead, not parsing the AST in detail.
     * @type {boolean}
     */
    this.skipAhead = !!(options && options.skipAhead);
}

module.exports = Reader;

// Extends stream.Writable
Reader.prototype = Object.create(stream.Writable.prototype);

/**
 * Global offset.
 * @name ast.Reader#offset
 * @type {number}
 */
Object.defineProperty(Reader.prototype, "offset", {
    get: function() {
        return this.bufferQueue.offset;
    }
});

/**
 * States.
 * @type {!Object.<string,number>}
 * @const
 */
Reader.State = {
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
 * @function
 * @name ast.Reader.stateForType
 * @param {number} type
 * @param {boolean=} exprVoid
 * @returns {number}
 */
var stateForType = Reader.stateForType = function(type) {
    switch (type) {
        case types.RType.I32:
            return Reader.State.EXPR_I32;
            break;
        case types.RType.F32:
            return Reader.State.EXPR_F32;
            break;
        case types.RType.F64:
            return Reader.State.EXPR_F64;
            break;
        case types.RType.Void:
            return Reader.State.EXPR_VOID;
        default:
            throw Error("illegal type: "+type);
    }
};

Reader.prototype._write = function (chunk, encoding, callback) {
    if (this.state.length === 0) { // Already done or failed
        callback(Error("already ended"));
        return;
    }
    if (encoding)
        chunk = new Buffer(chunk, encoding);
    if (chunk.length === 0) {
        callback();
        return;
    }
    this.bufferQueue.push(chunk);
    this._process();
    callback();
};

Reader.prototype._process = function() {
    if (this.state.length === 0)
        return;
    do {
        if (this.state.length === 0) { // Done
            if (!this.skipAhead) {
                this.readState.finish();
                if (this.stack.length !== 1)
                    throw Error("illegal state: stack not cleared: "+this.stack.length);
                var stmtList = this.stack[0];
                if (!(stmtList instanceof StmtList))
                    throw Error("illegal state: last stack item is not a StmtList: " + stmtList);
                if (stmtList.length > 0) {
                    stmtList.forEach(function (stmt) {
                        if (!(stmt instanceof BaseStmt))
                            throw Error("illegal state: StmtList contains non-Stmt: " + stmt);
                    });
                }
                this.emit("ast", stmtList);
            }
            this.emit("end");
            return;
        }
        var state = this.state.pop();
        try {
            switch (state) {
                case Reader.State.STMT_LIST:
                    this._readStmtList();
                    break;
                case Reader.State.STMT:
                    this._readStmt();
                    break;
                case Reader.State.EXPR_I32:
                    this._readExprI32();
                    break;
                case Reader.State.EXPR_F32:
                    this._readExprF32();
                    break;
                case Reader.State.EXPR_F64:
                    this._readExprF64();
                    break;
                case Reader.State.EXPR_VOID:
                    this._readExprVoid();
                    break;
                case Reader.State.SWITCH:
                    this._readSwitch();
                    break;
                case Reader.State.POP:
                    this.stack.pop();
                    break;
                default:
                    throw Error("illegal state: " + this.state);
            }
        } catch (err) {
            if (err === util.BufferQueue.E_MORE) {
                this.state.push(state); // Wait for more
                return;
            }
            this.emit("error", err);
            this.state = [];
            return;
        } finally {
            this.readState.reset();
        }
    } while (true);
};

Reader.prototype._readStmtList = function() {
    var s = this.readState;

    var size = s.varint();
    s.advance();

    if (!this.skipAhead)
        this.stack.push(new StmtList(size));
    for (var i=0; i<size; ++i)
        this.state.push(Reader.State.STMT);
};

Reader.prototype._readStmt = function() {
    var s = this.readState;

    var code = s.code();
    var State = Reader.State;
    var temp, i;

    if (code.imm === null) {

        if (verbose >= 1)
            console.log("processing Stmt:" + types.StmtNames[code.code]);

        var Op = types.Stmt;
        switch (code.code) {

            // opcode + local variable index + Stmt<local variable type>
            case Op.SetLoc:
                // Behavior.SetLoc.read(s);
                temp = s.local(s.varint());
                s.emit(temp);
                s.expect(stateForType(temp.type));
                break;

            // opcode + global variable index + Stmt<global variable type>
            case Op.SetGlo:
                // Behavior.SetGlo.read(s);
                temp = s.global(s.varint());
                s.emit(temp);
                s.expect(stateForType(temp.type));
                break;

            // opcode + Stmt<I32> heap index + Stmt<I32> value
            case Op.I32Store8:
            case Op.I32Store16:
            case Op.I32Store32:
                s.emit();
                s.expect([State.EXPR_I32, State.EXPR_I32]);
                break;

            // opcode + offset + Stmt<I32> heap index + Stmt<I32> value
            case Op.I32StoreOff8:
            case Op.I32StoreOff16:
            case Op.I32StoreOff32:
                s.emit(s.varint());
                s.expect([State.EXPR_I32, State.EXPR_I32]);
                break;

            // opcode + Stmt<I32> heap index + Stmt<F32> value
            case Op.F32Store:
                s.emit();
                s.expect([State.EXPR_I32, State.EXPR_F32]);
                break;

            // opcode + offset + Stmt<I32> heap index + Stmt<F32> value
            case Op.F32StoreOff:
                s.emit(s.varint());
                s.expect([State.EXPR_I32, State.EXPR_F32]);
                break;

            // opcode + Stmt<I32> heap index + Stmt<F64> value
            case Op.F64Store:
                s.emit();
                s.expect([State.EXPR_I32, State.EXPR_F64]);
                break;

            // opcode + offset + Stmt<I32> heap index + Stmt<F64> value
            case Op.F64StoreOff:
                s.emit(s.varint());
                s.expect([State.EXPR_I32, State.EXPR_F64]);
                break;

            // opcode + internal function index + argument list as Stmt<args[i] type>
            case Op.CallInt:
                temp = s.internal(s.varint()); // FunctionDeclaration
                s.emit(temp);
                var expectFromImpArgs = [];
                temp.signature.argumentTypes.forEach(function(type) {
                    expectFromImpArgs.push(stateForType(type));
                });
                s.expect(expectFromImpArgs);
                break;

            // opcode + imported function index + argument list as Stmt<args[i] type>
            case Op.CallImp:
                temp = s.import(s.varint()); // FunctionImportSignature
                s.emit(temp);
                var expectFromImpArgs = [];
                temp.signature.argumentTypes.forEach(function(type) {
                    expectFromImpArgs.push(stateForType(type));
                });
                s.expect(expectFromImpArgs);
                break;

            // opcode + function pointer table index + Stmt<I32> element index + argument list as Stmt<args[i] type>
            case Op.CallInd:
                temp = s.indirect(s.varint()); // FunctionPointerTable
                s.emit(temp);
                var expectFromIndArgs = [State.EXPR_I32];
                temp.signature.argumentTypes.forEach(function(type) {
                    expectFromIndArgs.push(stateForType(type));
                });
                s.expect(expectFromIndArgs);
                break;

            // opcode if this function's return type is Void
            // opcode + Stmt<return type> otherwise
            case Op.Ret:
                s.emit();
                temp = s.rtype();
                if (temp !== types.RType.Void)
                    s.expect(stateForType(temp));
                break;

            // opcode + count + count * Stmt
            case Op.Block:
                temp = s.varint();
                s.emit();
                var expectFromCount = [];
                for (i = 0; i < temp; ++i)
                    expectFromCount.push(State.STMT);
                s.expect(expectFromCount);
                break;

            // opcode + Stmt<I32> condition + Stmt<Void> then
            case Op.IfThen:
                s.emit();
                s.expect([State.EXPR_I32, State.STMT]);
                break;

            // opcode + Stmt<I32> condition + Stmt<Void> then + Stmt<Void> else
            case Op.IfElse:
                s.emit();
                s.expect([State.EXPR_I32, State.STMT, State.STMT]);
                break;

            // opcode + Stmt<I32> condition + Stmt<Void> body
            case Op.While:
                s.emit();
                s.expect([State.EXPR_I32, State.STMT]);
                break;

            // opcode + Stmt<void> body + Stmt<I32> condition
            case Op.Do:
                s.emit();
                s.expect([State.STMT, State.EXPR_I32]);
                break;

            // opcode + Stmt<void> body
            case Op.Label:
                s.emit();
                s.expect(State.STMT);
                break;

            // opcode
            case Op.Break:
            case Op.Continue:
                s.emit();
                break;

            // opcode + label index
            case Op.BreakLabel:
            case Op.ContinueLabel:
                s.emit(s.varint());
                break;

            // opcode + number of cases + Stmt<I32> condition + number of cases * ( SwitchCase type + respective (list of) Stmt<Void> )
            case Op.Switch:
                temp = s.varint();
                s.emit();
                var expectFromSwitch = [State.EXPR_I32];
                for (i = 0; i < temp; ++i)
                    expectFromSwitch.push(State.SWITCH);
                s.expect(expectFromSwitch);
                break;

            default:
                throw Error("illegal Stmt opcode: " + code.code);
        }
    } else {
        if (verbose >= 1)
            console.log("processing StmtWithImm:" + types.StmtWithImmNames[code.code]);
        var Op = types.StmtWithImm;
        switch (code.code) {

            // opcodeWithImm (imm=local variable index) + Stmt<local variable type>
            case Op.SetLoc:
                // Behavior.SetLoc.read(s, code.imm);
                s.emit_code(temp = s.local(code.imm));
                s.expect(stateForType(temp.type));
                break;

            // opcodeWithImm (imm=global variable index) + Stmt<global variable type>
            case Op.SetGlo:
                // Behavior.SetGlo.read(s, code.imm);
                s.emit_code(types.Stmt.SetGlo, temp = s.global(code.imm));
                s.expect(stateForType(temp.type));
                break;

            default:
                throw Error("illegal StmtWithImm opcode: " + code.code);
        }
    }
};

Reader.prototype._readSwitch = function() {
    var sw = this.stack[this.stack.length-1];
    if (!this.skipAhead && sw.code !== types.Stmt.Switch)
        throw Error("illegal state: not a switch statement: "+sw);

    var State = Reader.State;
    var s = this.readState;
    var switchType = s.u8();
    var switchOperands = [switchType];
    var expectWithinSwitch = [];
    var temp, i;
    switch (switchType) {
        case types.SwitchCase.Case0:
            switchOperands.push(s.varint_s());
            break;
        case types.SwitchCase.Case1:
            switchOperands.push(s.varint_s());
            expectWithinSwitch.push(State.STMT);
            break;
        case types.SwitchCase.CaseN:
            switchOperands.push(s.varint_s());
            temp = s.varint();
            for (i=0; i<temp; ++i)
                expectWithinSwitch.push(State.STMT);
            break;
        case types.SwitchCase.Default0:
            break;
        case types.SwitchCase.Default1:
            expectWithinSwitch.push(State.STMT);
            break;
        case types.SwitchCase.DefaultN:
            temp = s.varint();
            for (i=0; i<temp; ++i)
                expectWithinSwitch.push(State.STMT);
            break;
        default:
            throw Error("illegal switch case type: " + switchType);
    }
    s.advance();
    if (!this.skipAhead)
        Array.prototype.push.apply(sw.operands, switchOperands);
    if (expectWithinSwitch.length > 0)
        s.expect(expectWithinSwitch);
};

Reader.prototype._readExprI32 = function() {
    var s = this.readState;
    var State = Reader.State;
    var code = s.code(types.RType.I32);
    var temp, i;
    if (code.imm === null) {
        if (verbose >= 1)
            console.log("processing I32:" + types.I32Names[code.code]);
        var Op = types.I32;
        switch (code.code) {

            // opcode + value
            case Op.LitImm:
                s.emit(s.varint()|0);
                break;

            // opcode + I32 constant index
            case Op.LitPool:
                s.emit(s.const(s.varint()));
                break;

            // opcode + local variable index
            case Op.GetLoc:
                temp = s.local(s.varint());
                s.emit(temp);
                break;

            // opcode + global variable index
            case Op.GetGlo:
                temp = s.global(s.varint());
                s.emit(temp);
                break;

            // opcode + local variable index + Stmt<I32> value
            case Op.SetLoc:
                temp = s.local(s.varint());
                s.emit(temp);
                s.expect(State.EXPR_I32);
                break;

            // opcode + global variable index + Stmt<I32> value
            case Op.SetGlo:
                temp = s.global(s.varint());
                s.emit(temp);
                s.expect(State.EXPR_I32);
                break;

            // opcode + Stmt<I32> heap index
            case Op.SLoad8:
            case Op.ULoad8:
            case Op.SLoad16:
            case Op.ULoad16:
            case Op.Load32:
                s.emit();
                s.expect(State.EXPR_I32);
                break;

            // opcode + offset + Stmt<I32> heap index
            case Op.SLoadOff8:
            case Op.ULoadOff8:
            case Op.SLoadOff16:
            case Op.ULoadOff16:
            case Op.LoadOff32:
                s.emit(s.varint());
                s.expect(State.EXPR_I32);
                break;

            // opcode + Stmt<I32> heap index + Stmt<I32>
            case Op.Store8:
            case Op.Store16:
            case Op.Store32:
                s.emit();
                s.expect([State.EXPR_I32, State.EXPR_I32]);
                break;

            // opcode + offset + Stmt<I32> heap index + Stmt<I32> value
            case Op.StoreOff8:
            case Op.StoreOff16:
            case Op.StoreOff32:
                s.emit(s.varint());
                s.expect([State.EXPR_I32, State.EXPR_I32]);
                break;

            // opcode + internal function index + argument list as Stmt<args[i] type>
            case Op.CallInt:
                temp = s.internal(s.varint()); // FunctionDeclaration
                s.emit(temp);
                var expectFromArgs = [];
                temp.signature.argumentTypes.forEach(function(type) {
                    expectFromArgs.push(stateForType(type));
                });
                s.expect(expectFromArgs);
                break;

            // opcode + imported function index + argument list as Stmt<args[i] type>
            case Op.CallImp:
                temp = s.import(s.varint()); // FunctionImportSignature
                s.emit(temp);
                var expectFromArgs = [];
                temp.signature.argumentTypes.forEach(function(type) {
                    expectFromArgs.push(stateForType(type));
                });
                s.expect(expectFromArgs);
                break;

            // opcode + function pointer table index + Stmt<I32> element index + argument list as Stmt<args[i] type>
            case Op.CallInd:
                temp = s.indirect(s.varint()); // FunctionPointerTable
                s.emit(temp);
                expectFromArgs = [State.EXPR_I32];
                temp.signature.argumentTypes.forEach(function(type) {
                    expectFromArgs.push(stateForType(type));
                });
                s.expect(expectFromArgs);
                break;

            // opcode + Stmt<I32> condition + Stmt<I32> then + Stmt<I32> else
            case Op.Cond:
                s.emit();
                s.expect([State.EXPR_I32, State.EXPR_I32, State.EXPR_I32]);
                break;

            // opcode + U8 RType + Stmt<previous RType> + Stmt<I32>
            case Op.Comma:
                temp = s.u8();
                s.emit();
                s.expect([stateForType(temp), State.EXPR_I32]);
                break;

            // opcode + Stmt<F32> value
            case Op.FromF32:
                s.emit();
                s.expect(State.EXPR_F32);
                break;

            // opcode + Stmt<F64> value
            case Op.FromF64:
                s.emit();
                s.expect(State.EXPR_F64);
                break;

            // opcode + Stmt<I32> value
            case Op.Neg:
            case Op.BitNot:
            case Op.Clz:
            case Op.LogicNot:
            case Op.Abs:
                s.emit();
                s.expect(State.EXPR_I32);
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
                s.emit();
                s.expect([State.EXPR_I32, State.EXPR_I32]);
                break;

            // opcode + Stmt<F32> left + Stmt<F32> right
            case Op.EqF32:
            case Op.NEqF32:
            case Op.LeThF32:
            case Op.LeEqF32:
            case Op.GrThF32:
            case Op.GrEqF32:
                s.emit();
                s.expect([State.EXPR_F32, State.EXPR_F32]);
                break;

            // opcode + Stmt<F64> left + Stmt<F64> right
            case Op.EqF64:
            case Op.NEqF64:
            case Op.LeThF64:
            case Op.LeEqF64:
            case Op.GrThF64:
            case Op.GrEqF64:
                s.emit();
                s.expect([State.EXPR_F64, State.EXPR_F64]);
                break;

            // opcode + num args + num args * Stmt<I32>
            case Op.SMin:
            case Op.UMin:
            case Op.SMax:
            case Op.UMax:
                temp = s.varint();
                s.emit();
                var expectFromCount = [];
                for (i = 0; i < temp; ++i)
                    expectFromCount.push(State.EXPR_I32);
                s.expect(expectFromCount);
                break;

            default:
                throw Error("illegal I32 opcode: "+code.code);
        }
    } else {
        if (verbose >= 1)
            console.log("processing I32WithImm:" + types.I32WithImmNames[code.code]);

        var Op = types.I32WithImm;
        switch (code.code) {

            // opcodeWithImm (imm = value)
            case Op.LitImm:
                s.emit_code(types.I32.LitImm, code.imm|0);
                break;

            // opcodeWithImm (imm = I32 constant index)
            case Op.LitPool:
                s.emit_code(types.I32.LitPool, s.const(code.imm));
                break;

            // opcodeWithImm (imm = local variable index)
            case Op.GetLoc:
                s.emit_code(types.I32.GetLoc, s.local(code.imm));
                break;

            default:
                throw Error("illegal I32WithImm opcode: "+code.code);
        }
    }
};

Reader.prototype._readExprF32 = function() {
    var s = this.readState;
    var State = Reader.State;
    var code = s.code(types.RType.F32);

    if (verbose >= 1)
        console.log("processing F32:" + types.F32Names[code.code]);

    var temp;
    if (code.imm === null) {
        var Op = types.F32;
        switch (code.code) {

            // opcode + value
            case Op.LitImm:
                s.emit(s.f32());
                break;

            // opcode + F32 constant index
            case Op.LitPool:
                s.emit(s.const(s.varint()));
                break;

            // opcode + local variable index
            case Op.GetLoc:
                s.emit(s.local(s.varint()));
                break;

            // opcode + global variable index
            case Op.GetGlo:
                s.emit(s.global(s.varint()));
                break;

            // opcode + local variable index + Stmt<F32> value
            case Op.SetLoc:
                s.emit(s.local(s.varint()));
                s.expect(State.EXPR_F32);
                break;

            // opcode + global variable index + Stmt<F32> value
            case Op.SetGlo:
                s.emit(s.global(s.varint()));
                s.expect(State.EXPR_F32);
                break;

            // opcode + Stmt<I32> heap index
            case Op.Load:
                s.emit();
                s.expect(State.EXPR_I32);
                break;

            // opcode + offset + Stmt<I32> heap index
            case Op.LoadOff:
                s.emit(s.varint());
                s.expect(State.EXPR_I32);
                break;

            // opcode + Stmt<I32> heap index + Stmt<F32> value
            case Op.Store:
                s.emit();
                s.expect([State.EXPR_I32, State.EXPR_F32]);
                break;

            // opcode + offset + Stmt<I32> heap index + Stmt<F32> value
            case Op.StoreOff:
                s.emit(s.varint());
                s.expect([State.EXPR_I32, State.EXPR_F32]);
                break;

            // opcode + internal function index + argument list as Stmt<args[i] type>, ...
            case Op.CallInt:
                temp = s.internal(s.varint()); // FunctionDeclaration
                s.emit(temp);
                var expectFromArgs = [];
                temp.signature.argumentTypes.forEach(function(type) {
                    expectFromArgs.push(stateForType(type));
                });
                s.expect(expectFromArgs);
                break;

            // opcode + function pointer table index + Stmt<I32> element index + argument list as Stmt<args[i] type>, ...
            case Op.CallInd:
                temp = s.indirect(s.varint()); // FunctionPointerTable
                s.emit(temp);
                expectFromArgs = [State.EXPR_I32];
                temp.signature.argumentTypes.forEach(function (type) {
                    expectFromArgs.push(stateForType(type));
                });
                s.expect(expectFromArgs);
                break;

            // opcode + Stmt<I32> condition + Stmt<F32> then + Stmt<F32> else
            case Op.Cond:
                s.emit();
                s.expect([State.EXPR_I32, State.EXPR_F32, State.EXPR_F32]);
                break;

            // opcode + U8 RType + Stmt<previous RType> left + Stmt<F32> right
            case Op.Comma:
                temp = s.u8();
                s.emit();
                s.expect([stateForType(temp), State.EXPR_F32]);
                break;

            // opcode + Stmt<I32> value
            case Op.FromS32:
            case Op.FromU32:
                s.emit();
                s.expect(State.EXPR_I32);
                break;

            // opcode + Stmt<F64> value
            case Op.FromF64:
                s.emit();
                s.expect(State.EXPR_F64);
                break;

            // opcode + Stmt<F32> value
            case Op.Neg:
            case Op.Abs:
            case Op.Ceil:
            case Op.Floor:
            case Op.Sqrt:
                s.emit();
                s.expect(State.EXPR_F32);
                break;

            // opcode + Stmt<F32> left + Stmt<F32> right
            case Op.Add:
            case Op.Sub:
            case Op.Mul:
            case Op.Div:
                s.emit();
                s.expect([State.EXPR_F32, State.EXPR_F32]);
                break;

            default:
                throw Error("illegal F32 opcode: "+code.code);
        }
    } else {
        var Op = types.F32WithImm;
        switch (code.code) {

            // opcode + F32 constant index
            case Op.LitPool:
                s.emit_code(types.F32.LitPool, s.const(code.imm));
                break;

            // opcode + local variable index
            case Op.GetLoc:
                s.emit_code(types.F32.GetLoc, s.local(code.imm));
                break;

            default:
                throw Error("illegal F32WithImm opcode: "+code.code);
        }
    }
};

Reader.prototype._readExprF64 = function() {
    var s = this.readState;
    var State = Reader.State;
    var code = s.code(types.RType.F64);
    var temp, i;
    if (code.imm === null) {
        if (verbose >= 1)
            console.log("processing F64:" + types.F64Names[code.code]);

        var Op = types.F64;
        switch (code.code) {

            // opcode + value
            case Op.LitImm:
                s.emit(s.f64());
                break;

            // opcode + F64 constant index
            case Op.LitPool:
                s.emit(s.const(s.varint()));
                break;

            // opcode + local variable index
            case Op.GetLoc:
                s.emit(s.local(s.varint()));
                break;

            // opcode + global variable index
            case Op.GetGlo:
                s.emit(s.global(s.varint()));
                break;

            // opcode + local variable index + Stmt<F64> value
            case Op.SetLoc:
                s.emit(s.local(s.varint()));
                s.expect(State.EXPR_F64);
                break;

            // opcode + global variable index + Stmt<F64> value
            case Op.SetGlo:
                s.emit(s.global(s.varint()));
                s.expect(State.EXPR_F64);
                break;

            // opcode + Stmt<I32> heap index
            case Op.Load:
                s.emit();
                s.expect(State.EXPR_I32);
                break;

            // opcode + offset + Stmt<I32> heap index
            case Op.LoadOff:
                s.emit(s.varint());
                s.expect(State.EXPR_I32);
                break;

            // opcode + Stmt<I32> heap index + Stmt<F64> value
            case Op.Store:
                s.emit();
                s.expect([State.EXPR_I32, State.EXPR_F64]);
                break;

            // opcode + offset + Stmt<I32> heap index + Stmt<F64> value
            case Op.StoreOff:
                s.emit(s.varint());
                s.expect([State.EXPR_I32, State.EXPR_F64]);
                break;

            // opcode + internal function index + argument list as Stmt<args[i] type>
            case Op.CallInt:
                temp = s.internal(s.varint()); // FunctionDeclaration
                s.emit(temp);
                var expectFromArgs = [];
                temp.signature.argumentTypes.forEach(function(type) {
                    expectFromArgs.push(stateForType(type));
                });
                s.expect(expectFromArgs);
                break;

            // opcode + imported function index + argument list as Stmt<args[i] type>
            case Op.CallImp:
                temp = s.import(s.varint()); // FunctionImportSignature
                s.emit(temp);
                var expectFromArgs = [];
                temp.signature.argumentTypes.forEach(function(type) {
                    expectFromArgs.push(stateForType(type));
                });
                s.expect(expectFromArgs);
                break;

            // opcode + function pointer table index + Stmt<I32> element index + argument list as Stmt<args[i] type>
            case Op.CallInd:
                temp = s.indirect(s.varint()); // FunctionPointerTable
                s.emit(temp);
                expectFromArgs = [State.EXPR_I32];
                temp.signature.argumentTypes.forEach(function (type) {
                    expectFromArgs.push(stateForType(type));
                });
                s.expect(expectFromArgs);
                break;

            // opcode + Stmt<I32> condition + Stmt<F64> then + Stmt<F64> else
            case Op.Cond:
                s.emit();
                s.expect([State.EXPR_I32, State.EXPR_F64, State.EXPR_F64]);
                break;

            // opcode + U8 RType + Stmt<previous RType> left + Stmt<F64> right
            case Op.Comma:
                temp = s.u8();
                s.emit();
                s.expect([stateForType(temp), State.EXPR_F64]);
                break;

            // opcode + Stmt<I32> value
            case Op.FromS32:
            case Op.FromU32:
                s.emit();
                s.expect(State.EXPR_I32);
                break;

            // opcode + Stmt<F32> value
            case Op.FromF32:
                s.emit();
                s.expect(State.EXPR_F32);
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
                s.emit();
                s.expect(State.EXPR_F64);
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
                s.emit();
                s.expect([State.EXPR_F64, State.EXPR_F64]);
                break;

            // opcode + num args + num args * Stmt<F64>
            case Op.Min:
            case Op.Max:
                temp = s.varint();
                s.emit();
                var expectFromCount = [];
                for (i = 0; i < temp; ++i)
                    expectFromCount.push(State.EXPR_F64);
                s.expect(expectFromCount);
                break;

            default:
                throw Error("illegal F64 opcode: "+code.code);
        }
    } else {
        if (verbose >= 1)
            console.log("processing F64WithImm:" + types.F64WithImmNames[code.code]);

        var Op = types.F64WithImm;
        switch (code.code) {

            // opcode + F64 constant index
            case Op.LitPool:
                s.emit_code(types.F64.LitPool, s.const(code.imm));
                break;

            // opcode + local variable index
            case Op.GetLoc:
                s.emit_code(types.F64.GetLoc, s.local(code.imm));
                break;

            default:
                throw Error("illegal F64WithImm opcode: "+code.code);
        }
    }
};

Reader.prototype._readExprVoid = function() {
    var s = this.readState;
    var State = Reader.State;
    var code = s.code_u8();

    if (verbose >= 1)
        console.log("processing Void:" + types.VoidNames[code]);

    var temp;
    var Op = types.Void;
    switch (code) {

        // opcode + internal function index + argument list as Stmt<args[i] type>
        case Op.CallInt:
            temp = s.internal(s.varint()); // FunctionDeclaration
            s.emit(temp);
            var expectFromArgs = [];
            temp.signature.argumentTypes.forEach(function(type) {
                expectFromArgs.push(stateForType(type));
            });
            s.expect(expectFromArgs);
            break;

        // opcode + imported function index + argument list as Stmt<args[i] type>
        case Op.CallImp:
            temp = s.import(s.varint()); // FunctionImportSignature
            s.emit(temp);
            var expectFromArgs = [];
            temp.signature.argumentTypes.forEach(function(type) {
                expectFromArgs.push(stateForType(type));
            });
            s.expect(expectFromArgs);
            break;

        // opcode + function pointer table index + Stmt<I32> element index + argument list as Stmt<args[i] type>
        case types.Void.CallInd:
            temp = s.indirect(s.varint()); // FunctionPointerTable
            s.emit(temp);
            var expectFromArgs = [State.EXPR_I32];
            temp.signature.argumentTypes.forEach(function(type) {
                expectFromArgs.push(stateForType(type));
            });
            s.expect(expectFromArgs);
            break;

        default:
            throw Error("illegal Void opcode: "+code);
    }
};

/**
 * Inspects a statement structure.
 * @param {!stmt.BaseStmt|!stmt.StmtList|number} stmt
 * @param {number=} depth
 * @returns {string}
 * @inner
 */
function inspect(stmt, depth) {
    depth = depth || 0;
    var indent = "";
    for (var i=0; i<depth; ++i)
        indent += "  ";
    if (typeof stmt === 'number')
        return indent + stmt.toString(10);
    if ((stmt instanceof LocalVariable) || (stmt instanceof GlobalVariable)
     || (stmt instanceof FunctionDeclaration) || (stmt instanceof FunctionPointerTable))
        return indent+stmt.name;
    if (stmt instanceof FunctionImportSignature)
        return indent+"foreign."+stmt.import.name;
    if (stmt instanceof Constant)
        return indent+stmt.value;
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
Reader.prototype.inspect = function() {
    var sb = [];
    sb.push("AstReader debug\n---------------\n");
    sb.push("Global offset: ", this.definition.byteOffset.toString(16), "\n");
    sb.push("Function index: ", this.declaration.index.toString(10), "\n");
    sb.push("Stack size: ", this.stack.length.toString(10), "\n");
    sb.push("State size: "+this.state.length.toString(10), "\n\n");
    sb.push(this.assembly.toString(), "\n\n");
    sb.push(this.definition.header(), "\n");
    if (!this.skipAhead)
        sb.push(inspect(this.stack[0]));
    return sb.join("");
};

/**
 * @param {string} type
 * @param {*} a
 * @param {*} b
 * @param {*} c
 * @override
 */
Reader.prototype.emit = function(type, a, b, c) {
    var handler = this._events[type];
    if (typeof handler === 'undefined')
        return;
    if (typeof handler === 'function')
        handler.call(this, a, b, c);
    else for (var i=0, k=handler.length; i<k; ++i)
        handler[i].call(this, a, b, c);
};
