import * as recast from "recast";

import { Generator, NodeName, OnBeforeVisitResult, ParseNode, StringOutput, VisitorFunc, VisitorInput, VisitorResult } from "../generator";

import { b } from "./builders";

export type RecastAstNode = recast.types.namedTypes.Node;
type ProgramAstNode = recast.types.namedTypes.Program;

export type RecastVisitResult<TState> = VisitorResult<RecastAstNode, TState>;
export type RecastVisitorInput<
  TRecastNode extends RecastAstNode = RecastAstNode,
  TState = unknown,
  TNode extends ParseNode = ParseNode
> = VisitorInput<TRecastNode, TState, TNode>;

export abstract class RecastGenerator extends Generator<StringOutput, RecastAstNode> {
  protected abstract readonly type: string;

  constructor(root: ParseNode) {
    super(root);
  }

  protected async getInitialState(): Promise<OnBeforeVisitResult<RecastAstNode>> {
    const generated = b.program([]);
    generated.body = [];
    generated.comments = [];

    return {
      state: null,
      generated
    };
  }

  protected async getOutputs(program?: ProgramAstNode): Promise<StringOutput[]> {
    if (!program) {
      return [];
    }

    if (program.body.length > 0) {
      program.comments.unshift(b.commentLine(` @autogenerated Generated by ${this.constructor.name}`, false, true));
    }

    const output = recast.prettyPrint(program);

    return [
      {
        type: "string",
        fileExtensionHint: this.type,
        content: output.code
      },
      {
        type: "string",
        fileExtensionHint: this.type,
        content: output.map
      }
    ];
  }
}
