export function next_index(str: string, char: number, start: number) {
  while (start < str.length) {
    if (str.charCodeAt(start) === char) {
      return start;
    }

    start++;
  }

  return -1;
}

export function previous_index(str: string, char: number, start: number) {
  while (start >= 0) {
    if (str.charCodeAt(start) === char) {
      return start;
    }

    start--;
  }

  return -1;
}

export function get_next_previous_index(str: string, char: number, index: number) {
  return [previous_index(str, char, index), next_index(str, char, index)];
}

export function previous_indices(str: string, char: number, start: number, max: number = Number.MAX_SAFE_INTEGER): number[] {
  let current = start;
  let items = [];
  while (items.length < max && current >= 0) {
    current = previous_index(str, char, current);
    items.push(current);
    current--;
  }

  return items;
}

export function next_indices(str: string, char: number, start: number, max: number = Number.MAX_SAFE_INTEGER): number[] {
  let current = start;
  let items = [];
  while (items.length < max && current >= 0) {
    current = next_index(str, char, current);
    items.push(current);
    current++;
  }

  return items;
}
