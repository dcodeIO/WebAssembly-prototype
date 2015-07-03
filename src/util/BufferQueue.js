/*
 Copyright 2015 Daniel Wirtz <dcode@dcode.io>

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/**
 * A BufferQueue.
 *
 * Used to remove the need to slice or concatenate buffers and provides the
 * convenience of relative read operations and occasionally performed rollbacks.
 *
 * @constructor
 * @exports util.BufferQueue
 */
var BufferQueue = module.exports = function() {

    /**
     * Queued buffers.
     * @type {!Array.<!Buffer>}
     */
    this.buffers = [];

    /**
     * Global offset since start.
     * @type {number}
     */
    this.offset = 0;

    /**
     * Current buffer index.
     * @type {number}
     */
    this.bufferIndex = 0;

    /**
     * Current buffer offset.
     * @type {number}
     */
    this.bufferOffset = 0;

    /**
     * Byte length of all queued buffers.
     * @type {number}
     */
    this.bufferLength = 0;

    /**
     * Previous global offset.
     * @type {number}
     */
    this.previousOffset = 0;

    /**
     * Previous buffer index.
     * @type {number}
     * @see {@link BufferQueue#reset}
     */
    this.previousBufferIndex = 0;

    /**
     * Previous buffer offset.
     * @type {number}
     * @see {@link BufferQueue#reset}
     */
    this.previousBufferOffset = 0;
};

/**
 * Number of remaining readable bytes.
 * @name BufferQueue#remaining
 * @type {number}
 */
Object.defineProperty(BufferQueue.prototype, "remaining", {
    get: function() {
        if (this.buffers.length === 0)
            return 0;
        var len = this.bufferLength;
        for (var i=0; i<this.bufferIndex; ++i)
            len -= this.buffer[i].length;
        return len - this.bufferOffset;
    }
});

/**
 * An error indicating that more data is required to perform the current operation.
 * @type {!Error}
 */
BufferQueue.E_MORE = new Error("E_MORE");

/**
 * Pushes another buffer to the queue.
 * @param {!Buffer} buffer
 */
BufferQueue.prototype.push = function(buffer) {
    if (buffer.length === 0)
        return;
    this.buffers.push(buffer);
    this.bufferLength += buffer.length;
};

/**
 * Advances the current buffer index and offset and discards complete buffers.
 */
BufferQueue.prototype.advance = function() {
    while (this.bufferIndex > 0) {
        this.bufferLength -= this.buffers.shift().length;
        this.bufferIndex--;
    }
    this.previousOffset = this.offset;
    this.previousBufferIndex = this.bufferIndex;
    this.previousBufferOffset = this.bufferOffset;
};

/**
 * Resets the buffer queue to the last state.
 */
BufferQueue.prototype.reset = function() {
    this.offset = this.previousOffset;
    this.bufferIndex = this.previousBufferIndex;
    this.bufferOffset = this.previousBufferOffset;
};

/**
 * Ensures that the specified number of bytes is readable.
 * @param {number} nBytes
 * @throws {BufferQueue.E_MORE}
 */
BufferQueue.prototype.ensure = function(nBytes) {
    if (this.remaining < nBytes)
        throw BufferQueue.E_MORE;
};

/**
 * Reads an 8bit unsigned integer.
 * @returns {number}
 */
BufferQueue.prototype.readUInt8 = function() {
    if (this.bufferIndex >= this.buffers.length)
        throw BufferQueue.E_MORE;
    var buf = this.buffers[this.bufferIndex],
        b = buf[this.bufferOffset++];
    this.offset++;
    if (this.bufferOffset >= buf.length) {
        this.bufferIndex++;
        this.bufferOffset = 0;
    }
    return b;
};

/**
 * Reads a little endian 32bit unsigned integer.
 * @returns {number}
 */
BufferQueue.prototype.readUInt32LE = function() {
    return (this.readUInt8() | (this.readUInt8() << 8) | (this.readUInt8() << 16) | (this.readUInt8() << 24)) >>> 0;
};

/**
 * Reads a varint.
 * @returns {number}
 */
BufferQueue.prototype.readVarint = function() {
    if (this.buffers.length === 0)
        throw BufferQueue.E_MORE;
    var value = this.readUInt8();
    if (value < 0x80)
        return value;
    value &= 0x7f;
    var c = 1;
    for (var shift = 7; true; shift += 7) {
        var b = this.readUInt8();
        if (b < 0x80)
            return (value | (b << shift)) >>> 0;
        if (++c > 5)
            throw Error("illegal varint32: >5 bytes");
        value |= (b & 0x7f) << shift;
    }
};

// ref: https://github.com/feross/ieee754
BufferQueue.prototype._readFloat = function(isLE, mLen, nBytes) {
    var buffer = [];
    for (var i=0; i<nBytes; ++i)
        buffer.push(this.readUInt8());
    var e, m,
        eLen = nBytes * 8 - mLen - 1,
        eMax = (1 << eLen) - 1,
        eBias = eMax >> 1,
        nBits = -7,
        d = isLE ? -1 : 1,
        s = buffer[i = isLE ? (nBytes - 1) : 0];

    i += d;

    e = s & ((1 << (-nBits)) - 1);
    s >>= (-nBits);
    nBits += eLen;
    for (; nBits > 0; e = e * 256 + buffer[i], i += d, nBits -= 8) {}

    m = e & ((1 << (-nBits)) - 1);
    e >>= (-nBits);
    nBits += mLen;
    for (; nBits > 0; m = m * 256 + buffer[i], i += d, nBits -= 8) {}

    if (e === 0)
        e = 1 - eBias;
    else if (e === eMax)
        return m ? NaN : ((s ? -1 : 1) * Infinity);
    else {
        m = m + Math.pow(2, mLen);
        e = e - eBias;
    }
    return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

/**
 * Reads a little endian 32 bit float.
 * @returns {number}
 */
BufferQueue.prototype.readFloatLE = function() {
    return this._readFloat(true, 23, 4);
};

/**
 * Reads a little endian 64 bit double.
 * @returns {number}
 */
BufferQueue.prototype.readDoubleLE = function() {
    return this._readFloat(true, 52, 8);
};

/**
 * Reads a null terminated UTF8 encoded string.
 * @returns {string}
 */
BufferQueue.prototype.readCString = function() {
    var bytes = [];
    while (true) {
        var b = this.readUInt8();
        if (b === 0)
            return new Buffer(bytes).toString("utf8");
        bytes.push(b);
    }
};
