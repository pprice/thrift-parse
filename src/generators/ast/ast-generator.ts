import * as astTypes from "./types";

import {
  EnumValueNode,
  ParseNode,
  WithComments,
  extractComments,
  findByName,
  firstExists,
  firstPayload,
  identifierOf
} from "../../grammar/nodes";
import { Generator, ObjectOutput, OnBeforeVisitResult, VisitorInput, VisitorResult } from "../generator";

import { Rules } from "../../grammar/parser";

type Input<TParent = astTypes.ThriftAstRoot, TState = State, TNode = ParseNode> = VisitorInput<TParent, TState, TNode>;
type Result<TState extends State = State> = VisitorResult<unknown, TState>;

const StopResult: Result = {
  stop: true
};

const PassResult: Result = {};

const BaseTypeMap = {
  I16: "i16",
  I32: "i32",
  I64: "i64",
  Bool: "bool",
  Double: "double",
  String: "string",
  Binary: "binary",
  Byte: "i8"
};

type State = {
  typeTarget?: () => [string, string];
  fieldTarget?: () => astTypes.ThriftField[];
};

type EnumState = State & {
  lastMemberIndex: number;
};

export class AstGenerator extends Generator<ObjectOutput<astTypes.ThriftAstRoot>, astTypes.ThriftAstRoot, State> {
  protected async getInitialState(): Promise<OnBeforeVisitResult<astTypes.ThriftAstRoot>> {
    const root: astTypes.ThriftAstRoot = {
      node: "document",
      name: "UNKNOWN",
      namespaces: [],
      includes: [],
      enum: [],
      typedefs: [],
      structs: [],
      constants: [],
      services: []
    };

    return {
      generated: root,
      state: undefined
    };
  }

  protected async getOutputs(root?: astTypes.ThriftAstRoot): Promise<ObjectOutput<astTypes.ThriftAstRoot>[]> {
    return [
      {
        type: "object",
        value: root
      }
    ];
  }

  // --------------------------------------------------------------------------
  // Types
  // --------------------------------------------------------------------------
  protected [Rules.Type]({ node, parentAst, state }: Input<astTypes.ThriftType>): Result {
    const identifier = identifierOf(node);

    const [typeId, type] = state?.typeTarget?.() || ["typeId", "type"];

    if (identifier) {
      parentAst[typeId] = "ref";
      parentAst[type] = {
        typeId: "ref",
        name: identifier
      };
      return StopResult;
    }

    return PassResult;
  }

  protected [Rules.BaseType]({ node, parentAst, state }: Input<astTypes.ThriftType>): Result {
    const typeNode = firstExists(node, "I16", "I32", "I64", "Bool", "Byte", "Binary", "String", "Double");
    const [typeId] = state?.typeTarget?.() || ["typeId"];

    parentAst[typeId] = BaseTypeMap[typeNode];

    return {
      astNode: typeNode
    };
  }

  // --------------------------------------------------------------------------
  // Map Types
  // --------------------------------------------------------------------------
  protected [Rules.MapType]({ parentAst, state }: Input<astTypes.ThriftType>): Result {
    const [typeId, type] = state?.typeTarget?.() || ["typeId", "type"];

    parentAst[typeId] = "map";
    parentAst[type] = {
      typeId: "map",
      keyTypeId: "unknown",
      valueTypeId: "unknown"
    };

    return {
      astNode: parentAst[type] // Enable type recursion
    };
  }

  protected [Rules.MapKeyType](): Result {
    return {
      state: {
        typeTarget: (): [string, string] => ["keyTypeId", "keyType"]
      }
    };
  }

  protected [Rules.MapValueType](): Result {
    return {
      state: {
        typeTarget: (): [string, string] => ["valueTypeId", "valueType"]
      }
    };
  }

  // --------------------------------------------------------------------------
  // List/Set Types
  // --------------------------------------------------------------------------
  protected [Rules.ListType]({ parentAst, state }: Input<astTypes.ThriftType>): Result {
    const [typeId, type] = state?.typeTarget?.() || ["typeId", "type"];

    parentAst[typeId] = "list";
    parentAst[type] = {
      typeId: "list",
      elementTypeId: "unknown"
    };

    return {
      astNode: parentAst[type], // Enable type recursion
      state: {
        typeTarget: (): [string, string] => ["elementTypeId", "elementType"]
      }
    };
  }

  protected [Rules.SetType]({ parentAst, state }: Input<astTypes.ThriftType>): Result {
    const [typeId, type] = state?.typeTarget?.() || ["typeId", "type"];

    parentAst[typeId] = "set";
    parentAst[type] = {
      typeId: "set",
      elementTypeId: "unknown"
    };

    return {
      astNode: parentAst[type], // Enable type recursion
      state: {
        typeTarget: (): [string, string] => ["elementTypeId", "elementType"]
      }
    };
  }

  // --------------------------------------------------------------------------
  // Trivia Rules
  // --------------------------------------------------------------------------
  protected [Rules.Annotation]({ node, parentAst }: Input<astTypes.AnnotationNode>): Result {
    if (!parentAst.annotations) {
      parentAst.annotations = {};
    }

    const id = identifierOf(node);
    const value = firstPayload<string>(node, "StringLiteral");

    parentAst.annotations[id] = value;

    return StopResult;
  }

  // --------------------------------------------------------------------------
  // Header Rules
  // --------------------------------------------------------------------------
  protected [Rules.Include]({ node, parentAst }: Input): Result {
    let includeName = firstPayload<string>(node, "StringLiteral");

    // Strip trailing ".thrift"
    includeName = includeName.replace(/\.thrift$/, "");
    parentAst.includes.push(includeName);

    return StopResult;
  }

  protected [Rules.Namespace]({ node, parentAst }: Input): Result {
    // TODO: Wildcard support
    // TODO: Nested annotations
    const name = identifierOf(node, 0);
    const value = identifierOf(node, 1);

    const namespaceNode: astTypes.ThriftNamespace = {
      node: "namespace",
      name,
      value
    };

    parentAst.namespaces.push(namespaceNode);

    return {
      astNode: namespaceNode,
      stop: false // May have annotations
    };
  }

  // --------------------------------------------------------------------------
  // Definition Rules
  // --------------------------------------------------------------------------
  protected [Rules.TypeDef]({ node, parentAst }: Input): Result {
    const typeDefNode: astTypes.ThriftTypedef = {
      node: "typedef",
      name: identifierOf(node),
      typeId: "unknown"
    };

    parentAst.typedefs.push(typeDefNode);

    return {
      astNode: typeDefNode
    };
  }

  protected [Rules.Enum]({ node, parentAst, nodes }: Input): Result<EnumState> {
    const id = identifierOf(node);
    const container = findByName<WithComments>(nodes, "DefinitionRule");
    const comments = extractComments(container, "Doc");

    console.dir(comments);

    const enumNode: astTypes.ThriftEnum = {
      node: "enum",
      name: id,
      doc: comments.length > 0 ? comments[0].value : undefined,
      members: []
    };

    parentAst.enum.push(enumNode);

    return {
      astNode: enumNode,
      state: {
        lastMemberIndex: 0
      }
    };
  }

  protected [Rules.EnumValue]({ node, state, parentAst }: Input<astTypes.ThriftEnum, EnumState, EnumValueNode>): Result<EnumState> {
    const id = identifierOf(node);
    let value: number = firstPayload(node, "HexConst", "IntegerConst");

    // TODO: Consider refactoring grammar to have assignment RHS in an isolated node
    // const assignedId: string = identifierOf(node, 1);

    if (value == undefined) {
      value = ++state.lastMemberIndex;
    }

    const member: astTypes.ThriftEnumMember = {
      node: "member",
      name: id,
      value: value
    };

    parentAst.members.push(member);
    state.lastMemberIndex = value;

    return {
      astNode: member,
      state,
      stop: true
    };
  }

  protected [Rules.Const]({ node, parentAst }: Input): Result {
    const constNode: astTypes.ThriftConstant = {
      node: "const",
      name: identifierOf(node),
      value: null,
      typeId: "unknown"
    };

    parentAst.constants.push(constNode);

    return {
      astNode: constNode
    };
  }

  protected [Rules.ConstValue]({ node, parentAst }: Input<astTypes.ThriftConstant>): Result {
    // TODO: Boolean const
    const identifier = identifierOf(node);

    if (identifier) {
      parentAst.value = identifier;
      return {
        stop: true
      };
    }

    const basicValue = firstPayload(node, "StringLiteral", "HexConst", "IntegerConst", "DoubleConst", "BooleanConst");
    parentAst.value = basicValue || null;

    return {
      astNode: parentAst,
      stop: basicValue != null
    };
  }

  protected [Rules.Struct]({ node, parentAst }: Input): Result {
    const structNode: astTypes.ThriftStruct = {
      node: "struct",
      name: identifierOf(node),
      isException: false,
      isUnion: false,
      fields: []
    };

    parentAst.structs.push(structNode);

    return {
      astNode: structNode
    };
  }

  protected [Rules.Exception]({ node, parentAst }: Input): Result {
    const structNode: astTypes.ThriftStruct = {
      node: "struct",
      name: identifierOf(node),
      isException: true,
      isUnion: false,
      fields: []
    };

    parentAst.structs.push(structNode);

    return {
      astNode: structNode
    };
  }

  protected [Rules.Union]({ node, parentAst }: Input): Result {
    const structNode: astTypes.ThriftStruct = {
      node: "struct",
      name: identifierOf(node),
      isException: false,
      isUnion: true,
      fields: []
    };

    parentAst.structs.push(structNode);

    return {
      astNode: structNode
    };
  }

  protected [Rules.Service]({ node, parentAst }: Input): Result {
    const serviceNode: astTypes.ThriftService = {
      node: "service",
      name: identifierOf(node, 0),
      functions: []
    };

    if (firstExists(node, "Extends")) {
      serviceNode.extends = identifierOf(node, 1);
    }

    parentAst.services.push(serviceNode);

    return {
      astNode: serviceNode
    };
  }

  // --------------------------------------------------------------------------
  // Fields and functions
  // --------------------------------------------------------------------------
  protected [Rules.Field]({ node, parentAst, state }: Input<astTypes.ThriftStruct, State>): Result {
    const fieldNode: astTypes.ThriftField = {
      node: "field",
      name: identifierOf(node),
      required: "req_out",
      typeId: "unknown",
      key: -1
    };

    // TODO: This can happen when there are no post comments to consume
    if (!fieldNode.name) {
      return StopResult;
    }

    const target = state?.fieldTarget?.() || parentAst.fields;

    target.push(fieldNode);

    return {
      astNode: fieldNode
    };
  }

  protected [Rules.FieldId]({ node, parentAst }: Input<astTypes.ThriftField>): Result {
    const id = firstPayload<number>(node, "IntegerConst");
    parentAst.key = id;

    return StopResult;
  }

  protected [Rules.FieldReq]({ node, parentAst }: Input<astTypes.ThriftField>): Result {
    const optional = firstExists(node, "Optional");
    const required = firstExists(node, "Required");

    parentAst.required = optional ? "optional" : required ? "required" : "req_out";

    return StopResult;
  }

  protected [Rules.Function]({ node, parentAst }: Input<astTypes.ThriftService>): Result<State> {
    const functionNode: astTypes.ThriftFunction = {
      node: "function",
      name: identifierOf(node),
      arguments: [],
      exceptions: [],
      returnTypeId: "void",
      oneway: firstExists(node, "OneWay") != undefined
    };

    parentAst.functions.push(functionNode);

    return {
      astNode: functionNode,
      state: {
        typeTarget: (): [string, string] => ["returnTypeId", "returnType"],
        fieldTarget: (): astTypes.ThriftField[] => functionNode.arguments
      }
    };
  }

  protected [Rules.FunctionThrows]({ parentAst }: Input<astTypes.ThriftFunction>): Result<State> {
    return {
      state: {
        fieldTarget: (): astTypes.ThriftField[] => parentAst.exceptions
      }
    };
  }
}
