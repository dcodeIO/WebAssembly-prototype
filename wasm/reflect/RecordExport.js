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

/**
 * Returns a string representation of this export.
 * @returns {string}
 */
RecordExport.prototype.toString = function() {
    var sb = [];
    sb.push("RecordExport");
    var names = Object.keys(this.functionIndexes);
    for (var i=0; i<names.length; ++i)
        sb.push(" ", names[i], ":", this.functionIndexes[names[i]]);
    return sb.join("");
};
