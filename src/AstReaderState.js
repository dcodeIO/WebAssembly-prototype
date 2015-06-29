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
 */
var AstReaderState = module.exports = function(reader, popState) {

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

    s.code = function(typeCtx) {
        type = typeCtx;
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
        // reader.buffer = reader.buffer.slice(offset);
        reader.offset += offset;
        previousOffset = offset;
        // offset = 0;
    };

    s.reset = function() {
        offset = previousOffset;
        type = code = stmt = undefined;
    };

    s.local = function(index) {
        if (index < reader.signature.argumentTypes.length)
            return reader.signature.argumentTypes[index];
        index -= reader.signature.argumentTypes.length;
        return reader.definition.variables[index].type;
    };

    s.global = function(index) {
        return reader.assembly.globalVariables[index].type;
    };

    s.sig = function(index) {
        switch (type) {
            case undefined:
                switch (code.op) {
                    case types.Stmt.CallInt:
                        return reader.assembly.functionDeclarations[index].signature;
                    case types.Stmt.CallInd:
                        return reader.assembly.functionPointerTables[index].signature;
                    case types.Stmt.CallImp:
                        return reader.assembly.functionImportSignatures[index].signature;
                }
                break;
            case types.RType.I32:
                switch (code.op) {
                    case types.I32.CallInt:
                        return reader.assembly.functionDeclarations[index].signature;
                    case types.I32.CallInd:
                        return reader.assembly.functionPointerTables[index].signature;
                    case types.I32.CallImp:
                        return reader.assembly.functionImportSignatures[index].signature;
                }
                break;
            case types.RType.F32:
                switch (code.op) {
                    case types.F32.CallInt:
                        return reader.assembly.functionDeclarations[index].signature;
                    case types.F32.CallInd:
                        return reader.assembly.functionPointerTables[index].signature;
                }
                break;
            case types.RType.F64:
                switch (code.op) {
                    case types.F64.CallInt:
                        return reader.assembly.functionDeclarations[index].signature;
                    case types.F64.CallInd:
                        return reader.assembly.functionPointerTables[index].signature;
                    case types.F64.CallImp:
                        return reader.assembly.functionImportSignatures[index].signature;
                }
                break;
            case types.RType.Void:
                switch (code) {
                    case types.Void.CallInt:
                        return reader.assembly.functionDeclarations[index].signature;
                    case types.Void.CallInd:
                        return reader.assembly.functionPointerTables[index].signature;
                    case types.Void.CallImp:
                        return reader.assembly.functionImportSignatures[index].signature;
                }
                break;
        }
        throw Error("opcode does not reference a function signature: "+(code.op || code));
    };

    s.expect = function(state) {
        var args = Array.isArray(state)
            ? state
            : Array.prototype.slice.call(arguments);
        if (args.length === 0)
            return;
        if (stmt && !reader.skipAhead) {
            reader.stack.push(stmt);
            args.push(/* AstReader.STATE.POP */ popState);
        }
        for (var i=args.length-1; i>=0; --i)
            reader.state.push(args[i]);
    };

    s.push = function(operands, withImm) {
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
        stmt = new ctor(typeof code === 'number' ? code : code.op, operands);
        if (withImm)
            stmt.withImm = true;
        reader.stack[reader.stack.length-1].add(stmt);
        s.advance();
        return stmt;
    };

    s.finish = function() {
        reader.buffer = reader.buffer.slice(offset);
        offset = previousOffset = 0;
    };

    return s;
};
