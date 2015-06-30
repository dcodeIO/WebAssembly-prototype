var FunctionSignature = require("./FunctionSignature"),
    FunctionPointerElement = require("./FunctionPointerElement");

/**
 * A function pointer table.
 * @constructor
 * @param {!Assembly} assembly
 * @param {number} index
 * @param {number|!FunctionSignature} signature
 * @param {!Array.<number|!FunctionPointerElement>} elements
 */
var FunctionPointerTable = module.exports = function(assembly, signature, elements) {

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
};

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

/**
 * Returns a string representation of this function pointer table.
 * @returns {string}
 */
FunctionPointerTable.prototype.toString = function() {
    return "FunctionPointerTable " + this.index.toString() + " " + this.signature.index + " " + this.elements.length;
};
