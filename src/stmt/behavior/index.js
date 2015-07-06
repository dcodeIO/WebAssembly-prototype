var types = require("../../types");

var Behavior = require("./Behavior"),

    GetLocalBehavior = require("./GetLocalBehavior"),
    GetGlobalBehavior = require("./GetGlobalBehavior"),

    SetLocalBehavior = require("./SetLocalBehavior"),
    SetGlobalBehavior = require("./SetGlobalBehavior"),

    LoadBehavior = require("./LoadBehavior"),
    StoreBehavior = require("./StoreBehavior"),
    LoadWithOffsetBehavior = require("./LoadWithOffsetBehavior"),
    StoreWithOffsetBehavior = require("./StoreWithOffsetBehavior"),

    NestedBehavior = require("./NestedBehavior"),

    OpcodeOnlyBehavior = require("./OpcodeOnlyBehavior"),

    LabelBehavior = require("./LabelBehavior");

/**
 * @namespace
 * @exports stmt.behavior
 */
var behavior = module.exports = {};

behavior.GetLocalI32 = new GetLocalBehavior("opcode + local I32 variable index", types.RType.I32);
behavior.GetLocalF32 = new GetLocalBehavior("opcode + local F32 variable index", types.RType.F32);
behavior.GetLocalF64 = new GetLocalBehavior("opcode + local F64 variable index", types.RType.F64);

behavior.SetLocal    = new SetLocalBehavior("opcode + local variable index + Expr<local variable type>", null);
behavior.SetLocalI32 = new SetLocalBehavior("opcode + local I32 variable index + Expr<I32>", types.RType.I32);
behavior.SetLocalF32 = new SetLocalBehavior("opcode + local F32 variable index + Expr<F32>", types.RType.F32);
behavior.SetLocalF64 = new SetLocalBehavior("opcode + local F64 variable index + Expr<F64>", types.RType.F64);

behavior.GetGlobalI32 = new GetGlobalBehavior("opcode + global I32 variable index", types.RType.I32);
behavior.GetGlobalF32 = new GetGlobalBehavior("opcode + global F32 variable index", types.RType.F32);
behavior.GetGlobalF64 = new GetGlobalBehavior("opcode + global F64 variable index", types.RType.F64);

behavior.SetGlobal    = new SetGlobalBehavior("opcode + global variable index + Expr<global variable type>", null);
behavior.SetGlobalI32 = new SetGlobalBehavior("opcode + global I32 variable index + Expr<I32>", types.RType.I32);
behavior.SetGlobalF32 = new SetGlobalBehavior("opcode + global F32 variable index + Expr<F32>", types.RType.F32);
behavior.SetGlobalF64 = new SetGlobalBehavior("opcode + global F64 variable index + Expr<F64>", types.RType.F64);

behavior.StoreI   = new StoreBehavior("opcode + Expr<I32> type-specific heap index + Expr<I32> value", types.RType.I32);
behavior.StoreF32 = new StoreBehavior("opcode + Expr<I32> F32 heap index + Expr<F32> value", types.RType.F32);
behavior.StoreF64 = new StoreBehavior("opcode + Expr<I32> F64 heap index + Expr<F64> value", types.RType.F64);

behavior.LoadI   = new LoadBehavior("opcode + Expr<I32> type-specific heap index", types.RType.I32);
behavior.LoadF32 = new LoadBehavior("opcode + Expr<I32> F32 heap index", types.RType.F32);
behavior.LoadF64 = new LoadBehavior("opcode + Expr<I32> F64 heap index", types.RType.F64);

behavior.StoreWithOffsetI   = new StoreWithOffsetBehavior("opcode + Expr<I32> type-specific heap index + Expr<I32> heap offset + Expr<I32> value", types.RType.I32);
behavior.StoreWithOffsetF32 = new StoreWithOffsetBehavior("opcode + Expr<I32> F32 heap index + Expr<I32> heap offset + Expr<F32> value", types.RType.I32);
behavior.StoreWithOffsetF64 = new StoreWithOffsetBehavior("opcode + Expr<I32> F64 heap index + Expr<I32> heap offset + Expr<F64> value", types.RType.I32);

behavior.LoadWithOffsetI   = new LoadWithOffsetBehavior("opcode + Expr<I32> type-specific heap index + Expr<I32> heap offset", types.RType.I32);
behavior.LoadWithOffsetF32 = new LoadWithOffsetBehavior("opcode + Expr<I32> F32 heap index + Expr<I32> heap offset", types.RType.F32);
behavior.LoadWithOffsetF64 = new LoadWithOffsetBehavior("opcode + Expr<I32> F64 heap index + Expr<I32> heap offset", types.RType.F64);

behavior.IfThen = new NestedBehavior("opcode + Expr<I32> condition + Stmt then", [types.RType.I32, null]);
behavior.IfElse = new NestedBehavior("opcode + Expr<I32> condition + Stmt then + Stmt else", [types.RType.I32, null, null]);
behavior.While  = new NestedBehavior("opcode + Expr<I32> condition + Stmt body", [types.RType.I32, null]);
behavior.Do     = new NestedBehavior("opcode + Stmt body + Expr<I32> condition", [null, types.RType.I32]);
behavior.Label  = new NestedBehavior("opcode + Stmt body", [null]);

behavior.Break    = new OpcodeOnlyBehavior("opcode only");
behavior.Continue = new OpcodeOnlyBehavior("opcode only");

behavior.BreakLabel    = new LabelBehavior("opcode + label index");
behavior.ContinueLabel = new LabelBehavior("opcode + label index");
