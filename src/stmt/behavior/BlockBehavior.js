var assert = require("assert"),
    types = require("../../types");

var BaseBehavior = require("./BaseBehavior"),
    Stmt = require("../Stmt");

/**
 * Block behavior.
 * @param {string} name
 * @param {string} description
 * @constructor
 * @extends stmt.behavior.BaseBehavior
 * @exports stmt.behavior.BlockBehavior
 */
function BlockBehavior(name, description) {
    BaseBehavior.call(this, name, description);
}

module.exports = BlockBehavior;

// Extends Behavior
BlockBehavior.prototype = Object.create(BaseBehavior.prototype);

// opcode + varint count + count * Stmt
// Stmt only, without imm

BlockBehavior.prototype.read = function(s, code) {
    var count = s.varint();
    s.stmt(code);
    for (var i=0; i<count; ++i)
        s.read(types.WireType.Stmt);
};

BlockBehavior.prototype.validate = function(definition, stmt) {
    var count = stmt.operands.length;
    for (var i=0; i<count; ++i)
        assert(stmt.operands[i] instanceof Stmt, this.name+" operand "+i+" must be a statement");
};

BlockBehavior.prototype.optimize = function(definition, stmt) {
    var count = stmt.operands.length;
    if (count === 1)
        return stmt.operands[0];
    return stmt;
};

BlockBehavior.prototype.write = function(s, stmt) {
    s.code(stmt.code);
    s.varint(stmt.operands.length);
    stmt.operands.forEach(function(operand) {
        s.write(operand);
    }, this);
};
