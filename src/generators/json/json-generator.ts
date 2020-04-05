import { ObjectOutput, OnBeforeVisitResult, GeneratorOutput, GeneratorResult } from "../types";
import { makeChainedGenerator } from "../chained-generator";
import { CstToAstGenerator } from "../ast/cst-to-ast-generator";
import { Generator } from "..";
import { ThriftRoot, AstGenerator } from "../ast";
import { time } from "../../perf-util";

class InternalJsonObjectGenerator extends AstGenerator<ObjectOutput, object, unknown> {
  public name = "JsonObject";

  protected getOutputs(rootGenerated?: object): PromiseLike<ObjectOutput<object>[]> {
    const out: ObjectOutput<object> = {
      type: "object",
      value: rootGenerated
    };

    return Promise.resolve([out]);
  }

  protected getInitialState(root: ThriftRoot): PromiseLike<OnBeforeVisitResult<object, unknown>> {
    const res: OnBeforeVisitResult<object, unknown> = {
      generated: root,
      state: null
    };

    return Promise.resolve(res);
  }
}

class InternalJsonStringObjectGenerator implements Generator {
  public name = "JsonString";

  process(node: unknown): Promise<GeneratorResult<GeneratorOutput>> {
    const stringifyTimer = time();
    const content = JSON.stringify(node, null, 2);
    const stringifyTime = stringifyTimer();

    const output: GeneratorResult<GeneratorOutput> = {
      errors: [],
      warnings: [],
      output: [
        {
          fileExtensionHint: "json",
          type: "string",
          value: content
        }
      ],
      performance: {
        Serialize: stringifyTime
      }
    };

    return Promise.resolve(output);
  }
}

export class JsonObjectGenerator extends makeChainedGenerator(CstToAstGenerator, InternalJsonObjectGenerator) {
  public name = "JsonObject";
}

export class JsonStringGenerator extends makeChainedGenerator(
  CstToAstGenerator,
  InternalJsonObjectGenerator,
  InternalJsonStringObjectGenerator
) {
  public name = "JsonString";
}
