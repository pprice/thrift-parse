import { ParseNode, TokenName } from "./types";

import { Extends } from "../../lib/type";

export type BaseTypeName = Extends<TokenName, "I16" | "I32" | "I64" | "Double" | "Byte" | "Binary" | "Bool" | "String">;
export type ContainerTypeName = Extends<TokenName, "Map" | "Set" | "List">;
export type IdentifierTypeName = Extends<TokenName, "Identifier">;
export type TypeName = BaseTypeName | ContainerTypeName | IdentifierTypeName;

export function isIntegerAssignable(name: TypeName): boolean {
  return name === "Byte" || name === "Bool" || name === "I16" || name === "I32" || name === "I64" || name === "Double";
}

export function isStringAssignable(name: TypeName): boolean {
  return name === "String" || name === "Binary";
}

export function isBooleanAssignable(name: TypeName): boolean {
  return name === "Bool";
}

export function isDoubleAssignable(name: TypeName): boolean {
  return name === "Double";
}

export function isListAssignable(name: TypeName): boolean {
  return name === "List" || name === "Set";
}

export function isMapAssignable(name: TypeName): boolean {
  return name === "Map";
}

function baseTypeNodeToTypeName(node: ParseNode): BaseTypeName | null {
  if (node.children.Double) {
    return "Double";
  } else if (node.children.I16) {
    return "I16";
  } else if (node.children.I32) {
    return "I32";
  } else if (node.children.I64) {
    return "I64";
  } else if (node.children.Byte) {
    return "Byte";
  } else if (node.children.Binary) {
    return "Binary";
  } else if (node.children.String) {
    return "String";
  } else if (node.children.Bool) {
    return "Bool";
  }

  return null;
}

function containerTypeNodeToTypeName(node: ParseNode): ContainerTypeName | null {
  if (node.children.MapTypeRule) {
    return "Map";
  } else if (node.children.SetTypeRule) {
    return "Set";
  } else if (node.children.ListTypeRule) {
    return "List";
  }

  return null;
}

export function findTypeName(node: ParseNode): TypeName | null {
  //   if (node.name === "TypeRule") {
  //     node = node.children.TypeRule[0];
  //   }

  if (node.tokenType) {
    if (node.tokenType.name === "Identifier") {
      return "Identifier";
    }
  } else if (node.children.Identifier) {
    return "Identifier";
  } else if (node.children.DefinitionTypeRule) {
    node = node.children.DefinitionTypeRule[0];
    if (node.children.BaseTypeRule) {
      return baseTypeNodeToTypeName(node.children.BaseTypeRule[0]);
    } else if (node.children.ContainerTypeRule) {
      return containerTypeNodeToTypeName(node.children.ContainerTypeRule[0]);
    }
  }

  return null;
}
