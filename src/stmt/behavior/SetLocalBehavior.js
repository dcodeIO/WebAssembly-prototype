var assert = require("assert"),
    types = require("../../types");

var Behavior = require("./Behavior"),
    LocalVariable = require("../../reflect/LocalVariable"),
    BaseExpr = require("../BaseExpr"),
    Stmt = require("../Stmt");

/**
 * SetLocal behavior.
 * @param {string} name
 * @param {string} description
 * @param {number} returnType
 * @constructor
 * @extends stmt.behavior.Behavior
 * @exports stmt.behavior.SetLocalBehavior
 */
function SetLocalBehavior(name, description, returnType) {
    Behavior.call(this, name, description);

    /**
     * Expression return type, if an expression.
     * @type {number|null}
     */
    this.returnType = returnType || null;
}

module.exports = SetLocalBehavior;

// Extends Behavior
SetLocalBehavior.prototype = Object.create(Behavior.prototype);

// opcode + varint local variable index + Expr<local variable type> value
// Stmt & Expr<*>, Stmt with imm

SetLocalBehavior.prototype.read = function(s, op, imm) {
    var variable = s.local(imm !== null ? imm : s.varint());
    s.emit(variable);
    s.expect(s.state(variable.type));
};

SetLocalBehavior.prototype.validate = function(definition, stmt) {
    assert.strictEqual(stmt.operands.length, 2, "SetLocal requires exactly 2 operands");
    var variable = stmt.operands[0];
    assert(variable instanceof LocalVariable, "SetLocal variable (operand 0) must be a LocalVariable");
    assert.strictEqual(variable.definition, definition, "SetLocal variable (operand 0) must be part of this definition");
    if (this.returnType !== null)
        assert.strictEqual(variable.type, this.returnType, "SetLocal variable (operand 0) must be "+types.RTypeNames[this.returnType]);
    var expr = stmt.operands[1];
    assert(expr instanceof BaseExpr, "SetLocal value (operand 1) must be an expression");
    assert.strictEqual(expr.type, variable.type, "SetLocal value (operand 1) expression must be "+types.RTypeNames[variable.type]);
};

SetLocalBehavior.prototype.write = function(s, stmt) {
    var variable = stmt.operands[0],
        codeWithImm;
    if (variable.index <= types.ImmMax && (codeWithImm = stmt.codeWithImm) >= 0)
        s.code(codeWithImm, variable.index);
    else {
        s.code(stmt.code);
        s.varint(variable.index);
    }
    s.write(stmt.operands[1]);
};
