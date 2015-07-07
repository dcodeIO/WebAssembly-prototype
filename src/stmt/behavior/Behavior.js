var types = require("../../types");

/**
 * Base class of all behaviors.
 * @constructor
 * @param {string} name
 * @param {string} description
 * @exports stmt.behavior.Behavior
 */
function Behavior(name, description) {

    /**
     * Textual name.
     * @type {string}
     */
    this.name = name;

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
 * @param {number} code
 * @param {number|null} imm
 */
Behavior.prototype.read = function(s, code, imm) {
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
 * @param {!stmt.BaseStmt} stmt
 */
Behavior.prototype.write = function(s, stmt) {
    throw Error("not implemented");
};
