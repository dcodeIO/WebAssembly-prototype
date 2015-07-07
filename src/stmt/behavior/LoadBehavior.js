var assert = require("assert"),
    types = require("../../types");

var Behavior = require("./Behavior"),
    ExprI32 = require("../ExprI32");

/**
 * Load behavior.
 * @param {string} name
 * @param {string} description
 * @param {number} heapType
 * @constructor
 * @extends stmt.behavior.Behavior
 * @exports stmt.behavior.LoadBehavior
 */
function LoadBehavior(name, description, heapType) {
    Behavior.call(this, name, description);

    /**
     * Heap type.
     * @type {number}
     */
    this.heapType = heapType;
}

module.exports = LoadBehavior;

// Extends Behavior
LoadBehavior.prototype = Object.create(Behavior.prototype);

// opcode + Expr<I32> heap index
// Expr<*>, all without imm

LoadBehavior.prototype.read = function(s, code, imm) {
    s.emit();
    s.expect(s.state(types.RType.I32));
};

LoadBehavior.prototype.validate = function(definition, stmt) {
    assert.strictEqual(stmt.operands.length, 1, "Load requires exactly 1 operand");
    var index = stmt.operands[0];
    assert(index instanceof ExprI32, "Load heap index (operand 0) must be an I32 expression");
};

LoadBehavior.prototype.write = function(s, stmt) {
    s.code(stmt.code);
    s.write(stmt.operands[0]);
};
