import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

export const compatibilityManifestPath = "docs/ha-compatibility.json";
export const canonicalCompatibility = (value) =>
  Array.isArray(value)
    ? value.map(canonicalCompatibility)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, canonicalCompatibility(value[key])]),
        )
      : value;
const roots = {
  project: ["packages/engine/src/home-project/types.ts", "HomeProject"],
  legacyProject: ["packages/engine/src/home-project/types.ts", "LegacyHomeProject"],
  record: ["packages/engine/src/home-project/project-record-contract.ts", "HomeProjectRecord"],
  transferMetadata: ["apps/web/src/workspaces/workspace-transfer.ts", "WorkspaceTransferMetadata"],
};

// Resolve portable types only. Runtime code and catalog implementations are
// never fingerprinted, including model IDs owned by the separate catalog policy.
export function portableContract(root, entries = roots) {
  const config = ts.readConfigFile(resolve(root, "tsconfig.json"), ts.sys.readFile);
  if (config.error) throw new Error("Cannot read compatibility compiler configuration.");
  const options = ts.parseJsonConfigFileContent(config.config, ts.sys, root).options;
  const program = ts.createProgram(
    Object.values(entries).map(([file]) => resolve(root, file)),
    options,
  );
  const checker = program.getTypeChecker();
  const encode = (type, ancestors = new Set()) => {
    if (ancestors.has(type)) throw new Error("Portable contracts cannot contain recursive types.");
    const next = new Set([...ancestors, type]);
    const flags = ts.TypeFlags;
    if (type.flags & flags.StringLiteral) return { const: type.value };
    if (type.flags & flags.NumberLiteral) return { const: type.value };
    if (type.flags & flags.BooleanLiteral) return { const: type.intrinsicName === "true" };
    if (type.flags & flags.Null) return { type: "null" };
    if (type.isUnion()) {
      const variants = type.types
        .filter((part) => !(part.flags & flags.Undefined))
        .map((part) => encode(part, next));
      variants.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
      return variants.length === 1 ? variants[0] : { anyOf: variants };
    }
    if (type.flags & flags.TemplateLiteral)
      return {
        template: { texts: [...type.texts], types: type.types.map((part) => encode(part, next)) },
      };
    if (type.flags & flags.String) return { type: "string" };
    if (type.flags & flags.Number) return { type: "number" };
    if (type.flags & flags.Boolean) return { type: "boolean" };
    if (type.flags & flags.Unknown) return { type: "unknown" };
    if (type.flags & flags.Never) return { type: "never" };
    if (type.flags & flags.Undefined) return { type: "absent" };
    if (type.flags & flags.Any) throw new Error("Unresolved or any type in portable contract.");
    if (checker.isTupleType(type))
      return {
        tuple: checker.getTypeArguments(type).map((part) => encode(part, next)),
        elementFlags: [...type.target.elementFlags],
      };
    const element = checker.getIndexTypeOfType(type, ts.IndexKind.Number);
    if (checker.isArrayType(type) || type.symbol?.name === "ReadonlyArray")
      return { items: encode(element, next) };
    if (type.getCallSignatures().length) throw new Error("Executable portable contract member.");
    const properties = {};
    for (const property of type.getProperties().sort((a, b) => a.name.localeCompare(b.name))) {
      const declaration = property.valueDeclaration ?? property.declarations?.[0];
      const propertyType = checker.getTypeOfSymbolAtLocation(property, declaration);
      if (propertyType.flags & (flags.Never | flags.Undefined)) continue;
      properties[property.name] = {
        optional: Boolean(property.flags & ts.SymbolFlags.Optional),
        schema: encode(propertyType, next),
      };
    }
    const indexed = checker.getIndexTypeOfType(type, ts.IndexKind.String);
    return { properties, ...(indexed ? { additionalProperties: encode(indexed, next) } : {}) };
  };
  let projectShape;
  const same = (a, b) =>
    JSON.stringify(canonicalCompatibility(a)) === JSON.stringify(canonicalCompatibility(b));
  return Object.fromEntries(
    Object.entries(entries).map(([name, [file, symbol]]) => {
      const source = program.getSourceFile(resolve(root, file));
      const declaration = source?.statements.find(
        (node) =>
          (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) &&
          node.name.text === symbol,
      );
      if (!declaration) throw new Error(`Missing portable contract ${file}:${symbol}`);
      const result = encode(checker.getTypeAtLocation(declaration));
      if (name === "project") projectShape = result;
      if (name === "record")
        for (const key of ["draft", "published"])
          if (result.properties[key] && same(result.properties[key].schema, projectShape))
            result.properties[key].schema = { ref: "project" };
      if (name === "legacyProject")
        for (const [key, value] of Object.entries(result.properties))
          if (
            projectShape?.properties[key] &&
            same(value.schema, projectShape.properties[key].schema)
          )
            value.schema = { ref: `project.properties.${key}` };
      return [name, result];
    }),
  );
}

export function readCompatibilityManifest(root, entries) {
  const manifest = JSON.parse(readFileSync(resolve(root, compatibilityManifestPath), "utf8"));
  if (
    manifest.manifestVersion !== 1 ||
    !manifest.formats ||
    !manifest.semantics ||
    Object.values(manifest.semantics).some(
      (revision) => !Number.isSafeInteger(revision) || revision < 1,
    )
  )
    throw new Error("Invalid explicit HA compatibility manifest.");
  if (
    JSON.stringify(canonicalCompatibility(manifest.portableTypes)) !==
    JSON.stringify(canonicalCompatibility(portableContract(root, entries)))
  )
    throw new Error(
      "Portable fields changed. Run contract:record and review ha-compatibility.json.",
    );
  return manifest;
}
