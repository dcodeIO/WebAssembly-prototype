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
    AstReader = require("./AstReader"),
    StmtList = require("./stmt/StmtList");

var Assembly = require("./reflect/Assembly");

/**
 * A WebAssembly reader implemented as a writable stream.
 * @extends stream.Writable
 * @param {!Object.<string,*>=} options 'skipAhead' skips parsing ASTs in detail
 * @exports Reader
 */
var Reader = module.exports = function (options) {
    stream.Writable.call(this, options);

    /**
     * Current state.
     * @type {number}
     * @see Reader.State
     */
    this.state = Reader.State.HEADER;

    /**
     * Read buffer.
     * @type {Buffer}
     */
    this.buffer = null;

    /**
     * Read buffer queue.
     * @type {!Array.<!Buffer>}
     */
    this.queue = []; // Used to minimize calls to Buffer.concat

    /**
     * Read offset since start.
     * @type {number}
     */
    this.offset = 0;

    /**
     * Read sequence of the current operation.
     * @type {number}
     */
    this.sequence = 0;

    /**
     * Assembly to populate.
     * @type {Assembly}
     */
    this.assembly = null;

    /**
     * AstReader instance, if currently reading an AST.
     * @type {AstReader}
     */
    this.astReader = null;

    /**
     * Options.
     * @type {!Object.<string,*>}
     */
    this.options = options || {};
};

// Extends stream.Writable
Reader.prototype = Object.create(stream.Writable.prototype);

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
    if (this.astReader !== null) {
        this.astReader.write(chunk, encoding, callback);
        return;
    }
    if (encoding)
        chunk = new Buffer(chunk, encoding);
    if (this.buffer === null || this.buffer.length === 0)
        this.buffer = chunk;
    else
        this.queue.push(chunk);
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
                    if (this._readFunctionDefinitions()) {
                        callback();
                        return; // controlled by AstReader
                    }
                    break;
                case Reader.State.EXPORT:
                    this._readExport();
                    break;
                case Reader.State.END:
                    if (this.buffer.length > 0)
                        throw Error("illegal trailing data: " + this.buffer.length);
                    this.emit("end", this.assembly);
                    return;
                case Reader.State.ERROR:
                    return;
                default:
                    throw Error("illegal state: " + this.state);
            }
        } catch (err) {
            if (err === util.E_MORE) {
                if (this.queue.length > 0) {
                    this.queue.unshift(this.buffer);
                    this.buffer = Buffer.concat(this.queue);
                    this.queue = [];
                    continue; // Try again
                }
                callback();
                return; // Wait for more
            }
            this.emit("error", err);
            this.state = Reader.State.ERROR;
        }
        if (this.state !== initialState)
            this.emit("switchState", initialState, this.state, this.offset);
    } while (true);
};

Reader.prototype._advance = function (nBytes) {
    this.buffer = this.buffer.slice(nBytes);
    this.offset += nBytes;
};

Reader.prototype._readHeader = function () {
    if (this.buffer.length < 8)
        throw util.E_MORE;
    var off = 0;
    var magic = this.buffer.readUInt32LE(off);
    off += 4;
    if (magic !== types.MagicNumber)
        throw Error("wrong magic number");
    var size = this.buffer.readUInt32LE(off);
    off += 4;
    this._advance(off);
    this.assembly = new Assembly(size, this.options);
    this.state = Reader.State.CONSTANTS_COUNT;
    this.emit("header", size);
};

Reader.prototype._readConstantsCount = function () {
    var off = 0, vi;
    vi = util.readVarint(this.buffer, off); off += vi.length;
    var nI32 = vi.value;
    vi = util.readVarint(this.buffer, off); off += vi.length;
    var nF32 = vi.value;
    vi = util.readVarint(this.buffer, off); off += vi.length;
    var nF64 = vi.value;
    this._advance(off);
    this.assembly.initConstantPools(nI32, nF32, nF64);
    this.sequence = 0;
    this.state = Reader.State.CONSTANTS_I32;
    this.emit("constants", nI32, nF32, nF64);
};

Reader.prototype._readConstantsI32 = function () {
    var size = this.assembly.getConstantPoolSize(types.Type.I32);
    while (this.sequence < size) {
        var vi = util.readVarint(this.buffer, 0);
        this._advance(vi.length);
        var index = this.sequence++;
        this.assembly.setConstant(types.Type.I32, index, vi.value);
        this.emit("constant", types.Type.I32, vi.value, index);
    }
    this.sequence = 0;
    this.state = Reader.State.CONSTANTS_F32;
};

Reader.prototype._readConstantsF32 = function () {
    var size = this.assembly.getConstantPoolSize(types.Type.F32);
    while (this.sequence < size) {
        if (this.buffer.length < 4)
            throw util.E_MORE;
        var value = this.buffer.readFloatLE(0);
        this._advance(4);
        var index = this.sequence++;
        this.assembly.setConstant(types.Type.F32, index, value);
        this.emit("constant", types.Type.F32, value, index);
    }
    this.sequence = 0;
    this.state = Reader.State.CONSTANTS_F64;
};

Reader.prototype._readConstantsF64 = function () {
    var size = this.assembly.getConstantPoolSize(types.Type.F64);
    while (this.sequence < size) {
        if (this.buffer.length < 8)
            throw util.E_MORE;
        var value = this.buffer.readDoubleLE(0);
        this._advance(8);
        var index = this.sequence++;
        var constant = this.assembly.setConstant(types.Type.F64, index, value);
        this.emit("constant", constant, index);
    }
    this.emit("constantsEnd");
    this.state = Reader.State.SIGNATURES_COUNT;
};

Reader.prototype._readSignaturesCount = function () {
    var off = 0;
    var vi = util.readVarint(this.buffer, off); off += vi.length;
    var nSigs = vi.value;
    this._advance(off);
    this.assembly.initFunctionSignaturePool(nSigs);
    this.sequence = 0;
    this.state = Reader.State.SIGNATURES;
    this.emit("functionSignatures", nSigs);
};

Reader.prototype._readSignatures = function () {
    var size = this.assembly.getFunctionSignaturePoolSize();
    while (this.sequence < size) {
        if (this.buffer.length < 2) // RTYPE+VARINT
            throw util.E_MORE;
        var off = 0;
        var rtype = this.buffer[off++];
        var vi = util.readVarint(this.buffer, off); off += vi.length;
        var nArgs = vi.value;
        if (this.buffer.length < off + nArgs)
            throw util.E_MORE;
        var args = new Array(nArgs);
        for (var i = 0; i < nArgs; ++i)
            args[i] = this.buffer[off++];
        this._advance(off);
        var index = this.sequence++;
        var sig = this.assembly.setFunctionSignature(index, rtype, args);
        this.emit("functionSignature", sig, index);
    }
    this.emit("functionSignaturesEnd");
    this.state = Reader.State.FUNCTION_IMPORTS_COUNT;
};

Reader.prototype._readFunctionImportsCount = function () {
    var off = 0, vi;
    vi = util.readVarint(this.buffer, off); off += vi.length;
    var count = vi.value;
    vi = util.readVarint(this.buffer, off); off += vi.length;
    var signatureCount = vi.value;
    this._advance(off);
    this.assembly.initFunctionImportPool(count, signatureCount);
    this.sequence = 0;
    this.state = Reader.State.FUNCTION_IMPORTS;
    this.emit("functionImports", count, signatureCount);
};

Reader.prototype._readFunctionImports = function () {
    var size = this.assembly.getFunctionImportPoolSize();
    while (this.sequence < size) {
        var off = 0;
        var cs = util.readCString(this.buffer, off); off += cs.length;
        var fname = cs.value;
        var vi = util.readVarint(this.buffer, off); off += vi.length;
        var nSigs = vi.value;
        var sigs = new Array(nSigs);
        for (var i = 0; i < nSigs; ++i) {
            vi = util.readVarint(this.buffer, off); off += vi.length;
            if (vi.value >= this.assembly.getFunctionSignaturePoolSize())
                throw Error("illegal signature reference: "+vi.value);
            sigs[i] = vi.value;
        }
        this._advance(off);
        var index = this.sequence++;
        var imp = this.assembly.setFunctionImport(index, fname, sigs);
        this.emit("functionImport", imp, index);
    }
    this.emit("functionImportsEnd");
    this.state = Reader.State.GLOBAL_VARIABLES_COUNT;
};

Reader.prototype._readGlobalVariablesCount = function () {
    var off = 0, vi;
    vi = util.readVarint(this.buffer, off); off += vi.length;
    var nI32zero = vi.value;
    vi = util.readVarint(this.buffer, off); off += vi.length;
    var nF32zero = vi.value;
    vi = util.readVarint(this.buffer, off); off += vi.length;
    var nF64zero = vi.value;
    vi = util.readVarint(this.buffer, off); off += vi.length;
    var nI32import = vi.value;
    vi = util.readVarint(this.buffer, off); off += vi.length;
    var nF32import = vi.value;
    vi = util.readVarint(this.buffer, off); off += vi.length;
    var nF64import = vi.value;
    this._advance(off);
    this.sequence = this.assembly.initGlobalVariablePool(nI32zero, nF32zero, nF64zero, nI32import, nF32import, nF64import);
    this.state = Reader.State.GLOBAL_VARIABLES;
    this.emit("globalVariables", nI32zero, nF32zero, nF64zero, nI32import, nF32import, nF64import);
    for (var i=0; i<this.sequence; ++i)
        this.emit("globalVariable", this.assembly.globalVariables[i]);
};

Reader.prototype._readGlobalVariables = function () {
    var size = this.assembly.getGlobalVariablePoolSize();
    while (this.sequence < size) {
        var off = 0;
        var cs = util.readCString(this.buffer, off);
        var fname = cs.value;
        this._advance(cs.length);
        var index = this.sequence++;
        var global = this.assembly.getGlobalVariable(index);
        global.importName = fname;
        this.emit("globalVariable", global, index);
    }
    this.emit("globalVariablesEnd");
    this.state = Reader.State.FUNCTION_DECLARATIONS_COUNT;
};

Reader.prototype._readFunctionDeclarationsCount = function () {
    var off = 0;
    var vi = util.readVarint(this.buffer, off); off += vi.length;
    var nDecls = vi.value;
    this._advance(off);
    this.assembly.initFunctionDeclarationPool(nDecls);
    this.sequence = 0;
    this.state = Reader.State.FUNCTION_DECLARATIONS;
    this.emit("functionDeclarations", nDecls);
};

Reader.prototype._readFunctionDeclarations = function () {
    var size = this.assembly.getFunctionDeclarationPoolSize();
    while (this.sequence < size) {
        var off = 0;
        var vi = util.readVarint(this.buffer, off); off += vi.length;
        this._advance(off);
        var index = this.sequence++;
        var decl = this.assembly.setFunctionDeclaration(index, vi.value);
        this.emit("functionDeclaration", decl, index);
    }
    this.emit("functionDeclarationsEnd");
    this.state = Reader.State.FUNCTION_POINTER_TABLES_COUNT;
};

Reader.prototype._readFunctionPointerTablesCount = function () {
    var off = 0;
    var vi = util.readVarint(this.buffer, off); off += vi.length;
    var nTables = vi.value;
    this._advance(off);
    this.assembly.initFunctionPointerTablePool(nTables);
    this.sequence = 0;
    this.state = Reader.State.FUNCTION_POINTER_TABLES;
    this.emit("functionPointerTables", nTables);
};

Reader.prototype._readFunctionPointerTables = function () {
    var size = this.assembly.getFunctionPointerTablePoolSize();
    while (this.sequence < size) {
        var off = 0;
        var vi = util.readVarint(this.buffer, off); off += vi.length;
        var sig = vi.value;
        vi = util.readVarint(this.buffer, off); off += vi.length;
        var nElems = vi.value;
        var elems = new Array(nElems);
        for (var i = 0; i < nElems; ++i) {
            vi = util.readVarint(this.buffer, off); off += vi.length;
            elems[i] = vi.value;
        }
        this._advance(off);
        var index = this.sequence++;
        var table = this.assembly.setFunctionPointerTable(index, sig, elems);
        this.emit("functionPointerTable", table, index);
    }
    this.emit("functionPointerTablesEnd");
    this.state = Reader.State.FUNCTION_DEFINITIONS;
    this.sequence = 0;
    this.emit("functionDefinitions", this.assembly.getFunctionDeclarationPoolSize());
};

Reader.prototype._readFunctionDefinitions = function() {
    var size = this.assembly.getFunctionDeclarationPoolSize();
    if (this.sequence < size) {
        var off = 0;
        var nI32Vars = 0,
            nF32Vars = 0,
            nF64Vars = 0;
        var code = util.readCode(this.buffer, off++);
        var vi;
        if (code.imm === null) {
            if ((code.op & types.VarType.I32) === types.VarType.I32) {
                vi = util.readVarint(this.buffer, off); off += vi.length;
                nI32Vars = vi.value;
            }
            if ((code.op & types.VarType.F32) === types.VarType.F32) {
                vi = util.readVarint(this.buffer, off); off += vi.length;
                nF32Vars = vi.value;
            }
            if ((code.op & types.VarType.F64) === types.VarType.F64) {
                vi = util.readVarint(this.buffer, off); off += vi.length;
                nF64Vars = vi.value;
            }
        } else {
            nI32Vars = code.imm;
        }
        this._advance(off);
        var index = this.sequence;
        var def = this.assembly.setFunctionDefinition(index, nI32Vars, nF32Vars, nF64Vars, this.offset);
        this.emit("functionDefinitionPre", def, index);

        // Read the AST
        this.astReader = new AstReader(def, this.options);
        this.astReader.on("end", function() {
            def.byteLength = this.astReader.offset;
            this.offset += def.byteLength;
            if (!this.options.skipAhead)
                def.ast = this.astReader.stack[0];
            this.emit("functionDefinition", def, index);
            var remainingBuffer = this.astReader.buffer;
            this.astReader.removeAllListeners();
            this.astReader = null;
            this.state = Reader.State.FUNCTION_DEFINITIONS;
            ++this.sequence;
            this.write(remainingBuffer);
        }.bind(this));
        this.astReader.on("error", function(err) {
            this.emit("error", err);
        }.bind(this));
        if (this.queue.length > 0) {
            this.queue.unshift(this.buffer);
            this.buffer = Buffer.concat(this.queue);
            this.queue = [];
        }
        this.astReader.write(this.buffer);
        this.buffer = null;
        return true;

    }
    this.emit("functionDefinitionsEnd");
    this.state = Reader.State.EXPORT;
    return false;
};

Reader.prototype._readExport = function() {
    if (this.buffer.length < 2) // format + fn/num
        throw util.E_MORE;
    var off = 0;
    var format = this.buffer[off++];
    var vi;
    var exprt;
    switch (format) {
        case types.ExportFormat.Default:
            vi = util.readVarint(this.buffer, off); off += vi.length;
            this._advance(off);
            exprt = this.assembly.setDefaultExport(vi.value);
            break;
        case types.ExportFormat.Record:
            vi = util.readVarint(this.buffer, off); off += vi.length;
            var nExports = vi.value;
            var indexes = {};
            for (var i=0; i<nExports; ++i) {
                var cs = util.readCString(this.buffer, off); off += cs.length;
                vi = util.readVarint(this.buffer, off); off += vi.length;
                indexes[cs.value] = vi.value;
            }
            this._advance(off);
            exprt = this.assembly.setRecordExport(indexes);
            break;
        default:
            throw Error("illegal export format: "+format);
    }
    this.emit("export", exprt);
    this.state = Reader.State.END;
};
