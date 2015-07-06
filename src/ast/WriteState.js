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
     * Current statement.
     * @type {!BaseStmt|undefined}
     */
    this._stmt = undefined;

    /**
     * Current opcode.
     * @type {number}
     */
    this._code = -1;
}

module.exports = WriteState;

WriteState.prototype.init = function(stmt) {
    this._stmt = stmt;
    this._code = stmt.code;
};

WriteState.prototype.emit_code = function(op, imm) {
    this.writer.bufferQueue
        .writeUInt8(typeof imm !== 'undefined' ? util.packWithImm(op, imm) : op)
        .commit();
};

WriteState.prototype.emit = function() {
    this.emit_code(this._code);
};

WriteState.prototype.varint = function() {

};