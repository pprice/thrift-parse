import { EnumValueNode, WithIdentifier } from "../grammar/helpers";
import { RecastGenerator, VisitResult } from "./recast-generator";

import { types } from "recast";

export class TsEnumGenerator extends RecastGenerator {
  protected type = "ts";

  protected EnumRule(node: WithIdentifier, program: types.namedTypes.Program): VisitResult {
    const id = node.children.Identifier[0].image || "UNK";

    const enums = this.builder.tsEnumDeclaration(this.id(id), []);

    program.body.push(this.builder.exportNamedDeclaration(enums));

    return {
      node: enums
    };
  }

  protected EnumValueRule(node: EnumValueNode, tsEnum: types.namedTypes.TSEnumDeclaration): VisitResult {
    const id = node.children.Identifier[0].image || "UNK";
    const value = node.children?.HexConst?.[0].payload || node.children?.IntegerConst?.[0].payload;
    const literal = value == null ? null : this.literal(value);
    tsEnum.members.unshift(this.builder.tsEnumMember(this.id(id), literal));

    return {
      node: tsEnum,
      stop: true
    };
  }
}
