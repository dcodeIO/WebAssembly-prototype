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
     * Current wire type.
     * @type {number|undefined}
     * @private
     */
    this._type = undefined;

    /**
     * Current statement.
     * @type {!BaseStmt|undefined}
     * @private
     */
    this._stmt = undefined;

    /**
     * Stack derived from the current operation.
     * @type {!Array.<!stmt.BaseStmt>}
     * @private
     */
    this._stack = [];
}

module.exports = WriteState;

WriteState.prototype.prepare = function(type, stmt) {
    this._type = type;
    this._stmt = stmt;
    this._stack = [];
};

WriteState.prototype.commit = function() {
    this.writer.bufferQueue.commit();
    for (var i=this._stack.length-1; i>=0; --i)
        this.writer.stack.push(this._stack[i]);
    this.reset();
};

WriteState.prototype.reset = function() {
    this._type = this._stmt = undefined;
    this._stack = [];
};

WriteState.prototype.rtype = function() {
    return this.writer.signature.returnType;
};

WriteState.prototype.u8 = function(b) {
    this.writer.bufferQueue.writeUInt8(b);
};

WriteState.prototype.code = function(code) {
    this.writer.bufferQueue.writeUInt8(code);
};

WriteState.prototype.codeWithImm = function(code, imm) {
    if (imm < 0 || imm > types.OpWithImm_ImmMax || (code = types.codeWithImm(this._type, code)) < 0)
        return false;
    if (this.writer.preserveWithImm && !this._stmt.withImm)
        return false;
    this.writer.bufferQueue.writeUInt8(util.packWithImm(code, imm));
    return true;
};

WriteState.prototype.varint = function(value) {
    this.writer.bufferQueue.writeVarint(value);
};

WriteState.prototype.varint_s = function(value) {
    this.writer.bufferQueue.writeVarintSigned(value);
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
