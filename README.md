<p align="center"><img alt="WebAssembly" src="https://raw.githubusercontent.com/dcodeIO/WebAssembly/master/WebAssembly.png" /></p>

**WebAssembly** is a new, portable, size- and load-time-efficient format suitable for compilation to the web, designed
in a collaborative afford under the umbrella of the W3C ([see](https://www.w3.org/community/webassembly/)).

This package aims to provide tools for working with [WebAssembly](https://github.com/WebAssembly) binaries, providing
interested developers with an easy way to experiment with the technology from within JavaScript itself.

Contents
--------

* **[Type definitions](https://github.com/dcodeIO/WebAssembly/blob/master/src/types.js)**<br />
  Relevant type and opcode definitions.

* **[Reflection structure](https://github.com/dcodeIO/WebAssembly/tree/master/src/reflect)**<br />
  Classes to represent the different sections of a WASM binary.

* **[Statement types](https://github.com/dcodeIO/WebAssembly/tree/master/src/stmt)**<br />
  Classes to represent the different statement and expression types.
  
* **[Statement and expression behaviors](https://github.com/dcodeIO/WebAssembly/tree/master/src/stmt/behavior)**<br />
  Classes describing the wire-format of any statement or expression in an easy to grasp way.

* **[Reader](https://github.com/dcodeIO/WebAssembly/blob/master/src/Reader.js)**<br />
  A streaming reader for disassembling WASM binaries into their respective reflection structure.

* **[AstReader](https://github.com/dcodeIO/WebAssembly/blob/master/src/ast/Reader.js)**<br />
  A streaming reader for disassembling function bodies into their respective AST.

* **[Writer](https://github.com/dcodeIO/WebAssembly/blob/master/src/Writer.js)**<br />
  A streaming writer for assembling WASM binaries from their respective reflection structure.

* **[AstWriter](https://github.com/dcodeIO/WebAssembly/blob/master/src/ast/Writer.js)**<br />
  A streaming writer for assembling function bodies from their respective AST.

Compatibility
-------------
For now this library aims to be compatible with what can be learned from the [polyfill prototype](https://github.com/WebAssembly/polyfill-prototype-1),
but is written in plain JavaScript and does not contain any compiled code.

While this package is built for the [node.js](https://nodejs.org/) platform, it *should* be trivial to also package it
for browsers using [browserify](http://browserify.org).

Please note that the [WebAssembly design](https://github.com/WebAssembly/design) is still in flux and that
[binary encoding](https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md) and
[AST semantics](https://github.com/WebAssembly/design/blob/master/AstSemantics.md) may change at any time.

Usage
-----

##### Parsing a WASM binary including ASTs

```js
var webassembly = require("webassembly"),
    Reader = webassembly.Reader;

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
var webassembly = require("webassembly"),
    Reader = webassembly.Reader,
    AstReader = webassembly.ast.Reader;

var reader = new Reader({
    skipAhead: true // Tells the AstReader not to generate statements, skipping ahead
});

reader.on("end", function() {
    reader.assembly.functionDeclarations.forEach(function(declaration) {
        var definition = declaration.definition;
        ...

        // And create an AstReader from the definition manually,
        // piping in the relevant portion of bytes:
        var astReader = new AstReader(definition);
        astReader.on("ast", function(ast) {
            ...
        });

        astReader.createReadStream("wasmBinaryFile.wasm", {
            start: definition.byteOffset,
            end: definition.byteOffset + definition.byteLength
        }).pipe(reader);
    });
});

...
```

Documentation
-------------
* [Binary Format](https://github.com/dcodeIO/WebAssembly/wiki/Binary-Format)
* [Opcodes](https://github.com/dcodeIO/WebAssembly/wiki/Opcodes)
* [Reader](https://github.com/dcodeIO/WebAssembly/wiki/Reader)

Feel free to contribute!

**License:** [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0.html) - Logo derived from [W3C HTML5 Logos](http://www.w3.org/html/logo/) (CC A 3.0)
