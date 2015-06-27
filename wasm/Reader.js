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
    StmtList = require("./StmtList");

/**
 * A WebAssembly Reader implemented as a writable stream.
 * @extends stream.Writable
 */
var Reader = module.exports = function (options) {
    stream.Writable.call(this, options);

    /**
     * Current state.
     * @type {number}
     * @see Reader.STATE
     */
    this.state = Reader.STATE.HEADER;

    /**
     * Read buffer.
     * @type {Buffer}
     */
    this.buffer = null;

    /**
     * Read offset since start.
     * @type {number}
     */
    this.offset = 0;

    /**
     * 32bit integer constants.
     * @type {Array.<number>}
     */
    this.constantsI32 = null;

    /**
     * 32bit float constants.
     * @type {Array.<number>}
     */
    this.constantsF32 = null;

    /**
     * 64bit float constants.
     * @type {Array.<number>}
     */
    this.constantsF64 = null;

    /**
     * Function signatures.
     * @type {Array<!{rtype: number, args: !Array.<number>}>}
     */
    this.signatures = null;

    /**
     * Function imports.
     * @type {Array<!{name: string, fname: string, sig: number}>}
     */
    this.functionImports = null;

    /**
     * Global variables.
     * @type {Array<!{type: number, fname: ?string}>}
     */
    this.globalVars = null;

    /**
     * Function declarations referencing function signatures.
     * @type {Array.<number>}
     */
    this.functionDeclarations = null;

    /**
     * Function pointers.
     * @type {Array.<!{sig: number, elems: Array.<number>}>}
     */
    this.functionPointers = null;

    /**
     * Function definitions (including local vars).
     * @type {Array.<!{sig: number, varsI32: number, varsF32: number, varsF64: number}>}
     */
    this.functionDefinitions = null;

    /**
     * Export.
     * @type {{format: number, func: number}|{format: number, funcs: !Object.<string,number>}}
     */
    this.export = null;

    /**
     * AstReader instance, if currently reading an AST.
     * @type {AstReader}
     */
    this.astReader = null;
};

// Extends stream.Writable
Reader.prototype = Object.create(stream.Writable.prototype);

/**
 * States.
 * @type {!Object.<string,number>}
 * @const
 */
Reader.STATE = {
    HEADER: 0,
    CONSTANTS_COUNT: 1,
    CONSTANTS_I32: 2,
    CONSTANTS_F32: 3,
    CONSTANTS_F64: 4,
    SIGNATURES_COUNT: 5,
    SIGNATURES: 6,
    FUNCTION_IMPORTS_COUNT: 7,
    FUNCTION_IMPORTS: 8,
    GLOBAL_VARS_COUNT: 9,
    GLOBAL_VARS: 10,
    FUNCTION_DECLARATIONS_COUNT: 11,
    FUNCTION_DECLARATIONS: 12,
    FUNCTION_POINTERS_COUNT: 13,
    FUNCTION_POINTERS: 14,
    FUNCTION_DEFINITIONS: 15,
    EXPORT: 16,
    END: 17
};

Reader.prototype._write = function (chunk, encoding, callback) {
    if (encoding)
        chunk = new Buffer(chunk, encoding);
    this.buffer = this.buffer === null ? chunk : Buffer.concat([this.buffer, chunk]);
    if (this.astReader !== null) {
        this.astReader.write(chunk, undefined, callback);
        return;
    }
    do {
        var initialState = this.state;
        try {
            switch (this.state) {
                case Reader.STATE.HEADER:
                    this._readHeader();
                    break;
                case Reader.STATE.CONSTANTS_COUNT:
                    this._readConstantsCount();
                    break;
                case Reader.STATE.CONSTANTS_I32:
                    this._readConstantsI32();
                    break;
                case Reader.STATE.CONSTANTS_F32:
                    this._readConstantsF32();
                    break;
                case Reader.STATE.CONSTANTS_F64:
                    this._readConstantsF64();
                    break;
                case Reader.STATE.SIGNATURES_COUNT:
                    this._readSignaturesCount();
                    break;
                case Reader.STATE.SIGNATURES:
                    this._readSignatures();
                    break;
                case Reader.STATE.FUNCTION_IMPORTS_COUNT:
                    this._readFunctionImportsCount();
                    break;
                case Reader.STATE.FUNCTION_IMPORTS:
                    this._readFunctionImports();
                    break;
                case Reader.STATE.GLOBAL_VARS_COUNT:
                    this._readGlobalVarsCount();
                    break;
                case Reader.STATE.GLOBAL_VARS:
                    this._readGlobalVars();
                    break;
                case Reader.STATE.FUNCTION_DECLARATIONS_COUNT:
                    this._readFunctionDeclarationsCount();
                    break;
                case Reader.STATE.FUNCTION_DECLARATIONS:
                    this._readFunctionDeclarations();
                    break;
                case Reader.STATE.FUNCTION_POINTERS_COUNT:
                    this._readFunctionPointersCount();
                    break;
                case Reader.STATE.FUNCTION_POINTERS:
                    this._readFunctionPointers();
                    break;
                case Reader.STATE.FUNCTION_DEFINITIONS:
                    this._readFunctionDefinitions();
                    callback();
                    return; // returns control to AstReader
                case Reader.STATE.EXPORT:
                    this._readExport();
                    break;
                case Reader.STATE.END:
                    if (this.buffer.length === 0) {
                        callback();
                        return;
                    }
                    throw Error("illegal trailing data: " + this.buffer.length);
                default:
                    throw Error("illegal state: " + this.state);
            }
        } catch (err) {
            if (err === util.E_MORE) {
                callback();
                return;
            }
            throw err;
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
    this.emit("header", size);
    this.state = Reader.STATE.CONSTANTS_COUNT;
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
    this.constantsI32 = new Array(nI32);
    this.constantsI32.offset = 0;
    this.constantsF32 = new Array(nF32);
    this.constantsF32.offset = 0;
    this.constantsF64 = new Array(nF64);
    this.constantsF64.offset = 0;
    this.emit("constantsCount", nI32, nF32, nF64);
    this.state = Reader.STATE.CONSTANTS_I32;
};

Reader.prototype._readConstantsI32 = function () {
    while (this.constantsI32.offset < this.constantsI32.length) {
        var vi = util.readVarint(this.buffer, 0);
        this.constantsI32[this.constantsI32.offset++] = vi.value;
        this._advance(vi.length);
    }
    delete this.constantsI32.offset;
    this.state = Reader.STATE.CONSTANTS_F32;
};

Reader.prototype._readConstantsF32 = function () {
    while (this.constantsF32.offset < this.constantsF32.length) {
        if (this.buffer.length < 4)
            throw util.E_MORE;
        this.constantsF32[this.constantsF32.offset++] = this.buffer.readFloatLE(0)
        this._advance(4);
    }
    delete this.constantsF32.offset;
    this.state = Reader.STATE.CONSTANTS_F64;
};

Reader.prototype._readConstantsF64 = function () {
    while (this.constantsF64.offset < this.constantsF64.length) {
        if (this.buffer.length < 8)
            throw util.E_MORE;
        this.constantsF64[this.constantsF64.offset++] = this.buffer.readDoubleLE(0);
        this._advance(8);
    }
    delete this.constantsF64.offset;
    this.emit("constants", this.constantsI32, this.constantsF32, this.constantsF64);
    this.state = Reader.STATE.SIGNATURES_COUNT;
};

Reader.prototype._readSignaturesCount = function () {
    var off = 0;
    var vi = util.readVarint(this.buffer, off); off += vi.length;
    var nSigs = vi.value;
    this._advance(off);
    this.signatures = new Array(nSigs);
    this.signatures.offset = 0;
    this.emit("signaturesCount", nSigs);
    this.state = Reader.STATE.SIGNATURES;
};

Reader.prototype._readSignatures = function () {
    while (this.signatures.offset < this.signatures.length) {
        if (this.buffer.length < 2) // RTYPE+VARINT
            throw util.E_MORE;
        var off = 0;
        var rtype = this.buffer.readUInt8(off++);
        var vi = util.readVarint(this.buffer, off); off += vi.length;
        var nArgs = vi.value;
        if (this.buffer.length < off + nArgs)
            throw util.E_MORE;
        var args = new Array(nArgs);
        for (var i = 0; i < nArgs; ++i)
            args[i] = this.buffer.readUInt8(off++);
        this.signatures[this.signatures.offset++] = {
            rtype: rtype,
            args: args
        };
        this._advance(off);
    }
    delete this.signatures.offset;
    this.emit("signatures", this.signatures);
    this.state = Reader.STATE.FUNCTION_IMPORTS_COUNT;
};

Reader.prototype._readFunctionImportsCount = function () {
    var off = 0, vi;
    vi = util.readVarint(this.buffer, off); off += vi.length;
    var nFunctionImports = vi.value;
    vi = util.readVarint(this.buffer, off); off += vi.length;
    var nSigs = vi.value;
    this._advance(off);
    this.functionImports = new Array(nFunctionImports);
    this.functionImports.sigs = nSigs;
    this.functionImports.offset = 0;
    this.emit("functionImportsCount", nFunctionImports, nSigs);
    this.state = Reader.STATE.FUNCTION_IMPORTS;
};

Reader.prototype._readFunctionImports = function () {
    while (this.functionImports.offset < this.functionImports.length) {
        var off = 0;
        var cs = util.readCString(this.buffer, off); off += cs.length;
        var fname = cs.value;
        var vi = util.readVarint(this.buffer, off); off += vi.length;
        var nSigs = vi.value;
        var sigs = new Array(nSigs);
        for (var i = 0; i < nSigs; ++i) {
            vi = util.readVarint(this.buffer, off); off += vi.length;
            if (vi.value >= this.signatures.length)
                throw Error("illegal signature reference: " + vi.value);
            sigs[i] = vi.value;
        }
        this._advance(off);
        this.functionImports[this.functionImports.offset++] = {
            name: "TODO",
            fname: fname,
            sig: sigs[sigs.length-1] // FIXME: Is this correct?
        };
    }
    delete this.functionImports.offset;
    this.emit("functionImports", this.functionImports);
    this.state = Reader.STATE.GLOBAL_VARS_COUNT;
};

Reader.prototype._readGlobalVarsCount = function () {
    var off = 0, vi;
    vi = util.readVarint(this.buffer, off); off += vi.length;
    var nI32Zero = vi.value;
    vi = util.readVarint(this.buffer, off); off += vi.length;
    var nF32Zero = vi.value;
    vi = util.readVarint(this.buffer, off); off += vi.length;
    var nF64Zero = vi.value;
    vi = util.readVarint(this.buffer, off); off += vi.length;
    var nI32Import = vi.value;
    vi = util.readVarint(this.buffer, off); off += vi.length;
    var nF32Import = vi.value;
    vi = util.readVarint(this.buffer, off); off += vi.length;
    var nF64Import = vi.value;
    var total = nI32Zero + nF32Zero + nF64Zero + nI32Import + nF32Import + nF64Import;
    this._advance(off);
    this.globalVars = new Array(total);
    this.globalVars.offset = 0;
    this.globalVars.rangeI32 = nI32Zero + nF32Zero + nF64Zero + nI32Import;
    this.globalVars.rangeF32 = this.globalVars.rangeI32 + nF32Import;
    for (var i = 0; i < nI32Zero; ++i) {
        this.globalVars[this.globalVars.offset++] = {
            type: types.Type.I32,
            fname: null
        };
    }
    for (i = 0; i < nF32Zero; ++i) {
        this.globalVars[this.globalVars.offset++] = {
            type: types.Type.F32,
            fname: null
        };
    }
    for (i = 0; i < nF64Zero; ++i) {
        this.globalVars[this.globalVars.offset++] = {
            type: types.Type.F64,
            fname: null
        };
    }
    this.emit("globalVarsCount", nI32Zero, nF32Zero, nF64Zero, nI32Import, nF32Import, nF64Import);
    this.state = Reader.STATE.GLOBAL_VARS;
};

Reader.prototype._readGlobalVars = function () {
    while (this.globalVars.offset < this.globalVars.length) {
        var off = 0;
        var cs = util.readCString(this.buffer, off);
        var fname = cs.value;
        this._advance(cs.length);
        var type = this.globalVars.offset < this.globalVars.rangeI32 ? types.Type.I32
            : this.globalVars.offset < this.globalVars.rangeF32 ? types.Type.F32
            : types.Type.F64;
        this.globalVars[this.globalVars.offset++] = {
            type: type,
            fname: fname
        };
    }
    delete this.globalVars.offset;
    delete this.globalVars.rangeI32;
    delete this.globalVars.rangeF32;
    this.emit("globalVars", this.globalVars);
    this.state = Reader.STATE.FUNCTION_DECLARATIONS_COUNT;
};

Reader.prototype._readFunctionDeclarationsCount = function () {
    var off = 0;
    var vi = util.readVarint(this.buffer, off); off += vi.length;
    var nFunctionDeclarations = vi.value;
    this._advance(off);
    this.functionDeclarations = new Array(nFunctionDeclarations);
    this.functionDeclarations.offset = 0;
    this.emit("functionDeclarationsCount", nFunctionDeclarations);
    this.state = Reader.STATE.FUNCTION_DECLARATIONS;
};

Reader.prototype._readFunctionDeclarations = function () {
    while (this.functionDeclarations.offset < this.functionDeclarations.length) {
        var off = 0;
        var vi = util.readVarint(this.buffer, off); off += vi.length;
        if (vi.value >= this.signatures.length)
            throw Error("illegal signature reference: "+vi.value);
        this._advance(off);
        this.functionDeclarations[this.functionDeclarations.offset++] = vi.value;
    }
    delete this.functionDeclarations.offset;
    this.emit("functionDeclarations", this.functionDeclarations);
    this.state = Reader.STATE.FUNCTION_POINTERS_COUNT;
};

Reader.prototype._readFunctionPointersCount = function () {
    var off = 0;
    var vi = util.readVarint(this.buffer, off); off += vi.length;
    var nFunctionPointers = vi.value;
    this._advance(off);
    this.functionPointers = new Array(nFunctionPointers);
    this.functionPointers.offset = 0;
    this.emit("functionPointersCount", nFunctionPointers);
    this.state = Reader.STATE.FUNCTION_POINTERS;
};

Reader.prototype._readFunctionPointers = function () {
    while (this.functionPointers.offset < this.functionPointers.length) {
        var off = 0;
        var vi = util.readVarint(this.buffer, off); off += vi.length;
        var sig = vi.value;
        if (sig > this.signatures.length)
            throw Error("illegal signature reference: " + sig);
        vi = util.readVarint(this.buffer, off); off += vi.length;
        var nElems = vi.value;
        var elems = new Array(nElems);
        for (var i = 0; i < nElems; ++i) {
            vi = util.readVarint(this.buffer, off); off += vi.length;
            elems[i] = vi.value;
        }
        this._advance(off);
        this.functionPointers[this.functionPointers.offset++] = {
            sig: sig,
            elems: elems
        };
    }
    delete this.functionPointers.offset;
    this.emit("functionPointers", this.functionPointers);
    this.functionDefinitions = new Array(this.functionDeclarations.length);
    this.functionDefinitions.offset = 0;
    this.state = Reader.STATE.FUNCTION_DEFINITIONS;
};

Reader.prototype._readFunctionDefinitions = function() {
    if (this.functionDefinitions.offset < this.functionDefinitions.length) {
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
        var totalVars = nI32Vars + nF32Vars + nF64Vars;
        var vars = new Array(totalVars);
        var localIndex = 0;
        for (var i=0; i<nI32Vars; ++i)
            vars[localIndex++] = types.Type.I32;
        for (i=0; i<nF32Vars; ++i)
            vars[localIndex++] = types.Type.F32;
        for (i=0; i<nF64Vars; ++i)
            vars[localIndex++] = types.Type.F64;

        // Prepare function definition
        var functionDefinition = {
            sig: this.functionDeclarations[this.functionDefinitions.offset],
            signature: this.signatures[this.functionDeclarations[this.functionDefinitions.offset]],
            vars: vars,
            ast: null
        };
        this.functionDefinitions[this.functionDefinitions.offset++] = functionDefinition;

        console.log("creating AstReader at "+this.offset.toString(16)+" for", functionDefinition);
        this.astReader = new AstReader(this, functionDefinition);
        this.astReader.on("end", function() {
            var remainingBuffer = this.astReader.buffer;
            this.astReader.removeAllListeners();
            this.astReader = null;
            this.state = Reader.STATE.FUNCTION_DEFINITIONS;
            this.write(remainingBuffer);
        }.bind(this));
        this.astReader.on("error", function(err) {
            this.emit("error", err);
        }.bind(this));
        this.astReader.write(this.buffer);
        this.buffer = null;

    } else {
        delete this.functionDefinitions.offset;
        this.emit("functionDefinitions", this.functionDefinitions);
        this.state = Reader.STATE.EXPORT;
    }
};

Reader.prototype._readExport = function() {
    if (this.buffer.length < 2) // format + fn/num
        throw util.E_MORE;
    var off = 0;
    var format = this.buffer[off++];
    var vi;
    switch (format) {
        case types.ExportFormat.Default:
            vi = util.readVarint(this.buffer, off); off += vi.length;
            this._advance(vi.value);
            this.export = {
                format: format,
                func: vi[0]
            };
            break;
        case types.ExportFormat.Record:
            vi = util.readVarint(this.buffer, off); off += vi.length;
            var nExports = vi.value;
            var funcs = {};
            for (var i=0; i<nExports; ++i) {
                var cs = util.readCString(this.buffer, off); off += cs.length;
                vi = util.readVarint(this.buffer, off); off += vi.length;
                funcs[cs.value] = vi.value;
            }
            this._advance(off);
            this.export = {
                format: format,
                funcs: funcs
            };
            break;
        default:
            throw Error("illegal export format: "+format);
    }
    this.state = Reader.STATE.END;
};
