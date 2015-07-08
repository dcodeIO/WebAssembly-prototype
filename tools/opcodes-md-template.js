var types = require("../src/types"),
    stmt = require("../src/stmt/");

var classes = {
    "Stmt": [ypes.Stmt, types.StmtWithImm, stmt.Stmt],
    "Expr<I32>": [types.I32, types.I32WithImm, stmt.ExprI32],
    "Expr<F32>": [types.F32, types.F32WithImm, stmt.ExprF32],
    "Expr<F64>": [types.F64, types.F64WithImm, stmt.ExprF64],
    "Expr<Void>": [types.Void, null, stmt.ExprVoid],
    "SwitchCase": [types.SwitchCase, null, stmt.SwitchCase]
};

var md = [];

function escapeHtml(s) {
    return s.replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
}

function codeTemplate(md, name, code, withImm, ctor) {
    md.push("| **", escapeHtml(name), "** | ", code.toString(10), " | ");
    var behavior = ctor.determineBehavior(code, withImm);
    md.push(escapeHtml(behavior.name), " | ", escapeHtml(behavior.description), "\n");
}

Object.keys(classes).forEach(function (name) {
    md.push(escapeHtml(name), "\n-----\n\n");
    var ctor = classes[name][2];
    if (classes[name][0]) {
        md.push("### Opcode without Imm\n\n");
        md.push("| Name | Code | Behavior | Description\n");
        md.push("|------|------|----------|-------------\n");
        Object.keys(classes[name][0]).forEach(function (codeName) {
            codeTemplate(md, codeName, classes[name][0][codeName], false, ctor);
        });
        md.push("\n");
    }
    if (classes[name][1]) {
        md.push("### Opcode with Imm\n\n");
        md.push("| Name | Code | Behavior | Description\n");
        md.push("|------|------|----------|-------------\n");
        Object.keys(classes[name][1]).forEach(function (codeName) {
            codeTemplate(md, codeName, classes[name][1][codeName], true, ctor);
        });
        md.push("\n");
    }
});

process.stdout.write(md.join(""), "utf8");
