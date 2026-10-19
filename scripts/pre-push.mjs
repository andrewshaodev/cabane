import { execFileSync } from "node:child_process";
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
    throw new Error("Push the checked-out commit so task-specific checks match the pushed code.");
  if (git("status", "--porcelain", "--untracked-files=all"))
    throw new Error(
      "Commit or stash local changes before pushing so task-specific checks match the pushed code.",
    );
  console.log(
    "Pre-push checkout checks passed. Local verification is task-specific; CI runs the full gate.",
  );
}
