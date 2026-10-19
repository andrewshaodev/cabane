import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdtempSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  copyFileSync,
  chmodSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";

test("pre-push checks the clean commit without running verification commands", () => {
  const root = mkdtempSync(join(tmpdir(), "cabane-hooks-"));
  const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  const run = (input, env = {}) =>
    spawnSync(process.execPath, [resolve("scripts/pre-push.mjs")], {
      cwd: root,
      input,
      encoding: "utf8",
      env: { ...process.env, ...env },
    });
  try {
    git("init", "-q");
    git("config", "user.name", "Hook test");
    git("config", "user.email", "hook@example.invalid");
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({
        scripts: {
          verify:
            "node -e \"require('node:fs').writeFileSync('verification-ran', 'yes'); process.exit(Number(process.env.HOOK_TEST_EXIT || 0))\"",
        },
      }),
    );
    mkdirSync(join(root, "scripts"));
    mkdirSync(join(root, ".githooks"));
    copyFileSync(resolve("scripts/pre-push.mjs"), join(root, "scripts/pre-push.mjs"));
    copyFileSync(resolve(".githooks/pre-push"), join(root, ".githooks/pre-push"));
    chmodSync(join(root, ".githooks/pre-push"), 0o755);
    git("config", "core.hooksPath", ".githooks");
    git("add", ".");
    git("commit", "-qm", "fixture");
    const head = git("rev-parse", "HEAD");
    const update = `HEAD ${head} refs/heads/main ${"0".repeat(40)}\n`;
    const checked = run(update, { HOOK_TEST_EXIT: "7" });
    assert.equal(checked.status, 0, checked.stderr);
    assert.equal(existsSync(join(root, "verification-ran")), false);
    const remote = join(root, ".git", "remote.git");
    git("init", "--bare", "-q", remote);
    const push = (code) =>
      spawnSync("git", ["push", remote, "HEAD:refs/heads/main"], {
        cwd: root,
        encoding: "utf8",
        env: { ...process.env, HOOK_TEST_EXIT: code },
      });
    const accepted = push("7");
    assert.equal(accepted.status, 0, accepted.stderr);
    assert.equal(existsSync(join(root, "verification-ran")), false);
    assert.equal(git("--git-dir", remote, "rev-parse", "refs/heads/main"), head);
    writeFileSync(join(root, "dirty"), "uncommitted");
    assert.match(run(update).stderr, /Commit or stash/);
    assert.equal(run(`(delete) ${"0".repeat(40)} refs/heads/old ${head}\n`).status, 0);
    git("add", ".");
    git("commit", "-qm", "second");
    assert.match(run(update).stderr, /checked-out commit/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("hook installer preserves custom hooks and supports repeated installation", () => {
  const root = mkdtempSync(join(tmpdir(), "cabane-install-hooks-"));
  const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  const install = () =>
    spawnSync(process.execPath, [resolve("scripts/install-git-hooks.mjs")], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, CI: "false" },
    });
  try {
    git("init", "-q");
    mkdirSync(join(root, ".git/hooks"), { recursive: true });
    writeFileSync(join(root, ".git/hooks/pre-push"), "custom");
    assert.notEqual(install().status, 0);
    rmSync(join(root, ".git/hooks/pre-push"));
    assert.equal(install().status, 0);
    assert.equal(install().status, 0);
    assert.equal(git("config", "--get", "core.hooksPath"), ".githooks");
    git("config", "core.hooksPath", "custom-hooks");
    assert.notEqual(install().status, 0);
    assert.equal(git("config", "--get", "core.hooksPath"), "custom-hooks");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
