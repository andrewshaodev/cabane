import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repositoryRoot = process.cwd();
const cliPath = resolve(repositoryRoot, "scripts/validate-floor.mjs");
const runCli = (...arguments_) =>
  spawnSync(process.execPath, [cliPath, ...arguments_], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });

test("validates one pure FloorSpec JSON file with machine-readable counts", () => {
  const floorPath = resolve(repositoryRoot, "tests/fixtures/cabane-floor.json");
  const result = runCli(floorPath, "--json");

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {
    valid: true,
    status: "FLOOR_VALID",
    file: floorPath,
    floorId: "cabane-floor",
    counts: { rooms: 2, walls: 8, openings: 2 },
    issues: [],
  });
});

test("reports malformed JSON without starting layout validation", () => {
  const directory = mkdtempSync(resolve(tmpdir(), "cabane-floor-validation-"));
  try {
    const floorPath = resolve(directory, "malformed-floor.json");
    writeFileSync(floorPath, '{"id":', "utf8");

    const result = runCli(floorPath, "--json");
    const payload = JSON.parse(result.stdout);

    assert.equal(result.status, 1);
    assert.equal(payload.valid, false);
    assert.equal(payload.file, floorPath);
    assert.equal(payload.issues.length, 1);
    assert.equal(payload.issues[0].code, "floor.json.parse");
    assert.equal(payload.issues[0].path, "$");
    assert.equal(payload.issues[0].severity, "fatal");
    assert.equal(typeof payload.issues[0].message, "string");
    assert.ok(payload.issues[0].message.length > 0);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("distinguishes file read failures and rejects ambiguous arguments", () => {
  const missingPath = resolve(repositoryRoot, "does-not-exist-floor.json");
  const missing = runCli(missingPath, "--json");
  assert.equal(missing.status, 1);
  assert.equal(JSON.parse(missing.stdout).issues[0].code, "floor.file.read");

  const ambiguous = runCli("first.json", "second.json", "--json");
  assert.equal(ambiguous.status, 1);
  assert.deepEqual(JSON.parse(ambiguous.stdout).issues, [
    {
      code: "floor.arguments",
      path: "$",
      message: "Provide exactly one FloorSpec JSON path.",
      severity: "fatal",
    },
  ]);

  const unsupported = runCli("floor.json", "--bogus", "--json");
  assert.equal(unsupported.status, 1);
  assert.equal(JSON.parse(unsupported.stdout).issues[0].code, "floor.arguments");
});
