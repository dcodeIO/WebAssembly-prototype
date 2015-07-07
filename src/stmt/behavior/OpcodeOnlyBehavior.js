var assert = require("assert");

var BaseBehavior = require("./BaseBehavior");

/**
 * OpcodeOnly behavior.
 * @param {string} name
 * @param {string} description
 * @constructor
 * @extends stmt.behavior.BaseBehavior
 * @exports stmt.behavior.OpcodeOnlyBehavior
 */
function OpcodeOnlyBehavior(name, description) {
    BaseBehavior.call(this, name, description);
}

module.exports = OpcodeOnlyBehavior;

// Extends Behavior
OpcodeOnlyBehavior.prototype = Object.create(BaseBehavior.prototype);

// opcode only
// Stmt only, without imm

OpcodeOnlyBehavior.prototype.read = function(s, code) {
    s.code(code);
};

OpcodeOnlyBehavior.prototype.validate = function(definition, stmt) {
    assert.strictEqual(stmt.operands.length, 0, "OpcodeOnly requires exactly 0 operands");
};

OpcodeOnlyBehavior.prototype.write = function(s, stmt) {
    s.code(stmt.code);
};
