import { Generator, GeneratorResult, GeneratorOutput } from "./types";

export type GeneratorCtor = new () => Generator;

export class ChainedGenerator<TOutput extends GeneratorOutput = GeneratorOutput> implements Generator {
  constructor(private generators: GeneratorCtor[]) {}

  async process(node: unknown): Promise<GeneratorResult<TOutput>> {
    let currentInput: unknown = node;
    let currentOutput: GeneratorResult;

    let output: GeneratorResult<TOutput> = {
      errors: [],
      warnings: [],
      output: [],
      performance: {}
    };

    let idx = 0;

    for (const ctor of this.generators) {
      const instance = new ctor();
      const name = instance.name || ctor.name || idx.toString();
      currentOutput = await instance.process(currentInput);
      currentInput = currentOutput.output[0].value;

      // Merge results
      output = {
        errors: [...output.errors, ...currentOutput.errors],
        warnings: [...output.warnings, ...currentOutput.warnings],
        performance: {
          ...output.performance,
          ...Object.entries(currentOutput.performance || {}).reduce((acc, [key, e]) => {
            acc[`${name}.${key}`] = e;
            return acc;
          }, {})
        }
      };

      idx++;
    }

    output.output = currentOutput.output as TOutput[];
    return output;
  }
}

export function makeChainedGenerator<TOutput extends GeneratorOutput>(...args: GeneratorCtor[]): GeneratorCtor {
  return class extends ChainedGenerator<TOutput> {
    constructor() {
      super(args);
    }
  };
}
