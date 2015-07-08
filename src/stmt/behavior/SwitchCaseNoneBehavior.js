var assert = require("assert"),
    types = require("../../types");

var BaseBehavior = require("./BaseBehavior");

/**
 * Switch case with no statements behavior.
 * @param {string} name
 * @param {string} description
 * @constructor
 * @extends stmt.behavior.BaseBehavior
 * @exports stmt.behavior.SwitchCaseNoneBehavior
 */
function SwitchCaseNoneBehavior(name, description) {
    BaseBehavior.call(this, name, description);
}

module.exports = SwitchCaseNoneBehavior;

// Extends BaseBehavior
SwitchCaseNoneBehavior.prototype = Object.create(BaseBehavior.prototype);

// opcode + signed varint label
// SwitchCase only, without imm

SwitchCaseNoneBehavior.prototype.read = function(s, code) {
    s.stmt(code, [ s.varint_s() ]);
};

SwitchCaseNoneBehavior.prototype.validate = function(definition, stmt) {
    assert.strictEqual(stmt.operands.length, 1, this.name+" requires exactly 1 operand");
    var label = stmt.operands[0];
    assert(typeof label === 'number' && label%1 === 0, this.name+" label (operand 0) must be an integer");
};

SwitchCaseNoneBehavior.prototype.write = function(s, stmt) {
    s.code(stmt.code);
    s.varint_s(stmt.operands[0]);
};
