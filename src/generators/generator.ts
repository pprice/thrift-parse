import { NodeName, ParseNode } from "../grammar/nodes";
import { TimingInfo, fromMilliseconds, time } from "../perf-util";

export type GeneratorConfig = {};

export type StringOutput = {
  fileHint?: string;
  fileExtensionHint?: string;
  type: "string";
  content: string;
};

export type ObjectOutput<TObject extends {} = {}> = {
  fileHint?: string;
  type: "object";
  value: TObject;
};

export type GeneratorOutput = StringOutput | ObjectOutput<unknown>;

export type GeneratorResult<TOutput extends GeneratorOutput = GeneratorOutput> = {
  errors?: Error[];
  warnings?: Error[];
  output?: TOutput[];
  performance?: { [key: string]: TimingInfo };
};

export type VisitorResult<TGenerated, TState = unknown> = {
  astNode?: TGenerated;
  state?: TState;
  stop?: boolean;
  errors?: Error[];
  warnings?: Error[];
};

export type VisitorInput<TGenerated, TState = unknown, TNode extends ParseNode = ParseNode> = {
  node: TNode;
  state: TState;
  parentAst: TGenerated;
  nodes: ParseNode[];
  states: unknown[];
  ast: TGenerated[];
};

export type VisitorFunc<TGenerated, TState = unknown> = (
  input: VisitorInput<TGenerated, TState>
) => VisitorResult<TGenerated, TState> | null;
type InternalVisitResult<TGenerated, TState = unknown> = { result: VisitorResult<TGenerated, TState>; state: TState[]; ast: TGenerated[] };

export type OnBeforeVisitResult<TGenerated, TState = unknown> = {
  state: TState;
  generated: TGenerated;
};

export { NodeName, ParseNode };

export abstract class Generator<TOutput extends GeneratorOutput = GeneratorOutput, TGenerated = unknown, TState = unknown> {
  private visitTimer: TimingInfo | null = null;
  protected visits = 0;

  constructor(protected root: ParseNode) {}

  async process(): Promise<GeneratorResult<TOutput>> {
    const { state: rootState, generated: rootGenerated } = await this.getInitialState();
    const errors: Error[] = [];
    const warnings: Error[] = [];
    const walkTimeHandle = time();

    type TreeStackNode = { node: ParseNode; parents: ParseNode[]; state: TState[]; ast: TGenerated[] };

    // Wrapped visit method which will populate errors and warnings into global generator state
    const visit = (node: ParseNode, parent: ParseNode[], state: TState[], ast: TGenerated[]): InternalVisitResult<TGenerated, TState> => {
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

    const rootVisit = visit(this.root, [], [rootState].filter(Boolean), [rootGenerated].filter(Boolean));

    if (!rootVisit?.result?.stop) {
      const mapRootRule = (parseNode: ParseNode[]): TreeStackNode[] => {
        if (!parseNode) {
          return [];
        }

        return parseNode.map(i => ({ node: i, parents: [this.root], state: rootVisit.state, ast: rootVisit.ast }));
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
        const v = visit(node, parents, state, ast);

        if (v?.result?.stop === true) {
          // If a visit tells us it halt it's sub tree; then do so
          continue;
        }

        const childKeys = node.children && Object.keys(node.children);
        const hasChildren = childKeys?.length;

        if (!hasChildren) {
          continue;
        }

        // CstNode
        for (const key of childKeys) {
          const childNode: unknown[] = node.children[key];

          // NOTE: Children need to be reverse so when they enter the stack they are enumerated in the expected order
          const next: TreeStackNode[] = childNode
            .map(i => ({ node: i, parents: [node, ...parents], state: [...v.state], ast: [...v.ast] }))
            .reverse();

          treeStack.push(...next);
        }
      }
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

  protected abstract getOutputs(rootGenerated?: TGenerated, rootState?: TState): PromiseLike<TOutput[]>;

  protected abstract getInitialState(): PromiseLike<OnBeforeVisitResult<TGenerated, TState> | undefined>;

  protected getVisitorFunc(nodeName: NodeName): VisitorFunc<TGenerated, TState> | undefined {
    const lowerFirst = (nodeName: string): string => `${nodeName[0].toLowerCase()}${nodeName.substring(1)}`;

    return this[nodeName] || this[lowerFirst(nodeName)];
  }

  private attemptVisit(node: ParseNode, parents: ParseNode[], state: TState[], ast: TGenerated[]): InternalVisitResult<TGenerated, TState> {
    const nodeName = node.name || node.tokenType?.name;
    let result: VisitorResult<TGenerated, TState> = undefined;

    if (nodeName) {
      const func: VisitorFunc<TGenerated, TState> = this.getVisitorFunc(nodeName);

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
    }

    return {
      result,
      state,
      ast
    };
  }
}
