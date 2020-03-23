import { NodeName, ParseNode } from "./types";

export function findByName<T extends ParseNode = ParseNode>(nodes: ParseNode[], name: NodeName): T | null {
  if (!nodes || nodes.length == 0) {
    return null;
  }

  const match = nodes.find(n => n.name === name);
  return (match as T) || null;
}

export function findClosestByName<T extends ParseNode = ParseNode>(nodes: ParseNode[], name: NodeName): T | null {
  const queue: ParseNode[] = [...nodes];

  while (queue.length > 0) {
    const tail = queue.pop();

    if (tail.name === name) {
      return tail as T;
    }

    const childKeys = tail.children && Object.keys(tail.children);
    const hasChildren = childKeys?.length;

    if (hasChildren) {
      for (const key of childKeys) {
        const children: ParseNode[] = tail.children[key];
        queue.push(...children.reverse());
      }
    }
  }

  return null;
}
