import { ThriftGrammar } from "../grammar";
import { ThriftLexer } from "../grammar/lexer";
import { getTestAssetContent } from "./util";

describe("End To End Parsing", () => {
  const inputs = [
    "thrift/tutorial/service.thrift",
    "thrift/tutorial/shared.thrift",
    "thrift/missing-guide/service.thrift",
    "thrift/test/fb303.thrift",
    "thrift/test/cassandra.thrift",
    "thrift/test/annotations.thrift",
    "thrift/test/ThriftTest.thrift"
  ];

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
