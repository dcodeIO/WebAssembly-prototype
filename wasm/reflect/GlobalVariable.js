/**
 * A global variable.
 * @constructor
 * @param {!Assembly} assembly
 * @param {number} type
 * @param {string} name
 */
var GlobalVariable = module.exports = function(assembly, type, name) {

    /**
     * Assembly reference.
     * @type {!Assembly}
     */
    this.assembly = assembly;

    /**
     * Variable type.
     * @type {number}
     */
    this.type = type;

    /**
     * Variable name.
     * @type {string}
     */
    this.name = name;
};
