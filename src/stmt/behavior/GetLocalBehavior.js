var assert = require("assert"),
    types = require("../../types");

var BaseBehavior = require("./BaseBehavior"),
    LocalVariable = require("../../reflect/LocalVariable");

/**
 * GetLocal behavior.
 * @param {string} name
 * @param {string} description
 * @param {number} type
 * @constructor
 * @extends stmt.behavior.BaseBehavior
 * @exports stmt.behavior.GetLocalBehavior
 */
function GetLocalBehavior(name, description, type) {
    BaseBehavior.call(this, name, description);

    /**
     * Local variable type.
     * @type {number}
     */
    this.type = type;
}

module.exports = GetLocalBehavior;

// Extends Behavior
GetLocalBehavior.prototype = Object.create(BaseBehavior.prototype);

// opcode + local variable index
// Expr<*>, all with imm

GetLocalBehavior.prototype.read = function(s, code, imm) {
    if (imm !== null) {
        s.code(s.without_imm(code));
        s.operand(s.local(imm));
    } else {
        s.code(code);
        s.operand(s.local(s.varint()));
    }
};

GetLocalBehavior.prototype.validate = function(definition, stmt) {
    assert.strictEqual(stmt.operands.length, 1, "GetLocal requires exactly 1 operand");
    var variable = stmt.operands[0];
    assert(variable instanceof LocalVariable, "GetLocal variable (operand 0) must be a LocalVariable");
    assert.strictEqual(variable.definition, definition, "GetLocal variable (operand 0) must be part of this definition");
    assert.strictEqual(variable.type, this.type, "GetLocal variable (operand 0) type must be "+types.RTypeNames[this.type]);
};

GetLocalBehavior.prototype.write = function(s, stmt) {
    var codeWithImm;
    if (stmt.operands[0].index <= types.ImmMax && (codeWithImm = s.with_imm(stmt.code)) >= 0)
        s.code(codeWithImm, stmt.operands[0].index);
    else {
        s.code(stmt.code);
        s.varint(stmt.operands[0].index);
    }
};
