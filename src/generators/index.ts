import { Generator, GeneratorConfig } from "./generator";

import { AstGenerator } from "./ast/ast-generator";
import { ParseNode } from "../grammar/nodes";
import { TsEnumGenerator } from "./recast/ts-enum";

type GeneratorFactory<T extends GeneratorConfig> = (root: ParseNode, config: T) => Generator;

export function getGeneratorFactory<T extends GeneratorConfig = GeneratorConfig>(name: string): GeneratorFactory<T> | null {
  if (name === "ts-enum") {
    return (root: ParseNode): Generator => new TsEnumGenerator(root);
  } else if (name === "json") {
    return (root: ParseNode): Generator => new AstGenerator(root);
  }

  return null;
}
