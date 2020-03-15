import { IRecognitionException, IToken } from "chevrotain";
import { nextIndex, nextIndices, previousIndex, previousIndices } from "./string-utils";

const NEW_LINE = "\n".charCodeAt(0);

export type ParseErrorOptions = {
  windowLines?: number;
};

type IRecognitionExceptionExtended = {
  previousToken?: IToken;
};

export type ParseError = {
  exception: IRecognitionException & IRecognitionExceptionExtended;
  priorLines: string[];
  followingLines: string[];
  originLine: string;
  fragment: {
    text: string;
    lineStart: number;
    lineEnd: number;
    originStart: number;
    originEnd: number;
    length: number;
  };
};

const DefaultParseErrorFormatterOptions: ParseErrorOptions = {
  windowLines: 3
};

function extract(origin: string, exception: IRecognitionException, formatOptions?: ParseErrorOptions): ParseError {
  formatOptions = { ...DefaultParseErrorFormatterOptions, ...formatOptions };

  // NOTE: Line numbers from chevrotain are unreliable, manually build out
  // the lines from the offsets, which are reliable.
  const priorLines: string[] = [];
  const followingLines: string[] = [];

  const current = exception.token.startOffset;

  let leftExtent = previousIndex(origin, NEW_LINE, current);
  let rightExtent = nextIndex(origin, NEW_LINE, current);

  const originLine = origin.substring(leftExtent + 1, rightExtent);

  // Adjust token ranges to be relative to origin_line
  const fragmentStart = exception.token.startOffset - leftExtent - 1;
  const fragmentEnd = exception.token.endOffset - leftExtent;

  const errorFragment = originLine.substring(fragmentStart, fragmentEnd);
  const fragmentLength = fragmentEnd - fragmentStart;

  // Trim origin_line due to windows line breaks (meh)
  leftExtent--;
  rightExtent++;

  for (let idx of previousIndices(origin, NEW_LINE, leftExtent, formatOptions.windowLines)) {
    const line = origin.substring(idx + 1, leftExtent).replace("\r", "");
    priorLines.unshift(line);
    leftExtent = --idx;
  }

  for (let idx of nextIndices(origin, NEW_LINE, rightExtent, formatOptions.windowLines)) {
    const line = origin.substring(rightExtent, idx).replace("\r", "");
    followingLines.push(line);
    rightExtent = ++idx;
  }

  const context: ParseError = {
    exception,
    priorLines: priorLines,
    followingLines: followingLines,
    originLine: originLine,
    fragment: {
      text: errorFragment,
      lineStart: fragmentStart,
      lineEnd: fragmentEnd,
      originStart: exception.token.startOffset,
      originEnd: exception.token.endOffset,
      length: fragmentLength
    }
  };

  return context;
}

export function buildParseErrors(origin: string, errors: IRecognitionException[]): ParseError[] {
  return errors.map(e => extract(origin, e));
}
