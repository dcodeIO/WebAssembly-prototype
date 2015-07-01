var types = require("../types"),
    BaseStmt = require("./BaseStmt");

/**
 * A (non-typed) statement.
 * @constructor
 * @param {number} code
 * @param {(number|!BaseStmt|!Array<number|!BaseStmt>)=} operands
 * @constructor
 * @extends BaseStmt
 * @exports stmt.Stmt
 */
var Stmt = module.exports = function(code, operands) {
    BaseStmt.call(this, undefined, code, operands);
};

Stmt.prototype = Object.create(BaseStmt.prototype);
