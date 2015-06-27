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
