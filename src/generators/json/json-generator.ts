import { AstGenerator, AstInput, AstResult, CstToAstGenerator, ThriftNode, ThriftRoot } from "../ast";
import { GeneratorOutput, GeneratorResult, ObjectOutput, OnBeforeVisitResult, VisitorFunc } from "../types";

import { Generator } from "..";
import { makeChainedGenerator } from "../chained-generator";
import { time } from "../../perf-util";

type Input<TNode extends ThriftNode = ThriftNode> = AstInput<object, unknown, TNode>;
type Result = AstResult<object, unknown>;

class InternalJsonObjectGenerator extends AstGenerator<ObjectOutput, object, unknown> {
  public name = "JsonObject";

  protected getOutputs(rootGenerated?: object): PromiseLike<ObjectOutput<object>[]> {
    const out: ObjectOutput<object> = {
      type: "object",
      value: rootGenerated
    };

    return Promise.resolve([out]);
  }

  getVisitorFunc(name): VisitorFunc<object> {
    const existing = super.getVisitorFunc(name);

    if (existing) {
      return existing;
    }

    return this.fallback;
  }

  protected fallback({ node }: Input): Result {
    const clone: ThriftNode = { ...node };
    delete clone.node;

    return {
      astNode: clone
    };
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
