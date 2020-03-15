import * as fs from "fs";

import { ThriftGrammar, buildParseErrors } from "../grammar";
import { outputGrammarStatus, outputParseErrors } from "./log";

import { DefaultCliProperties as DefaultCliOptions } from ".";
import chalk from "chalk";
import glob from "fast-glob";
import normalize from "normalize-path";
import { time } from "../perf-util";

type CheckOptions = {
  file: string;
  "print-cst": boolean;
} & DefaultCliOptions;

export async function check(options: CheckOptions): Promise<void> {
  const log = options.log;
  const matches = await glob(normalize(options.file), { onlyFiles: true, globstar: true });

  const e2eTimeHandle = time();

  for (const match of matches) {
    log();
    log(chalk`Parsing {green ${match}}...`);

    const content = (await fs.promises.readFile(match)).toString("utf8");
    const grammar = new ThriftGrammar();
    const result = grammar.parse(content);

    const parseErrors = result.errors.parse;

    if (parseErrors.length > 0) {
      log(chalk`{cyan ${options.file}} - {redBright ${parseErrors.length} ${parseErrors.length === 1 ? "error" : "errors"}}`);
      log();
      const detailedParseErrors = buildParseErrors(content, result.errors.parse);
      outputParseErrors(detailedParseErrors, result, log);
    }

    outputGrammarStatus(result, log);

    if (options["print-cst"] && result.cst) {
      log();
      log(JSON.stringify(result.cst, null, 2));
    }
  }

  const e2eTime = e2eTimeHandle().format();

  log();
  log(`Processed ${matches.length} files in ${e2eTime.value.toFixed(2)} ${e2eTime.unit}`);
}
