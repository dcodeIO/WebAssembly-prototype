var FunctionDefinition = require("./FunctionDefinition");

/**
 * A local variable.
 * @constructor
 * @param {!FunctionDefinition} functionDefinition
 * @param {number} index
 * @param {number} type
 */
var LocalVariable = module.exports = function(functionDefinition, index, type) {

    /**
     * Function definition reference.
     * @type {!FunctionDefinition}
     */
    this.functionDefinition = functionDefinition;

    /**
     * Variable index.
     * @type {number}
     */
    this.index = index;

    /**
     * Variable type.
     * @type {number}
     */
    this.type = type;
};
