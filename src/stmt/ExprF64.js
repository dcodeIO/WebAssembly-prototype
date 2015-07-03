var types = require("../types"),
    BaseStmt = require("./BaseStmt");

/**
 * A F64 expression.
 * @constructor
 * @param {number} code
 * @param {(!Array.<number|!BaseStmt|!Constant|!LocalVariable|!GlobalVariable|!FunctionDeclaration|!FunctionImportSignature|!FunctionPointerTable>|number|!BaseStmt|!Constant|!LocalVariable|!GlobalVariable|!FunctionDeclaration|!FunctionImportSignature|!FunctionPointerTable)=} operands
 * @constructor
 * @extends BaseStmt
 * @exports stmt.F64Stmt
 */
function ExprF64(code, operands) {
    BaseStmt.call(this, code, operands);
}

module.exports = ExprF64;

ExprF64.prototype = Object.create(BaseStmt.prototype);

Object.defineProperty(ExprF64.prototype, "type", {
    get: function() {
        return this.types.RType.F64;
    }
});
