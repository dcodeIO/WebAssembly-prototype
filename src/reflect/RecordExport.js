var BaseExport = require("./BaseExport"),
    FunctionDeclaration = require("./FunctionDeclaration");

/**
 * A record export.
 * @constructor
 * @param {!Assembly} assembly
 * @param {!Object.<string,number|!FunctionDeclaration>=} functions
 * @extends BaseExport
 * @exports reflect.RecordExport
 */
function RecordExport(assembly, functions) {
    BaseExport.call(this, assembly);

    /**
     * Internal function indexes by exported name.
     * @type {!Object.<string,!FunctionDeclaration>}
     */
    this.functions = {};
    Object.keys(functions).forEach(function(name) {
        this.functions[name] = functions[name] instanceof FunctionDeclaration
            ? functions[name]
            : this.assembly.getFunctionDeclaration(functions[name]);
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
    var names = Object.keys(this.functionIndexes);
    for (var i=0; i<names.length; ++i)
        sb.push(" ", names[i], ":", this.functionIndexes[names[i]]);
    return sb.join("");
};
