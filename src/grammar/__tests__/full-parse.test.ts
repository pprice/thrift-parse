import { getTestAssetContent, getThriftAssetsSync } from "../../test-util/util";

import { ThriftGrammar } from "../index";
import { ThriftLexer } from "../lexer";

describe("End To End Parsing", () => {
  const inputs = getThriftAssetsSync();

  test.each(inputs)("should lex %s", async path => {
    const lex = new ThriftLexer();
    const result = lex.tokenize(await getTestAssetContent(path));

    expect(result.errors).toHaveLength(0);
    expect(result.tokens.length).toBeGreaterThan(0);
  });

  test.each(inputs)("should parse %s", async path => {
    const grammar = new ThriftGrammar();
    const result = grammar.parse(await getTestAssetContent(path));

    expect(result.errors.parse).toHaveLength(0);
    expect(result.cst).toBeDefined();
    expect(result.cst.children).toBeDefined();
  });
});
