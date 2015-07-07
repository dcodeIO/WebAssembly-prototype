var types = require("../types"),
    BaseExpr = require("./BaseExpr"),
    behavior = require("./behavior");

/**
 * A F64 expression.
 * @constructor
 * @param {number} code
 * @param {(!Array.<number|!stmt.BaseOperand>|number|!stmt.BaseOperand)=} operands
 * @constructor
 * @extends stmt.BaseExpr
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
        return types.codeWithImm(types.RType.F64, this.code);
    }
});

Object.defineProperty(ExprF64.prototype, "behavior", {
    get: function() {
        var Op = types.F64;
        switch (this.code) {
            case Op.LitImm:
                return behavior.LiteralF64;
            case Op.LitPool:
                return behavior.ConstantF64;
            case Op.GetLoc:
                return behavior.GetLocalF64;
            case Op.GetGlo:
                return behavior.GetGlobalF64;
            case Op.SetLoc:
                return behavior.SetLocalF64;
            case Op.SetGlo:
                return behavior.SetGlobalF64;
            case Op.Load:
                return behavior.LoadF64;
            case Op.LoadOff:
                return behavior.LoadWithOffsetF64;
            case Op.Store:
                return behavior.StoreF64;
            case Op.StoreOff:
                return behavior.StoreWithOffsetF64;
            case Op.CallInt:
                return behavior.CallInternalF64;
            case Op.CallImp:
                return behavior.CallImportF64;
            case Op.CallInd:
                return behavior.CallIndirectF64;
            case Op.Cond:
                return behavior.ConditionalF64;
            case Op.Comma:
                return behavior.CommaF64;
            case Op.FromS32:
            case Op.FromU32:
                return behavior.UnaryI32;
            case Op.FromF32:
                return behavior.UnaryF32;
            case Op.Neg:
            case Op.Abs:
            case Op.Ceil:
            case Op.Floor:
            case Op.Sqrt:
            case Op.Cos:
            case Op.Sin:
            case Op.Tan:
            case Op.ACos:
            case Op.ASin:
            case Op.ATan:
            case Op.Exp:
            case Op.Ln:
                return behavior.UnaryF64;
            case Op.Add:
            case Op.Sub:
            case Op.Mul:
            case Op.Div:
            case Op.Mod:
            case Op.ATan2:
            case Op.Pow:
                return behavior.BinaryF64;
            case Op.Min:
            case Op.Max:
                return behavior.MultiaryF64;
            default:
                throw Error("illegal F64 opcode: "+this.code);
        }
    }
});
