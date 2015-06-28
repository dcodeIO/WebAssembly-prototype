var types = require("../types"),
    FunctionSignature = require("./FunctionSignature"),
    LocalVariable = require("./LocalVariable");

/**
 * A function definition.
 * @constructor
 * @param {!FunctionDeclaration} declaration
 * @param {number} nI32vars
 * @param {number} nF32vars
 * @param {number} nF64vars
 */
var FunctionDefinition = module.exports = function(declaration, nI32vars, nF32vars, nF64vars) {

    /**
     * Function declaration reference.
     * @type {!FunctionDeclaration}
     */
    this.declaration = declaration;

    /**
     * Local variables.
     * @type {!Array.<!LocalVariable>}
     */
    this.variables = new Array(nI32vars + nF32vars + nF64vars);
    var index = 0;
    for (var i=0; i<nI32vars; ++i, ++index)
        this.variables[index] = new LocalVariable(this, index, types.Type.I32);
    for (i=0; i<nF32vars; ++i, ++index)
        this.variables[index] = new LocalVariable(this, index, types.Type.F32);
    for (i=0; i<nF64vars; ++i, ++index)
        this.variables[index] = new LocalVariable(this, index, types.Type.F64);

    /**
     * Abstract syntax tree.
     * @type {StmtList}
     */
    this.ast = null;
};

/**
 * Returns a string representation of this function definition.
 * @returns {string}
 */
FunctionDefinition.prototype.toString = function() {
    return "FunctionDefinition " + this.declaration.index.toString(10) + " " + this.variables.length.toString();
};
