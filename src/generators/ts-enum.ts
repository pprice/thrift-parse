import { EnumValueNode, WithIdentifier } from "../grammar/helpers";
import { RecastGenerator, VisitResult } from "./recast-generator";

import { types } from "recast";

type EnumState = {
  lastMemberIndex: number;
};

export class TsEnumGenerator extends RecastGenerator {
  protected type = "ts";

  protected getInitialState(): EnumState {
    return {
      lastMemberIndex: -1
    };
  }

  protected EnumRule(node: WithIdentifier, state: void, program: types.namedTypes.Program): VisitResult<EnumState> {
    const id = node.children.Identifier[0].image || "UNK";

    const enums = this.builder.tsEnumDeclaration(this.id(id), []);

    program.body.push(this.builder.exportNamedDeclaration(enums));

    return {
      node: enums,
      state: {
        lastMemberIndex: 0
      }
    };
  }

  protected EnumValueRule(node: EnumValueNode, state: EnumState, tsEnum: types.namedTypes.TSEnumDeclaration): VisitResult {
    // The behavior of enum values is to use the value specified for the enum member, if none
    // start increment the previous value by one; if there is no previous value start at 0

    const id = node.children.Identifier[0].image || "UNK";
    let value: number = node.children?.HexConst?.[0].payload || node.children?.IntegerConst?.[0].payload;

    if (value == null) {
      value = ++state.lastMemberIndex;
    }

    tsEnum.members.push(this.builder.tsEnumMember(this.id(id), this.literal(value)));

    state.lastMemberIndex = value;

    return {
      node: tsEnum,
      state,
      stop: true
    };
  }
}
