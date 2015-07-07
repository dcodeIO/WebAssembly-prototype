var types = require("../types"),
    BaseExpr = require("./BaseExpr"),
    behavior = require("./behavior");

/**
 * A F32 expression.
 * @constructor
 * @param {number} code
 * @param {(!Array.<number|!stmt.BaseOperand>|number|!stmt.BaseOperand)=} operands
 * @constructor
 * @extends stmt.BaseExpr
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
        return types.codeWithImm(types.RType.F32, this.code);
    }
});

Object.defineProperty(ExprF32.prototype, "behavior", {
    get: function() {
        var Op = types.F32;
        switch (this.code) {
            case Op.LitImm:
                return behavior.LiteralF32;
            case Op.LitPool:
                return behavior.ConstantF32;
            case Op.GetLoc:
                return behavior.GetLocalF32;
            case Op.GetGlo:
                return behavior.GetGlobalF32;
            case Op.SetLoc:
                return behavior.SetLocalF32;
            case Op.SetGlo:
                return behavior.SetGlobalF32;
            case Op.Load:
                return behavior.LoadF32;
            case Op.LoadOff:
                return behavior.LoadWithOffsetF32;
            case Op.Store:
                return behavior.StoreF32;
            case Op.StoreOff:
                return behavior.StoreWithOffsetF32;
            case Op.CallInt:
                return behavior.CallInternalF32;
            case Op.CallInd:
                return behavior.CallIndirectF32;
            case Op.Cond:
                return behavior.ConditionalF32;
            case Op.Comma:
                return behavior.CommaF32;
            case Op.FromS32:
            case Op.FromU32:
                return behavior.UnaryI32;
            case Op.FromF64:
                return behavior.UnaryF64;
            case Op.Neg:
            case Op.Abs:
            case Op.Ceil:
            case Op.Floor:
            case Op.Sqrt:
                return behavior.UnaryF32;
            case Op.Add:
            case Op.Sub:
            case Op.Mul:
            case Op.Div:
                return behavior.BinaryF32;
            default:
                throw Error("illegal F32 opcode: "+this.code);
        }
    }
});
