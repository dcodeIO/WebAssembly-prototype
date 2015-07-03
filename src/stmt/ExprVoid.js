var types = require("../types"),
    BaseStmt = require("./BaseStmt");

/**
 * A void expression.
 * @constructor
 * @param {number} code
 * @param {(!Array.<number|!BaseStmt|!Constant|!LocalVariable|!GlobalVariable|!FunctionDeclaration|!FunctionImportSignature|!FunctionPointerTable>|number|!BaseStmt|!Constant|!LocalVariable|!GlobalVariable|!FunctionDeclaration|!FunctionImportSignature|!FunctionPointerTable)=} operands
 * @constructor
 * @extends BaseStmt
 * @exports stmt.VoidStmt
 */
function ExprVoid(code, operands) {
    BaseStmt.call(this, code, operands);
}

module.exports = ExprVoid;

ExprVoid.prototype = Object.create(BaseStmt.prototype);

Object.defineProperty(ExprVoid.prototype, "type", {
    get: function() {
        return this.types.RType.Void;
    }
});
