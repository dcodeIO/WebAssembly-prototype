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
    BranchBehavior = require("./BranchBehavior"),
    OpcodeOnlyBehavior = require("./OpcodeOnlyBehavior"),
    LabelBehavior = require("./LabelBehavior"),
    ReturnBehavior = require("./ReturnBehavior"),
    BlockBehavior = require("./BlockBehavior"),
    UnaryBehavior = require("./UnaryBehavior"),
    BinaryBehavior = require("./BinaryBehavior"),
    MultiaryBehavior = require("./MultiaryBehavior"),
    LiteralBehavior = require("./LiteralBehavior"),
    ConstantPoolBehavior = require("./ConstantPoolBehavior"),
    CommaBehavior = require("./CommaBehavior");

/**
 * @namespace
 * @exports stmt.behavior
 */
var behavior = module.exports = {};

behavior.GetLocalI32 = new GetLocalBehavior("GetLocalI32", "opcode + local I32 variable index", types.RType.I32);
behavior.GetLocalF32 = new GetLocalBehavior("GetLocalF32", "opcode + local F32 variable index", types.RType.F32);
behavior.GetLocalF64 = new GetLocalBehavior("GetLocalF64", "opcode + local F64 variable index", types.RType.F64);

behavior.SetLocal    = new SetLocalBehavior("SetLocal", "opcode + local variable index + Expr<local variable type>", null);
behavior.SetLocalI32 = new SetLocalBehavior("SetLocalI32", "opcode + local I32 variable index + Expr<I32>", types.RType.I32);
behavior.SetLocalF32 = new SetLocalBehavior("SetLocalF32", "opcode + local F32 variable index + Expr<F32>", types.RType.F32);
behavior.SetLocalF64 = new SetLocalBehavior("SetLocalF64", "opcode + local F64 variable index + Expr<F64>", types.RType.F64);

behavior.GetGlobalI32 = new GetGlobalBehavior("GetGlobalI32", "opcode + global I32 variable index", types.RType.I32);
behavior.GetGlobalF32 = new GetGlobalBehavior("GetGlobalF32", "opcode + global F32 variable index", types.RType.F32);
behavior.GetGlobalF64 = new GetGlobalBehavior("GetGlobalF64", "opcode + global F64 variable index", types.RType.F64);

behavior.SetGlobal    = new SetGlobalBehavior("SetGlobal", "opcode + global variable index + Expr<global variable type>", null);
behavior.SetGlobalI32 = new SetGlobalBehavior("SetGlobalI32", "opcode + global I32 variable index + Expr<I32>", types.RType.I32);
behavior.SetGlobalF32 = new SetGlobalBehavior("SetGlobalF32", "opcode + global F32 variable index + Expr<F32>", types.RType.F32);
behavior.SetGlobalF64 = new SetGlobalBehavior("SetGlobalF64", "opcode + global F64 variable index + Expr<F64>", types.RType.F64);

behavior.StoreI   = new StoreBehavior("StoreI", "opcode + Expr<I32> type-specific heap index + Expr<I32> value", types.RType.I32);
behavior.StoreF32 = new StoreBehavior("StoreF32", "opcode + Expr<I32> F32 heap index + Expr<F32> value", types.RType.F32);
behavior.StoreF64 = new StoreBehavior("StoreF64", "opcode + Expr<I32> F64 heap index + Expr<F64> value", types.RType.F64);

behavior.LoadI   = new LoadBehavior("LoadI", "opcode + Expr<I32> type-specific heap index", types.RType.I32);
behavior.LoadF32 = new LoadBehavior("LoadF32", "opcode + Expr<I32> F32 heap index", types.RType.F32);
behavior.LoadF64 = new LoadBehavior("LoadF64", "opcode + Expr<I32> F64 heap index", types.RType.F64);

behavior.StoreWithOffsetI   = new StoreWithOffsetBehavior("StoreWithOffsetI", "opcode + Expr<I32> type-specific heap index + Expr<I32> heap offset + Expr<I32> value", types.RType.I32);
behavior.StoreWithOffsetF32 = new StoreWithOffsetBehavior("StoreWithOffsetF32", "opcode + Expr<I32> F32 heap index + Expr<I32> heap offset + Expr<F32> value", types.RType.I32);
behavior.StoreWithOffsetF64 = new StoreWithOffsetBehavior("StoreWithOffsetF64", "opcode + Expr<I32> F64 heap index + Expr<I32> heap offset + Expr<F64> value", types.RType.I32);

behavior.LoadWithOffsetI   = new LoadWithOffsetBehavior("LoadWithOffsetI", "opcode + Expr<I32> type-specific heap index + Expr<I32> heap offset", types.RType.I32);
behavior.LoadWithOffsetF32 = new LoadWithOffsetBehavior("LoadWithOffsetF32", "opcode + Expr<I32> F32 heap index + Expr<I32> heap offset", types.RType.F32);
behavior.LoadWithOffsetF64 = new LoadWithOffsetBehavior("LoadWithOffsetF64", "opcode + Expr<I32> F64 heap index + Expr<I32> heap offset", types.RType.F64);

behavior.IfThen = new BranchBehavior("IfThen", "opcode + Expr<I32> condition + Stmt then", [types.RType.I32, null]);
behavior.IfElse = new BranchBehavior("IfElse", "opcode + Expr<I32> condition + Stmt then + Stmt else", [types.RType.I32, null, null]);
behavior.While  = new BranchBehavior("While", "opcode + Expr<I32> condition + Stmt body", [types.RType.I32, null]);
behavior.Do     = new BranchBehavior("Do", "opcode + Stmt body + Expr<I32> condition", [null, types.RType.I32]);
behavior.Label  = new BranchBehavior("Label", "opcode + Stmt body", [null]);
behavior.ConditionalI32 = new BranchBehavior("ConditionalI32", "opcode + Expr<I32> condition + Expr<I32> then + Expr<I32> else", [types.RType.I32, types.RType.I32, types.RType.I32]);
behavior.ConditionalF32 = new BranchBehavior("ConditionalF32", "opcode + Expr<I32> condition + Expr<F32> then + Expr<F32> else", [types.RType.I32, types.RType.F32, types.RType.F32]);
behavior.ConditionalF64 = new BranchBehavior("ConditionalF64", "opcode + Expr<I32> condition + Expr<F64> then + Expr<F64> else", [types.RType.I32, types.RType.F64, types.RType.F64]);

behavior.Break    = new OpcodeOnlyBehavior("Break", "opcode only");
behavior.Continue = new OpcodeOnlyBehavior("Continue", "opcode only");

behavior.BreakLabel    = new LabelBehavior("BreakLabel", "opcode + label index");
behavior.ContinueLabel = new LabelBehavior("ContinueLabel", "opcode + label index");

behavior.Return = new ReturnBehavior("Return", "opcode [ + Expr<function return type> if function return type is not void ]");

behavior.Block = new BlockBehavior("Block", "opcode + varint count + count * Stmt");

behavior.UnaryI32 = new UnaryBehavior("UnaryI32", "opcode + Expr<I32>", types.RType.I32);
behavior.UnaryF32 = new UnaryBehavior("UnaryF32", "opcode + Expr<F32>", types.RType.F32);
behavior.UnaryF64 = new UnaryBehavior("UnaryF64", "opcode + Expr<F64>", types.RType.F64);

behavior.BinaryI32 = new BinaryBehavior("BinaryI32", "opcode + Expr<I32> + Expr<I32>", types.RType.I32);
behavior.BinaryF32 = new BinaryBehavior("BinaryF32", "opcode + Expr<F32> + Expr<F32>", types.RType.F32);
behavior.BinaryF64 = new BinaryBehavior("BinaryF64", "opcode + Expr<F64> + Expr<F64>", types.RType.F64);

behavior.MultiaryI32 = new MultiaryBehavior("MultiaryI32", "opcode + varint count + count * Expr<I32>", types.RType.I32);
behavior.MultiaryF64 = new MultiaryBehavior("MultiaryF64", "opcode + varint count + count * Expr<F64>", types.RType.F64);

behavior.LiteralI32 = new LiteralBehavior("LiteralI32", "opcode + varint/imm value", types.RType.I32);
behavior.LiteralF32 = new LiteralBehavior("LiteralF32", "opcode + float value", types.RType.F32);
behavior.LiteralF64 = new LiteralBehavior("LiteralF64", "opcode + double value", types.RType.F64);

behavior.ConstantI32 = new ConstantPoolBehavior("ConstantI32", "opcode + I32 constant pool index", types.RType.I32);
behavior.ConstantF32 = new ConstantPoolBehavior("ConstantF32", "opcode + F32 constant pool index", types.RType.F32);
behavior.ConstantF64 = new ConstantPoolBehavior("ConstantF64", "opcode + F64 constant pool index", types.RType.F64);

behavior.CommaI32 = new CommaBehavior("opcode + byte return type + Expr<return type> + Expr<I32>", types.RType.I32);
behavior.CommaF32 = new CommaBehavior("opcode + byte return type + Expr<return type> + Expr<F32>", types.RType.F32);
behavior.CommaF64 = new CommaBehavior("opcode + byte return type + Expr<return type> + Expr<F64>", types.RType.F64);
