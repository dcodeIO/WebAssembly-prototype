var assert = require("assert"),
    types = require("../../types");

var Behavior = require("./Behavior"),
    BaseExpr = require("..//BaseExpr"),
    ExprI32 = require("../ExprI32");

/**
 * StoreWithOffset behavior.
 * @param {string} name
 * @param {string} description
 * @param {number} heapType
 * @constructor
 * @extends stmt.behavior.Behavior
 * @exports stmt.behavior.StoreWithOffsetBehavior
 */
function StoreWithOffsetBehavior(name, description, heapType) {
    Behavior.call(this, name, description);

    /**
     * Heap type.
     * @type {number}
     */
    this.heapType = heapType;
}

module.exports = StoreWithOffsetBehavior;

// Extends Behavior
StoreWithOffsetBehavior.prototype = Object.create(Behavior.prototype);

// opcode + varint offset + Expr<I32> heap index + Expr<heap type> value
// Stmt & Expr<*>, all without imm

StoreWithOffsetBehavior.prototype.read = function(s, code, imm) {
    s.emit(s.varint());
    s.expect(s.state(types.RType.I32));
    s.expect(s.state(this.heapType));
};

StoreWithOffsetBehavior.prototype.validate = function(definition, stmt) {
    assert.strictEqual(stmt.operands.length, 3, "StoreWithOffset requires exactly 3 operands");
    var offset = stmt.operands[0];
    assert(typeof offset === 'number' && offset%1 === 0 && offset >= 0, "StoreWithOffset offset (operand 0) must be a non-negative integer");
    var index = stmt.operands[1];
    assert(index instanceof ExprI32, "StoreWithOffset heap index (operand 1) must be an I32 expression");
    var value = stmt.operands[2];
    assert(value instanceof BaseExpr, "StoreWithOffset value (operand 2) must be an expression");
    assert.strictEqual(value.type, this.heapType, "StoreWithOffset value (operand 1) expression must be "+types.RTypeNames[this.heapType]);
};

StoreWithOffsetBehavior.prototype.write = function(s, stmt) {
    s.code(stmt.code);
    s.varint(stmt.operands[0]);
    s.write(stmt.operands[1]);
    s.write(stmt.operands[2]);
};
