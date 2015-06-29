var types = require("../types"),
    util = require("../util");

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

/**
 * Indexed internal function name.
 * @name FunctionDefinition#name
 * @type {string}
 */
Object.defineProperty(FunctionDeclaration.prototype, "name", {
    get: function() {
        var func_name_base = this.assembly.functionImports.length + this.assembly.globalVariables.length;
        return util.globalName(func_name_base + this.index);
    }
});

FunctionDeclaration.prototype.toString = function() {
    return "FunctionDeclaration " + this.name + " index:" + this.index + " sig:" + this.signature.index.toString();
};
