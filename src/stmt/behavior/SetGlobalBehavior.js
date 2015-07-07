var assert = require("assert"),
    types = require("../../types");

var BaseBehavior = require("./BaseBehavior"),
    GlobalVariable = require("../../reflect/GlobalVariable"),
    BaseExpr = require("../BaseExpr"),
    Stmt = require("../Stmt");

/**
 * SetGlobal behavior.
 * @param {string} name
 * @param {string} description
 * @param {number} returnType
 * @constructor
 * @extends stmt.behavior.BaseBehavior
 * @exports stmt.behavior.SetGlobalBehavior
 */
function SetGlobalBehavior(name, description, returnType) {
    BaseBehavior.call(this, name, description);

    /**
     * Expression return type, if an expression.
     * @type {number|null}
     */
    this.returnType = returnType || null;
}

module.exports = SetGlobalBehavior;

// Extends Behavior
SetGlobalBehavior.prototype = Object.create(BaseBehavior.prototype);

// opcode + varint global variable index + Expr<global variable type> value
// Stmt & Expr<*>, Stmt with imm

SetGlobalBehavior.prototype.read = function(s, code, imm) {
    var variable;
    if (imm !== null) {
        s.code(s.without_imm(code));
        s.operand(variable = s.global(imm));
    } else {
        s.code(code);
        s.operand(variable = s.global(s.varint()));
    }
    s.read(variable.type);
};

SetGlobalBehavior.prototype.validate = function(definition, stmt) {
    assert.strictEqual(stmt.operands.length, 2, "SetGlobal requires exactly 2 operands");
    var variable = stmt.operands[0];
    assert(variable instanceof GlobalVariable, "SetGlobal variable (operand 0) must be a GlobalVariable");
    assert.strictEqual(variable.assembly, definition.declaration.assembly, "SetGlobal variable (operand 0) must be part of this assembly");
    if (this.returnType !== null)
        assert.strictEqual(variable.type, this.returnType, "SetGlobal variable (operand 0) must be "+types.RTypeNames[this.returnType]);
    var expr = stmt.operands[1];
    assert(expr instanceof BaseExpr, "SetGlobal value (operand 1) must be an expression");
    assert.strictEqual(expr.type, variable.type, "SetGlobal value (operand 1) expression must be "+types.RTypeNames[variable.type]);
};

SetGlobalBehavior.prototype.write = function(s, stmt) {
    var variable = stmt.operands[0],
        codeWithImm;
    if (variable.index <= types.ImmMax && (codeWithImm = s.with_imm(stmt.code)) >= 0)
        s.code(codeWithImm, variable.index);
    else {
        s.code(stmt.code);
        s.varint(variable.index);
    }
    s.write(stmt.operands[1]);
};
