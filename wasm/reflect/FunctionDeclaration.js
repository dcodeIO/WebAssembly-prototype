var FunctionSignature = require("./FunctionSignature");

/**
 * A function declaration.
 * @constructor
 * @param {!Assembly} assembly
 * @param {number} index
 * @param {number|!FunctionSignature} signatureOrIndex
 */
var FunctionDeclaration = module.exports = function(assembly, index, signatureOrIndex) {

    /**
     * Assembly reference.
     * @type {!Assembly}
     */
    this.assembly = assembly;

    /**
     * Function index.
     * @type {number}
     */
    this.index = index;

    /**
     * Signature reference.
     * @type {!FunctionSignature}
     */
    this.signature;
    if (signatureOrIndex instanceof FunctionSignature)
        this.signature = assembly.getFunctionSignature(signatureOrIndex.index);
    else
        this.signature = assembly.getFunctionSignature(signatureOrIndex);

    /**
     * Function definition.
     * @type {!FunctionDefinition}
     */
    this.definition; // Assigned later on
};

FunctionDeclaration.prototype.toString = function() {
    return "FunctionDeclaration " + this.index.toString() + " " + this.signature.index.toString();
};
