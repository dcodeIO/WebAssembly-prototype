var stream = require("stream"),
    assert = require("assert");

var types = require("./types"),
    util = require("./util");

var Reader = require("./Reader");

var DefaultExport = require("./reflect/DefaultExport");

/**
 * A WebAssembly writer implemented as a readable stream.
 *
 * The writer is created in paused mode. Call {@link Writer#resume) to
 * begin writing the assembly.
 *
 * @constructor
 * @param {!Assembly} assembly
 * @param {!Object.<string,*>=} options
 * @extends stream.Readable
 * @exports Writer
 */
function Writer(assembly, options) {
    stream.Readable.call(this, options);

    /**
     * Assembly being written.
     * @type {!Assembly}
     */
    this.assembly = assembly;

    /**
     * Current state.
     * @type {number}
     */
    this.state = Writer.State.HEADER;

    /**
     * Global write offset.
     * @type {number}
     */
    this.offset = 0;

    /**
     * Write sequence of the current operation.
     * @type {number}
     */
    this.sequence = 0;

    /**
     * Whether the writer has already started to emit data.
     * @type {boolean}
     */
    this.started = false;

    this.pause();
}

module.exports = Writer;

// Extends stream.Readable
Writer.prototype = Object.create(stream.Readable.prototype);

/**
 * States.
 * @type {!Object.<string,number>}
 * @const
 */
Writer.State = {
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

Writer.prototype._read = function(size) {
    while (size > 0) {
        var initialState = this.state,
            len = 0;
        try {
            switch (this.state) {
                case Writer.State.HEADER:
                    len += this._writeHeader();
                    break;
                case Writer.State.CONSTANTS_COUNT:
                    len += this._writeConstantsCount();
                    break;
                case Writer.State.CONSTANTS_I32:
                    len += this._writeConstantsI32();
                    break;
                case Writer.State.CONSTANTS_F32:
                    len += this._writeConstantsF32();
                    break;
                case Writer.State.CONSTANTS_F64:
                    len += this._writeConstantsF64();
                    break;
                case Writer.State.SIGNATURES_COUNT:
                    len += this._writeSignaturesCount();
                    break;
                case Writer.State.SIGNATURES:
                    len += this._writeSignatures();
                    break;
                case Writer.State.FUNCTION_IMPORTS_COUNT:
                    len += this._writeFunctionImportsCount();
                    break;
                case Writer.State.FUNCTION_IMPORTS:
                    len += this._writeFunctionImports();
                    break;
                case Writer.State.GLOBAL_VARIABLES_COUNT:
                    len += this._writeGlobalVariablesCount();
                    break;
                case Writer.State.GLOBAL_VARIABLES:
                    len += this._writeGlobalVariables();
                    break;
                case Writer.State.FUNCTION_DECLARATIONS_COUNT:
                    len += this._writeFunctionDeclarationsCount();
                    break;
                case Writer.State.FUNCTION_DECLARATIONS:
                    len += this._writeFunctionDeclarations();
                    break;
                case Writer.State.FUNCTION_POINTER_TABLES_COUNT:
                    len += this._writeFunctionPointerTablesCount();
                    break;
                case Writer.State.FUNCTION_POINTER_TABLES:
                    len += this._writeFunctionPointerTables();
                    break;
                case Writer.State.FUNCTION_DEFINITIONS:
                    len += this._writeFunctionDefinitions();
                    break;
                case Writer.State.EXPORT:
                    len += this._writeExport();
                    break;
                case Writer.State.END:
                case Writer.State.ERROR:
                    this.push(null);
                    return;
                default:
                    throw Error("illegal state: " + this.state);
            }
            this.offset += len;
            size -= len;
        } catch (err) {
            this.emit("error", err);
            this.state = Writer.State.ERROR;
        }
        if (this.state !== initialState)
            this.emit("switchState", this.state, initialState, this.offset);
    }
};

Writer.prototype._writeHeader = function() {
    var buf = new Buffer(8);
    buf.writeUInt32LE(types.MagicNumber, 0);
    buf.writeUInt32LE(this.assembly.precomputedSize, 4);
    this.state = Writer.State.CONSTANTS_COUNT;
    this.push(buf);
    return buf.length;
};

Writer.prototype._writeConstantsCount = function() {
    var nI32 = this.assembly.constantsI32.length,
        nF32 = this.assembly.constantsF32.length,
        nF64 = this.assembly.constantsF64.length;
    var buf = new Buffer(util.calculateVarint(nI32) + util.calculateVarint(nF32) + util.calculateVarint(nF64)),
        offset = 0;
    offset += util.writeVarint(buf, nI32, offset);
    offset += util.writeVarint(buf, nF32, offset);
    offset += util.writeVarint(buf, nF64, offset);
    assert.strictEqual(offset, buf.length, "offset mismatch");
    this.state = Writer.State.CONSTANTS_I32;
    this.push(buf);
    return buf.length;
};

Writer.prototype._writeConstantsI32 = function() {
    var size = 0;
    this.assembly.constantsI32.forEach(function(constant) {
        size += util.calculateVarint(constant.value);
    }, this);
    var buf = new Buffer(size),
        offset = 0;
    this.assembly.constantsI32.forEach(function(constant) {
        offset += util.writeVarint(buf, constant.value, offset);
    }, this);
    assert.strictEqual(offset, buf.length, "offset mismatch");
    this.state = Writer.State.CONSTANTS_F32;
    this.push(buf);
    return buf.length;
};

Writer.prototype._writeConstantsF32 = function() {
    var buf = new Buffer(this.assembly.constantsF32.length * 4),
        offset = 0;
    this.assembly.constantsF32.forEach(function(constant) {
        buf.writeFloatLE(constant.value, offset);
        offset += 4;
    }, this);
    assert.strictEqual(offset, buf.length, "offset mismatch");
    this.state = Writer.State.CONSTANTS_F64;
    this.push(buf);
    return buf.length;
};

Writer.prototype._writeConstantsF64 = function() {
    var buf = new Buffer(this.assembly.constantsF64.length * 8),
        offset = 0;
    this.assembly.constantsF64.forEach(function(constant) {
        buf.writeDoubleLE(constant.value, offset);
        offset += 8;
    }, this);
    assert.strictEqual(offset, buf.length, "offset mismatch");
    this.state = Writer.State.SIGNATURES_COUNT;
    this.push(buf);
    return buf.length;
};

Writer.prototype._writeSignaturesCount = function() {
    var count = this.assembly.functionSignatures.length,
        buf = new Buffer(util.calculateVarint(count));
    var offset = util.writeVarint(buf, count, 0);
    assert.strictEqual(offset, buf.length, "offset mismatch");
    this.state = Writer.State.SIGNATURES;
    this.push(buf);
    return buf.length;
};

Writer.prototype._writeSignatures = function() {
    var size = 0;
    this.assembly.functionSignatures.forEach(function(signature) {
        size += 1 + util.calculateVarint(signature.argumentTypes.length) + signature.argumentTypes.length;
    }, this);
    var buf = new Buffer(size),
        offset = 0;
    this.assembly.functionSignatures.forEach(function(signature) {
        buf[offset++] = signature.returnType;
        offset += util.writeVarint(buf, signature.argumentTypes.length, offset);
        signature.argumentTypes.forEach(function(type, i) {
            buf[offset++] = type;
        }, this);
    }, this);
    assert.strictEqual(offset, buf.length, "offset mismatch");
    this.state = Writer.State.FUNCTION_IMPORTS_COUNT;
    this.push(buf);
    return buf.length;
};

Writer.prototype._writeFunctionImportsCount = function() {
    var nImps = this.assembly.functionImports.length,
        nImpSigs =  this.assembly.functionImportSignatures.length;
    var len = util.calculateVarint(nImps) + util.calculateVarint(nImpSigs),
        buf = new Buffer(len),
        offset;
    offset  = util.writeVarint(buf, nImps, 0);
    offset += util.writeVarint(buf, nImpSigs, offset);
    assert.strictEqual(offset, buf.length, "offset mismatch");
    this.state = Writer.State.FUNCTION_IMPORTS;
    this.push(buf);
    return buf.length;
};

Writer.prototype._writeFunctionImports = function() {
    var size = 0;
    this.assembly.functionImports.forEach(function(imprt) {
        size += Buffer.byteLength(imprt.name, "utf8") + 1 + util.calculateVarint(imprt.signatures.length);
        imprt.signatures.forEach(function(signature) {
            size += util.calculateVarint(signature.signature.index);
        }, this);
    }, this);
    var buf = new Buffer(size),
        offset = 0;
    this.assembly.functionImports.forEach(function(imprt) {
        offset += buf.write(imprt.name, offset, "utf8");
        buf[offset++] = 0;
        offset += util.writeVarint(buf, imprt.signatures.length, offset);
        imprt.signatures.forEach(function(signature) {
            offset += util.writeVarint(buf, signature.signature.index, offset);
        }, this);
    }, this);
    assert.strictEqual(offset, buf.length, "offset mismatch");
    this.state = Writer.State.GLOBAL_VARIABLES_COUNT;
    this.push(buf);
    return buf.length;
};

Writer.prototype._writeGlobalVariablesCount = function() {
    var nI32zero = 0,
        nF32zero = 0,
        nF64zero = 0,
        nI32import = 0,
        nF32import = 0,
        nF64import = 0;
    var current = 0,
        size = 0;
    var vars = this.assembly.globalVariables;
    while (current < vars.length && vars[current].type === types.Type.I32) {
        nI32zero++;
        current++;
    }
    size += util.calculateVarint(nI32zero);
    while (current < vars.length && vars[current].type === types.Type.F32) {
        nF32zero++;
        current++;
    }
    size += util.calculateVarint(nF32zero);
    while (current < vars.length && vars[current].type === types.Type.F64) {
        nF64zero++;
        current++;
    }
    size += util.calculateVarint(nF64zero);
    this.sequence = current;
    while (current < vars.length && vars[current].type === types.Type.I32) {
        nI32import++;
        current++;
    }
    size += util.calculateVarint(nI32import);
    while (current < vars.length && vars[current].type === types.Type.F32) {
        nF32import++;
        current++;
    }
    size += util.calculateVarint(nF32import);
    while (current < vars.length && vars[current].type === types.Type.F64) {
        nF64import++;
        current++;
    }
    assert.strictEqual(current, vars.length, "illegal order of global variables");
    size += util.calculateVarint(nF64import);
    var buf = new Buffer(size),
        offset = 0;
    offset += util.writeVarint(buf, nI32zero, offset);
    offset += util.writeVarint(buf, nF32zero, offset);
    offset += util.writeVarint(buf, nF64zero, offset);
    offset += util.writeVarint(buf, nI32import, offset);
    offset += util.writeVarint(buf, nF32import, offset);
    offset += util.writeVarint(buf, nF64import, offset);
    assert.strictEqual(offset, buf.length, "offset mismatch");
    this.state = Writer.State.GLOBAL_VARIABLES;
    this.push(buf);
    return buf.length;
};

Writer.prototype._writeGlobalVariables = function() {
    var vars = this.assembly.globalVariables,
        size = 0;
    for (var i=this.sequence; i<vars.length; ++i)
        size += Buffer.byteLength(vars[i].importName, "utf8") + 1;
    var buf = new Buffer(size),
        offset = 0;
    for (i=this.sequence; i<vars.length; ++i) {
        offset += buf.write(vars[i].importName, offset, "utf8");
        buf[offset++] = 0;
    }
    assert.strictEqual(offset, buf.length, "offset mismatch");
    this.state = Writer.State.FUNCTION_DECLARATIONS_COUNT;
    this.push(buf);
    return buf.length;
};

Writer.prototype._writeFunctionDeclarationsCount = function() {
    var count = this.assembly.functionDeclarations.length,
        buf = new Buffer(util.calculateVarint(count)),
        offset = util.writeVarint(buf, count, 0);
    assert.strictEqual(offset, buf.length, "offset mismatch");
    this.state = Writer.State.FUNCTION_DECLARATIONS;
    this.push(buf);
    return buf.length;
};

Writer.prototype._writeFunctionDeclarations = function() {
    var len = 0;
    this.assembly.functionDeclarations.forEach(function(declaration) {
        len += util.calculateVarint(declaration.signature.index);
    }, this);
    var buf = new Buffer(len),
        offset = 0;
    this.assembly.functionDeclarations.forEach(function(declaration) {
        offset += util.writeVarint(buf, declaration.signature.index, offset);
    }, this);
    assert.strictEqual(offset, buf.length, "offset mismatch");
    this.state = Writer.State.FUNCTION_POINTER_TABLES_COUNT;
    this.push(buf);
    return buf.length;
};

Writer.prototype._writeFunctionPointerTablesCount = function() {
    var count = this.assembly.functionPointerTables.length,
        buf = new Buffer(util.calculateVarint(count)),
        offset = util.writeVarint(buf, count, 0);
    assert.strictEqual(offset, buf.length, "offset mismatch");
    this.state = Writer.State.FUNCTION_POINTER_TABLES;
    this.push(buf);
    return buf.length;
};

Writer.prototype._writeFunctionPointerTables = function() {
    var size = 0;
    this.assembly.functionPointerTables.forEach(function(table) {
        size += util.calculateVarint(table.signature.index);
        size += util.calculateVarint(table.elements.length);
        table.elements.forEach(function(element) {
            size += util.calculateVarint(element.value);
        }, this);
    }, this);
    var buf = new Buffer(size),
        offset = 0;
    this.assembly.functionPointerTables.forEach(function(table) {
        offset += util.writeVarint(buf, table.signature.index, offset);
        offset += util.writeVarint(buf, table.elements.length, offset);
        table.elements.forEach(function(element) {
            offset += util.writeVarint(buf, element.value, offset);
        }, this);
    }, this);
    assert.strictEqual(offset, buf.length, "offset mismatch");
    this.state = Writer.State.FUNCTION_DEFINITIONS;
    this.push(buf);
    return buf.length;
};

Writer.prototype._writeFunctionDefinitions = function() {
    throw Error("not implemented (yet)");
};

Writer.prototype._writeExport = function() {
    var exprt = this.assembly.export,
        buf, offset = 0;
    if (exprt instanceof DefaultExport) {
        buf = new Buffer(util.calculateVarint(exprt.function.index));
        offset = util.writeVarint(buf, exprt.function.index, offset);
    } else  {
        var size = util.calculateVarint(Object.keys(exprt.functions).length);
        Object.keys(exprt.functions).forEach(function(name) {
            size += Buffer.byteLength(name) + 1 +util.calculateVarint(exprt.functions[name]);
        }, this);
        buf = new Buffer(size);
        offset += util.writeVarint(buf, Object.keys(exprt.functions).length, offset);
        Object.keys(exprt.functions).forEach(function(name) {
            offset += buf.write(name, offset, "utf8");
            buf[offset++] = 0;
            offset += util.writeVarint(buf, exprt.functions[name], offset);
        }, this);
    }
    assert.strictEqual(offset, buf.length, "offset mismatch");
    this.state = Writer.State.END;
    this.push(buf);
    return buf.length;
};
