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

const AllCommentTypes = new Set(["Line", "Block", "Doc"]);

function extractAnyComment(commentNode: ParseNode, types: Comment["type"][]): Comment[] {
  const comments = [];
  const typesSet = types.length > 0 ? new Set(types) : AllCommentTypes;

  if (typesSet.has("Line") && commentNode.children.SingleLineComment) {
    comments.push(
      ...collectPayloads(commentNode.children.SingleLineComment, false).map(value => ({
        type: "Line",
        value
      }))
    );
  }

  if (typesSet.has("Block") && commentNode.children.BlockComment) {
    comments.push(
      ...collectPayloads(commentNode.children.BlockComment).map(value => ({
        type: "Block",
        value
      }))
    );
  }

  if (typesSet.has("Doc") && commentNode.children.DocComment) {
    comments.push(
      ...collectPayloads(commentNode.children.DocComment).map(value => ({
        type: "Doc",
        value
      }))
    );
  }

  return comments;
}

export function extractComments(node: ParseNode, ...types: Comment["type"][]): Comment[] {
  if (node?.children?.CommentsRule) {
    return extractAnyComment(node.children.CommentsRule[0], types);
  }

  return [];
}

export function extractPostComments(node: ParseNode, ...types: Comment["type"][]): Comment[] {
  if (node?.children?.PostCommentsLabel) {
    return extractAnyComment(node.children.PostCommentsLabel[0], types);
  }

  return [];
}
