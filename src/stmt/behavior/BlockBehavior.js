var assert = require("assert"),
    types = require("../../types");

var Behavior = require("./Behavior"),
    Stmt = require("../Stmt");

/**
 * Block behavior.
 * @param {string} name
 * @param {string} description
 * @constructor
 * @extends stmt.behavior.Behavior
 * @exports stmt.behavior.BlockBehavior
 */
function BlockBehavior(name, description) {
    Behavior.call(this, name, description);
}

module.exports = BlockBehavior;

// Extends Behavior
BlockBehavior.prototype = Object.create(Behavior.prototype);

// opcode + varint count + count * Stmt
// Stmt only, without imm

BlockBehavior.prototype.read = function(s, code, imm) {
    var count = s.varint();
    s.emit();
    for (var i=0; i<count; ++i)
        s.expect(s.state(null));
};

BlockBehavior.prototype.validate = function(definition, stmt) {
    var count = stmt.operands.length;
    for (var i=0; i<count; ++i)
        assert(stmt.operands[i] instanceof Stmt, this.name+" operand "+i+" must be a statement");
};

BlockBehavior.prototype.write = function(s, stmt) {
    s.code(stmt.code);
    var count = stmt.operands.length;
    for (var i=0; i<count; ++i)
        s.write(stmt.operands[i]);
};
