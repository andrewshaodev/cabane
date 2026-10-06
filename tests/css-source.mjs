import { readFileSync } from "node:fs";

// Read the public stylesheet in cascade order, including colocated CSS imports.
// Package imports (fonts) are irrelevant to selector assertions and stay intact.
export function readCssSource(url, ancestors = new Set()) {
  if (ancestors.has(url.href)) throw new Error(`Circular CSS import: ${url.href}`);
  const next = new Set([...ancestors, url.href]);
  return readFileSync(url, "utf8").replace(/@import\s+["'](\.[^"']+)["']\s*;/g, (_, relative) =>
    readCssSource(new URL(relative, url), next),
  );
}
