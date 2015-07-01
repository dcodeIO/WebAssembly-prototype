/**
 * A function pointer element.
 * @constructor
 * @param {!FunctionPointerTable} table
 * @param {number} value
 * @exports reflect.FunctionPointerElement
 */
var FunctionPointerElement = module.exports = function(table, value) {

    /**
     * Function pointer table reference.
     * @type {!FunctionPointerTable}
     */
    this.table = table;

    /**
     * Value.
     * @type {number}
     */
    this.value = value;
};

/**
 * Returns a string representation of this function pointer element.
 * @returns {string}
 */
FunctionPointerElement.prototype.toString = function() {
    return "FunctionPointerElement"
         + " tbl:" + this.table.index
         + " val:" + this.value;
};
