import { Lexer as CTLexer, ITokenConfig, TokenType, createToken } from "chevrotain";

/**
 * Reference: https://thrift.apache.org/docs/idl
 */
export class ThriftTokens {
  private createKeywordToken(config: ITokenConfig) {
    if (!this.Identifier) {
      throw new Error("Unable to create keyword token as longer_alt is not defined");
    }

    let token = createToken({
      ...config,
      longer_alt: this.Identifier
    });

    return token;
  }

  private validateTokens(tokens: TokenType[]): TokenType[] {
    for (let i = 0; i < tokens.length; i++) {
      let token = tokens[i];

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

  Comment = createToken({
    name: "Comment",
    pattern: CTLexer.NA,
    group: CTLexer.SKIPPED,
    line_breaks: true
  });

  InlineComment = createToken({
    name: "InlineComment",
    // NOTE: Comments can start with // or #, which is not documented
    pattern: /(\/\/|\#)[^\r\n]*/,
    group: CTLexer.SKIPPED,
    categories: [this.Comment]
  });

  BlockComment = createToken({
    name: "BlockComment",
    pattern: (text, startOffset) => {
      let started = text[startOffset] === "/" && text[startOffset + 1] === "*";

      if (!started) {
        return null;
      }

      let endOffset = startOffset + 2;
      // Find the next */ pair
      endOffset = text.indexOf("*/", endOffset);

      if (endOffset === -1) {
        return null;
      }

      return [text.substring(startOffset, endOffset + 2)];
    },
    line_breaks: true,
    group: CTLexer.SKIPPED,
    categories: [this.Comment]
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

  StringLiteral = createToken({
    name: "StringLiteral",
    pattern: /\"([^\r\n\f\"]*)\"|\'([^\r\n\f\']*)\'/
  });

  HexConst = createToken({
    name: "HexLiteral",
    pattern: /0x[A-f0-9]+/ // TODO: Split into float vs int
  });

  IntConst = createToken({
    name: "IntegerLiteral",
    pattern: /[-+]?\d+/,
    longer_alt: this.HexConst
  });

  DoubleConst = createToken({
    name: "DoubleLiteral",
    pattern: /[-+]?(0|[1-9]\d*)\.\d+([eE][+-]?\d+)?/
  });

  Assignment = createToken({
    name: "Assignment",
    pattern: /=/
  });

  ListSeparator = createToken({
    name: "ListSeparator",
    pattern: CTLexer.NA
  });

  Semi = createToken({
    name: "Semi",
    pattern: /;/,
    categories: [this.ListSeparator]
  });

  Comma = createToken({
    name: "Comma",
    pattern: /,/,
    categories: [this.ListSeparator]
  });

  LParen = createToken({
    name: "LParen",
    pattern: /\(/
  });

  RParen = createToken({
    name: "RParen",
    pattern: /\)/
  });

  LCurly = createToken({
    name: "LCurly",
    pattern: /{/
  });

  RCurly = createToken({
    name: "RCurly",
    pattern: /}/
  });

  LBracket = createToken({
    name: "LBracket",
    pattern: /\[/
  });

  RBracket = createToken({
    name: "RBracket",
    pattern: /\]/
  });

  LTemplate = createToken({
    name: "LTemplate",
    pattern: /</
  });

  RTemplate = createToken({
    name: "RTemplate",
    pattern: />/
  });

  Colon = createToken({
    name: "Colon",
    pattern: /:/
  });

  Wildcard = createToken({
    name: "Wildcard",
    pattern: /\*/
  });

  Identifier = createToken({
    name: "Identifier",
    pattern: /[A-Za-z_][A-Za-z0-9_\.]*/
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
    name: "i16",
    pattern: /i16/
  });

  I32 = this.createKeywordToken({
    name: "i32",
    pattern: /i32/
  });

  I64 = this.createKeywordToken({
    name: "i64",
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
    name: "Oneway",
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
    this.InlineComment,
    this.BlockComment,
    this.Comment,
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
    this.Wildcard, // Only used for namespaces
    // Constants
    this.StringLiteral,
    this.IntConst,
    this.HexConst,
    this.DoubleConst,
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
