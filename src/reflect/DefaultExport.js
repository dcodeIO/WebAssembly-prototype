var BaseExport = require("./BaseExport"),
    FunctionDeclaration = require("./FunctionDeclaration");

/**
 * A default export.
 * @constructor
 * @param {!Assembly} assembly
 * @param {number|!FunctionDeclaration} function_
 * @extends BaseExport
 * @exports reflect.DefaultExport
 */
var DefaultExport = module.exports = function(assembly, function_) {
    BaseExport.call(this, assembly);

    /**
     * Exported function.
     * @type {!FunctionDeclaration}
     */
    this.function = function_ instanceof FunctionDeclaration
        ? function_
        : this.assembly.getFunctionDeclaration(function_);
};

DefaultExport.prototype = Object.create(BaseExport.prototype);

/**
 * Returns a string representation of this export.
 * @returns {string}
 */
DefaultExport.prototype.toString = function() {
    return "DefaultExport " + this.function.toString();
};
