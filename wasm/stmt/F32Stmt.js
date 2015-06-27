var types = require("../types"),
    BaseTypedStmt = require("./BaseTypedStmt");

/**
 * A typed F32 statement.
 * @constructor
 * @param {number} code
 * @param {(number|!BaseStmt|!Array<number|!BaseStmt>)=} operands
 * @constructor
 * @extends BaseTypedStmt
 */
var F32Stmt = module.exports = function(code, operands) {
    BaseTypedStmt.call(this, types.Type.F32, code, operands);
};

F32Stmt.prototype = Object.create(BaseTypedStmt.prototype);
