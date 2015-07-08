var assert = require("assert"),
    types = require("../../types");

var BaseBehavior = require("./BaseBehavior"),
    LocalVariable = require("../../reflect/LocalVariable"),
    BaseExpr = require("../BaseExpr"),
    Stmt = require("../Stmt");

/**
 * SetLocal behavior.
 * @param {string} name
 * @param {string} description
 * @param {number} wireType
 * @constructor
 * @extends stmt.behavior.BaseBehavior
 * @exports stmt.behavior.SetLocalBehavior
 */
function SetLocalBehavior(name, description, wireType) {
    BaseBehavior.call(this, name, description);

    /**
     * Expression return type, if an expression.
     * @type {number}
     */
    this.wireType = wireType;
}

module.exports = SetLocalBehavior;

// Extends Behavior
SetLocalBehavior.prototype = Object.create(BaseBehavior.prototype);

// opcode + varint local variable index + Expr<local variable type> value
// Stmt & Expr<*>, Stmt with imm

SetLocalBehavior.prototype.read = function(s, code, imm) {
    var variable;
    if (imm !== null)
        s.stmtWithoutImm(code, [ variable = s.local(imm, this.wireType !== types.WireType.Stmt ? this.wireType : undefined) ]);
    else
        s.stmt(code, [ variable = s.local(s.varint(), this.wireType !== types.WireType.Stmt ? this.wireType : undefined) ]);
    s.read(this.wireType === types.WireType.Stmt ? variable.type : this.wireType);
};

SetLocalBehavior.prototype.validate = function(definition, stmt) {
    assert.strictEqual(stmt.operands.length, 2, "SetLocal requires exactly 2 operands");
    var variable = stmt.operands[0];
    assert(variable instanceof LocalVariable, "SetLocal variable (operand 0) must be a LocalVariable");
    assert.strictEqual(variable.definition, definition, "SetLocal variable (operand 0) must be part of this definition");
    if (this.wireType !== types.WireType.Stmt)
        assert.strictEqual(variable.type, this.wireType, "SetLocal variable (operand 0) must be "+types.TypeNames[this.returnType]);
    var expr = stmt.operands[1];
    assert(expr instanceof BaseExpr, "SetLocal value (operand 1) must be an expression");
    assert.strictEqual(expr.type, variable.type, "SetLocal value (operand 1) expression must be "+types.WireTypeNames[variable.type]);
};

SetLocalBehavior.prototype.write = function(s, stmt) {
    var index = stmt.operands[0].index;
    if (!s.codeWithImm(stmt.code, index)) {
        s.code(stmt.code);
        s.varint(index);
    }
    s.write(stmt.operands[1]);
};
