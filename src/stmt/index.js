/**
 * @namespace
 * @exports stmt
 */
var stmt = module.exports = {};

stmt.BaseStmt = require("./BaseStmt");
stmt.BaseOperand = require("./BaseOperand");
stmt.BaseExpr = require("./BaseExpr");

stmt.Stmt = require("./Stmt");
stmt.StmtList = require("./StmtList");

stmt.ExprI32 = require("./ExprI32");
stmt.ExprF32 = require("./ExprF32");
stmt.ExprF64 = require("./ExprF64");
stmt.ExprVoid = require("./ExprVoid");

stmt.SwitchCase = require("./SwitchCase");

stmt.behavior = require("./behavior");
