var fs = require("fs"),
    path = require("path"),
    assert = require("assert"),
    pkg = require("../package.json");

var webassembly = require("../"),
    types = webassembly.types,
    Reader = webassembly.Reader,
    AstReader = webassembly.ast.Reader,
    Writer = webassembly.Writer,
    AstWriter = webassembly.ast.Writer,
    Assembly = webassembly.reflect.Assembly;

var verbose = 1;

if (typeof process.env.VERBOSE !== 'undefined')
    verbose = parseInt(process.env.VERBOSE, 10);

var filename = "AngryBots.wasm";
var file = path.join(__dirname, filename),
    stats = fs.statSync(file);

console.log("WebAssembly "+pkg.version+": Testing '"+filename+"' ...\n");

var reader = new Reader({
    skipAhead: true
});

if (verbose) {
    reader.on("switchState", function (prevState, newState, offset) {
        console.log("switch state " + prevState + "->" + newState + " @ " + offset.toString(16));
    });

    reader.on("header", function (size) {
        console.log("Precomputed size: " + size);
    });

    reader.on("constants", function (nI32, nF32, nF64) {
        console.log("Constants: " + nI32 + "xI32, " + nF32 + "xF32, " + nF64 + "xF64");
    });

    reader.on("constant", function (constant) {
        console.log(constant.toString());
    });

    reader.on("constantsEnd", function () {
        console.log("End of constants");
    });

    reader.on("functionSignatures", function (nSigs) {
        console.log("Signatures: " + nSigs);
    });

    reader.on("functionSignature", function (signature) {
        console.log(signature.toString());
    });

    reader.on("functionImports", function (nFunctionImports, nSignatures) {
        console.log("Function imports: " + nFunctionImports + " (" + nSignatures + " signatures)");
    });

    reader.on("functionImport", function (fimport) {
        console.log(fimport.toString());
    });

    reader.on("functionImportsEnd", function () {
        console.log("End of function imports");
    });

    reader.on("globalVariables", function (nI32zero, nF32zero, nF64zero, nI32import, nF32import, nF64import) {
        console.log("Global vars: " + [nI32zero, nF32zero, nF64zero, nI32import, nF32import, nF64import]);
    });

    reader.on("globalVariable", function (variable) {
        console.log(variable.toString());
    });

    reader.on("globalVariablesEnd", function () {
        console.log("End of global variables");
    });

    reader.on("functionDeclarations", function (nDeclarations) {
        console.log("Function declarations: " + nDeclarations);
    });

    reader.on("functionDeclaration", function (declaration) {
        console.log(declaration.toString());
    });

    reader.on("functionDeclarationsEnd", function () {
        console.log("End of function declarations");
    });

    reader.on("functionPointerTables", function (nTables) {
        console.log("Function pointer tables: " + nTables);
    });

    reader.on("functionPointerTable", function (table) {
        console.log(table.toString());
    });

    reader.on("functionPointerTablesEnd", function () {
        console.log("End of function pointer tables");
    });

    reader.on("functionDefinitions", function (nDefinitions) {
        console.log("Function definitions: " + nDefinitions);
    });

    reader.on("functionDefinition", function (definition) {
        console.log(definition.asmHeader() + "\n");
    });

    reader.on("functionDefinitionsEnd", function () {
        console.log("End of function definitions");
    });

    reader.on("export", function (exprt) {
        console.log("Export: " + exprt.toString());
    });
}

reader.on("end", function() {
    if (reader.offset !== stats.size)
        throw Error("reader offset != size: "+reader.offset+" != "+stats.size);
    console.log("Complete: "+reader.assembly.toString()+"\n");

    if (verbose)
        console.log(reader.assembly.asmHeader(), "\n");

    console.log("Validating assembly ...");
    try {
        reader.assembly.validate();
    } catch (err) {
        if (err instanceof assert.AssertionError) {
            console.log("actual: "+err.actual);
            console.log("expected: "+err.expected);
        }
        throw err;
    }
    console.log("Success\n");
    validateAstOffsets();
});

console.log("Indexing assembly ...");
fs.createReadStream(file).pipe(reader);

function validateAstOffsets() {
    console.log("Reading ASTs ...");

    var assembly = reader.assembly;
    var stats = fs.statSync(file);
    var current = 0;

    function next() {
        if (current === assembly.functionDeclarations.length) {
            console.log("Complete: "+current+" ASTs\n");
            validateAstRewrite(assembly);
            return;
        }
        var declaration = assembly.functionDeclarations[current++],
            definition = declaration.definition;
        var offset = definition.byteOffset,
            length = definition.byteLength,
            n = 0;
        if (length < 0)
            throw Error("length "+length+" < 0");
        if (offset + length > stats.size)
            throw Error("offset + length "+(offset+length)+" > "+stats.size);
        if (verbose)
            console.log("Reading AST of "+definition+" @ "+definition.byteOffset.toString(16));
        var astReader = new AstReader(definition);
        astReader.on("ast", function(ast) {
            if (verbose)
                console.log("AST read complete: "+n+" statements");
            definition.ast = ast;
        });
        astReader.on("stmt", function(stmt) {
            ++n;
        });
        astReader.on("end", function() {
            next();
        });
        fs.createReadStream(file, {
            start: offset,
            end: offset + length
        }).pipe(astReader);
    }

    next();
}

function validateAstRewrite(assembly) {
    console.log("Validating AST rewrite ...");
    var contents = fs.readFileSync(file),
        current = 0;

    function next() {
        if (current >= assembly.functionDeclarations.length) {
            console.log("Success\n");
            write(assembly);
            return;
        }
        var definition = assembly.functionDeclarations[current].definition,
            astContents = contents.slice(definition.byteOffset, definition.byteOffset + definition.byteLength);
        var writer = new AstWriter(definition, { preserveWithImm: true }),
            offset = 0,
            n = 0;
        if (verbose)
            console.log("Writing AST of "+definition);
        writer.on("data", function(chunk) {
            for (var i=0; i<chunk.length; ++i) {
                if (astContents[offset+i] !== chunk[i]) {
                    console.log("difference at offset "+(offset+i).toString(16)+": "+astContents[offset+i].toString(16)+" != "+chunk[i].toString(16));
                    console.log("AstReader", astContents.slice(offset+i-3, offset+i+16));
                    console.log("AStWriter", chunk.slice(i-3, i+16));

                    console.log(definition.asmHeader());
                    console.log(AstReader.inspect(definition.ast));

                    throw Error("difference at offset "+(offset+i).toString(16));
                }
            }
            offset += chunk.length;
        });
        writer.on("stmt", function(stmt) {
            ++n;
        });
        writer.on("end", function() {
            if (verbose)
                console.log("AST write complete: "+n+" statements");
            ++current;
            setImmediate(next);
        });
        writer.resume();
    }
    next();
}

var unoptimizedSize = 0;

function write(assembly) {
    console.log("Writing assembly ...");

    var contents = fs.readFileSync(file),
        offset = 0;
    var writer = new Writer(assembly, { preserveWithImm : true }),
        wi = 0;
    if (verbose)
        writer.on("switchState", function(state, previousState, offset) {
            console.log("switch state "+previousState+"->"+state+" @ "+offset.toString(16));
        });
    writer.on("data", function(chunk) {
        if (verbose && wi++%100 === 0)
            process.stdout.write(".");
        for (var i=0; i<chunk.length; ++i) {
            if (contents[offset+i] !== chunk[i]) {
                console.log("\n");
                console.log("Reader", contents.slice(offset+i, offset+i+16));
                console.log("Writer", chunk.slice(i, i+16));
                console.log("Chunk size: "+chunk.length+", offset: "+i);
                throw Error("difference at offset "+(offset+i).toString(16)+": "+contents[offset+i].toString(16)+" != "+chunk[i].toString(16));
            }
        }
        offset += chunk.length;
    });
    writer.on("end", function() {
        unoptimizedSize = offset;
        console.log("Complete: "+offset+" bytes\n");
        optimize(assembly);
    });
    writer.resume();
}

function optimize(assembly) {
    console.log("Optimizing assembly ...");
    var n = assembly.optimize();
    console.log("Complete: "+n+" optimizations\n");
    writeFile(assembly, path.basename(filename, ".wasm")+"-optimized.wasm");
}

function writeFile(assembly, file) {
    console.log("Writing assembly to "+file+" ...");
    var writer = new Writer(assembly);
    var ws = fs.createWriteStream(path.join(__dirname, file)),
        offset = 0,
        wi = 0;
    writer.on("data", function(chunk) {
        if (verbose && wi++%100 === 0)
            process.stdout.write(".");
        ws.write(chunk);
        offset += chunk.length;
    });
    writer.on("end", function() {
        ws.end();
        var p = (unoptimizedSize-offset)/unoptimizedSize;
        if (verbose)
            console.log("");
        console.log("Complete: "+offset+" bytes (-"+p+"%)\n");
    });
    // FIXME: Why does .pipe throw "Maximum call stack size exceeded"?
    writer.resume();
}
