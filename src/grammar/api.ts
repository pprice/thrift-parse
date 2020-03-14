import { CstNode, ILexingError, IRecognitionException } from "chevrotain";
import { Lexer, ThriftLexer } from "./lexer";
import { TimingInfo, time } from "../perf-util";

import { ThriftCstParser } from "./parser";

export type GrammarParseResult = {
  cst?: CstNode;
  input_name: string;
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

  constructor() {}

  public parse(text: string, input_name?: string): GrammarParseResult {
    const lex_time_handle = time();
    const lex = this.lexer.tokenize(text);
    const lex_time = lex_time_handle();

    const parse_time_handle = time();
    this.parser.input = lex.tokens;
    const cst = this.parser.root();
    const parse_time = parse_time_handle();

    return {
      input_name,
      errors: {
        lex: lex.errors,
        parse: this.parser.errors
      },
      performance: {
        lex: lex_time,
        parse: parse_time
      },
      cst
    };
  }
}
