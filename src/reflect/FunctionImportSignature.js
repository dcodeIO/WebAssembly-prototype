/**
 * A function import signature.
 * @constructor
 * @param {!Assembly} assembly
 * @param {number} signatureIndex
 * @param {number} functionImportIndex
 */
var FunctionImportSignature = module.exports = function(assembly, index, signatureIndex, functionImportIndex) {

    /**
     * Assembly reference.
     * @type {!Assembly}
     */
    this.assembly = assembly;

    /**
     * Function import signature index.
     * @type {number}
     */
    this.index = index;

    /**
     * Function signature.
     * @type {!FunctionSignature}
     */
    this.signature = assembly.getFunctionSignature(signatureIndex);

    /**
     * Function import.
     * @type {!FunctionImport}
     */
    this.import = assembly.getFunctionImport(functionImportIndex);
};

/**
 * Returns a string representation of this function import signature.
 * @returns {string}
 */
FunctionImportSignature.prototype.toString = function() {
    return "FunctionImportSignature "
         + " idx:" + this.index
         + " sig:" + this.signature.index
         + " imp:" + this.import.index;
};
