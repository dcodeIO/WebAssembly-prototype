var util = require("../util");

var FunctionSignature = require("./FunctionSignature"),
    FunctionPointerElement = require("./FunctionPointerElement"),
    BaseOperand = require("../stmt/BaseOperand");

/**
 * A function pointer table.
 * @constructor
 * @param {!reflect.Assembly} assembly
 * @param {number} index
 * @param {number|!reflect.FunctionSignature} signature
 * @param {!Array.<number|!reflect.FunctionPointerElement>} elements
 * @extends stmt.BaseOperand
 * @exports reflect.FunctionPointerTable
 */
function FunctionPointerTable(assembly, signature, elements) {
    BaseOperand.call(this);

    /**
     * Assembly reference.
     * @type {!reflect.Assembly}
     */
    this.assembly = assembly;

    /**
     * Signature.
     * @type {!reflect.FunctionSignature}
     */
    this.signature = signature instanceof FunctionSignature
        ? signature
        : assembly.getFunctionSignature(signature);

    /**
     * Elements.
     * @type {!Array.<!reflect.FunctionPointerElement>}
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

// Extends BaseOperand
FunctionPointerTable.prototype = Object.create(BaseOperand.prototype);

/**
 * Function pointer table index.
 * @name reflect.FunctionPointerTable#index
 * @type {number}
 */
Object.defineProperty(FunctionPointerTable.prototype, "index", {
    get: function() {
        return this.assembly.functionPointerTables.indexOf(this);
    }
});

/**
 * Indexed name.
 * @name reflect.FunctionPointerTable#name
 * @type {string}
 */
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
