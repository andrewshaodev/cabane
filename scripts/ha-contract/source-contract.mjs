import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import ts from "typescript";

// Follow local imports/exports so splitting the schema cannot evade the gate.
const contractEntrypoints = [
  "packages/engine/src/home-project/schema.ts",
  "packages/engine/src/home-project/project-record-codec.ts",
  "packages/engine/src/home-project/workspace-bindings.ts",
  "packages/engine/src/imported-models/archive.ts",
  "apps/web/src/workspaces/workspace-transfer.ts",
  "packages/catalog/src/architecture/index.ts",
  "packages/catalog/src/furnishing/index.ts",
  "packages/catalog/src/device/index.ts",
];

export function contractFingerprint(root, entrypoints = contractEntrypoints) {
  const sources = new Map();
  const printer = ts.createPrinter({ removeComments: true, newLine: ts.NewLineKind.LineFeed });
  const visit = (name) => {
    const path = resolve(root, name);
    if (sources.has(name)) return;
    if (!existsSync(path)) throw new Error(`Contract source is missing: ${name}`);
    const text = readFileSync(path, "utf8");
    if (name.endsWith(".json")) {
      sources.set(name, JSON.stringify(JSON.parse(text)));
      return;
    }
    const source = ts.createSourceFile(name, text, ts.ScriptTarget.Latest, true);
    sources.set(name, printer.printFile(source));
    for (const node of source.statements) {
      if (!(ts.isImportDeclaration(node) || ts.isExportDeclaration(node))) continue;
      const specifier = node.moduleSpecifier;
      if (!specifier || !ts.isStringLiteral(specifier) || !specifier.text.startsWith(".")) continue;
      const target = resolve(dirname(path), specifier.text);
      const dependency = [
        target,
        `${target}.ts`,
        `${target}.tsx`,
        `${target}/index.ts`,
        `${target}/index.tsx`,
      ].find((candidate) => existsSync(candidate) && /\.(tsx?|json)$/.test(candidate));
      if (!dependency)
        throw new Error(`Unresolved contract dependency: ${name} → ${specifier.text}`);
      visit(relative(root, dependency).replaceAll("\\", "/"));
    }
  };
  entrypoints.forEach(visit);
  const ordered = [...sources].sort(([left], [right]) => left.localeCompare(right));
  return {
    fingerprint: createHash("sha256").update(JSON.stringify(ordered)).digest("hex"),
    sources: ordered.map(([name]) => name),
  };
}

export function validateContractRelease(release, fingerprint) {
  if (
    !Number.isSafeInteger(release.revision) ||
    release.revision < 1 ||
    release.fingerprint !== fingerprint
  )
    throw new Error(
      "Persisted contract changed. Run npm run contract:record -- --summary 'Describe the change' --breaking-change 'Explain the upgrade impact', then commit docs/ha-contract.json.",
    );
  if (
    typeof release.summary !== "string" ||
    !release.summary.trim() ||
    !Array.isArray(release.breakingChanges) ||
    release.breakingChanges.length === 0 ||
    release.breakingChanges.some((note) => typeof note !== "string" || !note.trim())
  )
    throw new Error("The contract release must describe the change and its compatibility impact.");
}
