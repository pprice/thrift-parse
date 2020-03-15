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

export function outputParseError(error: ParseError, result: GrammarParseResult, log: LogMessage): void {
  log(chalk`{redBright.bold Error:} {red ${error.exception.name}} - ${error.exception.message}`);
  const prefix = chalk`{gray |}`;
  log(chalk`${prefix} {yellow Code:}`);
  error.priorLines.forEach(line => {
    log(chalk`${prefix}   {white ${line}}`);
  });

  log(chalk`${prefix}   {whiteBright.bold ${error.originLine}}`);
  const indent = " ".repeat(error.fragment.lineStart);
  const highlight = "^".repeat(error.fragment.length);
  log(chalk`${prefix}   ${indent}{redBright.bold ${highlight}} {red ⟵  ${error.exception.name}}`);

  error.followingLines.forEach(line => {
    log(chalk`${prefix}   {white ${line}}`);
  });

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

export function outputParseErrors(errors: ParseError[], result: GrammarParseResult, log: LogMessage): void {
  errors.forEach(e => {
    outputParseError(e, result, log);
    log();
  });
}
