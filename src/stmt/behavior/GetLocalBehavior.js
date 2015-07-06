var assert = require("assert"),
    types = require("../../types");

var Behavior = require("./Behavior"),
    LocalVariable = require("../../reflect/LocalVariable");

/**
 * Behavior specifying how to process GetLoc expressions.
 * @param {string} description
 * @param {number} type
 * @constructor
 */
function GetLocalBehavior(description, type) {
    Behavior.call(this, description);

    /**
     * Local variable type.
     * @type {number}
     */
    this.type = type;
}

module.exports = GetLocalBehavior;

// Extends Behavior
GetLocalBehavior.prototype = Object.create(Behavior.prototype);

// opcode + local variable index
// Expr<*>, all with imm

GetLocalBehavior.prototype.read = function(s, op, imm) {
    s.emit(s.local(imm !== null ? imm : s.varint()));
};

GetLocalBehavior.prototype.validate = function(definition, stmt) {
    assert.strictEqual(stmt.operands.length, 1, "GetLoc requires exactly 1 operand");
    var variable = stmt.operands[0];
    assert(variable instanceof LocalVariable, "GetLoc operand 0 must be a LocalVariable");
    assert.strictEqual(variable.definition, definition, "GetLoc variable must be part of this definition");
    assert.strictEqual(variable.type, this.type, "GetLoc variable type must be "+types.RTypeNames[this.type]);
};

GetLocalBehavior.prototype.write = function(s, stmt) {
    var codeWithImm;
    if (stmt.operands[0].index <= types.ImmMax && (codeWithImm = stmt.codeWithImm) >= 0)
        s.emit_code(codeWithImm, stmt.operands[0].index);
    else {
        s.emit();
        s.varint(stmt.operands[0].index);
    }
};
