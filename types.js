var util = require("./util");

var Types = module.exports = {};

// Types for syntax tree nodes.
Types.AstType = {
	Stmt    : 0, // a statement node
	Int32   : 1, // expression that produces an int32 value
	Float32 : 2, // expression that produces a float32 value
	Float64 : 3  // expression that produces a float64 value
};

// Type names for syntax tree nodes.
Types.AstTypeNames = util.invert(Types.AstType);

// Types for heap accesses and globals.
Types.MemType = {
	Int8    : 0,
	Uint8   : 1,
	Int16   : 2,
	Uint16  : 3,
	Int32   : 4,
	Uint32  : 5,
	Float32 : 6,
	Float64 : 7
};

// Type names for heap accesses and globals.
Types.MemTypeNames = util.invert(Types.MemType);

// Atomicity annotations for access to the heap and globals.
Types.Atomicity = {
	None       : 0, // non-atomic
	Sequential : 1, // sequential consistency
	Acquire    : 2, // acquire semantics
	Release    : 3  // release semantics
};

// Type names of atomicity annotations for access to the heap and globals.
Types.AtomicityNames = util.invert(Types.Atomicity);
