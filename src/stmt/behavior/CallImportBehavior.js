var assert = require("assert"),
    types = require("../../types");

var BaseBehavior = require("./BaseBehavior"),
    BaseExpr = require("../BaseExpr"),
    FunctionImportSignature = require("../../reflect/FunctionImportSignature");

/**
 * CallImport behavior.
 * @param {string} name
 * @param {string} description
 * @param {number} returnType
 * @constructor
 * @extends stmt.behavior.BaseBehavior
 * @exports stmt.behavior.CallImportBehavior
 */
function CallImportBehavior(name, description, returnType) {
    BaseBehavior.call(this, name, description);

    /**
     * Return type, if any.
     * @type {number}
     */
    this.returnType = returnType;
}

module.exports = CallImportBehavior;

// Extends Behavior
CallImportBehavior.prototype = Object.create(BaseBehavior.prototype);

// opcode + import function index + argument list as Expr<args[i] type>
// Stmt & Expr<*>, all without imm

CallImportBehavior.prototype.read = function(s, code) {
    var functionImportSignature = s.import(s.varint());
    s.stmt(code);
    s.operand(functionImportSignature);
    functionImportSignature.signature.argumentTypes.forEach(function(type) {
        s.read(type);
    }, this);
};

CallImportBehavior.prototype.validate = function(definition, stmt) {
    assert(stmt.operands.length >= 1, this.name+" requires at least 1 operand");
    var func = stmt.operands[0];
    assert(func instanceof FunctionImportSignature, this.name+" function (operand 0) must be a FunctionImportSignature");
    assert.strictEqual(func.assembly, definition.declaration.assembly, this.name+" function (operand 0) must be part of this assembly");
    assert.strictEqual(func.signature.returnType, this.returnType, this.name+" function (operand 0) return type must be "+types.RTypeNames[this.returnType]);
    assert.strictEqual(stmt.operands.length, 1+func.signature.argumentTypes.length, this.name+" requires exactly "+(1+func.signature.argumentTypes.length)+" operands");
    func.signature.argumentTypes.forEach(function(type, i) {
        var expr = stmt.operands[1+i];
        assert(expr instanceof BaseExpr, this.name+" argument "+i+" (operand "+(1+i)+") must be an expression");
        assert.strictEqual(expr.type, type, this.name+" argument "+i+" (operand "+(1+i)+") expression must be "+types.RTypeNames[type]);
    }, this);
};

CallImportBehavior.prototype.write = function(s, stmt) {
    s.u8(stmt.code);
    s.varint(stmt.operands[0].index);
    for (var i=1; i<stmt.operands.length; ++i)
        s.write(stmt.operands[i]);
};
