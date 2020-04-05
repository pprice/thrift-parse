import { TimingInfo } from "../perf-util";

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

export type VisitorInput<TGenerated, TState = unknown, TNode extends object = {}> = {
  node: TNode;
  state: TState;
  parentAst: TGenerated;
  nodes: TNode[];
  states: unknown[];
  ast: TGenerated[];
};

export type VisitorFunc<TGenerated, TState = unknown> = (
  input: VisitorInput<TGenerated, TState>
) => VisitorResult<TGenerated, TState> | null;

export type OnBeforeVisitResult<TGenerated, TState = unknown> = {
  state: TState;
  generated: TGenerated;
};
