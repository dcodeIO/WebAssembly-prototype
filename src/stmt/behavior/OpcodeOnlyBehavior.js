var assert = require("assert");

var Behavior = require("./Behavior");

function OpcodeOnlyBehavior(description) {
    Behavior.call(this, description);
}

module.exports = OpcodeOnlyBehavior;

OpcodeOnlyBehavior.prototype = Object.create(Behavior.prototype);

OpcodeOnlyBehavior.prototype.read = function(s, code, imm) {
    s.emit();
};

OpcodeOnlyBehavior.prototype.validate = function(definition, stmt) {
    assert.strictEqual(stmt.operands.length, 0, "OpcodeOnly requires exactly 0 operands");
};

OpcodeOnlyBehavior.prototype.write = function(s, stmt) {
    s.emit();
};
