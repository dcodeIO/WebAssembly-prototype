var assert = require("assert"),
    types = require("../../types");

var BaseBehavior = require("./BaseBehavior"),
    Stmt = require("../Stmt");

/**
 * Switch case with a single statement behavior.
 * @param {string} name
 * @param {string} description
 * @constructor
 * @extends stmt.behavior.BaseBehavior
 * @exports stmt.behavior.SwitchCaseSingleBehavior
 */
function SwitchCaseSingleBehavior(name, description) {
    BaseBehavior.call(this, name, description);
}

module.exports = SwitchCaseSingleBehavior;

// Extends BaseBehavior
SwitchCaseSingleBehavior.prototype = Object.create(BaseBehavior.prototype);

// opcode + signed varint label + Stmt
// SwitchCase only, without imm

SwitchCaseSingleBehavior.prototype.read = function(s, code) {
    s.stmt(code, [ s.varint_s() ]);
    s.read(types.WireType.Stmt);
};

SwitchCaseSingleBehavior.prototype.validate = function(definition, stmt) {
    assert.strictEqual(stmt.operands.length, 2, this.name+" requires exactly 2 operands");
    var label = stmt.operands[0];
    assert(typeof label === 'number' && label%1 === 0, this.name+" label (operand 0) must be an integer");
    assert(stmt.operands[1] instanceof Stmt, this.name+" operand 1 must be a statement");
};

SwitchCaseSingleBehavior.prototype.write = function(s, stmt) {
    s.code(stmt.code);
    s.varint_s(stmt.operands[0]);
    s.write(stmt.operands[1]);
};
