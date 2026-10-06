import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("demo Connect uses the same editor route as an existing home", async () => {
  const host = await readFile(new URL("../apps/web/src/workspaces/WorkspaceHost.tsx", import.meta.url), "utf8");
  const product = await readFile(new URL("../apps/web/src/ConnectedProduct.tsx", import.meta.url), "utf8");
  const routedEditor = await readFile(new URL("../apps/web/src/RoutedHomeEditor.tsx", import.meta.url), "utf8");
  const experience = await readFile(new URL("../packages/engine/src/onboarding/OnboardingExperience.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(host, /demoConnect|onboarding\.start\("build"\)/);
  assert.match(host, /<ConnectedProduct/);
  assert.doesNotMatch(product, /leaveOnConnect/);
  assert.doesNotMatch(routedEditor, /leaveOnConnect/);
  assert.doesNotMatch(experience, /if \(isDemo\).*connect\(\)/);
  assert.doesNotMatch(experience, /if \(isDemo && onboarding\).*start\("build"\)/);
  assert.match(experience, /onOpenConnect=\{onOpenConnect\}/);
});
