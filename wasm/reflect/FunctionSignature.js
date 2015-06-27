/**
 * A function signature.
 * @constructor
 * @param {number} index
 * @param {number=} returnType
 * @param {!Array.<number>=} argumentTypes
 */
var FunctionSignature = module.exports = function(index, returnType, argumentTypes) {

    /**
     * Signature index.
     * @type {number}
     */
    this.index = index;

    /**
     * Return type.
     * @type {number}
     */
    this.returnType = returnType;

    /**
     * Array of argument types.
     * @type {!Array.<number>}
     */
    this.argumentTypes = argumentTypes || [];
};
