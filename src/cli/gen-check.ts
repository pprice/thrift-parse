import { ThriftGrammar, buildParseErrors } from "../grammar";
import { outputGeneratorStatus, outputGrammarStatus, outputParseErrors } from "./log";

import { DefaultCliOptions } from ".";
import { ParseNode } from "../grammar/nodes";
import chalk from "chalk";
import colorize from "json-colorizer";
import { getGeneratorFactory, GeneratorResult } from "../generators";
import { matchAndProcessEach } from "./util";

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
    log.info(chalk`Processing {green ${match}}...`);
    log.separator();

    const grammar = new ThriftGrammar();
    const parseResult = grammar.parse(content);
    let generatorResult: GeneratorResult = null;

    if (parseResult.errors.parse.length > 0) {
      const detailedParseErrors = buildParseErrors(content, parseResult.errors.parse);
      outputParseErrors(match, detailedParseErrors, parseResult, log);
    } else {
      const generator = generatorFactory(null);
      generatorResult = await generator.process(parseResult.cst as ParseNode);

      if (generatorResult.errors?.length == 0) {
        let generatedWithContent = 0;
        for (const generated of generatorResult.output) {
          generatedWithContent++;
          log.info(chalk`{cyan ${generated.fileHint || generated.type}}`);
          log.separator();
          if (generated.type === "string") {
            log.info(chalk`{whiteBright ${generated.value}}`);
          } else if (generated.type === "object") {
            log.info(colorize(JSON.stringify(generated.value, null, 2)));
          }
        }

        if (generatedWithContent == 0) {
          log.warn("Nothing generated");
        }
      }
    }

    log.separator();
    outputGrammarStatus(parseResult, log);
    outputGeneratorStatus(generatorResult, log);
    log.separator();
  });
}
