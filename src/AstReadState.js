var types = require("./types"),
    util = require("./util");

var Stmt = require("./stmt/Stmt"),
    I32Stmt = require("./stmt/I32Stmt"),
    F32Stmt = require("./stmt/F32Stmt"),
    F64Stmt = require("./stmt/F64Stmt"),
    VoidStmt = require("./stmt/VoidStmt");

/**
 * A closure holding state of and providing utility for the current read operation.
 * @function
 * @param {!AstReader} reader
 * @exports AstReadState
 */
var AstReadState = module.exports = function(reader, popState) {

    // Previous offset
    var previousOffset = 0;

    // Current working offset
    var offset = previousOffset;

    // Current type
    var type;

    // Current code
    var code;

    // Current statement
    var stmt;

    var s = {};

    s.rtype = reader.signature.returnType;

    s.code = function(type_) {
        type = type_;
        return code = util.readCode(reader.buffer, offset++);
    };

    s.code_u8 = function() {
        type = types.RType.Void;
        if (offset >= reader.buffer.length)
            throw util.E_MORE;
        return code = reader.buffer[offset++];
    };

    s.varint = function() {
        var vi = util.readVarint(reader.buffer, offset);
        offset += vi.length;
        return vi.value;
    };

    s.u8 = function() {
        if (offset >= reader.buffer.length)
            throw util.E_MORE;
        return reader.buffer[offset++];
    };

    s.f32 = function() {
        if (offset >= reader.buffer.length - 4)
            throw util.E_MORE;
        var value = reader.buffer.readFloatLE(offset);
        offset += 4;
        return value;
    };

    s.f64 = function() {
        if (offset >= reader.buffer.length - 8)
            throw util.E_MORE;
        var value = reader.buffer.readDoubleLE(offset);
        offset += 8;
        return value;
    };

    s.advance = function() {
        reader.offset += offset - previousOffset;
        previousOffset = offset;
    };

    s.reset = function() {
        offset = previousOffset;
        type = code = stmt = undefined;
    };

    s.const = function(index) {
        switch (type) {
            case types.Type.I32:
                return reader.assembly.constantsI32[index];
            case types.Type.F32:
                return reader.assembly.constantsF32[index];
            case types.Type.F64:
                return reader.assembly.constantsF64[index];
        }
    };

    s.local = function(index) {
        return reader.definition.variables[index];
    };

    s.global = function(index) {
        return reader.assembly.globalVariables[index];
    };

    s.internal = function(index) {
        return reader.assembly.functionDeclarations[index];
    };

    s.indirect = function(index) {
        return reader.assembly.functionPointerTables[index];
    };

    s.import = function(index) {
        return reader.assembly.functionImportSignatures[index];
    };

    s.expect = function(state) {
        var args = Array.isArray(state)
            ? state
            : Array.prototype.slice.call(arguments);
        if (args.length === 0)
            return;
        if (stmt && !reader.skipAhead) {
            reader.stack.push(stmt);
            args.push(popState);
        }
        for (var i=args.length-1; i>=0; --i)
            reader.state.push(args[i]);
    };

    s.emit_code = function(code, operands) {
        if (reader.skipAhead) {
            s.advance();
            return;
        }
        var ctor;
        switch (type) {
            case undefined:
                ctor = Stmt;
                break;
            case types.RType.I32:
                ctor = I32Stmt;
                break;
            case types.RType.F32:
                ctor = F32Stmt;
                break;
            case types.RType.F64:
                ctor = F64Stmt;
                break;
            case types.RType.Void:
                ctor = VoidStmt;
                break;
            default:
                throw Error("illegal type: "+type);
        }
        stmt = new ctor(code, operands);
        reader.stack[reader.stack.length-1].add(stmt);
        s.advance();
        return stmt;
    };

    s.emit = function(operands) {
        return s.emit_code(typeof code === 'number' ? code : code.op, operands);
    };

    s.finish = function() {
        reader.buffer = reader.buffer.slice(offset);
        offset = previousOffset = 0;
    };

    return s;
};
