var types = require("../types"),
    BaseExpr = require("./BaseExpr");

/**
 * A F64 expression.
 * @constructor
 * @param {number} code
 * @param {(!Array.<number|!stmt.BaseOperand>|number|!stmt.BaseOperand)=} operands
 * @constructor
 * @extends BaseExpr
 * @exports stmt.F64Stmt
 */
function ExprF64(code, operands) {
    BaseExpr.call(this, code, operands);
}

module.exports = ExprF64;

ExprF64.prototype = Object.create(BaseExpr.prototype);

Object.defineProperty(ExprF64.prototype, "type", {
    get: function() {
        return this.types.RType.F64;
    }
});

Object.defineProperty(ExprF64.prototype, "codeWithImm", {
    get: function() {
        switch (this.code) {
            case types.F64.LitPool:
                return types.F64WithImm.LitPool;
            case types.F64.GetLoc:
                return types.F64WithImm.GetLoc;
            default:
                return -1;
        }
    }
});
