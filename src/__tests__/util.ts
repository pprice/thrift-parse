import * as fs from "fs";
import * as path from "path";

import glob from "fast-glob";
import normalize from "normalize-path";

export const TEST_ASSET_PATH = path.join(__dirname, "../../test");

function buildGlob(subPath: string): string {
  return normalize(path.join(TEST_ASSET_PATH, subPath));
}

function trimTestPath(paths: string[]): string[] {
  if (!paths) {
    return paths;
  }

  return paths.map(p => p.substring(TEST_ASSET_PATH.length + 1));
}

const THRIFT_FILE_GLOB = buildGlob("thrift/**/*.thrift");

export function getTestAsset(subPath: string): string {
  return path.join(TEST_ASSET_PATH, subPath);
}

export async function getTestAssetContent(subPath: string): Promise<string> {
  const buffer = await fs.promises.readFile(getTestAsset(subPath));
  return buffer.toString("utf8");
}

export async function getThriftAssets(): Promise<string[]> {
  const paths = await glob(THRIFT_FILE_GLOB, { onlyFiles: true, globstar: true });
  return trimTestPath(paths);
}

export function getThriftAssetsSync(): string[] {
  const paths = glob.sync(THRIFT_FILE_GLOB, { onlyFiles: true, globstar: true });
  return trimTestPath(paths);
}
