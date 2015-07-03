var FunctionSignature = require("./FunctionSignature"),
    BaseOperand = require("../stmt/BaseOperand");

/**
 * A function import signature.
 * @constructor
 * @param {!reflect.Assembly} assembly
 * @param {number|!reflect.FunctionImport} functionImport
 * @param {number|!reflect.FunctionSignature} signature
 * @extends stmt.BaseOperand
 * @exports reflect.FunctionImportSignature
 */
function FunctionImportSignature(assembly, functionImport, signature) {

    /**
     * Assembly reference.
     * @type {!reflect.Assembly}
     */
    this.assembly = assembly;

    /**
     * Function import.
     * @type {!reflect.FunctionImport}
     */
    this.import = functionImport instanceof FunctionImport
        ? functionImport
        : assembly.getFunctionImport(functionImport);

    /**
     * Function signature.
     * @type {!reflect.FunctionSignature}
     */
    this.signature = signature instanceof FunctionSignature
        ? signature
        : assembly.getFunctionSignature(signature);
}

module.exports = FunctionImportSignature;

var FunctionImport = require("./FunctionImport"); // cyclic

// Extends BaseOperand
FunctionImportSignature.prototype = Object.create(BaseOperand.prototype);

/**
 * Function import signature index.
 * @name reflect.FunctionImportSignature#index
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
