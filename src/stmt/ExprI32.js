var types = require("../types"),
    BaseExpr = require("./BaseExpr"),
    behavior = require("./behavior");

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
        return types.codeWithImm(types.RType.I32, this.code);
    }
});

Object.defineProperty(ExprI32.prototype, "behavior", {
    get: function() {
        var Op = types.I32;
        switch (this.code) {
            case Op.LitImm:
                return behavior.LiteralI32;
            case Op.LitPool:
                return behavior.ConstantI32;
            case Op.GetLoc:
                return behavior.GetLocalI32;
            case Op.GetGlo:
                return behavior.GetGlobalI32;
            case Op.SetLoc:
                return behavior.SetLocalI32;
            case Op.SetGlo:
                return behavior.SetGlobalI32;
            case Op.SLoad8:
            case Op.ULoad8:
            case Op.SLoad16:
            case Op.ULoad16:
            case Op.Load32:
                return behavior.LoadI;
            case Op.SLoadOff8:
            case Op.ULoadOff8:
            case Op.SLoadOff16:
            case Op.ULoadOff16:
            case Op.LoadOff32:
                return behavior.LoadWithOffsetI;
            case Op.Store8:
            case Op.Store16:
            case Op.Store32:
                return behavior.StoreI;
            case Op.StoreOff8:
            case Op.StoreOff16:
            case Op.StoreOff32:
                return behavior.StoreWithOffsetI;
            case Op.CallInt:
                return behavior.CallInternalI32;
            case Op.CallImp:
                return behavior.CallImportI32;
            case Op.CallInd:
                return behavior.CallIndirectI32;
            case Op.Cond:
                return behavior.ConditionalI32;
            case Op.Comma:
                return behavior.CommaI32;
            case Op.FromF32:
                return behavior.UnaryF32;
            case Op.FromF64:
                return behavior.UnaryF64;
            case Op.Neg:
            case Op.BitNot:
            case Op.Clz:
            case Op.LogicNot:
            case Op.Abs:
                return behavior.UnaryI32;
            case Op.Add:
            case Op.Sub:
            case Op.Mul:
            case Op.SDiv:
            case Op.UDiv:
            case Op.SMod:
            case Op.UMod:
            case Op.BitOr:
            case Op.BitAnd:
            case Op.BitXor:
            case Op.Lsh:
            case Op.ArithRsh:
            case Op.LogicRsh:
            case Op.EqI32:
            case Op.NEqI32:
            case Op.SLeThI32:
            case Op.ULeThI32:
            case Op.SLeEqI32:
            case Op.ULeEqI32:
            case Op.SGrThI32:
            case Op.UGrThI32:
            case Op.SGrEqI32:
            case Op.UGrEqI32:
                return behavior.BinaryI32;
            case Op.EqF32:
            case Op.NEqF32:
            case Op.LeThF32:
            case Op.LeEqF32:
            case Op.GrThF32:
            case Op.GrEqF32:
                return behavior.BinaryF32;
            case Op.EqF64:
            case Op.NEqF64:
            case Op.LeThF64:
            case Op.LeEqF64:
            case Op.GrThF64:
            case Op.GrEqF64:
                return behavior.BinaryF64;
            case Op.SMin:
            case Op.UMin:
            case Op.SMax:
            case Op.UMax:
                return behavior.MultiaryI32;
            default:
                throw Error("illegal I32 opcode: "+this.code);
        }
    }
});
