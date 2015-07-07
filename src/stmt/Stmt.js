var types = require("../types"),
    BaseStmt = require("./BaseStmt");

/**
 * A statement.
 * @constructor
 * @param {number} code
 * @param {(number|!BaseStmt|!Array<number|!BaseStmt>)=} operands
 * @constructor
 * @extends BaseStmt
 * @exports stmt.Stmt
 */
function Stmt(code, operands) {
    BaseStmt.call(this, code, operands);
}

module.exports = Stmt;

Stmt.prototype = Object.create(BaseStmt.prototype);

Object.defineProperty(Stmt.prototype, "type", {
    get: function() {
        return null;
    }
});

Object.defineProperty(Stmt.prototype, "codeWithImm", {
    get: function() {
        switch (this.code) {
            case types.Stmt.SetLoc:
                return types.StmtWithImm.SetLoc;
            case types.Stmt.SetGlo:
                return types.StmtWithImm.SetGlo;
            default:
                return -1;
        }
    }
});
