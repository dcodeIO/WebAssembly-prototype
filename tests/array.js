function MyArray(size) {
    Array.call(this, size);
    this.length = size;
}

MyArray.prototype = Object.create(Array.prototype);

function MyWithArray(size) {
    this.array = [];
    this.array.length = size;
}

var n = 1000000;

console.time("MyArray");
for (var i=0; i<n; ++i) {
    new MyArray(5);
}
console.timeEnd("MyArray");

console.time("MyWithArray");
for (var i=0; i<n; ++i) {
    new MyWithArray(5);
}
console.timeEnd("MyWithArray");
