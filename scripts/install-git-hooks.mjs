import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";

// Source archives and CI installs do not need local Git hooks.
if (process.env.CI !== "true" && existsSync(".git")) {
  const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
  let configured = "";
  try {
    configured = git("config", "--get", "core.hooksPath");
  } catch (error) {
    if (error.status !== 1) throw error;
  }
  if (configured && configured !== ".githooks")
    throw new Error(
      `Existing core.hooksPath (${configured}) must be integrated before installing Cabane hooks.`,
    );
  const hooksDirectory = git("rev-parse", "--git-path", "hooks");
  if (
    !configured &&
    existsSync(hooksDirectory) &&
    readdirSync(hooksDirectory).some((name) => !name.endsWith(".sample"))
  )
    throw new Error("Existing Git hooks must be integrated before installing Cabane hooks.");
  git("config", "--local", "core.hooksPath", ".githooks");
  console.log("Installed Cabane pre-push verification.");
}
