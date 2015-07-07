var assert = require("assert"),
    types = require("../../types");

var Behavior = require("./Behavior"),
    BaseExpr = require("../BaseExpr"),
    ExprI32 = require("../ExprI32");

/**
 * Store behavior.
 * @param {string} name
 * @param {string} description
 * @param {number} heapType
 * @constructor
 * @extends stmt.behavior.Behavior
 * @exports stmt.behavior.StoreBehavior
 */
function StoreBehavior(name, description, heapType) {
    Behavior.call(this, name, description);

    /**
     * Heap type.
     * @type {number}
     */
    this.heapType = heapType;
}

module.exports = StoreBehavior;

// Extends Behavior
StoreBehavior.prototype = Object.create(Behavior.prototype);

// opcode + Expr<I32> heap index + Expr<heap type> value
// Stmt & Expr<*>, all without imm

StoreBehavior.prototype.read = function(s, code, imm) {
    s.emit();
    s.expect(s.state(types.RType.I32));
    s.expect(s.state(this.heapType));
};

StoreBehavior.prototype.validate = function(definition, stmt) {
    assert.strictEqual(stmt.operands.length, 2, "Store requires exactly 2 operands");
    var index = stmt.operands[0];
    assert(index instanceof ExprI32, "Store heap index (operand 0) must be an I32 expression");
    var value = stmt.operands[1];
    assert(value instanceof BaseExpr, "Store value (operand 1) must be an expression");
    assert.strictEqual(value.type, this.heapType, "Store value (operand 1) expression must be "+types.RTypeNames[this.heapType]);
};

StoreBehavior.prototype.write = function(s, stmt) {
    s.code(stmt.code);
    s.write(stmt.operands[0]);
    s.write(stmt.operands[1]);
};
