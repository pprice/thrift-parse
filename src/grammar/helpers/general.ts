import { IToken } from "chevrotain";

export function collectPayloads<T = string>(tokens: IToken[], filter = true): (T | null)[] {
  const mapped = tokens.map(t => t.payload);

  if (filter) {
    return mapped.filter(Boolean);
  }

  return mapped;
}
