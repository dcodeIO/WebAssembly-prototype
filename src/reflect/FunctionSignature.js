var types = require("../types");

/**
 * A function signature.
 * @constructor
 * @param {!reflect.Assembly} assembly
 * @param {number=} returnType
 * @param {!Array.<number>=} argumentTypes
 * @exports reflect.FunctionSignature
 */
function FunctionSignature(assembly, returnType, argumentTypes) {

    /**
     * Assembly reference.
     * @type {!reflect.Assembly}
     */
    this.assembly = assembly;

    /**
     * Return type.
     * @type {number}
     */
    this.returnType = returnType;

    /**
     * Array of argument types.
     * @type {!Array.<number>}
     */
    this.argumentTypes = argumentTypes || [];

    /**
     * Index override used by {@link reflect.Assembly#optimize}.
     * @type {number}
     * @private
     */
    this._indexOverride = -1; // FIXME
}

module.exports = FunctionSignature;

/**
 * Function signature index.
 * @name reflect.FunctionSignature#index
 * @type {number}
 */
Object.defineProperty(FunctionSignature.prototype, "index", {
    get: function() {
        if (this._indexOverride >= 0)
            return this._indexOverride;
        return this.assembly.functionSignatures.indexOf(this);
    }
});

/**
 * Returns a string representation of this signature.
 * @returns {string}
 */
FunctionSignature.prototype.toString = function() {
    var sb = [];
    sb.push("FunctionSignature idx:", this.index.toString(), " ", types.RTypeNames[this.returnType], "(");
    for (var i=0; i<this.argumentTypes.length; ++i) {
        if (i>0)
            sb.push(",");
        sb.push(types.TypeNames[this.argumentTypes[i]]);
    }
    sb.push(")");
    return sb.join("");
};
