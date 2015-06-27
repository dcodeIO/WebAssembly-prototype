var types = require("../types"),
    ConstantPool = require("./ConstantPool");

/**
 * An assembly.
 * @constructor
 */
var Assembly = module.exports = function() {

    /**
     * Constant pools.
     * @type {!Array.<!ConstantPool>}
     */
    this.constants = [
        new ConstantPool(this, types.Type.I32),
        new ConstantPool(this, types.Type.F32),
        new ConstantPool(this, types.Type.F64)
    ];

    /**
     * Function signatures.
     * @type {!Array.<!FunctionSignature>}
     */
    this.signatures = [];

    /**
     * Function imports.
     * @type {!Array.<!FunctionImport>}
     */
    this.imports = [];

    /**
     * Global variables.
     * @type {!Array.<!GlobalVariable>}
     */
    this.globals = [];
};

/**
 * Gets the function signature at the specified index.
 * @param {number} index
 * @returns {!FunctionSignature}
 * @throws {TypeError} If index is not an integer
 * @throws {RangeError} If index is out of bounds
 */
Assembly.prototype.getSignature = function(index) {
    if (typeof index !== 'number' || index%1 !== 0)
        throw TypeError("index");
    if (index < 0 || index >= this.signatures.length)
        throw RangeError("index");
    return this.signatures[index];
};
