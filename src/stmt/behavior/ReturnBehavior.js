var assert = require("assert"),
    types = require("../../types");

var BaseBehavior = require("./BaseBehavior"),
    BaseExpr = require("../BaseExpr");

/**
 * Return behavior.
 * @param {string} name
 * @param {string} description
 * @constructor
 * @extends stmt.behavior.BaseBehavior
 * @exports stmt.behavior.ReturnBehavior
 */
function ReturnBehavior(name, description) {
    BaseBehavior.call(this, name, description);
}

module.exports = ReturnBehavior;

// Extends Behavior
ReturnBehavior.prototype = Object.create(BaseBehavior.prototype);

// opcode [ + Expr<function return type> if function return type is not void ]
// Stmt only, without imm

ReturnBehavior.prototype.read = function(s, code, imm) {
    var rtype = s.rtype();
    s.stmt(code);
    if (rtype !== types.RType.Void)
        s.read(rtype);
};

ReturnBehavior.prototype.validate = function(definition, stmt) {
    var rtype = definition.declaration.signature.returnType;
    if (rtype === types.RType.Void)
        assert.strictEqual(stmt.operands.length, 0, this.name+" requires exactly 0 operands");
    else {
        assert.strictEqual(stmt.operands.length, 1, this.name+" requires exactly 1 operand");
        var expr = stmt.operands[0];
        assert(expr instanceof BaseExpr, this.name+" return value (operand 0) must be an expression");
        assert.strictEqual(expr.type, rtype, this.name+" return value (operand 0) expression must be "+types.RTypeNames[rtype]);
    }
};

ReturnBehavior.prototype.write = function(s, stmt) {
    var rtype = s.rtype();
    s.code(stmt.code);
    if (rtype !== types.RType.Void)
        s.write(stmt.operands[0]);
};
