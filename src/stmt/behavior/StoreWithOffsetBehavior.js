var assert = require("assert"),
    types = require("../../types");

var Behavior = require("./Behavior"),
    BaseExpr = require("..//BaseExpr"),
    ExprI32 = require("../ExprI32");

function StoreWithOffsetBehavior(description, heapType) {
    Behavior.call(this, description);

    /**
     * Heap type.
     * @type {number}
     */
    this.heapType = heapType;
}

module.exports = StoreWithOffsetBehavior;

StoreWithOffsetBehavior.prototype = Object.create(Behavior.prototype);

// opcode + Expr<I32> heap index + Expr<heap type> value
// Stmt & Expr<*>, all without imm

StoreWithOffsetBehavior.prototype.read = function(s, code, imm) {
    s.emit(s.varint());
    s.expect([s.state(types.RType.I32), s.state(this.heapType)]);
};

StoreWithOffsetBehavior.prototype.validate = function(definition, stmt) {
    assert.strictEqual(stmt.operands.length, 3, "StoreWithOffset requires exactly 3 operands");
    var offset = stmt.operands[0];
    assert(typeof offset === 'number' && offset%1 === 0 && offset >= 0, "StoreWithOffset offset (operand 0) must be a non-negative integer");
    var index = stmt.operands[1];
    assert(index instanceof ExprI32, "Store heap index (operand 1) must be an I32 expression");
    var value = stmt.operands[2];
    assert(value instanceof BaseExpr, "Store value (operand 2) must be an expression");
    assert.strictEqual(value.type, this.heapType, "Store value (operand 1) expression must be "+types.RTypeNames[this.heapType]);
};

StoreWithOffsetBehavior.prototype.write = function(s, stmt) {
    s.emit();
    s.varint(stmt.operands[0]);
    s.expect([s.state(types.RType.I32), s.state(this.heapType)]);
};
