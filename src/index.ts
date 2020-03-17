import { check } from "./cli";
import { genCheck } from "./cli/gen-check";
import yargs from "yargs";

async function main(): Promise<void> {
  const argv = yargs
    .command(
      "check <file>",
      "Check parsing behavior for a glob pattern",
      yargs =>
        yargs
          .positional("file", { describe: "Input file or glob pattern", type: "string", required: true })
          .option("print-cst", { type: "boolean", description: "Print CST" }),
      argv => check({ ...argv, log: console.log })
    )
    .command(
      "gen-check <type> <file>",
      "Check generator behavior for a glob pattern",
      yargs =>
        yargs
          .positional("type", { describe: "Generator name", type: "string" })
          .positional("file", { describe: "Input file or glob pattern", type: "string", required: true }),
      argv => genCheck({ ...argv, log: console.log })
    )
    .demandCommand().argv;

  await argv;
}

main();
