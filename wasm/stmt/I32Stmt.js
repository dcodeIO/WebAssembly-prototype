var types = require("../types"),
    BaseStmt = require("./BaseStmt");

/**
 * A typed I32 statement.
 * @constructor
 * @param {number} code
 * @param {(number|!BaseStmt|!Array<number|!BaseStmt>)=} operands
 * @constructor
 * @extends BaseStmt
 */
var I32Stmt = module.exports = function(code, operands) {
    BaseStmt.call(this, types.RType.I32, code, operands);
};

I32Stmt.prototype = Object.create(BaseStmt.prototype);
