import * as fs from "fs";

import { ThriftGrammar, buildParseErrors } from "../grammar";
import { output_grammar_status, output_parse_errors } from "./log";

import { DefaultCliProperties } from ".";
import chalk from "chalk";
import glob from "fast-glob";
import normalize from "normalize-path";
import { time } from "../perf-util";

type CheckProperties = {
  file: string;
} & DefaultCliProperties;

export async function check({ file, log }: CheckProperties) {
  const matches = await glob(normalize(file), { onlyFiles: true, globstar: true });

  const e2e_time_handle = time();

  for (const match of matches) {
    log();
    log(chalk`Parsing {green ${match}}...`);

    const content = (await fs.promises.readFile(match)).toString("utf8");
    const grammar = new ThriftGrammar();
    const result = grammar.parse(content);

    const parse_errors = result.errors.parse;

    if (parse_errors.length > 0) {
      log(chalk`{cyan ${file}} - {redBright ${parse_errors.length} ${parse_errors.length === 1 ? "error" : "errors"}}`);
      log();
      const detailed_parse_errors = buildParseErrors(content, result.errors.parse);
      output_parse_errors(detailed_parse_errors, result, log);
    }

    output_grammar_status(result, log);
  }

  const e2e_time = e2e_time_handle().format();

  log();
  log(`Processed ${matches.length} files in ${e2e_time.value.toFixed()} ${e2e_time.unit}`);
}
