var Reader = require("../wasm/Reader"),
    types = require("../wasm/types");

var reader = new Reader();

reader.on("switchState", function (prevState, newState, offset) {
    console.log("switch state " + prevState + "->" + newState + " @ " + offset.toString(16));
});

reader.on("header", function (size) {
    console.log("Precomputed size: " + size);
});

reader.on("constants", function (nI32, nF32, nF64) {
    console.log("Constants: " + nI32 + "xI32, " + nF32 + "xF32, " + nF64 + "xF64");
});

reader.on("constant", function(type, value, index) {
    console.log(index+" "+types.TypeNames[type]+" "+value);
});

reader.on("constantsEnd", function() {
    console.log("End of constants");
});

reader.on("functionSignatures", function (nSigs) {
    console.log("Signatures: " + nSigs);
});

reader.on("functionSignature", function(signature, index) {
    console.log(signature.toString());
});

reader.on("functionImports", function (nFunctionImports, nSignatures) {
    console.log("Function imports: " + nFunctionImports+" ("+nSignatures+" signatures)");
});

reader.on("functionImport", function(fimport, index) {
    console.log(fimport.toString());
});

reader.on("functionImportsEnd", function() {
    console.log("End of function imports");
});

reader.on("globalVariables", function (nI32zero, nF32zero, nF64zero, nI32import, nF32import, nF64import) {
    console.log("Global vars: " + [nI32zero, nF32zero, nF64zero, nI32import, nF32import, nF64import]);
});

reader.on("globalVariable", function(variable, index) {
    console.log(variable.toString());
});

reader.on("globalVariablesEnd", function() {
    console.log("End of global variables");
});

reader.on("functionDeclarations", function (nDeclarations) {
    console.log("Function declarations: " + nDeclarations);
});

reader.on("functionDeclaration", function(declaration, index) {
    console.log(declaration.toString());
});

reader.on("functionDeclarationsEnd", function() {
    console.log("End of function declarations");
});

reader.on("functionPointerTables", function (nTables) {
    console.log("Function pointer tables: " + nTables);
});

reader.on("functionPointerTable", function(table, index) {
    console.log(table.toString());
});

reader.on("functionPointerTablesEnd", function() {
    console.log("End of function pointer tables");
});

reader.on("functionDefinitions", function (nDefinitions) {
    console.log("Function definitions: " + nDefinitions);
});

reader.on("functionDefinition", function(definition, index) {
    console.log(definition.toString());
});

reader.on("functionDefinitionsEnd", function() {
    console.log("End of function definitions");
});

require("fs").createReadStream(__dirname+"/AngryBots.wasm").pipe(reader);
