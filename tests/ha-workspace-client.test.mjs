import assert from "node:assert/strict";
import test from "node:test";
import {
  createHaWorkspaceClient,
  HaWorkspaceConflictError,
  HaWorkspaceUnavailableError,
} from "../apps/web/src/workspaces/ha-workspace-client.ts";

test("workspace client sends the exact versioned command payloads", async () => {
  const sent = [];
  const client = createHaWorkspaceClient(async (message) => {
    sent.push(message);
    return message.type.endsWith("/get") ? { version: 3, document: "{}" } : 4;
  });
  await client.get("home-1");
  await client.put("home-1", "{}", 3);
  await client.delete("home-1", 4);
  assert.deepEqual(sent, [
    { type: "cabane/workspaces/get", home_id: "home-1" },
    { type: "cabane/workspaces/put", home_id: "home-1", document: "{}", expected_version: 3 },
    { type: "cabane/workspaces/delete", home_id: "home-1", expected_version: 4 },
  ]);
});

test("workspace client classifies conflict and unavailable integration", async () => {
  const conflict = createHaWorkspaceClient(async () => {
    throw { code: "conflict" };
  });
  await assert.rejects(conflict.list(), HaWorkspaceConflictError);
  const unavailable = createHaWorkspaceClient(async () => {
    throw { code: "unknown_command" };
  });
  await assert.rejects(unavailable.list(), HaWorkspaceUnavailableError);
});
