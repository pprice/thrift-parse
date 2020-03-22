import { Logger } from "./cli/log";
import chalk from "chalk";
import { check } from "./cli";
import { genCheck } from "./cli/gen-check";
import yargs from "yargs";

async function main(): Promise<void> {
  const log: Logger = {
    debug: (): void => {
      /**/
    },
    info: message => console.log(message),
    warn: message => console.error(chalk`{yellow ${message}}`),
    error: message => console.error(chalk`{red ${message}}`),
    none: () => console.log()
  };

  const argv = yargs
    .command(
      "check <file>",
      "Check parsing behavior for a glob pattern",
      yargs =>
        yargs
          .positional("file", { describe: "Input file or glob pattern", type: "string", required: true })
          .option("print-cst", { type: "boolean", description: "Print CST" }),
      argv => check({ ...argv, log })
    )
    .command(
      "gen-check <type> <file>",
      "Check generator behavior for a glob pattern",
      yargs =>
        yargs
          .positional("type", { describe: "Generator name", type: "string" })
          .positional("file", { describe: "Input file or glob pattern", type: "string", required: true }),
      argv => genCheck({ ...argv, log })
    )
    .demandCommand().argv;

  await argv;
}

main();
