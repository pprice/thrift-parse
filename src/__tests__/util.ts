import * as fs from "fs";
import * as path from "path";

export const TEST_ASSET_PATH = path.join(__dirname, "../../test");

export function getTestAsset(subPath: string): string {
  return path.join(TEST_ASSET_PATH, subPath);
}

export async function getTestAssetContent(subPath: string): Promise<string> {
  const buffer = await fs.promises.readFile(getTestAsset(subPath));
  return buffer.toString("utf8");
}
