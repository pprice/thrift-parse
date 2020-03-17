import { ParseNode } from "../grammar/helpers";

export type GeneratorContent = {
  fileHint?: string;
  type: string;
  content: string;
};

export type GeneratorResult = {
  errors?: Error[];
  content?: GeneratorContent[];
};

export abstract class Generator {
  constructor(protected root: ParseNode) {}

  abstract async process(): Promise<GeneratorResult>;
}
