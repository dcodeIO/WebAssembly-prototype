/**
 * Type and opcode definitions.
 * @namespace
 * @exports types
 */
var types = module.exports;

/**
 * Swaps an object's keys and values, returning an array that may contain undefined elements if the object is an object
 *  respectively an object if the object is an array.
 * @param {!Object.<string,number>|!Array.<number|undefined>} obj
 * @returns {!Array.<string|undefined>|!Object.<string,number>}
 * @inner
 */
function swap(obj) {
    var swp;
    if (Array.isArray(obj)) {
        swp = {};
        obj.forEach(function(value, i) {
            swp[value] = i;
        });
    } else {
        swp = [];
        Object.keys(obj).forEach(function (key) {
            swp[obj[key]] = key;
        });
        return swp;
    }
    return swp;
}

/**
 * Creates a map with integer keys.
 * @param {!Array.<number>} keys
 * @param {!Array.<*>} values
 * @returns {!Array.<*>}
 * @inner
 */
function imap(keys, values) {
    var map = [];
    for (var i=0; i<keys.length; ++i)
        map[keys[i]] = values[i];
    return map;
}

/**
 * Inverts an array.
 * @param {!Array.<number|undefined>} arr
 * @returns {!Array.<number|undefined>}
 * @inner
 */
function inv(arr) {
    var inv = [];
    arr.forEach(function(value, index) {
        if (typeof value !== 'undefined')
            inv[value] = index;
    });
    return inv;
}

/**
 * Magic number identifying a WASM binary.
 * @type {number}
 */
types.MagicNumber = 0x6d736177; // "wasm" LE

// ----- opcode with imm encoding -----

/**
 * Opcode with imm flag.
 * @type {number}
 */
types.OpWithImm_Flag = 0x80;

/**
 * Number of opcode bits in an opcode with imm.
 * @type {number}
 */
types.OpWithImm_OpBits = 2;

var OpWithImm_OpLimit = 1 << types.OpWithImm_OpBits; // 4

/**
 * Maximum opcode value in an opcode with imm.
 * @type {number}
 */
types.OpWithImm_OpMax = OpWithImm_OpLimit-1; // 0x3

/**
 * Number of imm bits in an opcode with imm.
 * @type {number}
 */
types.OpWithImm_ImmBits = 5;

var OpWithImm_ImmLimit = 1 << types.OpWithImm_ImmBits; // 32

/**
 * Maximum imm value in an opcode with imm.
 * @type {number}
 */
types.OpWithImm_ImmMax = OpWithImm_ImmLimit - 1; // 0x1F

// ----- types -----

/**
 * Basic types.
 * @type {!Object.<string,number>}
 */
types.Type = {
    I32: 0,
    F32: 1,
    F64: 2
};

/**
 * Basic type names.
 * @type {!Array.<string>}
 */
types.TypeNames = swap(types.Type);

/**
 * Maximum basic type.
 * @type {number}
 */
types.TypeMax = Math.max(types.Type.I32, types.Type.F32, types.Type.F64);

/**
 * Tests if the specified type is a valid basic type.
 * @param {number} type
 * @returns {boolean}
 */
types.isValidType = function(type) {
    return type === 0 || type === 1 || type === 2;
};

/**
 * Function definition variable type flags.
 * @type {!Object.<string,number>}
 */
types.VarType = {
    I32: 0x1,
    F32: 0x2,
    F64: 0x4
};

/**
 * Function definition variable type flag names.
 * @type {!Array.<string|undefined>}
 */
types.VarTypeNames = swap(types.VarType);

/**
 * Function definition variable types with imm.
 * @type {!Object.<string,number>}
 */
types.VarTypeWithImm = {
    OnlyI32: 0
    // Reserved0: 1,
    // Reserved1: 2,
    // Reserved2: 3
};

/**
 * Function definition variable type with imm names.
 * @type {!Array.<string>}
 */
types.VarTypeWithImmNames = swap(types.VarTypeWithImm);

/**
 * Return types.
 * @type {!Object.<string,number>}
 */
types.RType = {
    I32: types.Type.I32,
    F32: types.Type.F32,
    F64: types.Type.F64,
    Void: types.TypeMax + 1
};

/**
 * Return type names.
 * @type {!Array.<string>}
 */
types.RTypeNames = swap(types.RType);

/**
 * Maximum return type.
 * @type {number}
 */
types.RTypeMax = types.TypeMax + 1;

/**
 * Tests if the specified type is a valid return type.
 * @param {number} type
 * @returns {boolean}
 */
types.isValidRType = function(type) {
    return type === 0 || type === 1 || type === 2 || type === 3;
};

/**
 * Export formats.
 * @type {!Object.<string,number>}
 */
types.ExportFormat = {
    Default: 0,
    Record: 1
};

/**
 * Export format names.
 * @type {!Array.<string>}
 */
types.ExportFormatNames = swap(types.ExportFormat);

// ----- wire types -----

/**
 * Wire types. Custom to this library.
 * @type {!Object.<string,number>}
 */
types.WireType = {
    ExprI32: types.RType.I32,
    ExprF32: types.RType.F32,
    ExprF64: types.RType.F64,
    ExprVoid: types.RType.Void,
    SwitchCase: types.RTypeMax + 1,
    Stmt: types.RTypeMax + 2,
    StmtList: types.RTypeMax + 3
};

/**
 * Wire type names. Custom to this library.
 * @type {!Array.<string>}
 */
types.WireTypeNames = swap(types.WireType);

/**
 * Maximum wire type.
 * @type {number}
 */
types.WireTypeMax = types.RTypeMax + 3;

// ----- statements and expressions -----

/**
 * Statement opcodes.
 * @type {!Object.<string,number>}
 */
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

/**
 * Statement opcode names.
 * @type {!Array.<string>}
 */
types.StmtNames = swap(types.Stmt);

/**
 * Statement with imm opcodes.
 * @type {!Object.<string,number>}
 */
types.StmtWithImm = {
    SetLoc: 0,
    SetGlo: 1
    // Reserved1: 2,
    // Reserved2: 3
};

/**
 * Statement with imm opcode names.
 * @type {!Array.<string>}
 */
types.StmtWithImmNames = swap(types.StmtWithImm);

/**
 * A map from statement opcodes to their statement with imm opcode counterpart.
 * @type {!Array.<number|undefined>}
 */
types.StmtToStmtWithImm = imap([
    types.Stmt.SetLoc,
    types.Stmt.SetGlo
], [
    types.StmtWithImm.SetLoc,
    types.StmtWithImm.SetGlo
]);

/**
 * A map from statement with imm opcodes to their statement opcode counterpart.
 * @type {!Array.<number|undefined>}
 */
types.StmtWithImmToStmt = imap([
    types.StmtWithImm.SetLoc,
    types.StmtWithImm.SetGlo
], [
    types.Stmt.SetLoc,
    types.Stmt.SetGlo
]);

/**
 * Switch case opcodes.
 * @type {!Object.<string,number>}
 */
types.SwitchCase = {
    Case0: 0,
    Case1: 1,
    CaseN: 2,
    Default0: 3,
    Default1: 4,
    DefaultN: 5
};

/**
 * Switch case opcode names.
 * @type {!Array.<string>}
 */
types.SwitchCaseNames = swap(types.SwitchCase);

/**
 * I32 expression opcodes.
 * @type {!Object.<string,number>}
 */
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

/**
 * I32 expression opcode names.
 * @type {!Array.<string>}
 */
types.I32Names = swap(types.I32);

/**
 * I32 expression with imm opcodes.
 * @type {!Object.<string,number>}
 */
types.I32WithImm = {
    LitPool: 0,
    LitImm: 1,
    GetLoc: 2
    // Reserved: 3
};

/**
 * I32 expression with imm opcode names.
 * @type {!Array.<string>}
 */
types.I32WithImmNames = swap(types.I32WithImm);

/**
 * A map of I32 expression opcodes to their I32 expression with imm opcode counterpart.
 * @type {!Array.<number|undefined>}
 */
types.I32ToI32WithImm = imap([
    types.I32.LitPool,
    types.I32.LitImm,
    types.I32.GetLoc
], [
    types.I32WithImm.LitPool,
    types.I32WithImm.LitImm,
    types.I32WithImm.GetLoc
]);

/**
 * A map of I32 expression with imm opcodes to their I32 expression opcode counterpart.
 * @type {!Array.<number|undefined>}
 */
types.I32WithImmToI32 = inv(types.I32ToI32WithImm);

/**
 * F32 expression opcodes.
 * @type {!Object.<string,number>}
 */
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

/**
 * F32 expression opcode names.
 * @type {!Array.<string>}
 */
types.F32Names = swap(types.F32);

/**
 * F32 expression with imm opcodes.
 * @type {!Object.<string,number>}
 */
types.F32WithImm = {
    LitPool: 0,
    GetLoc: 1
    // Reserved0: 2,
    // Reserved1: 3
};

/**
 * F32 expression with imm opcode names.
 * @type {!Array.<string>}
 */
types.F32WithImmNames = swap(types.F32WithImm);

/**
 * A map of F32 expression opcodes to their F32 expression with imm opcode counterpart.
 * @type {!Array.<number|undefined>}
 */
types.F32ToF32WithImm = imap([
    types.F32.LitPool,
    types.F32.GetLoc
], [
    types.F32WithImm.LitPool,
    types.F32WithImm.GetLoc
]);

/**
 * A map of F32 expression with imm opcodes to their F32 expression opcode counterpart.
 * @type {!Array.<number|undefined>}
 */
types.F32WithImmToF32 = inv(types.F32ToF32WithImm);

/**
 * F64 expression opcodes.
 * @type {!Object.<string,number>}
 */
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

/**
 * F64 expression opcode names.
 * @type {!Array.<string>}
 */
types.F64Names = swap(types.F64);

/**
 * F64 expression with imm opcodes.
 * @type {!Object.<string,number>}
 */
types.F64WithImm = {
    LitPool: 0,
    GetLoc: 1
    // Reserved0: 2,
    // Reserved1: 3
};

/**
 * F64 expression with imm opcode names.
 * @type {!Array.<string>}
 */
types.F64WithImmNames = swap(types.F64WithImm);

/**
 * A map of F64 expression opcodes to their F64 expression with imm opcode counterpart.
 * @type {!Array.<number|undefined>}
 */
types.F64ToF64WithImm = imap([
    types.F64.LitPool,
    types.F64.GetLoc
], [
    types.F64WithImm.LitPool,
    types.F64WithImm.GetLoc
]);

/**
 * A map of F64 expression with imm opcodes to their F64 expression opcode counterpart.
 * @type {!Array.<number|undefined>}
 */
types.F64WithImmToF64 = inv(types.F64ToF64WithImm);

/**
 * Void expression opcodes.
 * @type {!Object.<string,number>}
 */
types.Void = {
    CallInt: 0,
    CallInd: 1,
    CallImp: 2
};

/**
 * Void expression opcode names.
 * @type {!Array.<string>}
 */
types.VoidNames = swap(types.Void);

/**
 * Gets the opcode with imm counterpart of an opcode.
 * @param {number} type Wire type
 * @param {number} code Opcode
 * @returns {number} -1 if there is no counterpart
 */
types.codeWithImm = function(type, code) {
    var other;
    switch (type) {
        case types.WireType.ExprI32:
            if (typeof (other = types.I32ToI32WithImm[code]) !== 'undefined')
                return other;
            break;
        case types.WireType.ExprF32:
            if (typeof (other = types.F32ToF32WithImm[code]) !== 'undefined')
                return other;
            break;
        case types.WireType.ExprF64:
            if (typeof (other = types.F64ToF64WithImm[code]) !== 'undefined')
                return other;
            break;
        case types.WireType.Stmt:
            if (typeof (other = types.StmtToStmtWithImm[code]) !== 'undefined')
                return other;
            break;
        default:
            throw Error("illegal type: " + type);
    }
    return -1;
};

/**
 * Gets the opcode counterpart of an opcode with imm.
 * @param {number} type Wire type
 * @param {number} code Opcode with imm
 * @returns {number} -1 if there is no counterpart
 */
types.codeWithoutImm = function(type, code) {
    var other;
    switch (type) {
        case types.WireType.ExprI32:
            if (typeof (other = types.I32WithImmToI32[code]) !== 'undefined')
                return other;
            break;
        case types.WireType.ExprF32:
            if (typeof (other = types.F32WithImmToF32[code]) !== 'undefined')
                return other;
            break;
        case types.WireType.ExprF64:
            if (typeof (other = types.F64WithImmToF64[code]) !== 'undefined')
                return other;
            break;
        case types.WireType.Stmt:
            if (typeof (other = types.StmtWithImmToStmt[code]) !== 'undefined')
                return other;
            break;
        default:
            throw Error("illegal type: " + type);
    }
    return -1;
};

// ----- standard library -----

/**
 * Hot standard library names.
 * @type {!Array.<string>}
 */
types.HotStdLibNames = [
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

/**
 * Hot standard library.
 * @type {!Object.<string,number>}
 */
types.HotStdLib = swap(types.HotStdLibNames);

/**
 * Hot standard library constructor names.
 * @type {!Array.<string|null>}
 */
types.HotStdLibCtorNames = [
    "Int8Array",
    "Uint8Array",
    "Int16Array",
    "Uint16Array",
    "Int32Array",
    "Uint32Array",
    "Float32Array",
    "Float64Array",
    null,
    null
];

/**
 * Standard library names.
 * @type {!Array.<string>}
 */
types.StdLibNames = [
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

/**
 * Standard library.
 * @type {!Object.<string,number>}
 */
types.StdLib = swap(types.StdLibNames);

// ----- operation precedence (unused) -----

/**
 * Operator precedence.
 * @type {!Object.<string,number>}
 */
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

/**
 * Operator precedence names.
 * @type {!Array.<string>}
 */
types.PrecNames = swap(types.Prec);

// ----- operation context (unused) -----

/**
 * Operation contexts.
 * @type {!Object.<string,number>}
 */
types.Ctx = {
    Default: 0,
    AddSub: 1,
    ToI32: 2,
    FRound: 3,
    ToNumber: 4
};

/**
 * Operation context names.
 * @type {!Array.<string>}
 */
types.CtxNames = swap(types.Ctx);
