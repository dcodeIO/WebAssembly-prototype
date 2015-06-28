var types = require("../types"),
    BaseStmt = require("./BaseStmt");

/**
 * A typed F32 statement.
 * @constructor
 * @param {number} code
 * @param {(number|!BaseStmt|!Array<number|!BaseStmt>)=} operands
 * @constructor
 * @extends BaseStmt
 */
var F32Stmt = module.exports = function(code, operands) {
    BaseStmt.call(this, types.RType.F32, code, operands);
};

F32Stmt.prototype = Object.create(BaseStmt.prototype);
