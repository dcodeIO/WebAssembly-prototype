function fib(stdlib, foreign, heap) {
  "use asm";

  function fib(n) {
    n = n|0;
    var f1=0;
    var f2=0;
    if (n >>> 0 < 3) {
      return 1|0;
    }
    f1=fib(n-1)|0;
    f2=fib(n-2)|0;
    return f1 + f2;
  }

  return fib;
}
