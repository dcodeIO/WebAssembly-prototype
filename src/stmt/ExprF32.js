var types = require("../types"),
    BaseExpr = require("./BaseExpr");

/**
 * A F32 expression.
 * @constructor
 * @param {number} code
 * @param {(!Array.<number|!stmt.BaseOperand>|number|!stmt.BaseOperand)=} operands
 * @constructor
 * @extends BaseExpr
 * @exports stmt.F32Stmt
 */
function ExprF32(code, operands) {
    BaseExpr.call(this, code, operands);
}

module.exports = ExprF32;

ExprF32.prototype = Object.create(BaseExpr.prototype);

Object.defineProperty(ExprF32.prototype, "type", {
    get: function() {
        return this.types.RType.F32;
    }
});

Object.defineProperty(ExprF32.prototype, "codeWithImm", {
    get: function() {
        switch (this.code) {
            case types.F32.LitPool:
                return types.F32WithImm.LitPool;
            case types.F32.GetLoc:
                return types.F32WithImm.GetLoc;
            default:
                return -1;
        }
    }
});
