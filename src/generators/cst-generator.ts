import { AbstractGenerator } from "./abstract-generator";
import { NodeName, ParseNode, IToken } from "../grammar/nodes";
import { GeneratorOutput } from "./types";
export { NodeName, ParseNode };

export abstract class CstGenerator<
  TOutput extends GeneratorOutput = GeneratorOutput,
  TGenerated = unknown,
  TState = unknown
> extends AbstractGenerator<ParseNode | IToken, TOutput, TGenerated, TState> {
  getChildren(node: ParseNode): (ParseNode | IToken)[] | undefined {
    if (node.name === "RootRule") {
      return [
        ...node.children.CommentsRule,
        ...node.children.HeaderRule,
        ...node.children.DefinitionRule,
        ...node.children.PostCommentsLabel
      ].filter(Boolean);
    }

    const childEntries = node.children && Object.entries(node.children);

    if (!childEntries?.length) {
      return undefined;
    }

    const nodes = childEntries.map(([, e]) => e);
    return [].concat(...nodes);
  }

  getNodeName(node: ParseNode): string | symbol {
    return node.name || node.tokenType?.name;
  }
}
