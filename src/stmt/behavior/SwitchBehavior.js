var assert = require("assert"),
    types = require("../../types");

var BaseBehavior = require("./BaseBehavior"),
    ExprI32 = require("../ExprI32"),
    SwitchCase = require("../SwitchCase");

/**
 * Switch behavior.
 * @param {string} name
 * @param {string} description
 * @constructor
 * @extends stmt.behavior.BaseBehavior
 * @exports stmt.behavior.SwitchBehavior
 */
function SwitchBehavior(name, description) {
    BaseBehavior.call(this, name, description);
}

module.exports = SwitchBehavior;

// Extends Behavior
SwitchBehavior.prototype = Object.create(BaseBehavior.prototype);

// opcode + number of cases + Expr<I32> condition + number of cases * SwitchCase
// Stmt only, without imm

SwitchBehavior.prototype.read = function(s, code) {
    var count = s.varint();
    s.stmt(code);
    s.read(types.WireType.ExprI32);
    for (var i=0; i<count; ++i)
        s.read(types.WireType.SwitchCase);
};

SwitchBehavior.prototype.validate = function(definition, stmt) {
    assert(stmt.operands[0] instanceof ExprI32, this.name+" condition (operand 0) must be an I32 expression");
    for (var i=1; i<stmt.operands.length; ++i)
        assert(stmt.operands[i] instanceof SwitchCase, this.name+" case "+(i-1)+" (operand "+i+") must be a SwitchCase");
};

SwitchBehavior.prototype.write = function(s, stmt) {
    var count = stmt.operands.length - 1;
    s.code(stmt.code);
    s.varint(count);
    s.write(stmt.operands[0]);
    for (var i=0; i<count; ++i)
        s.write(stmt.operands[1+i]);
};
