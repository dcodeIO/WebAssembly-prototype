var assert = require("assert"),
    types = require("../../types");

var Behavior = require("./Behavior"),
    LocalVariable = require("../../reflect/LocalVariable"),
    BaseExpr = require("../BaseExpr"),
    Stmt = require("../Stmt");

/**
 * Behavior specifying how to process SetLoc expressions.
 * @param {string} description
 * @param {number} returnType
 * @constructor
 * @extends Behavior
 * @exports stmt.behavior.SetLocalBehavior
 */
function SetLocalBehavior(description, returnType) {
    Behavior.call(this, description);

    /**
     * Expression return type, if an expression.
     * @type {number|null}
     */
    this.returnType = returnType || null;
}

module.exports = SetLocalBehavior;

SetLocalBehavior.prototype = Object.create(Behavior.prototype);

// opcode + local variable index + Expr<local variable type> value
// Stmt & Expr<*>, Stmt with imm

SetLocalBehavior.prototype.read = function(s, op, imm) {
    var variable = s.local(imm !== null ? imm : s.varint());
    s.emit(variable);
    s.expect(s.state(variable.type));
};

SetLocalBehavior.prototype.validate = function(definition, stmt) {
    assert.strictEqual(stmt.operands.length, 2, "SetLoc must have two operands");
    var variable = stmt.operands[0];
    assert(variable instanceof LocalVariable, "SetLoc operand 0 must be a LocalVariable");
    assert.strictEqual(variable.definition, definition, "SetGlo variable must be part of this definition");
    if (this.returnType !== null)
        assert.strictEqual(variable.type, this.returnType, "SetGlo variable must be "+types.RTypeNames[this.returnType]);
    var expr = stmt.operands[1];
    assert(expr instanceof BaseExpr, "SetGlo operand 1 must be an expression");
    assert.strictEqual(expr.type, variable.type, "SetGlo operand 1 expression must be "+types.RTypeNames[variable.type]);
};

SetLocalBehavior.prototype.write = function(s, stmt) {
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
