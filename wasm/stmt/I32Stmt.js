var types = require("../types"),
    BaseTypedStmt = require("./BaseTypedStmt");

/**
 * A typed I32 statement.
 * @constructor
 * @param {number} code
 * @param {(number|!BaseStmt|!Array<number|!BaseStmt>)=} operands
 * @constructor
 * @extends BaseTypedStmt
 */
var I32Stmt = module.exports = function(code, operands) {
    BaseTypedStmt.call(this, types.Type.I32, code, operands);
};

I32Stmt.prototype = Object.create(BaseTypedStmt.prototype);
