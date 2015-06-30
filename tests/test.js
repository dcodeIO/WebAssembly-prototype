var fs = require("fs"),
    path = require("path");

var WebAssembly = require("../"),
    types = WebAssembly.types,
    Reader = WebAssembly.Reader,
    AstReader = WebAssembly.AstReader;

var file = path.join(__dirname, "AngryBots.wasm"),
    stats = fs.statSync(file);

console.log("Testing "+file+" ...\n");

var reader = new Reader({
    skipAhead: true
});

/* reader.on("switchState", function (prevState, newState, offset) {
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
    console.log(definition.header(true)+"\n");
});

reader.on("functionDefinitionsEnd", function() {
    console.log("End of function definitions");
});

reader.on("export", function(exprt) {
    console.log("Export: "+exprt.toString());
}); */

reader.on("end", function() {
    if (reader.offset !== stats.size)
        throw Error("reader offset != size: "+reader.offset+" != "+stats.size);
    reader.assembly.validate();
    console.log("Complete: "+reader.assembly.toString());
    validateAstOffsets();
});

fs.createReadStream(file).pipe(reader);

function validateAstOffsets() {
    var assembly = reader.assembly;
    var stats = fs.statSync(file);
    var current = 0;

    function next() {
        if (current === assembly.functionDeclarations.length) {
            console.log("Validated ASTs: "+current);
            return;
        }
        var declaration = assembly.functionDeclarations[current++],
            definition = declaration.definition;
        var offset = definition.byteOffset,
            length = definition.byteLength;
        if (length < 0)
            throw Error("length "+length+" < 0");
        if (offset + length > stats.size)
            throw Error("offset + length "+(offset+length)+" > "+stats.size);
        var astReader = new AstReader(definition);

        astReader.on("end", next);

        fs.createReadStream(file, {
            start: offset,
            end: offset + length
        }).pipe(astReader);
    }

    next();
}
