var assert = require("assert"),
    types = require("../../types");

var BaseBehavior = require("./BaseBehavior");

/**
 * Literal behavior.
 * @param {string} name
 * @param {string} description
 * @param {number} type
 * @constructor
 * @extends stmt.behavior.BaseBehavior
 * @exports stmt.behavior.LiteralBehavior
 */
function LiteralBehavior(name, description, type) {
    BaseBehavior.call(this, name, description);

    /**
     * Literal type.
     * @type {number}
     */
    this.type = type;
}

module.exports = LiteralBehavior;

// Extends Behavior
LiteralBehavior.prototype = Object.create(BaseBehavior.prototype);

// opcode + literal
// Expr<*>, Expr<I32> with imm

LiteralBehavior.prototype.read = function(s, code, imm) {
    if (this.type === types.Type.I32) {
        if (imm !== null)
            s.stmtWithoutImm(code, [ imm ]);
        else
            s.stmt(code, [ s.varint() ]);
    } else {
        var value;
        switch (this.type) {
            case types.Type.F32:
                value = s.f32();
                break;
            case types.Type.F64:
                value = s.f64();
                break;
            default:
                throw Error("unreachable");
        }
        s.stmt(code, [ value ]);
    }
};

LiteralBehavior.prototype.validate = function(definition, stmt) {
    assert.strictEqual(stmt.operands.length, 1, this.name+" requires exactly 1 operand");
    var value = stmt.operands[0];
    if (this.type === types.Type.I32)
        assert(typeof value === 'number' && value%1 === 0 && value >= 0, this.name+" value (operand 0) must be a non-negative integer");
    else
        assert(typeof value === 'number', this.name+" value (operand 0) must be a number");
};

LiteralBehavior.prototype.write = function(s, stmt) {
    var value = stmt.operands[0];
    if (this.type === types.Type.I32) {
        if (!s.codeWithImm(stmt.code, value)) {
            s.code(stmt.code);
            s.varint(value);
        }
    } else {
        s.code(stmt.code);
        switch (this.type) {
            case types.Type.F32:
                s.f32(value);
                break;
            case types.Type.F64:
                s.f64(value);
                break;
            default:
                throw Error("unreachable");
        }
    }
};
