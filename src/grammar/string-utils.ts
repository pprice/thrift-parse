export function nextIndex(str: string, char: number, start: number): number {
  while (start < str.length) {
    if (str.charCodeAt(start) === char) {
      return start;
    }

    start++;
  }

  return -1;
}

export function previousIndex(str: string, char: number, start: number): number {
  while (start >= 0) {
    if (str.charCodeAt(start) === char) {
      return start;
    }

    start--;
  }

  return -1;
}

export function previousIndices(str: string, char: number, start: number, max: number = Number.MAX_SAFE_INTEGER): number[] {
  let current = start;
  const items = [];
  while (items.length < max && current >= 0) {
    current = previousIndex(str, char, current);
    items.push(current);
    current--;
  }

  return items;
}

export function nextIndices(str: string, char: number, start: number, max: number = Number.MAX_SAFE_INTEGER): number[] {
  let current = start;
  const items = [];
  while (items.length < max && current >= 0) {
    current = nextIndex(str, char, current);
    items.push(current);
    current++;
  }

  return items;
}
