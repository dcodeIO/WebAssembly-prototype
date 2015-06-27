var types = require("../types"),
    FunctionSignature = require("./FunctionSignature"),
    LocalVariable = require("./LocalVariable");

/**
 * A function definition.
 * @constructor
 * @param {!Assembly} assembly
 * @param {number|!FunctionSignature} signatureOrIndex
 * @param {number} nI32vars
 * @param {number} nF32vars
 * @param {number} nF64vars
 */
var FunctionDefinition = module.exports = function(assembly, signatureOrIndex, nI32vars, nF32vars, nF64vars) {

    /**
     * Assembly reference.
     * @type {!Assembly}
     */
    this.assembly = assembly;

    /**
     * Function signature.
     * @type {!FunctionSignature}
     */
    this.signature;
    if (signatureOrIndex instanceof FunctionSignature)
        this.signature = assembly.getSignature(signatureOrIndex.index);
    else
        this.signature = assembly.getSignature(signatureOrIndex);

    /**
     * Local variables.
     * @type {!Array.<!LocalVariable>}
     */
    this.variables = [];
    var index = 0;
    for (var i=0; i<nI32vars; ++i, ++index)
        this.variables.push(new LocalVariable(this, index, types.Type.I32));
    for (var i=0; i<nF32vars; ++i, ++index)
        this.variables.push(new LocalVariable(this, index, types.Type.F32));
    for (var i=0; i<nF64vars; ++i, ++index)
        this.variables.push(new LocalVariable(this, index, types.Type.F64));
};
