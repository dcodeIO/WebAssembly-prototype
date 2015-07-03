/**
 * A function pointer element.
 * @constructor
 * @param {!reflect.FunctionPointerTable} table
 * @param {number} value
 * @exports reflect.FunctionPointerElement
 */
function FunctionPointerElement(table, value) {

    /**
     * Function pointer table reference.
     * @type {!reflect.FunctionPointerTable}
     */
    this.table = table;

    /**
     * Value.
     * @type {number}
     */
    this.value = value;
}

module.exports = FunctionPointerElement;

/**
 * Returns a string representation of this function pointer element.
 * @returns {string}
 */
FunctionPointerElement.prototype.toString = function() {
    return "FunctionPointerElement"
         + " tbl:" + this.table.index
         + " val:" + this.value;
};
