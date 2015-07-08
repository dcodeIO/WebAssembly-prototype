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
    util   = require("../util"),
    types  = require("../types"),
    stmt   = require("../stmt/");

var ReadState = require("./ReadState");

var Constant = require("../reflect/Constant"),
    GlobalVariable = require("../reflect/GlobalVariable"),
    FunctionSignature = require("../reflect/FunctionSignature"),
    FunctionDeclaration = require("../reflect/FunctionDeclaration"),
    FunctionImport = require("../reflect/FunctionImport"),
    FunctionImportSignature = require("../reflect/FunctionImportSignature"),
    FunctionPointerTable = require("../reflect/FunctionPointerTable"),
    LocalVariable = require("../reflect/LocalVariable");

var BaseStmt = stmt.BaseStmt,
    StmtList = stmt.StmtList,
    Stmt = stmt.Stmt,
    SwitchCase = stmt.SwitchCase,
    ExprI32 = stmt.ExprI32,
    ExprF32 = stmt.ExprF32,
    ExprF64 = stmt.ExprF64,
    ExprVoid = stmt.ExprVoid;

var verbose = 0; // For debugging

/**
 * An abstract syntax tree reader.
 * @constructor
 * @param {!reflect.FunctionDefinition} functionDefinition
 * @param {!util.BufferQueue=} bufferQueue
 * @param {!Object.<string,*>=} options
 * @exports ast.Reader
 */
function Reader(functionDefinition, bufferQueue, options) {
    stream.Writable.call(this, options);

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
     * Read buffer queue.
     * @type {!util.BufferQueue}
     */
    this.bufferQueue = bufferQueue || new util.BufferQueue();

    /**
     * State stack.
     * @type {!Array.<number>}
     */
    this.state = [Reader.State.StmtList];

    /**
     * Processing stack.
     * @type {Array.<!stmt.StmtList|!stmt.BaseStmt>}
     */
    this.stack = []; // Expected to contain the root StmtList only when finished

    /**
     * Read state closure.
     * @type {!ast.ReadState}
     */
    this.readState = new ReadState(this, Reader.State.Pop);

    /**
     * Whether to skip ahead, not parsing the AST in detail.
     * @type {boolean}
     */
    this.skipAhead = !!(options && options.skipAhead);
}

module.exports = Reader;

// Extends stream.Writable
Reader.prototype = Object.create(stream.Writable.prototype);

/**
 * Global offset.
 * @name ast.Reader#offset
 * @type {number}
 */
Object.defineProperty(Reader.prototype, "offset", {
    get: function() {
        return this.bufferQueue.offset;
    }
});

/**
 * Function declaration.
 * @name ast.Reader#declaration
 * @type {!reflect.FunctionDeclaration}
 */
Object.defineProperty(Reader.prototype, "declaration", {
    get: function() {
        return this.definition.declaration;
    }
});

/**
 * Function signature.
 * @name ast.Reader#signature
 * @type {!reflect.FunctionSignature}
 */
Object.defineProperty(Reader.prototype, "signature", {
    get: function() {
        return this.definition.declaration.signature;
    }
});

/**
 * Assembly.
 * @name ast.Reader#assembly
 * @type {!reflect.Assembly}
 */
Object.defineProperty(Reader.prototype, "assembly", {
    get: function() {
        return this.definition.declaration.assembly;
    }
});

/**
 * States.
 * @type {!Object.<string,number>}
 * @const
 */
Reader.State = {
    ExprI32: types.WireType.ExprI32,
    ExprF32: types.WireType.ExprF32,
    ExprF64: types.WireType.ExprF64,
    ExprVoid: types.WireType.ExprVoid,
    SwitchCase: types.WireType.SwitchCase,
    Stmt: types.WireType.Stmt,
    StmtList: types.WireType.StmtList,
    Pop: types.WireTypeMax + 1
};

Reader.prototype._write = function (chunk, encoding, callback) {
    if (this.state.length === 0) { // Already done or failed
        callback(Error("already ended"));
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
    if (this.state.length === 0)
        return;
    do {
        if (this.state.length === 0) { // Done
            if (!this.skipAhead) {
                this.readState.finish();
                if (this.stack.length !== 1)
                    throw Error("illegal state: stack not cleared: "+this.stack.length);
                var stmtList = this.stack[0];
                if (!(stmtList instanceof StmtList))
                    throw Error("illegal state: last stack item is not a StmtList: " + stmtList);
                if (stmtList.length > 0) {
                    stmtList.forEach(function (stmt) {
                        if (!(stmt instanceof BaseStmt))
                            throw Error("illegal state: StmtList contains non-Stmt: " + stmt);
                    });
                }
                this.emit("ast", stmtList);
            }
            this.emit("end");
            return;
        }
        var state = this.state.pop();
        if (verbose >= 2)
            console.log("state: "+state);
        try {
            switch (state) {
                case Reader.State.ExprI32:
                    this._readExprI32();
                    break;
                case Reader.State.ExprF32:
                    this._readExprF32();
                    break;
                case Reader.State.ExprF64:
                    this._readExprF64();
                    break;
                case Reader.State.ExprVoid:
                    this._readExprVoid();
                    break;
                case Reader.State.SwitchCase:
                    this._readSwitchCase();
                    break;
                case Reader.State.Stmt:
                    this._readStmt();
                    break;
                case Reader.State.StmtList:
                    this._readStmtList();
                    break;
                case Reader.State.Pop:
                    this.stack.pop();
                    break;
                default:
                    throw Error("illegal state: " + state);
            }
        } catch (err) {
            if (err === util.BufferQueue.E_MORE) {
                this.state.push(state); // Wait for more
                return;
            }
            console.log(this.inspect());
            this.emit("error", err);
            this.state = [];
            return;
        } finally {
            this.readState.reset();
        }
    } while (true);
};

Reader.prototype._readStmtList = function() {
    var size = this.readState.varint();
    this.readState.advance();
    if (!this.skipAhead)
        this.stack.push(new StmtList(size));
    for (var i=0; i<size; ++i)
        this.state.push(Reader.State.Stmt);
};

/**
 * Makes a generic read method for the specified wire type.
 * @param {number} wireType
 * @param {!Function} clazz
 * @param {string} name
 * @returns {!function()}
 * @inner
 */
function makeGenericRead(wireType, clazz, name) {
    return function() {
        var code = this.readState.u8();
        if ((code & types.ImmFlag) === 0) {
            if (verbose >= 1)
                console.log("processing "+name+":" + types[name+"Names"][code] + " (opcode " + code + ")");
            this.readState.prepare(wireType);
            clazz.determineBehavior(code, false).read(this.readState, code, null);
        } else {
            code = util.unpackWithImm(code);
            if (verbose >= 1)
                console.log("processing "+name+"WithImm:" + types[name+"WithImmNames"][code.code] + " (" + code.code + ")");
            this.readState.prepare(wireType);
            clazz.determineBehavior(code.code, true).read(this.readState, code.code, code.imm);
        }
        this.readState.commit();
    };
}

Reader.prototype._readStmt = makeGenericRead(types.WireType.Stmt, Stmt, "Stmt");
Reader.prototype._readExprI32 = makeGenericRead(types.WireType.ExprI32, ExprI32, "I32");
Reader.prototype._readExprF32 = makeGenericRead(types.WireType.ExprF32, ExprF32, "F32");
Reader.prototype._readExprF64 = makeGenericRead(types.WireType.ExprF64, ExprF64, "F64");
Reader.prototype._readExprVoid = makeGenericRead(types.WireType.ExprVoid, ExprVoid, "Void");
Reader.prototype._readSwitchCase = makeGenericRead(types.WireType.SwitchCase, SwitchCase, "SwitchCase");

/**
 * Inspects a statement structure.
 * @param {!stmt.BaseStmt|!stmt.StmtList|number} stmt
 * @param {number=} depth
 * @returns {string}
 * @inner
 */
function inspect(stmt, depth) {
    depth = depth || 0;
    var indent = "";
    for (var i=0; i<depth; ++i)
        indent += "  ";
    if (typeof stmt === 'number')
        return indent + stmt.toString(10);
    if ((stmt instanceof LocalVariable) || (stmt instanceof GlobalVariable)
     || (stmt instanceof FunctionDeclaration) || (stmt instanceof FunctionPointerTable))
        return indent+stmt.name;
    if (stmt instanceof FunctionImportSignature)
        return indent+"foreign."+stmt.import.name;
    if (stmt instanceof Constant)
        return indent+stmt.value;
    var sb = [];
    if (stmt instanceof StmtList) {
        sb.push(indent + "StmtList["+stmt.length+"]");
        stmt.forEach(function(stmt) {
            sb.push("\n", inspect(stmt, depth + 1));
        });
        return sb.join("");
    }
    if (stmt instanceof BaseStmt) {
        sb.push(indent + stmt.name);
        stmt.operands.forEach(function(oper) {
            sb.push("\n", inspect(oper, depth + 1));
        });
        return sb.join("");
    }
    throw Error("cannot inspect "+stmt);
}

/**
 * Returns a string representation of this AST reader's state.
 * @returns {string}
 */
Reader.prototype.inspect = function() {
    var sb = [];
    sb.push("AstReader debug\n---------------\n");
    sb.push("Global offset: ", this.definition.byteOffset.toString(16), "\n");
    sb.push("Function index: ", this.declaration.index.toString(10), "\n");
    sb.push("Stack size: ", this.stack.length.toString(10), "\n");
    sb.push("State size: "+this.state.length.toString(10), "\n\n");
    sb.push(this.assembly.toString(), "\n\n");
    sb.push(this.definition.asmHeader(), "\n");
    if (!this.skipAhead)
        sb.push(inspect(this.stack[0]));
    return sb.join("");
};

/**
 * @param {string} type
 * @param {*} a
 * @param {*} b
 * @param {*} c
 * @override
 */
Reader.prototype.emit = function(type, a, b, c) {
    var handler = this._events[type];
    if (typeof handler === 'undefined')
        return;
    if (typeof handler === 'function')
        handler.call(this, a, b, c);
    else for (var i=0, k=handler.length; i<k; ++i)
        handler[i].call(this, a, b, c);
};
