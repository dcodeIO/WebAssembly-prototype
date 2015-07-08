var assert = require("assert"),
    types = require("../../types");

var BaseBehavior = require("./BaseBehavior"),
    BaseExpr = require("../BaseExpr"),
    FunctionDeclaration = require("../../reflect/FunctionDeclaration");

/**
 * CallInternal behavior.
 * @param {string} name
 * @param {string} description
 * @param {number} returnType
 * @constructor
 * @extends stmt.behavior.BaseBehavior
 * @exports stmt.behavior.CallInternalBehavior
 */
function CallInternalBehavior(name, description, returnType) {
    BaseBehavior.call(this, name, description);

    /**
     * Return type, if any.
     * @type {number}
     */
    this.returnType = returnType;
}

module.exports = CallInternalBehavior;

// Extends Behavior
CallInternalBehavior.prototype = Object.create(BaseBehavior.prototype);

// opcode + internal function index + argument list as Expr<args[i] type>
// Stmt & Expr<*>, all without imm

CallInternalBehavior.prototype.read = function(s, code) {
    var functionDeclaration = s.internal(s.varint());
    s.stmt(code, [ functionDeclaration ]);
    functionDeclaration.signature.argumentTypes.forEach(function(type) {
        s.read(type);
    }, this);
};

CallInternalBehavior.prototype.validate = function(definition, stmt) {
    assert(stmt.operands.length >= 1, this.name+" requires at least 1 operand");
    var func = stmt.operands[0];
    assert(func instanceof FunctionDeclaration, this.name+" function (operand 0) must be a FunctionDeclaration");
    assert.strictEqual(func.assembly, definition.declaration.assembly, this.name+" function (operand 0) must be part of this assembly");
    assert.strictEqual(func.declaration.signature.returnType, this.returnType, this.name+" function (operand 0) return type must be "+types.RTypeNames[this.returnType]);
    assert.strictEqual(stmt.operands.length, 1+func.signature.argumentTypes.length, this.name+" requires exactly "+(1+func.signature.argumentTypes.length)+" operands");
    func.signature.argumentTypes.forEach(function(type, i) {
        var expr = stmt.operands[1+i];
        assert(expr instanceof BaseExpr, this.name+" argument "+i+" (operand "+(1+i)+") must be an expression");
        assert.strictEqual(expr.type, type, this.name+" argument "+i+" (operand "+(1+i)+") expression must be "+types.RTypeNames[type]);
    }, this);
};

CallInternalBehavior.prototype.write = function(s, stmt) {
    s.code(stmt.code);
    s.varint(stmt.operands[0].index);
    for (var i=1; i<stmt.operands.length; ++i)
        s.write(stmt.operands[i]);
};
