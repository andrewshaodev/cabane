import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import test from "node:test";
import groups from "./verification-groups.json" with { type: "json" };
import { focusedGroups, selectVerificationTests } from "./verification-groups.mjs";

const files = [...new Set(Object.values(groups).flatMap((group) => group.tests))].sort();

test("the maintained inventory contains only existing tests", () => {
  const actual = readdirSync(new URL(".", import.meta.url));
  for (const file of files) assert.ok(actual.includes(file), `Stale inventory: ${file}`);
});

test("focused groups retain shared publication and repository coverage", () => {
  for (const group of focusedGroups) {
    const selection = selectVerificationTests(files, group);
    assert.ok(selection.files.length < files.length, `${group} should remain focused`);
    for (const file of groups.common.tests) assert.ok(selection.files.includes(file));
    assert.ok(selection.files.includes("workspace-repository.test.mjs"));
    assert.ok(selection.files.includes("home-project-repository.test.mjs"));
  }
  assert.ok(selectVerificationTests(files, "construct").files.includes("reference-plan.test.mjs"));
  assert.ok(
    selectVerificationTests(files, "runtime").files.includes("home-assistant-controls.test.mjs"),
  );
  assert.ok(
    selectVerificationTests(files, "workspace").files.includes("workspace-backup-browser.test.mjs"),
  );
});

test("unclassified tests conservatively select every test for every focused group", () => {
  const expanded = [...files, "new-cross-cutting.test.mjs"];
  for (const group of focusedGroups) {
    const selection = selectVerificationTests(expanded, group);
    assert.deepEqual(selection.files, expanded);
    assert.match(selection.reason, /Full-suite fallback/);
  }
});

test("renamed or removed inventory entries and invalid group names fail visibly", () => {
  assert.throws(
    () =>
      selectVerificationTests(
        files.filter((file) => file !== "workspace-repository.test.mjs"),
        "workspace",
      ),
    /Stale verification inventory/,
  );
  assert.throws(() => selectVerificationTests(files, "typo"), /Unknown verification group/);
});

test("focused entry points cannot silently intersect with unit-only or browser-only coverage", async () => {
  const { spawnSync } = await import("node:child_process");
  for (const suite of ["unit", "browser"]) {
    const result = spawnSync(process.execPath, ["scripts/verify-focused.mjs", "runtime"], {
      cwd: new URL("..", import.meta.url),
      env: { ...process.env, CABANE_TEST_SUITE: suite },
      encoding: "utf8",
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /unset CABANE_TEST_SUITE/);
  }
});
