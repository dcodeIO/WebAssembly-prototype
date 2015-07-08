var fs = require("fs");

var webassembly = require("../"),
    types = webassembly.types,
    stmt = webassembly.stmt,
    Assembly = webassembly.reflect.Assembly,
    Writer = webassembly.Writer;

// An example showing how to build a super simple I32 adder.

// Calculating the asm.js output size is not yet supported. Instead, I initially used a big enough output size to
// determine the correct value by running the resulting binary through the unpacker provided by the polyfill.
// A CLI version of the unpacker is available in tools/unpack-cli.js

var assembly = new Assembly(770),
    definition = assembly.defineFunction(types.RType.I32, [types.Type.I32, types.Type.I32]);

assembly.setDefaultExport(definition.index);

var add = new stmt.ExprI32(types.I32.Add, [
        new stmt.ExprI32(types.I32.GetLoc, [ /* argument 0 */ definition.getVariable(0) ]),
        new stmt.ExprI32(types.I32.GetLoc, [ /* argument 1 */ definition.getVariable(1) ])
    ]);
var ret = new stmt.Stmt(types.Stmt.Ret, [ add ]);

definition.ast.push(ret);
assembly.validate();

console.log("Writing assembly ...");
var writer = new Writer(assembly);
writer.pipe(fs.createWriteStream(__dirname+"/add.wasm"));
writer.on("end", function() {
    console.log("Complete");
});
writer.resume();
