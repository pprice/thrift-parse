import { ThriftGrammar, buildParseErrors } from "../grammar";
import { outputGrammarStatus, outputParseErrors } from "./log";

import { DefaultCliOptions } from ".";
import chalk from "chalk";
import { matchAndProcessEach } from "./util";
import { time } from "../perf-util";

type CheckOptions = {
  file: string;
  "print-cst": boolean;
} & DefaultCliOptions;

export async function check(options: CheckOptions): Promise<void> {
  const log = options.log;
  const e2eTimeHandle = time();
  let passed = 0;
  let failed = 0;

  const matches = await matchAndProcessEach(options.file, log, async (match, content) => {
    log();
    log(chalk`Parsing {green ${match}}...`);

    const grammar = new ThriftGrammar();
    const result = grammar.parse(content);

    if (result.errors.lex.length > 0 || result.errors.parse.length > 0) {
      failed++;
    } else {
      passed++;
    }

    const parseErrors = result.errors.parse;

    if (parseErrors.length > 0) {
      const detailedParseErrors = buildParseErrors(content, result.errors.parse);
      outputParseErrors(match, detailedParseErrors, result, log);
    }

    outputGrammarStatus(result, log);

    if (options["print-cst"] && result.cst) {
      log();
      log(JSON.stringify(result.cst, null, 2));
    }
  });

  const e2eTime = e2eTimeHandle().format();

  log();
  log(`Processed ${matches.length} files in ${e2eTime.value.toFixed(2)} ${e2eTime.unit}`);
  log(`${passed} succeeded, ${failed} failed`);
}
