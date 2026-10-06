import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const { initialWorkspaceOnboarding, parseWorkspaceOnboarding } = await load(
    "/packages/engine/src/home-project/workspace-onboarding-state.ts",
  );
  test("only explicit fresh installation state assigns a demo and opens welcome", () => {
    const fresh = initialWorkspaceOnboarding("demo-id");
    assert.equal(fresh.welcomeDismissed, false);
    const adopted = initialWorkspaceOnboarding(null);
    assert.equal(adopted.demoWorkspaceId, null);
    assert.equal(adopted.welcomeDismissed, true);
    assert.deepEqual(parseWorkspaceOnboarding(fresh), fresh);
  });
  test("damaged onboarding state cannot grant eligibility or invent destinations", () => {
    const valid = initialWorkspaceOnboarding("demo-id");
    for (const value of [
      null,
      [],
      { ...valid, version: 2 },
      { ...valid, welcomeDismissed: "false" },
      { ...valid, demoWorkspaceId: "" },
      { ...valid, destinations: { connect: 5 } },
      { ...valid, destinations: { other: "id" } },
    ])
      assert.equal(parseWorkspaceOnboarding(value), null);
    assert.deepEqual(
      parseWorkspaceOnboarding({ ...valid, destinations: { connect: "personal" } }).destinations,
      { connect: "personal" },
    );
  });
  const { firstOnboardingLight } = await load("/apps/web/src/workspaces/first-onboarding-light.ts");
  test("first-device selection honors the content hint and falls back without a hard-coded room", () => {
    const room = (id) => ({
      id,
      devices: [
        {
          id: `${id}-lamp`,
          entitySlots: [{ id: `${id}-slot`, deviceRole: "primary", compatibleDomains: ["light"] }],
        },
      ],
    });
    const manifest = { floors: [{ rooms: [room("hall"), room("living")] }] };
    assert.equal(firstOnboardingLight(manifest, "living").roomId, "living");
    assert.equal(firstOnboardingLight(manifest, "deleted").roomId, "hall");
    assert.equal(firstOnboardingLight({ floors: [{ rooms: [] }] }), undefined);
  });
});
