var types = require("../types");

var Stmt = require("./Stmt"),
    ExprI32 = require("./ExprI32"),
    ExprF32 = require("./ExprF32"),
    ExprF64 = require("./ExprF64");

/**
 * Behaviors defining how a statement is read and written.
 * @constructor
 * @param {string} description
 * @param {function(!AstReadState,number=)} read
 * @param {function(!AstWriteState,!BaseStmt)} write
 * @exports stmt.Behavior
 */
function Behavior(description, read, write) {

    /**
     * Textual description.
     * @type {string}
     */
    this.description = description;

    /**
     * A function capable of reading a statement with this behaviour.
     * @type {function(!AstReadState,number=)}
     */
    this.read = read;

    /**
     * A function capable of writing a statement with this behavior.
     * @type {function(!AstWriteState,!BaseStmt)}
     */
    this.write = write;
}

module.exports = Behavior;

var AstReader = require("../AstReader"), // cyclic
    State = AstReader.State,
    stateForType = AstReader.stateForType;

/**
 * Sets a local variable.
 * @type {!Behavior}
 */
Behavior.SetLoc = new Behavior("local variable index + Expr<local variable type>", function(s, imm) {
    var withImm = typeof imm !== 'undefined',
        loc = s.local(withImm ? imm : s.varint());
    s.emit(loc, withImm);
    s.expect(stateForType(loc.type));
}, function(s, stmt) {
    var loc = stmt.operands[0],
        expr = stmt.operands[1];
    if (loc.index <= types.ImmMax) {
        s.emit(types.StmtWithImm.SetLoc, loc.index);
    } else {
        s.emit(types.Stmt.SetLoc);
        s.varint(loc.index);
    }
    s.continue(expr);
});

/**
 * Sets a global variable.
 * @type {!Behavior}
 */
Behavior.SetGlo = new Behavior("global variable index + Expr<global variable type>", function(s, imm) {
    var withImm = typeof imm !== 'undefined',
        glo = s.global(withImm ? imm : s.varint());
    s.emit(glo, withImm);
    s.expect(stateForType(glo.type));
}, function(s, stmt) {
    var glo = stmt.operands[0];
    if (glo.index <= types.ImmMax) {
        s.emit(types.StmtWithImm.SetGlo, glo.index);
    } else {
        s.emit(types.Stmt.SetGlo);
        s.varint(glo.index);
    }
    s.continue(stmt.operands[1]);
});

Behavior.IStore = new Behavior("Expr<I32> heap index + Expr<I32> value", function(s) {
    s.emit();
    s.expect(State.EXPR_I32, State.EXPR_I32);
}, function(s, stmt) {
    s.emit(stmt.code);
    s.continue(stmt.operands[0], stmt.operands[1]);
});