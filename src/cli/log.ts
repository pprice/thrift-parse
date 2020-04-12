import { GrammarParseResult, ParseError } from "../grammar";

import { IToken } from "chevrotain";
import { TimingInfo, sumTime } from "../perf-util";
import chalk from "chalk";
import { GeneratorResult } from "../generators";

export type Logger = {
  info: (message?: unknown) => void;
  debug: (message?: unknown) => void;
  warn: (message?: unknown) => void;
  error: (message?: unknown) => void;
  none: () => void;
  separator: () => void;
};

function stageMessage(stage: string, errors: unknown[], timing: TimingInfo, pad = 16): string {
  stage = stage.padEnd(pad);
  const formattedTime = timing.format();
  const formattedTimeString = chalk`{gray (${formattedTime.value.toFixed(2)} ${formattedTime.unit})}`;
  if (errors.length === 0) {
    return chalk`{green ${stage}} ⟶  ✔️   ${formattedTimeString}`;
  }

  return chalk`{red ${stage}} ⟶  ❌  {redBright [ ${errors.length} ${errors.length === 1 ? "error" : "errors"} ]}   ${formattedTimeString}`;
}

export function outputGrammarStatus(result: GrammarParseResult, log: Logger, pad = 16): void {
  log.info(`${stageMessage("Lex", result.errors.lex, result.performance.lex, pad)}`);
  log.info(`${stageMessage("Parse", result.errors.parse, result.performance.parse, pad)}`);
}

export function outputGeneratorStatus(parseResult: GrammarParseResult, result: GeneratorResult, log: Logger): void {
  const allErrors = [];

  const total = sumTime(...[...Object.values(result.performance), ...Object.values(parseResult.performance)]);
  const longestKey = Object.keys({ ...result.performance, ...parseResult.performance }).reduce((acc, i) => {
    if (acc < i.length) {
      return i.length;
    }

    return acc;
  }, 0);

  outputGrammarStatus(parseResult, log, longestKey);

  for (const [key, timing] of Object.entries(result.performance)) {
    log.info(`${stageMessage(key, result.errors, timing, longestKey)}`);

    allErrors.push(...result.errors);
  }

  log.separator();
  log.info(`${stageMessage("All", allErrors, total, longestKey)}`);
}

export function outputParseError(file: string, error: ParseError, result: GrammarParseResult, log: Logger): void {
  log.error(
    chalk`{cyan ${file}}{yellow :${error.fragment.line}:${error.fragment.lineStart || 0}} - {redBright.bold Error:} {red ${
      error.exception.name
    }} - ${error.exception.message}`
  );
  log.none();
  const prefix = chalk`{gray |}`;
  log.error(chalk`${prefix} {yellow Code:}`);

  const maxLineLength = (error.fragment.line + error.followingLines.length).toString().length;

  const makeLineNumber = (number: number): string => {
    return number.toString().padEnd(maxLineLength, " ");
  };

  error.priorLines.forEach((line, idx) => {
    const lineNumber = error.fragment.line - error.priorLines.length + idx;
    log.error(chalk`${prefix} {gray ${makeLineNumber(lineNumber)}}  {white ${line}}`);
  });

  log.error(chalk`${prefix} {gray ${makeLineNumber(error.fragment.line)}}  {whiteBright.bold ${error.originLine}}`);
  const indent = " ".repeat(error.fragment.lineStart);
  const highlight = "^".repeat(error.fragment.length);
  log.error(chalk`${prefix} ${" ".repeat(maxLineLength)}  ${indent}{redBright.bold ${highlight}} {red ⟵  ${error.exception.name}}`);

  error.followingLines.forEach((line, idx) => {
    const lineNumber = error.fragment.line + idx + 1;
    log.error(chalk`${prefix} {gray ${makeLineNumber(lineNumber)}}  {white ${line}}`);
  });

  log.error(prefix);

  if (error.exception?.context?.ruleStack.length > 0) {
    log.error(prefix);
    const stack = [...error.exception.context.ruleStack];
    const tail = stack.pop();

    log.error(chalk`${prefix} {yellow Parse Stack:   } ${stack.join(" ⟶  ")} ${stack.length > 0 ? "⟶ " : ""} {bold ${tail}}`);
  }

  const generateTokenOutput = (token: IToken): string => {
    return chalk`${token.tokenType.name}: "{whiteBright.bold ${token.image}}"`;
  };

  if (error.exception.previousToken) {
    log.error(chalk`${prefix} {yellow Previous Token:} ${generateTokenOutput(error.exception.previousToken)}`);
  }

  if (error.exception.token) {
    log.error(chalk`${prefix} {yellow Current Token: } ${generateTokenOutput(error.exception.token)}`);
  }
}

export function outputParseErrors(file: string, errors: ParseError[], result: GrammarParseResult, log: Logger): void {
  errors.forEach(e => {
    outputParseError(file, e, result, log);
    log.error();
  });
}
