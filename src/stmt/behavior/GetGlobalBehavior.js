var assert = require("assert"),
    types = require("../../types");

var Behavior = require("./Behavior"),
    GlobalVariable = require("../../reflect/GlobalVariable");

/**
 * Behavior specifying how to process GetGlo expressions.
 * @param {string} description
 * @param {number} type
 * @constructor
 */
function GetGlobalBehavior(description, type) {
    Behavior.call(this, description);

    /**
     * Global variable type.
     * @type {number}
     */
    this.type = type;
}

module.exports = GetGlobalBehavior;

// Extends Behavior
GetGlobalBehavior.prototype = Object.create(Behavior.prototype);

// opcode + global variable index
// Expr<*>, all without imm

GetGlobalBehavior.prototype.read = function(s, op, imm) {
    s.emit(s.global(s.varint()));
};

GetGlobalBehavior.prototype.validate = function(definition, stmt) {
    assert.strictEqual(stmt.operands.length, 1, "GetGlo requires exactly 1 operand");
    var variable = stmt.operands[0];
    assert(variable instanceof GlobalVariable, "GetGlo operand 0 must be a GlobalVariable");
    assert.strictEqual(variable.definition.declaration.assembly, definition.definition.declaration.assembly, "GetGlo variable must be part of this assembly");
    assert.strictEqual(variable.type, this.type, "GetGlo variable type must be "+types.RTypeNames[this.type]);
};

GetGlobalBehavior.prototype.write = function(s, stmt) {
    s.emit();
    s.varint(stmt.operands[0].index);
};
