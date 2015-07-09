var types = require("../../types");

/**
 * Abstract base class of all behaviors.
 * @constructor
 * @param {string} name
 * @param {string} description
 * @abstract
 * @exports stmt.behavior.BaseBehavior
 */
function BaseBehavior(name, description) {

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

module.exports = BaseBehavior;

/**
 * A function capable of reading a statement with this behaviour.
 * @param {!ast.ReadState} s
 * @param {number} code
 * @param {number|null} imm
 */
BaseBehavior.prototype.read = function(s, code, imm) {
    throw Error("not implemented");
};

/**
 * A function capable of validating a statement with this behavior.
 * @param {!reflect.FunctionDefinition} definition
 * @param {!stmt.BaseStmt} stmt
 */
BaseBehavior.prototype.validate = function(definition, stmt) {
    throw Error("not implemented");
};

/**
 * A function capable of writing a statement with this behavior.
 * @param {!ast.WriteState} s
 * @param {!stmt.BaseStmt} stmt
 */
BaseBehavior.prototype.write = function(s, stmt) {
    throw Error("not implemented");
};

/**
 * An optional function capable of optimizing a statement with this behavior.
 * @type {function(!reflect.FunctionDefinition, !stmt.BaseStmt)|undefined}
 */
BaseBehavior.prototype.optimize;
