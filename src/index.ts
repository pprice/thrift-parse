import * as fs from "fs";
import * as path from "path";

import { ThriftGrammar } from "./grammar";

const test_path = path.join(__dirname, "../test");

async function main() {
  // Generate a diagram

  const content = (await fs.promises.readFile(path.join(test_path, "thrift/test/ThriftTest.thrift"))).toString("utf8");

  const grammar = new ThriftGrammar();

  const result = grammar.parse(content);

  if (result.errors.lex) {
    console.log(JSON.stringify(result.errors.lex, null, 2));
  }

  console.dir(result);
  console.log(JSON.stringify(result.cst.children, null, 2));

  if (result.errors.parse) {
    console.log(JSON.stringify(result.errors.parse, null, 2));
  }
}

main().then(() => {
  console.log("done");
});
