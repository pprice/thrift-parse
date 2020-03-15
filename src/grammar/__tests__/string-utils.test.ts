import { nextIndex, previousIndex } from "../string-utils";

describe("string-utils", () => {
  const COLON = ":".charCodeAt(0);

  describe("next_index", () => {
    it("should find the next index from the start of the string", () => {
      const test = "aaaa:bbbb:cccc:dddd";
      const index = nextIndex(test, COLON, 0);
      expect(index).toEqual(4);
    });

    it("should find the next index from within a string", () => {
      const test = "aaaa:bbbb:cccc:dddd";
      const index = nextIndex(test, COLON, 5);
      expect(index).toEqual(9);
    });

    it("should return the same index when there is a match at the starting position", () => {
      const test = "aaaa:bbbb:cccc:dddd";
      const index = nextIndex(test, COLON, 4);
      expect(index).toEqual(4);
    });

    it("should return -1 when no occurrences can be found", () => {
      const test = "aaaa";
      const index = nextIndex(test, COLON, 0);
      expect(index).toEqual(-1);
    });
  });

  describe("previous_index", () => {
    it("should find the next index from the start of the string", () => {
      const test = "aaaa:bbbb:cccc:dddd";
      const index = previousIndex(test, COLON, test.length - 1);
      expect(index).toEqual(14);
    });

    it("should find the next index from within a string", () => {
      const test = "aaaa:bbbb:cccc:dddd";
      const index = previousIndex(test, COLON, 10);
      expect(index).toEqual(9);
    });

    it("should return the same index when there is a match at the starting position", () => {
      const test = "aaaa:bbbb:cccc:dddd";
      const index = previousIndex(test, COLON, 4);
      expect(index).toEqual(4);
    });

    it("should return -1 when no occurrences can be found", () => {
      const test = "aaaa";
      const index = previousIndex(test, COLON, 0);
      expect(index).toEqual(-1);
    });
  });
});
