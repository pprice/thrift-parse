import { Generator } from "./generator";
import { ParseNode } from "../grammar/helpers";
import { TsEnumGenerator } from "./ts-enum";

type GeneratorFactory = (root: ParseNode) => Generator;

export function getGeneratorFactory(name: string): GeneratorFactory | null {
  if (name === "ts-enum") {
    return (root: ParseNode): Generator => new TsEnumGenerator(root);
  }

  return null;
}
