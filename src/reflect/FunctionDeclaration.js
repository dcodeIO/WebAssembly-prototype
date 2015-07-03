var types = require("../types"),
    util = require("../util");

var FunctionSignature = require("./FunctionSignature"),
    BaseOperand = require("../stmt/BaseOperand");

/**
 * A function declaration.
 * @constructor
 * @param {!reflect.Assembly} assembly
 * @param {number|!reflect.FunctionSignature} signature
 * @extends stmt.BaseOperand
 * @exports reflect.FunctionDeclaration
 */
function FunctionDeclaration(assembly, signature) {
    BaseOperand.call(this);

    /**
     * Assembly reference.
     * @type {!reflect.Assembly}
     */
    this.assembly = assembly;

    /**
     * Signature reference.
     * @type {!reflect.FunctionSignature}
     */
    this.signature = signature instanceof FunctionSignature
        ? signature
        : assembly.getFunctionSignature(signature);

    /**
     * Function definition.
     * @type {reflect.FunctionDefinition}
     */
    this.definition = null; // Assigned later on
}

module.exports = FunctionDeclaration;

// Extends BaseOperand
FunctionDeclaration.prototype = Object.create(BaseOperand.prototype);

/**
 * Function declaration index.
 * @name reflect.FunctionDeclaration#index
 * @type {number}
 */
Object.defineProperty(FunctionDeclaration.prototype, "index", {
    get: function() {
        return this.assembly.functionDeclarations.indexOf(this);
    }
});

/**
 * Indexed name.
 * @name reflect.FunctionDeclaration#name
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
