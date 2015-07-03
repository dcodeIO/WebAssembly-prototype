var util = require("../util");

var FunctionSignature = require("./FunctionSignature"),
    FunctionPointerElement = require("./FunctionPointerElement");

/**
 * A function pointer table.
 * @constructor
 * @param {!Assembly} assembly
 * @param {number} index
 * @param {number|!FunctionSignature} signature
 * @param {!Array.<number|!FunctionPointerElement>} elements
 * @exports reflect.FunctionPointerTable
 */
function FunctionPointerTable(assembly, signature, elements) {

    /**
     * Assembly reference.
     * @type {!Assembly}
     */
    this.assembly = assembly;

    /**
     * Signature.
     * @type {!FunctionSignature}
     */
    this.signature = signature instanceof FunctionSignature
        ? signature
        : assembly.getFunctionSignature(signature);

    /**
     * Elements.
     * @type {!Array.<!FunctionPointerElement>}
     */
    this.elements = [];
    elements.forEach(function(element) {
        this.elements.push(
            element instanceof FunctionPointerElement
                ? element // usually not the case, but for completeness
                : new FunctionPointerElement(this, element)
        );
    }, this);
}

module.exports = FunctionPointerTable;

/**
 * Function pointer table index.
 * @name FunctionPointerTable#index
 * @type {number}
 */
Object.defineProperty(FunctionPointerTable.prototype, "index", {
    get: function() {
        return this.assembly.functionPointerTables.indexOf(this);
    }
});

Object.defineProperty(FunctionPointerTable.prototype, "name", {
    get: function() {
        var func_name_base = this.assembly.functionImports.length + this.assembly.globalVariables.length;
        var func_ptr_name_base = func_name_base + this.assembly.functionDeclarations.length;
        return this.assembly.globalName(func_ptr_name_base + this.index, "fptr");
    }
});

/**
 * Returns a string representation of this function pointer table.
 * @returns {string}
 */
FunctionPointerTable.prototype.toString = function() {
    return "FunctionPointerTable " + this.index.toString() + " " + this.signature.index + " " + this.elements.length;
};
