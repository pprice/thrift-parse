import { getMatchingSnapshotAssets, getTestAssetContent } from "../../test-util/util";

import { ThriftGrammar } from "../../grammar";
import { getGeneratorFactory } from "..";

describe("JSON Generation", () => {
  const testSet = getMatchingSnapshotAssets("json").map(i => [i.input, i.output]);
  const generatorFactory = getGeneratorFactory("json-o");

  test.skip.each(testSet)("should generate %s to %s", async (thriftInput, jsonOutput) => {
    const grammar = new ThriftGrammar();
    const parsed = grammar.parse(await getTestAssetContent(thriftInput));

    const generator = generatorFactory(null);
    const result = await generator.process(parsed.cst);

    expect(result.errors).toHaveLength(0);
    expect(result.output[0].type).toEqual("object");

    if (result.output[0].type !== "object") {
      throw new Error();
    }

    expect(result.output[0].value).toEqual(JSON.parse(await getTestAssetContent(jsonOutput)));
  });
});
