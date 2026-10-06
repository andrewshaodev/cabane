import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";
import { withStorageDom } from "./dom-test-environment.mjs";

await withModules(async (load) => {
  const { mountHaOpenHarness } = await load("/tests/fixtures/ha-storage-harness.tsx");
  const { readSyncCursor } = await load("/apps/web/src/workspaces/workspace-sync-state.ts");
  for (const [name, options] of [
    ["fresh", {}],
    ["divergent", { divergent: true }],
    ["wrong origin", { wrongOrigin: true }],
    ["missing", { missing: true }],
  ]) {
    test(`receiving a ${name} HA home preserves identity and local data`, () =>
      withStorageDom(async (dom) => {
        const harness = await dom.mount(mountHaOpenHarness, options);
        if (name === "fresh") {
          await dom.until(() => harness.getOpened());
          assert.equal(harness.getOpened(), harness.id);
          assert.equal((await harness.repository.read(harness.id)).metadata.name, "Remote cottage");
          assert.equal(
            (await readSyncCursor(dom.indexedDB, "https://ha.test", harness.id)).enabled,
            true,
          );
          assert.deepEqual(harness.getCalls(), ["cabane/workspaces/get"]);
        } else {
          await dom.until(() => dom.document.querySelector('[role="alert"]'));
          assert.equal(harness.getOpened(), null);
          const entry = await harness.repository.read(harness.id);
          if (options.divergent) {
            assert.equal(entry.metadata.name, "My local changes");
            assert.ok(
              [...dom.document.querySelectorAll("a")].some(
                (node) => node.textContent === "Review copies",
              ),
            );
          } else assert.equal(entry, null);
        }
      }));
  }
});
