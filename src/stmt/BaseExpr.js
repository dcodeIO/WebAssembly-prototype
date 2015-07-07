var BaseStmt = require("./BaseStmt");

/**
 * Abstract base class of all expression statements.
 * @constructor
 * @param {number} code
 * @param {!Array.<number|stmt.!BaseOperand>|number|!stmt.BaseOperand} operands
 * @abstract
 * @extends stmt.BaseStmt
 * @exports stmt.BaseExpr
 */
function BaseExpr(code, operands) {
    BaseStmt.call(this, code, operands);
}

module.exports = BaseExpr;

BaseExpr.prototype = Object.create(BaseStmt.prototype);
