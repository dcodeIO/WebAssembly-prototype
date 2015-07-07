var assert = require("assert"),
    types = require("../../types");

var Behavior = require("./Behavior"),
    BaseExpr = require("../BaseExpr");

/**
 * Comma behavior.
 * @param {string} name
 * @param {string} description
 * @param {number} returnType
 * @constructor
 * @extends stmt.behavior.Behavior
 * @exports stmt.behavior.CommaBehavior
 */
function CommaBehavior(name, description, returnType) {
    Behavior.call(this, name, description);

    /**
     * Return type.
     * @type {number}
     */
    this.returnType = returnType;
}

module.exports = CommaBehavior;

// Extends Behavior
CommaBehavior.prototype = Object.create(Behavior.prototype);

// opcode + U8 RType + Expr<previous RType> left + Expr<*> right
// Expr<*>, all without imm

CommaBehavior.prototype.read = function(s, code, imm) {
    s.emit();
    s.expect(s.state(s.u8()));
    s.expect(s.state(this.returnType));
};

CommaBehavior.prototype.validate = function(definition, stmt) {
    assert.strictEqual(stmt.operands.length, 2, this.name+" requires exactly 2 operands");
    assert(stmt.operands[0] instanceof BaseExpr, this.name+" left (operand 0) must be an expression");
    var right = stmt.operands[1];
    assert(right instanceof BaseExpr, this.name+" right (operand 1) must be an expression");
    assert.strictEqual(right.type, this.returnType, this.name+" right (operand 1) expression must be "+types.RTypeNames[this.returnType]);
};

CommaBehavior.prototype.write = function(s, stmt) {
    s.code(stmt.code);
    var left = stmt.operands[0];
    s.u8(left.type);
    s.write(left);
    s.write(stmt.operands[1]);
};
