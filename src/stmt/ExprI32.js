var types = require("../types"),
    BaseExpr = require("./BaseExpr");

/**
 * An I32 expression.
 * @constructor
 * @param {number} code
 * @param {(!Array.<number|!stmt.BaseOperand>|number|!stmt.BaseOperand)=} operands
 * @constructor
 * @extends BaseExpr
 * @exports stmt.I32Stmt
 */
function ExprI32(code, operands) {
    BaseExpr.call(this, code, operands);
}

module.exports = ExprI32;

ExprI32.prototype = Object.create(BaseExpr.prototype);

Object.defineProperty(ExprI32.prototype, "type", {
    get: function() {
        return this.types.RType.I32;
    }
});

Object.defineProperty(ExprI32.prototype, "codeWithImm", {
    get: function() {
        switch (this.code) {
            case types.I32.LitPool:
                return types.I32WithImm.LitPool;
            case types.I32.LitImm:
                return types.I32WithImm.LitImm;
            case types.I32.GetLoc:
                return types.I32WithImm.GetLoc;
            default:
                return -1;
        }
    }
});
