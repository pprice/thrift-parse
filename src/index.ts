import { check } from "./cli";
import yargs from "yargs";

async function main(): Promise<void> {
  const argv = yargs
    .command(
      "check <file>",
      "Check parsing behavior for a single input file",
      yargs =>
        yargs
          .positional("file", { describe: "Input file or glob pattern", type: "string", required: true })
          .option("print-cst", { type: "boolean", description: "Print CST" }),
      argv => check({ ...argv, log: console.log })
    )
    .demandCommand().argv;

  await argv;
}

main();
