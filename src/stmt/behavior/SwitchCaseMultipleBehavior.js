var assert = require("assert"),
    types = require("../../types");

var BaseBehavior = require("./BaseBehavior"),
    Stmt = require("../Stmt");

/**
 * Switch case with multiple statements behavior.
 * @param {string} name
 * @param {string} description
 * @constructor
 * @extends stmt.behavior.BaseBehavior
 * @exports stmt.behavior.SwitchCaseMultipleBehavior
 */
function SwitchCaseMultipleBehavior(name, description) {
    BaseBehavior.call(this, name, description);
}

module.exports = SwitchCaseMultipleBehavior;

// Extends BaseBehavior
SwitchCaseMultipleBehavior.prototype = Object.create(BaseBehavior.prototype);

// opcode + signed varint label + varint count + count * Stmt
// SwitchCase only, without imm

SwitchCaseMultipleBehavior.prototype.read = function(s, code) {
    var label = s.varint_s(),
        count = s.varint();
    s.stmt(code, [ label ]);
    for (var i=0; i<count; ++i)
        s.read(types.WireType.Stmt);
};

SwitchCaseMultipleBehavior.prototype.validate = function(definition, stmt) {
    assert(stmt.operands.length >= 1, this.name+" requires at least 1 operand");
    var label = stmt.operands[0];
    assert(typeof label === 'number' && label%1 === 0, this.name+" label (operand 0) must be an integer");
    for (var i=1; i<stmt.operands.length; ++i)
        assert(stmt.operands[i] instanceof Stmt, this.name+" operand "+i+" must be a statement");
};

SwitchCaseMultipleBehavior.prototype.write = function(s, stmt) {
    s.code(stmt.code);
    s.varint_s(stmt.operands[0]);
    s.varint(stmt.operands.length-1);
    for (var i=1, k=stmt.operands.length; i<k; ++i)
        s.write(stmt.operands[i]);
};
