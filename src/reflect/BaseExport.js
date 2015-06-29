/**
 * Abstract base class of exports.
 * @constructor
 * @param {!Assembly} assembly
 */
var BaseExport = module.exports = function(assembly) {

    /**
     * Assembly reference.
     * @type {!Assembly}
     */
    this.assembly = assembly;
};
