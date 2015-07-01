var types = require("../types"),
    BaseStmt = require("./BaseStmt");

/**
 * A typed F64 statement.
 * @constructor
 * @param {number} code
 * @param {(!Array.<number|!BaseStmt|!Constant|!LocalVariable|!GlobalVariable|!FunctionDeclaration|!FunctionImportSignature|!FunctionPointerTable>|number|!BaseStmt|!Constant|!LocalVariable|!GlobalVariable|!FunctionDeclaration|!FunctionImportSignature|!FunctionPointerTable)=} operands
 * @constructor
 * @extends BaseStmt
 */
var F64Stmt = module.exports = function(code, operands) {
    BaseStmt.call(this, types.RType.F64, code, operands);
};

F64Stmt.prototype = Object.create(BaseStmt.prototype);
