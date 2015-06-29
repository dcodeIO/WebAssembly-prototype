var types = require("../types"),
    util = require("../util");

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
    return "LocalVariable " + this.name + " index:" +this.index + " type:" + types.TypeNames[this.type];
};
