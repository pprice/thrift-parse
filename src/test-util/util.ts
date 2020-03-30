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

export function getMatchingSnapshotAssets(type: string, extension: string = type): { input: string; output: string }[] {
  const thriftPrefix = "thrift/";
  const potentialPrefix = `gen/${type}/`;

  const potentialGlob = buildGlob(`${potentialPrefix}/**/*.${extension}`);

  const thriftSources = glob.sync(THRIFT_FILE_GLOB, { onlyFiles: true, globstar: true });
  const potentialMatches = glob.sync(potentialGlob, { onlyFiles: true, globstar: true });

  const trimmedThrift = new Set(trimTestPath(thriftSources));
  const trimmedPotentials = trimTestPath(potentialMatches);

  const potentialToThrift = (path: string): string => {
    return path.replace(new RegExp(`^${potentialPrefix}`), thriftPrefix).replace(new RegExp(`\\.${extension}$`), ".thrift");
  };

  return trimmedPotentials
    .map(i => {
      const thriftPeer = potentialToThrift(i);
      if (trimmedThrift.has(thriftPeer)) {
        return {
          output: i,
          input: thriftPeer
        };
      }

      return undefined;
    })
    .filter(Boolean);
}
