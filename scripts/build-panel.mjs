import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { cp, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import { scopePanelCss } from "./panel-build-tools.mjs";
import { contractFingerprint, validateContractRelease } from "./ha-contract/source-contract.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const web = join(root, "apps/web");
const outDir = join(web, "dist-panel");
const contract = JSON.parse(await readFile(join(root, "docs/ha-contract.json"), "utf8"));
validateContractRelease(contract, contractFingerprint(root).fingerprint);
const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: root,
  encoding: "utf8",
}).trim();
const dirty = Boolean(
  execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).trim(),
);
if (dirty && process.env.CABANE_PANEL_ALLOW_DIRTY !== "1") {
  throw new Error(
    "Native release builds require a clean committed frontend tree. For local tests only, set CABANE_PANEL_ALLOW_DIRTY=1; development artifacts cannot be released.",
  );
}
const result = await build({
  root: web,
  configFile: join(web, "vite.config.ts"),
  base: "./",
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  publicDir: false,
  build: {
    outDir,
    emptyOutDir: true,
    sourcemap: false,
    cssCodeSplit: false,
    minify: true,
    lib: {
      entry: join(web, "src/panel/main.tsx"),
      formats: ["es"],
      fileName: () => "cabane-panel.js",
      cssFileName: "cabane-panel",
    },
    rolldownOptions: {
      output: { chunkFileNames: "assets/[name]-[hash].js", assetFileNames: "[name][extname]" },
    },
  },
});
const styles = scopePanelCss(await readFile(join(outDir, "cabane-panel.css"), "utf8"));
await writeFile(join(outDir, "cabane-panel.css"), styles.css);
await writeFile(join(outDir, "cabane-fonts.css"), styles.fonts);
// Copy only the public UI assets used by Cabane, never OAuth callbacks or site HTML.
await cp(join(web, "public/cabane-icon.png"), join(outDir, "cabane-icon.png"));
await cp(join(web, "public/onboarding"), join(outDir, "onboarding"), { recursive: true });

// Retain dependency license notices for the actual modules bundled by Vite.
const packages = new Set();
for (const bundle of Array.isArray(result) ? result : [result]) {
  for (const chunk of bundle.output ?? []) {
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
}
const notices = [];
for (const directory of [...packages].sort()) {
  const metadata = JSON.parse(await readFile(join(directory, "package.json"), "utf8"));
  const licenses = (await readdir(directory)).filter((name) =>
    /^(licen[cs]e|copying|notice)([.-]|$)/i.test(name),
  );
  notices.push(
    `${metadata.name} ${metadata.version} (${typeof metadata.license === "string" ? metadata.license : "see notice"})`,
  );
  for (const name of licenses) {
    try {
      notices.push(await readFile(join(directory, name), "utf8"));
    } catch {
      /* Some packages use a license directory. */
    }
  }
}
await writeFile(join(outDir, "THIRD_PARTY_LICENSES.txt"), notices.join("\n\n---\n\n"));
await cp(join(root, "LICENSE"), join(outDir, "LICENSE"));
const files = {};
async function inventory(directory) {
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await inventory(path);
    else
      files[path.slice(outDir.length + 1)] = createHash("sha256")
        .update(await readFile(path))
        .digest("hex");
  }
}
await inventory(outDir);
await writeFile(
  join(outDir, "manifest.json"),
  JSON.stringify(
    {
      schema_version: 1,
      kind: "cabane-native-ha-panel",
      element: "cabane-panel",
      entrypoint: "cabane-panel.js",
      source_commit: sourceCommit,
      workspace_contract: { revision: contract.revision, fingerprint: contract.fingerprint },
      ...(dirty ? { development: true } : {}),
      files,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Native panel: ${Object.keys(files).length} files from ${sourceCommit}${dirty ? " (development only)" : ""}`,
);
