var stream = require("stream"),
    util   = require("./util"),
    Stmt   = require("./Stmt"),
    StmtList = require("./StmtList");

var AstReader = function(options) {
    stream.Writable.call(this, options);

    /**
     * Read buffer.
     * @type {Buffer}
     */
    this.buffer = null;

    /**
     * State.
     * @type {number}
     */
    this.state = AstReader.STATE.STMT_LIST;

    /**
     * Processing stack.
     * @type {Array.<*>}
     */
    this.stack = [];
};

// Extends stream.Writable
AstReader.prototype = Object.create(stream.Writable.prototype);

/**
 * States.
 * @type {!Object.<string,number>}
 * @const
 */
AstReader.STATE = {
    STMT_LIST: 0,
    CONTINUE: 1
};

AstReader.prototype._write = function (chunk, encoding, callback) {
    if (encoding)
        chunk = new Buffer(chunk, encoding);
    this.buffer = this.buffer === null ? chunk : Buffer.concat([this.buffer, chunk]);
    do {
        var initialState = this.state;
        try {
            switch (this.state) {
                case AstReader.STATE.STMT_LIST:
                    this._readStmtList();
                    break;
                case AstReader.STATE.STMT:
                    this._readStmt();
                    break;
                case AstReader.CONTINUE:
                    if (this.stack.length === 0) {
                        callback();
                        return;
                    }
                default:
                    throw Error("illegal state: " + this.state);
            }
        } catch (err) {
            if (err === util.E_MORE) {
                callback();
                return;
            }
            throw err;
        }
        if (this.state !== initialState)
            this.emit("switchState", initialState, this.state, this.offset);
    } while (true);
};

AstReader.prototype._readStmtList = function() {
    var off = 0;
    var vi = util.readVarint(this.buffer, off); off += vi.length;
    this.buffer = this.buffer.slice(off);
    var nStmts = vi.value;
    if (nStmts === 0) {
        this.state = AstReader.CONTINUE;
        return;
    }
    var stmtList = new StmtList(nStmts);
    stmtList.offset = 0;
    this.stack.push(stmtList);
    this.state = AstReader.STATE.STMT;
};

AstReader.prototype._readStmt = function() {
    var stmtList = this.stack[this.stack.length-1];
    var off = 0;
    var code = util.readCode(this.buffer, off++);
    if (code.imm === null) {

    } else {

    }
    if (stmtList.offset >= stmtList.length) {
        this.stack.pop();
        this.state = AstReader.CONTINUE;
    }
};

AstReader.read = function(buffer, offset) {
    return new AstReader(buffer, offset).readStmtList();
};
