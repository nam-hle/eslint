const Fs = require("fs");

const espree = require("espree");

const SourceCode = require("../lib/source-code/source-code");

const DEFAULT_CONFIG = {
    ecmaVersion: 6,
    comment: true,
    tokens: true,
    range: true,
    loc: true
};

const code = "// this is a comment\nfunction f(x) { const y = x + 1; return x; }";
const ast = espree.parse(code, DEFAULT_CONFIG),
    sourceCode = new SourceCode(code, ast);

Fs.writeFileSync("asd.json", JSON.stringify(ast, null, 2));

console.log(ast);
