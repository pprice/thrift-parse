import { EnumValueNode, WithComments } from "../grammar/nodes";
import { RecastGenerator, RecastVisitorInput, VisitResult } from "./recast-generator";

import { findByName } from "../grammar/nodes";
import { types } from "recast";

type EnumState = {
  lastMemberIndex: number;
};

export class TsEnumGenerator extends RecastGenerator {
  protected type = "ts";

  protected EnumRule({ node, parentAst, nodes }: RecastVisitorInput<types.namedTypes.Program>): VisitResult<EnumState> {
    const id = node.children.Identifier[0].image || "UNK";

    const enumDeclaration = this.builder.tsEnumDeclaration(this.id(id), []);
    const exported = this.builder.exportNamedDeclaration(enumDeclaration);
    parentAst.body.push(exported);

    const container = findByName<WithComments>(nodes, "DefinitionRule");
    this.pushComments(container, exported);

    return {
      astNode: enumDeclaration,
      state: {
        lastMemberIndex: 0
      }
    };
  }

  protected EnumValueRule({
    node,
    state,
    parentAst
  }: RecastVisitorInput<types.namedTypes.TSEnumDeclaration, EnumState, EnumValueNode>): VisitResult<EnumState> {
    // The behavior of enum values is to use the value specified for the enum member, if none
    // start increment the previous value by one; if there is no previous value start at 0

    const id = node.children.Identifier[0].image || "UNK";
    let value: number = node.children?.HexConst?.[0].payload || node.children?.IntegerConst?.[0].payload;

    if (value == null) {
      value = ++state.lastMemberIndex;
    }

    const enumMember = this.builder.tsEnumMember(this.id(id), this.literal(value));
    parentAst.members.push(enumMember);

    state.lastMemberIndex = value;

    return {
      astNode: enumMember,
      state,
      stop: true
    };
  }
}
