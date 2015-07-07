var assert = require("assert");

var Behavior = require("./Behavior");

/**
 * OpcodeOnly behavior.
 * @param {string} name
 * @param {string} description
 * @constructor
 * @extends stmt.behavior.Behavior
 * @exports stmt.behavior.OpcodeOnlyBehavior
 */
function OpcodeOnlyBehavior(name, description) {
    Behavior.call(this, name, description);
}

module.exports = OpcodeOnlyBehavior;

// Extends Behavior
OpcodeOnlyBehavior.prototype = Object.create(Behavior.prototype);

// opcode only
// Stmt only, without imm

OpcodeOnlyBehavior.prototype.read = function(s, code, imm) {
    s.emit();
};

OpcodeOnlyBehavior.prototype.validate = function(definition, stmt) {
    assert.strictEqual(stmt.operands.length, 0, "OpcodeOnly requires exactly 0 operands");
};

OpcodeOnlyBehavior.prototype.write = function(s, stmt) {
    s.code(stmt.code);
};
