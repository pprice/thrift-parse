import { RuleName as ParserRuleName } from "../parser";
import { TokenName as LexerTokenName } from "../lexer";
import { IToken, TokenType } from "chevrotain";

export type RuleName = ParserRuleName;
export type TokenName = LexerTokenName;

type RuleChildren = { [key in RuleName]?: ParseNode[] };
type TokenChildren = { [key in TokenName]?: IToken[] };
type NodeChildren = RuleChildren & TokenChildren;

export type ParseNode = {
  name?: RuleName;
  children?: NodeChildren;
  tokenType?: TokenType & {
    name: TokenName;
  };
};
