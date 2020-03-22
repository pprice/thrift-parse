import * as fs from "fs";

import { Logger } from "./log";
import glob from "fast-glob";
import normalize from "normalize-path";

export async function matchAndProcessEach(
  pattern: string,
  log: Logger,
  itemCallback: (match: string, content: string) => Promise<void>
): Promise<string[]> {
  const matches = await glob(normalize(pattern), { onlyFiles: true, globstar: true });

  for (const match of matches) {
    const content = (await fs.promises.readFile(match)).toString("utf8");
    await itemCallback(match, content);
  }

  return matches;
}
