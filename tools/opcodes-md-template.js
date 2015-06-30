var types = require("../src/types");

var classes = {
    "Stmt": [types.Stmt, types.StmtWithImm],
    "Expr<I32>": [types.I32, types.I32WithImm],
    "Expr<F32>": [types.F32, types.F32WithImm],
    "Expr<F64>": [types.F64, types.F64WithImm],
    "Expr<Void>": [types.Void, null]
};

var md = [];

function escapeHtml(s) {
    return s.replace(/</, "&lt;")
            .replace(/>/, "&gt;")
            .replace(/"/, "&quot;");
}

function codeTemplate(md, name, value) {
    md.push("* **", escapeHtml(name), "** = ", value.toString(10), "\n   \n");
}

Object.keys(classes).forEach(function (name) {
    md.push(escapeHtml(name), "\n-----\n\n");
    if (classes[name][0]) {
        md.push("### Opcode only\n\n");
        Object.keys(classes[name][0]).forEach(function (codeName) {
            codeTemplate(md, codeName, classes[name][0][codeName]);
        });
    }
    if (classes[name][1]) {
        md.push("### Opcode with Imm\n\n");
        Object.keys(classes[name][1]).forEach(function (codeName) {
            codeTemplate(md, codeName, classes[name][1][codeName]);
        });
    }
});

process.stdout.write(md.join(""), "utf8");
