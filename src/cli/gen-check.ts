import { ThriftGrammar, buildParseErrors } from "../grammar";
import { outputGeneratorStatus, outputGrammarStatus, outputParseErrors } from "./log";

import { DefaultCliOptions } from ".";
import { GeneratorResult } from "../generators/generator";
import { ParseNode } from "../grammar/nodes";
import chalk from "chalk";
import { getGeneratorFactory } from "../generators";
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
      const generator = generatorFactory(parseResult.cst as ParseNode, null);
      generatorResult = await generator.process();

      if (generatorResult.errors?.length == 0) {
        let generatedWithContent = 0;
        for (const generated of generatorResult.content) {
          if (generated.content) {
            generatedWithContent++;
            log.info(chalk`{cyan ${generated.fileHint || generated.type}}`);
            log.separator();
            log.info(chalk`{whiteBright ${generated.content}}`);
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
