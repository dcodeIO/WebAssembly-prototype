var FunctionPointerElement = require("./FunctionPointerElement");

/**
 * A function pointer table.
 * @constructor
 * @param {!Assembly} assembly
 * @param {number} index
 * @param {number} signatureIndex
 * @param {!Array.<number>} elements
 */
var FunctionPointerTable = module.exports = function(assembly, index, signatureIndex, elements) {

    /**
     * Assembly reference.
     * @type {!Assembly}
     */
    this.assembly = assembly;

    /**
     * Table index.
     * @type {number}
     */
    this.index = index;

    /**
     * Signature.
     * @type {!FunctionSignature}
     */
    this.signature = assembly.getFunctionSignature(signatureIndex);

    /**
     * Elements.
     * @type {!Array.<!FunctionPointerElement>}
     */
    this.elements = [];
    for (var i=0; i<elements.length; ++i)
        this.elements.push(new FunctionPointerElement(this, elements[i]));
};

/**
 * Returns a string representation of this function pointer table.
 * @returns {string}
 */
FunctionPointerTable.prototype.toString = function() {
    return "FunctionPointerTable " + this.index.toString() + " " + this.signature.index + " " + this.elements.length;
};
