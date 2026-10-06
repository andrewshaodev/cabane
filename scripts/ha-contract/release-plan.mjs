export function contractRequiresRelease(previous, release) {
  if (previous?.fingerprint === release.fingerprint) return false;
  const baseline = release.baseline;
  return !(
    baseline &&
    release.fingerprint === baseline.compatibilityFingerprint &&
    release.revision === baseline.revision &&
    previous?.revision === baseline.revision &&
    previous?.fingerprint === baseline.fingerprint
  );
}

export function integrationReleasePlan(version, previous, release) {
  if (!contractRequiresRelease(previous, release)) return null;
  if (previous && previous.revision >= release.revision)
    throw new Error("Refusing to replace a newer integration contract with an older one.");
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error("Expected a stable integration version.");
  const [major, minor, patch] = version.split(".").map(Number);
  const next = `${major}.${minor}.${patch + 1}`;
  const changes = [...(release.history ?? []), release].filter(
    (change) => change.revision > (previous?.revision ?? 0),
  );
  const notes = [
    `Cabane ${next} updates the Home Assistant panel to workspace contract revision ${release.revision}.`,
    "",
    "## Contract changes and upgrade impact",
    "",
    ...changes.flatMap((change) => [
      `### Contract revision ${change.revision}: ${change.summary}`,
      "",
      ...change.breakingChanges.map((note) => `- ${note}`),
      "",
    ]),
    "## Update",
    "",
    "Update Cabane in HACS, restart Home Assistant, then reload your browser or Companion app. Keep saved workspaces unchanged; no manual JSON edits are needed. Older clients continue to block unsupported data to protect it.",
    "",
    "For manual installation, extract the complete cabane.zip release asset into /config/custom_components/cabane/, restart HA and reload the frontend.",
    "",
    "This release passed producer verification, native-panel browser checks, representative-scale checks, integration tests and package validation with synthetic HA data. Live household and Companion acceptance are separate.",
    "",
  ].join("\n");
  return { version: next, tag: `v${next}`, notes };
}
