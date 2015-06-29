WebAssembly
===========
This package aims to provide tools for working with [WebAssembly](https://github.com/WebAssembly) binaries from within
JavaScript itself.

Contents
--------

* **[Type definitions](https://github.com/dcodeIO/WebAssembly/blob/master/wasm/types.js)**
  Relevant type and opcode definitions.

* **[Reflection structure](https://github.com/dcodeIO/WebAssembly/tree/master/wasm/reflect)**
  Classes to represent the different sections of a WASM binary.

* **[Statement types](https://github.com/dcodeIO/WebAssembly/tree/master/wasm/stmt)**
  Classes to represent the different statement types.

* **[Reader](https://github.com/dcodeIO/WebAssembly/blob/master/wasm/Reader.js)**
  A streaming reader for dissecting a WASM binary into its reflection structure.

* **[AstReader](https://github.com/dcodeIO/WebAssembly/blob/master/wasm/AstReader.js)**
  A streaming reader for parsing function bodies, returning their respective AST.

Compatibility
-------------
For now this library aims to be compatible with what can be learned from the [polyfill prototype](https://github.com/WebAssembly/polyfill-prototype-1),
but is written in plain JavaScript and does not contain any compiled code.

Please note that the [WebAssembly design](https://github.com/WebAssembly/design) is still in flux and that the binary
format may change at any time.

Feel free to contribute!
