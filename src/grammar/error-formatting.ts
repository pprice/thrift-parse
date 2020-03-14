import { IRecognitionException, IToken } from "chevrotain";
import { next_index, next_indices, previous_index, previous_indices } from "./string-utils";

const NEW_LINE = "\n".charCodeAt(0);

export type ParseErrorOptions = {
  window_lines?: number;
  line_numbers?: boolean;
  include_parse_stack?: boolean;
  show_index_pointer?: true;
};

type IRecognitionExceptionExtended = {
  previousToken?: IToken;
};

export type ParseError = {
  exception: IRecognitionException & IRecognitionExceptionExtended;
  prior_lines: string[];
  following_lines: string[];
  origin_line: string;
  fragment: {
    text: string;
    line_start: number;
    line_end: number;
    origin_start: number;
    origin_end: number;
    length: number;
  };
};

const DefaultParseErrorFormatterOptions: ParseErrorOptions = {
  window_lines: 3
};

function extract(origin: string, exception: IRecognitionException, formatOptions?: ParseErrorOptions) {
  formatOptions = { ...DefaultParseErrorFormatterOptions, ...formatOptions };

  // NOTE: Line numbers from chevrotain are unreliable, manually build out
  // the lines from the offsets, which are reliable.
  const prior_lines: string[] = [];
  const following_lines: string[] = [];

  let current = exception.token.startOffset;

  let leftExtent = previous_index(origin, NEW_LINE, current);
  let rightExtent = next_index(origin, NEW_LINE, current);

  let origin_line = origin.substring(leftExtent + 1, rightExtent);

  // Adjust token ranges to be relative to origin_line
  let fragment_start = exception.token.startOffset - leftExtent - 1;
  let fragment_end = exception.token.endOffset - leftExtent;

  const error_fragment = origin_line.substring(fragment_start, fragment_end);
  const fragment_length = fragment_end - fragment_start;

  // Trim origin_line due to windows line breaks (meh)
  leftExtent--;
  rightExtent++;

  for (let idx of previous_indices(origin, NEW_LINE, leftExtent, formatOptions.window_lines)) {
    const line = origin.substring(idx + 1, leftExtent).replace("\r", "");
    prior_lines.unshift(line);
    leftExtent = --idx;
  }

  for (let idx of next_indices(origin, NEW_LINE, rightExtent, formatOptions.window_lines)) {
    const line = origin.substring(rightExtent, idx).replace("\r", "");
    following_lines.push(line);
    rightExtent = ++idx;
  }

  let context: ParseError = {
    exception,
    prior_lines,
    following_lines,
    origin_line,
    fragment: {
      text: error_fragment,
      line_start: fragment_start,
      line_end: fragment_end,
      origin_start: exception.token.startOffset,
      origin_end: exception.token.endOffset,
      length: fragment_length
    }
  };

  return context;
}

export function buildParseErrors(origin: string, errors: IRecognitionException[]) {
  return errors.map(e => extract(origin, e));
}
