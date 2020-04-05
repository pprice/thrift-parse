import { TsEnumGenerator } from "./recast/ts-enum";
import { GeneratorConfig, Generator } from "./types";
import { JsonObjectGenerator, JsonStringGenerator } from "./json/json-generator";

export * from "./types";
export { Generator };

type GeneratorFactory<T extends GeneratorConfig> = (config: T) => Generator;

export function getGeneratorFactory<T extends GeneratorConfig = GeneratorConfig>(name: string): GeneratorFactory<T> | null {
  if (name === "ts-enum") {
    return (): Generator => new TsEnumGenerator();
  } else if (name === "json-o") {
    return (): Generator => new JsonObjectGenerator();
  } else if (name === "json") {
    return (): Generator => new JsonStringGenerator();
  }

  return null;
}
