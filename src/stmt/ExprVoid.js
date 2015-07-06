var types = require("../types"),
    BaseExpr = require("./BaseExpr");

/**
 * A void expression.
 * @constructor
 * @param {number} code
 * @param {(!Array.<number|!stmt.BaseOperand>|number|!stmt.BaseOperand)=} operands
 * @constructor
 * @extends BaseExpr
 * @exports stmt.VoidStmt
 */
function ExprVoid(code, operands) {
    BaseExpr.call(this, code, operands);
}

module.exports = ExprVoid;

ExprVoid.prototype = Object.create(BaseExpr.prototype);

Object.defineProperty(ExprVoid.prototype, "type", {
    get: function() {
        return this.types.RType.Void;
    }
});

Object.defineProperty(ExprVoid.prototype, "codeWithImm", {
    get: function() {
        return -1;
    }
});
