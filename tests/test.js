var Reader = require("../wasm/Reader.js");

var parser = new Reader();

parser.on("switchState", function (prevState, newState, offset) {
    console.log("switch state " + prevState + "->" + newState + " @ " + offset.toString(16));
});

parser.on("header", function (size) {
    console.log("Unpacked size: " + size);
});

parser.on("constants", function (I32, F32, F64) {
    console.log("Constants: " + I32.length + "xI32, " + F32.length + "xF32, " + F64.length + "xF64");
});

parser.on("signatures", function (signatures) {
    console.log("Signatures: " + signatures.length);
});

parser.on("functionImports", function (functionImports) {
    console.log("Function imports: " + functionImports.length);
});

parser.on("globalVars", function (globalVars) {
    console.log("Global vars: " + globalVars.length);
});

parser.on("functionDeclarations", function (functionDeclarations) {
    console.log("Function declarations: " + functionDeclarations.length);
});

parser.on("functionPointers", function (functionPointers) {
    console.log("Function pointers: " + functionPointers.length);
});

parser.on("functionDefinitions", function (functionDefinitions) {
    console.log("Function definitions: " + functionDefinitions.length + " == " + this.functionDeclarations.length);
    console.log(functionDefinitions);
});

require("fs").createReadStream(__dirname+"/fib.wasm").pipe(parser);
