var assert = require("assert"),
    types = require("../../types");

var Behavior = require("./Behavior"),
    BaseExpr = require("../BaseExpr");

/**
 * Multiary behavior.
 * @param {string} name
 * @param {string} description
 * @param {number} type
 * @constructor
 * @extends stmt.behavior.Behavior
 * @exports stmt.behavior.MultiaryBehavior
 */
function MultiaryBehavior(name, description, type) {
    Behavior.call(this, name, description);

    /**
     * Expression type.
     * @type {number}
     */
    this.type = type;
}

module.exports = MultiaryBehavior;

MultiaryBehavior.prototype = Object.create(Behavior.prototype);

// opcode + varint count + count * Expr<*> argument
// Expr<*>, all without imm

MultiaryBehavior.prototype.read = function(s, code, imm) {
    var count = s.varint();
    s.emit();
    for (var i=0; i<count; ++i)
        s.expect(s.state(this.type));
};

MultiaryBehavior.prototype.validate = function(definition, stmt) {
    var count = stmt.operands.length;
    for (var i=0; i<count; ++i) {
        assert(stmt.operands[i] instanceof BaseExpr, this.name+" operand "+i+ " must be an expression");
        assert.strictEqual(stmt.operands[i].type, this.type, this.name+" operand "+i+" expression must be "+types.RTypeNames[this.type]);
    }
};

MultiaryBehavior.prototype.write = function(s, stmt) {
    var count = stmt.operands.length;
    s.code(stmt.code);
    s.varint(count);
    for (var i=0; i<count; ++i)
        s.write(stmt.operands[i]);
};
