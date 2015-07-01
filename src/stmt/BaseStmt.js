var types = require("../types");

/**
 * Abstract base class of all statements.
 * @constructor
 * @param {number} code
 * @param {(!Array.<number|!BaseStmt|!Constant|!LocalVariable|!GlobalVariable|!FunctionDeclaration|!FunctionImportSignature|!FunctionPointerTable>|number|!BaseStmt|!Constant|!LocalVariable|!GlobalVariable|!FunctionDeclaration|!FunctionImportSignature|!FunctionPointerTable)=} operands
 * @abstract
 * @exports stmt.BaseStmt
 */
var BaseStmt = module.exports = function(type, code, operands) {
    if (type !== undefined && !types.isValidRType(type))
        throw TypeError("illegal statement type: "+type);

    /**
     * Statement type.
     * @type {number|undefined}
     */
    this.type = type;

    /**
     * Opcode.
     * @type {number}
     */
    this.code = code;

    /**
     * Whether the opcode included a value or not. If true, the first operand is the value.
     * @type {boolean}
     */
    this.withImm = false;

    /**
     * Operands.
     * @type {!Array.<number|!BaseStmt|!Constant|!LocalVariable|!GlobalVariable|!FunctionDeclaration|!FunctionImportSignature|!FunctionPointerTable>}
     */
    this.operands = Array.isArray(operands)
        ? operands
        : typeof operands !== 'undefined'
            ? [operands]
            : [];
};

/**
 * Gets the literal opcode name.
 * @name BaseStmt#name
 * @type {string|undefined}
 */
Object.defineProperty(BaseStmt.prototype, "name", {
    get: function() {
        if (this.type === undefined)
            return "Stmt:"+types.StmtNames[this.code];
        switch (this.type) {
            case types.RType.I32:
                return "I32:"+types.I32Names[this.code];
            case types.RType.F32:
                return "F32:"+types.F32Names[this.code];
            case types.RType.F64:
                return "F64:"+types.F64Names[this.code];
            case types.RType.Void:
                return "Void:"+types.VoidNames[this.code];
            default:
                throw Error("illegal statement type: "+this.type);
        }
    }
});

/**
 * Adds another operand.
 * @param {number|!BaseStmt} operand
 */
BaseStmt.prototype.add = function(operand) {
    this.operands.push(operand);
};

/**
 * Returns a string representation of this statement.
 * @param {boolean=} shortFormat
 * @returns {string}
 */
BaseStmt.prototype.toString = function(shortFormat) {
    var sb = [];
    sb.push(this.name);
    if (shortFormat)
        sb.push("+", this.operands.length.toString());
    else
        for (var i=0; i<this.operands.length; ++i) {
            sb.push(" ");
            if (this.operands[i] instanceof BaseStmt)
                sb.push(this.operands[i].toString(true));
            else
                sb.push(this.operands[i].toString());
        }
    return sb.join("");
};
