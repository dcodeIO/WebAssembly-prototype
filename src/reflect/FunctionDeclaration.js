var types = require("../types"),
    util = require("../util");

var FunctionSignature = require("./FunctionSignature");

/**
 * A function declaration.
 * @constructor
 * @param {!Assembly} assembly
 * @param {number|!FunctionSignature} signature
 * @exports reflect.FunctionDeclaration
 */
function FunctionDeclaration(assembly, signature) {

    /**
     * Assembly reference.
     * @type {!Assembly}
     */
    this.assembly = assembly;

    /**
     * Signature reference.
     * @type {!FunctionSignature}
     */
    this.signature = signature instanceof FunctionSignature
        ? signature
        : assembly.getFunctionSignature(signature);

    /**
     * Function definition.
     * @type {!FunctionDefinition}
     */
    this.definition; // Assigned later on
}

module.exports = FunctionDeclaration;

/**
 * Function declaration index.
 * @name FunctionDeclaration#index
 * @type {number}
 */
Object.defineProperty(FunctionDeclaration.prototype, "index", {
    get: function() {
        return this.assembly.functionDeclarations.indexOf(this);
    }
});

/**
 * Indexed name.
 * @name FunctionDeclaration#name
 * @type {string}
 */
Object.defineProperty(FunctionDeclaration.prototype, "name", {
    get: function() {
        var func_name_base = this.assembly.functionImports.length + this.assembly.globalVariables.length;
        return this.assembly.globalName(func_name_base + this.index, "F");
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
