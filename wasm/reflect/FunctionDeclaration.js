var FunctionSignature = require("./FunctionSignature");

/**
 * A function declaration.
 * @constructor
 * @param {!Assembly} assembly
 * @param {number|!FunctionSignature} signatureOrIndex
 */
var FunctionDeclaration = module.exports = function(assembly, signatureOrIndex) {

    /**
     * Assembly reference.
     * @type {!Assembly}
     */
    this.assembly = assembly;

    /**
     * Signature reference.
     * @type {!FunctionSignature}
     */
    this.signature;
    if (signatureOrIndex instanceof FunctionSignature)
        this.signature = assembly.getSignature(signatureOrIndex.index);
    else
        this.signature = assembly.getSignature(signatureOrIndex);
};
