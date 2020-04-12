export type AnnotationNode = {
  annotations?: { [key: string]: string };
};

export type DocumentNode = {
  doc?: string;
};

export type DefaultNode = AnnotationNode & DocumentNode;

export type UnknownType = {
  typeId: "unknown";
};

export type RefType = {
  typeId: "ref";
  type: {
    typeId: "ref";
    name: string;
  };
};

export type BaseType = {
  typeId: "i8" | "i16" | "i32" | "i64" | "string" | "binary" | "bool" | "double";
};

export type StructLikeType<T> = {
  typeId: T;
  type: {
    typeId: T;
    class: string;
  };
};

export type StructType = StructLikeType<"struct">;
export type ExceptionType = StructLikeType<"exception">;
export type UnionType = StructLikeType<"union">;

type ListLikeType<T> = {
  typeId: T;
  type: {
    typeId: T;
    elemTypeId: TypeKeys;
    elemType?: ThriftType;
  };
};

export type ListType = ListLikeType<"list">;
export type SetType = ListLikeType<"set">;

export type MapType = {
  typeId: "map";
  type: {
    typeId: "map";
    valueTypeId: TypeKeys;
    valueType?: ThriftType;
    keyTypeId: TypeKeys;
    keyType?: ThriftType;
  };
};

export type ThriftReferenceValue = {
  node: "refValue";
  identifier: string;
};

export type ThriftType = AnnotationNode &
  (RefType | UnknownType | BaseType | StructType | ExceptionType | UnionType | ListType | MapType | SetType);

export type ThriftMapValueElement = { node: "mapValueElement"; key: ThriftValue; value: ThriftValue };

export type ThriftBooleanValue = {
  node: "booleanValue";
  value: boolean;
};

export type ThriftStringValue = {
  node: "stringValue";
  value: string;
};

export type ThriftNumberValue = {
  node: "numberValue";
  value: number;
};

export type ThriftMapValue = {
  node: "mapValue";
  value: ThriftMapValueElement[];
};

export type ThriftListValue = {
  node: "listValue";
  value: ThriftValue[];
};

export type ThriftStubValue = {
  node: "stubValue";
};

export type ThriftValue =
  | ThriftBooleanValue
  | ThriftStringValue
  | ThriftNumberValue
  | ThriftMapValue
  | ThriftListValue
  | ThriftStubValue
  | ThriftReferenceValue;

export type TypeKeys = ThriftType["typeId"];

export type ThriftNamespace = DefaultNode & {
  node: "namespace";
  name: string;
  value: string;
};

export type ThriftEnumMember = {
  node: "member";
  name: string;
  value: number;
};

export type ThriftEnum = DefaultNode & {
  node: "enum";
  name: string;
  members: ThriftEnumMember[];
};

export type ThriftTypedef = ThriftType &
  DefaultNode & {
    node: "typedef";
    name: string;
  };

export type ThriftField = DefaultNode &
  ThriftType & {
    node: "field";
    key: number;
    name: string;
    required: "required" | "req_out" | "optional";
  };

export type ThriftStruct = DefaultNode & {
  node: "struct";
  name: string;
  isException: boolean;
  isUnion: boolean;
  fields: ThriftField[];
};

export type ThriftConstant = DefaultNode &
  ThriftType & {
    node: "const";
    name: string;
    value: ThriftValue;
  };

export type ThriftFunction = DefaultNode & {
  node: "function";
  name: string;
  returnTypeId: TypeKeys | "void";
  returnType?: ThriftType;
  oneway: boolean;
  arguments: ThriftField[];
  exceptions: ThriftField[];
};

export type ThriftService = DefaultNode & {
  node: "service";
  name: string;
  extends?: string;
  functions: ThriftFunction[];
};

export type ThriftRoot = DocumentNode & {
  node: "document";
  name: string;
  namespaces: ThriftNamespace[];
  includes: string[];
  enum: ThriftEnum[];
  typedefs: ThriftTypedef[];
  structs: ThriftStruct[];
  constants: ThriftConstant[];
  services: ThriftService[];
};

export type ThriftNode =
  | ThriftRoot
  | ThriftService
  | ThriftFunction
  | ThriftConstant
  | ThriftConstant
  | ThriftEnum
  | ThriftEnumMember
  | ThriftNamespace
  | ThriftTypedef
  | ThriftStruct
  | ThriftField
  | ThriftFunction
  | ThriftValue;
