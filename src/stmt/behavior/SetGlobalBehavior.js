var assert = require("assert"),
    types = require("../../types");

var Behavior = require("./Behavior"),
    GlobalVariable = require("../../reflect/GlobalVariable"),
    BaseExpr = require("../BaseExpr"),
    Stmt = require("../Stmt");

/**
 * Behavior specifying how to process SetGlo expressions.
 * @param {string} description
 * @param {number} returnType
 * @constructor
 * @extends Behavior
 */
function SetGlobalBehavior(description, returnType) {
    Behavior.call(this, description);

    /**
     * Expression return type, if an expression.
     * @type {number|null}
     */
    this.returnType = returnType || null;
}

module.exports = SetGlobalBehavior;

SetGlobalBehavior.prototype = Object.create(Behavior.prototype);

// opcode + global variable index + Expr<global variable type> value
// Stmt & Expr<*>, Stmt with imm

SetGlobalBehavior.prototype.read = function(s, imm) {
    var variable = s.global(imm !== null ? imm : s.varint());
    s.emit(variable);
    s.expect(s.state(variable.type));
};

SetGlobalBehavior.prototype.validate = function(definition, stmt) {
    assert.strictEqual(stmt.operands.length, 2, "SetGlo must have two operands");
    var variable = stmt.operands[0];
    assert(variable instanceof GlobalVariable, "SetGlo operand 0 must be a GlobalVariable");
    assert.strictEqual(variable.assembly, definition.declaration.assembly, "SetGlo variable must be part of this assembly");
    if (this.returnType !== null)
        assert.strictEqual(variable.type, this.returnType, "SetGlo variable must be "+types.RTypeNames[this.returnType]);
    var expr = stmt.operands[1];
    assert(expr instanceof BaseExpr, "SetGlo operand 1 must be an expression");
    assert.strictEqual(expr.type, variable.type, "SetGlo operand 1 expression must be "+types.RTypeNames[variable.type]);
};

SetGlobalBehavior.prototype.write = function(s, stmt) {
    var variable = stmt.operands[0],
        codeWithImm;
    if (variable.index <= types.ImmMax && (codeWithImm = stmt.codeWithImm) >= 0)
        s.emit_code(codeWithImm, variable.index);
    else {
        s.emit();
        s.varint(variable.index);
    }
    s.expect(s.state(variable.type));
};
