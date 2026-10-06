import { createHash } from "node:crypto";
import {
  canonicalCompatibility,
  compatibilityManifestPath,
  readCompatibilityManifest,
} from "./compatibility-manifest.mjs";

export function contractFingerprint(root, entries) {
  const manifest = readCompatibilityManifest(root, entries);
  return {
    fingerprint: createHash("sha256")
      .update(JSON.stringify(canonicalCompatibility(manifest)))
      .digest("hex"),
    sources: [compatibilityManifestPath],
  };
}
export function validateContractRelease(release, fingerprint) {
  if (
    !Number.isSafeInteger(release.revision) ||
    release.revision < 1 ||
    release.fingerprint !== fingerprint
  )
    throw new Error(
      "Persisted contract changed. Run npm run contract:record -- --summary 'Describe the change' --breaking-change 'Explain the upgrade impact', then commit both compatibility manifests.",
    );
  if (
    typeof release.summary !== "string" ||
    !release.summary.trim() ||
    !Array.isArray(release.breakingChanges) ||
    !release.breakingChanges.length ||
    release.breakingChanges.some((note) => typeof note !== "string" || !note.trim())
  )
    throw new Error("The contract release must describe the change and its compatibility impact.");
}
