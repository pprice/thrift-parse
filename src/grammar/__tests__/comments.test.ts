import { extractComments, extractPostComments } from "../helpers/comments";

import { ParseNode } from "../helpers";
import { ThriftGrammar } from "../api";

describe("Comments", () => {
  describe("Root", () => {
    it("should collect document comments (single line //)", () => {
      const grammar = new ThriftGrammar();
      const test = `
      // Just
      // Comments
    `;

      const result = grammar.parse(test);
      expect(result.errors.parse.length).toEqual(0);

      const extracted = extractComments(result.cst as ParseNode);

      expect(extracted.length).toEqual(2);
      expect(extracted[0].type).toEqual("Line");
      expect(extracted[0].value).toEqual(" Just");
      expect(extracted[1].type).toEqual("Line");
      expect(extracted[1].value).toEqual(" Comments");
    });

    it("should collect document comments (single line #)", () => {
      const grammar = new ThriftGrammar();
      const test = `
      # Just
      # Comments
    `;

      const result = grammar.parse(test);
      expect(result.errors.parse.length).toEqual(0);

      const extracted = extractComments(result.cst as ParseNode);

      expect(extracted.length).toEqual(2);
      expect(extracted[0].type).toEqual("Line");
      expect(extracted[0].value).toEqual(" Just");
      expect(extracted[1].type).toEqual("Line");
      expect(extracted[1].value).toEqual(" Comments");
    });

    it("should collect document comments (block /* */)", () => {
      const grammar = new ThriftGrammar();
      const test = `
      /* Just
         Comments */
    `;

      const result = grammar.parse(test);
      expect(result.errors.parse.length).toEqual(0);

      const extracted = extractComments(result.cst as ParseNode);

      expect(extracted.length).toEqual(1);
      expect(extracted[0].type).toEqual("Block");
      expect(extracted[0].value).toMatch(/Just\s+Comments/);
    });

    it("should collect document comments (doc /** */)", () => {
      const grammar = new ThriftGrammar();
      const test = `
      /** Just
         Comments */
    `;

      const result = grammar.parse(test);
      expect(result.errors.parse.length).toEqual(0);

      const extracted = extractComments(result.cst as ParseNode);

      expect(extracted.length).toEqual(1);
      expect(extracted[0].type).toEqual("Doc");
      expect(extracted[0].value).toMatch(/Just\s+Comments/);
    });

    it("should collect post comments", () => {
      const grammar = new ThriftGrammar();
      const test = `
      // Header
      // Comments

      service s {
        i32 t(1: i32 x)
      }
      // Post Comment
    `;

      const result = grammar.parse(test);
      expect(result.errors.parse.length).toEqual(0);

      const extracted = extractPostComments(result.cst as ParseNode);

      expect(extracted.length).toEqual(1);
      expect(extracted[0].type).toEqual("Line");
      expect(extracted[0].value).toEqual(" Post Comment");
    });
  });
});
