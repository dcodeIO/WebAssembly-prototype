var assert = require("assert"),
    types = require("../../types"),
    util = require("../../util");

var BaseBehavior = require("./BaseBehavior"),
    GlobalVariable = require("../../reflect/GlobalVariable"),
    BaseExpr = require("../BaseExpr"),
    Stmt = require("../Stmt");

/**
 * SetGlobal behavior.
 * @param {string} name
 * @param {string} description
 * @param {number} type
 * @constructor
 * @extends stmt.behavior.BaseBehavior
 * @exports stmt.behavior.SetGlobalBehavior
 */
function SetGlobalBehavior(name, description, wireType) {
    BaseBehavior.call(this, name, description);

    /**
     * Wire type.
     * @type {number}
     */
    this.wireType = wireType;
}

module.exports = SetGlobalBehavior;

// Extends Behavior
SetGlobalBehavior.prototype = Object.create(BaseBehavior.prototype);

// opcode + varint global variable index + Expr<global variable type> value
// Stmt & Expr<*>, Stmt with imm

SetGlobalBehavior.prototype.read = function(s, code, imm) {
    var variable;
    if (imm !== null)
        s.stmtWithoutImm(code, [ variable = s.global(imm, this.wireType !== types.WireType.Stmt ? this.wireType : undefined) ]);
    else
        s.stmt(code, [ variable = s.global(s.varint(), this.wireType !== types.WireType.Stmt ? this.wireType : undefined) ]);
    s.read(this.wireType === types.WireType.Stmt ? variable.type : this.wireType);
};

SetGlobalBehavior.prototype.validate = function(definition, stmt) {
    assert.strictEqual(stmt.operands.length, 2, "SetGlobal requires exactly 2 operands");
    var variable = stmt.operands[0];
    assert(variable instanceof GlobalVariable, "SetGlobal variable (operand 0) must be a GlobalVariable");
    assert.strictEqual(variable.assembly, definition.declaration.assembly, "SetGlobal variable (operand 0) must be part of this assembly");
    if (this.wireType !== types.WireType.Stmt)
        assert.strictEqual(variable.type, this.wireType, "SetGlobal variable (operand 0) must be "+types.TypeNames[this.wireType]);
    var expr = stmt.operands[1];
    assert(expr instanceof BaseExpr, "SetGlobal value (operand 1) must be an expression");
    assert.strictEqual(expr.type, variable.type, "SetGlobal value (operand 1) expression must be "+types.WireTypeNames[variable.type]);
};

SetGlobalBehavior.prototype.write = function(s, stmt) {
    var index = stmt.operands[0].index;
    if (!s.codeWithImm(stmt.code, index)) {
        s.code(stmt.code);
        s.varint(index);
    }
    s.write(stmt.operands[1]);
};
