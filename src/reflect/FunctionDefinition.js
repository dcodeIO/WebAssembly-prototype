var types = require("../types"),
    util = require("../util");

var FunctionSignature = require("./FunctionSignature");

/**
 * A function definition.
 * @constructor
 * @param {!reflect.FunctionDeclaration} declaration
 * @param {number} nI32vars
 * @param {number} nF32vars
 * @param {number} nF64vars
 * @param {number} byteOffset
 * @param {number=} byteLength
 * @exports reflect.FunctionDefinition
 */
function FunctionDefinition(declaration, nI32vars, nF32vars, nF64vars, byteOffset, byteLength) {

    /**
     * Function declaration reference.
     * @type {!reflect.FunctionDeclaration}
     */
    this.declaration = declaration;

    /**
     * Local variables.
     * @type {!Array.<!reflect.LocalVariable>}
     */
    this.variables = new Array(declaration.signature.argumentTypes.length + nI32vars + nF32vars + nF64vars);
    var index = 0;
    declaration.signature.argumentTypes.forEach(function (type) {
        this.variables[index++] = new LocalVariable(this, type);
    }, this);
    for (var i = 0; i < nI32vars; ++i, ++index)
        this.variables[index] = new LocalVariable(this, types.Type.I32);
    for (i = 0; i < nF32vars; ++i, ++index)
        this.variables[index] = new LocalVariable(this, types.Type.F32);
    for (i = 0; i < nF64vars; ++i, ++index)
        this.variables[index] = new LocalVariable(this, types.Type.F64);

    /**
     * Byte offset of the function body.
     * @type {number}
     */
    this.byteOffset = byteOffset || -1;

    /**
     * Byte length of the function body.
     * @type {number}
     */
    this.byteLength = byteLength || -1;

    /**
     * Abstract syntax tree.
     * @type {stmt.StmtList}
     */
    this.ast = null;
}

module.exports = FunctionDefinition;

var LocalVariable = require("./LocalVariable"); // cyclic

/**
 * Indexed internal function name.
 * @name reflect.FunctionDefinition#name
 * @type {string}
 */
Object.defineProperty(FunctionDefinition.prototype, "name", {
    get: function() {
        return this.declaration.name;
    }
});

/**
 * Declaration index.
 * @name reflect.FunctionDefinition#index
 * @type {number}
 */
Object.defineProperty(FunctionDefinition.prototype, "index", {
    get: function() {
        return this.declaration.index;
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

/**
 * Gets the variable at the specified index.
 * @param {number} index
 * @returns {!reflect.LocalVariable}
 */
FunctionDefinition.prototype.getVariable = function(index) {
    util.assertInteger("index", index, 0, this.variables.length-1);
    return this.variables[index];
};

/**
 * Builds the function header in asm.js.
 * @param {bool=} pack
 * @returns {string}
 */
FunctionDefinition.prototype.asmHeader = function(pack) {
    var indent = pack ? "" : "    ",
        ws = pack ? "" : " ",
        nl = pack ? "" : "\n";
    var sb = [];
    sb.push("function ", this.name, "(");
    var args = this.declaration.signature.argumentTypes;
    var assembly = this.declaration.assembly;
    for (var i=0; i<args.length; ++i) {
        if (i > 0)
            sb.push(",");
        sb.push(assembly.localName(i));
    }
    sb.push(")", ws, "{\n");
    if (args.length > 0) {
        for (i = 0; i < args.length; ++i) {
            sb.push(indent, assembly.localName(i), ws, "=", ws);
            switch (args[i]) {
                case types.Type.I32:
                    sb.push(assembly.localName(i), "|0;", nl);
                    break;
                case types.Type.F32:
                    sb.push(util.hotStdLibName("FRound"), "(", assembly.localName(i), ");", nl);
                    break;
                case types.Type.F64:
                    sb.push("+", assembly.localName(i), ";", nl);
                    break;
            }
        }
    }
    if (this.variables.length > args.length) {
        sb.push(indent, "var ");
        for (i = args.length; i < this.variables.length; ++i) {
            var v = this.variables[i];
            if (i > args.length)
                sb.push(",", nl, indent);
            sb.push(assembly.localName(i + args.length), ws, "=", ws);
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
        sb.push(";");
    }
    return sb.join("");
};
