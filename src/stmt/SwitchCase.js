var types = require("../types");

var BaseStmt = require("./BaseStmt"),
    behavior = require("./behavior");

/**
 * A switch case statement.
 * @param {number} code
 * @param {(!BaseStmt|!Array<!BaseStmt>)=} operands
 * @constructor
 * @extends stmt.BaseStmt
 * @exports stmt.SwitchCase
 */
function SwitchCase(code, operands) {
    BaseStmt.call(this, code, operands);
}

module.exports = SwitchCase;

// Extends BaseStmt
SwitchCase.prototype = Object.create(BaseStmt.prototype);

Object.defineProperty(SwitchCase.prototype, "type", {
    get: function() {
        return types.WireType.SwitchCase;
    }
});

Object.defineProperty(SwitchCase.prototype, "codeWithImm", {
    get: function() {
        return -1;
    }
});

SwitchCase.determineBehavior = function(code, withImm) {
    var Op;
    if (!withImm) {
        Op = types.SwitchCase;
        switch (code) {
            case Op.Case0:
                return behavior.SwitchCase0;
            case Op.Case1:
                return behavior.SwitchCase1;
            case Op.CaseN:
                return behavior.SwitchCaseN;
            case Op.Default0:
                return behavior.SwitchDefault0;
            case Op.Default1:
                return behavior.SwitchDefault1;
            case Op.DefaultN:
                return behavior.SwitchDefaultN;
            default:
                throw Error("illegal SwitchCase opcode: " + code);
        }
    } else
        throw Error("illegal SwitchCaseWithImm opcode: " + code);
};

Object.defineProperty(SwitchCase.prototype, "behavior", {
    get: function() {
        return SwitchCase.determineBehavior(this.code);
    }
});
