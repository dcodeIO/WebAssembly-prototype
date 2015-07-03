var types = require("../types");

var BaseOperand = require("./BaseOperand");

/**
 * Abstract base class of all statements.
 * @constructor
 * @param {number} code
 * @param {!Array.<number|stmt.!BaseOperand>|number|!stmt.BaseOperand} operands
 * @abstract
 * @extends stmt.BaseOperand
 * @exports stmt.BaseStmt
 */
function BaseStmt(code, operands) {
    BaseOperand.call(this);

    /**
     * Opcode.
     * @type {number}
     */
    this.code = code;

    /**
     * Operands.
     * @type {!Array.<number|!stmt.BaseOperand>}
     */
    this.operands = Array.isArray(operands)
        ? operands
        : typeof operands !== 'undefined'
            ? [operands]
            : [];
}

module.exports = BaseStmt;

// Extends BaseOperand
BaseStmt.prototype = Object.create(BaseOperand.prototype);

/**
 * Statement type.
 * @name stmt.BaseStmt#type
 * @type {number|undefined}
 */

/**
 * Gets the literal opcode name.
 * @name stmt.BaseStmt#name
 * @type {string|undefined}
 */
Object.defineProperty(BaseStmt.prototype, "name", {
    get: function() {
        if (this.type === undefined)
            return "Stmt:"+types.StmtNames[this.code];
        switch (this.type) {
            case types.RType.I32:
                return "I32:"+types.I32Names[this.code];
            case types.RType.F32:
                return "F32:"+types.F32Names[this.code];
            case types.RType.F64:
                return "F64:"+types.F64Names[this.code];
            case types.RType.Void:
                return "Void:"+types.VoidNames[this.code];
            default:
                throw Error("illegal statement type: "+this.type);
        }
    }
});

/**
 * Adds another operand.
 * @param {number|!stmt.BaseOperand} operand
 */
BaseStmt.prototype.add = function(operand) {
    this.operands.push(operand);
};

/**
 * Returns a string representation of this statement.
 * @param {boolean=} shortFormat
 * @returns {string}
 */
BaseStmt.prototype.toString = function(shortFormat) {
    var sb = [];
    sb.push(this.name);
    if (shortFormat)
        sb.push("+", this.operands.length.toString());
    else
        for (var i=0; i<this.operands.length; ++i) {
            sb.push(" ");
            if (this.operands[i] instanceof BaseStmt)
                sb.push(this.operands[i].toString(true));
            else
                sb.push(this.operands[i].toString());
        }
    return sb.join("");
};
