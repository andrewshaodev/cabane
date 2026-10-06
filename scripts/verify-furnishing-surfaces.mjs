#!/usr/bin/env node
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { createElement } = require("react");
const { create } = require("@react-three/test-renderer");
import { inspectLayeredSurfaces } from "./layered-surface-contract.mjs";
import { findOverlaps, planeTolerance, areaTolerance } from "./surface-overlaps.mjs";
const { createServer } = await import(pathToFileURL(require.resolve("vite")).href);

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const originalWarn = console.warn;
console.warn = (...args) => {
  if (String(args[0]).startsWith("THREE.Clock:")) return;
  originalWarn(...args);
};

const requestedModelIds = new Set(process.argv.slice(2).filter((arg) => arg !== "--all-devices"));

const server = await createServer({
  root: process.cwd(),
  appType: "custom",
  configFile: false,
  logLevel: "error",
  server: { middlewareMode: true, hmr: false, ws: false },
});
const reports = [];
try {
  const { stableFurnishingRegistry } = await server.ssrLoadModule(
    "/packages/catalog/src/furnishing/index.ts",
  );
  const { stableDeviceRegistry } = await server.ssrLoadModule(
    "/packages/catalog/src/device/index.ts",
  );
  for (const [family, registry] of [
    ["furnishing", stableFurnishingRegistry],
    ["device", stableDeviceRegistry],
  ]) {
    for (const [modelId, definition] of Object.entries(registry)) {
      if (requestedModelIds.size && !requestedModelIds.has(modelId)) continue;
      const variants = definition.variants?.map(({ id }) => id) ?? [undefined];
      for (const variant of variants) {
        for (const visualState of family === "device"
          ? ["connected-active", "connected-inactive", "unavailable", "disconnected"]
          : [undefined]) {
          let renderer;
          try {
            renderer = await create(
              createElement(definition.component, {
                size: definition.defaultSize,
                visualState,
                variant,
                entityStatesBySlotId: {},
                reducedMotion: true,
                walkMode: false,
                onInteract() {},
              }),
            );
            const overlaps = findOverlaps(renderer.scene.instance, definition);
            const layerIssues = inspectLayeredSurfaces(renderer.scene.instance);
            if (overlaps.length || layerIssues.length)
              reports.push({ family, modelId, variant, visualState, overlaps, layerIssues });
          } finally {
            if (renderer) await renderer.unmount();
          }
        }
      }
    }
  }
} finally {
  await server.close();
}

console.log(JSON.stringify({ planeTolerance, areaTolerance, reports }, null, 2));
if (reports.length) process.exitCode = 1;
