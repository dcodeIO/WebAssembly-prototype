var assert = require("assert"),
    types = require("../../types");

var BaseBehavior = require("./BaseBehavior"),
    Stmt = require("../Stmt");

/**
 * Switch default with multiple statements behavior.
 * @param {string} name
 * @param {string} description
 * @constructor
 * @extends stmt.behavior.BaseBehavior
 * @exports stmt.behavior.SwitchDefaultMultipleBehavior
 */
function SwitchDefaultMultipleBehavior(name, description) {
    BaseBehavior.call(this, name, description);
}

module.exports = SwitchDefaultMultipleBehavior;

// Extends BaseBehavior
SwitchDefaultMultipleBehavior.prototype = Object.create(BaseBehavior.prototype);

// opcode + varint count + count * Stmt
// SwitchCase only, without imm

SwitchDefaultMultipleBehavior.prototype.read = function(s, code) {
    var count = s.varint();
    s.stmt(code);
    for (var i=0; i<count; ++i)
        s.read(types.WireType.Stmt);
};

SwitchDefaultMultipleBehavior.prototype.validate = function(definition, stmt) {
    for (var i=0; i<stmt.operands.length; ++i)
        assert(stmt.operands[i] instanceof Stmt, this.name+" operand "+i+" must be a statement");
};

SwitchDefaultMultipleBehavior.prototype.write = function(s, stmt) {
    s.code(stmt.code);
    s.varint(stmt.operands.length);
    for (var i=0, k=stmt.operands.length; i<k; ++i)
        s.write(stmt.operands[i]);
};
