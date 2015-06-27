var types = require("../types"),
    BaseStmt = require("./BaseStmt");

/**
 * A (non-typed) statement.
 * @constructor
 * @param {number} code
 * @param {(number|!BaseStmt|!Array<number|!BaseStmt>)=} operands
 * @constructor
 * @extends BaseStmt
 */
var Stmt = module.exports = function(code, operands) {
    BaseStmt.call(this, code, operands);
};

Stmt.prototype = Object.create(BaseStmt.prototype);
