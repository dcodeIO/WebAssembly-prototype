var assert = require("assert"),
    types = require("../../types");

var BaseBehavior = require("./BaseBehavior"),
    BaseExpr = require("../BaseExpr");

/**
 * Unary behavior.
 * @param {string} name
 * @param {string} description
 * @param {number} type
 * @constructor
 * @extends stmt.behavior.BaseBehavior
 * @exports stmt.behavior.UnaryBehavior
 */
function UnaryBehavior(name, description, type) {
    BaseBehavior.call(this, name, description);

    /**
     * Expression type.
     * @type {number}
     */
    this.type = type;
}

module.exports = UnaryBehavior;

UnaryBehavior.prototype = Object.create(BaseBehavior.prototype);

// opcode + Expr<*> argument
// Expr<*>, all without imm

UnaryBehavior.prototype.read = function(s, code) {
    s.stmt(code);
    s.read(this.type);
};

UnaryBehavior.prototype.validate = function(definition, stmt) {
    assert.strictEqual(stmt.operands.length, 1, this.name+" requires exactly 1 operand");
    assert(stmt.operands[0] instanceof BaseExpr, this.name+" operand 0 must be an expression");
    assert.strictEqual(stmt.operands[0].type, this.type, this.name+" operand 0 expression must be "+types.TypeNames[this.type]);
};

UnaryBehavior.prototype.write = function(s, stmt) {
    s.code(stmt.code);
    s.write(stmt.operands[0]);
};
