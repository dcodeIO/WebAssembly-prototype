var types = require("../types"),
    util = require("../util"),
    assert = require("assert");

var assertInteger = util.assertInteger,
    assertRType = util.assertRType,
    assertType = util.assertType,
    assertFName = util.assertFName;

var Constant = require("./Constant"),
    FunctionSignature = require("./FunctionSignature"),
    FunctionImport = require("./FunctionImport"),
    FunctionImportSignature = require("./FunctionImportSignature"),
    GlobalVariable = require("./GlobalVariable"),
    FunctionDeclaration = require("./FunctionDeclaration"),
    FunctionPointerTable = require("./FunctionPointerTable"),
    FunctionPointerElement = require("./FunctionPointerElement"),
    FunctionDefinition = require("./FunctionDefinition"),
    LocalVariable = require("./LocalVariable"),
    DefaultExport = require("./DefaultExport"),
    RecordExport = require("./RecordExport");

var StmtList = require("../stmt/StmtList");

/**
 * An assembly.
 * @constructor
 * @param {number=} precomputedSize
 * @param {!Object.<string,*>=} options
 * @exports reflect.Assembly
 */
function Assembly(precomputedSize, options) {

    /**
     * Precomputed size.
     * @type {number}
     */
    this.precomputedSize = precomputedSize || 0xFFFFFFFF;

    /**
     * I32 constants.
     * @type {!Array.<!reflect.Constant>}
     */
    this.constantsI32 = [];

    /**
     * F32 constants.
     * @type {!Array.<!reflect.Constant>}
     */
    this.constantsF32 = [];

    /**
     * F64 constants.
     * @type {!Array.<!reflect.Constant>}
     */
    this.constantsF64 = [];

    /**
     * Function signatures.
     * @type {!Array.<!reflect.FunctionSignature>}
     */
    this.functionSignatures = [];

    /**
     * Function imports.
     * @type {!Array.<!reflect.FunctionImport>}
     */
    this.functionImports = [];

    /**
     * Function import signatures.
     * @type {!Array<!reflect.FunctionSignature>}
     */
    this.functionImportSignatures = [];

    /**
     * Global variables.
     * @type {!Array.<!reflect.GlobalVariable>}
     */
    this.globalVariables = [];

    /**
     * Function declarations including their respective definition.
     * @type {!Array.<!reflect.FunctionDeclaration>}
     */
    this.functionDeclarations = [];

    /**
     * Function pointer tables.
     * @type {!Array.<!reflect.FunctionPointerTable>}
     */
    this.functionPointerTables = [];

    /**
     * Export definition.
     * @type {reflect.BaseExport}
     */
    this.export = null;
}

module.exports = Assembly;

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
    this.constantsI32 = new Array(nI32);
    this.constantsF32 = new Array(nF32);
    this.constantsF64 = new Array(nF64);
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
            return this.constantsI32.length;
        case types.Type.F32:
            return this.constantsF32.length;
        case types.Type.F64:
            return this.constantsF64.length;
        default:
            throw Error("illegal type: "+type);
    }
};

/**
 * Gets the size of all constant pools.
 * @returns {!Array.<number>}
 */
Assembly.prototype.getConstantPoolSizes = function() {
    return [
        this.constantsI32.length,
        this.constantsF32.length,
        this.constantsF64.length
    ];
};

/**
 * Gets the constants of the specified type.
 * @param {number} type
 * @returns {!Array.<!reflect.Constant>}
 */
Assembly.prototype.getConstantPool = function(type) {
    assertInteger("type", type);
    switch (type) {
        case types.Type.I32:
            return this.constantsI32;
        case types.Type.F32:
            return this.constantsF32;
        case types.Type.F64:
            return this.constantsF64;
        default:
            throw Error("illegal type: "+type);
    }
};

/**
 * Sets the constant of the specified type.
 * @param {number} type
 * @param {number} index
 * @param {number} value
 * @returns {!reflect.Constant}
 */
Assembly.prototype.setConstant = function(type, index, value) {
    assertInteger("type", type);
    var size = this.getConstantPoolSize(type); // *
    assertInteger("index", index, 0, size-1);
    switch (type) {
        case types.Type.I32:
            return this.constantsI32[index] = new Constant(this, type, value);
        case types.Type.F32:
            return this.constantsF32[index] = new Constant(this, type, value);
        case types.Type.F64:
            return this.constantsF64[index] = new Constant(this, type, value);
        default:
            throw Error("unreachable"); // *
    }
};

/**
 * Gets the constant of the specified type.
 * @param {number} type
 * @param {number} index
 * @returns {!reflect.Constant}
 */
Assembly.prototype.getConstant = function(type, index) {
    assertInteger("type", type);
    var size = this.getConstantPoolSize(type);
    assertInteger("index", index, 0, size-1);
    switch (type) {
        case types.Type.I32:
            return this.constantsI32[index];
        case types.Type.F32:
            return this.constantsF32[index];
        case types.Type.F64:
            return this.constantsF64[index];
        default:
            throw Error("illegal type: "+type);
    }
};

/**
 * Validates constant pools.
 * @throws {assert.AssertionError}
 */
Assembly.prototype.validateConstantPools = function() {
    assert(Array.isArray(this.constantsI32), "I32 constant pool must be an array");
    assert(Array.isArray(this.constantsF32), "F32 constant pool must be an array");
    assert(Array.isArray(this.constantsF64), "F64 constant pool must be an array");
    this.constantsI32.forEach(function(constant, index) {
        assert(constant instanceof Constant, "I32 constant "+index+" must be a Constant");
        assert.strictEqual(constant.assembly, this, "I32 constant "+index+" must reference this assembly");
        assert.strictEqual(constant.type, types.Type.I32, "I32 constant "+index+" type must be I32");
        assert.strictEqual(typeof constant.value, "number", "I32 constant "+index+" value must be a number");
        assert.strictEqual(constant.value%1, 0, "I32 constant "+index+" value must be an integer");
    }, this);
    this.constantsF32.forEach(function(constant, index) {
        assert(constant instanceof Constant, "F32 constant "+index+" must be a Constant");
        assert.strictEqual(constant.assembly, this, "F32 constant "+index+" must reference this assembly");
        assert.strictEqual(constant.type, types.Type.F32, "F32 constant "+index+" type must be F32");
        assert.strictEqual(typeof constant.value, "number", "F32 constant "+index+" value must be a number");
    }, this);
    this.constantsF64.forEach(function(constant, index) {
        assert(constant instanceof Constant, "F64 constant "+index+" must be a Constant");
        assert.strictEqual(constant.assembly, this, "F64 constant "+index+" must reference this assembly");
        assert.strictEqual(constant.type, types.Type.F64, "F64 constant "+index+" type must be F64");
        assert.strictEqual(typeof constant.value, "number", "F64 constant "+index+" value must be a number");
    }, this);
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
    return this.functionSignatures[index] = new FunctionSignature(this, returnType, argumentTypes);
};

/**
 * Gets the function signature at the specified index.
 * @param {number} index
 * @returns {!reflect.FunctionSignature}
 */
Assembly.prototype.getFunctionSignature = function(index) {
    var size = this.getFunctionSignaturePoolSize();
    assertInteger("index", index, 0, size-1);
    return this.functionSignatures[index];
};

/**
 * Validates a function signature.
 * @param {!reflect.Assembly} assembly
 * @param {!reflect.FunctionSignature} signature
 * @param {number} index
 * @throws {assert.AssertionError}
 */
Assembly.validateFunctionSignature = function(assembly, signature, index) {
    assert.strictEqual(signature instanceof FunctionSignature, true, "function signature "+index+" must be a FunctionSignature");
    assert.notEqual(assembly.functionSignatures.indexOf(signature), -1, "function signature "+index+" must be part of this assembly");
    assert.strictEqual(signature.assembly, assembly, "function signature "+index+" must reference this assembly");
    assert.strictEqual(signature.index, index, "function signature "+index+" must reference its own index");
    assert.strictEqual(types.isValidRType(signature.returnType), true, "function signature "+index+" must have a valid return type");
    assert.strictEqual(Array.isArray(signature.argumentTypes), true, "function signature "+index+" arguments must be an array");
    signature.argumentTypes.forEach(function(type, signatureArgumentIndex) {
        assert.strictEqual(types.isValidType(type), true, "function signature "+index+" argument "+signatureArgumentIndex+" must be a valid type");
    }, this);
};

/**
 * Validates function signatures.
 * @throws {assert.AssertionError}
 */
Assembly.prototype.validateFunctionSignatures = function() {
    assert.strictEqual(Array.isArray(this.functionSignatures), true, "function signatures must be an array");
    this.functionSignatures.forEach(function(signature, signatureIndex) {
        Assembly.validateFunctionSignature(this, signature, signatureIndex);
    }, this);
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
 * @param {string} importName
 * @param {!Array.<number>} signatureIndexes
 */
Assembly.prototype.setFunctionImport = function(index, importName, signatureIndexes) {
    var size = this.getFunctionImportPoolSize();
    assertInteger("index", index, 0, size-1);
    assertFName("name", importName);
    var ssize = this.getFunctionSignaturePoolSize();
    signatureIndexes.forEach(function(index, i) {
        assertInteger("signatureIndexes["+i+"]", index, 0, ssize - 1);
    });
    var isize = this.getFunctionImportSignaturePoolSize();
    if (typeof this.functionImportSignatures.offset === 'undefined')
        this.functionImportSignatures.offset = 0;
    var imprt = this.functionImports[index] = new FunctionImport(this, importName, [] /* to be filled */);
    for (var i=0; i<signatureIndexes.length; ++i) {
        if (this.functionImportSignatures.offset >= isize)
            throw RangeError("illegal function import signature index: "+this.functionImportSignatures.offset);
        imprt.signatures.push(
            this.functionImportSignatures[this.functionImportSignatures.offset++]
                = new FunctionImportSignature(this, index, signatureIndexes[i])
        );
        if (this.functionImportSignatures.offset === isize)
            delete this.functionImportSignatures.offset;
    }
    return imprt;
};

/**
 * Gets the function import at the specified index.
 * @param {number} index
 * @returns {!reflect.FunctionImport}
 */
Assembly.prototype.getFunctionImport = function(index) {
    var size = this.getFunctionImportPoolSize();
    assertInteger("index", index, 0, size-1);
    return this.functionImports[index];
};

/**
 * Gets the function import signature at the specified index.
 * @param {number} index
 * @returns {!reflect.FunctionImportSignature}
 */
Assembly.prototype.getFunctionImportSignature = function(index) {
    var size = this.getFunctionImportSignaturePoolSize();
    assertInteger("index", index, 0, size-1);
    return this.functionImportSignatures[index];
};

/**
 * Validates a function import signature.
 * Does not inspect the function import signature pool for proper order.
 * @param {!reflect.Assembly} assembly
 * @param {!reflect.FunctionImportSignature} signature
 * @param {number} index
 * @throws {assert.AssertionError}
 */
Assembly.validateFunctionImportSignature = function(assembly, signature, index) {
    assert.strictEqual(signature instanceof FunctionImportSignature, true, "function import signature "+index+" must be a FunctionImportSignature");
    assert.notEqual(assembly.functionImportSignatures.indexOf(signature), -1, "function import signature "+index+" must be part of this assembly");
    assert.strictEqual(signature.assembly, assembly, "function import signature "+index+" must reference this assembly");
    assert.strictEqual(signature.index, index, "function import signature "+index+" must reference its own index");
    assert.strictEqual(signature.import instanceof FunctionImport, true, "function import signature "+index+" must reference a function import");
};

/**
 * Validates a function import.
 * Does not inspect other function imports for proper order of function import signatures. Does not inspect enclosed
 * function import signatures in every detail (type and back-reference only).
 * @param {!reflect.Assembly} assembly
 * @param {!reflect.FunctionImport} import_
 * @param {number} index
 * @throws {assert.AssertionError}
 */
Assembly.validateFunctionImport = function(assembly, import_, index) {
    assert.strictEqual(import_ instanceof FunctionImport, true, "function import "+index+" must be a FunctionImport");
    assert.notEqual(assembly.functionImports.indexOf(import_), -1, "functino import "+index+" must be part of this assembly");
    assert.strictEqual(import_.assembly, assembly, "function import "+index+" must reference this assembly");
    assert.strictEqual(import_.index, index, "function import "+index+" must reference its own index");
    assert.strictEqual(util.isValidFName(import_.importName), true, "function import "+index+" must have a valid function name");
    assert.strictEqual(Array.isArray(import_.signatures), true, "function import "+index+" signatures must be an array");
    import_.signatures.forEach(function(importSignature, importSignatureIndex) {
        assert.strictEqual(importSignature instanceof FunctionImportSignature, true, "function import "+index+" signature "+importSignatureIndex+" must be a FunctionImportSignature");
        assert.notEqual(assembly.functionImportSignatures.indexOf(importSignature), -1, "function import "+index+" signature "+importSignatureIndex+" must be part of this assembly");
        assert.strictEqual(importSignature.import, import_, "function import "+index+" signature "+importSignatureIndex+" must reference its own function import");
    }, this);
};

/**
 * Validates function imports.
 * @returns {boolean}
 * @throws {assert.AssertionError}
 */
Assembly.prototype.validateFunctionImports = function() {
    assert.strictEqual(Array.isArray(this.functionImports), true, "function imports must be an array");
    assert.strictEqual(Array.isArray(this.functionImportSignatures), true, "function import signatures must be an array");
    this.functionImportSignatures.forEach(function(signature, index) {
        Assembly.validateFunctionImportSignature(this, signature, index);
    }, this);
    var importSignatures = [];
    this.functionImports.forEach(function(import_, importIndex) {
        Assembly.validateFunctionImport(this, import_, importIndex);
        import_.signatures.forEach(function(importSignature) {
            importSignatures.push(importSignature);
        }, this);
    }, this);
    assert.deepEqual(this.functionImportSignatures.slice() /* removes .offset */, importSignatures, "function import signatures must be ordered liked defined by function imports");
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
        this.globalVariables[index] = new GlobalVariable(this, types.Type.I32);
    for (i=0; i<nF32zero; ++i, ++index)
        this.globalVariables[index] = new GlobalVariable(this, types.Type.F32);
    for (i=0; i<nF64zero; ++i, ++index)
        this.globalVariables[index] = new GlobalVariable(this, types.Type.F64);
    var sequence = index;
    for (i=0; i<nI32import; ++i, ++index)
        this.globalVariables[index] = new GlobalVariable(this, types.Type.I32);
    for (i=0; i<nF32import; ++i, ++index)
        this.globalVariables[index] = new GlobalVariable(this, types.Type.F32);
    for (i=0; i<nF64import; ++i, ++index)
        this.globalVariables[index] = new GlobalVariable(this, types.Type.F64);
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
 * @returns {!reflect.GlobalVariable}
 */
Assembly.prototype.setGlobalVariable = function(index, type, importName) {
    var size = this.getGlobalVariablePoolSize();
    assertInteger("index", index, 0, size-1);
    assertType("type", type);
    if (typeof importName !== 'undefined')
        assertFName(importName);
    return this.globalVariables[index] = new GlobalVariable(this, type, importName);
};

/**
 * Gets the global variable at the specified index.
 * @param {number} index
 * @returns {!reflect.GlobalVariable}
 */
Assembly.prototype.getGlobalVariable = function(index) {
    var size = this.getGlobalVariablePoolSize();
    assertInteger("index", index, 0, size-1);
    return this.globalVariables[index];
};

/**
 * Validates a global variable.
 * Does not inspect the global variable pool for proper order.
 * @param {!reflect.Assembly} assembly
 * @param {!reflect.GlobalVariable} variable
 * @param {number} index
 * @throws {assert.AssertionError}
 */
Assembly.validateGlobalVariable = function(assembly, variable, index) {
    assert.strictEqual(variable instanceof GlobalVariable, true, "global variable "+index+" must be a GlobalVariable");
    assert.notEqual(assembly.globalVariables.indexOf(variable), -1, "global variable "+index+" must be part of this assembly");
    assert.strictEqual(variable.assembly, assembly, "global variable "+index+" must reference this assembly");
    assert.strictEqual(variable.index, index, "global variable "+index+" must reference its own index");
    assert.strictEqual(types.isValidType(variable.type), true, "global variable "+index+" must be of a valid type");
    assert.strictEqual(variable.importName === null || util.isValidFName(variable.importName), true, "global variable "+index+" import name must be null or a valid import name");
};

/**
 * Validates global variables.
 * @throws {assert.AssertionError}
 */
Assembly.prototype.validateGlobalVariables = function() {
    assert.strictEqual(Array.isArray(this.globalVariables), true, "global variables must be an array");
    var previousType,
        zeroDone = false;
    this.globalVariables.forEach(function(variable, index) {
        Assembly.validateGlobalVariable(this, variable, index);
        if (variable.type === previousType) {
            if (variable.importName !== null)
                zeroDone = true;
            if (zeroDone)
                assert.strictEqual(util.isValidFName(variable.importName), true, "global variable "+index+" must have a valid import name");
            else
                assert.strictEqual(variable.importName, null, "global variable "+index+" import name must be null");
        } else {
            previousType = variable.type;
            zeroDone = false;
        }
    }, this);
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
 * @returns {!reflect.FunctionDeclaration}
 */
Assembly.prototype.setFunctionDeclaration = function(index, signatureIndex) {
    var size = this.getFunctionDeclarationPoolSize();
    assertInteger("index", index, 0, size-1);
    var ssize = this.getFunctionSignaturePoolSize();
    assertInteger("signatureIndex", signatureIndex, 0, ssize-1);
    return this.functionDeclarations[index] = new FunctionDeclaration(this, signatureIndex);
};

/**
 * Gets the function declaration at the specified index.
 * @param {number} index
 * @returns {!reflect.FunctionDeclaration}
 */
Assembly.prototype.getFunctionDeclaration = function(index) {
    var size = this.getFunctionDeclarationPoolSize();
    assertInteger("index", index, 0, size-1);
    return this.functionDeclarations[index];
};

/**
 * Validates a function declaration including its enclosed function definition.
 * @param {!reflect.Assembly} assembly
 * @param {!reflect.FunctionDeclaration} declaration
 * @param {number} index
 * @throws {assert.AssertionError}
 */
Assembly.validateFunctionDeclaration = function(assembly, declaration, index) {
    assert.strictEqual(declaration instanceof FunctionDeclaration, true, "function declaration "+index+" must be a FunctionDeclaration");
    assert.notEqual(assembly.functionDeclarations.indexOf(declaration), -1, "function declaration "+index+" must be part of this assembly");
    assert.strictEqual(declaration.assembly, assembly,"function declaration "+index+" must reference this assembly");
    assert.strictEqual(declaration.index, index, "function declaration "+index+" must reference its own index");
    assert.notEqual(assembly.functionSignatures.indexOf(declaration.signature), -1, "function declaration "+index+" signature must be part of this assembly");

    // Also validate definition, which is a part of the declaration in this library, here
    assert.strictEqual(declaration.definition instanceof FunctionDefinition, true, "function declaration "+index+" must reference a function definition");
    var definition = declaration.definition;
    assert.strictEqual(definition.declaration, declaration, "function definition "+index+" must reference function declaration "+index);
    assert.strictEqual(Array.isArray(definition.variables), true, "function definition "+index+" variables must be an array");
    definition.variables.forEach(function(variable, variableIndex) {
        assert.strictEqual(variable instanceof LocalVariable, true, "function definition "+index+" variable "+variableIndex+" must be a LocalVariable");
        assert.strictEqual(variable.functionDefinition, definition, "function definition "+index+" variable "+variableIndex+" must reference its own definition");
        assert.strictEqual(variable.index, variableIndex, "function definition "+index+" variable "+variableIndex+" must reference its own index");
        assert.strictEqual(types.isValidType(variable.type), true, "function definition "+index+" variable "+variableIndex+" must be of a valid type");
    });
    assert.strictEqual(typeof definition.byteOffset, "number", "function definition "+index+" byte offset must be a number");
    assert.strictEqual(definition.byteOffset%1, 0, "function definition "+index+" byte offset must be an integer");
    assert.strictEqual(typeof definition.byteLength, "number", "function definition "+index+" byte length must be a number");
    assert.strictEqual(definition.byteLength%1, 0, "function definition "+index+" byte length must be an integer");
    assert(definition.ast === null || definition.ast instanceof StmtList, "function definition "+index+" ast must be a StmtList (or null if skipAhead=true)");
};

/**
 * Validates function declarations.
 * @throws {assert.AssertionError}
 */
Assembly.prototype.validateFunctionDeclarations = function() {
    assert.strictEqual(Array.isArray(this.functionDeclarations), true, "function declarations must be an array");
    this.functionDeclarations.forEach(function(declaration, index) {
        Assembly.validateFunctionDeclaration(this, declaration, index);
    }, this);
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

/**
 * Sets the function pointer table at the specified index.
 * @param {number} index
 * @param {number} signatureIndex
 * @param {!Array.<number>=} elements
 * @returns {!reflect.FunctionPointerTable}
 */
Assembly.prototype.setFunctionPointerTable = function(index, signatureIndex, elements) {
    var size = this.getFunctionPointerTablePoolSize();
    assertInteger("index", index, 0, size-1);
    var ssize = this.getFunctionSignaturePoolSize();
    assertInteger("signatureIndex", signatureIndex, 0, ssize-1);
    return this.functionPointerTables[index] = new FunctionPointerTable(this, signatureIndex, elements);
};

/**
 * Gets the function pointer table at the specified index.
 * @param {number} index
 * @returns {!reflect.FunctionPointerTable}
 */
Assembly.prototype.getFunctionPointerTable = function(index) {
    var size = this.getFunctionPointerTablePoolSize();
    assertInteger("index", index, 0, size-1);
    return this.functionPointerTables[index];
};

/**
 * Validate a function pointer table.
 * @param {!reflect.Assembly} assembly
 * @param {!reflect.FunctionPointerTable} table
 * @param {number} index
 * @throws {assert.AssertionError}
 */
Assembly.validateFunctionPointerTable = function(assembly, table, index) {
    assert.strictEqual(table instanceof FunctionPointerTable, true, "function pointer table "+index+" must be a FunctionPointerTable");
    assert.notEqual(assembly.functionPointerTables.indexOf(table), -1, "function pointer table "+index+" must be part of this assembly");
    assert.strictEqual(table.assembly, assembly, "function pointer table "+index+" must reference this assembly");
    assert.strictEqual(table.index, index, "function pointer table "+index+" must reference its own index");
    assert.strictEqual(table.signature instanceof FunctionSignature, true, "function pointer table "+index+" signature must be a FunctionSignature");
    assert.notEqual(assembly.functionSignatures.indexOf(table.signature), -1, "function pointer table "+index+" signature must be part of this assembly");
    assert.strictEqual(Array.isArray(table.elements), true, "function pointer table "+index+" elements must be an array");
    table.elements.forEach(function(element, elementIndex) {
        assert.strictEqual(element instanceof FunctionPointerElement, true, "function pointer table "+index+" element "+elementIndex+" must be a FunctionPointerElement");
        assert.strictEqual(element.table, table, "function pointer table "+index+" element "+elementIndex+" must reference its own table");
        assert.strictEqual(typeof element.value, "number", "function pointer table "+index+" element "+elementIndex+" value must be a number");
        assert.strictEqual(element.value%1, 0, "function pointer table "+index+" element "+elementIndex+" value must be an integer");
    }, this);
};

/**
 * Validates function pointer tables.
 * @throws {assert.AssertionError}
 */
Assembly.prototype.validateFunctionPointerTables = function() {
    assert.strictEqual(Array.isArray(this.functionPointerTables), true, "function pointer tables must be an array");
    this.functionPointerTables.forEach(function(table, index) {
        Assembly.validateFunctionPointerTable(this, table, index);
    }, this);
};

// ----- function definitions -----

/**
 * Sets the function definition at the specified index.
 * @param {number} index
 * @param {number} nI32vars
 * @param {number} nF32vars
 * @param {number} nF64vars
 * @param {number=} byteOffset
 * @param {number=} byteLength
 * @returns {!reflect.FunctionDefinition}
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
 * @returns {!reflect.FunctionDefinition}
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
 * @returns {!reflect.DefaultExport}
 */
Assembly.prototype.setDefaultExport = function(functionIndex) {
    var size = this.getFunctionDeclarationPoolSize();
    assertInteger("functionIndex", functionIndex, 0, size-1);
    return this.export = new DefaultExport(this, functionIndex);
};

/**
 * Sets the export defined in record format.
 * @param {!Object.<string,number>} functionIndexes
 * @returns {!reflect.RecordExport}
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

/**
 * Validates the export.
 * @throws {assert.AssertionError}
 */
Assembly.prototype.validateExport = function() {
    assert(this.export instanceof DefaultExport || this.export instanceof RecordExport, "export must be a DefaultExport or RecordExport");
    assert.strictEqual(this.export.assembly, this, "export must reference this assembly");
    if (this.export instanceof DefaultExport) {
        assert.strictEqual(this.export.function instanceof FunctionDeclaration, true, "export function must be a FunctionDeclaration");
        assert.notEqual(this.functionDeclarations.indexOf(this.export.function), -1, "export function must be part of this assembly");
    } else {
        assert.strictEqual(this.export.functions && typeof this.export.functions === 'object', true, "export functions must be an object");
        Object.keys(this.export.functions).forEach(function(name, index) {
            assert.strictEqual(util.isValidFName(name), true, "export functions "+index+" must have a valid name");
            assert.strictEqual(this.export.functions[name] instanceof FunctionDeclaration, true, "export functions "+index+" must be a FunctionDeclaration");
            assert.notEqual(this.functionDeclarations.indexOf(this.export.functions[name]), -1, "export functions "+index+" must be part of this assembly");
        }, this);
    }
};

// ----- general -----

/**
 * Generates a local name.
 * @param {number} index
 * @returns {string}
 */
Assembly.prototype.localName = function(index) {
    return util.indexedName(util.FirstCharRangeMinusDollar, index + types.HotStdLibNames.length);
};

/**
 * Generates a global name.
 * @param {number} index
 * @returns {string}
 */
Assembly.prototype.globalName = function(index) {
    return '$' + util.indexedName(util.NextCharRange, index + types.StdLibNames.length);
};

Assembly.prototype.toString = function() {
    return "Assembly"
         + " size:" + this.precomputedSize
         + " I32s:" + this.constantsI32.length
         + " F32s:" + this.constantsF32.length
         + " F64s:" + this.constantsF64.length
         + " sigs:" + this.functionSignatures.length
         + " imps:" + this.functionImports.length
         + " impSigs:" + this.functionImportSignatures.length
         + " globals:" + this.globalVariables.length
         + " decls:" + this.functionDeclarations.length;
};

/**
 * Validates this assembly.
 * @throws {assert.AssertionError}
 */
Assembly.prototype.validate = function() {
    this.validateConstantPools();
    this.validateFunctionSignatures();
    this.validateFunctionImports();
    this.validateGlobalVariables();
    this.validateFunctionDeclarations();
    this.validateFunctionPointerTables();
    this.validateExport();
    return true;
};

/**
 * Builds the assembly header in asm.js.
 * @param {bool=} pack
 * @returns {string}
 */
Assembly.prototype.asmHeader = function(pack) {
    var indent = pack ? "" : "    ",
        ws = pack ? "" : " ",
        nl = pack ? "" : "\n";
    var sb = [];
    sb.push("function asmModule($a,$b,$c)", ws, "{", nl, indent, "'use asm';", nl);
    sb.push(indent, "var ");
    var n = 0;
    util.values(types.HotStdLib).forEach(function(index) {
        var ctor = types.HotStdLibCtorNames[index];
        if (ctor)
            sb.push(index > 0 ? indent : "", util.hotStdLibName(index), ws, "=", ws, util.stdLibName(types.StdLib.stdlib), ".", types.HotStdLibCtorNames[index], "(", util.stdLibName(types.StdLib.buffer), "),", nl);
        else
            sb.push(indent, util.hotStdLibName(index), ws, "=", ws, util.stdLibName(types.StdLib.stdlib), ".Math.", types.HotStdLibNames[index].toLowerCase(), ",", nl);
    }, this);
    util.values(types.StdLib).forEach(function(index) {
        if (index < 3)
            return;
        switch (index) {
            case types.StdLib.acos:
            case types.StdLib.asin:
            case types.StdLib.atan:
            case types.StdLib.cos:
            case types.StdLib.sin:
            case types.StdLib.tan:
            case types.StdLib.exp:
            case types.StdLib.log:
            case types.StdLib.ceil:
            case types.StdLib.floor:
            case types.StdLib.sqrt:
            case types.StdLib.abs:
            case types.StdLib.min:
            case types.StdLib.max:
            case types.StdLib.atan2:
            case types.StdLib.pow:
            case types.StdLib.clz32:
                sb.push(indent, util.stdLibName(index), ws, "=", ws, util.stdLibName(types.StdLib.stdlib), ".Math.", types.StdLibNames[index], ",", nl);
                break;
            case types.StdLib.NaN:
            case types.StdLib.Infinity:
                sb.push(indent, util.stdLibName(index), ws, "=", ws, util.stdLibName(types.StdLib.stdlib), ".", types.StdLibNames[index], ",", nl);
                break;
            default:
                throw Error("unreachable");
        }
    }, this);
    this.functionImports.forEach(function(imprt, index) {
        sb.push(indent, imprt.name, ws, "=", ws, util.stdLibName(types.StdLib.foreign), ".", imprt.importName, ",", nl);
    }, this);
    this.globalVariables.forEach(function(variable, index) {
        if (variable.importName === null) {
            sb.push(indent, variable.name, ws, "=", ws);
            switch (variable.type) {
                case types.Type.I32:
                    sb.push("0", ",", nl);
                    break;
                case types.Type.F32:
                    sb.push(util.hotStdLibName(types.HotStdLib.FRound), "(0)", ",", nl);
                    break;
                case types.Type.F64:
                    sb.push("0.", ",", nl);
                    break;
                default:
                    throw Error("unreachable");
            }
        } else {
            sb.push(indent, variable.name, ws, "=", ws);
            switch (variable.type) {
                case types.Type.I32:
                    sb.push(util.stdLibName(types.StdLib.foreign), ".", variable.importName, "|0", ",", nl);
                    break;
                case types.Type.F32:
                    sb.push(util.hotStdLibName(types.HotStdLib.FRound), "(", util.stdLibName(types.StdLib.foreign), ".", variable.importName, ")", ",", nl);
                    break;
                case types.Type.F64:
                    sb.push("+", util.stdLibName(types.StdLib.foreign), ".", variable.importName, ",", nl);
                    break;
                default:
                    throw Error("unreachable");
            }
        }
    });
    sb[sb.length-2] = ";"; // override last ","
    return sb.join("");
};

// ----- optimization -----

/**
 * Optimizes this assembly.
 * @returns {number}
 */
Assembly.prototype.optimize = function() {
    var n = 0;

    // Remove duplicate function signatures
    var existingSignatures = {};
    for (var i=0; i<this.functionSignatures.length;) {
        var signature = this.functionSignatures[i];
        var sig = [];
        sig.push(signature.returnType.toString(), ":");
        signature.argumentTypes.forEach(function(type, i) {
            if (i > 0)
                sig.push(",");
            sig.push(type.toString());
        });
        sig = sig.join("");
        if (existingSignatures.hasOwnProperty(sig)) {
            signature._indexOverride = existingSignatures[sig]; // Override index used by still linked structures
            this.functionSignatures.splice(i, 1);
            ++n;
        } else {
            existingSignatures[sig] = signature.index;
            ++i;
        }
    }

    // TODO: function pointer mask (length-1) must be a power of 2-1
    /* this.functionPointerTables.forEach(function(table) {
        var existingElements = [];
        for (var i=0; i<table.elements.length;) {
            var element = table.elements[i];
            if (existingElements.indexOf(element.value) >= 0) {
                table.elements.splice(i, 1);
                ++n;
            } else {
                existingElements.push(element.value);
                ++i;
            }
        }
    }, this); */

    // Optimize statements
    this.functionDeclarations.forEach(function(declaration) {
        n += declaration.definition.optimize();
    }, this);

    return n;
};

// ----- convenience -----

/**
 * Defines a new function with an empty body and returns the function definition.
 * @param {number} returnType
 * @param {!Array.<number>} argumentTypes
 * @returns {!reflect.FunctionDefinition}
 */
Assembly.prototype.defineFunction = function(returnType, argumentTypes) {
    var signature = this.setFunctionSignature(this.functionSignatures.length++, returnType, argumentTypes),
        declaration = this.setFunctionDeclaration(this.functionDeclarations.length++, signature.index),
        definition = this.setFunctionDefinition(declaration.index, 0, 0, 0);
    definition.ast = new StmtList();
    return definition;
};
