var util = require("../util");

/**
 * AST write state.
 * @param {!ast.Writer} writer
 * @constructor
 * @exports ast.WriteState
 */
function WriteState(writer) {

    /**
     * Writer reference.
     * @type {!ast.Writer}
     */
    this.writer = writer;

    /**
     * Current type.
     * @type {number|null|undefined}
     */
    this._type = undefined;

    /**
     * Current opcode.
     * @type {number}
     */
    this._code = -1;

    /**
     * Current statement.
     * @type {!BaseStmt|undefined}
     */
    this._stmt = undefined;
}

module.exports = WriteState;

WriteState.prototype.init = function(stmt) {
    this._stmt = stmt;
    this._type = stmt.type;
    this._code = stmt.code;
};

WriteState.prototype.rtype = function() {
    return this.writer.definition.signature.returnType;
};

WriteState.prototype.code = function(op, imm) {
    this.writer.bufferQueue.writeUInt8(typeof imm !== 'undefined' ? util.packWithImm(op, imm) : op);
};

WriteState.prototype.varint = function(value) {
    this.writer.bufferQueue.writeVarint(value);
};

WriteState.prototype.expect = function(states) {
    /* if (typeof states === 'number') {
        if (this._stmt) {
            this.writer.stack.push(this._stmt);
            this.writer.state.push(this.popState);
        }
        this.reader.state.push(states);
    } else {
        if (states.length === 0)
            return;
        if (this._stmt && !this.reader.skipAhead) {
            this.reader.stack.push(this._stmt);
            this.reader.state.push(this.popState);
        }
        for (var i=states.length-1; i>=0; --i)
            this.reader.state.push(states[i]);
    } */
};