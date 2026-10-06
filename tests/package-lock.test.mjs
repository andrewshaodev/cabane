import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { posix } from "node:path";
import test from "node:test";

test("the portable lockfile includes required peers of platform-specific optional packages", async () => {
  const { packages } = JSON.parse(
    await readFile(new URL("../package-lock.json", import.meta.url), "utf8"),
  );
  const missing = [];
  for (const [packagePath, metadata] of Object.entries(packages)) {
    for (const peer of Object.keys(metadata.peerDependencies ?? {})) {
      if (metadata.peerDependenciesMeta?.[peer]?.optional) continue;
      let directory = packagePath || ".";
      while (!packages[posix.join(directory, "node_modules", peer)]) {
        if (directory === ".") {
          missing.push(`${packagePath}: ${peer}`);
          break;
        }
        directory = posix.dirname(directory);
      }
    }
  }
  assert.deepEqual(missing, [], "Required peer dependencies are missing from the lockfile");
});
