var types = require("../types"),
    util = require("../util");

var ExprI32 = require("../stmt/ExprI32"),
    ExprF32 = require("../stmt/ExprF32"),
    ExprF64 = require("../stmt/ExprF64"),
    ExprVoid = require("../stmt/ExprVoid"),
    SwitchCase = require("../stmt/SwitchCase"),
    Stmt = require("../stmt/Stmt");

/**
 * AST read state.
 * @constructor
 * @param {!ast.Reader} reader
 * @param {number} popState
 * @exports ast.ReadState
 */
function ReadState(reader, popState) {

    /**
     * Reader reference.
     * @type {!ast.Reader}
     */
    this.reader = reader;

    /**
     * Pop state.
     * @type {number}
     */
    this.popState = popState;

    /**
     * Current type.
     * @type {number|undefined}
     * @private
     */
    this._type = undefined;

    /**
     * Current statement.
     * @type {!stmt.BaseStmt|undefined}
     * @private
     */
    this._stmt = undefined;

    /**
     * States derived from the current operation.
     * @type {!Array.<number>}
     * @private
     */
    this._states = [];
}

module.exports = ReadState;

var Reader = require("./Reader"); // cyclic

/**
 * Prepares for the next read operation.
 * @param {number} type Wire type
 */
ReadState.prototype.prepare = function(type) {
    this._type = type;
    this._stmt = undefined;
    this._states = [];
};

/**
 * Commits the current read operation.
 */
ReadState.prototype.commit = function() {
    this.reader.bufferQueue.advance();
    var parent = this.reader.stack[this.reader.stack.length-1];
    parent.add(this._stmt);
    if (this._states.length > 0) {
        if (!this.reader.skipAhead) {
            this.reader.stack.push(this._stmt);
            this.reader.state.push(this.popState);
        }
        for (var i=this._states.length-1; i>=0; --i)
            this.reader.state.push(this._states[i]);
    }
    this.reset();
};

/**
 * Resets the internal state.
 */
ReadState.prototype.reset = function() {
    this._type = this._stmt = undefined;
    this._states = [];
    this.reader.bufferQueue.reset();
};

/**
 * Gets the current function's return type.
 * @returns {number}
 */
ReadState.prototype.rtype = function() {
    return this.reader.signature.returnType;
};

/**
 * Reads the next unsigned byte.
 * @returns {number}
 */
ReadState.prototype.u8 = function() {
    return this.reader.bufferQueue.readUInt8();
};

/**
 * Reads the next unsigned varint.
 * @returns {number}
 */
ReadState.prototype.varint = function() {
    return this.reader.bufferQueue.readVarint();
};

/**
 * Reads the next signed varint.
 * @returns {number}
 */
ReadState.prototype.varint_s = function() {
    return this.reader.bufferQueue.readVarintSigned();
};

/**
 * Reads the next 32bit float.
 * @returns {number}
 */
ReadState.prototype.f32 = function() {
    return this.reader.bufferQueue.readFloatLE();
};

/**
 * Reads the next 64bit double.
 * @returns {number}
 */
ReadState.prototype.f64 = function() {
    return this.reader.bufferQueue.readDoubleLE();
};

/**
 * Creates a statement or expression with the specified code.
 * @param {number} code
 * @param {(number|!stmt.BaseOperand|!Array.<number|!stmt.BaseOperand>)=} operands
 * @returns {!stmt.BaseStmt|undefined}
 */
ReadState.prototype.stmt = function(code, operands) {
    if (this.reader.skipAhead)
        return;
    switch (this._type) {
        case types.WireType.ExprI32:
            this._stmt = new ExprI32(code, operands);
            break;
        case types.WireType.ExprF32:
            this._stmt = new ExprF32(code, operands);
            break;
        case types.WireType.ExprF64:
            this._stmt = new ExprF64(code, operands);
            break;
        case types.WireType.ExprVoid:
            this._stmt = new ExprVoid(code, operands);
            break;
        case types.WireType.SwitchCase:
            this._stmt = new SwitchCase(code, operands);
            break;
        case types.WireType.Stmt:
            this._stmt = new Stmt(code, operands);
            break;
        default:
            throw Error("illegal WireType: "+this._type);

    }
    return this._stmt;
};

/**
 * Creates a statement or expression with the specified code, converted to its counterpart without imm.
 * @param {number} code
 * @param {(number|!stmt.BaseOperand|!Array.<number|!stmt.BaseOperand>)=} operands
 * @returns {!stmt.BaseStmt|boolean} `false` if there is no counterpart without imm
 */
ReadState.prototype.stmtWithoutImm = function(code, operands) {
    if ((code = types.codeWithoutImm(this._type, code)) < 0)
        throw Error("cannot convert "+types.WireTypeNames[this._type]+" code to non-imm counterpart: "+code);
    return this.stmt(code, operands);
};

/**
 * Prepares to read the next statement or expression.
 * @param {number} wireType
 */
ReadState.prototype.read = function(wireType) {
    if (wireType === undefined)
        throw Error("meh");
    this._states.push(wireType);
};

/**
 * Gets the constant of matching type at the specified index.
 * @param {number} index
 * @returns {!reflect.Constant}
 */
ReadState.prototype.constant = function(index) {
    return this.reader.assembly.getConstant(this._type, index);
};

/**
 * Gets the local variable at the specified index.
 * @param {number} index
 * @param {number=} type
 * @returns {!reflect.LocalVariable}
 */
ReadState.prototype.local = function(index, type) {
    var variable = this.reader.definition.getVariable(index);
    if (typeof type !== 'undefined' && variable.type !== type)
        throw Error("illegal local variable type: "+variable.type+" != "+type);
    return variable;
};

/**
 * Gets the global variable at the specified index.
 * @param {number} index
 * @param {number=} type
 * @returns {!reflect.GlobalVariable}
 */
ReadState.prototype.global = function(index, type) {
    var variable = this.reader.assembly.getGlobalVariable(index);
    if (typeof type !== 'undefined' && variable.type !== type)
        throw Error("illegal global variable type: "+variable.type+" != "+type);
    return variable;
};

/**
 * Gets the function declaration at the specified index.
 * @param {number} index
 * @returns {!reflect.FunctionDeclaration}
 */
ReadState.prototype.internal = function(index) {
    return this.reader.assembly.getFunctionDeclaration(index);
};

/**
 * Gets the function pointer table at the specified index.
 * @param {number} index
 * @returns {!reflect.FunctionPointerTable}
 */
ReadState.prototype.indirect = function(index) {
    return this.reader.assembly.getFunctionPointerTable(index);
};

/**
 * Gets the function import signature at the specified index.
 * @param {number} index
 * @returns {!reflect.FunctionImportSignature}
 */
ReadState.prototype.import = function(index) {
    return this.reader.assembly.getFunctionImportSignature(index);
};

/**
 * Advances the buffer queue.
 */
ReadState.prototype.advance = function() {
    this.reader.bufferQueue.advance();
};

/**
 * Finishes the read state.
 */
ReadState.prototype.finish = function() {
    this.reset();
    this.reader = null;
};
