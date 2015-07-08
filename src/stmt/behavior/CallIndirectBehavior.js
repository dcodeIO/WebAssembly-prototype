var assert = require("assert"),
    types = require("../../types");

var BaseBehavior = require("./BaseBehavior"),
    BaseExpr = require("../BaseExpr"),
    FunctionPointerTable = require("../../reflect/FunctionPointerTable");

/**
 * CallIndirect behavior.
 * @param {string} name
 * @param {string} description
 * @param {number} returnType
 * @constructor
 * @extends stmt.behavior.BaseBehavior
 * @exports stmt.behavior.CallIndirectBehavior
 */
function CallIndirectBehavior(name, description, returnType) {
    BaseBehavior.call(this, name, description);

    /**
     * Return type, if any.
     * @type {number}
     */
    this.returnType = returnType;
}

module.exports = CallIndirectBehavior;

// Extends Behavior
CallIndirectBehavior.prototype = Object.create(BaseBehavior.prototype);

// opcode + function pointer table index + Expr<I32> element index + argument list as Expr<args[i] type>
// Stmt & Expr<*>, all without imm

CallIndirectBehavior.prototype.read = function(s, code) {
    var functionPointerTable = s.indirect(s.varint());
    s.stmt(code, [ functionPointerTable ]);
    s.read(types.WireType.ExprI32);
    functionPointerTable.signature.argumentTypes.forEach(function(type) {
        s.read(type);
    }, this);
};

CallIndirectBehavior.prototype.validate = function(definition, stmt) {
    assert(stmt.operands.length >= 2, this.name+" requires at least 2 operands");
    var func = stmt.operands[0];
    assert(func instanceof FunctionPointerTable, this.name+" function (operand 0) must be a FunctionPointerTable");
    assert.strictEqual(func.assembly, definition.declaration.assembly, this.name+" function (operand 0) must be part of this assembly");
    assert.strictEqual(func.signature.returnType, this.returnType, this.name+" function (operand 0) return type must be "+types.RTypeNames[this.returnType]);
    assert.strictEqual(stmt.operands.length, 2+func.signature.argumentTypes.length, this.name+" requires exactly "+(2+func.signature.argumentTypes.length)+" operands");
    var expr = stmt.operands[1];
    assert(expr instanceof BaseExpr, this.name+" element index (operand 1) must be an expression");
    assert.strictEqual(expr.type, types.RType.I32, this.name+" element index (operand 1) expression must be "+types.RTypeNames[types.RType.I32]);
    func.signature.argumentTypes.forEach(function(type, i) {
        var expr = stmt.operands[2+i];
        assert(expr instanceof BaseExpr, this.name+" argument "+i+" (operand "+(2+i)+") must be an expression");
        assert.strictEqual(expr.type, type, this.name+" argument "+i+" (operand "+(2+i)+") expression must be "+types.RTypeNames[type]);
    }, this);
};

CallIndirectBehavior.prototype.write = function(s, stmt) {
    s.u8(stmt.code);
    s.varint(stmt.operands[0].index);
    s.write(stmt.operands[1]);
    for (var i=2; i<stmt.operands.length; ++i)
        s.write(stmt.operands[i]);
};
