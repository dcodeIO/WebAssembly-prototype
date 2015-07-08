var assert = require("assert"),
    types = require("../../types");

var BaseBehavior = require("./BaseBehavior"),
    BaseExpr = require("../BaseExpr");

/**
 * Comma behavior.
 * @param {string} name
 * @param {string} description
 * @param {number} returnType
 * @constructor
 * @extends stmt.behavior.BaseBehavior
 * @exports stmt.behavior.CommaBehavior
 */
function CommaBehavior(name, description, returnType) {
    BaseBehavior.call(this, name, description);

    /**
     * Return type.
     * @type {number}
     */
    this.returnType = returnType;
}

module.exports = CommaBehavior;

// Extends Behavior
CommaBehavior.prototype = Object.create(BaseBehavior.prototype);

// opcode + U8 RType + Expr<previous RType> left + Expr<*> right
// Expr<*>, all without imm

CommaBehavior.prototype.read = function(s, code) {
    var rtype = s.u8();
    s.stmt(code);
    switch (rtype) {
        case types.RType.I32:
        case types.RType.F32:
        case types.RType.F64:
        case types.RType.Void:
            s.read(rtype);
            break;
        default:
            throw Error("illegal left hand return type: "+rtype);
    }
    s.read(this.returnType);
};

CommaBehavior.prototype.validate = function(definition, stmt) {
    assert.strictEqual(stmt.operands.length, 2, this.name+" requires exactly 2 operands");
    assert(stmt.operands[0] instanceof BaseExpr, this.name+" left (operand 0) must be an expression");
    var right = stmt.operands[1];
    assert(right instanceof BaseExpr, this.name+" right (operand 1) must be an expression");
    assert.strictEqual(right.type, this.returnType, this.name+" right (operand 1) expression must be "+types.RTypeNames[this.returnType]);
};

CommaBehavior.prototype.write = function(s, stmt) {
    s.code(stmt.code);
    s.u8(stmt.operands[0].type);
    s.write(stmt.operands[0]);
    s.write(stmt.operands[1]);
};
