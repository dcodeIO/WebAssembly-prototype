var types = require("./types");

var util = module.exports = {};

// Special error indicating that more data is required to proceed
var E_MORE = util.E_MORE = Error("more");

/**
 * Reads a varint.
 * @param {!Buffer} buffer
 * @param {number} offset
 * @returns {!{value: number, length: number}} Value and number of bytes read
 * @throws E_MORE
 */
util.readVarint = function(buffer, offset) {
    if (offset >= buffer.length)
        throw E_MORE;
    var u32 = buffer[offset++];
    if (u32 < 0x80)
        return {
            value: u32,
            length: 1
        };
    u32 &= 0x7f;
    var c = 1;
    for (var shift = 7; true; shift += 7) {
        if (offset >= buffer.length)
            throw E_MORE;
        ++c;
        var b = buffer[offset++];
        if (b < 0x80)
            return {
                value: (u32 | (b << shift)) >>> 0,
                length: c
            };
        u32 |= (b & 0x7f) << shift;
    }
};

/**
 * Reads a CString.
 * @param {!Buffer} buffer
 * @param {number} offset
 * @returns {!{value: string, length: number}} Value and number of bytes read
 * @throws E_MORE
 */
util.readCString = function(buffer, offset) {
    var chars = [];
    while (offset < buffer.length) {
        var c = buffer[offset++];
        if (c === 0)
            return {
                value: String.fromCharCode.apply(String, chars),
                length: chars.length + 1
            };
        chars.push(c); // TODO: Is this always ASCII?
    }
    throw E_MORE;
};

var HasImmFlag = 0x80;
var OpWithImmBits = 2;
var OpWithImmLimit = 1 << OpWithImmBits; // 4
var ImmBits = 5;
var ImmLimit = 1 << ImmBits; // 32

/**
 * Reads an OpCode.
 * @param {!Buffer} buffer
 * @param {number} offset
 * @returns {!{code: number, imm: ?number}}
 */
util.readCode = function(buffer, offset) {
    if (offset >= buffer.length)
        throw E_MORE;
    var b = buffer[offset];
    if ((b & HasImmFlag) === 0) // no imm flag
        return {
            op: b,
            imm: null
        };
    var op = (b >> ImmBits) & (OpWithImmLimit - 1);
    var imm = b & (ImmLimit - 1);
    return {
        op: op,
        imm: imm
    };
};

// Identifier characters
var IdenChars = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    '_', '$',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
];
var FirstCharRange = 26 * 2 + 2;
var FirstCharRangeMinusDollar = 26 * 2 + 1;
var NextCharRange = IdenChars.length;

util.funcName = function(i) {
    throw Error("not implemented");
};

util.combine = function(target, var_args) {
    target = target || {};
    Array.prototype.slice.call(arguments, 1).forEach(function(arg) {
        for (var i in arg)
            if (arg.hasOwnProperty(i))
                target[i] = arg[i];
    });
    return target;
};

util.assertInteger = function(name, value, min, max) {
    if (typeof value !== 'number' || value%1 !== 0)
        throw TypeError(name+" must be an integer");
    if (typeof min === 'undefined' && typeof max === 'undefined')
        return;
    if (typeof max === 'undefined')
        max = min, min = 0;
    if (value < min || value > max)
        throw RangeError(name+" out of bounds: "+value+" ["+min+","+max+"]")
};

util.assertRType = function(name, value) {
    util.assertInteger(name, value);
    if (!types.isValidRType(value))
        throw RangeError(name+" is not a valid rtype: "+value);
};

util.assertType = function(name, value) {
    util.assertInteger(name, value);
    if (!types.isValidType(value))
        throw RangeError(name+" is not a valid type: "+value);
};

var FNAME_RE = /^[a-zA-Z_\$][a-zA-Z0-9_\$]*$/; // FIXME

util.assertFName = function(name, value) {
    if (typeof value !== 'string' || value.length === 0)
        throw TypeError(name+" must be a non-empty string");
    if (!FNAME_RE.test(value))
        throw Error(name+" is not a valid function name: "+value);
};
