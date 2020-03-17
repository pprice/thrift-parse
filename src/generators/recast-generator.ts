import * as recast from "recast";

import { Generator, GeneratorResult } from "./generator";

import { ParseNode } from "../grammar/helpers";

export abstract class RecastGenerator extends Generator {
  protected builder = recast.types.builders;
  protected program = this.builder.program([]);
  protected abstract readonly type: string;

  constructor(root: ParseNode) {
    super(root);
  }

  async process(): Promise<GeneratorResult> {
    const output = recast.prettyPrint(this.program);

    return {
      errors: [],
      content: [
        {
          type: this.type,
          content: output.code
        },
        {
          type: "map",
          content: output.map
        }
      ]
    };
  }
}
