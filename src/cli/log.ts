import { GrammarParseResult, ParseError } from "../grammar";

import { IToken } from "chevrotain";
import { TimingInfo } from "../perf-util";
import chalk from "chalk";

export type LogMessage = (message?: any) => void;

export function output_grammar_status(result: GrammarParseResult, log: LogMessage) {
  const success_message = (stage: string, errors: any[], timing: TimingInfo) => {
    const formatted_time = timing.format();
    const formatted_time_string = chalk`{gray (${formatted_time.value.toFixed(2)} ${formatted_time.unit})}`;
    if (errors.length === 0) {
      return chalk`{green ${stage}:} ✔️   ${formatted_time_string}`;
    }

    return chalk`{red ${stage}:} ❌  {redBright [ ${errors.length} ${
      errors.length === 1 ? "error" : "errors"
    } ]}   ${formatted_time_string}`;
  };

  log(`${success_message("Lex   ", result.errors.lex, result.performance.lex)}`);
  log(`${success_message("Parse ", result.errors.parse, result.performance.parse)}`);
}

export function output_parse_errors(errors: ParseError[], result: GrammarParseResult, log: LogMessage) {
  errors.forEach(e => {
    output_parse_error(e, result, log);
    log();
  });
}

export function output_parse_error(error: ParseError, result: GrammarParseResult, log: LogMessage, name?: string) {
  log(chalk`{redBright.bold Error:} {red ${error.exception.name}} - ${error.exception.message}`);
  const prefix = chalk`{gray |}`;
  log(chalk`${prefix} {yellow Code:}`);
  error.prior_lines.forEach(line => {
    log(chalk`${prefix}   {white ${line}}`);
  });

  log(chalk`${prefix}   {whiteBright.bold ${error.origin_line}}`);
  const indent = " ".repeat(error.fragment.line_start);
  const highlight = "^".repeat(error.fragment.length);
  log(chalk`${prefix}   ${indent}{redBright.bold ${highlight}} {red ⟵  ${error.exception.name}}`);

  error.following_lines.forEach(line => {
    log(chalk`${prefix}   {white ${line}}`);
  });

  if (error.exception?.context?.ruleStack.length > 0) {
    log(prefix);
    const stack = [...error.exception.context.ruleStack];
    const tail = stack.pop();

    log(chalk`${prefix} {yellow Parse Stack:   } ${stack.join(" ⟶  ")} ${stack.length > 0 ? "⟶ " : ""} {bold ${tail}}`);
  }

  const generateTokenOutput = (token: IToken) => {
    return chalk`${token.tokenType.name}: "{whiteBright.bold ${token.image}}"`;
  };

  if (error.exception.previousToken) {
    log(chalk`${prefix} {yellow Previous Token:} ${generateTokenOutput(error.exception.previousToken)}`);
  }

  if (error.exception.token) {
    log(chalk`${prefix} {yellow Current Token: } ${generateTokenOutput(error.exception.token)}`);
  }
}
