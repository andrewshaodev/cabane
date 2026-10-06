import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  contractFingerprint,
  validateContractRelease,
} from "../scripts/ha-contract/source-contract.mjs";
import { integrationReleasePlan } from "../scripts/ha-contract/release-plan.mjs";

test("the contract follows schema dependencies and ignores comments/formatting", () => {
  const root = mkdtempSync(join(tmpdir(), "cabane-contract-"));
  try {
    writeFileSync(join(root, "entry.ts"), 'export { fields } from "./fields";');
    writeFileSync(join(root, "fields.ts"), 'export const fields = ["id"];');
    const before = contractFingerprint(root, ["entry.ts"]);
    assert.deepEqual(before.sources, ["entry.ts", "fields.ts"]);
    writeFileSync(join(root, "fields.ts"), '// A comment\nexport const fields=["id"];\n');
    assert.equal(contractFingerprint(root, ["entry.ts"]).fingerprint, before.fingerprint);
    writeFileSync(join(root, "fields.ts"), 'export const fields = ["id", "edgeColor"];');
    const after = contractFingerprint(root, ["entry.ts"]).fingerprint;
    assert.notEqual(after, before.fingerprint);
    assert.throws(
      () => validateContractRelease({ revision: 1, fingerprint: before.fingerprint }, after),
      /Persisted contract changed/,
    );
    assert.throws(
      () =>
        validateContractRelease(
          { revision: 2, fingerprint: after, summary: "", breakingChanges: [] },
          after,
        ),
      /compatibility impact/,
    );
    validateContractRelease(
      {
        revision: 2,
        fingerprint: after,
        summary: "Wall colors",
        breakingChanges: ["Older panels must update before loading these homes."],
      },
      after,
    );
    rmSync(join(root, "fields.ts"));
    assert.throws(() => contractFingerprint(root, ["entry.ts"]), /Unresolved contract dependency/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("patch releases are idempotent, reject downgrades and retain intervening upgrade notes", () => {
  const release = {
    revision: 3,
    fingerprint: "new",
    summary: "Wall colors",
    breakingChanges: ["Update to retain edgeColor."],
    history: [
      { revision: 2, summary: "Platforms", breakingChanges: ["Update before loading platforms."] },
    ],
  };
  const plan = integrationReleasePlan("0.3.4", { revision: 1, fingerprint: "old" }, release);
  assert.equal(plan.tag, "v0.3.5");
  assert.match(plan.notes, /Platforms/);
  assert.match(plan.notes, /Wall colors/);
  assert.match(plan.notes, /HACS/);
  assert.match(plan.notes, /restart Home Assistant/);
  assert.equal(integrationReleasePlan("0.3.5", release, release), null);
  assert.throws(
    () => integrationReleasePlan("0.3.6", { revision: 4, fingerprint: "future" }, release),
    /newer integration contract/,
  );
  assert.throws(
    () => integrationReleasePlan("0.3.5-beta", undefined, release),
    /stable integration version/,
  );
});
