import groups from "./verification-groups.json" with { type: "json" };

export const focusedGroups = ["workspace", "construct", "runtime"];

export function selectVerificationTests(files, group) {
  if (!focusedGroups.includes(group)) throw new Error(`Unknown verification group: ${group}`);
  const classified = new Set(Object.values(groups).flatMap((entry) => entry.tests));
  const missing = [...classified].filter((file) => !files.includes(file));
  if (missing.length) throw new Error(`Stale verification inventory: ${missing.join(", ")}`);
  const unknown = files.filter((file) => !classified.has(file));
  if (unknown.length) {
    return { files, reason: `Full-suite fallback: unclassified tests: ${unknown.join(", ")}` };
  }
  const selected = new Set([...groups.common.tests, ...groups[group].tests]);
  return { files: files.filter((file) => selected.has(file)), reason: groups[group].description };
}

export function verificationHelp() {
  return [
    "Choose a focused check only for changes confined to the named domain:",
    ...focusedGroups.map((name) => `  npm run verify:${name} — ${groups[name].description}`),
    "Local verification policy: AGENTS.md#workflow.",
    "Domain groups run verify:fast plus their Node AND browser tests. Individual test files can be run directly.",
    "Inventory: tests/verification-groups.json. New unclassified tests fall back to the full suite; removed/renamed inventory entries fail until maintained.",
  ].join("\n");
}
