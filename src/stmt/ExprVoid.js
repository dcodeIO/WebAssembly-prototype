var types = require("../types"),
    BaseExpr = require("./BaseExpr"),
    behavior = require("./behavior");

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

Object.defineProperty(ExprVoid.prototype, "behavior", {
    get: function() {
        var Op = types.Void;
        switch (this.code) {
            case Op.CallInt:
                return behavior.CallInternalVoid;
            case Op.CallImp:
                return behavior.CallImportVoid;
            case Op.CallInd:
                return behavior.CallIndirectVoid;
            default:
                throw Error("illegal Void opcode: "+this.code);
        }
    }
});
