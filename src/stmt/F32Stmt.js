var types = require("../types"),
    BaseStmt = require("./BaseStmt");

/**
 * A typed F32 statement.
 * @constructor
 * @param {number} code
 * @param {(!Array.<number|!BaseStmt|!Constant|!LocalVariable|!GlobalVariable|!FunctionDeclaration|!FunctionImportSignature|!FunctionPointerTable>|number|!BaseStmt|!Constant|!LocalVariable|!GlobalVariable|!FunctionDeclaration|!FunctionImportSignature|!FunctionPointerTable)=} operands
 * @constructor
 * @extends BaseStmt
 * @exports stmt.F32Stmt
 */
var F32Stmt = module.exports = function(code, operands) {
    BaseStmt.call(this, types.RType.F32, code, operands);
};

F32Stmt.prototype = Object.create(BaseStmt.prototype);
