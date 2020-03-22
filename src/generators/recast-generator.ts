import * as recast from "recast";

import { Generator, GeneratorResult } from "./generator";
import { TimingInfo, fromMilliseconds, time } from "../perf-util";

import { ParseNode } from "../grammar/helpers";

export type VisitResult<T = unknown> = {
  astNode?: RecastAstNode;
  state?: T;
  stop?: boolean;
};

export type RecastVisitorInput<TAst extends RecastAstNode = RecastAstNode, TState = unknown, TNode extends ParseNode = ParseNode> = {
  node: TNode;
  state: TState;
  parentAst: TAst;
  nodes: ParseNode[];
  states: unknown[];
  ast: RecastAstNode[];
};

type RecastVisitorFunc = (input: RecastVisitorInput) => VisitResult | null;

type RecastVisitor = (node: ParseNode, state: unknown, astStack: RecastAstNode[]) => VisitResult | null;
type InternalVisitResult = { result: VisitResult; state: unknown[]; ast: RecastAstNode[] };

export type RecastAstNode = recast.types.namedTypes.Node;

export abstract class RecastGenerator extends Generator {
  protected builder = recast.types.builders;
  protected program = this.builder.program([]);
  protected abstract readonly type: string;
  protected visits = 0;
  private visitTimer: TimingInfo | null = null;

  constructor(root: ParseNode) {
    super(root);
  }

  private attemptVisit(node: ParseNode, parents: ParseNode[], state: unknown[], ast: RecastAstNode[]): InternalVisitResult {
    const nodeName = node.name || node.tokenType?.name;
    let result: VisitResult = null;

    if (nodeName) {
      const func: RecastVisitorFunc = this[nodeName];

      if (func) {
        const timeHandle = time(this.visitTimer);
        const input: RecastVisitorInput = {
          node: node,
          state: state[0] || null,
          parentAst: ast[0] || null,
          nodes: parents,
          states: state,
          ast: ast
        };

        result = func.apply(this, [input]);
        this.visits++;

        if (result?.astNode) {
          ast = [result.astNode, ...ast];
        }
        if (result?.state) {
          state = [result.state, ...state];
        }
        this.visitTimer = timeHandle();
      } else {
        // console.log(`No handler for ${nodeName}`);
      }
    }

    return {
      result,
      state,
      ast
    };
  }

  public async process(): Promise<GeneratorResult> {
    this.program.comments = [];
    this.program.body = [];

    // Visit the root node explicitly
    // TODO: Not very clean to ignore children, but...
    const walkTimeHandle = time();

    type TreeStackNode = { node: ParseNode; parents: ParseNode[]; state: unknown[]; ast: RecastAstNode[] };

    const parents = [this.root];
    let ast: RecastAstNode[] = [this.program];
    let state: unknown[] = [];

    const rootResult = this.attemptVisit(this.root, parents, state, ast);

    if (rootResult?.result?.astNode) {
      ast = [rootResult.result.astNode, ...ast];
    }

    if (rootResult?.result?.state) {
      state = [rootResult.result.stop, ...state];
    }

    if (!rootResult?.result?.stop) {
      const mapRootRule = (parseNode: ParseNode[]): TreeStackNode[] => {
        if (!parseNode) {
          return [];
        }

        return parseNode.map(i => ({ node: i, parents: [...parents], state, ast }));
      };

      // Ensure order of top level items, as the root rule is ordered by node name
      const treeStack: TreeStackNode[] = [
        ...mapRootRule(this.root.children.CommentsRule),
        ...mapRootRule(this.root.children.HeaderRule),
        ...mapRootRule(this.root.children.DefinitionRule),
        ...mapRootRule(this.root.children.PostCommentsRule)
      ].filter(Boolean);

      // Depth first walk of tree
      while (treeStack.length > 0) {
        // eslint-disable-next-line prefer-const
        let { node, state, ast, parents } = treeStack.pop();

        const visit = this.attemptVisit(node, parents, state, ast);
        ast = visit.ast;
        state = visit.state;

        if (!visit.result || !visit.result.stop) {
          const childKeys = node.children && Object.keys(node.children);
          const hasChildren = childKeys?.length;

          if (hasChildren) {
            // CstNode
            for (const key of childKeys) {
              const childNode: unknown[] = node.children[key];

              // NOTE: Children need to be reverse so when they enter the stack they are enumerated in the expected order
              const next: TreeStackNode[] = childNode
                .map(i => ({ node: i, parents: [node, ...parents], state: [...state], ast: [...ast] }))
                .reverse();

              treeStack.push(...next);
            }
          }
        }
      }
    }

    if (this.visits > 0) {
      this.program.comments.unshift(this.builder.commentLine(` @autogenerated Generated by ${this.constructor.name}`));
    }

    const walkTime = walkTimeHandle();
    const printTimeHandle = time();
    const output = recast.prettyPrint(this.program);
    const printTime = printTimeHandle();

    return {
      errors: [],
      warnings: [],
      content: [
        {
          type: this.type,
          content: output.code
        },
        {
          type: "map",
          content: output.map
        }
      ],
      performance: {
        Walk: walkTime,
        Visit: this.visitTimer || fromMilliseconds(0),
        Print: printTime
      }
    };
  }

  protected id(name: string): recast.types.namedTypes.Identifier {
    return this.builder.identifier(name);
  }

  protected literal(value: string | number | boolean | RegExp): recast.types.namedTypes.Literal {
    return this.builder.literal(value);
  }
}
