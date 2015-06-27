/**
 * A function pointer element.
 * @constructor
 * @param {!FunctionPointerTable} table
 * @param {number} value
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
