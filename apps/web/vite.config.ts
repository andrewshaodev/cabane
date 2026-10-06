import { thumbnailRevision } from "./thumbnail-revision.mjs";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { distributionNotices } from "./distribution-notices.mjs";

const woff2MaterialDesignIcons = (): Plugin => ({
  name: "cabane-mdi-woff2-only",
  enforce: "pre",
  transform(source, id) {
    if (!id.includes("/@mdi/font/css/materialdesignicons.min.css")) return null;
    return source.replace(
      /^@font-face\{[^}]+\}/,
      '@font-face{font-family:"Material Design Icons";src:url("../fonts/materialdesignicons-webfont.woff2?v=7.4.47") format("woff2");font-weight:normal;font-style:normal}',
    );
  },
});

export default defineConfig({
  define: { __THUMBNAIL_REVISION__: JSON.stringify(thumbnailRevision()) },
  plugins: [woff2MaterialDesignIcons(), react(), distributionNotices()],
  // The worker imports this lazily; discover it before the first camera render.
  optimizeDeps: { include: ["meshoptimizer/simplifier"] },
  // Keep Vite's default project-local cache isolated between checkouts/worktrees.
  server: {
    // Do not silently move to another port while the browser shows an old server.
    strictPort: true,
    watch: {
      // Native file events can miss edits in local/agent-managed worktrees.
      usePolling: true,
      interval: 250,
    },
  },
  build: {
    target: "es2022",
    sourcemap: true,
    // Bundle size is not a constraint; keep other build warnings enabled.
    chunkSizeWarningLimit: Number.POSITIVE_INFINITY,
  },
});
