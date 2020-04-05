import { CstGenerator } from "./cst-generator";
import { AstGenerator } from "./ast/ast-generator";
import { ParseNode } from "../grammar/nodes";
import { TsEnumGenerator } from "./recast/ts-enum";
import { GeneratorConfig } from "./types";

export * from "./types";
export { CstGenerator, AstGenerator };

type GeneratorFactory<T extends GeneratorConfig> = (root: ParseNode, config: T) => CstGenerator;

export function getGeneratorFactory<T extends GeneratorConfig = GeneratorConfig>(name: string): GeneratorFactory<T> | null {
  if (name === "ts-enum") {
    return (root: ParseNode): CstGenerator => new TsEnumGenerator(root);
  } else if (name === "json") {
    return (root: ParseNode): CstGenerator => new AstGenerator(root);
  }

  return null;
}
