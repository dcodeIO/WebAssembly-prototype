var types = require("../types");

/**
 * A function signature.
 * @constructor
 * @param {!Assembly} assembly
 * @param {number} index
 * @param {number=} returnType
 * @param {!Array.<number>=} argumentTypes
 */
var FunctionSignature = module.exports = function(assembly, index, returnType, argumentTypes) {

    /**
     * Assembly reference.
     * @type {!Assembly}
     */
    this.assembly = assembly;

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

/**
 * Returns a string representation of this signature.
 * @returns {string}
 */
FunctionSignature.prototype.toString = function() {
    var sb = [];
    sb.push("FunctionSignature idx:", this.index.toString(), " ", types.RTypeNames[this.returnType], "(");
    for (var i=0; i<this.argumentTypes.length; ++i) {
        if (i>0)
            sb.push(",");
        sb.push(types.TypeNames[this.argumentTypes[i]]);
    }
    sb.push(")");
    return sb.join("");
};
