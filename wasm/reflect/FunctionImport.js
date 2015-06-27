/**
 * A function import.
 * @constructor
 * @param {!Assembly} assembly
 * @param {string} name
 * @param {!Array.<number>} signatureIndexes
 */
var FunctionImport = module.exports = function(assembly, name, signatureIndexes) {

    /**
     * Assembly reference.
     * @type {!Assembly}
     */
    this.assembly = assembly;

    /**
     * Function import name.
     * @type {string}
     */
    this.name = name;

    /**
     * Function signatures.
     * @type {!Array.<!FunctionSignature>}
     */
    this.signatures = [];

    for (var i=0; i<signatureIndexes.length; ++i)
        this.signatures.push(assembly.getFunctionSignature(signatureIndexes[i]));
};
