var types = require("../types");

/**
 * A list of statements.
 * @constructor
 * @param {number} size
 * @extends Array
 * @exports stmt.StmtList
 */
function StmtList(size) {
    Array.call(this, size);
    if (typeof size !== 'undefined')
        this.length = size;

    /**
     * Assembly offset.
     * @type {number}
     */
    this.offset = 0;
}

module.exports = StmtList;

// Extends Array
StmtList.prototype = Object.create(Array.prototype);

/**
 * Wire type.
 * @name stmt.StmtList#type
 * @type {number}
 */
Object.defineProperty(StmtList.prototype, "type", {
    get: function() {
        return types.WireType.StmtList;
    }
});

/**
 * Adds a statement to the list.
 * @param {!stmt.BaseStmt} stmt
 */
StmtList.prototype.add = function(stmt) {
    if (this.offset >= this.length)
        throw Error("statement list overflow");
    stmt.parent = this;
    this[this.offset++] = stmt;
};

/**
 * Returns a string representation of this statement list.
 * @returns {string}
 */
StmtList.prototype.toString = function() {
    return "StmtList["+this.length+"]";
};
