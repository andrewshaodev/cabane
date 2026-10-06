/** Keep strict parsing while giving older clients a safe recovery path. */
export function unsupportedProjectFormatMessage(detail: string): string {
  return (
    "This workspace may have been saved with a newer version of Cabane. " +
    "Update the Cabane integration in HACS, restart Home Assistant, then reload " +
    "your browser or Companion app and try again. If you use cabane.my, refresh " +
    "the website to load the latest version. Keep your saved workspace; no manual " +
    `edits are needed. Details: ${detail}`
  );
}

export function projectSchemaVersionMessage(version: unknown, kind: "project" | "record"): string {
  const detail = `Supported ${kind} versions are 1 and 2.`;
  return typeof version === "number" && version > 2
    ? unsupportedProjectFormatMessage(detail)
    : detail;
}
