var assert = require("assert"),
    types = require("../../types");

var Behavior = require("./Behavior"),
    BaseExpr = require("../BaseExpr");

/**
 * Binary behavior.
 * @param {string} name
 * @param {string} description
 * @param {number>} type
 * @constructor
 * @extends stmt.behavior.Behavior
 * @exports stmt.behavior.BinaryBehavior
 */
function BinaryBehavior(name, description, type) {
    Behavior.call(this, name, description);

    /**
     * Expression type.
     * @type {number}
     */
    this.type = type;
}

module.exports = BinaryBehavior;

BinaryBehavior.prototype = Object.create(Behavior.prototype);

// opcode + Expr<*> argument [...]
// Expr<*>, all without imm

BinaryBehavior.prototype.read = function(s, code, imm) {
    s.emit();
    s.expect(s.state(this.type));
    s.expect(s.state(this.type));
};

BinaryBehavior.prototype.validate = function(definition, stmt) {
    assert.strictEqual(stmt.operands.length, 2, this.name+" requires exactly 2 operands");
    for (var i=0; i<2; ++i){
        assert(stmt.operands[i] instanceof BaseExpr, this.name+" operand "+i+ " must be an expression");
        assert.strictEqual(stmt.operands[i].type, this.type, this.name+" operand "+i+" expression must be "+types.RTypeNames[this.type]);
    }
};

BinaryBehavior.prototype.write = function(s, stmt) {
    s.code(stmt.code);
    s.write(stmt.operands[0]);
    s.write(stmt.operands[1]);
};
