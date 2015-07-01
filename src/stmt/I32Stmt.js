var types = require("../types"),
    BaseStmt = require("./BaseStmt");

/**
 * A typed I32 statement.
 * @constructor
 * @param {number} code
 * @param {(!Array.<number|!BaseStmt|!Constant|!LocalVariable|!GlobalVariable|!FunctionDeclaration|!FunctionImportSignature|!FunctionPointerTable>|number|!BaseStmt|!Constant|!LocalVariable|!GlobalVariable|!FunctionDeclaration|!FunctionImportSignature|!FunctionPointerTable)=} operands
 * @constructor
 * @extends BaseStmt
 */
var I32Stmt = module.exports = function(code, operands) {
    BaseStmt.call(this, types.RType.I32, code, operands);
};

I32Stmt.prototype = Object.create(BaseStmt.prototype);
