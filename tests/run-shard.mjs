import { readdir, stat } from "node:fs/promises";
import { after } from "node:test";
import { closeModules } from "./test-server.mjs";

// Node 24 provides a read-only navigator getter. Browser harnesses replace it
// with JSDOM's navigator, so restore the older test-process behavior first.
const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, "navigator");
if (navigatorDescriptor && !navigatorDescriptor.writable && navigatorDescriptor.configurable) {
  delete globalThis.navigator;
}

export async function runShard(shardIndex, shardCount) {
  const testsDirectory = new URL(".", import.meta.url);
  const testFiles = (await readdir(testsDirectory))
    .filter((name) => name.endsWith(".test.mjs"))
    .sort();
  const weightedFiles = await Promise.all(testFiles.map(async (name) => ({
    name,
    size: (await stat(new URL(name, testsDirectory))).size,
  })));
  const shards = Array.from({ length: shardCount }, () => ({ size: 0, files: [] }));

  for (const file of weightedFiles.sort((left, right) => right.size - left.size)) {
    const shard = shards.reduce((lightest, candidate) =>
      candidate.size < lightest.size ? candidate : lightest
    );
    shard.files.push(file.name);
    shard.size += file.size;
  }

  for (const testFile of shards[shardIndex].files.sort()) await import(`./${testFile}`);
  after(closeModules);
}
