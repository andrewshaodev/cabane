import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const updates = readFileSync(0, "utf8")
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((line) => line.split(/\s+/))
  .filter(([, sha]) => !/^0+$/.test(sha));
if (updates.length) {
  const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
  const head = git("rev-parse", "HEAD");
  if (updates.some(([, sha]) => git("rev-parse", `${sha}^{commit}`) !== head))
    throw new Error(
      "Push one checked-out commit at a time so verification covers the pushed code.",
    );
  if (git("status", "--porcelain", "--untracked-files=all"))
    throw new Error(
      "Commit or stash local changes before pushing: verification must cover the committed tree.",
    );
  // Tests create temporary repositories; do not pass Git's hook repository overrides.
  const environment = { ...process.env };
  for (const name of git("rev-parse", "--local-env-vars").split("\n")) delete environment[name];
  delete environment.CABANE_TEST_SUITE;
  delete environment.CABANE_VERIFY_GROUP;
  const result = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "verify"], {
    stdio: "inherit",
    env: environment,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
  if (git("rev-parse", "HEAD") !== head || git("status", "--porcelain", "--untracked-files=all"))
    throw new Error(
      "The checkout changed during verification. Commit the final code and push again.",
    );
}
