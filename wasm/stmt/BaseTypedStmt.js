var BaseStmt = require("./BaseStmt");

/**
 * Abstract base class of all typed statements.
 * @constructor
 * @param {number} type
 * @param {number} code
 * @param {(number|!BaseStmt|!Array<number|!BaseStmt>)=} operands
 * @constructor
 * @extends BaseStmt
 * @abstract
 */
var BaseTypedStmt = module.exports = function(type, code, operands) {
    BaseStmt.call(this, code, operands);

    /**
     * Statement type.
     * @type {number}
     */
    this.type = type;
};

BaseTypedStmt.prototype = Object.create(BaseStmt.prototype);
