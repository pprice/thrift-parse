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

export type StructType = {
  typeId: "struct";
  type: {
    typeId: "struct";
    class: string;
  };
};

export type ExceptionType = {
  typeId: "exception";
  type: {
    typeId: "exception";
    class: string;
  };
};

export type UnionType = {
  typeId: "union";
  type: {
    typeId: "union";
    class: string;
  };
};

export type ListType = {
  typeId: "list";
  type: {
    typeId: "list";
    elementTypeId: TypeKeys;
    elementType: ThriftType;
  };
};

export type SetType = {
  typeId: "set";
  type: {
    typeId: "set";
    elementTypeId: TypeKeys;
    elementType: ThriftType;
  };
};

export type MapType = {
  typeId: "map";
  type: {
    typeId: "map";
    valueTypeId: TypeKeys;
    valueType: ThriftType;
    elementTypeId: TypeKeys;
    elementType: ThriftType;
  };
};

export type ThriftType = AnnotationNode &
  (RefType | UnknownType | BaseType | StructType | ExceptionType | UnionType | ListType | MapType | SetType);

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
    value: unknown;
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

export type ThriftAstRoot = DocumentNode & {
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
