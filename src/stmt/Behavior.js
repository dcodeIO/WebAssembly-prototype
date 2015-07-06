var types = require("../types");

var Stmt = require("./Stmt"),
    ExprI32 = require("./ExprI32"),
    ExprF32 = require("./ExprF32"),
    ExprF64 = require("./ExprF64");

/**
 * Behaviors defining how a statement is read and written.
 * @constructor
 * @param {number} type Optional type
 * @param {function(!ReadState,number=)} read
 * @param {function(!AstWriteState,!BaseStmt)} write
 * @param {string} description
 * @exports stmt.Behavior
 */
function Behavior(read, write, description) {

    /**
     * A function capable of reading a statement with this behaviour.
     * @type {function(!ast.ReadState,number=)}
     */
    this.read = read.bind(this);

    /**
     * A function capable of writing a statement with this behavior.
     * @type {function(!ast.WriteState,!BaseStmt)}
     */
    this.write = write.bind(this);

    /**
     * Textual description.
     * @type {string}
     */
    this.description = description;
}

function TypedBehavior(type, read, write, description) {
    Behavior.call(this, read, write, description);

    /**
     * Underlying type.
     * @type {number}
     */
    this.type = type;
}

TypedBehavior.prototype = Object.create(Behavior.prototype);

module.exports = Behavior;

var AstReader = require("../ast/Reader"), // cyclic
    State = AstReader.State,
    stateForType = AstReader.stateForType;

// SetLocal

Behavior.SetLocal = new Behavior(function read(s, imm) {

    var withImm = typeof imm !== 'undefined',
        variable = s.local(withImm ? imm : s.varint());
    s.emit(variable, withImm);
    s.expect(s.state(variable.type));

}, function write(s, stmt) {

    var variable = stmt.operands[0];
    if (variable.index <= types.ImmMax)
        s.emit_code(stmt.codeWithImm, variable.index);
    else {
        s.emit();
        s.varint(variable.index);
    }
    s.expect(s.state(variable.type));

}, "local variable index + Expr<local variable type>");

// SetGlobal

Behavior.SetGlobal = new Behavior(function read(s, imm) {

    var withImm = typeof imm !== 'undefined',
        variable = s.global(withImm ? imm : s.varint());
    s.emit(variable, withImm);
    s.expect(s.state(variable.type));

}, function write(s, stmt) {

    var variable = stmt.operands[0];
    if (variable.index <= types.ImmMax)
        s.emit_code(stmt.codeWithImm, variable.index);
    else {
        s.emit();
        s.varint(variable.index);
    }
    s.expect(s.state(variable.type));

}, "global variable index + Expr<global variable type>");

// I32StoreN

Behavior.I32StoreN = new Behavior(types.RType.I32, function read(s, imm) {

    s.emit();

}, function write(s, stmt) {

});

Behavior.IStore = new Behavior("Expr<I32> heap index + Expr<I32> value", function(s) {
    s.emit();
    s.expect(State.EXPR_I32, State.EXPR_I32);
}, function(s, stmt) {
    s.emit(stmt.code);
    s.continue(stmt.operands[0], stmt.operands[1]);
});