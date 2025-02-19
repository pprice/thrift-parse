/* eslint-disable @typescript-eslint/camelcase */

import { Lexer as CTLexer, ITokenConfig, TokenType, createToken } from "chevrotain";

const Patterns = {
  /**
   * Boolean literal pattern
   */
  BooleanConstPattern: /true|false/y,

  /**
   * String literal pattern.
   *
   * Quirks.
   * 1. Can be enclosed in " OR '
   */
  StringLiteralPattern: /"([^\r\n\f"]*)"|'([^\r\n\f']*)'/y,

  /**
   * Integer constant pattern.
   */
  IntConstPattern: /[-+]?\d+([eE]\d+)?/y,

  /**
   * Hex constant pattern.
   *
   * Quirks:
   * 1. Thrift hexadecimal constants can have a leading sign (-+)
   */
  HexConstPattern: /[-+]?0x[A-Fa-f0-9]+/y,

  /**
   * Double constant pattern.
   *
   * Quirks:
   * 1. Thrift doubles can have any number of leading 0s
   * 2.
   */
  DoubleConstPattern: /[-+]?([0-9]\d*)\.\d+([eE][+-]?\d+)?/y,

  /**
   * Single line comments
   */
  SingleLineCommentPattern: /(\/\/|#)[^\r\n]*/y,

  /**
   * Doc comment pattern
   */
  DocCommentPattern: /\/\*\*[^]*?\*\//y,

  /**
   * Block comment pattern
   */
  BlockCommentPattern: /\/\*[^]*?\*\//y
};

type RegExpExecArrayWithPayload<T> = RegExpExecArray & { payload?: T };
type PayloadParser<T> = (match: string, fullMatch: RegExpExecArray) => T;
type PatternMatcher<T> = (text: string, offset: number) => RegExpExecArrayWithPayload<T> | null;

export type TokenName = keyof ThriftTokens;

/**
 * Reference: https://thrift.apache.org/docs/idl
 */
export class ThriftTokens {
  /**
   * Creates a token type that will expand to identifier in the case of a longer available match.
   * This is used used to disambiguate a keyword (e.g. optional) vs an identifer (e.g. optionalThing).
   * @param {ITokenConfig} config Token configuration
   */
  private createKeywordToken(config: ITokenConfig): TokenType {
    if (!this.Identifier) {
      throw new Error("Unable to create keyword token as longer_alt is not defined");
    }

    return createToken({
      ...config,
      longer_alt: this.Identifier
    });
  }

  /**
   * Validates a set of TokenTypes to ensure there are no undefined entries or categories
   * @param {TokenType[]} tokens TokenTypes to validate
   * @returns {TokenType[]} Input token types, if validation successful
   */
  private validateTokens(tokens: TokenType[]): TokenType[] {
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (!token) {
        throw new Error(`Undefined token at position ${i}`);
      } else if (token.CATEGORIES) {
        if (token.CATEGORIES.some(i => i == null)) {
          throw new Error(`Token ${token.name} has undefined category token`);
        }
      }
    }

    return tokens;
  }

  /**
   * Creates a custom pattern matcher that, if successfully matched, will set a token payload
   * on the resulting token node by passing the match the the specified parser.
   *
   * @param {RegExp} expression Matching regular expression
   * @param {PayloadParser<T>} parser Callback function which is called to generated token payload
   * @returns {PatternMatcher<T>} Pattern matching function
   */
  private makeRegexPayloadMatcher<T>(expression: RegExp, parser: PayloadParser<T>): PatternMatcher<T> {
    if (!expression.sticky) {
      throw new Error(`Expression ${expression} must be configured to be sticky ('y' flag)`);
    }

    return (text, offset): RegExpExecArrayWithPayload<T> => {
      expression.lastIndex = offset;
      const execResult: RegExpExecArrayWithPayload<T> = expression.exec(text);
      if (execResult !== null) {
        const fullMatch = execResult[0];
        // compute the payload
        execResult.payload = parser(fullMatch, execResult);
      }

      return execResult;
    };
  }

  SingleLineComment = createToken({
    name: "SingleLineComment",
    // NOTE: Comments can start with // or #, which is not documented
    pattern: this.makeRegexPayloadMatcher(Patterns.SingleLineCommentPattern, (match, groups) => match.substring(groups[1].length)),
    line_breaks: false
  });

  DocComment = createToken({
    name: "DocComment",
    pattern: this.makeRegexPayloadMatcher(Patterns.DocCommentPattern, match => match.substring(3, match.length - 2)),
    line_breaks: true
  });

  BlockComment = createToken({
    name: "BlockComment",
    pattern: this.makeRegexPayloadMatcher(Patterns.BlockCommentPattern, match => match.substring(2, match.length - 2)),
    longer_alt: this.DocComment,
    line_breaks: true
  });

  Whitespace = createToken({
    name: "Whitespace",
    pattern: /[ \t]+/,
    group: CTLexer.SKIPPED
  });

  LineTerminator = createToken({
    name: "LineTerminator",
    pattern: /\n\r|\r|\n/,
    group: CTLexer.SKIPPED
  });

  Identifier = createToken({
    name: "Identifier",
    pattern: /[A-Za-z_](\.[A-Za-z_0-9]|[A-Za-z_0-9])*/
  });

  StringLiteral = createToken({
    name: "StringLiteral",
    pattern: this.makeRegexPayloadMatcher(Patterns.StringLiteralPattern, match => match.substr(1, match.length - 2)),
    line_breaks: false
  });

  // TODO: BigNum support
  HexConst = createToken({
    name: "HexConst",
    pattern: this.makeRegexPayloadMatcher(Patterns.HexConstPattern, match => Number.parseInt(match)),
    line_breaks: false
  });

  // TODO: BigNum support
  IntegerConst = createToken({
    name: "IntegerConst",
    pattern: this.makeRegexPayloadMatcher(Patterns.IntConstPattern, match => Number.parseInt(match)),
    longer_alt: this.HexConst,
    line_breaks: false
  });

  // TODO: BigNum support
  DoubleConst = createToken({
    name: "DoubleConst",
    pattern: this.makeRegexPayloadMatcher(Patterns.DoubleConstPattern, match => Number.parseFloat(match)),
    line_breaks: false
  });

  BooleanConst = createToken({
    name: "BooleanConst",
    pattern: this.makeRegexPayloadMatcher(Patterns.BooleanConstPattern, match => (match === "true" ? true : false)),
    line_breaks: false,
    longer_alt: this.Identifier
  });

  Assignment = createToken({
    name: "Assignment",
    pattern: /=/,
    label: "="
  });

  ListSeparator = createToken({
    name: "ListSeparator",
    pattern: CTLexer.NA
  });

  Semi = createToken({
    name: "Semi",
    pattern: /;/,
    categories: [this.ListSeparator],
    label: ";"
  });

  Comma = createToken({
    name: "Comma",
    pattern: /,/,
    categories: [this.ListSeparator],
    label: ","
  });

  LParen = createToken({
    name: "LParen",
    pattern: /\(/,
    label: "("
  });

  RParen = createToken({
    name: "RParen",
    pattern: /\)/,
    label: ")"
  });

  LCurly = createToken({
    name: "LCurly",
    pattern: /{/,
    label: "{"
  });

  RCurly = createToken({
    name: "RCurly",
    pattern: /}/,
    label: "}"
  });

  LBracket = createToken({
    name: "LBracket",
    pattern: /\[/,
    label: "["
  });

  RBracket = createToken({
    name: "RBracket",
    pattern: /\]/,
    label: "]"
  });

  LTemplate = createToken({
    name: "LTemplate",
    pattern: /</,
    label: "<"
  });

  RTemplate = createToken({
    name: "RTemplate",
    pattern: />/,
    label: ">"
  });

  Colon = createToken({
    name: "Colon",
    pattern: /:/,
    label: ":"
  });

  Wildcard = createToken({
    name: "Wildcard",
    pattern: /\*/,
    label: "*"
  });

  Ampersand = createToken({
    name: "Ampersand",
    pattern: /&/,
    label: "*&"
  });

  Include = this.createKeywordToken({
    name: "Include",
    pattern: /include/
  });

  CPPInclude = this.createKeywordToken({
    name: "CPPInclude",
    pattern: /cpp_include/
  });

  Namespace = this.createKeywordToken({
    name: "Namespace",
    pattern: /namespace/
  });

  Typedef = this.createKeywordToken({
    name: "Typedef",
    pattern: /typedef/
  });

  Const = this.createKeywordToken({
    name: "ConstStatement",
    pattern: /const/
  });

  Struct = this.createKeywordToken({
    name: "Struct",
    pattern: /struct/
  });

  Enum = this.createKeywordToken({
    name: "Enum",
    pattern: /enum/
  });

  SEnum = this.createKeywordToken({
    name: "SEnum",
    pattern: /senum/
  });

  Union = this.createKeywordToken({
    name: "Union",
    pattern: /union/
  });

  Service = this.createKeywordToken({
    name: "Service",
    pattern: /service/
  });

  Extends = this.createKeywordToken({
    name: "Extends",
    pattern: /extends/
  });

  Throws = this.createKeywordToken({
    name: "throws",
    pattern: /throws/
  });

  Exception = this.createKeywordToken({
    name: "Exception",
    pattern: /exception/
  });

  Bool = this.createKeywordToken({
    name: "Bool",
    pattern: /bool/
  });

  Byte = this.createKeywordToken({
    name: "Byte",
    pattern: /byte/
  });

  I16 = this.createKeywordToken({
    name: "I16",
    pattern: /i16/
  });

  I32 = this.createKeywordToken({
    name: "I32",
    pattern: /i32/
  });

  I64 = this.createKeywordToken({
    name: "I64",
    pattern: /i64/
  });

  Double = this.createKeywordToken({
    name: "Double",
    pattern: /double/
  });

  Binary = this.createKeywordToken({
    name: "Binary",
    pattern: /binary/
  });

  String = this.createKeywordToken({
    name: "String",
    pattern: /string/
  });

  SList = this.createKeywordToken({
    name: "SList",
    pattern: /slist/
  });

  Void = this.createKeywordToken({
    name: "String",
    pattern: /void/
  });

  OneWay = this.createKeywordToken({
    name: "OneWay",
    pattern: /oneway/
  });

  Optional = this.createKeywordToken({
    name: "Optional",
    pattern: /optional/
  });

  Required = this.createKeywordToken({
    name: "Required",
    pattern: /required/
  });

  CPPType = this.createKeywordToken({
    name: "CPPType",
    pattern: /cpp_type/
  });

  List = this.createKeywordToken({
    name: "List",
    pattern: /list/
  });

  Set = this.createKeywordToken({
    name: "Set",
    pattern: /set/
  });

  Map = this.createKeywordToken({
    name: "Map",
    pattern: /map/
  });

  /**
   * Defines the order of precedence for lexer token consumption
   */
  Order = this.validateTokens([
    // Trivia
    this.Whitespace,
    // Comments
    this.DocComment,
    this.BlockComment,
    this.SingleLineComment,
    // Trivia
    this.LineTerminator,
    // Structure
    this.Assignment,
    this.Colon,
    this.Semi,
    this.Comma,
    this.ListSeparator,
    this.LParen,
    this.RParen,
    this.LTemplate,
    this.RTemplate,
    this.LBracket,
    this.RBracket,
    this.LCurly,
    this.RCurly,
    this.Ampersand, // Used for recursive structures
    this.Wildcard, // Only used for namespaces
    // Constants
    this.BooleanConst,
    this.StringLiteral,
    this.DoubleConst, // NOTE: We need to attempt to tokenize doubles before integers as they are ambiguous
    this.HexConst,
    this.IntegerConst,
    // Header
    this.Include,
    this.CPPInclude,
    this.Namespace,
    // Definitions
    this.Typedef,
    this.Const,
    this.Struct,
    this.Union,
    this.Enum,
    this.SEnum,
    this.Service,
    this.Exception,
    // Keywords
    this.Extends,
    this.Throws,
    this.OneWay,
    this.Optional,
    this.Required,
    this.CPPType,
    // Types
    this.Bool,
    this.Byte,
    this.I16,
    this.I32,
    this.I64,
    this.Double,
    this.Binary,
    this.String,
    this.SList,
    this.List,
    this.Set,
    this.Map,
    // Special
    this.Void,
    // Identifier
    this.Identifier
  ]);
}

export const Tokens = new ThriftTokens();

export class ThriftLexer extends CTLexer {
  public static Tokens = Tokens.Order;

  constructor() {
    super(Tokens.Order);
  }
}

export const Lexer = new ThriftLexer();
