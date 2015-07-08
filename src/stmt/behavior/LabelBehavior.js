var assert = require("assert");

var BaseBehavior = require("./BaseBehavior");

/**
 * Label behavior.
 * @param {string} name
 * @param {string} description
 * @constructor
 * @extends stmt.behavior.BaseBehavior
 * @exports stmt.behavior.LabelBehavior
 */
function LabelBehavior(name, description) {
    BaseBehavior.call(this, name, description);
}

module.exports = LabelBehavior;

// Extends Behavior
LabelBehavior.prototype = Object.create(BaseBehavior.prototype);

// opcode + label index
// Stmt only, without imm

LabelBehavior.prototype.read = function(s, code, imm) {
    s.stmt(code, [ s.varint() ]);
};

LabelBehavior.prototype.validate = function(definition, stmt) {
    assert.strictEqual(stmt.operands.length, 1, "Label requires exactly 1 operands");
    var label = stmt.operands[0];
    assert(typeof label === 'number' && label%1 === 0 && label >= 0, "Label index (operand 0) must be a non-negative integer");
};

LabelBehavior.prototype.write = function(s, stmt) {
    s.code(stmt.code);
    s.varint(stmt.operands[0]);
};
