/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { CstParser, TokenType } from "chevrotain";
import {
  TypeName,
  findTypeName,
  isDoubleAssignable,
  isIntegerAssignable,
  isListAssignable,
  isMapAssignable,
  isStringAssignable
} from "./helpers/thrift-types";

import { ParseNode } from "./helpers";
import { Tokens } from "./lexer";

// TODO: typeof Rules without const declaration of value within a type
// will resolve to string over a set of the named valid rules :-(
export type TRules = {
  Root: "RootRule";
  Header: "HeaderRule";
  Include: "IncludeRule";
  Namespace: "NamespaceRule";
  CPPInclude: "CPPIncludeRule";
  Definition: "DefinitionRule";
  FieldId: "FieldIdRule";
  FieldReq: "FieldReqRule";
  Field: "FieldRule";
  Union: "UnionRule";
  Struct: "StructRule";
  Exception: "ExceptionRule";
  SEnum: "SEnumRule";
  Enum: "EnumRule";
  EnumValue: "EnumValueRule";
  TypeDef: "TypeDefRule";
  Service: "ServiceRule";
  Function: "FunctionRule";
  Annotation: "AnnotationRule";
  Annotations: "AnnotationsRule";
  ConstValue: "ConstValueRule";
  CPPType: "CPPTypeRule";
  ListConst: "ListConstRule";
  MapConst: "MapConstRule";
  MapValue: "MapValueRule";
  BaseType: "BaseTypeRule";
  ContainerType: "ContainerTypeRule";
  DefinitionType: "DefinitionTypeRule";
  Type: "TypeRule";
  MapType: "MapTypeRule";
  ListType: "ListTypeRule";
  SetType: "SetTypeRule";
  Const: "ConstRule";
  Comments: "CommentsRule";
  PostComments: "PostCommentsRule";
};

const Rules: TRules = {
  Root: "RootRule",
  Header: "HeaderRule",
  Include: "IncludeRule",
  Namespace: "NamespaceRule",
  CPPInclude: "CPPIncludeRule",
  Definition: "DefinitionRule",
  FieldId: "FieldIdRule",
  FieldReq: "FieldReqRule",
  Field: "FieldRule",
  Union: "UnionRule",
  Struct: "StructRule",
  Exception: "ExceptionRule",
  SEnum: "SEnumRule",
  Enum: "EnumRule",
  EnumValue: "EnumValueRule",
  TypeDef: "TypeDefRule",
  Service: "ServiceRule",
  Function: "FunctionRule",
  Annotation: "AnnotationRule",
  Annotations: "AnnotationsRule",
  ConstValue: "ConstValueRule",
  CPPType: "CPPTypeRule",
  ListConst: "ListConstRule",
  MapConst: "MapConstRule",
  MapValue: "MapValueRule",
  BaseType: "BaseTypeRule",
  ContainerType: "ContainerTypeRule",
  DefinitionType: "DefinitionTypeRule",
  Type: "TypeRule",
  MapType: "MapTypeRule",
  ListType: "ListTypeRule",
  SetType: "SetTypeRule",
  Const: "ConstRule",
  Comments: "CommentsRule",
  PostComments: "PostCommentsRule"
};

export type RuleName = TRules[keyof TRules];

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
  private RULE_FILED_CONSUMER(name: RuleName, keywordToken: TokenType) {
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

  private RULE_WITH_LEADING_COMMENTS(name: RuleName, body: (...args: unknown[]) => unknown) {
    return this.RULE(name, (...args) => {
      this.SUBRULE(this.comments);
      body(...args);
    });
  }

  /**
   * Root CST node rule
   */
  public root = this.RULE(Rules.Root, () => {
    this.SUBRULE(this.comments);

    // "Every Thrift document contains 0 or more headers followed by 0 or more definitions."
    this.MANY1(() => {
      this.SUBRULE1(this.header);
    });

    this.MANY2(() => {
      this.SUBRULE2(this.definition);
    });

    this.SUBRULE2(this.comments, { LABEL: Rules.PostComments });
  });

  private comments = this.RULE(Rules.Comments, (allowSingleLine = true) => {
    this.MANY(() => {
      this.OR([
        { ALT: () => this.CONSUME(Tokens.DocComment) },
        { ALT: () => this.CONSUME(Tokens.BlockComment) },
        { GATE: () => allowSingleLine, ALT: () => this.CONSUME(Tokens.SingleLineComment) }
      ]);
    });
  });

  /**
   * HEADER (Include | CPPInclude | Namespace)
   */
  private header = this.RULE_WITH_LEADING_COMMENTS(Rules.Header, () => {
    this.OPTION(() =>
      this.OR([
        { ALT: () => this.SUBRULE(this.include) },
        { ALT: () => this.SUBRULE(this.cppInclude) },
        { ALT: () => this.SUBRULE(this.namespace) }
      ])
    );
  });

  private include = this.RULE(Rules.Include, () => {
    this.CONSUME(Tokens.Include);
    this.CONSUME(Tokens.StringLiteral, { LABEL: "source" });
  });

  private namespace = this.RULE(Rules.Namespace, () => {
    this.CONSUME(Tokens.Namespace);
    this.OR([
      { ALT: () => this.CONSUME1(Tokens.Identifier, { LABEL: "scope" }) },
      { ALT: () => this.CONSUME(Tokens.Wildcard, { LABEL: "scope" }) }
    ]);
    this.CONSUME2(Tokens.Identifier, { LABEL: "id" });
    this.OPTION(() => this.SUBRULE(this.annotations, { LABEL: "annotations" }));
  });

  private cppInclude = this.RULE(Rules.CPPInclude, () => {
    this.CONSUME(Tokens.CPPInclude);
    this.CONSUME(Tokens.StringLiteral, { LABEL: "source" });
  });

  /**
   * DEFINITION (Const | TypeDef | Enum | Struct | Union | Exception | Service)
   */
  private definition = this.RULE_WITH_LEADING_COMMENTS(Rules.Definition, () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.constDefinition) },
      { ALT: () => this.SUBRULE(this.typedef) },
      { ALT: () => this.SUBRULE(this.enum) },
      { ALT: () => this.SUBRULE(this.senum) },
      { ALT: () => this.SUBRULE(this.struct) },
      { ALT: () => this.SUBRULE(this.union) },
      { ALT: () => this.SUBRULE(this.exception) },
      { ALT: () => this.SUBRULE(this.service) }
    ]);
  });

  private fieldId = this.RULE(Rules.FieldId, () => {
    this.SUBRULE(this.comments, { ARGS: [false] });
    this.CONSUME(Tokens.IntConst, { LABEL: "id" });
    this.CONSUME(Tokens.Colon);
  });

  private fieldReq = this.RULE(Rules.FieldReq, () => {
    this.SUBRULE(this.comments, { ARGS: [false] });
    this.OR([{ ALT: () => this.CONSUME(Tokens.Optional) }, { ALT: () => this.CONSUME(Tokens.Required) }]);
  });

  private field = this.RULE(Rules.Field, () => {
    /**
     * ([integer]":") ("optional"|"required") [Type] [Identifier] ("=" [Const])
     */
    this.SUBRULE(this.comments);
    this.OPTION(() => {
      this.OPTION1(() => this.SUBRULE(this.fieldId, { LABEL: "id" }));
      this.OPTION2(() => this.SUBRULE(this.fieldReq, { LABEL: "req" }));
      const type = findTypeName(this.SUBRULE1(this.type) as ParseNode);

      this.OPTION3(() => this.CONSUME(Tokens.Ampersand, { LABEL: "reference" }));

      this.CONSUME1(Tokens.Identifier, { LABEL: "identifier" });
      this.OPTION4(() => {
        this.CONSUME3(Tokens.Assignment);
        this.SUBRULE3(this.constValue, { ARGS: [type, "field"] });
      });
      this.OPTION5(() => this.SUBRULE(this.annotations, { LABEL: "annotations" }));
      this.OPTION6(() => this.CONSUME(Tokens.ListSeparator));
    });
  });

  private union = this.RULE_FILED_CONSUMER(Rules.Union, Tokens.Union);
  private struct = this.RULE_FILED_CONSUMER(Rules.Struct, Tokens.Struct);
  private exception = this.RULE_FILED_CONSUMER(Rules.Exception, Tokens.Exception);

  private senum = this.RULE(Rules.SEnum, () => {
    this.CONSUME(Tokens.SEnum);
    this.CONSUME(Tokens.Identifier, { LABEL: "id" });
    this.CONSUME(Tokens.LCurly);

    this.MANY(() => {
      this.CONSUME(Tokens.StringLiteral);
      this.OPTION(() => this.CONSUME(Tokens.ListSeparator));
    });

    this.CONSUME(Tokens.RCurly);

    // SEnum post annotations
    this.OPTION2(() => this.SUBRULE(this.annotations, { LABEL: "annotations" }));
  });

  private enum = this.RULE(Rules.Enum, () => {
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
    this.OPTION2(() => this.SUBRULE(this.comments));
    this.CONSUME(Tokens.RCurly);

    // Enum post annotations
    this.OPTION3(() => this.SUBRULE(this.annotations, { LABEL: "annotations" }));
  });

  private enumValue = this.RULE(Rules.EnumValue, () => {
    this.SUBRULE(this.comments);
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

  private typedef = this.RULE(Rules.TypeDef, () => {
    this.CONSUME(Tokens.Typedef);
    this.SUBRULE(this.type, { LABEL: "type" });
    this.CONSUME(Tokens.Identifier, { LABEL: "id" });
    this.OPTION(() => this.SUBRULE(this.annotations, { LABEL: "annotations" }));
    this.OPTION2(() => this.CONSUME(Tokens.ListSeparator));
  });

  private service = this.RULE(Rules.Service, () => {
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

  private functionDeclaration = this.RULE(Rules.Function, () => {
    this.SUBRULE(this.comments);
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
    this.SUBRULE2(this.comments);
  });

  private annotation = this.RULE(Rules.Annotation, () => {
    this.CONSUME(Tokens.Identifier, { LABEL: "id" });

    this.OPTION(() => {
      this.CONSUME(Tokens.Assignment);
      this.CONSUME(Tokens.StringLiteral, { LABEL: "value" });
    });

    this.OPTION2(() => this.CONSUME(Tokens.Comma));
  });

  private annotations = this.RULE(Rules.Annotations, () => {
    this.CONSUME(Tokens.LParen);

    this.MANY(() => this.SUBRULE(this.annotation, { LABEL: "annotation" }));

    this.CONSUME(Tokens.RParen);
  });

  private constValue = this.RULE(Rules.ConstValue, (knownType: TypeName) => {
    const errorMessage = knownType ? `Constant ${knownType} or Identifier` : "";
    const skipCheck = !knownType || knownType === "Identifier";

    this.OR({
      DEF: [
        // If the incoming type assignment is known; gate options to be valid (e.g. cant assign a string to an i32)
        { GATE: () => skipCheck || isStringAssignable(knownType), ALT: () => this.CONSUME(Tokens.StringLiteral) },
        { GATE: () => skipCheck || isIntegerAssignable(knownType), ALT: () => this.CONSUME(Tokens.HexConst) },
        { GATE: () => skipCheck || isIntegerAssignable(knownType) || knownType === "Double", ALT: () => this.CONSUME(Tokens.IntConst) },
        { GATE: () => skipCheck || isDoubleAssignable(knownType), ALT: () => this.CONSUME(Tokens.DoubleConst) },
        { GATE: () => skipCheck || isMapAssignable(knownType), ALT: () => this.SUBRULE(this.mapConst) },
        { GATE: () => skipCheck || isListAssignable(knownType), ALT: () => this.SUBRULE(this.listConst) },
        { ALT: () => this.CONSUME(Tokens.Identifier) }
      ],
      ERR_MSG: errorMessage
    });
  });

  private cppType = this.RULE(Rules.CPPType, () => {
    this.CONSUME(Tokens.CPPType);
    this.CONSUME(Tokens.StringLiteral);
  });

  private listConst = this.RULE(Rules.ListConst, () => {
    this.CONSUME(Tokens.LBracket);
    this.MANY_SEP({
      SEP: Tokens.Comma,
      DEF: () => this.SUBRULE(this.constValue, { LABEL: "value" })
    });
    this.CONSUME(Tokens.RBracket);
  });

  private mapConst = this.RULE(Rules.MapConst, () => {
    this.CONSUME(Tokens.LCurly);

    this.MANY(() => this.SUBRULE(this.mapValue, { LABEL: "values" }));

    // There could be a trailing list separator
    this.OPTION(() => this.CONSUME2(Tokens.ListSeparator));

    this.CONSUME(Tokens.RCurly);
  });

  private mapValue = this.RULE(Rules.MapValue, () => {
    this.SUBRULE1(this.comments);

    this.OPTION1(() => {
      // Map rule is also used for const struct definitions, will need to split this out
      this.SUBRULE2(this.constValue, { LABEL: "key" });
      this.CONSUME(Tokens.Colon);
      this.SUBRULE3(this.constValue, { LABEL: "value" });
      this.OPTION2(() => this.CONSUME(Tokens.ListSeparator));
    });
  });

  private baseType = this.RULE(Rules.BaseType, () => {
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

  private containerType = this.RULE(Rules.ContainerType, () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.mapType) },
      { ALT: () => this.SUBRULE(this.listType) },
      { ALT: () => this.SUBRULE(this.setType) }
    ]);
  });

  private definitionType = this.RULE(Rules.DefinitionType, () => {
    this.OR([{ ALT: () => this.SUBRULE(this.baseType) }, { ALT: () => this.SUBRULE(this.containerType) }]);
    this.OPTION(() => this.SUBRULE(this.annotations));
  });

  private type = this.RULE(Rules.Type, () => {
    this.SUBRULE(this.comments, { ARGS: [false] });
    this.OR([{ ALT: () => this.SUBRULE(this.definitionType) }, { ALT: () => this.CONSUME(Tokens.Identifier) }]);
  });

  private mapType = this.RULE(Rules.MapType, () => {
    this.CONSUME(Tokens.Map);
    this.OPTION(() => this.SUBRULE(this.cppType, { LABEL: "cpp_type" }));
    this.CONSUME(Tokens.LTemplate);
    this.SUBRULE1(this.type, { LABEL: "key_type" });
    this.CONSUME(Tokens.Comma);
    this.SUBRULE2(this.type, { LABEL: "value_type" });
    this.CONSUME(Tokens.RTemplate);
  });

  private listType = this.RULE(Rules.ListType, () => {
    this.CONSUME(Tokens.List);
    this.CONSUME(Tokens.LTemplate);
    this.SUBRULE(this.type, { LABEL: "value_type" });
    this.CONSUME(Tokens.RTemplate);
    this.OPTION(() => this.SUBRULE(this.cppType));
  });

  private setType = this.RULE(Rules.SetType, () => {
    this.CONSUME(Tokens.Set);
    this.OPTION(() => this.SUBRULE(this.cppType));
    this.CONSUME(Tokens.LTemplate);
    this.SUBRULE(this.type, { LABEL: "value_type" });
    this.CONSUME(Tokens.RTemplate);
  });

  private constDefinition = this.RULE(Rules.Const, () => {
    this.CONSUME(Tokens.Const);
    const type = findTypeName(this.SUBRULE(this.type, { LABEL: "value_type" }) as ParseNode);
    this.CONSUME(Tokens.Identifier, { LABEL: "id" });
    this.CONSUME(Tokens.Assignment);
    this.SUBRULE(this.constValue, { LABEL: "value", ARGS: [type, "const"] });

    // It is possible to have a semi-colon at the end of a const statement;
    // just consume it and move forward
    this.OPTION(() => this.CONSUME(Tokens.Semi));
  });
}

export const ThriftParser = new ThriftCstParser();
