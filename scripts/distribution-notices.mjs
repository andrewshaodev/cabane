import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// CSS-loaded fonts may be absent from JavaScript chunk module inventories.
const fontPackages = ["@fontsource/roboto", "@mdi/font"];

export function bundledDependencyNotices(chunks) {
  const packages = new Set(
    fontPackages.map((name) => fileURLToPath(new URL(`../node_modules/${name}`, import.meta.url))),
  );
  for (const chunk of chunks) {
    for (const id of Object.keys(chunk.modules ?? {})) {
      const marker = "/node_modules/";
      const index = id.lastIndexOf(marker);
      if (index < 0) continue;
      const parts = id.slice(index + marker.length).split("/");
      packages.add(
        id.slice(0, index + marker.length) +
          parts.slice(0, parts[0].startsWith("@") ? 2 : 1).join("/"),
      );
    }
  }
  const notices = [];
  for (const directory of [...packages].sort()) {
    const metadata = JSON.parse(readFileSync(join(directory, "package.json"), "utf8"));
    notices.push(
      `${metadata.name} ${metadata.version} (${typeof metadata.license === "string" ? metadata.license : "see notice"})`,
    );
    for (const name of readdirSync(directory).filter((entry) =>
      /^(licen[cs]e|copying|notice)([.-]|$)/i.test(entry),
    )) {
      try {
        notices.push(readFileSync(join(directory, name), "utf8"));
      } catch {
        // Some packages use a licence directory rather than a plain-text file.
      }
    }
  }
  return notices.join("\n\n---\n\n");
}
