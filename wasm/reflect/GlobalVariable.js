var types = require("../types");

/**
 * A global variable.
 * @constructor
 * @param {!Assembly} assembly
 * @param {number} index
 * @param {number} type
 * @param {string=} name
 */
var GlobalVariable = module.exports = function(assembly, index, type, importName) {

    /**
     * Assembly reference.
     * @type {!Assembly}
     */
    this.assembly = assembly;

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

    /**
     * Import name if not zero.
     * @type {?string}
     */
    this.importName = importName || null;
};

/**
 * Returns a string representation of this global variable.
 * @returns {string}
 */
GlobalVariable.prototype.toString = function() {
    return "GlobalVariable " + this.index.toString() + " "
         + types.TypeNames[this.type] + " "
         + (this.importName === null ? "0" : "foreign."+this.importName);
};
