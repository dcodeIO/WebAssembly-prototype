var types = require("./types"),
    assert = require("assert");

/**
 * Utility.
 * @namespace
 * @exports util
 */
var util = module.exports = {};

/**
 * @alias util.BufferQueue
 */
util.BufferQueue = require("./util/BufferQueue");

// ----- protocol -----

util.unpackWithImm = function(b) {
    if ((b & types.ImmFlag) === 0)
        return false;
    var op = (b >> types.ImmBits) & types.OpWithImmMax;
    var imm = b & types.ImmMax;
    return {
        code: op,
        imm: imm
    };
};

util.packWithImm = function(code, imm) {
    return ((code & types.OpWithImmMax) << types.ImmBits) | (imm & types.ImmMax);
};

util.calculateVarint = function(value) {
    value = value >>> 0;
    if (value < 1 << 7 ) return 1;
    else if (value < 1 << 14) return 2;
    else if (value < 1 << 21) return 3;
    else if (value < 1 << 28) return 4;
    else                      return 5;
};

util.writeVarint = function(buffer, u32, offset) {
    var c = 1;
    u32 >>>= 0;
    while (u32 >= 1 << 7)
        buffer[offset++] = (u32 & 0x7f) | 0x80,
            u32 >>>= 7,
            ++c;
    buffer[offset] = u32;
    return c;
};

/* util.readIfI32Lit = function(buffer, offset) {
    if (offset >= buffer.length)
        throw E_MORE;
    var off = offset;
    var b = buffer[off];
    if (b & HasImmFlag) {
        var res = util.unpackWithImm(b);
        if (res.op === types.I32WithImm.LitImm) {
            off++;
            return {
                op: res.op,
                imm: res.imm,
                length: off - offset // 1
            };
        }
        if (res.op === types.I32WithImm.LitPool) {
            off++;
            return {
                op: res.op,
                imm: res.imm,
                length: off - offset // 1
            };
        }
        return false;
    }
    var vi;
    if (b === types.I32.LitImm) {
        off++;
        vi = this.readVarint(buffer, off); off += vi.length;
        return {
            op: b,
            imm: vi.value,
            length: off - offset
        };
    }
    if (b === types.I32.LitPool) {
        off++;
        vi = this.readVarint(buffer, off); off += vi.length;
        return {
            op: b,
            imm: vi.value,
            length: off - offset
        }
    }
    return false;
}; */

// ----- asm.js naming -----

// Identifier characters
var IdenChars = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    '_', '$',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
];
util.FirstCharRange = 26 * 2 + 2;
util.FirstCharRangeMinusDollar = 26 * 2 + 1;
util.NextCharRange = IdenChars.length;

util.indexedName = function(range, i) {
    assert(IdenChars.length === 64, "assumed below");
    if (i < range)
        return IdenChars[i];
    i -= range;
    var name = [];
    if (i < range * 64) {
        name.push(IdenChars[i >> 6]);
        name.push(IdenChars[i & 0x3f]);

        // Instead of trying to catch every >2 letter keyword, just inject a _.
        assert(IdenChars[0x205>>6] === 'i' && IdenChars[0x205&0x3f] === 'f');
        assert(IdenChars[0x20d>>6] === 'i' && IdenChars[0x20d&0x3f] === 'n');
        assert(IdenChars[0x0ce>>6] === 'd' && IdenChars[0x0ce&0x3f] === 'o');
        // Append _ if we would otherwise generate one of the two-letter keywords.
        if (range < util.NextCharRange && (i == 0x205 || i == 0x20d || i == 0x0ce))
            name.push("_");
        return name.join("");
    }
    i -= range * 64;

    // Instead of trying to catch every >2 letter keyword, just inject a _.
    if (range < util.NextCharRange)
        name.push("_");

    var len = 0;
    do {
        name.push(IdenChars[i & 0x3f]);
        len++;
        i = i >> 6;
    } while (i >= range * 64);
    name.push(IdenChars[i & 0x3f]);
    name.push(IdenChars[i >> 6]);
    len += 2;
    var a = name.slice(0, name.length - len);
    var b = name.slice(name.length - len);
    b.reverse();
    name = a.concat(b);
    return name.join("");
};

util.localName = function(i) {
    return util.indexedName(util.FirstCharRangeMinusDollar, i + types.HotStdLib.length);
};

util.globalName = function(i) {
    return '$' + util.indexedName(util.NextCharRange, i + types.StdLib.length);
};

util.hotStdLibName = function(funcName) {
    var i = types.HotStdLib.indexOf(funcName);
    assert(i >= 0 && i < types.HotStdLib.length);
    return String.fromCharCode(0x61 + i);
};

var FNAME_RE = /^[a-zA-Z_\$][a-zA-Z0-9_\$]*$/; // FIXME

util.isValidFName = function(value) {
    return !!(typeof value === 'string' && FNAME_RE.test(value));
};

// ----- inline assertions -----

util.assertInteger = function(name, value, min, max) {
    if (typeof value !== 'number' || value%1 !== 0)
        assert.fail(value, "integer", name+" must be an integer", "===");
    if (typeof min === 'undefined' && typeof max === 'undefined')
        return;
    if (typeof max === 'undefined')
        max = min, min = 0;
    if (value < min || value > max)
        assert.fail(value, "["+min+","+max+"]", name+" out of bounds", "in");
};

util.assertRType = function(name, value) {
    util.assertInteger(name, value);
    if (!types.isValidRType(value))
        assert.fail(value, types.RType, name+" must be a valid return type", "in");
};

util.assertType = function(name, value) {
    util.assertInteger(name, value);
    if (!types.isValidType(value))
        assert.fail(value, util.values(types.Type), name+" must be a valid type", "in");
};

util.assertFName = function(name, value) {
    if (!util.isValidFName(value))
        assert.fail(value, "function name", name+" must be a valid function name", "===");
};

// ----- general -----

util.values = function(obj) {
    var values = [];
    for (var i in obj)
        if (obj.hasOwnProperty(i))
            values.push(obj[i]);
    return values;
};

util.nextTick = function(callback) {
    if (typeof process === 'object' && process && typeof process.nextTick === 'function')
        process.nextTick(callback);
    else
        setTimeout(callback, 0);
};
