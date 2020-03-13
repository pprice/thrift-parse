import { CstNode, CstParser, GrammarAction, TokenType } from "chevrotain";
import { Lexer, Tokens } from "./lexer";

/**
 * Reference: https://thrift.apache.org/docs/idl
 */
export class ThriftCstParser extends CstParser {
  constructor() {
    super(Tokens.Order);
    this.performSelfAnalysis();
  }

  /**
   * Creates a keyword token that will expand into an identifier in the case
   * of a potential longer match.
   *
   * @param name Rule name
   * @param keywordToken Keyword token
   */
  private createKeywordFieldConsumer(name: string, keywordToken: TokenType) {
    /**
     * [Keyword] [Identifier]
     * "{"
     *  MANY([Field])
     * "}"
     */
    return this.RULE(name, () => {
      this.CONSUME(keywordToken);
      this.CONSUME(Tokens.Identifier, { LABEL: "id" });
      this.CONSUME(Tokens.LCurly);
      this.MANY(() => this.SUBRULE(this.field, { LABEL: "fields" }));
      this.CONSUME(Tokens.RCurly);
      this.OPTION(() => this.SUBRULE(this.annotations, { LABEL: "annotations" }));
    });
  }

  /**
   * Root CST node rule
   */
  public root = this.RULE("root", () => {
    // "Every Thrift document contains 0 or more headers followed by 0 or more definitions."
    this.MANY1(() => {
      this.SUBRULE1(this.header, { LABEL: "header" });
    });

    this.MANY2(() => {
      this.SUBRULE2(this.definition, { LABEL: "definition" });
    });
  });

  // TODO: We should decorate comments back into the tree
  private comment = this.RULE("comment", () => {
    this.CONSUME(Tokens.Comment);
  });

  /**
   * HEADER (Include | CPPInclude | Namespace)
   */
  private header = this.RULE("header", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.include, { LABEL: "include" }) },
      { ALT: () => this.SUBRULE(this.cppInclude, { LABEL: "cpp_include" }) },
      { ALT: () => this.SUBRULE(this.namespace, { LABEL: "namespace" }) }
    ]);
  });

  private include = this.RULE("include", () => {
    this.CONSUME(Tokens.Include);
    this.CONSUME(Tokens.StringLiteral, { LABEL: "source" });
  });

  private namespace = this.RULE("namespace", () => {
    this.CONSUME(Tokens.Namespace);
    this.OR([
      { ALT: () => this.CONSUME1(Tokens.Identifier, { LABEL: "scope" }) },
      { ALT: () => this.CONSUME(Tokens.Wildcard, { LABEL: "scope" }) }
    ]);
    this.CONSUME2(Tokens.Identifier, { LABEL: "id" });
    this.OPTION(() => this.SUBRULE(this.annotations, { LABEL: "annotations" }));
  });

  private cppInclude = this.RULE("cpp_include", () => {
    this.CONSUME(Tokens.CPPInclude);
    this.CONSUME(Tokens.StringLiteral, { LABEL: "source" });
  });

  /**
   * DEFINITION (Const | TypeDef | Enum | Struct | Union | Exception | Service)
   */
  private definition = this.RULE("definition", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.constDefinition, { LABEL: "const" }) },
      { ALT: () => this.SUBRULE(this.typedef, { LABEL: "typedef" }) },
      { ALT: () => this.SUBRULE(this.enum, { LABEL: "enum" }) },
      { ALT: () => this.SUBRULE(this.struct, { LABEL: "struct" }) },
      { ALT: () => this.SUBRULE(this.union, { LABEL: "union" }) },
      { ALT: () => this.SUBRULE(this.exception, { LABEL: "exception" }) },
      { ALT: () => this.SUBRULE(this.service, { LABEL: "service" }) }
    ]);
  });

  private fieldId = this.RULE("fieldId", () => {
    this.CONSUME(Tokens.IntConst, { LABEL: "id" });
    this.CONSUME(Tokens.Colon);
  });

  private fieldReq = this.RULE("fieldReq", () => {
    this.OR([{ ALT: () => this.CONSUME(Tokens.Optional) }, { ALT: () => this.CONSUME(Tokens.Required) }]);
  });

  private field = this.RULE("field", () => {
    /**
     * ([integer]":") ("optional"|"required") [Type] [Identifier] ("=" [Const])
     */

    this.OPTION1(() => this.SUBRULE(this.fieldId, { LABEL: "id" }));
    this.OPTION2(() => this.SUBRULE(this.fieldReq, { LABEL: "req" }));
    this.SUBRULE1(this.type, { LABEL: "type" });
    this.CONSUME1(Tokens.Identifier, { LABEL: "identifier" });
    this.OPTION3(() => {
      this.CONSUME3(Tokens.Assignment);
      this.SUBRULE3(this.constValue, { LABEL: "value" });
    });
    this.OPTION4(() => this.SUBRULE(this.annotations, { LABEL: "annotations" }));
    this.OPTION5(() => this.CONSUME(Tokens.ListSeparator));
  });

  private union = this.createKeywordFieldConsumer("union", Tokens.Union);
  private struct = this.createKeywordFieldConsumer("struct", Tokens.Struct);
  private exception = this.createKeywordFieldConsumer("exception", Tokens.Exception);

  private enum = this.RULE("enum", () => {
    // NOTE: Enums are different from other field keyword consumers, they do not
    // have field ids, and assignments can only be int or hex constants
    this.CONSUME(Tokens.Enum);
    this.CONSUME(Tokens.Identifier, { LABEL: "id" });
    this.CONSUME(Tokens.LCurly);

    // this.MANY_SEP({
    //   SEP: Tokens.ListSeparator,
    //   DEF: () => this.SUBRULE(this.enumValue)
    // });

    this.MANY(() => this.SUBRULE(this.enumValue, { LABEL: "values" }));

    // There could be a trailing list separator
    this.OPTION(() => this.CONSUME2(Tokens.ListSeparator));
    this.CONSUME(Tokens.RCurly);

    // Enum post annotations
    this.OPTION2(() => this.SUBRULE(this.annotations, { LABEL: "annotations" }));
  });

  private enumValue = this.RULE("enumValue", () => {
    this.CONSUME(Tokens.Identifier, { LABEL: "id" });
    this.OPTION(() => {
      this.CONSUME(Tokens.Assignment);
      this.OR([
        { ALT: () => this.CONSUME(Tokens.HexConst, { LABEL: "value" }) },
        { ALT: () => this.CONSUME(Tokens.IntConst, { LABEL: "value" }) },
        { ALT: () => this.CONSUME2(Tokens.Identifier, { LABEL: "value" }) }
      ]);
    });

    // Annotations on enum fields
    this.OPTION2(() => this.SUBRULE(this.annotations, { LABEL: "annotations" }));

    // Enable trailing separators
    this.OPTION3(() => {
      this.CONSUME(Tokens.ListSeparator);
    });
  });

  private typedef = this.RULE("typedef", () => {
    this.CONSUME(Tokens.Typedef);
    this.SUBRULE(this.definitionType, { LABEL: "type" });
    this.CONSUME(Tokens.Identifier, { LABEL: "id" });
    this.OPTION(() => this.SUBRULE(this.annotations, { LABEL: "annotations" }));
  });

  private service = this.RULE("service", () => {
    this.CONSUME(Tokens.Service);
    this.CONSUME(Tokens.Identifier, { LABEL: "id" });
    this.OPTION2(() => {
      this.CONSUME2(Tokens.Extends);
      this.CONSUME2(Tokens.Identifier, { LABEL: "base_id" });
    });
    this.CONSUME(Tokens.LCurly);
    this.MANY(() => this.SUBRULE(this.functionDeclaration, { LABEL: "function" }));
    this.CONSUME(Tokens.RCurly);
    this.OPTION3(() => this.SUBRULE(this.annotations, { LABEL: "annotations" }));
  });

  private functionDeclaration = this.RULE("function", () => {
    this.OPTION1(() => this.CONSUME(Tokens.OneWay, { LABEL: "oneway" }));
    this.OR([{ ALT: () => this.SUBRULE(this.type) }, { ALT: () => this.CONSUME(Tokens.Void) }]);
    this.CONSUME(Tokens.Identifier, { LABEL: "id" });
    this.CONSUME(Tokens.LParen);
    this.MANY(() => this.SUBRULE(this.field));

    this.CONSUME(Tokens.RParen);
    this.OPTION2(() => {
      this.CONSUME2(Tokens.Throws, { LABEL: "throws" });
      this.CONSUME2(Tokens.LParen);
      this.MANY2(() => this.SUBRULE2(this.field));
      this.CONSUME2(Tokens.RParen);
    });
    this.OPTION3(() => this.SUBRULE(this.annotations));
    this.OPTION4(() => this.CONSUME(Tokens.ListSeparator));
  });

  private annotation = this.RULE("annotation", () => {
    this.CONSUME(Tokens.Identifier, { LABEL: "id" });

    this.OPTION(() => {
      this.CONSUME(Tokens.Assignment);
      this.CONSUME(Tokens.StringLiteral, { LABEL: "value" });
    });

    this.OPTION2(() => this.CONSUME(Tokens.Comma));
  });

  private annotations = this.RULE("annotations", () => {
    this.CONSUME(Tokens.LParen);

    this.MANY(() => this.SUBRULE(this.annotation, { LABEL: "annotation" }));

    this.CONSUME(Tokens.RParen);
  });

  private constValue = this.RULE("constValue", () => {
    this.OR([
      { ALT: () => this.CONSUME(Tokens.StringLiteral, { LABEL: "string" }) },
      { ALT: () => this.CONSUME(Tokens.HexConst, { LABEL: "hex" }) },
      { ALT: () => this.CONSUME(Tokens.IntConst, { LABEL: "int" }) },
      { ALT: () => this.CONSUME(Tokens.DoubleConst, { LABEL: "double" }) },
      { ALT: () => this.CONSUME(Tokens.Identifier, { LABEL: "id" }) },
      { ALT: () => this.SUBRULE(this.mapConst, { LABEL: "map_const" }) },
      { ALT: () => this.SUBRULE(this.listConst, { LABEL: "list_const" }) }
    ]);
  });

  private cppType = this.RULE("cpp_type", () => {
    this.CONSUME(Tokens.CPPType);
    this.CONSUME(Tokens.StringLiteral);
  });

  private listConst = this.RULE("listConst", () => {
    this.CONSUME(Tokens.LBracket);
    this.MANY_SEP({
      SEP: Tokens.ListSeparator,
      DEF: () => this.SUBRULE(this.constValue, { LABEL: "value" })
    });
    this.CONSUME(Tokens.RBracket);
  });

  private mapConst = this.RULE("mapConst", () => {
    this.CONSUME(Tokens.LCurly);

    this.MANY(() => this.SUBRULE(this.mapValue, { LABEL: "values" }));

    // There could be a trailing list separator
    this.OPTION(() => this.CONSUME2(Tokens.ListSeparator));

    this.CONSUME(Tokens.RCurly);
  });

  private mapValue = this.RULE("mapValue", () => {
    // Map rule is also used for const struct definitions, will need to split this out
    this.SUBRULE1(this.constValue, { LABEL: "key" });
    this.CONSUME(Tokens.Colon);
    this.SUBRULE2(this.constValue, { LABEL: "value" });
    this.OPTION(() => this.CONSUME(Tokens.ListSeparator));
  });

  private baseType = this.RULE("base_type", () => {
    this.OR([
      { ALT: () => this.CONSUME(Tokens.I16) },
      { ALT: () => this.CONSUME(Tokens.I32) },
      { ALT: () => this.CONSUME(Tokens.I64) },
      { ALT: () => this.CONSUME(Tokens.Bool) },
      { ALT: () => this.CONSUME(Tokens.Byte) },
      { ALT: () => this.CONSUME(Tokens.Binary) },
      { ALT: () => this.CONSUME(Tokens.String) },
      { ALT: () => this.CONSUME(Tokens.Double) }
    ]);
  });

  private containerType = this.RULE("container_type", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.mapType, { LABEL: "map" }) },
      { ALT: () => this.SUBRULE(this.listType, { LABEL: "list" }) },
      { ALT: () => this.SUBRULE(this.setType, { LABEL: "set" }) }
    ]);
  });

  private definitionType = this.RULE("definition_type", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.baseType, { LABEL: "base_type" }) },
      { ALT: () => this.SUBRULE(this.containerType, { LABEL: "container_type" }) }
    ]);
    this.OPTION(() => this.SUBRULE(this.annotations, { LABEL: "annotations" }));
  });

  private type = this.RULE("type", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.definitionType, { LABEL: "definition_type" }) },
      { ALT: () => this.CONSUME(Tokens.Identifier, { LABEL: "identifier_type" }) }
    ]);
  });

  private mapType = this.RULE("map", () => {
    this.CONSUME(Tokens.Map);
    this.OPTION(() => this.SUBRULE(this.cppType, { LABEL: "cpp_type" }));
    this.CONSUME(Tokens.LTemplate);
    this.SUBRULE1(this.type, { LABEL: "key_type" });
    this.CONSUME(Tokens.Comma);
    this.SUBRULE2(this.type, { LABEL: "value_type" });
    this.CONSUME(Tokens.RTemplate);
  });

  private listType = this.RULE("list", () => {
    this.CONSUME(Tokens.List);
    this.CONSUME(Tokens.LTemplate);
    this.SUBRULE(this.type, { LABEL: "value_type" });
    this.CONSUME(Tokens.RTemplate);
    this.OPTION(() => this.SUBRULE(this.cppType));
  });

  private setType = this.RULE("set", () => {
    this.CONSUME(Tokens.Set);
    this.OPTION(() => this.SUBRULE(this.cppType));
    this.CONSUME(Tokens.LTemplate);
    this.SUBRULE(this.type, { LABEL: "value_type" });
    this.CONSUME(Tokens.RTemplate);
  });

  private constDefinition = this.RULE("const", () => {
    this.CONSUME(Tokens.Const);
    this.SUBRULE(this.type, { LABEL: "value_type" });
    this.CONSUME(Tokens.Identifier, { LABEL: "id" });
    this.CONSUME(Tokens.Assignment);
    this.SUBRULE(this.constValue, { LABEL: "value" });

    // It is possible to have a semi-colon at the end of a const statement;
    // just consume it and move forward
    this.OPTION(() => this.CONSUME(Tokens.Semi));
  });
}

export const ThriftParser = new ThriftCstParser();
