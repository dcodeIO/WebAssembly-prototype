var BaseExport = require("./BaseExport"),
    FunctionDeclaration = require("./FunctionDeclaration");

/**
 * A record export.
 * @constructor
 * @param {!reflect.Assembly} assembly
 * @param {!Object.<string,number|!reflect.FunctionDeclaration>=} functions
 * @extends reflect.BaseExport
 * @exports reflect.RecordExport
 */
function RecordExport(assembly, functions) {
    BaseExport.call(this, assembly);

    /**
     * Internal function indexes by exported name.
     * @type {!Object.<string,!reflect.FunctionDeclaration>}
     */
    this.functions = {};
    Object.keys(functions).forEach(function(name) {
        this.functions[name] = functions[name] instanceof FunctionDeclaration
            ? functions[name]
            : assembly.getFunctionDeclaration(functions[name]);
    }, this);
}

module.exports = RecordExport;

// Extends BaseExport
RecordExport.prototype = Object.create(BaseExport.prototype);

/**
 * Returns a string representation of this export.
 * @returns {string}
 */
RecordExport.prototype.toString = function() {
    var sb = [];
    sb.push("RecordExport");
    var names = Object.keys(this.functions);
    for (var i=0; i<names.length; ++i)
        sb.push(" ", names[i], ":", this.functions[names[i]]);
    return sb.join("");
};
