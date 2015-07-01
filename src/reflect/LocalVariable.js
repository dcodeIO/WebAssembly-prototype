var types = require("../types"),
    util = require("../util");

/**
 * A local variable.
 * @constructor
 * @param {number|!FunctionDefinition} functionDefinition
 * @param {number} type
 * @exports reflect.LocalVariable
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
 * Whether this local variable is a function argument or not.
 * @name LocalVariable#isArgument
 * @type {boolean}
 */
Object.defineProperty(LocalVariable.prototype, "isArgument", {
    get: function() {
        return this.index < this.functionDefinition.signature.argumentTypes.length;
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
