WebAssembly
===========
This package aims to provide tools for working with [WebAssembly](https://github.com/WebAssembly) binaries from within
JavaScript itself.

For now it contains:

* **[Type definitions](https://github.com/dcodeIO/WebAssembly/blob/master/wasm/types.js)**
  Relevant type and OpCode definitions.

* **[Reflection structure](https://github.com/dcodeIO/WebAssembly/tree/master/wasm/reflect)**
  Classes to represent the different sections of a WASM binary.

* **[Statement types](https://github.com/dcodeIO/WebAssembly/tree/master/wasm/stmt)**
  Classes to represent the different statement types.

* **[Reader](https://github.com/dcodeIO/WebAssembly/blob/master/wasm/Reader.js)**
  A streaming reader for dissecting a WASM binary into its reflection structure.

* **[AstReader](https://github.com/dcodeIO/WebAssembly/blob/master/wasm/AstReader.js)**
  A streaming reader for parsing function bodies, returning their respective AST.

Feel free to contribute!
