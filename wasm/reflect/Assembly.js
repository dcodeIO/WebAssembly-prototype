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
    this.constantPools = [
        new ConstantPool(this, types.Type.I32),
        new ConstantPool(this, types.Type.F32),
        new ConstantPool(this, types.Type.F64)
    ];

    /**
     * Function signatures.
     * @type {!Array.<!FunctionSignature>}
     */
    this.functionSignatures = [];

    /**
     * Function imports.
     * @type {!Array.<!FunctionImport>}
     */
    this.functionImports = [];

    /**
     * Global variables.
     * @type {!Array.<!GlobalVariable>}
     */
    this.globalVariables = [];

    /**
     * Function declarations.
     * @type {!Array.<!FunctionDeclaration>}
     */
    this.functionDeclarations = [];

    /**
     * Function pointer tables.
     * @type {!Array.<!FunctionPointerTable>}
     */
    this.functionPointerTables = [];

    /**
     * Function definitions.
     * @type {!Array.<!FunctionDefinition>}
     */
    this.functionDefinitions = [];

    /**
     * Export definition.
     * @type {BaseExport}
     */
    this.export = null;
};

/**
 * Gets the function signature at the specified index.
 * @param {number} index
 * @returns {!FunctionSignature}
 * @throws {TypeError} If index is not an integer
 * @throws {RangeError} If index is out of bounds
 */
Assembly.prototype.getFunctionSignature = function(index) {
    if (typeof index !== 'number' || index%1 !== 0)
        throw TypeError("index");
    if (index < 0 || index >= this.signatures.length)
        throw RangeError("index");
    return this.signatures[index];
};

/**
 * Gets the function definition at the specified index.
 * @param {number} index
 * @returns {!FunctionDefinition}
 * @throws {TypeError} If index is not an integer
 * @throws {RangeError} If index is out of bounds
 */
Assembly.prototype.getFunctionDefinition = function(index) {
    if (typeof index !== 'number' || index%1 !== 0)
        throw TypeError("index");
    if (index < 0 || index >= this.functionDefinitions.length)
        throw RangeError("index");
    return this.functionDefinitions[index];
};
