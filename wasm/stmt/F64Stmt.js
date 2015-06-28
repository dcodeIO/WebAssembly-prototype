var types = require("../types"),
    BaseStmt = require("./BaseStmt");

/**
 * A typed F64 statement.
 * @constructor
 * @param {number} code
 * @param {(number|!BaseStmt|!Array<number|!BaseStmt>)=} operands
 * @constructor
 * @extends BaseStmt
 */
var F64Stmt = module.exports = function(code, operands) {
    BaseStmt.call(this, types.RType.F64, code, operands);
};

F64Stmt.prototype = Object.create(BaseStmt.prototype);
