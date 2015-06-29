var types = require("../types"),
    util = require("../util");

var FunctionSignature = require("./FunctionSignature"),
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
 * Indexed internal function name.
 * @name FunctionDefinition#name
 * @type {string}
 */
Object.defineProperty(FunctionDefinition.prototype, "name", {
    get: function() {
        return this.declaration.name;
    }
});

/**
 * Returns a string representation of this function definition.
 * @returns {string}
 */
FunctionDefinition.prototype.toString = function() {
    return "FunctionDefinition " + this.name
         + " vars:" + this.variables.length
         + " decl:" + this.declaration.index;
};

FunctionDefinition.prototype.header = function() {
    var sb = [];
    sb.push("function ", this.name, "(");
    var args = this.declaration.signature.argumentTypes;
    for (var i=0; i<args.length; ++i) {
        if (i > 0)
            sb.push(",");
        sb.push(util.localName(i));
    }
    sb.push(") {\n");
    if (args.length > 0) {
        for (i = 0; i < args.length; ++i) {
            sb.push("    ", util.localName(i), "=");
            switch (args[i]) {
                case types.Type.I32:
                    sb.push(util.localName(i), "|0;\n");
                    break;
                case types.Type.F32:
                    sb.push(util.hotStdLibName("FRound"), "(", util.localName(i), ");\n");
                    break;
                case types.Type.F64:
                    sb.push("+", util.localName(i), ";\n");
                    break;
            }
        }
    }
    if (this.variables.length > 0) {
        var lastType = -1;
        for (i = 0; i < this.variables.length; ++i) {
            var v = this.variables[i];
            if (i > 0) {
                if (v.type !== lastType)
                    sb.push(";\n    var ");
                else
                    sb.push(",\n    ");
            } else
                sb.push("    var ");
            lastType = v.type;
            sb.push(util.localName(i + args.length), "=");
            switch (v.type) {
                case types.Type.I32:
                    sb.push("0");
                    break;
                case types.Type.F32:
                    sb.push(util.hotStdLibName("FRound"), "(0)");
                    break;
                case types.Type.F64:
                    sb.push("0.");
            }
        }
        sb.push(";\n");
    }
    return sb.join("");
};
