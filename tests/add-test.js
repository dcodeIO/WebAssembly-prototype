var assert = require("assert"),
    asmModule = require("./add-asm.js");

var add = asmModule({
    Int8Array: Int8Array,
    Uint8Array: Uint8Array,
    Int16Array: Int16Array,
    Uint16Array: Uint16Array,
    Int32Array: Int32Array,
    Uint32Array: Uint32Array,
    Float32Array: Float32Array,
    Float64Array: Float64Array,
    Math: Math,
    NaN: NaN,
    Infinity: Infinity
}, {}, new ArrayBuffer(64*1024));

assert.strictEqual(add(123, 123), 246);
