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
        return null;
    }
});

Object.defineProperty(SwitchCase.prototype, "codeWithImm", {
    get: function() {
        return -1;
    }
});

Object.defineProperty(SwitchCase.prototype, "behavior", {
    get: function() {
        switch (this.code) {
            case types.SwitchCase.Case0:
                return behavior.SwitchCase0;
            case types.SwitchCase.Case1:
                return behavior.SwitchCase1;
            case types.SwitchCase.CaseN:
                return behavior.SwitchCaseN;
            case types.SwitchCase.Default0:
                return behavior.SwitchDefault0;
            case types.SwitchCase.Default1:
                return behavior.SwitchDefault1;
            case types.SwitchCase.DefaultN:
                return behavior.SwitchDefaultN;
            default:
                throw Error("illegal SwitchCase opcode: "+this.code);
        }
    }
});
