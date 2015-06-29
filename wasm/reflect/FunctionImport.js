/**
 * A function import.
 * @constructor
 * @param {!Assembly} assembly
 * @param {string} name
 * @param {!Array.<number>} signatureIndexes
 */
var FunctionImport = module.exports = function(assembly, index, importName, signatureIndexes) {

    /**
     * Assembly reference.
     * @type {!Assembly}
     */
    this.assembly = assembly;

    /**
     * Function import index.
     * @type {number}
     */
    this.index = index;

    /**
     * Function import name.
     * @type {string}
     */
    this.importName = importName;

    /**
     * Function signatures.
     * @type {!Array.<!FunctionSignature>}
     */
    this.signatures = [];

    for (var i=0; i<signatureIndexes.length; ++i)
        this.signatures.push(assembly.getFunctionSignature(signatureIndexes[i]));
};

/**
 * Returns a string representation of this import.
 * @returns {string}
 */
FunctionImport.prototype.toString = function() {
    return "FunctionImport " + "foreign." + this.importName
         + " idx:" + this.index
         + " sigs:" + this.signatures.length;
};
