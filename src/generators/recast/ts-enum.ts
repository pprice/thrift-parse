import { EnumValueNode, WithComments, firstPayload, identifierOf } from "../../grammar/nodes";
import { RecastGenerator, RecastVisitorInput, VisitResult } from "./recast-generator";
import { b, transformComments } from "./builders";

import { findByName } from "../../grammar/nodes";
import { types } from "recast";

type EnumState = {
  lastMemberIndex: number;
};

export class TsEnumGenerator extends RecastGenerator {
  protected type = "ts";

  protected EnumRule({ node, parentAst, nodes }: RecastVisitorInput<types.namedTypes.Program>): VisitResult<EnumState> {
    const id = identifierOf(node);
    const enumDeclaration = b.tsEnumDeclaration(b.identifier(id), []);
    const exported = b.exportNamedDeclaration(enumDeclaration);
    parentAst.body.push(exported);

    const container = findByName<WithComments>(nodes, "DefinitionRule");
    exported.comments = transformComments(container);

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

    const id = identifierOf(node);
    let value: number = firstPayload(node, "HexConst", "IntegerConst");

    if (value == undefined) {
      value = ++state.lastMemberIndex;
    }

    const enumMember = b.tsEnumMember(b.identifier(id), b.literal(value));
    enumMember.comments = transformComments(node);
    parentAst.members.push(enumMember);

    state.lastMemberIndex = value;

    return {
      astNode: enumMember,
      state,
      stop: true
    };
  }
}
