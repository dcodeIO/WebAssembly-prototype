var types = require("../types"),
    BaseExpr = require("./BaseExpr"),
    behavior = require("./behavior");

/**
 * A void expression.
 * @constructor
 * @param {number} code
 * @param {(!Array.<number|!stmt.BaseOperand>|number|!stmt.BaseOperand)=} operands
 * @constructor
 * @extends stmt.BaseExpr
 * @exports stmt.VoidStmt
 */
function ExprVoid(code, operands) {
    BaseExpr.call(this, code, operands);
}

module.exports = ExprVoid;

ExprVoid.prototype = Object.create(BaseExpr.prototype);

Object.defineProperty(ExprVoid.prototype, "type", {
    get: function() {
        return types.WireType.ExprVoid;
    }
});

Object.defineProperty(ExprVoid.prototype, "codeWithImm", {
    get: function() {
        return -1;
    }
});

ExprVoid.determineBehavior = function(code, withImm) {
    var Op;
    if (!withImm) {
        Op = types.Void;
        switch (code) {
            case Op.CallInt:
                return behavior.CallInternalVoid;
            case Op.CallImp:
                return behavior.CallImportVoid;
            case Op.CallInd:
                return behavior.CallIndirectVoid;
            default:
                throw Error("illegal Void opcode: " + code);
        }
    } else
        throw Error("illegal VoidWithImm opcode: " + code);
};

Object.defineProperty(ExprVoid.prototype, "behavior", {
    get: function() {
        return ExprVoid.determineBehavior(this.code);
    }
});
