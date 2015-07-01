var types = require("../types"),
    BaseStmt = require("./BaseStmt");

/**
 * An explicit void expression.
 * @constructor
 * @param {number} code
 * @param {(!Array.<number|!BaseStmt|!Constant|!LocalVariable|!GlobalVariable|!FunctionDeclaration|!FunctionImportSignature|!FunctionPointerTable>|number|!BaseStmt|!Constant|!LocalVariable|!GlobalVariable|!FunctionDeclaration|!FunctionImportSignature|!FunctionPointerTable)=} operands
 * @constructor
 * @extends BaseStmt
 * @exports stmt.VoidStmt
 */
var VoidStmt = module.exports = function(code, operands) {
    BaseStmt.call(this, types.RType.Void, code, operands);
};

VoidStmt.prototype = Object.create(BaseStmt.prototype);
