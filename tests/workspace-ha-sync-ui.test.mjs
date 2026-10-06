import assert from "node:assert/strict";
import test from "node:test";
import { act } from "react";
import { withModules } from "./test-server.mjs";
import { withStorageDom } from "./dom-test-environment.mjs";

await withModules(async (load) => {
  const { mountHaStorageHarness, mountHaStorageBackgroundHarness } = await load(
    "/tests/fixtures/ha-storage-harness.tsx",
  );
  const { readSyncCursor } = await load("/apps/web/src/workspaces/workspace-sync-state.ts");
  const text = (dom, value) => dom.document.body.textContent.includes(value);
  const link = (dom, value) =>
    [...dom.document.querySelectorAll("a")].find((node) => node.textContent.trim() === value);

  test("authenticated storage enables sync in one action without a preliminary upload", () =>
    withStorageDom(async (dom) => {
      const harness = await dom.mount(mountHaStorageHarness);
      await dom.click("Enable sync");
      await dom.until(() => text(dom, "Synced with HA"));
      assert.equal(harness.getRemoteVersion(), 1);
      await act(async () => {
        const entry = await harness.repository.read(harness.id);
        await harness.repository.rename(harness.id, entry.record.revision, "Renamed room");
      });
      await dom.pollSync();
      await dom.until(() => harness.getRemoteVersion() === 2);
    }));

  test("automatic sync continues when Connection settings are absent", () =>
    withStorageDom(async (dom) => {
      const harness = await dom.mount(mountHaStorageBackgroundHarness);
      await act(async () => {
        const entry = await harness.repository.read(harness.id);
        await harness.repository.rename(harness.id, entry.record.revision, "Edited in Construct");
      });
      // Initial reconciliation can still be in flight. Explicitly drive subsequent
      // interval callbacks instead of waiting three seconds of wall-clock time.
      await dom.until(async () => {
        await dom.pollSync();
        return harness.getRemoteVersion() === 2;
      });
      assert.equal(dom.button("Workspace storage"), undefined);
    }));

  test("storage setup explains a missing integration and never offers unavailable operations", () =>
    withStorageDom(async (dom) => {
      await dom.mount(mountHaStorageHarness, { missing: true });
      await dom.until(() => text(dom, "Install Cabane"));
      assert.equal(
        link(dom, "Setup guide").getAttribute("href"),
        "https://github.com/cabane-app/cabane-home-assistant#install",
      );
      assert.equal(dom.button("Save"), undefined);
      assert.equal(dom.document.querySelector('[role="switch"]'), null);
      await dom.click("Check again");
      await dom.until(() => text(dom, "Install Cabane"));
    }));

  test("deleting the remote copy disables sync and preserves the local workspace", () =>
    withStorageDom(async (dom) => {
      const harness = await dom.mount(mountHaStorageHarness);
      assert.equal(dom.document.querySelector('[role="switch"]'), null);
      await dom.click("Enable sync");
      await dom.until(() => text(dom, "Synced with HA"));
      await dom.click("Delete saved copy");
      await dom.until(() => text(dom, "Home Assistant copy deleted. Your browser copy is safe."));
      assert.equal(harness.getRemoteVersion(), null);
      assert.ok(dom.button("Enable sync"));
      assert.ok((await harness.repository.read(harness.id))?.record);
    }));

  test("a first manual backup remains available without enabling sync", () =>
    withStorageDom(async (dom) => {
      const harness = await dom.mount(mountHaStorageHarness);
      await dom.until(() => dom.button("Enable sync"));
      assert.equal(harness.getRemoteVersion(), null);
      await dom.click("Save a copy now");
      await dom.until(() => text(dom, "Saved to HA · sync off"));
      assert.equal(
        (await readSyncCursor(dom.indexedDB, "https://ha.test", harness.id)).enabled,
        false,
      );
    }));

  test("sidebar setup waits for saved sync, opens the actual HA panel, and keeps mobile optional", () =>
    withStorageDom(async (dom) => {
      const harness = await dom.mount(mountHaStorageHarness);
      await dom.until(() => dom.button("Enable sync"));
      assert.equal(link(dom, "Open in Home Assistant"), undefined);
      assert.equal(harness.getRemoteVersion(), null);
      await dom.click("Enable sync");
      await dom.until(() => link(dom, "Open in Home Assistant"));
      assert.equal(
        link(dom, "Open in Home Assistant").getAttribute("href"),
        "https://ha.test/cabane",
      );
      const mobile = [...dom.document.querySelectorAll("details")].find((node) =>
        node.textContent.includes("Using the mobile app?"),
      );
      assert.equal(mobile.hasAttribute("open"), false);
      assert.match(mobile.textContent, /same Home Assistant instance/);
    }));

  test("storage-only integrations do not imply the sidebar is installed", () =>
    withStorageDom(async (dom) => {
      const harness = await dom.mount(mountHaStorageHarness, { panelMissing: true });
      await dom.until(() => link(dom, "Install with HACS"));
      assert.equal(link(dom, "Open in Home Assistant"), undefined);
      await dom.click("Check again");
      assert.equal(harness.getRemoteVersion(), null);
      harness.setIntegrationInstalled();
      await dom.click("Check again");
      await dom.until(() => dom.button("Enable sync"));
      assert.equal(link(dom, "Install with HACS"), undefined);
      assert.equal(harness.getRemoteVersion(), null);
    }));
});
