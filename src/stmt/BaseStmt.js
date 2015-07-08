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
     * Parent statement or list.
     * @type {!stmt.BaseStmt|!stmt.StmtList|null}
     */
    this.parent = null;

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
        ? operands.slice()
        : typeof operands !== 'undefined'
            ? [operands]
            : [];

    /**
     * Whether this statement's opcode was originally packed with an imm.
     * @type {boolean}
     * @see {@link ast.Writer#preserveWithImm}
     */
    this.withImm = false;
}

module.exports = BaseStmt;

// Extends BaseOperand
BaseStmt.prototype = Object.create(BaseOperand.prototype);

/**
 * Wire type.
 * @name stmt.BaseExpr#type
 * @type {number}
 * @see {@link types.WireType}
 */

/**
 * Opcode with imm, if any.
 * @name stmt.BaseStmt#codeWithImm
 * @type {number} -1 if there is no counterpart
 */

/**
 * Behavior.
 * @name stmt.BaseStmt#behavior
 * @type {!stmt.behavior.Behavior}
 */

/**
 * Gets the literal opcode name.
 * @name stmt.BaseStmt#name
 * @type {string}
 */
Object.defineProperty(BaseStmt.prototype, "name", {
    get: function() {
        switch (this.type) {
            case types.WireType.Stmt:
                return "Stmt:"+types.StmtNames[this.code];
            case types.WireType.ExprI32:
                return "I32:"+types.I32Names[this.code];
            case types.WireType.ExprF32:
                return "F32:"+types.F32Names[this.code];
            case types.WireType.ExprF64:
                return "F64:"+types.F64Names[this.code];
            case types.WireType.ExprVoid:
                return "Void:"+types.VoidNames[this.code];
            case types.WireType.SwitchCase:
                return "SwitchCase:"+types.SwitchCaseNames[this.code];
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
    if (operand instanceof BaseStmt)
        operand.parent = this;
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
        for (var i= 0, operand; i<this.operands.length; ++i) {
            operand = this.operands[i];
            sb.push(" ");
            if (operand instanceof BaseStmt)
                sb.push(operand.toString(true));
            else
                sb.push(operand.toString());
        }
    return sb.join("");
};
