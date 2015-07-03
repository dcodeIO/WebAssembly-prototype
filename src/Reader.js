/*
 Copyright 2015 Daniel Wirtz <dcode@dcode.io>

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
var stream = require("stream"),
    util   = require("./util"),
    types  = require("./types"),
    AstReader = require("./ast/Reader"),
    StmtList = require("./stmt/StmtList");

var Assembly = require("./reflect/Assembly");

/**
 * A WebAssembly reader implemented as a writable stream.
 * @extends stream.Writable
 * @param {!Object.<string,*>=} options 'skipAhead' skips parsing ASTs in detail
 * @exports Reader
 */
function Reader(options) {
    stream.Writable.call(this, options);

    /**
     * Current state.
     * @type {number}
     * @see Reader.State
     */
    this.state = Reader.State.HEADER;

    /**
     * Buffer queue.
     * @type {!util.BufferQueue}
     */
    this.bufferQueue = new util.BufferQueue();

    /**
     * Read sequence of the current operation.
     * @type {number}
     */
    this.sequence = 0;

    /**
     * Assembly to populate.
     * @type {reflect.Assembly}
     */
    this.assembly = null;

    /**
     * AstReader instance, if currently reading an AST.
     * @type {ast.Reader}
     */
    this.astReader = null;

    /**
     * Options.
     * @type {!Object.<string,*>}
     */
    this.options = options || {};
}

module.exports = Reader;

// Extends stream.Writable
Reader.prototype = Object.create(stream.Writable.prototype);

/**
 * Global offset.
 * @name Reader#offset
 * @type {number}
 */
Object.defineProperty(Reader.prototype, "offset", {
    get: function() {
        return this.bufferQueue.offset
    }
});

/**
 * States.
 * @type {!Object.<string,number>}
 * @const
 */
Reader.State = {
    HEADER: 0,
    CONSTANTS_COUNT: 1,
    CONSTANTS_I32: 2,
    CONSTANTS_F32: 3,
    CONSTANTS_F64: 4,
    SIGNATURES_COUNT: 5,
    SIGNATURES: 6,
    FUNCTION_IMPORTS_COUNT: 7,
    FUNCTION_IMPORTS: 8,
    GLOBAL_VARIABLES_COUNT: 9,
    GLOBAL_VARIABLES: 10,
    FUNCTION_DECLARATIONS_COUNT: 11,
    FUNCTION_DECLARATIONS: 12,
    FUNCTION_POINTER_TABLES_COUNT: 13,
    FUNCTION_POINTER_TABLES: 14,
    FUNCTION_DEFINITIONS: 15,
    EXPORT: 16,
    END: 17,
    ERROR: 18
};

Reader.prototype._write = function (chunk, encoding, callback) {
    if (this.state === Reader.State.END) {
        callback(new Error("already ended"));
        return;
    }
    if (this.astReader !== null) {
        this.astReader.write(chunk, encoding, callback);
        return;
    }
    if (encoding)
        chunk = new Buffer(chunk, encoding);
    if (chunk.length === 0) {
        callback();
        return;
    }
    this.bufferQueue.push(chunk);
    this._process();
    callback();
};

Reader.prototype._process = function() {
    if (this.state === Reader.State.END)
        return;
    do {
        var initialState = this.state;
        try {
            switch (this.state) {
                case Reader.State.HEADER:
                    this._readHeader();
                    break;
                case Reader.State.CONSTANTS_COUNT:
                    this._readConstantsCount();
                    break;
                case Reader.State.CONSTANTS_I32:
                    this._readConstantsI32();
                    break;
                case Reader.State.CONSTANTS_F32:
                    this._readConstantsF32();
                    break;
                case Reader.State.CONSTANTS_F64:
                    this._readConstantsF64();
                    break;
                case Reader.State.SIGNATURES_COUNT:
                    this._readSignaturesCount();
                    break;
                case Reader.State.SIGNATURES:
                    this._readSignatures();
                    break;
                case Reader.State.FUNCTION_IMPORTS_COUNT:
                    this._readFunctionImportsCount();
                    break;
                case Reader.State.FUNCTION_IMPORTS:
                    this._readFunctionImports();
                    break;
                case Reader.State.GLOBAL_VARIABLES_COUNT:
                    this._readGlobalVariablesCount();
                    break;
                case Reader.State.GLOBAL_VARIABLES:
                    this._readGlobalVariables();
                    break;
                case Reader.State.FUNCTION_DECLARATIONS_COUNT:
                    this._readFunctionDeclarationsCount();
                    break;
                case Reader.State.FUNCTION_DECLARATIONS:
                    this._readFunctionDeclarations();
                    break;
                case Reader.State.FUNCTION_POINTER_TABLES_COUNT:
                    this._readFunctionPointerTablesCount();
                    break;
                case Reader.State.FUNCTION_POINTER_TABLES:
                    this._readFunctionPointerTables();
                    break;
                case Reader.State.FUNCTION_DEFINITIONS:
                    if (this._readFunctionDefinitions())
                        return; // controlled by AstReader
                    break;
                case Reader.State.EXPORT:
                    this._readExport();
                    break;
                case Reader.State.END:
                    if (this.bufferQueue.remaining > 0)
                        throw Error("illegal trailing data: " + this.bufferQueue.remaining);
                    this.emit("end", this.assembly);
                    return;
                case Reader.State.ERROR:
                    return;
                default:
                    throw Error("illegal state: " + this.state);
            }
        } catch (err) {
            if (err === util.BufferQueue.E_MORE)
                return; // Wait for more
            this.emit("error", err);
            this.state = Reader.State.ERROR;
            return;
        } finally {
            this.bufferQueue.reset();
        }
        if (this.state !== initialState)
            this.emit("switchState", initialState, this.state, this.offset);
    } while (true);
};

Reader.prototype._readHeader = function () {
    var magic = this.bufferQueue.readUInt32LE(),
        size = this.bufferQueue.readUInt32LE();
    if (magic !== types.MagicNumber)
        throw Error("wrong magic number");
    this.bufferQueue.advance();
    this.assembly = new Assembly(size, this.options);
    this.state = Reader.State.CONSTANTS_COUNT;
    this.emit("header", size);
};

Reader.prototype._readConstantsCount = function () {
    var countI32 = this.bufferQueue.readVarint(),
        countF32 = this.bufferQueue.readVarint(),
        countF64 = this.bufferQueue.readVarint();
    this.bufferQueue.advance();
    this.assembly.initConstantPools(countI32, countF32, countF64);
    this.sequence = 0;
    this.state = Reader.State.CONSTANTS_I32;
    this.emit("constants", countI32, countF32, countF64);
};

Reader.prototype._readConstantsI32 = function () {
    var size = this.assembly.getConstantPoolSize(types.Type.I32);
    while (this.sequence < size) {
        var value = this.bufferQueue.readVarint(),
            index = this.sequence++;
        this.bufferQueue.advance();
        var constant = this.assembly.setConstant(types.Type.I32, index, value);
        this.emit("constant", constant, index);
    }
    this.sequence = 0;
    this.state = Reader.State.CONSTANTS_F32;
};

Reader.prototype._readConstantsF32 = function () {
    var size = this.assembly.getConstantPoolSize(types.Type.F32);
    while (this.sequence < size) {
        var value = this.bufferQueue.readFloatLE(),
            index = this.sequence++;
        this.bufferQueue.advance();
        var constant = this.assembly.setConstant(types.Type.F32, index, value);
        this.emit("constant", constant, index);
    }
    this.sequence = 0;
    this.state = Reader.State.CONSTANTS_F64;
};

Reader.prototype._readConstantsF64 = function () {
    var size = this.assembly.getConstantPoolSize(types.Type.F64);
    while (this.sequence < size) {
        var value = this.bufferQueue.readDoubleLE(),
            index = this.sequence++;
        this.bufferQueue.advance();
        var constant = this.assembly.setConstant(types.Type.F64, index, value);
        this.emit("constant", constant, index);
    }
    this.emit("constantsEnd");
    this.state = Reader.State.SIGNATURES_COUNT;
};

Reader.prototype._readSignaturesCount = function () {
    var count = this.bufferQueue.readVarint();
    this.bufferQueue.advance();
    this.assembly.initFunctionSignaturePool(count);
    this.sequence = 0;
    this.state = Reader.State.SIGNATURES;
    this.emit("functionSignatures", count);
};

Reader.prototype._readSignatures = function () {
    var size = this.assembly.getFunctionSignaturePoolSize();
    while (this.sequence < size) {
        var returnType = this.bufferQueue.readUInt8(),
            argumentCount = this.bufferQueue.readVarint();
        this.bufferQueue.ensure(argumentCount);
        var args = new Array(argumentCount);
        for (var i = 0; i < argumentCount; ++i)
            args[i] = this.bufferQueue.readUInt8();
        this.bufferQueue.advance();
        var index = this.sequence++;
        var sig = this.assembly.setFunctionSignature(index, returnType, args);
        this.emit("functionSignature", sig, index);
    }
    this.emit("functionSignaturesEnd");
    this.state = Reader.State.FUNCTION_IMPORTS_COUNT;
};

Reader.prototype._readFunctionImportsCount = function () {
    var count = this.bufferQueue.readVarint(),
        signatureCount = this.bufferQueue.readVarint();
    this.bufferQueue.advance();
    this.assembly.initFunctionImportPool(count, signatureCount);
    this.sequence = 0;
    this.state = Reader.State.FUNCTION_IMPORTS;
    this.emit("functionImports", count, signatureCount);
};

Reader.prototype._readFunctionImports = function () {
    var size = this.assembly.getFunctionImportPoolSize();
    while (this.sequence < size) {
        var importName = this.bufferQueue.readCString(),
            signatureCount = this.bufferQueue.readVarint();
        var signatureIndexes = new Array(signatureCount);
        for (var i = 0; i < signatureCount; ++i)
            signatureIndexes[i] = this.bufferQueue.readVarint();
        this.bufferQueue.advance();
        var index = this.sequence++;
        var imp = this.assembly.setFunctionImport(index, importName, signatureIndexes);
        this.emit("functionImport", imp, index);
    }
    this.emit("functionImportsEnd");
    this.state = Reader.State.GLOBAL_VARIABLES_COUNT;
};

Reader.prototype._readGlobalVariablesCount = function () {
    var countI32Zero = this.bufferQueue.readVarint(),
        countF32Zero = this.bufferQueue.readVarint(),
        countF64Zero = this.bufferQueue.readVarint(),
        countI32Import = this.bufferQueue.readVarint(),
        countF32Import = this.bufferQueue.readVarint(),
        countF64Import = this.bufferQueue.readVarint();
    this.bufferQueue.advance();
    this.sequence = this.assembly.initGlobalVariablePool(countI32Zero, countF32Zero, countF64Zero, countI32Import, countF32Import, countF64Import);
    this.state = Reader.State.GLOBAL_VARIABLES;
    this.emit("globalVariables", countI32Zero, countF32Zero, countF64Zero, countI32Import, countF32Import, countF64Import);
    for (var i=0; i<this.sequence; ++i)
        this.emit("globalVariable", this.assembly.globalVariables[i]);
};

Reader.prototype._readGlobalVariables = function () {
    var size = this.assembly.getGlobalVariablePoolSize();
    while (this.sequence < size) {
        var importName = this.bufferQueue.readCString();
        this.bufferQueue.advance();
        var index = this.sequence++;
        var global = this.assembly.getGlobalVariable(index);
        global.importName = importName;
        this.emit("globalVariable", global, index);
    }
    this.emit("globalVariablesEnd");
    this.state = Reader.State.FUNCTION_DECLARATIONS_COUNT;
};

Reader.prototype._readFunctionDeclarationsCount = function () {
    var count = this.bufferQueue.readVarint();
    this.bufferQueue.advance();
    this.assembly.initFunctionDeclarationPool(count);
    this.sequence = 0;
    this.state = Reader.State.FUNCTION_DECLARATIONS;
    this.emit("functionDeclarations", count);
};

Reader.prototype._readFunctionDeclarations = function () {
    var size = this.assembly.getFunctionDeclarationPoolSize();
    while (this.sequence < size) {
        var signatureIndex = this.bufferQueue.readVarint(),
            index = this.sequence++;
        this.bufferQueue.advance();
        this.emit("functionDeclaration", this.assembly.setFunctionDeclaration(index, signatureIndex), index);
    }
    this.emit("functionDeclarationsEnd");
    this.state = Reader.State.FUNCTION_POINTER_TABLES_COUNT;
};

Reader.prototype._readFunctionPointerTablesCount = function () {
    var count = this.bufferQueue.readVarint();
    this.bufferQueue.advance();
    this.assembly.initFunctionPointerTablePool(count);
    this.sequence = 0;
    this.state = Reader.State.FUNCTION_POINTER_TABLES;
    this.emit("functionPointerTables", count);
};

Reader.prototype._readFunctionPointerTables = function () {
    var size = this.assembly.getFunctionPointerTablePoolSize();
    while (this.sequence < size) {
        var signatureIndex = this.bufferQueue.readVarint(),
            countElements = this.bufferQueue.readVarint();
        var elements = new Array(countElements);
        for (var i = 0; i < countElements; ++i)
            elements[i] = this.bufferQueue.readVarint();
        this.bufferQueue.advance();
        var index = this.sequence++;
        this.emit("functionPointerTable", this.assembly.setFunctionPointerTable(index, signatureIndex, elements), index);
    }
    this.emit("functionPointerTablesEnd");
    this.state = Reader.State.FUNCTION_DEFINITIONS;
    this.sequence = 0;
    this.emit("functionDefinitions", this.assembly.getFunctionDeclarationPoolSize());
};

Reader.prototype._readFunctionDefinitions = function() {
    var size = this.assembly.getFunctionDeclarationPoolSize();
    if (this.sequence < size) {
        var nI32Vars = 0,
            nF32Vars = 0,
            nF64Vars = 0;
        var code = util.unpackCode(this.bufferQueue.readUInt8());
        if (code.imm === null) {
            if ((code.op & types.VarType.I32) === types.VarType.I32)
                nI32Vars = this.bufferQueue.readVarint();
            if ((code.op & types.VarType.F32) === types.VarType.F32)
                nF32Vars = this.bufferQueue.readVarint();
            if ((code.op & types.VarType.F64) === types.VarType.F64)
                nF64Vars = this.bufferQueue.readVarint();
        } else
            nI32Vars = code.imm;
        this.bufferQueue.advance();
        var index = this.sequence;
        var definition = this.assembly.setFunctionDefinition(index, nI32Vars, nF32Vars, nF64Vars, this.bufferQueue.offset);
        this.emit("functionDefinitionPre", definition, index);

        // Read the AST
        this.astReader = new AstReader(definition, this.bufferQueue, this.options);
        this.astReader.on("end", function() {
            definition.byteLength = this.bufferQueue.offset - definition.byteOffset;
            if (!this.options.skipAhead)
                definition.ast = this.astReader.stack[0];
            this.emit("functionDefinition", definition, index);
            this.astReader.removeAllListeners();
            this.astReader = null;
            this.state = Reader.State.FUNCTION_DEFINITIONS;
            ++this.sequence;
            setImmediate(Reader.prototype._process.bind(this));
        }.bind(this));
        this.astReader.on("error", function(err) {
            this.emit("error", err);
        }.bind(this));
        this.astReader.bufferQueue = this.bufferQueue;
        this.astReader._process();
        return true;
    }
    this.emit("functionDefinitionsEnd");
    this.state = Reader.State.EXPORT;
    return false;
};

Reader.prototype._readExport = function() {
    var format = this.bufferQueue.readUInt8(),
        exprt;
    switch (format) {
        case types.ExportFormat.Default:
            var functionIndex = this.bufferQueue.readVarint();
            this.bufferQueue.advance();
            exprt = this.assembly.setDefaultExport(functionIndex);
            break;
        case types.ExportFormat.Record:
            var count = this.bufferQueue.readVarint(),
                functionIndexes = {};
            for (var i=0; i<count; ++i) {
                var name = this.bufferQueue.readCString();
                functionIndexes[name] = this.bufferQueue.readVarint();
            }
            this.bufferQueue.advance();
            exprt = this.assembly.setRecordExport(functionIndexes);
            break;
        default:
            throw Error("illegal export format: "+format);
    }
    this.emit("export", exprt);
    this.state = Reader.State.END;
};
