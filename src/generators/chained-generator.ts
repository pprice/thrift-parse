import { Generator, GeneratorResult, GeneratorOutput } from "./types";

export type GeneratorCtor = new () => Generator;

export class ChainedGenerator<TOutput extends GeneratorOutput = GeneratorOutput> implements Generator {
  constructor(private generators: GeneratorCtor[]) {}

  async process(node: unknown): Promise<GeneratorResult<TOutput>> {
    let currentInput: unknown = node;
    let currentOutput: GeneratorResult;

    const finalOutput: GeneratorResult<TOutput> = {
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
      finalOutput.errors = [...finalOutput.errors, ...currentOutput.errors];
      finalOutput.warnings = [...finalOutput.warnings, ...currentOutput.warnings];
      finalOutput.performance = {
        ...finalOutput.performance,
        ...Object.entries(currentOutput.performance || {}).reduce((acc, [key, e]) => {
          acc[`${name}.${key}`] = e;
          return acc;
        }, {})
      };

      idx++;
    }

    finalOutput.output = currentOutput.output as TOutput[];
    return finalOutput;
  }
}

export function makeChainedGenerator<TOutput extends GeneratorOutput>(...args: GeneratorCtor[]): GeneratorCtor {
  return class extends ChainedGenerator<TOutput> {
    constructor() {
      super(args);
    }
  };
}
