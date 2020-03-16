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
    ["string", `[]`]
  ];

  test.each(failureCases)("should fail to assign %s to %s", (type, assignment) => {
    const grammar = new ThriftGrammar();
    const test = `
      const ${type} foo = ${assignment};
    `;
    const result = grammar.parse(test);

    expect(result.errors.parse.length).toBeGreaterThan(0);
  });
});
