import { RuleName as ParserRuleName } from "../parser";
import { TokenName as LexerTokenName } from "../lexer";
import { IToken as CIToken, TokenType } from "chevrotain";

export type RuleName = ParserRuleName;
export type TokenName = LexerTokenName;
export type NodeName = RuleName | TokenName;

export type IToken = CIToken;

type RuleChildren = { [key in RuleName]?: ParseNode[] };
type TokenChildren = { [key in TokenName]?: IToken[] };
type NodeChildren = RuleChildren & TokenChildren;

type BaseParseNode = {
  name?: RuleName;
};

export type ParseNode = {
  name?: RuleName;
  children?: NodeChildren;
  tokenType?: TokenType & {
    name: TokenName;
  };
};

export type PickParseNode<K extends keyof NodeChildren> = BaseParseNode & {
  children?: Pick<NodeChildren, K>;
};

export type WithIdentifier = PickParseNode<"Identifier">;
export type WithIntegerConst = PickParseNode<"HexConst" | "IntegerConst">;
export type WithComments = PickParseNode<"CommentsRule">;
export type EnumValueNode = WithIdentifier & WithIntegerConst & WithComments;
