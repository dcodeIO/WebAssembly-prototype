var types = require("../types"),
    util = require("../util");

var BaseOperand = require("../stmt/BaseOperand");

/**
 * A local variable.
 * @constructor
 * @param {number|!reflect.FunctionDefinition} functionDefinition
 * @param {number} type
 * @extends stmt.BaseOperand
 * @exports reflect.LocalVariable
 */
function LocalVariable(functionDefinition, type) {
    BaseOperand.call(this);

    /**
     * Function definition reference.
     * @type {!reflect.FunctionDefinition}
     */
    this.functionDefinition = functionDefinition instanceof FunctionDefinition
        ? functionDefinition
        : this.assembly.getFunctionDefinition(functionDefinition);

    /**
     * Variable type.
     * @type {number}
     */
    this.type = type;
}

module.exports = LocalVariable;

var FunctionDefinition = require("./FunctionDefinition"); // cyclic

// Extends BaseOperand
LocalVariable.prototype = Object.create(BaseOperand.prototype);

/**
 * Local variable index.
 * @name reflect.LocalVariable#index
 * @type {number}
 */
Object.defineProperty(LocalVariable.prototype, "index", {
    get: function() {
        return this.functionDefinition.variables.indexOf(this);
    }
});

/**
 * Whether this local variable is a function argument or not.
 * @name reflect.LocalVariable#isArgument
 * @type {boolean}
 */
Object.defineProperty(LocalVariable.prototype, "isArgument", {
    get: function() {
        return this.index < this.functionDefinition.signature.argumentTypes.length;
    }
});

/**
 * Indexed name.
 * @name reflect.LocalVariable#name
 * @type {string}
 */
Object.defineProperty(LocalVariable.prototype, "name", {
    get: function() {
        return this.functionDefinition.declaration.assembly.localName(this.index, util.variablePrefix(this.type));
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
