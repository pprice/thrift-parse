import {
  AnnotationNode,
  RefType,
  ThriftAstRoot,
  ThriftConstant,
  ThriftEnum,
  ThriftEnumMember,
  ThriftField,
  ThriftFunction,
  ThriftNamespace,
  ThriftService,
  ThriftStruct,
  ThriftType,
  ThriftTypedef,
  TypeKeys
} from "./types";
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

type Input<TParent = ThriftAstRoot, TState = unknown, TNode = ParseNode> = VisitorInput<TParent, TState, TNode>;
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
  fieldTarget?: () => ThriftField[];
};

type EnumState = State & {
  lastMemberIndex: number;
};

export class AstGenerator extends Generator<ObjectOutput<ThriftAstRoot>, ThriftAstRoot, State> {
  protected async getInitialState(): Promise<OnBeforeVisitResult<ThriftAstRoot>> {
    const root: ThriftAstRoot = {
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

  protected includeRule({ node, parentAst }: Input): Result {
    let includeName = firstPayload<string>(node, "StringLiteral");

    // Strip trailing ".thrift"
    includeName = includeName.replace(/\.thrift$/, "");
    parentAst.includes.push(includeName);

    return StopResult;
  }

  protected annotationRule({ node, parentAst }: Input<AnnotationNode>): Result {
    if (!parentAst.annotations) {
      parentAst.annotations = {};
    }

    const id = identifierOf(node);
    const value = firstPayload<string>(node, "StringLiteral");

    parentAst.annotations[id] = value;

    return StopResult;
  }

  protected namespaceRule({ node, parentAst }: Input): Result {
    // TODO: Wildcard support
    // TODO: Nested annotations
    const name = identifierOf(node, 0);
    const value = identifierOf(node, 1);

    const namespaceNode: ThriftNamespace = {
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

  protected enumRule({ node, parentAst, nodes }: Input): Result<EnumState> {
    const id = identifierOf(node);
    const container = findByName<WithComments>(nodes, "DefinitionRule");
    const comments = extractComments(container, "Doc");

    console.dir(comments);

    const enumNode: ThriftEnum = {
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

  protected enumValueRule({ node, state, parentAst }: Input<ThriftEnum, EnumState, EnumValueNode>): Result<EnumState> {
    const id = identifierOf(node);
    let value: number = firstPayload(node, "HexConst", "IntegerConst");

    // TODO: Consider refactoring grammar to have assignment RHS in an isolated node
    const assignedId: string = identifierOf(node, 1);

    if (value == undefined) {
      value = ++state.lastMemberIndex;
    }

    const member: ThriftEnumMember = {
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

  protected constRule({ node, parentAst }: Input): Result {
    const constNode: ThriftConstant = {
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

  protected typeDefRule({ node, parentAst }: Input): Result {
    const typeDefNode: ThriftTypedef = {
      node: "typedef",
      name: identifierOf(node),
      typeId: "unknown"
    };

    parentAst.typedefs.push(typeDefNode);

    return {
      astNode: typeDefNode
    };
  }

  protected typeRule({ node, parentAst, state }: Input<ThriftType, State>): Result {
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

  protected baseTypeRule({ node, parentAst, nodes }: Input<ThriftType>): Result {
    const typeNode = firstExists(node, "I16", "I32", "I64", "Bool", "Byte", "Binary", "String", "Double");

    parentAst.typeId = BaseTypeMap[typeNode];

    return {
      astNode: typeNode
    };
  }

  protected constValueRule({ node, parentAst, nodes }: Input<ThriftConstant>): Result {
    // TODO: Boolean const
    const identifier = identifierOf(node);

    if (identifier) {
      parentAst.value = identifier;
      return {
        stop: true
      };
    }

    const basicValue = firstPayload(node, "StringLiteral", "HexConst", "IntegerConst", "DoubleConst", "BooleanLiteral");
    parentAst.value = basicValue || null;

    return {
      astNode: parentAst,
      stop: basicValue != null
    };
  }

  protected structRule({ node, parentAst }: Input): Result {
    const structNode: ThriftStruct = {
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

  protected exceptionRule({ node, parentAst }: Input): Result {
    const structNode: ThriftStruct = {
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

  protected unionRule({ node, parentAst }: Input): Result {
    const structNode: ThriftStruct = {
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

  protected fieldRule({ node, parentAst, state }: Input<ThriftStruct, State>): Result {
    const fieldNode: ThriftField = {
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

  protected fieldIdRule({ node, parentAst }: Input<ThriftField>): Result {
    const id = firstPayload<number>(node, "IntegerConst");
    parentAst.key = id;

    return StopResult;
  }

  protected fieldReqRule({ node, parentAst }: Input<ThriftField>): Result {
    const optional = firstExists(node, "Optional");
    const required = firstExists(node, "Required");

    parentAst.required = optional ? "optional" : required ? "required" : "req_out";

    return StopResult;
  }

  protected serviceRule({ node, parentAst }: Input): Result {
    const serviceNode: ThriftService = {
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

  protected functionRule({ node, parentAst }: Input<ThriftService>): Result<State> {
    const functionNode: ThriftFunction = {
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
        fieldTarget: (): ThriftField[] => functionNode.arguments
      }
    };
  }

  protected functionThrowsRule({ node, parentAst }: Input<ThriftFunction>): Result<State> {
    return {
      state: {
        fieldTarget: (): ThriftField[] => parentAst.exceptions
      }
    };
  }

  protected async getOutputs(root?: ThriftAstRoot): Promise<ObjectOutput<ThriftAstRoot>[]> {
    return [
      {
        type: "object",
        value: root
      }
    ];
  }
}
