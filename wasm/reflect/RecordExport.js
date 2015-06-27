var BaseExport = require("./BaseExport");

/**
 * A record export.
 * @constructor
 * @param {!Assembly} assembly
 * @param {!Object.<string,number>=}
 * @extends BaseExport
 */
var RecordExport = module.exports = function(assembly, functionIndexes) {
    BaseExport.call(this, assembly);

    /**
     * Internal function indexes by exported name.
     * @type {!Object.<string,number>}
     */
    this.functionIndexes = functionIndexes || {};
};

RecordExport.prototype = Object.create(BaseExport.prototype);
