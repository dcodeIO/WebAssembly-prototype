var types = require("../types"),
    util = require("../util");

var assertInteger = util.assertInteger,
    assertRType = util.assertRType,
    assertType = util.assertType,
    assertFName = util.assertFName;

var ConstantPool = require("./ConstantPool"),
    FunctionSignature = require("./FunctionSignature"),
    FunctionImport = require("./FunctionImport"),
    FunctionImportSignature = require("./FunctionImportSignature"),
    GlobalVariable = require("./GlobalVariable"),
    FunctionDeclaration = require("./FunctionDeclaration"),
    FunctionPointerTable = require("./FunctionPointerTable"),
    FunctionDefinition = require("./FunctionDefinition"),
    DefaultExport = require("./DefaultExport"),
    RecordExport = require("./RecordExport");

/**
 * An assembly.
 * @constructor
 * @param {number=} precomputedSize
 */
var Assembly = module.exports = function(precomputedSize) {

    /**
     * Precomputed size.
     * @type {number}
     */
    this.precomputedSize = precomputedSize || 0;

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
     * Function import signatures.
     * @type {!Array<!FunctionSignature>}
     */
    this.functionImportSignatures = [];

    /**
     * Global variables.
     * @type {!Array.<!GlobalVariable>}
     */
    this.globalVariables = [];

    /**
     * Function declarations including their respective definition.
     * @type {!Array.<!FunctionDeclaration>}
     */
    this.functionDeclarations = [];

    /**
     * Function pointer tables.
     * @type {!Array.<!FunctionPointerTable>}
     */
    this.functionPointerTables = [];

    /**
     * Export definition.
     * @type {BaseExport}
     */
    this.export = null;
};

// ----- constant pools ------

/**
 * Initializes the constant pools with the specified sizes.
 * @param {number} nI32
 * @param {number} nF32
 * @param {number} nF64
 */
Assembly.prototype.initConstantPools = function(nI32, nF32, nF64) {
    assertInteger("nI32", nI32, 0, 0xFFFFFFFF);
    assertInteger("nF32", nF32, 0, 0xFFFFFFFF);
    assertInteger("nF64", nF64, 0, 0xFFFFFFFF);
    this.constantPools = [
        new ConstantPool(this, types.Type.I32, nI32),
        new ConstantPool(this, types.Type.F32, nF32),
        new ConstantPool(this, types.Type.F64, nF64)
    ];
};

/**
 * Gets the size of the constant pool of the specified type.
 * @param {number} type
 * @returns {number}
 */
Assembly.prototype.getConstantPoolSize = function(type) {
    assertInteger("type", type);
    switch (type) {
        case types.Type.I32:
            return this.constantPools[0].length;
        case types.Type.F32:
            return this.constantPools[1].length;
        case types.Type.F64:
            return this.constantPools[2].length;
        default:
            throw RangeError("illegal type: "+type);
    }
};

/**
 * Gets the size of all constant pools.
 * @returns {!Array.<number>}
 */
Assembly.prototype.getConstantPoolSizes = function() {
    return [
        this.getConstantPoolSize(types.Type.I32),
        this.getConstantPoolSize(types.Type.F32),
        this.getConstantPoolSize(types.Type.F64)
    ];
};

/**
 * Gets the constant pool of the specified type.
 * @param {number} type
 * @returns {!ConstantPool}
 */
Assembly.prototype.getConstantPool = function(type) {
    assertInteger("type", type);
    switch (type) {
        case types.Type.I32:
            return this.constantPools[0];
        case types.Type.F32:
            return this.constantPools[1];
        case types.Type.F64:
            return this.constantPools[2];
        default:
            throw RangeError("illegal type: "+type);
    }
};

/**
 * Sets the value of a constant of the specified type.
 * @param {number} type
 * @param {number} index
 * @param {number} value
 */
Assembly.prototype.setConstant = function(type, index, value) {
    assertInteger("type", type);
    var size = this.getConstantPoolSize(type);
    assertInteger("index", index, 0, size-1);
    switch (type) {
        case types.Type.I32:
            this.constantPools[0][index] = value;
            break;
        case types.Type.F32:
            this.constantPools[1][index] = value;
            break;
        case types.Type.F64:
            this.constantPools[2][index] = value;
            break;
        default:
            throw RangeError("illegal type: "+type);
    }
};

/**
 * Gets the value of a constant of the specified type.
 * @param {number} type
 * @param {number} index
 * @returns {number|undefined}
 */
Assembly.prototype.getConstant = function(type, index) {
    assertInteger("type", type);
    var size = this.getConstantPoolSize(type);
    assertInteger("index", index, 0, size-1);
    switch (type) {
        case types.Type.I32:
            return this.constantPools[0][index];
        case types.Type.F32:
            return this.constantPools[1][index];
        case types.Type.F64:
            return this.constantPools[2][index];
        default:
            throw RangeError("illegal type: "+type);
    }
};

// ----- function signatures -----

/**
 * Initializes size of the function signature pool.
 * @param {number} nSigs
 */
Assembly.prototype.initFunctionSignaturePool = function(nSigs) {
    assertInteger("nSigs", nSigs, 0, 0xFFFFFFFF);
    this.functionSignatures = new Array(nSigs);
};

/**
 * Gets the size of the function signature pool.
 * @returns {number}
 */
Assembly.prototype.getFunctionSignaturePoolSize = function() {
    return this.functionSignatures.length;
};

/**
 * Sets the function signature at the specified index.
 * @param {number} index
 * @param {number} returnType
 * @param {!Array.<number>} argumentTypes
 */
Assembly.prototype.setFunctionSignature = function(index, returnType, argumentTypes) {
    var size = this.getFunctionSignaturePoolSize();
    assertInteger("index", index, 0, size-1);
    assertRType("returnType", returnType);
    argumentTypes.forEach(function(type, i) {
        assertType("argumentTypes["+i+"]", type);
    });
    return this.functionSignatures[index] = new FunctionSignature(this, index, returnType, argumentTypes);
};

/**
 * Gets the function signature at the specified index.
 * @param {number} index
 * @returns {!FunctionSignature}
 */
Assembly.prototype.getFunctionSignature = function(index) {
    var size = this.getFunctionSignaturePoolSize();
    assertInteger("index", index, 0, size-1);
    return this.functionSignatures[index];
};

// ----- function imports -----

/**
 * Initializes the function import pool.
 * @param {number} nImports
 * @param {number} nSignatures
 */
Assembly.prototype.initFunctionImportPool = function(nImports, nSignatures) {
    assertInteger("nImports", nImports, 0, 0xFFFFFFFF);
    assertInteger("nSignatures", nSignatures, 0, 0xFFFFFFFF);
    this.functionImports = new Array(nImports);
    this.functionImportSignatures = new Array(nSignatures);
    this.functionImportSignatures.offset = 0;
};

/**
 * Gets the size of the function import pool.
 * @returns {number}
 */
Assembly.prototype.getFunctionImportPoolSize = function() {
    return this.functionImports.length;
};

/**
 * Gets the size of the function import signature pool.
 * @returns {number}
 */
Assembly.prototype.getFunctionImportSignaturePoolSize = function() {
    return this.functionImportSignatures.length;
};

/**
 * Sets the function import at the specified index.
 * @param {number} index
 * @param {string} name
 * @param {!Array.<number>} signatureIndexes
 */
Assembly.prototype.setFunctionImport = function(index, name, signatureIndexes) {
    var size = this.getFunctionImportPoolSize();
    assertInteger("index", index, 0, size-1);
    assertFName("name", name);
    var ssize = this.getFunctionSignaturePoolSize();
    signatureIndexes.forEach(function(index, i) {
        assertInteger("signatureIndexes["+i+"]", index, 0, ssize);
    });
    var imp = this.functionImports[index] = new FunctionImport(this, index, name, signatureIndexes);
    var isize = this.getFunctionImportSignaturePoolSize();
    for (var i=0; i<signatureIndexes.length; ++i) {
        if (this.functionImportSignatures.offset >= isize)
            throw RangeError("illegal function import signature index: "+this.functionImportSignatures.offset);
        this.functionImportSignatures[this.functionImportSignatures.offset]
            = new FunctionImportSignature(this, this.functionImportSignatures.offset++, signatureIndexes[i], imp.index);
    }
    return imp;
};

/**
 * Gets the function import at the specified index.
 * @param {number} index
 * @returns {!FunctionImport}
 */
Assembly.prototype.getFunctionImport = function(index) {
    var size = this.getFunctionImportPoolSize();
    assertInteger("index", index, 0, size-1);
    return this.functionImports[index];
};

/**
 * Gets the function import signature at the specified index.
 * @param {number} index
 * @returns {!FunctionImportSignature}
 */
Assembly.prototype.getFunctionImportSignature = function(index) {
    var size = this.getFunctionImportSignaturePoolSize();
    assertInteger("index", index, 0, size-1);
    return this.functionImportSignatures[index];
};

// ----- global variables -----

/**
 * Initializes the global variable pool.
 * @param {number} nI32zero
 * @param {number} nF32zero
 * @param {number} nF64zero
 * @param {number} nI32import
 * @param {number} nF32import
 * @param {number} nF64import
 * @returns {number} Index of the first non-zero / imported global variable
 */
Assembly.prototype.initGlobalVariablePool = function(nI32zero, nF32zero, nF64zero, nI32import, nF32import, nF64import) {
    var total = 0;
    assertInteger("nI32zero", nI32zero, 0, 0xFFFFFFFF);
    total += nI32zero;
    assertInteger("nF32zero", nF32zero, 0, 0xFFFFFFFF - total);
    total += nF32zero;
    assertInteger("nF64zero", nF64zero, 0, 0xFFFFFFFF - total);
    total += nF64zero;
    assertInteger("nI32import", nI32import, 0, 0xFFFFFFFF - total);
    total += nI32import;
    assertInteger("nF32import", nF32import, 0, 0xFFFFFFFF - total);
    total += nF32import;
    assertInteger("nF64import", nF64import, 0, 0xFFFFFFFF - total);
    total += nF64import;
    this.globalVariables = new Array(total);
    var index = 0;
    for (var i=0; i<nI32zero; ++i, ++index)
        this.globalVariables[index] = new GlobalVariable(this, index, types.Type.I32);
    for (i=0; i<nF32zero; ++i, ++index)
        this.globalVariables[index] = new GlobalVariable(this, index, types.Type.F32);
    for (i=0; i<nF64zero; ++i, ++index)
        this.globalVariables[index] = new GlobalVariable(this, index, types.Type.F64);
    var sequence = index;
    for (i=0; i<nI32import; ++i, ++index)
        this.globalVariables[index] = new GlobalVariable(this, index, types.Type.I32);
    for (i=0; i<nF32import; ++i, ++index)
        this.globalVariables[index] = new GlobalVariable(this, index, types.Type.F32);
    for (i=0; i<nF64import; ++i, ++index)
        this.globalVariables[index] = new GlobalVariable(this, index, types.Type.F64);
    return sequence;
};

/**
 * Gets the size of the global variable pool.
 * @returns {number}
 */
Assembly.prototype.getGlobalVariablePoolSize = function() {
    return this.globalVariables.length;
};

/**
 * Sets the global variable at the specified index.
 * @param {number} index
 * @param {number} type
 * @param {string=} importName
 * @returns {!GlobalVariable}
 */
Assembly.prototype.setGlobalVariable = function(index, type, importName) {
    var size = this.getGlobalVariablePoolSize();
    assertInteger("index", index, 0, size-1);
    assertType("type", type);
    if (typeof importName !== 'undefined')
        assertFName(importName);
    return this.globalVariables[index] = new GlobalVariable(this, index, type, importName);
};

/**
 * Gets the global variable at the specified index.
 * @param {number} index
 * @returns {!GlobalVariable}
 */
Assembly.prototype.getGlobalVariable = function(index) {
    var size = this.getGlobalVariablePoolSize();
    assertInteger("index", index, 0, size-1);
    return this.globalVariables[index];
};

// ----- function declarations -----

/**
 * Initializes the function declaration (and definition) pool.
 * @param {number} nDeclarations
 */
Assembly.prototype.initFunctionDeclarationPool = function(nDeclarations) {
    assertInteger("nDeclarations", nDeclarations, 0, 0xFFFFFFFF);
    this.functionDeclarations = new Array(nDeclarations);
    this.functionDefinitions = new Array(nDeclarations);
};

/**
 * Gets the size of the function declaration pool.
 * @returns {number}
 */
Assembly.prototype.getFunctionDeclarationPoolSize = function() {
    return this.functionDeclarations.length;
};

/**
 * Sets the function declaration at the specified index.
 * @param {number} index
 * @param {number} signatureIndex
 * @returns {!FunctionDeclaration}
 */
Assembly.prototype.setFunctionDeclaration = function(index, signatureIndex) {
    var size = this.getFunctionDeclarationPoolSize();
    assertInteger("index", index, 0, size-1);
    var ssize = this.getFunctionSignaturePoolSize();
    assertInteger("signatureIndex", signatureIndex, 0, ssize-1);
    return this.functionDeclarations[index] = new FunctionDeclaration(this, index, signatureIndex);
};

/**
 * Gets the function declaration at the specified index.
 * @param {number} index
 * @returns {!FunctionDeclaration}
 */
Assembly.prototype.getFunctionDeclaration = function(index) {
    var size = this.getFunctionDeclarationPoolSize();
    assertInteger("index", index, 0, size-1);
    return this.functionDeclarations[index];
};

// ----- function pointer tables -----

/**
 * Initializes the function pointer table pool.
 * @param {number} nTables
 */
Assembly.prototype.initFunctionPointerTablePool = function(nTables) {
    assertInteger("nTables", nTables, 0, 0xFFFFFFFF);
    this.functionPointerTables = new Array(nTables);
};

/**
 * Gets the size of the function pointer table pool.
 * @returns {number}
 */
Assembly.prototype.getFunctionPointerTablePoolSize = function() {
    return this.functionPointerTables.length;
};

Assembly.prototype.setFunctionPointerTable = function(index, signatureIndex, elements) {
    var size = this.getFunctionPointerTablePoolSize();
    assertInteger("index", index, 0, size-1);
    var ssize = this.getFunctionSignaturePoolSize();
    assertInteger("signatureIndex", signatureIndex, 0, ssize-1);
    return this.functionPointerTables[index] = new FunctionPointerTable(this, index, signatureIndex, elements);
};

// ----- function definitions -----

/**
 * Sets the function definition at the specified index.
 * @param {number} index
 * @param {number} nI32vars
 * @param {number} nF32vars
 * @param {number} nF64vars
 * @param {number} byteOffset
 * @param {number=} byteLength
 * @returns {!FunctionDefinition}
 */
Assembly.prototype.setFunctionDefinition = function(index, nI32vars, nF32vars, nF64vars, byteOffset, byteLength) {
    var size = this.getFunctionDeclarationPoolSize();
    assertInteger("index", index, 0, size-1);
    var declaration = this.functionDeclarations[index];
    return declaration.definition = new FunctionDefinition(declaration, nI32vars, nF32vars, nF64vars, byteOffset, byteLength);
};

/**
 * Gets the function definition at the specified index.
 * @param {number} index
 * @returns {!FunctionDefinition}
 */
Assembly.prototype.getFunctionDefinition = function(index) {
    var size = this.getFunctionDeclarationPoolSize();
    assertInteger("index", index, 0, size-1);
    var declaration = this.functionDeclarations[index];
    return declaration.definition;
};

// ----- export -----

/**
 * Sets the export defined in default format.
 * @param {number} functionIndex
 * @returns {!DefaultExport}
 */
Assembly.prototype.setDefaultExport = function(functionIndex) {
    var size = this.getFunctionDeclarationPoolSize();
    assertInteger("functionIndex", functionIndex, 0, size-1);
    return this.export = new DefaultExport(this, functionIndex);
};

/**
 * Sets the export defined in record format.
 * @param {!Object.<string,number>} functionIndexes
 * @returns {!RecordExport}
 */
Assembly.prototype.setRecordExport = function(functionIndexes) {
    var size = this.getFunctionDeclarationPoolSize();
    Object.keys(functionIndexes).forEach(function(name, i) {
        assertFName("functionIndexes.keys"+i, name);
        var index = functionIndexes[name];
        assertInteger("functionIndexes["+name+"]", index, 0, size-1);
    });
    return this.export = new RecordExport(this, functionIndexes);
};

// ----- general -----

Assembly.prototype.toString = function() {
    return "Assembly"
         + " size:" + this.precomputedSize
         + " consts:" + (this.constantPools[0].length + this.constantPools[1].length + this.constantPools[2].length)
         + " sigs:" + this.functionSignatures.length
         + " imps:" + this.functionImports.length
         + " impSigs:" + this.functionImportSignatures.length
         + " globals:" + this.globalVariables.length
         + " decls:" + this.functionDeclarations.length;
};
