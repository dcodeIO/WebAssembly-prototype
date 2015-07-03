/**
 * A function import.
 * @constructor
 * @param {!reflect.Assembly} assembly
 * @param {string} name
 * @param {!Array.<number|!reflect.FunctionImportSignature>} importSignatures
 * @exports reflect.FunctionImport
 */
function FunctionImport(assembly, name, importSignatures) {

    /**
     * Assembly reference.
     * @type {!reflect.Assembly}
     */
    this.assembly = assembly;

    /**
     * Import name.
     * @type {string}
     */
    this.name = name;

    /**
     * Function import signatures.
     * @type {!Array.<!reflect.FunctionImportSignature>}
     */
    this.signatures = [];
    importSignatures.forEach(function(signature) {
        this.signatures.push(
            signature instanceof FunctionImportSignature
                ? signature
                : assembly.getFunctionImportSignature(signature)
        );
    }, this);
}

module.exports = FunctionImport;

var FunctionImportSignature = require("./FunctionImportSignature"); // cyclic

/**
 * Function import index.
 * @name reflect.FunctionImport#index
 * @type {number}
 */
Object.defineProperty(FunctionImport.prototype, "index", {
    get: function() {
        return this.assembly.functionImports.indexOf(this);
    }
});

/**
 * Returns a string representation of this import.
 * @returns {string}
 */
FunctionImport.prototype.toString = function() {
    return "FunctionImport " + "foreign." + this.importName
         + " idx:" + this.index
         + " sigs:" + this.signatures.length;
};
