import assert from "node:assert/strict";
import test from "node:test";
import { workspaceStorageStatus } from "../apps/web/src/workspaces/workspace-availability.ts";
test("storage distinguishes saved, enabled, pending, verified and interrupted without live assumptions", () => {
  assert.equal(workspaceStorageStatus(null).label, "Local only");
  assert.equal(workspaceStorageStatus({ enabled: false }).label, "Saved to HA · sync off");
  assert.equal(workspaceStorageStatus({ enabled: true }).label, "Sync enabled");
  assert.equal(workspaceStorageStatus({ enabled: true }, true).label, "Changes pending");
  assert.equal(
    workspaceStorageStatus({ enabled: true }, false, { kind: "synced" }).label,
    "Synced with HA",
  );
  assert.equal(
    workspaceStorageStatus({ enabled: true }, false, { kind: "disconnected" }).label,
    "Sync interrupted",
  );
  assert.equal(
    workspaceStorageStatus({ enabled: true }, true, { kind: "conflict" }).label,
    "Sync needs attention",
  );
});
