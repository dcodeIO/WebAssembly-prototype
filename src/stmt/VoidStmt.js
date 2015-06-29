var types = require("../types"),
    BaseStmt = require("./BaseStmt");

/**
 * An explicit void expression.
 * @constructor
 * @param {number} code
 * @param {(number|!BaseStmt|!Array<number|!BaseStmt>)=} operands
 * @constructor
 * @extends BaseStmt
 */
var VoidStmt = module.exports = function(code, operands) {
    BaseStmt.call(this, types.RType.Void, code, operands);
};

VoidStmt.prototype = Object.create(BaseStmt.prototype);
