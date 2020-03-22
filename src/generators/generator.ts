import { ParseNode } from "../grammar/helpers";
import { TimingInfo } from "../perf-util";

export type GeneratorContent = {
  fileHint?: string;
  type: string;
  content: string;
};

export type GeneratorResult = {
  errors?: Error[];
  warnings?: string[];
  content?: GeneratorContent[];
  performance?: { [key: string]: TimingInfo };
};

export abstract class Generator {
  constructor(protected root: ParseNode) {}

  abstract async process(): Promise<GeneratorResult>;
}
