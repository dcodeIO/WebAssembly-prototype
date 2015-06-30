var types = require("../types"),
    util = require("../util");

/**
 * A local variable.
 * @constructor
 * @param {number|!FunctionDefinition} functionDefinition
 * @param {number} type
 */
var LocalVariable = module.exports = function(functionDefinition, type) {

    /**
     * Function definition reference.
     * @type {!FunctionDefinition}
     */
    this.functionDefinition = functionDefinition instanceof FunctionDefinition
        ? functionDefinition
        : this.assembly.getFunctionDefinition(functionDefinition);

    /**
     * Variable type.
     * @type {number}
     */
    this.type = type;
};

var FunctionDefinition = require("./FunctionDefinition"); // cyclic

/**
 * Local variable index.
 * @name LocalVariable#index
 * @type {number}
 */
Object.defineProperty(LocalVariable.prototype, "index", {
    get: function() {
        return this.functionDefinition.variables.indexOf(this);
    }
});

/**
 * Indexed name.
 * @name LocalVariable#name
 * @type {string}
 */
Object.defineProperty(LocalVariable.prototype, "name", {
    get: function() {
        return util.localName(this.index);
    }
});

/**
 * Returns a string representation of this local variable.
 * @returns {string}
 */
LocalVariable.prototype.toString = function() {
    return "LocalVariable " + this.name
         + " idx:" +this.index
         + " type:" + types.TypeNames[this.type];
};
