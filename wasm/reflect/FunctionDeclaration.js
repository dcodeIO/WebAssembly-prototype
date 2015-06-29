var types = require("../types"),
    util = require("../util");

var FunctionSignature = require("./FunctionSignature");

/**
 * A function declaration.
 * @constructor
 * @param {!Assembly} assembly
 * @param {number} index
 * @param {number} signatureIndex
 */
var FunctionDeclaration = module.exports = function(assembly, index, signatureIndex) {

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
    this.signature = assembly.getFunctionSignature(signatureIndex);

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

/**
 * Returns a string representation of this function declaration.
 * @returns {string}
 */
FunctionDeclaration.prototype.toString = function() {
    return "FunctionDeclaration " + this.name
         + " idx:" + this.index
         + " sig:" + this.signature.index;
};
