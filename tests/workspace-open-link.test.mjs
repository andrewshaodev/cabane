import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";
await withModules(async (load) => {
  const { createWorkspaceOpenLink, parseWorkspaceOpenLink } = await load(
    "/apps/web/src/workspaces/workspace-open-link.ts",
  );
  test("workspace links contain only identity, validated HA origin and destination", () => {
    const link = createWorkspaceOpenLink(
      "https://cabane.my/workspaces/x?secret=no#draft",
      "home-123",
      "https://ha.example/",
      true,
    );
    assert.equal(
      link,
      "https://cabane.my/open/home-123?ha=https%3A%2F%2Fha.example&view=dashboard",
    );
    assert.deepEqual(parseWorkspaceOpenLink(link), {
      homeId: "home-123",
      origin: "https://ha.example",
      dashboard: true,
    });
    assert.equal(parseWorkspaceOpenLink(link + "&auth_callback=1&code=abc").homeId, "home-123");
  });
  test("malformed IDs, credential-bearing origins and unsupported schemes fail closed", () => {
    for (const link of [
      "https://cabane.my/open/x?ha=javascript:foo",
      "https://cabane.my/open/x?ha=https://user:password@ha.example",
      "https://cabane.my/open/%2Fetc?ha=https://ha.example",
      "https://cabane.my/open/x?ha=https://ha.example/private?secret=1",
    ]) {
      assert.equal(parseWorkspaceOpenLink(link), null, link);
    }
    assert.throws(() =>
      createWorkspaceOpenLink("https://cabane.my", "../x", "https://ha.example", false),
    );
  });
});
