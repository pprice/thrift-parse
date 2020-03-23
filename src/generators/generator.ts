import { ParseNode } from "../grammar/nodes";
import { TimingInfo } from "../perf-util";

export type GeneratorContent = {
  fileHint?: string;
  type: string;
  content: string;
};

export type GeneratorResult = {
  errors?: Error[];
  warnings?: Error[];
  content?: GeneratorContent[];
  performance?: { [key: string]: TimingInfo };
};

export abstract class Generator {
  constructor(protected root: ParseNode) {}

  abstract async process(): Promise<GeneratorResult>;
}
