import { GrammarParseResult, ParseError } from "../grammar";

import { IToken } from "chevrotain";
import { TimingInfo } from "../perf-util";
import chalk from "chalk";

export type LogMessage = (message?: unknown) => void;

export function outputGrammarStatus(result: GrammarParseResult, log: LogMessage): void {
  const stageMessage = (stage: string, errors: unknown[], timing: TimingInfo): string => {
    const formattedTime = timing.format();
    const formattedTimeString = chalk`{gray (${formattedTime.value.toFixed(2)} ${formattedTime.unit})}`;
    if (errors.length === 0) {
      return chalk`{green ${stage}:} ✔️   ${formattedTimeString}`;
    }

    return chalk`{red ${stage}:} ❌  {redBright [ ${errors.length} ${errors.length === 1 ? "error" : "errors"} ]}   ${formattedTimeString}`;
  };

  log(`${stageMessage("Lex   ", result.errors.lex, result.performance.lex)}`);
  log(`${stageMessage("Parse ", result.errors.parse, result.performance.parse)}`);
}

export function outputParseError(file: string, error: ParseError, result: GrammarParseResult, log: LogMessage): void {
  log(
    chalk`{cyan ${file}}{yellow :${error.fragment.line}:${error.fragment.lineStart || 0}} - {redBright.bold Error:} {red ${
      error.exception.name
    }} - ${error.exception.message}`
  );
  log();
  const prefix = chalk`{gray |}`;
  log(chalk`${prefix} {yellow Code:}`);

  const maxLineLength = (error.fragment.line + error.followingLines.length).toString().length;

  const makeLineNumber = (number: number): string => {
    return number.toString().padEnd(maxLineLength, " ");
  };

  error.priorLines.forEach((line, idx) => {
    const lineNumber = error.fragment.line - error.priorLines.length + idx;
    log(chalk`${prefix} {gray ${makeLineNumber(lineNumber)}}  {white ${line}}`);
  });

  log(chalk`${prefix} {gray ${makeLineNumber(error.fragment.line)}}  {whiteBright.bold ${error.originLine}}`);
  const indent = " ".repeat(error.fragment.lineStart);
  const highlight = "^".repeat(error.fragment.length);
  log(chalk`${prefix} ${" ".repeat(maxLineLength)}  ${indent}{redBright.bold ${highlight}} {red ⟵  ${error.exception.name}}`);

  error.followingLines.forEach((line, idx) => {
    const lineNumber = error.fragment.line + idx + 1;
    log(chalk`${prefix} {gray ${makeLineNumber(lineNumber)}}  {white ${line}}`);
  });

  log(prefix);

  if (error.exception?.context?.ruleStack.length > 0) {
    log(prefix);
    const stack = [...error.exception.context.ruleStack];
    const tail = stack.pop();

    log(chalk`${prefix} {yellow Parse Stack:   } ${stack.join(" ⟶  ")} ${stack.length > 0 ? "⟶ " : ""} {bold ${tail}}`);
  }

  const generateTokenOutput = (token: IToken): string => {
    return chalk`${token.tokenType.name}: "{whiteBright.bold ${token.image}}"`;
  };

  if (error.exception.previousToken) {
    log(chalk`${prefix} {yellow Previous Token:} ${generateTokenOutput(error.exception.previousToken)}`);
  }

  if (error.exception.token) {
    log(chalk`${prefix} {yellow Current Token: } ${generateTokenOutput(error.exception.token)}`);
  }
}

export function outputParseErrors(file: string, errors: ParseError[], result: GrammarParseResult, log: LogMessage): void {
  errors.forEach(e => {
    outputParseError(file, e, result, log);
    log();
  });
}
