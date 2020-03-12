import { Lexer, ThriftLexer } from "./lexer";

import { ThriftCstParser } from "./parser";

export class ThriftGrammar {
  public parser: ThriftCstParser = new ThriftCstParser();
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
