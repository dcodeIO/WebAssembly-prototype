var types = require("../../types");

/**
 * Behaviors defining how a statement is read, validated and written.
 * @constructor
 * @param {string} description
 * @exports stmt.Behavior
 */
function Behavior(description) {

    /**
     * Textual description.
     * @type {string}
     */
    this.description = description;
}

module.exports = Behavior;

/**
 * A function capable of reading a statement with this behaviour.
 * @param {!ast.ReadState} s
 * @param {number} op
 * @param {number|null} imm
 */
Behavior.prototype.read = function(s, op, imm) {
    throw Error("not implemented");
};

/**
 * A function capable of validating a statement with this behavior.
 * @param {!reflect.FunctionDefinition} definition
 * @param {!stmt.BaseStmt} stmt
 */
Behavior.prototype.validate = function(definition, stmt) {
    throw Error("not implemented");
};

/**
 * A function capable of writing a statement with this behavior.
 * @param {!ast.WriteState} s
 * @param {!BaseStmt} stmt
 */
Behavior.prototype.write = function(s, stmt) {
    throw Error("not implemented");
};
