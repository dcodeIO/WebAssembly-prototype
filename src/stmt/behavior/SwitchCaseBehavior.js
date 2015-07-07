var assert = require("assert"),
    types = require("../../types");

var BaseBehavior = require("./BaseBehavior"),
    Stmt = require("../Stmt");

/**
 * Switch case behavior.
 * @param {string} name
 * @param {string} description
 * @param {number} type
 * @constructor
 * @extends stmt.behavior.BaseBehavior
 * @exports stmt.behavior.SwitchCaseBehavior
 */
function SwitchCaseBehavior(name, description, type) {
    BaseBehavior.call(this, name, description);

    /**
     * Switch case type.
     * @type {number}
     */
    this.type = type;
}

module.exports = SwitchCaseBehavior;

// Extends Behavior
SwitchCaseBehavior.prototype = Object.create(BaseBehavior.prototype);

SwitchCaseBehavior.prototype.read = function(s, code) {
    s.code(code);
    var i, k;
    switch (this.type) {
        case types.SwitchCase.Case0:
            s.operand(s.varint_s());
            break;
        case types.SwitchCase.Case1:
            s.operand(s.varint_s());
            s.read(null);
            break;
        case types.SwitchCase.CaseN:
            s.operand(s.varint_s());
            for (i=0, k=s.varint(); i<k; ++i)
                s.read(null);
            break;
        case types.SwitchCase.Default0:
            break;
        case types.SwitchCase.Default1:
            s.read(null);
            break;
        case types.SwitchCase.DefaultN:
            for (i=0, k=s.varint(); i<k; ++i)
                s.read(null);
            break;
        default:
            throw Error("unreachable");
    }
};

SwitchCaseBehavior.prototype.validate = function(definition, stmt) {
    var label, i;
    switch (this.type) {
        case types.SwitchCase.Case0:
            assert.strictEqual(stmt.operands.length, 1, this.name+" requires exactly 1 operand");
            label = stmt.operands[0];
            assert(typeof label === 'number' && label%1 === 0, this.name+" label (operand 0) must be an integer");
            break;
        case types.SwitchCase.Case1:
            assert.strictEqual(stmt.operands.length, 2, this.name+" requires exactly 2 operands");
            label = stmt.operands[0];
            assert(typeof label === 'number' && label%1 === 0, this.name+" label (operand 0) must be an integer");
            assert(stmt.operands[1] instanceof Stmt, this.name+" operand 1 must be a statement");
            break;
        case types.SwitchCase.CaseN:
            assert(stmt.operands.length >= 1, this.name+" requires at least 1 operand");
            label = stmt.operands[0];
            assert(typeof label === 'number' && label%1 === 0, this.name+" label (operand 0) must be an integer");
            for (i=1; i<stmt.operands.length; ++i)
                assert(stmt.operands[i] instanceof Stmt, this.name+" operand "+i+" must be a statement");
            break;
        case types.SwitchCase.Default0:
            break;
        case types.SwitchCase.Default1:
            assert.strictEqual(stmt.operands.length, 1, this.name+" requires exactly 1 operand");
            assert(stmt.operands[0] instanceof Stmt, this.name+" operand 0 must be a statement");
            break;
        case types.SwitchCase.DefaultN:
            for (i=0; i<stmt.operands.length; ++i)
                assert(stmt.operands[i] instanceof Stmt, this.name+" operand "+i+" must be a statement");
            break;
        default:
            throw Error("unreachable");
    }
};

SwitchCaseBehavior.prototype.write = function(s, stmt) {
    s.u8(stmt.code);
    var i, k;
    switch (this.type) {
        case types.SwitchCase.Case0:
            s.varint_s(stmt.operands[0]);
            break;
        case types.SwitchCase.Case1:
            s.varint_s(stmt.operands[0]);
            s.write(stmt.operands[1]);
            break;
        case types.SwitchCase.CaseN:
            s.varint_s(stmt.operands[0]);
            for (i=1, k=stmt.operands.length; i<k; ++i)
                s.write(stmt.operands[i]);
            break;
        case types.SwitchCase.Default0:
            break;
        case types.SwitchCase.Default1:
            s.write(stmt.operands[0]);
            break;
        case types.SwitchCase.DefaultN:
            s.varint(stmt.operands.length);
            for (i=0, k=stmt.operands.length; i<k; ++i)
                s.write(stmt.operands[i]);
            break;
        default:
            throw Error("unreachable");
    }
};
