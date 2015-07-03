/**
 * Abstract base class of exports.
 * @constructor
 * @param {!Assembly} assembly
 * @exports reflect.BaseExport
 */
function BaseExport(assembly) {

    /**
     * Assembly reference.
     * @type {!reflect.Assembly}
     */
    this.assembly = assembly;
}

module.exports = BaseExport;
