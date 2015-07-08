var stream = require("stream"),
    assert = require("assert"),
    types = require("../types"),
    util = require("../util");

var WriteState = require("./WriteState");

/**
 * An abstract syntax tree writer.
 * @param {!reflect.FunctionDefinition} functionDefinition
 * @param {!util.BufferQueue=} bufferQueue
 * @param {!Object.<string,*>=} options
 * @constructor
 * @extends stream.Readable
 * @exports ast.Writer
 */
function Writer(functionDefinition, bufferQueue, options) {
    if (!functionDefinition.ast)
        throw Error("definition does not contain an AST");

    stream.Readable.call(this, options);

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
    this.declaration = this.definition.declaration;

    /**
     * Function signature.
     * @type {!reflect.FunctionSignature}
     */
    this.signature = this.declaration.signature;

    /**
     * Assembly reference.
     * @type {!reflect.Assembly}
     */
    this.assembly = this.declaration.assembly;

    /**
     * Writer buffer queue.
     * @type {!util.BufferQueue}
     */
    this.bufferQueue = bufferQueue || new util.BufferQueue();

    /**
     * AST pointer.
     * @type {!stmt.StmtList|stmt.BaseStmt}
     */
    this.ptr = functionDefinition.ast;

    /**
     * AST sequence.
     * @type {number}
     */
    this.sequence = 0;

    /**
     * Write state.
     * @type {!ast.WriteState}
     */
    this.writeState = new WriteState(this);

    this.pause();
}

module.exports = Writer;

// Extends Readable
Writer.prototype = Object.create(stream.Readable.prototype);

/**
 * States.
 * @type {!Object.<string,number>}
 * @const
 */
Writer.State = {
    STMT_LIST: 0,
    STMT: 1,
    EXPR_I32: 2,
    EXPR_F32: 3,
    EXPR_F64: 4,
    EXPR_VOID: 5,
    SWITCH: 6,
    END: 7,
    ERROR: 8
};

Writer.prototype._read = function(size) {
    if (this.states.length === 0)
        throw Error("already done");
    while (size > 0) {
        var initialState = this.state,
            len = 0;
        try {
            switch (this.state) {
                case Writer.State.STMT_LIST:
                    len += this._writeStmtList();
                    break;
                case Writer.State.STMT:
                    len += this._writeStmt();
                    break;
                case Writer.State.EXPR_I32:
                    len += this._writeExprI32();
                    break;
                case Writer.State.EXPR_F32:
                    len += this._writeExprF32();
                    break;
                case Writer.State.EXPR_F64:
                    len += this._writeExprF64();
                    break;
                case Writer.State.EXPR_VOID:
                    len += this._writeExprVoid();
                    break;
                case Writer.State.SWITCHCASE:
                    len += this._writeSwitch();
                    break;
                case Writer.State.END:
                case Writer.State.ERROR:
                    this.push(null);
                    return;
                default:
                    throw Error("illegal state: " + this.state);
            }
            this.offset += len;
            size -= len;
        } catch (err) {
            this.emit("error", err);
            this.state = Writer.State.ERROR;
        }
        if (this.state !== initialState)
            this.emit("switchState", this.state, initialState, this.offset);
    }
};

Writer.prototype._writeStmtList = function() {
    var stmtList = this.stack.pop();
    var buf = new Buffer(util.calculateVarint(stmtList.length));
    var offset = util.writeVarint(buf, stmtList.length, 0);
    assert.strictEqual(offset, buf.length, "offset mismatch");
    stmtList.forEach(function(stmt) {
        this.stack.unshift(stmt);
        this.states.unshift(Writer.State.STMT);
    }, this);
    this.push(buf);
    return buf.length;
};

/* Writer.prototype._writeStmt = function() {
    var stmt = this.stack.pop();
    this.writeState.init(stmt);
    stmt.behavior.write(this.writeState, stmt);
}; */

Writer.prototype._writeStmt = function() {
    var stmt = this.stack.pop();
    var s = this.writeState;
    var State = Writer.State;
    var Op = types.Stmt;
    var temp;
    switch (stmt.code) {
        // Stmt + LocalVariable
        case Op.SetLoc:

        // Stmt + GlobalVariable
        case Op.SetGlo:
            temp = stmt.operands[0];
            if (temp.index <= types.ImmMax) {
                s.emit_code(stmt.codeWithImm, temp.index);
            } else {
                s.emit();
                s.varint(temp.index);
            }
            break;

        // Stmt + ExprI32 heap index + ExprI32 value
        case Op.I32Store8:
        case Op.I32Store16:
        case Op.I32Store32:
            s.emit();
            s.expect([State.EXPR_I32, State.EXPR_I32]);
            break;

        // Stmt + offset + ExprI32 heap index + ExprI32 value
        case Op.I32StoreOff8:
        case Op.I32StoreOff16:
        case Op.I32StoreOff32:
            s.emit();
            s.varint();
            s.expect([State.EXPR_I32, State.EXPR_I32]);
            break;

        // Stmt + ExprI32 heap index + ExprF32 value
        case Op.F32Store:
            s.emit();
            s.expect([State.EXPR_I32, State.EXPR_F32]);
            break;

        // opcode + offset + Stmt<I32> heap index + Stmt<F32> value
        case Op.F32StoreOff:
            s.emit();
            s.varint();
            s.expect([State.EXPR_I32, State.EXPR_F32]);
            break;

    }
};

/* Writer.prototype._writeExprI32 = function() {
    var expr = this.stack.pop();

    switch (expr.code) {
        case types.I32.LitImm:
    }

        typeWithImm = expr.typeWithImm,
        firstOperand = expr.operands[0],
        buf;
    if (typeof typeWithImm !== 'undefined' && firstOperand <= types.ImmMax) {
        buf = new Buffer(1);
        buf[0] = util.packWithImm(typeWithImm, firstOperand);
    } else if (typeof firstOperand === 'number') {

    }
    this.push(buf);
    return buf.length;
};
 */