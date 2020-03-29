import { IToken } from "chevrotain";
import { ParseNode } from "./types";
import { TokenName } from "../lexer";

export function collectPayloads<T = string>(tokens: IToken[], filter = true): (T | null)[] {
  const mapped = tokens.map(t => t.payload);

  if (filter) {
    return mapped.filter(Boolean);
  }

  return mapped;
}

export function child(node: ParseNode, ...tokens: TokenName[]): ParseNode | undefined {
  if (!node || !node.children) {
    return undefined;
  }

  for (const key of tokens) {
    const child = node.children[key];

    if (child?.[0]) {
      return child[0] as ParseNode;
    }
  }

  return undefined;
}

export function firstPayload<T>(node: ParseNode, ...tokens: TokenName[]): T | undefined {
  if (!node || !node.children) {
    return undefined;
  }

  for (const key of tokens) {
    const child = node.children[key];

    if (child?.[0].payload !== undefined) {
      return child[0].payload;
    }
  }

  return undefined;
}

export function identifierOf(node: ParseNode, idx = 0): string | undefined {
  if (!node || !node.children || !node.children.Identifier) {
    return undefined;
  }

  return node.children.Identifier[idx]?.image;
}
