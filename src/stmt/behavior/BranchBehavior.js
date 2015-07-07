var assert = require("assert"),
    types = require("../../types");

var Behavior = require("./Behavior"),
    Stmt = require("../Stmt"),
    BaseExpr = require("../BaseExpr");

/**
 * Branch behavior.
 * @param {string} name
 * @param {string} description
 * @param {number|null|!Array.<number|null>} types
 * @constructor
 * @extends stmt.behavior.Behavior
 * @exports stmt.behavior.BranchBehavior
 */
function BranchBehavior(name, description, types) {
    Behavior.call(this, name, description);

    /**
     * Expression types.
     * @type {!Array.<number|null>}
     */
    this.types = Array.isArray(types)
        ? types
        : [types];
}

module.exports = BranchBehavior;

BranchBehavior.prototype = Object.create(Behavior.prototype);

// opcode + Expr<*> value [...]
// Expr<*>, all without imm

BranchBehavior.prototype.read = function(s, code, imm) {
    s.emit();
    this.types.forEach(function(type) {
        s.expect(s.state(type));
    }, this);
};

BranchBehavior.prototype.validate = function(definition, stmt) {
    assert.strictEqual(stmt.operands.length, this.types.length, "Branch requires exactly "+this.types.length+" operands");
    this.types.forEach(function(type, i) {
        if (type === null)
            assert(stmt.operands[i] instanceof Stmt, "Branch operand "+i+" must be a statement");
        else {
            assert(stmt.operands[i] instanceof BaseExpr, "Branch operand "+i+ " must be an expression");
            assert.strictEqual(stmt.operands[i].type, type, "Branch operand "+i+" expression must be "+types.RTypeNames[type]);
        }
    }, this);
};

BranchBehavior.prototype.write = function(s, stmt) {
    s.code(stmt.code);
    stmt.operands.forEach(function(subStmt) {
        s.write(subStmt);
    });
};
