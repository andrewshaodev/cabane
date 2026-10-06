import { build } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
const root = resolve(process.argv[2] ?? "."),
  outDir = resolve(process.argv[3] ?? "/tmp/cabane-scale-build");
await build({
  root,
  configFile: false,
  publicDir: false,
  plugins: [react()],
  define: { __THUMBNAIL_REVISION__: JSON.stringify("performance-fixture") },
  resolve: {
    alias: {
      "@cabane/engine/styles.css": `${root}/packages/engine/src/styles.css`,
      "@cabane/engine": `${root}/packages/engine/src/index.ts`,
      "@cabane/catalog/device": `${root}/packages/catalog/src/device/index.ts`,
      "@cabane/catalog/architecture": `${root}/packages/catalog/src/architecture/index.ts`,
      "@cabane/catalog/furnishing": `${root}/packages/catalog/src/furnishing/index.ts`,
    },
  },
  build: {
    outDir,
    emptyOutDir: true,
    chunkSizeWarningLimit: Infinity,
    rollupOptions: { input: resolve(root, "tests/agent-harness.html") },
  },
});
