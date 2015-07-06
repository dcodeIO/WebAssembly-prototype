var Behavior = require("./Behavior");

/**
 * Behavior specifying how to process nested statements or expressions.
 * @param {string} description
 * @param {number|null|!Array.<number|null>} nestedTypes
 * @constructor
 */
function NestedBehavior(description, nestedTypes) {
    Behavior.call(this, description);

    /**
     * Nested expression types.
     * @type {!Array.<number|null>}
     */
    this.nestedTypes = Array.isArray(nestedTypes)
        ? nestedTypes
        : [nestedTypes];
}

module.exports = NestedBehavior;

NestedBehavior.prototype = Object.create(Behavior.prototype);

// opcode + Expr<*> value [...]
// Expr<*>, all without imm

NestedBehavior.prototype.read = function(s, code, imm) {
    s.emit();
    var nestedStates = [];
    this.nestedTypes.forEach(function(type) {
        nestedStates.push(s.state(type));
    }, this);
    s.expect(nestedStates);
};

NestedBehavior.prototype.validate = function(definition, stmt) {

};

NestedBehavior.prototype.write = function(s, stmt) {
    s.emit();
    var nestedStates = [];
    this.nestedTypes.forEach(function(type) {
        nestedStates.push(s.state(type));
    }, this);
    s.expect(nestedStates);
};
