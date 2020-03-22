import { ThriftGrammar, buildParseErrors } from "../grammar";

import { DefaultCliOptions } from ".";
import { ParseNode } from "../grammar/helpers";
import chalk from "chalk";
import { getGeneratorFactory } from "../generators";
import { matchAndProcessEach } from "./util";
import { outputParseErrors } from "./log";

type GenCheckOptions = {
  file: string;
  type: string;
} & DefaultCliOptions;

export async function genCheck(options: GenCheckOptions): Promise<void> {
  const log = options.log;

  const generatorFactory = getGeneratorFactory(options.type);

  if (generatorFactory === null) {
    log.error(chalk`{redBright Error:} {red Unknown generator ${options.type}}`);
    return;
  }

  await matchAndProcessEach(options.file, log, async (match, content) => {
    log.none();
    log.info(chalk`Processing {green ${match}}...`);

    const grammar = new ThriftGrammar();
    const result = grammar.parse(content);

    if (result.errors.parse.length > 0) {
      const detailedParseErrors = buildParseErrors(content, result.errors.parse);
      outputParseErrors(match, detailedParseErrors, result, log);
      return;
    }

    const generator = generatorFactory(result.cst as ParseNode);
    const generatorResult = await generator.process();

    if (generatorResult.errors?.length > 0) {
      return;
    }

    for (const generated of generatorResult.content) {
      if (generated.content) {
        log.none();
        log.info(chalk`{cyan ${generated.fileHint || generated.type}}`);
        log.info(chalk`{whiteBright ${generated.content}}`);
      }
    }
  });
}
