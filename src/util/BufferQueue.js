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
    this.markedOffset = 0;

    /**
     * Previous buffer index.
     * @type {number}
     * @see {@link BufferQueue#reset}
     */
    this.markedBufferIndex = 0;

    /**
     * Previous buffer offset.
     * @type {number}
     * @see {@link BufferQueue#reset}
     */
    this.markedBufferOffset = 0;
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
            len -= this.buffers[i].length;
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
 * Commits the current buffer index and offset.
 * @returns {!util.BufferQueue}
 */
BufferQueue.prototype.commit = function() {
    this.markedOffset = this.offset;
    this.markedBufferIndex = this.bufferIndex;
    this.markedBufferOffset = this.bufferOffset;
    return this;
};

/**
 * Commits the current buffer index and offset and discards complete buffers.
 * @returns {!util.BufferQueue}
 */
BufferQueue.prototype.advance = function() {
    while (this.bufferIndex > 0) {
        this.bufferLength -= this.buffers.shift().length;
        this.bufferIndex--;
    }
    return this.commit();
};

/**
 * Resets the buffer queue to the last state.
 * @returns {!util.BufferQueue}
 */
BufferQueue.prototype.reset = function() {
    this.offset = this.markedOffset;
    this.bufferIndex = this.markedBufferIndex;
    this.bufferOffset = this.markedBufferOffset;
    return this;
};

/**
 * Clears all buffers.
 * @param {boolean} resetOffset
 * @returns {!util.BufferQueue}
 */
BufferQueue.prototype.clear = function(resetOffset) {
    this.buffers = [];
    this.bufferLength = 0;
    this.bufferIndex = this.markedBufferIndex = 0;
    this.bufferOffset = this.markedBufferOffset = 0;
    if (resetOffset)
        this.offset = this.markedOffset = 0;
    return this;
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
        u8 = buf[this.bufferOffset++];
    this.offset++;
    if (this.bufferOffset >= buf.length) {
        this.bufferIndex++;
        this.bufferOffset = 0;
    }
    return u8;
};

/**
 * Writes an 8bit unsigned integer.
 * @param {number} u8
 * @returns {!util.BufferQueue}
 */
BufferQueue.prototype.writeUInt8 = function(u8) {
    if (this.bufferIndex >= this.buffers.length)
        throw BufferQueue.E_MORE;
    var buf = this.buffers[this.bufferIndex];
    buf[this.bufferOffset++] = u8;
    this.offset++;
    if (this.bufferOffset >= buf.length) {
        this.bufferIndex++;
        this.bufferOffset = 0;
    }
    return this;
};

/**
 * Reads a little endian 32bit unsigned integer.
 * @returns {number}
 */
BufferQueue.prototype.readUInt32LE = function() {
    return (this.readUInt8() | (this.readUInt8() << 8) | (this.readUInt8() << 16) | (this.readUInt8() << 24)) >>> 0;
};

/**
 * Writes a little endian 32bit unsigned integer.
 * @param {number} u32
 * @returns {!util.BufferQueue}
 */
BufferQueue.prototype.writeUInt32LE = function(u32) {
    return this.writeUInt8(u32)
        .writeUInt8(u32 >>> 8)
        .writeUInt8(u32 >>> 16)
        .writeUInt8(u32 >>> 24);
};

/**
 * Reads an unsigned varint.
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
        value = (value | ((b & 0x7f) << shift)) >>> 0;
    }
};

/**
 * Writes an unsigned varint.
 * @param {number} u32
 * @returns {!util.BufferQueue}
 */
BufferQueue.prototype.writeVarint = function(u32) {
    u32 >>>= 0;
    if (u32) {
        for (; true; u32 >>>= 7) {
            if (u32 < 0x80) {
                this.writeUInt8(u32);
                return this;
            }
            this.writeUInt8(0x80 | (u32 & 0x7f));
        }
    } else
        this.writeUInt8(0);
    return this;
};

/**
 * Reads a signed varint.
 */
BufferQueue.prototype.readVarintSigned = function() {
    if (this.buffers.length === 0)
        throw BufferQueue.E_MORE;
    var value = this.readUInt8();
    if (value < 0x80)
        return value << (32-7) >> (32-7);
    value &= 0x7f;
    var c = 1;
    for (var shift = 7; true; shift += 7) {
        var b = this.readUInt8();
        if (b < 0x80) {
            value = (value | (b << shift)) >>> 0;
            var sign_extend = (32-7) - shift;
            if (sign_extend > 0)
                return (value|0) << sign_extend >> sign_extend;
            return value|0;
        }
        if (++c > 5)
            throw Error("illegal varint32: >5 bytes");
        value = (value | ((b & 0x7f) << shift)) >>> 0;
    }
};

/**
 * Writes a signed varint.
 * @param {number} s32
 * @returns {!util.BufferQueue}
 */
BufferQueue.prototype.writeVarintSigned = function(s32) {
    s32 |= 0;
    if (s32) {
        for (; true; s32 >>= 7) {
            if (-64 <= s32 && s32 < 64) {
                this.writeUInt8(s32 & 0x7f);
                return this;
            }
            this.writeUInt8(0x80 | (s32 & 0x7f));
        }
    } else
        this.writeUInt8(0);
    return this;
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

// ref: https://github.com/feross/ieee754
BufferQueue.prototype._writeFloat = function(value, isLE, mLen, nBytes) {
    var buffer = [];
    for (var i=0; i<nBytes; ++i)
        buffer.push(0);
    var e, m, c;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
    var i = isLE ? 0 : (nBytes - 1);
    var d = isLE ? 1 : -1;
    var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

    value = Math.abs(value);

    if (isNaN(value) || value === Infinity) {
        m = isNaN(value) ? 1 : 0;
        e = eMax;
    } else {
        e = Math.floor(Math.log(value) / Math.LN2);
        if (value * (c = Math.pow(2, -e)) < 1) {
            e--;
            c *= 2;
        }
        if (e + eBias >= 1) {
            value += rt / c;
        } else {
            value += rt * Math.pow(2, 1 - eBias);
        }
        if (value * c >= 2) {
            e++;
            c /= 2;
        }

        if (e + eBias >= eMax) {
            m = 0;
            e = eMax;
        } else if (e + eBias >= 1) {
            m = (value * c - 1) * Math.pow(2, mLen);
            e = e + eBias;
        } else {
            m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
            e = 0;
        }
    }

    for (; mLen >= 8; buffer[i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

    e = (e << mLen) | m;
    eLen += mLen;
    for (; eLen > 0; buffer[i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

    buffer[i - d] |= s * 128;
    for (i=0; i<buffer.length; ++i)
        this.writeUInt8(buffer[i]);
    return this;
};

/**
 * Writes a little endian 32 bit float.
 * @param {number} f32
 * @returns {!util.BufferQueue}
 */
BufferQueue.prototype.writeFloatLE = function(f32) {
    return this._writeFloat(f32, true, 23, 4);
};

/**
 * Writes a little endian 64 bit double.
 * @param {number} f64
 * @returns {!util.BufferQueue}
 */
BufferQueue.prototype.writeDoubleLE = function(f64) {
    return this._writeFloat(f64, true, 52, 8);
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

/**
 * Writes a null terminated UTF8 encoded string.
 * @param {string} str
 * @returns {!util.BufferQueue}
 */
BufferQueue.prototype.writeCString = function(str) {
    var buf = new Buffer(str, "utf8");
    for (var i=0; i<buf.length; ++i)
        this.writeUInt8(buf[i]);
    return this.writeUInt8(0);
};

/**
 * Concatenates written data to a single buffer.
 * @returns {!Buffer}
 */
BufferQueue.prototype.toBuffer = function() {
    var buffers = [];
    for (var i=0; i<this.bufferIndex; ++i)
        buffers.push(this.buffers[i]);
    if (this.bufferIndex < this.buffers.length)
        buffers.push(this.buffers[this.bufferIndex].slice(0, this.bufferOffset));
    return Buffer.concat(buffers);
};

BufferQueue.prototype.inspect = function() {
    var sb = [];
    sb.push("BufferQueue\n-----------\n");
    sb.push("Buffers: ", this.buffers.length.toString(10), "\n");
    sb.push("Buffer index: ", this.bufferIndex.toString(10), "\n");
    sb.push("Buffer offset: ", this.bufferOffset.toString(10), "\n");
    sb.push("Marked buffer index: ", this.markedBufferIndex.toString(10), "\n");
    sb.push("Marked buffer offset: ", this.markedBufferOffset.toString(10), "\n");
    return sb.join("");
};