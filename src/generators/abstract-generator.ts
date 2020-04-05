import { TimingInfo, fromMilliseconds, time } from "../perf-util";
import { GeneratorOutput, OnBeforeVisitResult, VisitorFunc, VisitorResult, VisitorInput, GeneratorResult } from "./types";

type InternalVisitResult<TGenerated, TState = unknown> = { result: VisitorResult<TGenerated, TState>; state: TState[]; ast: TGenerated[] };

export abstract class AbstractGenerator<
  TNode extends object = {},
  TOutput extends GeneratorOutput = GeneratorOutput,
  TGenerated = unknown,
  TState = unknown
> {
  private visitTimer: TimingInfo | null = null;
  private handlerMisses: Set<string | symbol> = new Set();
  protected visits = 0;

  constructor(protected root: TNode) {}

  protected abstract getOutputs(rootGenerated?: TGenerated, rootState?: TState): PromiseLike<TOutput[]>;

  protected abstract getInitialState(): PromiseLike<OnBeforeVisitResult<TGenerated, TState> | undefined>;

  protected abstract getNodeName(node: TNode): string | symbol;

  protected abstract getChildren(node: TNode): TNode[] | undefined;

  protected getVisitorFunc(nodeName: string | symbol): VisitorFunc<TGenerated, TState> | undefined {
    if (this.handlerMisses.has(nodeName)) {
      return undefined;
    }

    const lowerFirst = (nodeName: string): string => `${nodeName[0].toLowerCase()}${nodeName.substring(1)}`;

    const handler = this[nodeName] || (typeof nodeName === "string" && this[lowerFirst(nodeName)]);

    if (!handler) {
      this.handlerMisses.add(nodeName);
    }

    return handler;
  }

  protected attemptVisit(node: TNode, parents: TNode[], state: TState[], ast: TGenerated[]): InternalVisitResult<TGenerated, TState> {
    const nodeName = this.getNodeName(node);
    let result: VisitorResult<TGenerated, TState> = undefined;
    const func: VisitorFunc<TGenerated, TState> | undefined = nodeName && this.getVisitorFunc(nodeName);

    if (func) {
      const timeHandle = time(this.visitTimer);
      const input: VisitorInput<TGenerated, TState> = {
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

    return {
      result,
      state,
      ast
    };
  }

  async process(): Promise<GeneratorResult<TOutput>> {
    const { state: rootState, generated: rootGenerated } = await this.getInitialState();
    const errors: Error[] = [];
    const warnings: Error[] = [];
    const walkTimeHandle = time();

    type TreeStackNode = { node: TNode; parents: TNode[]; state: TState[]; ast: TGenerated[] };

    // Wrapped visit method which will populate errors and warnings into global generator state
    const visit = (node: TNode, parent: TNode[], state: TState[], ast: TGenerated[]): InternalVisitResult<TGenerated, TState> => {
      let visitResult: InternalVisitResult<TGenerated, TState> = null;
      // try {
      visitResult = this.attemptVisit(node, parent, state, ast);
      // } catch (e) {
      //   errors.push(e);
      // }

      if (visitResult?.result?.errors) {
        errors.concat(...visitResult.result.errors);
      }
      if (visitResult?.result?.warnings) {
        warnings.concat(...visitResult.result.warnings);
      }

      return visitResult;
    };

    // Ensure order of top level items, as the root rule is ordered by node name
    const treeStack: TreeStackNode[] = [
      {
        node: this.root,
        parents: [],
        state: [rootState].filter(Boolean),
        ast: [rootGenerated].filter(Boolean)
      }
    ].filter(Boolean);

    // Depth first walk of tree
    while (treeStack.length > 0) {
      // eslint-disable-next-line prefer-const
      let { node, state, ast, parents } = treeStack.pop();
      const v = visit(node, parents, state, ast);

      if (v?.result?.stop === true) {
        // If a visit tells us it halt it's sub tree; then do so
        continue;
      }

      const children = this.getChildren(node);

      if (!children?.length) {
        continue;
      }

      // NOTE: Children need to be reverse so when they enter the stack they are enumerated in the expected order
      const next: TreeStackNode[] = children.map(i => ({
        node: i,
        parents: [node, ...parents],
        state: [...v.state],
        ast: [...v.ast]
      }));

      treeStack.push(...next.reverse());
    }

    const walkTime = walkTimeHandle();
    const collectOutputs = time();
    const output: TOutput[] = await this.getOutputs(rootGenerated, rootState);
    const collectOutputsTime = collectOutputs();

    return {
      errors,
      warnings,
      output,
      performance: {
        Walk: walkTime,
        Visit: this.visitTimer || fromMilliseconds(0),
        Collect: collectOutputsTime
      }
    };
  }
}
