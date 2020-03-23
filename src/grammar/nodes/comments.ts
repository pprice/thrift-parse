import { IToken, ParseNode } from "./types";

import { collectPayloads } from "./general";

type BaseComment = {
  value: string;
  token: IToken;
};

export type LineComment = BaseComment & {
  type: "Line";
};

export type BlockComment = BaseComment & {
  type: "Block";
};

export type DocComment = BaseComment & {
  type: "Doc";
};

export type Comment = LineComment | BlockComment | DocComment;

function extractAnyComment(commentNode: ParseNode): Comment[] {
  const comments = [];
  if (commentNode.children.SingleLineComment) {
    comments.push(
      ...collectPayloads(commentNode.children.SingleLineComment, false).map(value => ({
        type: "Line",
        value
      }))
    );
  }

  if (commentNode.children.BlockComment) {
    comments.push(
      ...collectPayloads(commentNode.children.BlockComment).map(value => ({
        type: "Block",
        value
      }))
    );
  }

  if (commentNode.children.DocComment) {
    comments.push(
      ...collectPayloads(commentNode.children.DocComment).map(value => ({
        type: "Doc",
        value
      }))
    );
  }

  return comments;
}

export function extractComments(node: ParseNode): Comment[] {
  if (node?.children?.CommentsRule) {
    return extractAnyComment(node.children.CommentsRule[0]);
  }

  return [];
}

export function extractPostComments(node: ParseNode): Comment[] {
  if (node?.children?.PostCommentsRule) {
    return extractAnyComment(node.children.PostCommentsRule[0]);
  }

  return [];
}
