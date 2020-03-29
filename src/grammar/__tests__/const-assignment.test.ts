import { ThriftGrammar } from "../api";

describe("Constant Assignment", () => {
  const failureCases = [
    ["i16", `"bar"`],
    ["i32", `"bar"`],
    ["i64", `"bar"`],
    ["double", `"bar"`],
    ["byte", `"bar"`],
    ["map<i32, i32>", `"bar"`],
    ["list<i32>", `"bar"`],
    ["set<i32>", `"bar"`],
    ["string", `1234`],
    ["string", `1234.00`],
    ["string", `0xFFFF`],
    ["string", `{}`],
    ["string", `[]`],
    ["bool", `{}`],
    ["bool", `"string"`]
  ];

  const successCases = [
    ["i16", `2`],
    ["i32", `5`],
    ["i32", `0xffff`],
    ["i64", `6`],
    ["double", `1.1`],
    ["byte", `255`],
    ["map<i32, i32>", `{ 1: 2 }`],
    ["list<i32>", `[1, 2, 3]`],
    ["set<i32>", `[1, 2, 3]`],
    ["string", `"hi"`],
    ["binary", `"hi"`],
    ["bool", `true`],
    ["bool", `false`],
    ["bool", `1`],
    ["bool", `0`]
  ];

  test.each(failureCases)("should fail to assign %s to %s", (type, assignment) => {
    const grammar = new ThriftGrammar();
    const test = `
      const ${type} foo = ${assignment};
    `;
    const result = grammar.parse(test);

    expect(result.errors.parse.length).toBeGreaterThan(0);
  });

  test.each(successCases)("should assign %s to %s", (type, assignment) => {
    const grammar = new ThriftGrammar();
    const test = `
      const ${type} foo = ${assignment};
    `;
    const result = grammar.parse(test);

    expect(result.errors.parse.length).toEqual(0);
    expect(result.cst).toBeDefined();
  });
});
