var assert = require("assert"),
    types = require("../../types");

var BaseBehavior = require("./BaseBehavior"),
    GlobalVariable = require("../../reflect/GlobalVariable");

/**
 * GetGlobal behavior.
 * @param {string} name
 * @param {string} description
 * @param {number} type
 * @constructor
 * @extends stmt.behavior.BaseBehavior
 * @exports stmt.behavior.GetGlobalBehavior
 */
function GetGlobalBehavior(name, description, type) {
    BaseBehavior.call(this, name, description);

    /**
     * Global variable type.
     * @type {number}
     */
    this.type = type;
}

module.exports = GetGlobalBehavior;

// Extends Behavior
GetGlobalBehavior.prototype = Object.create(BaseBehavior.prototype);

// opcode + global variable index
// Expr<*>, all without imm

GetGlobalBehavior.prototype.read = function(s, code) {
    s.stmt(code, [ s.global(s.varint(), this.type) ]);
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
