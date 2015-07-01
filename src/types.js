/**
 * Type and opcode definitions.
 * @namespace
 * @exports types
 */
var types = module.exports = {};

/**
 * Swaps an object's keys and values, returning an array that may contain undefined elements.
 * @param {!Object} obj
 * @returns {!Array}
 * @inner
 */
function swap(obj) {
    var swp = [];
    Object.keys(obj).forEach(function(key) {
        swp[obj[key]] = key;
    });
    return swp;
}

types.MagicNumber = 0x6d736177; // "wasm" LE

// ----- imm encoding constants -----

types.ImmFlag = 0x80;
types.OpWithImmBits = 2;
types.OpWithImmLimit = 1 << types.OpWithImmBits; // 4
types.OpWithImmMax = types.OpWithImmLimit-1; // 0x3
types.ImmBits = 5;
types.ImmLimit = 1 << types.ImmBits; // 32
types.ImmMax = types.ImmLimit - 1; // 0x1F

// ----- statements and expressions -----

types.Stmt = {
    SetLoc: 0,
    SetGlo: 1,
    I32Store8: 2,
    I32StoreOff8: 3,
    I32Store16: 4,
    I32StoreOff16: 5,
    I32Store32: 6,
    I32StoreOff32: 7,
    F32Store: 8,
    F32StoreOff: 9,
    F64Store: 10,
    F64StoreOff: 11,
    CallInt: 12,
    CallInd: 13,
    CallImp: 14,
    Ret: 15,
    Block: 16,
    IfThen: 17,
    IfElse: 18,
    While: 19,
    Do: 20,
    Label: 21,
    Break: 22,
    BreakLabel: 23,
    Continue: 24,
    ContinueLabel: 25,
    Switch: 26
};

types.StmtNames = swap(types.Stmt);

types.StmtWithImm = {
    SetLoc: 0,
    SetGlo: 1,
    Reserved1: 2,
    Reserved2: 3
};

types.StmtWithImmNames = swap(types.StmtWithImm);

types.SwitchCase = {
    Case0: 0,
    Case1: 1,
    CaseN: 2,
    Default0: 3,
    Default1: 4,
    DefaultN: 5
};

types.SwitchCaseNames = swap(types.SwitchCase);

types.I32 = {
    LitPool: 0,
    LitImm: 1,
    GetLoc: 2,
    GetGlo: 3,
    SetLoc: 4,
    SetGlo: 5,
    SLoad8: 6,
    SLoadOff8: 7,
    ULoad8: 8,
    ULoadOff8: 9,
    SLoad16: 10,
    SLoadOff16: 11,
    ULoad16: 12,
    ULoadOff16: 13,
    Load32: 14,
    LoadOff32: 15,
    Store8: 16,
    StoreOff8: 17,
    Store16: 18,
    StoreOff16: 19,
    Store32: 20,
    StoreOff32: 21,
    CallInt: 22,
    CallInd: 23,
    CallImp: 24,
    Cond: 25,
    Comma: 26,
    FromF32: 27,
    FromF64: 28,
    Neg: 29,
    Add: 30,
    Sub: 31,
    Mul: 32,
    SDiv: 33,
    UDiv: 34,
    SMod: 35,
    UMod: 36,
    BitNot: 37,
    BitOr: 38,
    BitAnd: 39,
    BitXor: 40,
    Lsh: 41,
    ArithRsh: 42,
    LogicRsh: 43,
    Clz: 44,
    LogicNot: 45,
    EqI32: 46,
    EqF32: 47,
    EqF64: 48,
    NEqI32: 49,
    NEqF32: 50,
    NEqF64: 51,
    SLeThI32: 52,
    ULeThI32: 53,
    LeThF32: 54,
    LeThF64: 55,
    SLeEqI32: 56,
    ULeEqI32: 57,
    LeEqF32: 58,
    LeEqF64: 59,
    SGrThI32: 60,
    UGrThI32: 61,
    GrThF32: 62,
    GrThF64: 63,
    SGrEqI32: 64,
    UGrEqI32: 65,
    GrEqF32: 66,
    GrEqF64: 67,
    SMin: 68,
    UMin: 69,
    SMax: 70,
    UMax: 71,
    Abs: 72
};

types.I32Names = swap(types.I32);

types.I32WithImm = {
    LitPool: 0,
    LitImm: 1,
    GetLoc: 2,
    Reserved: 3
};

types.I32WithImmNames = swap(types.I32WithImm);

types.F32 = {
    LitPool: 0,
    LitImm: 1,
    GetLoc: 2,
    GetGlo: 3,
    SetLoc: 4,
    SetGlo: 5,
    Load: 6,
    LoadOff: 7,
    Store: 8,
    StoreOff: 9,
    CallInt: 10,
    CallInd: 11,
    Cond: 12,
    Comma: 13,
    FromS32: 14,
    FromU32: 15,
    FromF64: 16,
    Neg: 17,
    Add: 18,
    Sub: 19,
    Mul: 20,
    Div: 21,
    Abs: 22,
    Ceil: 23,
    Floor: 24,
    Sqrt: 25
};

types.F32Names = swap(types.F32);

types.F32WithImm = {
    LitPool: 0,
    GetLoc: 1,
    Reserved0: 2,
    Reserved1: 3
};

types.F32WithImmNames = swap(types.F32WithImm);

types.F64 = {
    LitPool: 0,
    LitImm: 1,
    GetLoc: 2,
    GetGlo: 3,
    SetLoc: 4,
    SetGlo: 5,
    Load: 6,
    LoadOff: 7,
    Store: 8,
    StoreOff: 9,
    CallInt: 10,
    CallInd: 11,
    CallImp: 12,
    Cond: 13,
    Comma: 14,
    FromS32: 15,
    FromU32: 16,
    FromF32: 17,
    Neg: 18,
    Add: 19,
    Sub: 20,
    Mul: 21,
    Div: 22,
    Mod: 23,
    Min: 24,
    Max: 25,
    Abs: 26,
    Ceil: 27,
    Floor: 28,
    Sqrt: 29,
    Cos: 30,
    Sin: 31,
    Tan: 32,
    ACos: 33,
    ASin: 34,
    ATan: 35,
    ATan2: 36,
    Exp: 37,
    Ln: 38,
    Pow: 39
};

types.F64Names = swap(types.F64);

types.F64WithImm = {
    LitPool: 0,
    GetLoc: 1,
    Reserved0: 2,
    Reserved1: 3
};

types.F64WithImmNames = swap(types.F64WithImm);

types.Void = {
    CallInt: 0,
    CallInd: 1,
    CallImp: 2
};

types.VoidNames = swap(types.Void);

// ----- types -----

types.Type = {
    I32: 0,
    F32: 1,
    F64: 2
};

types.TypeNames = swap(types.Type);

types.isValidType = function(type) {
    return type === 0 || type === 1 || type === 2;
};

types.VarType = {
    I32: 0x1,
    F32: 0x2,
    F64: 0x4
};

types.VarTypeNames = swap(types.VarType);

types.VarTypeWithImm = {
    OnlyI32: 0,
    Reserved0: 1,
    Reserved1: 2,
    Reserved2: 3
};

types.VarTypeWithImmNames = swap(types.VarTypeWithImm);

types.RType = {
    I32: types.Type.I32,
    F32: types.Type.F32,
    F64: types.Type.F64,
    Void: 3
};

types.RTypeNames = swap(types.RType);

types.isValidRType = function(type) {
    return type === 0 || type === 1 || type === 2 || type === 3;
};

types.ExportFormat = {
    Default: 0,
    Record: 1
};

types.ExportFormatNames = swap(types.ExportFormat);

// ----- platform specific standard library -----

types.HotStdLib = [
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

types.StdLib = [
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

// ----- operation precedence (yet unused) -----

types.Prec = {
    Lowest: 0,
    Comma: 2,
    Assign: 4,
    Cond: 6,
    BitOr: 8,
    BitXor: 10,
    BitAnd: 12,
    Eq: 14,
    Comp: 16,
    Shifts: 18,
    AddSub: 20,
    MulDivMod: 22,
    Unary: 24,
    Call: 26,
    Index: 28,
    Highest: 30
};

types.PrecNames = swap(types.Prec);

// ----- operation context (yet unused) -----

types.Ctx = {
    Default: 0,
    AddSub: 1,
    ToI32: 2,
    FRound: 3,
    ToNumber: 4
};

types.CtxNames = swap(types.Ctx);
