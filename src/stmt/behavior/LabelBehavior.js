var assert = require("assert");

var Behavior = require("./Behavior");

/**
 * Behavior specifying how to process label statements.
 * @param {string} description
 * @constructor
 */
function LabelBehavior(description) {
    Behavior.call(this, description);
}

module.exports = LabelBehavior;

LabelBehavior.prototype = Object.create(Behavior.prototype);

LabelBehavior.prototype.read = function(s, code, imm) {
    s.emit(s.varint());
};

LabelBehavior.prototype.validate = function(definition, stmt) {
    assert.strictEqual(stmt.operands.length, 1, "Label requires exactly 1 operands");
    var label = stmt.operands[0];
    assert(typeof label === 'number' && label%1 === 0 && label >= 0, "Label label (operand 0) must be a non-negative integer");
};

LabelBehavior.prototype.write = function(s, stmt) {
    s.emit();
    s.varint(stmt.operands[0]);
};
