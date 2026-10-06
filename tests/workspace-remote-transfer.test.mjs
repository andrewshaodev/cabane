import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "vite";
import { chromium } from "playwright-core";

test("sync cursor is origin scoped and restore rejects invalid data", async () => {
  const server = await createServer({ root: process.cwd(), configFile: false, appType: "custom", server: { host: "127.0.0.1", port: 0, hmr: false } });
  let browser;
  try {
    server.middlewares.use((req, res, next) => req.url === "/" ? (res.setHeader("Content-Type", "text/html"), res.end("<!doctype html>")) : next());
    await server.listen();
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage();
    await page.goto(server.resolvedUrls.local[0]);
    const result = await page.evaluate(async () => {
      const state = await import("/apps/web/src/workspaces/workspace-sync-state.ts");
      await state.writeSyncCursor(indexedDB, { origin: "https://ha.one", homeId: "home-1", enabled: false, remoteVersion: 2, acknowledgedFingerprint: "abc" });
      return [await state.readSyncCursor(indexedDB, "https://ha.one", "home-1"), await state.readSyncCursor(indexedDB, "https://ha.two", "home-1")];
    });
    assert.equal(result[0].remoteVersion, 2);
    assert.equal(result[1], null);
    const restored = await page.evaluate(async () => {
      const { createWorkspaceRepository } = await import("/packages/engine/src/home-project/index.ts");
      const { ownerProjectRegistries } = await import("/apps/web/src/project-runtime.ts");
      const { exportWorkspaceBackup } = await import("/apps/web/src/workspaces/workspace-transfer.ts");
      const { restoreRemoteWorkspace } = await import("/apps/web/src/workspaces/workspace-remote-transfer.ts");
      const repository = createWorkspaceRepository(indexedDB, ownerProjectRegistries);
      const original = await repository.createBlank("Remote home");
      const id = original.metadata.id;
      const backup = exportWorkspaceBackup(original.metadata, original.record);
      const other = await repository.createBlank("Other home");
      const otherBackup = exportWorkspaceBackup(other.metadata, other.record);
      await repository.delete(id, await repository.readRaw(id));
      const entry = await restoreRemoteWorkspace(repository, backup);
      let invalidRejected = false;
      try { await restoreRemoteWorkspace(repository, backup.replace(id, "wrong-id"), entry.record.revision); }
      catch { invalidRejected = true; }
      let bareRejected = false;
      try { await restoreRemoteWorkspace(repository, JSON.stringify(entry.record.draft), entry.record.revision); }
      catch { bareRejected = true; }
      let wrongTargetRejected = false;
      try { await restoreRemoteWorkspace(repository, otherBackup, entry.record.revision, id); }
      catch { wrongTargetRejected = true; }
      return { sameId: entry.metadata.id === id, invalidRejected, bareRejected, wrongTargetRejected,
        unchanged: (await repository.read(id)).record.homeId === id,
        otherUnchanged: (await repository.read(other.metadata.id)).record.revision === other.record.revision };
    });
    assert.deepEqual(restored, { sameId: true, invalidRejected: true, bareRejected: true, wrongTargetRejected: true, unchanged: true, otherUnchanged: true });
  } finally { await browser?.close(); await server.close(); }
});
