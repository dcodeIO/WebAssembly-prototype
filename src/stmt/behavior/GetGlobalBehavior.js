var assert = require("assert"),
    types = require("../../types");

var Behavior = require("./Behavior"),
    GlobalVariable = require("../../reflect/GlobalVariable");

/**
 * GetGlobal behavior.
 * @param {string} name
 * @param {string} description
 * @param {number} type
 * @constructor
 * @extends stmt.behavior.Behavior
 * @exports stmt.behavior.GetGlobalBehavior
 */
function GetGlobalBehavior(name, description, type) {
    Behavior.call(this, name, description);

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
    assert.strictEqual(stmt.operands.length, 1, "GetGlobal requires exactly 1 operand");
    var variable = stmt.operands[0];
    assert(variable instanceof GlobalVariable, "GetGlobal variable (operand 0) must be a GlobalVariable");
    assert.strictEqual(variable.definition.declaration.assembly, definition.definition.declaration.assembly, "GetGlobal variable (operand 0) must be part of this assembly");
    assert.strictEqual(variable.type, this.type, "GetGlobal variable (operand 0) type must be "+types.RTypeNames[this.type]);
};

GetGlobalBehavior.prototype.write = function(s, stmt) {
    s.code(stmt.code);
    s.varint(stmt.operands[0].index);
};
