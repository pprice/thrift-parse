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
