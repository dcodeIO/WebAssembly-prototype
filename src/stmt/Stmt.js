var types = require("../types"),
    BaseStmt = require("./BaseStmt"),
    behavior = require("./bahavior");

/**
 * A statement.
 * @constructor
 * @param {number} code
 * @param {(number|!BaseStmt|!Array<number|!BaseStmt>)=} operands
 * @constructor
 * @extends stmt.BaseStmt
 * @exports stmt.Stmt
 */
function Stmt(code, operands) {
    BaseStmt.call(this, code, operands);
}

module.exports = Stmt;

Stmt.prototype = Object.create(BaseStmt.prototype);

Object.defineProperty(Stmt.prototype, "type", {
    get: function() {
        return null;
    }
});

Object.defineProperty(Stmt.prototype, "codeWithImm", {
    get: function() {
        switch (this.code) {
            case types.Stmt.SetLoc:
                return types.StmtWithImm.SetLoc;
            case types.Stmt.SetGlo:
                return types.StmtWithImm.SetGlo;
            default:
                return -1;
        }
    }
});

Object.defineProperty(Stmt.prototype, "behavior", {
    get: function() {
        var Op = types.Stmt;
        switch (this.code) {
            case Op.SetLoc:
                return behavior.SetLocal;
            case Op.SetGlo:
                return behavior.SetGlobal;
            case Op.I32Store8:
            case Op.I32Store16:
            case Op.I32Store32:
                return behavior.StoreI;
            case Op.I32StoreOff8:
            case Op.I32StoreOff16:
            case Op.I32StoreOff32:
                return behavior.StoreWithOffsetI;
            case Op.F32Store:
                return behavior.StoreF32;
            case Op.F32StoreOff:
                return behavior.StoreWithOffsetF32;
            case Op.F64Store:
                return behavior.StoreF64;
            case Op.F64StoreOff:
                return behavior.StoreWithOffsetF64;
            case Op.CallInt:
                return behavior.CallInternal;
            case Op.CallImp:
                return behavior.CallImport;
            case Op.CallInd:
                return behavior.CallIndirect;
            case Op.Ret:
                return behavior.Return;
            case Op.Block:
                return behavior.Block;
            case Op.IfThen:
                return behavior.IfThen;
            case Op.IfElse:
                return behavior.IfElse;
            case Op.While:
                return behavior.While;
            case Op.Do:
                return behavior.Do;
            case Op.Label:
                return behavior.Label;
            case Op.Break:
                return behavior.Break;
            case Op.Continue:
                return behavior.Continue;
            case Op.BreakLabel:
                return behavior.BreakLabel;
            case Op.ContinueLabel:
                return behavior.ContinueLabel;
            case Op.Switch:
                return behavior.Switch;
            default:
                throw Error("illegal Stmt opcode: " + this.code);
        }
    }
});
