import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { contractFingerprint, validateContractRelease } from "./ha-contract/source-contract.mjs";
import {
  compatibilityManifestPath,
  portableContract,
} from "./ha-contract/compatibility-manifest.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const path = new URL("../docs/ha-contract.json", import.meta.url);
const args = process.argv.slice(2);
let release;
try {
  release = JSON.parse(readFileSync(path, "utf8"));
} catch {
  release = {};
}
if (args[0] === "--record") {
  const summary = args[args.indexOf("--summary") + 1];
  const breakingChange = args[args.indexOf("--breaking-change") + 1];
  if (!args.includes("--summary") || !args.includes("--breaking-change"))
    throw new Error("Supply --summary and --breaking-change with human-readable release notes.");
  const compatibilityPath = new URL(`../${compatibilityManifestPath}`, import.meta.url);
  const compatibility = JSON.parse(readFileSync(compatibilityPath, "utf8"));
  writeFileSync(
    compatibilityPath,
    JSON.stringify({ ...compatibility, portableTypes: portableContract(root) }, null, 2) + "\n",
  );
  const current = contractFingerprint(root);
  const history = [...(release.history ?? [])];
  if (release.revision)
    history.push({
      revision: release.revision,
      summary: release.summary,
      breakingChanges: release.breakingChanges,
    });
  const next = {
    revision: (release.revision ?? 0) + 1,
    fingerprint: current.fingerprint,
    summary,
    breakingChanges: [breakingChange],
    history,
    ...(release.baseline ? { baseline: release.baseline } : {}),
  };
  validateContractRelease(next, current.fingerprint);
  writeFileSync(path, JSON.stringify(next, null, 2) + "\n");
  console.log(`Recorded HA contract revision ${next.revision}.`);
} else if (args[0] === "--hook") {
  const event = JSON.parse(readFileSync(0, "utf8"));
  try {
    const current = contractFingerprint(root);
    validateContractRelease(release, current.fingerprint);
    console.log("{}");
  } catch (error) {
    // Continue once; if still blocked, report the limitation instead of looping.
    console.log(
      JSON.stringify(
        event.stop_hook_active
          ? { systemMessage: error.message }
          : {
              decision: "block",
              reason: `${error.message} Follow docs/ha-contract-releases.md. Keep unsupported data blocked. After a push to main, GitHub Actions publishes the matching integration. If the user paused or cancelled this work, report the pending release requirement without continuing it.`,
            },
      ),
    );
  }
} else {
  const current = contractFingerprint(root);
  validateContractRelease(release, current.fingerprint);
  console.log(
    `HA contract revision ${release.revision} verified (${current.sources.length} sources).`,
  );
}
