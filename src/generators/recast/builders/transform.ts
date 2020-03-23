import { WithComments, extractComments } from "../../../grammar/nodes";

import { b } from ".";
import { types as t } from "recast";

type CommentTransform = (t.namedTypes.CommentLine | t.namedTypes.CommentBlock)[];

export function transformComments(from: WithComments | WithComments[]): CommentTransform {
  if (!from) {
    return;
  }

  const sources = Array.isArray(from) ? from : [from];
  const result = [];

  for (const source of sources) {
    const comments = extractComments(source);

    // TODO: Add leading spaces if the comment type changes
    const mappedComments = comments.map(c => (c.type === "Line" ? b.commentLine(c.value) : b.commentBlock(c.value)));

    result.push(...mappedComments);
  }

  return result;
}
