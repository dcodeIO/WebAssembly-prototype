var assert = require("assert");

var types = require("../types");

/**
 * A typed constant pool.
 * @constructor
 * @param {!Assembly} assembly
 * @param {number} type
 * @param {number=} size
 * @extends Array
 */
var ConstantPool = module.exports = function(assembly, type, size) {
    Array.call(this, size);
    if (typeof size !== 'undefined')
        this.length = size;

    /**
     * Assembly reference.
     * @type {!Assembly}
     */
    this.assembly = assembly;

    /**
     * Value type.
     * @type {number}
     */
    this.type = type;
};

ConstantPool.prototype = Object.create(Array.prototype);

/**
 * Constant pool size.
 * @name ConstantPool#size
 * @type {number}
 */
Object.defineProperty(ConstantPool.prototype, "size", {
    get: function() {
        return this.length;
    }
});

/**
 * Returns a string representation of this constant pool.
 * @returns {string}
 */
ConstantPool.prototype.toString = function() {
    return "ConstantPool "
         + " type:" + types.TypeNames[this.type]
         + " size:" + this.length;
};
