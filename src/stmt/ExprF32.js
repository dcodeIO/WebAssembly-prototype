var types = require("../types"),
    BaseStmt = require("./BaseStmt");

/**
 * A F32 expression.
 * @constructor
 * @param {number} code
 * @param {(!Array.<number|!BaseStmt|!Constant|!LocalVariable|!GlobalVariable|!FunctionDeclaration|!FunctionImportSignature|!FunctionPointerTable>|number|!BaseStmt|!Constant|!LocalVariable|!GlobalVariable|!FunctionDeclaration|!FunctionImportSignature|!FunctionPointerTable)=} operands
 * @constructor
 * @extends BaseStmt
 * @exports stmt.F32Stmt
 */
function ExprF32(code, operands) {
    BaseStmt.call(this, code, operands);
}

module.exports = ExprF32;

ExprF32.prototype = Object.create(BaseStmt.prototype);

Object.defineProperty(ExprF32.prototype, "type", {
    get: function() {
        return this.types.RType.F32;
    }
});
