var types = require("../types"),
    BaseStmt = require("./BaseStmt");

/**
 * A void expression.
 * @constructor
 * @param {number} code
 * @param {(!Array.<number|!stmt.BaseOperand>|number|!stmt.BaseOperand)=} operands
 * @constructor
 * @extends BaseStmt
 * @exports stmt.VoidStmt
 */
function ExprVoid(code, operands) {
    BaseStmt.call(this, code, operands);
}

module.exports = ExprVoid;

ExprVoid.prototype = Object.create(BaseStmt.prototype);

Object.defineProperty(ExprVoid.prototype, "type", {
    get: function() {
        return this.types.RType.Void;
    }
});
