var types = require("../types");

/**
 * Abstract base class of all statements.
 * @constructor
 * @param {number} code
 * @param {(number|!BaseStmt|!Array<number|!BaseStmt>)=} operands
 * @abstract
 */
var BaseStmt = module.exports = function(code, operands) {

    /**
     * OpCode.
     * @type {number}
     */
    this.code = code;

    /**
     * Operands.
     * @type {!Array.<number|!BaseStmt>}
     */
    this.operands = Array.isArray(operands)
        ? operands
        : typeof operands !== 'undefined'
            ? [operands]
            : [];
};

/**
 * Gets the literal opcode name.
 * @name BaseStmt#name
 * @type {string|undefined}
 */
Object.defineProperty(BaseStmt.prototype, "name", {
    get: function() {
        if (this instanceof require("./Stmt"))
            return types.StmtNames[this.code];
        else if (this instanceof require("./BaseTypedStmt"))
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
