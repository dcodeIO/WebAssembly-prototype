function asmModule(stdlib, foreign, heap) {
    "use asm";

    function $w(k) {
        k = k|0;
        var l = 0,
            m = 0;
        if (k >>> 0 < 3) {
            return 1|0;
        }
        l = $w(k-1)|0;
        m = $w(k-2)|0;
        return l + m;
    }

    return $w;
}
