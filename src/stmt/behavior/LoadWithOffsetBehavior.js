var assert = require("assert"),
    types = require("../../types");

var Behavior = require("./Behavior"),
    ExprI32 = require("../ExprI32");

/**
 * LoadWithOffset behavior.
 * @param {string} name
 * @param {string} description
 * @param {number} heapType
 * @constructor
 * @extends stmt.behavior.Behavior
 * @exports stmt.behavior.LoadWithOffsetBehavior
 */
function LoadWithOffsetBehavior(name, description, heapType) {
    Behavior.call(this, name, description);

    /**
     * Heap type.
     * @type {number}
     */
    this.heapType = heapType;
}

module.exports = LoadWithOffsetBehavior;

// Extends Behavior
LoadWithOffsetBehavior.prototype = Object.create(Behavior.prototype);

// opcode + varint offset + Expr<I32> heap index
// Expr<*>, all without imm

LoadWithOffsetBehavior.prototype.read = function(s, code, imm) {
    s.emit(s.varint());
    s.expect(s.state(types.RType.I32));
};

LoadWithOffsetBehavior.prototype.validate = function(definition, stmt) {
    assert.strictEqual(stmt.operands.length, 2, "LoadWithOffset requires exactly 2 operands");
    var offset = stmt.operands[0];
    assert(typeof offset === 'number' && offset%1 === 0 && offset >= 0, "LoadWithOffset offset (operand 0) must be a non-negative integer");
    var index = stmt.operands[1];
    assert(index instanceof ExprI32, "LoadWithOffset heap index (operand 1) must be an I32 expression");
};

LoadWithOffsetBehavior.prototype.write = function(s, stmt) {
    s.code(stmt.code);
    s.varint(stmt.operands[0]);
    s.write(stmt.operands[1]);
};
