import { AbstractGenerator } from "../abstract-generator";
import { ThriftNode } from "./types";
import { GeneratorOutput } from "../types";

export abstract class AstGenerator<TOutput extends GeneratorOutput, TGenerated, TState> extends AbstractGenerator<
  ThriftNode,
  TOutput,
  TGenerated,
  TState
> {
  protected getNodeName(n: ThriftNode): string | symbol {
    return n.node;
  }

  protected getChildren(n: ThriftNode): ThriftNode[] | undefined {
    switch (n.node) {
      case "document":
        // TODO: ...node.includes?
        return [...n.namespaces, ...n.typedefs, ...n.enum, ...n.constants, ...n.structs, ...n.services];
      case "enum":
        return [...n.members];
      case "struct":
        return [...n.fields];
      case "service":
        return [...n.functions];
      case "function":
        return [...n.arguments, ...n.exceptions];
      default:
        return undefined;
    }
  }
}
