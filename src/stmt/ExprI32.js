var types = require("../types"),
    BaseStmt = require("./BaseStmt");

/**
 * An I32 expression.
 * @constructor
 * @param {number} code
 * @param {(!Array.<number|!BaseStmt|!Constant|!LocalVariable|!GlobalVariable|!FunctionDeclaration|!FunctionImportSignature|!FunctionPointerTable>|number|!BaseStmt|!Constant|!LocalVariable|!GlobalVariable|!FunctionDeclaration|!FunctionImportSignature|!FunctionPointerTable)=} operands
 * @constructor
 * @extends BaseStmt
 * @exports stmt.I32Stmt
 */
function ExprI32(code, operands) {
    BaseStmt.call(this, code, operands);
}

module.exports = ExprI32;

ExprI32.prototype = Object.create(BaseStmt.prototype);

Object.defineProperty(ExprI32.prototype, "type", {
    get: function() {
        return this.types.RType.I32;
    }
});
