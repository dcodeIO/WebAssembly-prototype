var assert = require("assert"),
    types = require("../../types");

var BaseBehavior = require("./BaseBehavior");

/**
 * Switch default with no statements behavior.
 * @param {string} name
 * @param {string} description
 * @constructor
 * @extends stmt.behavior.BaseBehavior
 * @exports stmt.behavior.SwitchDefaultNoneBehavior
 */
function SwitchDefaultNoneBehavior(name, description) {
    BaseBehavior.call(this, name, description);
}

module.exports = SwitchDefaultNoneBehavior;

// Extends BaseBehavior
SwitchDefaultNoneBehavior.prototype = Object.create(BaseBehavior.prototype);

// opcode only
// SwitchCase only, without imm

SwitchDefaultNoneBehavior.prototype.read = function(s, code) {
    s.stmt(code);
};

SwitchDefaultNoneBehavior.prototype.validate = function(definition, stmt) {
    assert.strictEqual(stmt.operands.length, 0, this.name+" requires exactly 0 operands");
};

SwitchDefaultNoneBehavior.prototype.write = function(s, stmt) {
    s.code(stmt.code);
};
