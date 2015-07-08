var assert = require("assert"),
    types = require("../../types");

var BaseBehavior = require("./BaseBehavior"),
    Stmt = require("../Stmt");

/**
 * StmtList behavior.
 * @param {string} name
 * @param {string} description
 * @constructor
 * @extends stmt.behavior.BaseBehavior
 * @exports stmt.behavior.StmtListBehavior
 */
function StmtListBehavior(name, description) {
    BaseBehavior.call(this, name, description);
}

module.exports = StmtListBehavior;

// Extends BaseBehavior
StmtListBehavior.prototype = Object.create(BaseBehavior.prototype);

StmtListBehavior.prototype.read = function(s) {
    var count = s.varint();

};