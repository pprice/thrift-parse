import { CstNode, ILexingError, IRecognitionException } from "chevrotain";
import { Lexer, ThriftLexer } from "./lexer";
import { TimingInfo, time } from "../perf-util";

import { ThriftCstParser } from "./parser";

export type GrammarParseResult = {
  cst?: CstNode;
  inputName: string;
  errors: {
    lex: ILexingError[];
    parse: IRecognitionException[];
  };
  performance: {
    lex: TimingInfo;
    parse: TimingInfo;
  };
};

export class ThriftGrammar {
  public parser: ThriftCstParser = new ThriftCstParser();
  public lexer: ThriftLexer = Lexer;

  public parse(text: string, inputName?: string): GrammarParseResult {
    const lexTimeHandle = time();
    const lex = this.lexer.tokenize(text);
    const lexTime = lexTimeHandle();

    const parseTimeHandle = time();
    this.parser.input = lex.tokens;
    const cst = this.parser.root();
    const parseTime = parseTimeHandle();

    return {
      inputName,
      errors: {
        lex: lex.errors,
        parse: this.parser.errors
      },
      performance: {
        lex: lexTime,
        parse: parseTime
      },
      cst
    };
  }
}
