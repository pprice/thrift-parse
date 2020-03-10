import * as fs from "fs";
import * as path from "path";

import { ThriftGrammar } from "../src/grammar";
import { createSyntaxDiagramsCode } from "chevrotain";

const grammar = new ThriftGrammar();
const seralizedGrammaar = grammar.parser.getSerializedGastProductions();
const html = createSyntaxDiagramsCode(seralizedGrammaar);

const dir = path.resolve(__dirname, "../tmp");
fs.mkdirSync(dir);

const output = path.join(dir, "gen.html");
fs.writeFileSync(output, html);
