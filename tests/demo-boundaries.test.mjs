import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

test("demo import boundary permits runtime contracts but rejects real clients, persistence, and leaked internals", async () => {
  const directory = await mkdtemp(join(tmpdir(), "cabane-demo-boundary-"));
  const check = () => spawnSync(process.execPath, [resolve("scripts/verify-import-boundaries.mjs")], { cwd: directory, encoding: "utf8" });
  try {
    for (const folder of ["apps", "home", "packages/engine/src/onboarding/demo"]) await mkdir(join(directory, folder), { recursive: true });
    const adapter = join(directory, "packages/engine/src/onboarding/demo/adapter.ts");
    await writeFile(adapter, 'import { HomeAssistantRuntimeValueProvider, type HomeAssistantRuntimeValue } from "../../HomeAssistantRuntime";\nimport type { HomeManifest } from "../../types";');
    assert.equal(check().status, 0);
    for (const source of [
      'import { useHomeAssistantRuntime } from "../../HomeAssistantRuntime";',
      'import { createConnection } from "home-assistant-js-websocket";',
      'import { createHomeProjectRepository } from "../../home-project/repository";',
      'const save = () => window.localStorage.setItem("demo", "state");',
      'const request = () => fetch("/api");',
      'const client = import("../../HomeAssistantRuntime");',
    ]) {
      await writeFile(adapter, source);
      const result = check();
      assert.equal(result.status, 1, source);
      assert.match(result.stderr, /demo/);
    }
    await writeFile(adapter, 'export const value = 1;');
    await writeFile(join(directory, "packages/engine/src/control.ts"), 'export { value } from "./onboarding/demo/adapter";');
    assert.match(check().stderr, /demo internals/);
    await writeFile(join(directory, "packages/engine/src/control.ts"), 'const data = import("./onboarding/demo/adapter");');
    assert.match(check().stderr, /demo internals/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
