import { Lexer, ThriftLexer } from "./lexer";

import { ThriftParser } from "./parser";

export class ThriftGrammar {
  public parser: ThriftParser = new ThriftParser();
  public lexer: ThriftLexer = Lexer;

  constructor() {}

  public parse(text: string) {
    const lex = this.lexer.tokenize(text);
    this.parser.input = lex.tokens;

    const cst = this.parser.root();

    return {
      errors: {
        lex: lex.errors,
        parse: this.parser.errors
      },
      cst
    };
  }
}
