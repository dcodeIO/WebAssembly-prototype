var util = require("../util"),
    types = require("../types");

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
     * @private
     */
    this.writer = writer;

    /**
     * Current statement.
     * @type {!BaseStmt|undefined}
     * @private
     */
    this._stmt = undefined;

    /**
     * Stack from the current operation.
     * @type {!Array.<!stmt.BaseStmt>}
     * @private
     */
    this._stack = [];
}

module.exports = WriteState;

WriteState.prototype.prepare = function(stmt) {
    this._stmt = stmt;
    this._states = [];
};

WriteState.prototype.commit = function() {
    for (var i=this._stack.length-1; i>=0; --i)
        this.writer.stack.push(this._stack[i]);
};

WriteState.prototype.reset = function() {
    this._stmt = undefined;
    this._states = [];
};

WriteState.prototype.rtype = function() {
    return this.writer.definition.signature.returnType;
};

WriteState.prototype.u8 = function(b) {
    this.writer.bufferQueue.writeUInt8(b);
};

WriteState.prototype.code = function(code) {
    this.writer.bufferQueue.writeUInt8(code);
};

WriteState.prototype.codeWithImm = function(code, imm) {
    if (imm < 0 || imm > types.ImmMax || (code = types.codeWithImm(this._type, code)) < 0)
        return false;
    this.writer.bufferQueue.writeUInt8(util.packWithImm(code, imm));
};

WriteState.prototype.varint = function(value) {
    this.writer.bufferQueue.writeVarint(value);
};

WriteState.prototype.f32 = function(value) {
    this.writer.bufferQueue.writeFloatLE(value);
};

WriteState.prototype.f64 = function(value) {
    this.writer.bufferQueue.writeDoubleLE(value);
};

WriteState.prototype.write = function(stmt) {
    this._stack.push(stmt);
};

WriteState.prototype.write_case = function(switchCase) {
    this._stack.push(switchCase);
};
