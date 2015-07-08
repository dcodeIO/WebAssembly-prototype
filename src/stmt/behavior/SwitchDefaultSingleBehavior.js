var assert = require("assert"),
    types = require("../../types");

var BaseBehavior = require("./BaseBehavior"),
    Stmt = require("../Stmt");

/**
 * Switch default with a single statement behavior.
 * @param {string} name
 * @param {string} description
 * @constructor
 * @extends stmt.behavior.BaseBehavior
 * @exports stmt.behavior.SwitchDefaultSingleBehavior
 */
function SwitchDefaultSingleBehavior(name, description) {
    BaseBehavior.call(this, name, description);
}

module.exports = SwitchDefaultSingleBehavior;

// Extends BaseBehavior
SwitchDefaultSingleBehavior.prototype = Object.create(BaseBehavior.prototype);

// opcode + Stmt
// SwitchCase only, without imm

SwitchDefaultSingleBehavior.prototype.read = function(s, code) {
    s.stmt(code);
    s.read(types.WireType.Stmt);
};

SwitchDefaultSingleBehavior.prototype.validate = function(definition, stmt) {
    assert.strictEqual(stmt.operands.length, 1, this.name+" requires exactly 1 operand");
    assert(stmt.operands[0] instanceof Stmt, this.name+" operand 0 must be a statement");
};

SwitchDefaultSingleBehavior.prototype.write = function(s, stmt) {
    s.code(stmt.code);
    s.write(stmt.operands[0]);
};
