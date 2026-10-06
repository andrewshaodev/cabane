import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const { editorPath, editorRequestForPath, workspaceHomePath, workspaceIdForPath, shouldFlushEditorExit } = await load("/apps/web/src/editor-routes.ts");
  test("workspace editor routes preserve identity across every editor mode", () => {
    for (const request of [{ mode: "construct" }, { mode: "furnish" }, { mode: "connect" }, { mode: "connect", view: "rooms" }, { mode: "connect", view: "devices" }]) {
      const path = editorPath(request, "home-a");
      assert.deepEqual(editorRequestForPath(path), request);
      assert.equal(workspaceIdForPath(path), "home-a");
    }
    assert.equal(editorPath({ mode: "connect", relationshipId: "lamp" }, "home-b"), "/workspaces/home-b/connect/devices");
    assert.equal(workspaceHomePath("home a"), "/workspaces/home%20a");
    assert.equal(workspaceIdForPath("/workspaces/home%20a/construct"), "home a");
    for (const path of ["/construct", "/arrange", "/connect", "/connect/devices", "/workspaces", "/"]) assert.equal(editorRequestForPath(path), null);
  });
  test("leaving the editor saves when switching workspace even between matching modes", () => {
    assert.equal(shouldFlushEditorExit("home-a", "/workspaces/home-a/arrange"), false);
    assert.equal(shouldFlushEditorExit("home-a", "/workspaces/home-a/connect/devices"), false);
    for (const path of ["/workspaces/home-b/construct", "/workspaces/home-b/connect", "/workspaces/home-a", "/workspaces", "/"]) {
      assert.equal(shouldFlushEditorExit("home-a", path), true);
    }
  });
  test("action bar customization is a refreshable editor panel route", () => {
    const path = editorPath({ mode: "construct", panel: "action-bar" }, "home-a");
    assert.equal(path, "/workspaces/home-a/shortcuts");
    assert.deepEqual(editorRequestForPath(path), { mode: "construct", panel: "action-bar" });
    assert.deepEqual(editorRequestForPath("/workspaces/home-a/action-bar"), { mode: "construct", panel: "action-bar" });
    assert.equal(shouldFlushEditorExit("home-a", "/workspaces/home-a"), true);
    assert.equal(shouldFlushEditorExit("home-a", "/workspaces/home-a/construct"), false);
  });
});
