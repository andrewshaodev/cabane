import { createServer } from "vite";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const s = await createServer({
  configFile: false,
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
  logLevel: "silent",
  optimizeDeps: { noDiscovery: true },
});
try {
  const e = await s.ssrLoadModule("/packages/engine/src/index.ts"),
    f = await s.ssrLoadModule("/packages/catalog/src/furnishing/index.ts"),
    d = await s.ssrLoadModule("/packages/catalog/src/device/index.ts");
  const p = JSON.parse(await readFile(process.argv[2] || "home/showcase/layout.project.json"));
  const regs = {
    furnishingModels: f.stableFurnishingRegistry,
    deviceModels: d.stableDeviceRegistry,
  };
  const r = e.validateHomeProject(p, regs);
  console.log(JSON.stringify(r.issues, null, 2));
  console.log("PROJECT_VALID", r.valid);
  await mkdir("test-results/showcase", { recursive: true });
  await writeFile(
    "test-results/showcase/validation.json",
    JSON.stringify({ valid: r.valid, issues: r.issues }, null, 2),
  );
  if (!r.valid) process.exitCode = 1;
} finally {
  await s.close();
}
