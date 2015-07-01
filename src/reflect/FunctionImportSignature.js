var FunctionSignature = require("./FunctionSignature");

/**
 * A function import signature.
 * @constructor
 * @param {!Assembly} assembly
 * @param {number|!FunctionImport} functionImport
 * @param {number|!FunctionSignature} signature
 * @exports reflect.FunctionImportSignature
 */
var FunctionImportSignature = module.exports = function(assembly, functionImport, signature) {

    /**
     * Assembly reference.
     * @type {!Assembly}
     */
    this.assembly = assembly;

    /**
     * Function import.
     * @type {!FunctionImport}
     */
    this.import = functionImport instanceof FunctionImport
        ? functionImport
        : assembly.getFunctionImport(functionImport);

    /**
     * Function signature.
     * @type {!FunctionSignature}
     */
    this.signature = signature instanceof FunctionSignature
        ? signature
        : assembly.getFunctionSignature(signature);
};

var FunctionImport = require("./FunctionImport"); // cyclic

/**
 * Function import signature index.
 * @name FunctionImportSignature#index
 * @type {number}
 */
Object.defineProperty(FunctionImportSignature.prototype, "index", {
    get: function() {
        return this.assembly.functionImportSignatures.indexOf(this);
    }
});

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
