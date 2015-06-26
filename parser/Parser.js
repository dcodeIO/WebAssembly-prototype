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
var stream = require("stream");

// Special exception indicating that more bytes are required to process further
var E_MORE = Error("not enough bytes");

// Identifier characters
var IdenChars = [
	'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
	'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
	'_', '$',
	'0','1','2','3','4','5','6','7','8','9'
];
var FirstCharRange = 26*2+2;
var FirstCharRangeMinusDollar = 26*2+1;
var NextCharRange = IdenChars.length;

var HotStdLib = [
	"HeapS8",
	"HeapU8",
	"HeapS16",
	"HeapU16",
	"HeapS32",
	"HeapU32",
	"HeapF32",
	"HeapF64",
	"IMul",
	"FRound"
];

var StdLib = [
	"stdlib",
	"foreign",
	"buffer",
	"acos",
	"asin",
	"atan",
	"cos",
	"sin",
	"tan",
	"exp",
	"log",
	"ceil",
	"floor",
	"sqrt",
	"abs",
	"min",
	"max",
	"atan2",
	"pow",
	"clz32",
	"NaN",
	"Infinity"
];

function indexed_name(i) {
	return "NOT_IMPLEMENTED_"+i;
}

/**
 * A streaming WebAssembly parser.
 */
var Parser = function(options) {
	stream.Transform.call(this, options);

	/**
     * Current parser state.
     * @type {number}
     * @see Parser.STATE
     */
	this.state = Parser.STATE.HEADER;

	/**
	 * Parsing buffer.
	 * @type {Buffer}
	 */
	this.buffer = null;

	/**
	 * Parsing offset.
	 * @type {number}
	 */
	this.offset = 0;

	/**
	 * 32bit integer constants.
	 * @type {Array.<number>}
	 */
	this.constantsI32 = null;

	/**
	 * 32bit float constants.
	 * @type {Array.<number>}
	 */
	this.constantsF32 = null;

	/**
	 * 64bit float constants.
	 * @type {Array.<number>}
	 */
	this.constantsF64 = null;

	/**
	 * Function signatures.
	 * @type {Array<!{rtype: number, args: !Array.<number>}>}
	 */
	this.signatures = null;

	/**
	 * Function imports.
	 * @type {Array<!{name: string, fname: string, sigs: Array}>}
	 */
	this.functionImports = null;

	/**
	 * Global variables.
	 * @type {Array<!{type: number, fname: ?string}>}
	 */
	this.globalVars = null;

    /**
     * Function declarations.
     * @type {Array.<number>}
     */
    this.functionDeclarations = null;

    /**
     * Function pointers.
     * @type {Array.<!{sig: number, elems: Array.<number>}>}
     */
    this.functionPointers = null;
};

// Extends stream.Transform
Parser.prototype = Object.create(stream.Transform.prototype);

/**
 * Parser states.
 * @type {!Object.<string,number>}
 * @const
 */
Parser.STATE = {
	HEADER: 0,
	CONSTANTS_COUNT: 1,
	CONSTANTS_I32: 2,
	CONSTANTS_F32: 3,
	CONSTANTS_F64: 4,
	SIGNATURES_COUNT: 5,
	SIGNATURES: 6,
	FUNCTION_IMPORTS_COUNT: 7,
	FUNCTION_IMPORTS: 8,
	GLOBAL_VARS_COUNT: 9,
	GLOBAL_VARS: 10,
    FUNCTION_DECLARATIONS_COUNT: 11,
    FUNCTION_DECLARATIONS: 12,
    FUNCTION_POINTERS_COUNT: 13,
    FUNCTION_POINTERS: 14
};

Parser.TYPES = {
    I32: 0,
    F32: 1,
    F64: 2
};

Parser.prototype._transform = function(chunk, encoding, callback) {
	if (encoding)
		chunk = new Buffer(chunk, encoding);
	this.buffer = this.buffer === null ? chunk : Buffer.concat([this.buffer, chunk]);
	do {
		var initialState = this.state;
		try {
			switch (this.state) {
				case Parser.STATE.HEADER:
					this._readHeader();
					break;
				case Parser.STATE.CONSTANTS_COUNT:
					this._readConstantsCount();
					break;
				case Parser.STATE.CONSTANTS_I32:
					this._readConstantsI32();
					break;
				case Parser.STATE.CONSTANTS_F32:
					this._readConstantsF32();
					break;
				case Parser.STATE.CONSTANTS_F64:
					this._readConstantsF64();
					break;
				case Parser.STATE.SIGNATURES_COUNT:
					this._readSignaturesCount();
					break;
				case Parser.STATE.SIGNATURES:
					this._readSignatures();
					break;
				case Parser.STATE.FUNCTION_IMPORTS_COUNT:
					this._readFunctionImportsCount();
					break;
				case Parser.STATE.FUNCTION_IMPORTS:
					this._readFunctionImports();
					break;
				case Parser.STATE.GLOBAL_VARS_COUNT:
					this._readGlobalVarsCount();
					break;
				case Parser.STATE.GLOBAL_VARS:
					this._readGlobalVars();
					break;
                case Parser.STATE.FUNCTION_DECLARATIONS_COUNT:
                    this._readFunctionDeclarationsCount();
                    break;
                case Parser.STATE.FUNCTION_DECLARATIONS:
                    this._readFunctionDeclarations();
                    break;
                case Parser.STATE.FUNCTION_POINTERS_COUNT:
                    this._readFunctionPointersCount();
                    break;
                case Parser.STATE.FUNCTION_POINTERS:
                    this._readFunctionPointers();
                    break;
				default:
					throw Error("illegal state: "+this.state);
			}
		} catch (err) {
			if (err === E_MORE) {
				callback();
				return;
			}
			throw err;
		}
		if (this.state !== initialState)
            this.emit("switchState", initialState, this.state, this.offset);
	} while (true);
};

Parser.prototype._advance = function(nBytes) {
    this.buffer = this.buffer.slice(nBytes);
    this.offset += nBytes;
};

Parser.prototype._readVarint = function(offset) {
	if (offset >= this.buffer.length)
		throw E_MORE;
	var u32 = this.buffer[offset++];
	if (u32 < 0x80)
		return [u32, 1];
	u32 &= 0x7f;
	var c = 1;
	for (var shift = 7; true; shift += 7) {
		if (offset >= this.buffer.length)
			throw E_MORE;
		++c;
		var b = this.buffer[offset++];
		if (b < 0x80)
			return [(u32 | (b << shift)) >>> 0, c];
		u32 |= (b & 0x7f) << shift;
	}
};

Parser.prototype._readCString = function(offset) {
	var buf = [];
	while (offset < this.buffer.length) {
		var c = this.buffer[offset++];
		if (c === 0)
			return [String.fromCharCode.apply(String, buf), buf.length+1];
		buf.push(c); // TODO: Is this always ASCII?
	}
	throw E_MORE;
};

Parser.prototype._readHeader = function() {
	if (this.buffer.length < 8)
		throw E_MORE;
	var off = 0;
	var magic = this.buffer.readUInt32LE(off); off += 4;
	if (magic !== 0x6d736177)
		throw Error("wrong magic number");
	var size = this.buffer.readUInt32LE(off); off += 4;
    this._advance(off);
	this.emit("header", size);
	this.state = Parser.STATE.CONSTANTS_COUNT;
};

Parser.prototype._readConstantsCount = function() {
	var off = 0, vi;
	vi = this._readVarint(off); off += vi[1];
	var nI32 = vi[0];
	vi = this._readVarint(off); off += vi[1];
	var nF32 = vi[0];
	vi = this._readVarint(off); off += vi[1];
	var nF64 = vi[0];
    this._advance(off);
	this.constantsI32 = new Array(nI32);
	this.constantsI32.offset = 0;
	this.constantsF32 = new Array(nF32);
	this.constantsF32.offset = 0;
	this.constantsF64 = new Array(nF64);
	this.constantsF64.offset = 0;
	this.emit("constantsCount", nI32, nF32, nF64);
	this.state = Parser.STATE.CONSTANTS_I32;
};

Parser.prototype._readConstantsI32 = function() {
	while (this.constantsI32.offset < this.constantsI32.length) {
		var vi = this._readVarint(0);
		this.constantsI32[this.constantsI32.offset++] = vi[0];
        this._advance(vi[1]);
	}
    delete this.constantsI32.offset;
	this.state = Parser.STATE.CONSTANTS_F32;
};

Parser.prototype._readConstantsF32 = function() {
	while (this.constantsF32.offset < this.constantsF32.length) {
		if (this.buffer.length < 4)
			throw E_MORE;
		this.constantsF32[this.constantsF32.offset++] = this.buffer.readFloatLE(0)
        this._advance(4);
	}
    delete this.constantsF32.offset;
	this.state = Parser.STATE.CONSTANTS_F64;
};

Parser.prototype._readConstantsF64 = function() {
	while (this.constantsF64.offset < this.constantsF64.length) {
		if (this.buffer.length < 8)
			throw E_MORE;
		this.constantsF64[this.constantsF64.offset++] = this.buffer.readDoubleLE(0);
        this._advance(8);
	}
    delete this.constantsF64.offset;
	this.emit("constants", this.constantsI32, this.constantsF32, this.constantsF64);
	this.state = Parser.STATE.SIGNATURES_COUNT;
};

Parser.prototype._readSignaturesCount = function() {
	var off = 0;
	var vi = this._readVarint(off); off += vi[1];
	var nSigs = vi[0];
    this._advance(off);
	this.signatures = new Array(nSigs);
	this.signatures.offset = 0;
	this.emit("signaturesCount", nSigs);
	this.state = Parser.STATE.SIGNATURES;
};

Parser.prototype._readSignatures = function() {
	while (this.signatures.offset < this.signatures.length) {
		if (this.buffer.length < 2) // RTYPE+VARINT
			throw E_MORE;
		var off = 0;
		var rtype = this.buffer.readUInt8(off++);
		var vi = this._readVarint(off); off += vi[1];
		var nArgs = vi[0];
		if (this.buffer.length < off + nArgs)
			throw E_MORE;
		var args = new Array(nArgs);
		for (var i=0; i<nArgs; ++i)
			args[i] = this.buffer.readUInt8(off++);
		this.signatures[this.signatures.offset++] = {
			rtype: rtype,
			args: args
		};
        this._advance(off);
	}
    delete this.signatures.offset;
	this.emit("signatures", this.signatures);
	this.state = Parser.STATE.FUNCTION_IMPORTS_COUNT;
};

Parser.prototype._readFunctionImportsCount = function() {
	var off = 0, vi;
	vi = this._readVarint(off); off += vi[1];
	var nFunctionImports = vi[0];
	vi = this._readVarint(off); off += vi[1];
	var nSigs = vi[0];
    this._advance(off);
	this.functionImports = new Array(nFunctionImports);
	this.functionImports.sigs = nSigs;
	this.functionImports.offset = 0;
	this.emit("functionImportsCount", nFunctionImports, nSigs);
	this.state = Parser.STATE.FUNCTION_IMPORTS;
};

Parser.prototype._readFunctionImports = function() {
	while (this.functionImports.offset < this.functionImports.length) {
		var off = 0;
		var cs = this._readCString(off); off += cs[1];
		var fname = cs[0];
		var vi = this._readVarint(off); off += vi[1];
		var nSigs = vi[0];
		var sigs = new Array(nSigs);
		for (var i=0; i<nSigs; ++i) {
			vi = this._readVarint(off); off += vi[1];
			if (vi[0] >= this.signatures.length)
				throw Error("illegal signature reference: "+vi[0]);
			sigs[i] = vi[0];
		}
        this._advance(off);
		this.functionImports[this.functionImports.offset++] = {
			name: "TODO",
			fname: fname,
			sigs: sigs
		};
	}
    delete this.functionImports.offset;
	this.emit("functionImports", this.functionImports);
	this.state = Parser.STATE.GLOBAL_VARS_COUNT;
};

Parser.prototype._readGlobalVarsCount = function() {
	var off = 0, vi;
	vi = this._readVarint(off); off += vi[1];
	var nI32Zero = vi[0];
	vi = this._readVarint(off); off += vi[1];
	var nF32Zero = vi[0];
	vi = this._readVarint(off); off += vi[1];
	var nF64Zero = vi[0];
	vi = this._readVarint(off); off += vi[1];
	var nI32Import = vi[0];
	vi = this._readVarint(off); off += vi[1];
	var nF32Import = vi[0];
	vi = this._readVarint(off); off += vi[1];
	var nF64Import = vi[0];
	var total = nI32Zero + nF32Zero + nF64Zero + nI32Import + nF32Import + nF64Import;
    this._advance(off);
	this.globalVars = new Array(total);
	this.globalVars.offset = 0;
    this.globalVars.rangeI32 = nI32Zero + nF32Zero + nF64Zero + nI32Import;
    this.globalVars.rangeF32 = this.globalVars.rangeI32 + nF32Import;
    for (var i=0; i<nI32Zero; ++i) {
        this.globalVars[this.globalVars.offset++] = {
            type: "I32",
            fname: null
        };
    }
    for (i=0; i<nF32Zero; ++i) {
        this.globalVars[this.globalVars.offset++] = {
            type: "F32",
            fname: null
        };
    }
    for (i=0; i<nF64Zero; ++i) {
        this.globalVars[this.globalVars.offset++] = {
            type: "F64",
            fname: null
        };
    }
	this.emit("globalVarsCount", nI32Zero, nF32Zero, nF64Zero, nI32Import, nF32Import, nF64Import);
	this.state = Parser.STATE.GLOBAL_VARS;
};

Parser.prototype._readGlobalVars = function() {
	while (this.globalVars.offset < this.globalVars.length) {
        var off = 0;
        var cs = this._readCString(off);
        var fname = cs[0];
        this._advance(cs[1]);
        var type = this.globalVars.offset < this.globalVars.rangeI32 ? Parser.TYPES.I32
                 : this.globalVars.offset < this.globalVars.rangeF32 ? Parser.TYPES.F32
                 : Parser.TYPES.F64;
        this.globalVars[this.globalVars.offset++] = {
            type: type,
            fname: fname
        };
    }
    delete this.globalVars.offset;
    delete this.globalVars.rangeI32;
    delete this.globalVars.rangeF32;
    this.emit("globalVars", this.globalVars);
    this.state = Parser.STATE.FUNCTION_DECLARATIONS_COUNT;
};

Parser.prototype._readFunctionDeclarationsCount = function() {
    var off = 0;
    var vi = this._readVarint(off); off += vi[1];
    var nFunctionDeclarations = vi[0];
    this._advance(off);
    this.functionDeclarations = new Array(nFunctionDeclarations);
    this.functionDeclarations.offset = 0;
    this.emit("functionDeclarationsCount", nFunctionDeclarations);
    this.state = Parser.STATE.FUNCTION_DECLARATIONS;
};

Parser.prototype._readFunctionDeclarations = function() {
    while (this.functionDeclarations.offset < this.functionDeclarations.length) {
        var off = 0;
        var vi = this._readVarint(off); off += vi[1];
        this._advance(off);
        this.functionDeclarations[this.functionDeclarations.offset++] = vi[0];
    }
    delete this.functionDeclarations.offset;
    this.emit("functionDeclarations", this.functionDeclarations);
    this.state = Parser.STATE.FUNCTION_POINTERS_COUNT;
};

Parser.prototype._readFunctionPointersCount = function() {
    var off = 0;
    var vi = this._readVarint(off); off += vi[1];
    var nFunctionPointers = vi[0];
    this._advance(off);
    this.functionPointers = new Array(nFunctionPointers);
    this.functionPointers.offset = 0;
    this.emit("functionPointersCount", nFunctionPointers);
    this.state = Parser.STATE.FUNCTION_POINTERS;
};

Parser.prototype._readFunctionPointers = function() {
    while (this.functionPointers.offset < this.functionPointers.length) {
        var off = 0;
        var vi = this._readVarint(off); off += vi[1];
        var sig = vi[0];
        if (sig > this.signatures.length)
            throw Error("illegal signature reference: "+sig);
        vi = this._readVarint(off); off += vi[1];
        var nElems = vi[0];
        var elems = new Array(nElems);
        for (var i=0; i<nElems; ++i) {
            vi = this._readVarint(off); off += vi[1];
            elems[i] = vi[0];
        }
        this._advance(off);
        this.functionPointers[this.functionPointers.offset++] = {
            sig: sig,
            elems: elems
        };
    }
    delete this.functionPointers.offset;
    this.emit("functionPointers", this.functionPointers);
    this.state++;
};

// #################################################################
// Just firing up a parser from a proper WebAssembly binary for now:

var parser = new Parser();

parser.on("switchState", function(prevState, newState, offset) {
    console.log("switch state "+prevState+"->"+newState+" @ "+offset.toString(16));
});

parser.on("header", function(size) {
	console.log("Unpacked size: "+size);
});

parser.on("constants", function(I32, F32, F64) {
	console.log("Constants: "+I32.length+"xI32, "+F32.length+"xF32, "+F64.length+"xF64");
});

parser.on("signatures", function(signatures) {
	console.log("Signatures: "+signatures.length);
});

parser.on("functionImports", function(functionImports) {
	console.log("Function imports: "+functionImports.length);
});

parser.on("globalVars", function(globalVars) {
    console.log("Global vars: "+globalVars.length);
});

parser.on("functionDeclarations", function(functionDeclarations) {
    console.log("Function declarations: "+functionDeclarations.length);
});

parser.on("functionPointers", function(functionPointers) {
    console.log("Function pointers: "+functionPointers.length);
});

require("fs").createReadStream("../tests/AngryBots.wasm").pipe(parser);
