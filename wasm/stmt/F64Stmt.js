var types = require("../types"),
    BaseTypedStmt = require("./BaseTypedStmt");

/**
 * A typed F64 statement.
 * @constructor
 * @param {number} code
 * @param {(number|!BaseStmt|!Array<number|!BaseStmt>)=} operands
 * @constructor
 * @extends BaseTypedStmt
 */
var F64Stmt = module.exports = function(code, operands) {
    BaseTypedStmt.call(this, types.Type.F64,code, operands);
};

F64Stmt.prototype = Object.create(BaseTypedStmt.prototype);
