var fs = require("fs");

var webassembly = require("../"),
    types = webassembly.types,
    stmt = webassembly.stmt,
    Assembly = webassembly.reflect.Assembly,
    Writer = webassembly.Writer;

// An example showing how to build a super simple I32 adder

var assembly = new Assembly(), // Does not support precomputing the output size
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
