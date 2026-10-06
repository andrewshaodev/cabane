import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Churn is path-based and excludes merge commits; renames are not followed.
// This is a review signal, not a complexity score or a CI size limit.
const git = (...args) => execFileSync("git", args, { encoding: "utf8" });
const history = git("log", "-100", "--no-merges", "--format=", "--name-only");
const churn = new Map();
for (const file of history.split("\n").filter(Boolean)) {
  churn.set(file, (churn.get(file) ?? 0) + 1);
}
const files = [
  ...new Set(
    git("ls-files", "--cached", "--others", "--exclude-standard", "-z").split("\0").filter(Boolean),
  ),
];
const rows = [];
for (const file of files) {
  let source;
  try {
    source = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  if (source.includes("\0")) continue;
  const lines = source ? source.split("\n").length - Number(source.endsWith("\n")) : 0;
  const changes = churn.get(file) ?? 0;
  if (lines > 500 || changes >= 10) rows.push({ file, lines, changes });
}
rows.sort((a, b) => b.changes - a.changes || b.lines - a.lines || a.file.localeCompare(b.file));
console.log("| File | Lines | Changes in last 100 non-merge commits |");
console.log("| --- | ---: | ---: |");
for (const row of rows) console.log(`| \`${row.file}\` | ${row.lines} | ${row.changes} |`);
