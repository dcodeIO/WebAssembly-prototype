var types = require("./types");

/**
 * Abstract base class of all statements.
 * @function
 * @param {number} code
 * @param {(number|!BaseStmt|!Array<number|!BaseStmt>)=} operands
 * @abstract
 */
var BaseStmt = function(code, operands) {
    /**
     * OpCode.
     * @type {number}
     */
    this.code = code;

    /**
     * Operands.
     * @type {!Array.<number|!BaseStmt>}
     */
    this.operands = Array.isArray(operands) ? operands : typeof operands !== 'undefined' ? [operands] : [];
};

/**
 * Adds another operand.
 * @param {number|!BaseStmt} operand
 */
BaseStmt.prototype.add = function(operand) {
    this.operands.push(operand);
};

/**
 * Gets the literal opcode name.
 * @name BaseStmt#name
 * @type {string|undefined}
 */
Object.defineProperty(BaseStmt.prototype, "name", {
    get: function() {
        if (this instanceof Stmt)
            return types.StmtNames[this.code];
        else if (this instanceof BaseTypedStmt)
            switch (this.type) {
                case types.Type.I32:
                    return types.I32Names[this.code];
                case types.Type.F32:
                    return types.F32Names[this.code];
                case types.Type.F64:
                    return types.F64Names[this.code];
            }
    }
});

/**
 * A (non-typed) statement.
 * @param {number} code
 * @param {(number|!BaseStmt|!Array<number|!BaseStmt>)=} operands
 * @constructor
 * @extends BaseStmt
 */
var Stmt = function(code, operands) {
    BaseStmt.call(this, code, operands);
};
Stmt.prototype = Object.create(BaseStmt.prototype);

/**
 * Abstract base class of all typed statements.
 * @param {number} type
 * @param {number} code
 * @param {(number|!BaseStmt|!Array<number|!BaseStmt>)=} operands
 * @constructor
 * @extends BaseStmt
 * @abstract
 */
var BaseTypedStmt = function(type, code, operands) {
    BaseStmt.call(this, code, operands);

    /**
     * Statement type.
     * @type {number}
     */
    this.type = type;
};
BaseTypedStmt.prototype = Object.create(BaseStmt.prototype);

/**
 * A typed I32 statement.
 * @param {number} code
 * @param {(number|!BaseStmt|!Array<number|!BaseStmt>)=} operands
 * @constructor
 * @extends BaseTypedStmt
 */
var I32Stmt = function(code, operands) {
    BaseTypedStmt.call(this, types.Type.I32, code, operands);
};
I32Stmt.prototype = Object.create(BaseTypedStmt.prototype);

/**
 * A typed F32 statement.
 * @param {number} code
 * @param {(number|!BaseStmt|!Array<number|!BaseStmt>)=} operands
 * @constructor
 * @extends BaseTypedStmt
 */
var F32Stmt = function(code, operands) {
    BaseTypedStmt.call(this, types.Type.F32, code, operands);
};
F32Stmt.prototype = Object.create(BaseTypedStmt.prototype);

/**
 * A typed F64 statement.
 * @param {number} code
 * @param {(number|!BaseStmt|!Array<number|!BaseStmt>)=} operands
 * @constructor
 * @extends BaseTypedStmt
 */
var F64Stmt = function(code, operands) {
    BaseTypedStmt.call(this, types.Type.F64,code, operands);
};
F64Stmt.prototype = Object.create(BaseTypedStmt.prototype);

module.exports = {

    BaseStmt: BaseStmt,
    BaseTypedStmt: BaseTypedStmt,

    Stmt: Stmt,
    I32Stmt: I32Stmt,
    F32Stmt: F32Stmt,
    F64Stmt: F64Stmt

};
