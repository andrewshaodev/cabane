import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import test from "node:test";
import { generateEngineeringMap } from "../scripts/engineering-map/generate.mjs";

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "cabane-map-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const put = async (path, value) => {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), typeof value === "string" ? value : JSON.stringify(value));
  };
  const area = {
    title: "Example",
    spec: "docs/product/example.md",
    owners: ["packages/example/src/model.ts"],
    interfaces: [{ module: "packages/example/src/index.ts", symbols: ["Example"] }],
    invariant: "Review the example invariant.",
    checks: ["verify:example"],
  };
  await put("docs/engineering-map.json", [area]);
  await put("docs/product/example.md", "# Example");
  await put("tsconfig.json", { compilerOptions: { noLib: true } });
  await put("package.json", {
    workspaces: ["packages/*"],
    scripts: { "verify:example": "node scripts/example.mjs" },
  });
  await put("scripts/example.mjs", "");
  await put("packages/example/package.json", {
    name: "@cabane/example",
    exports: { ".": "./src/index.ts" },
  });
  await put("packages/example/src/index.ts", 'export * from "./model";');
  await put("packages/example/src/model.ts", "export interface Example { id: string }");
  return { root, put, area };
}

test("engineering map follows re-exports and detects changed generated content", async (t) => {
  const { root, put, area } = await fixture(t);
  await generateEngineeringMap(root, { write: true });
  await generateEngineeringMap(root);
  const markdown = await readFile(join(root, "docs/engineering-map.md"), "utf8");
  assert.match(markdown, /@cabane\/example/);
  area.invariant = "A changed invariant requires regeneration.";
  await put("docs/engineering-map.json", [area]);
  await assert.rejects(generateEngineeringMap(root), /Engineering map is stale/);
});

test("engineering map rejects a moved owner and removed exported symbol", async (t) => {
  const { root, put, area } = await fixture(t);
  area.owners = ["packages/example/src/moved.ts"];
  await put("docs/engineering-map.json", [area]);
  await put("packages/example/src/model.ts", "export interface Renamed { id: string }");
  await assert.rejects(generateEngineeringMap(root), (error) => {
    assert.match(error.message, /Missing or out-of-repository path:.*moved.ts/);
    assert.match(error.message, /Missing export:.*Example/);
    return true;
  });
});

test("engineering map rejects missing commands and package export targets", async (t) => {
  const { root, put, area } = await fixture(t);
  area.checks = ["missing:command"];
  await put("docs/engineering-map.json", [area]);
  await put("packages/example/package.json", {
    name: "@cabane/example",
    exports: { ".": "./src/missing.ts" },
  });
  await assert.rejects(generateEngineeringMap(root), (error) => {
    assert.match(error.message, /Missing npm script: missing:command/);
    assert.match(error.message, /Missing or out-of-repository path:.*missing.ts/);
    return true;
  });
});

test("engineering map checks nested npm commands and their executable paths", async (t) => {
  const { root, put } = await fixture(t);
  await put("package.json", {
    workspaces: ["packages/*"],
    scripts: {
      "verify:example": "npm run verify:nested",
      "verify:nested": "node scripts/missing.mjs && npm run verify:example",
    },
  });
  await assert.rejects(
    generateEngineeringMap(root),
    /Missing or out-of-repository path:.*missing.mjs/,
  );
});
