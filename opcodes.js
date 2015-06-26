var util = require("./util");

var OpCodes = module.exports = {};

OpCodes.STMT = {
	Nop       : 0x00,
	SetLocal  : 0x01,
	SetGlobal : 0x02,
	SetHeap   : 0x03,
	If        : 0x04,
	IfThen    : 0x05,
	Block     : 0x06,
	Switch    : 0x07,
	SwitchNf  : 0x08,
	Loop      : 0x09,
	Continue  : 0x0a,
	Break     : 0x0b,
	Return    : 0x0c
};

OpCodes.EXPR_MISC = {
	Int8Const    : 0x10,
	Int32Const   : 0x11,
	Float64Const : 0x12,
	Float32Const : 0x13,
	GetLocal     : 0x14,
	GetGlobal    : 0x15,
	GetHeap      : 0x16,
	CallFunction : 0x17,
	CallIndirect : 0x18,
	Ternary      : 0x19,
	Comma        : 0x1a,
	BoolNot      : 0x1b
};

// Integer binops.
OpCodes.I_II = {
	Int32Add  : 0x20,
	Int32Sub  : 0x21,
    Int32Mul  : 0x22,
    Int32SDiv : 0x23,
    Int32UDiv : 0x24,
    Int32SMod : 0x25,
    Int32UMod : 0x26,
    Int32And  : 0x27,
    Int32Ior  : 0x28,
    Int32Xor  : 0x29,
    Int32Shl  : 0x2a,
    Int32Shr  : 0x2b,
    Int32Sar  : 0x2c,
    Int32Eq   : 0x2d,
    Int32Slt  : 0x2e,
    Int32Sle  : 0x2f,
    Int32Ult  : 0x30,
    Int32Ule  : 0x31
};

// Float64 binops that produce float64.
OpCodes.D_DD = {
	Float64Add : 0x40,
 	Float64Sub : 0x41,
 	Float64Mul : 0x42,
 	Float64Div : 0x43,
 	Float64Mod : 0x44
};

// Float64 binops that produce int32.
OpCodes.I_DD = {
	Float64Eq : 0x45,
	Float64Lt : 0x46,
	Float64Le : 0x47
};

// Float32 binops that produce float32.
OpCodes.F_FF = {
 	Float32Add : 0x50,
 	Float32Sub : 0x51,
	Float32Mul : 0x52,
	Float32Div : 0x53,
	Float32Mod : 0x54
};

// Float32 binops that produce int32.
OpCodes.I_FF = {
	Float32Eq : 0x55,
	Float32Lt : 0x56,
	Float32Le : 0x57
};

// Conversions between primitive types.
OpCodes.CONVERSION = {
	Int32FromFloat32   : 0x60,
	Int32FromFloat64   : 0x61,
	Uint32FromFloat32  : 0x62,
	Uint32FromFloat64  : 0x63,
	Float64FromSInt32  : 0x64,
	Float64FromUInt32  : 0x65,
	Float64FromFloat32 : 0x66,
	Float32FromSInt32  : 0x67,
	Float32FromUInt32  : 0x68,
	Float32FromFloat64 : 0x69
};

// Expression OpCodes.
util.combine(
	OpCodes.EXPR = {},
	OpCodes.EXPR_MISC,
	OpCodes.I_II,
	OpCodes.D_DD,
	OpCodes.I_DD,
	OpCodes.F_FF,
	OpCodes.I_FF,
	OpCodes.CONVERSION
);

// All OpCodes.
util.combine(
	OpCodes.ALL = {},
	OpCodes.STMT,
	OpCodes.EXPR
);

// All opcode names.
OpCodes.NAMES = util.invert(OpCodes.ALL);
