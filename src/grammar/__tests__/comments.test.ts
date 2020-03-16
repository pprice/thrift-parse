import { ThriftGrammar } from "../api";

describe("Comments", () => {
  it("should collect document comments (single line //)", () => {
    const grammar = new ThriftGrammar();
    const test = `
      // Just
      // Comments
    `;

    const result = grammar.parse(test);
    expect(result.errors.parse.length).toEqual(0);
  });

  it("should collect document comments (single line #)", () => {
    const grammar = new ThriftGrammar();
    const test = `
      # Just
      # Comments
    `;

    const result = grammar.parse(test);
    expect(result.errors.parse.length).toEqual(0);
  });

  it("should collect document comments (block /* */)", () => {
    const grammar = new ThriftGrammar();
    const test = `
      /* Just
         Comments */
    `;

    const result = grammar.parse(test);
    expect(result.errors.parse.length).toEqual(0);
  });

  it("should collect document comments (doc /** */)", () => {
    const grammar = new ThriftGrammar();
    const test = `
      /** Just
         Comments */
    `;

    const result = grammar.parse(test);
    expect(result.errors.parse.length).toEqual(0);
  });
});
