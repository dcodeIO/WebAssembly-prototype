var BaseExport = require("./BaseExport");

/**
 * A default export.
 * @constructor
 * @param {!Assembly} assembly
 * @param {number} functionIndex
 * @extends BaseExport
 */
var DefaultExport = module.exports = function(assembly, functionIndex) {
    BaseExport.call(this, assembly);

    /**
     * Internal function index.
     * @type {number}
     */
    this.functionIndex = functionIndex;
};

DefaultExport.prototype = Object.create(BaseExport.prototype);
