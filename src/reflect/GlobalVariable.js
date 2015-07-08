var types = require("../types"),
    util = require("../util");

var BaseOperand = require("../stmt/BaseOperand");

/**
 * A global variable.
 * @constructor
 * @param {!reflect.Assembly} assembly
 * @param {number} type
 * @param {string=} importName
 * @extends stmt.BaseOperand
 * @exports reflect.GlobalVariable
 */
function GlobalVariable(assembly,  type, importName) {
    BaseOperand.call(this);

    /**
     * Assembly reference.
     * @type {!reflect.Assembly}
     */
    this.assembly = assembly;

    /**
     * Variable type.
     * @type {number}
     */
    this.type = type;

    /**
     * Import name if not zero.
     * @type {?string}
     */
    this.importName = importName || null;
}

module.exports = GlobalVariable;

// Extends BaseOperand
GlobalVariable.prototype = Object.create(BaseOperand.prototype);

/**
 * Global variable index.
 * @name reflect.GlobalVariable#index
 * @type {number}
 */
Object.defineProperty(GlobalVariable.prototype, "index", {
    get: function() {
        return this.assembly.globalVariables.indexOf(this);
    }
});

/**
 * Indexed name.
 * @name reflect.GlobalVariable#name
 * @type {string}
 */
Object.defineProperty(GlobalVariable.prototype, "name", {
    get: function() {
        var num_func_imps = this.assembly.functionImports.length;
        return this.assembly.globalName(num_func_imps + this.index);
    }
});

/**
 * Returns a string representation of this global variable.
 * @returns {string}
 */
GlobalVariable.prototype.toString = function() {
    return "GlobalVariable " + this.name
         + " idx:" + this.index
         + " type:" + types.TypeNames[this.type]
         + " val:" + (this.importName === null ? "0" : "foreign."+this.importName);
};
