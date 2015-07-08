var stream = require("stream"),
    assert = require("assert"),
    types = require("../types"),
    util = require("../util");

var WriteState = require("./WriteState"),
    StmtList = require("../stmt/StmtList"),
    ExprI32 = require("../stmt/ExprI32"),
    ExprF32 = require("../stmt/ExprF32"),
    ExprF64 = require("../stmt/ExprF64"),
    ExprVoid = require("../stmt/ExprVoid"),
    SwitchCase = require("../stmt/SwitchCase"),
    Stmt = require("../stmt/Stmt");

var verbose = 0; // for debugging

/**
 * An abstract syntax tree writer.
 *
 * The writer is created in paused mode. Call {@link ast.Writer#resume) to
 * begin writing the AST.
 *
 * @param {!reflect.FunctionDefinition} functionDefinition
 * @param {!util.BufferQueue=} bufferQueue
 * @param {!Object.<string,*>=} options
 * @constructor
 * @extends stream.Readable
 * @exports ast.Writer
 */
function Writer(functionDefinition, bufferQueue, options) {
    assert(functionDefinition.ast instanceof StmtList, "definition must contain an AST");

    stream.Readable.call(this, options);

    if (!(bufferQueue instanceof util.BufferQueue)) {
        options = bufferQueue;
        bufferQueue = undefined;
    }

    /**
     * Function definition.
     * @type {!reflect.FunctionDefinition}
     */
    this.definition = functionDefinition;

    /**
     * Writer buffer queue.
     * @type {!util.BufferQueue}
     */
    this.bufferQueue = bufferQueue || new util.BufferQueue();

    /**
     * Statement stack.
     * @type {!Array.<!BaseStmt|!StmtList>}
     */
    this.stack = [functionDefinition.ast]; // StmtList

    /**
     * Write state.
     * @type {!ast.WriteState}
     */
    this.writeState = new WriteState(this);

    /**
     * Whether opcodes with imm should be preserved. Relevant only when rewriting ASTs with the intend to preserve
     *  their original (unoptimized) byte code, e.g. for comparison.
     * @type {boolean}
     */
    this.preserveWithImm = !!(options && options.preserveWithImm);

    this.pause();
}

module.exports = Writer;

// Extends Readable
Writer.prototype = Object.create(stream.Readable.prototype);

/**
 * Function declaration.
 * @name ast.Writer#declaration
 * @type {!reflect.FunctionDeclaration}
 */
Object.defineProperty(Writer.prototype, "declaration", {
    get: function() {
        return this.definition.declaration;
    }
});

/**
 * Function signature.
 * @name ast.Writer#signature
 * @type {!reflect.FunctionSignature}
 */
Object.defineProperty(Writer.prototype, "signature", {
    get: function() {
        return this.definition.declaration.signature;
    }
});

/**
 * Assembly.
 * @name ast.Writer#assembly
 * @type {!reflect.Assembly}
 */
Object.defineProperty(Writer.prototype, "assembly", {
    get: function() {
        return this.definition.declaration.assembly;
    }
});

/**
 * Global offset.
 * @name ast.Writer#offset
 * @type {number}
 */
Object.defineProperty(Writer.prototype, "offset", {
    get: function() {
        return this.bufferQueue.offset;
    }
});

Writer.prototype._read = function(size) {
    if (this.stack.length === 0)
        throw Error("already done");
    this.bufferQueue.push(new Buffer(size));
    this._process();
};

Writer.prototype._process = function() {
    if (this.stack.length === 0)
        return;
    while (this.stack.length > 0) {
        var stmt = this.stack.pop(),
            state = stmt.type;
        this.emit("switchState", state, this.offset);
        try {
            switch (state) {
                case types.WireType.ExprI32:
                    this._writeExprI32(stmt);
                    break;
                case types.WireType.ExprF32:
                    this._writeExprF32(stmt);
                    break;
                case types.WireType.ExprF64:
                    this._writeExprF64(stmt);
                    break;
                case types.WireType.ExprVoid:
                    this._writeExprVoid(stmt);
                    break;
                case types.WireType.SwitchCase:
                    this._writeSwitchCase(stmt);
                    break;
                case types.WireType.Stmt:
                    this._writeStmt(stmt);
                    break;
                case types.WireType.StmtList:
                    this._writeStmtList(stmt);
                    break;
                default:
                    throw Error("illegal wire type: " + stmt.type);
            }
        } catch (err) {
            if (err === util.BufferQueue.E_MORE) {
                this.stack.push(stmt);
                var buf = this.bufferQueue.reset().toBuffer();
                this.push(buf);
                if (buf.length > 0)
                    this.bufferQueue.clear();
                return; // Wait for more
            }
            this.emit("error", err);
            this.stack = [];
            return;
        }
    }
    this.bufferQueue.commit();
    this.push(this.bufferQueue.toBuffer());
    this.bufferQueue.clear();
    this.push(null);
};

Writer.prototype._writeStmtList = function(stmtList) {
    this.bufferQueue
        .writeVarint(stmtList.length)
        .commit();
    for (var i=stmtList.length-1; i>=0; --i)
        this.stack.push(stmtList[i]);
};

function makeGenericWrite(wireType, clazz, name) {
    return function(stmt) {
        if (verbose >= 1)
            console.log("writing "+stmt+" @ "+this.offset.toString(16));
        this.writeState.prepare(wireType, stmt);
        stmt.behavior.write(this.writeState, stmt);
        this.writeState.commit();
    }
}

Writer.prototype._writeExprI32 = makeGenericWrite(types.WireType.ExprI32, ExprI32, "I32");
Writer.prototype._writeExprF32 = makeGenericWrite(types.WireType.ExprF32, ExprF32, "F32");
Writer.prototype._writeExprF64 = makeGenericWrite(types.WireType.ExprF64, ExprF64, "F64");
Writer.prototype._writeExprVoid = makeGenericWrite(types.WireType.ExprVoid, ExprVoid, "Void");
Writer.prototype._writeSwitchCase = makeGenericWrite(types.WireType.SwitchCase, SwitchCase, "SwitchCase");
Writer.prototype._writeStmt = makeGenericWrite(types.WireType.Stmt, Stmt, "Stmt");
