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
     * Buffer queue.
     * @type {!util.BufferQueue}
     */
    this.bufferQueue = new util.BufferQueue();

    /**
     * Write sequence of the current operation.
     * @type {number}
     */
    this.sequence = 0;

    /**
     * Write sub sequence of the current operation.
     * @type {number}
     */
    this.subSequence = 0;

    this.pause();
}

module.exports = Writer;

// Extends stream.Readable
Writer.prototype = Object.create(stream.Readable.prototype);

/**
 * Global offset.
 * @name Writer#offset
 * @type {number}
 */
Object.defineProperty(Writer.prototype, "offset", {
    get: function() {
        return this.bufferQueue.offset;
    }
});

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
    FUNCTION_POINTER_ELEMENTS: 15,
    FUNCTION_DEFINITIONS: 16,
    EXPORT: 17,
    END: 18,
    ERROR: 19
};

Writer.prototype._read = function(size) {
    if (size <= 0)
        return;
    this.bufferQueue.push(new Buffer(size));
    while (true) {
        var initialState = this.state;
        try {
            switch (this.state) {
                case Writer.State.HEADER:
                    this._writeHeader();
                    break;
                case Writer.State.CONSTANTS_COUNT:
                    this._writeConstantsCount();
                    break;
                case Writer.State.CONSTANTS_I32:
                    this._writeConstantsI32();
                    break;
                case Writer.State.CONSTANTS_F32:
                    this._writeConstantsF32();
                    break;
                case Writer.State.CONSTANTS_F64:
                    this._writeConstantsF64();
                    break;
                case Writer.State.SIGNATURES_COUNT:
                    this._writeSignaturesCount();
                    break;
                case Writer.State.SIGNATURES:
                    this._writeSignatures();
                    break;
                case Writer.State.FUNCTION_IMPORTS_COUNT:
                    this._writeFunctionImportsCount();
                    break;
                case Writer.State.FUNCTION_IMPORTS:
                    this._writeFunctionImports();
                    break;
                case Writer.State.GLOBAL_VARIABLES_COUNT:
                    this._writeGlobalVariablesCount();
                    break;
                case Writer.State.GLOBAL_VARIABLES:
                    this._writeGlobalVariables();
                    break;
                case Writer.State.FUNCTION_DECLARATIONS_COUNT:
                    this._writeFunctionDeclarationsCount();
                    break;
                case Writer.State.FUNCTION_DECLARATIONS:
                    this._writeFunctionDeclarations();
                    break;
                case Writer.State.FUNCTION_POINTER_TABLES_COUNT:
                    this._writeFunctionPointerTablesCount();
                    break;
                case Writer.State.FUNCTION_POINTER_TABLES:
                    this._writeFunctionPointerTables();
                    break;
                case Writer.State.FUNCTION_POINTER_ELEMENTS:
                    this._writeFunctionPointerElements();
                    break;
                case Writer.State.FUNCTION_DEFINITIONS:
                    this._writeFunctionDefinitions();
                    break;
                case Writer.State.EXPORT:
                    this._writeExport();
                    break;
                case Writer.State.END:
                case Writer.State.ERROR:
                    this.push(this.bufferQueue.toBuffer());
                    this.bufferQueue.clear(true);
                    this.push(null);
                    return;
                default:
                    throw Error("illegal state: " + this.state);
            }
            if (this.state !== initialState)
                this.emit("switchState", this.state, initialState, this.offset);
        } catch (err) {
            if (this.state !== initialState)
                this.emit("switchState", this.state, initialState, this.offset);
            if (err === util.BufferQueue.E_MORE) {
                var buf = this.bufferQueue.reset().toBuffer();
                this.push(buf);
                if (buf.length > 0)
                    this.bufferQueue.clear();
                return; // Wait for next read
            }
            this.emit("error", err);
            this.state = Writer.State.ERROR;
        }
    }
};

Writer.prototype._writeHeader = function() {
    this.bufferQueue
        .writeUInt32LE(types.MagicNumber)
        .writeUInt32LE(this.assembly.precomputedSize)
        .commit();
    this.state = Writer.State.CONSTANTS_COUNT;
};

Writer.prototype._writeConstantsCount = function() {
    this.bufferQueue
        .writeVarint(this.assembly.getConstantPoolSize(types.Type.I32))
        .writeVarint(this.assembly.getConstantPoolSize(types.Type.F32))
        .writeVarint(this.assembly.getConstantPoolSize(types.Type.F64))
        .commit();
    this.state = Writer.State.CONSTANTS_I32;
    this.sequence = 0;
};

Writer.prototype._writeConstantsI32 = function() {
    var size = this.assembly.getConstantPoolSize(types.Type.I32);
    while (this.sequence < size) {
        var constant = this.assembly.getConstant(types.Type.I32, this.sequence);
        this.bufferQueue
            .writeVarint(constant.value)
            .commit();
        ++this.sequence;
    }
    this.state = Writer.State.CONSTANTS_F32;
    this.sequence = 0;
};

Writer.prototype._writeConstantsF32 = function() {
    var size = this.assembly.getConstantPoolSize(types.Type.F32);
    while (this.sequence < size) {
        var constant = this.assembly.getConstant(types.Type.F32, this.sequence);
        this.bufferQueue
            .writeFloatLE(constant.value)
            .commit();
        ++this.sequence;
    }
    this.state = Writer.State.CONSTANTS_F64;
    this.sequence = 0;
};

Writer.prototype._writeConstantsF64 = function() {
    var size = this.assembly.getConstantPoolSize(types.Type.F64);
    while (this.sequence < size) {
        var constant = this.assembly.getConstant(types.Type.F64, this.sequence);
        this.bufferQueue
            .writeDoubleLE(constant.value)
            .commit();
        ++this.sequence;
    }
    this.state = Writer.State.SIGNATURES_COUNT;
};

Writer.prototype._writeSignaturesCount = function() {
    this.bufferQueue
        .writeVarint(this.assembly.getFunctionSignaturePoolSize())
        .commit();
    this.state = Writer.State.SIGNATURES;
    this.sequence = 0;
};

Writer.prototype._writeSignatures = function() {
    var size = this.assembly.getFunctionSignaturePoolSize();
    while (this.sequence < size) {
        var signature = this.assembly.getFunctionSignature(this.sequence);
        this.bufferQueue
            .writeUInt8(signature.returnType)
            .writeVarint(signature.argumentTypes.length);
        signature.argumentTypes.forEach(function(type) {
            this.bufferQueue.writeUInt8(type);
        }, this);
        this.bufferQueue.commit();
        ++this.sequence;
    }
    this.state = Writer.State.FUNCTION_IMPORTS_COUNT;
};

Writer.prototype._writeFunctionImportsCount = function() {
    this.bufferQueue
        .writeVarint(this.assembly.getFunctionImportPoolSize())
        .writeVarint(this.assembly.getFunctionImportSignaturePoolSize())
        .commit();
    this.state = Writer.State.FUNCTION_IMPORTS;
    this.sequence = 0;
};

Writer.prototype._writeFunctionImports = function() {
    var size = this.assembly.getFunctionImportPoolSize();
    while (this.sequence < size) {
        var imprt = this.assembly.getFunctionImport(this.sequence);
        this.bufferQueue
            .writeCString(imprt.importName)
            .writeVarint(imprt.signatures.length);
        imprt.signatures.forEach(function(signature) {
            this.bufferQueue.writeVarint(signature.signature.index);
        }, this);
        this.bufferQueue.commit();
        ++this.sequence;
    }
    this.state = Writer.State.GLOBAL_VARIABLES_COUNT;
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
    this.bufferQueue.writeVarint(nI32zero);
    while (current < vars.length && vars[current].type === types.Type.F32) {
        nF32zero++;
        current++;
    }
    this.bufferQueue.writeVarint(nF32zero);
    while (current < vars.length && vars[current].type === types.Type.F64) {
        nF64zero++;
        current++;
    }
    this.bufferQueue.writeVarint(nF64zero);
    this.sequence = current;
    while (current < vars.length && vars[current].type === types.Type.I32) {
        nI32import++;
        current++;
    }
    this.bufferQueue.writeVarint(nI32import);
    while (current < vars.length && vars[current].type === types.Type.F32) {
        nF32import++;
        current++;
    }
    this.bufferQueue.writeVarint(nF32import);
    while (current < vars.length && vars[current].type === types.Type.F64) {
        nF64import++;
        current++;
    }
    assert.strictEqual(current, vars.length, "illegal order of global variables");
    this.bufferQueue
        .writeVarint(nF64import)
        .commit();
    this.state = Writer.State.GLOBAL_VARIABLES;
    // sequence set halfway
};

Writer.prototype._writeGlobalVariables = function() {
    var size = this.assembly.getGlobalVariablePoolSize();
    while (this.sequence < size) {
        var variable = this.assembly.getGlobalVariable(this.sequence);
        this.bufferQueue
            .writeCString(variable.importName)
            .commit();
        ++this.sequence;
    }
    this.state = Writer.State.FUNCTION_DECLARATIONS_COUNT;
};

Writer.prototype._writeFunctionDeclarationsCount = function() {
    this.bufferQueue
        .writeVarint(this.assembly.getFunctionDeclarationPoolSize())
        .commit();
    this.state = Writer.State.FUNCTION_DECLARATIONS;
    this.sequence = 0;
};

Writer.prototype._writeFunctionDeclarations = function() {
    var size = this.assembly.getFunctionDeclarationPoolSize();
    while (this.sequence < size) {
        var declaration = this.assembly.getFunctionDeclaration(this.sequence);
        this.bufferQueue
            .writeVarint(declaration.signature.index)
            .commit();
        ++this.sequence;
    }
    this.state = Writer.State.FUNCTION_POINTER_TABLES_COUNT;
};

Writer.prototype._writeFunctionPointerTablesCount = function() {
    this.bufferQueue
        .writeVarint(this.assembly.getFunctionPointerTablePoolSize())
        .commit();
    this.state = Writer.State.FUNCTION_POINTER_TABLES;
    this.sequence = 0;
};

Writer.prototype._writeFunctionPointerTables = function() {
    var size = this.assembly.getFunctionPointerTablePoolSize();
    if (this.sequence < size) {
        var table = this.assembly.getFunctionPointerTable(this.sequence);
        this.bufferQueue
            .writeVarint(table.signature.index)
            .writeVarint(table.elements.length)
            .commit();
        // Elements might be rather large (seen 8192), so ...
        this.state = Writer.State.FUNCTION_POINTER_ELEMENTS;
        this.subSequence = 0;
        return;
    }
    this.state = Writer.State.FUNCTION_DEFINITIONS;
    this.sequence = 0;
};

Writer.prototype._writeFunctionPointerElements = function() {
    var table = this.assembly.getFunctionPointerTable(this.sequence);
    while (this.subSequence < table.elements.length) {
        var element = table.elements[this.subSequence];
        this.bufferQueue
            .writeVarint(element.value)
            .commit();
        ++this.subSequence;
    }
    this.state = Writer.State.FUNCTION_POINTER_TABLES;
    ++this.sequence;
};

Writer.prototype._writeFunctionDefinitions = function() {
    throw Error("not implemented (yet)");
};

Writer.prototype._writeExport = function() {
    var exprt = this.assembly.export;
    if (exprt instanceof DefaultExport) {
        this.bufferQueue
            .writeVarint(exprt.function.index)
            .commit();
    } else {
        this.bufferQueue.writeVarint(Object.keys(exprt.functions).length);
        Object.keys(exprt.functions).forEach(function(name) {
            this.bufferQueue
                .writeCString(name)
                .writeVarint(exprt.functions[name]);
        }, this);
        this.bufferQueue.commit();
    }
    this.state = Writer.State.END;
};
