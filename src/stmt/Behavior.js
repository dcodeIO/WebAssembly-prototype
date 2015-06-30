// TODO
var Behavior = module.exports = function(read, write) {

    /**
     * A function capable of reading a statement with this behaviour.
     * @type {function(AstReadState):BaseStmt}
     */
    this.read = read;

    /**
     * A function capable of writing a statement with this behavior.
     * @type {function(BaseStmt,AstWriteState):BaseStmt}
     */
    this.write = write;
};
