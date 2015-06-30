<p align="center"><img alt="WebAssembly" src="https://raw.githubusercontent.com/dcodeIO/WebAssembly/master/WebAssembly.png" /></p>

This package aims to provide tools for working with [WebAssembly](https://github.com/WebAssembly) binaries from within
JavaScript itself.

Contents
--------

* **[Type definitions](https://github.com/dcodeIO/WebAssembly/blob/master/src/types.js)**
  Relevant type and opcode definitions.

* **[Reflection structure](https://github.com/dcodeIO/WebAssembly/tree/master/src/reflect)**
  Classes to represent the different sections of a WASM binary.

* **[Statement types](https://github.com/dcodeIO/WebAssembly/tree/master/src/stmt)**
  Classes to represent the different statement types.

* **[Reader](https://github.com/dcodeIO/WebAssembly/blob/master/src/Reader.js)**
  A streaming reader for dissecting a WASM binary into its reflection structure.

* **[AstReader](https://github.com/dcodeIO/WebAssembly/blob/master/src/AstReader.js)**
  A streaming reader for parsing function bodies, returning their respective AST.

Compatibility
-------------
For now this library aims to be compatible with what can be learned from the [polyfill prototype](https://github.com/WebAssembly/polyfill-prototype-1),
but is written in plain JavaScript and does not contain any compiled code.

Please note that the [WebAssembly design](https://github.com/WebAssembly/design) is still in flux and that the binary
format may change at any time.

Usage
-----

##### Parsing a WASM binary including ASTs

```js
var WebAssembly = require("webassembly"),
    Reader = WebAssembly.Reader;

var reader = new Reader();

reader.on("functionDefinition", function(definition, index) {
    ...
});

reader.on("end", function() {
    var myAssembly = reader.assembly;
    ...
});

// Write your WASM data to it
// - either manually:
reader.write(wasmBinaryData);
// - or pipe it:
require("fs").createReadStream("wasmBinaryFile.wasm").pipe(reader);
```

##### Just indexing a WASM binary, parsing ASTs on demand

```js
var WebAssembly = require("webassembly"),
    Reader = WebAssembly.Reader,
    AstReader = WebAssembly.AstReader;

var reader = new Reader({
    skipAhead: true // Tells the AstReader not to generate statements, skipping ahead
});

reader.on("end", function() {
    reader.assembly.functionDeclarations.forEach(function(declaration) {
        var definition = declaration.definition;
        var byteIndexInBinary = definition.globalOffset;
        ...

        // And create an AstReader from the definition manually,
        // piping in the relevant portion of bytes:
        var astReader = new AstReader(definition);
        astReader.on("ast", function(ast) {
            ...
        });

        ...
    });
});

...
```

Feel free to contribute!

**License:** Apache License, Version 2.0 - http://www.apache.org/licenses/LICENSE-2.0.html
