import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { createServer } from "vite";

const repositoryRoot = process.cwd();

export async function startFixtureServer({
  port = 4174,
  fixture = true,
  hmr = false,
} = {}) {
  const root = fixture ? repositoryRoot : resolve(repositoryRoot, "apps/web");
  const server = await createServer({
    root,
    publicDir: resolve(repositoryRoot, "apps/web/public"),
    appType: "spa",
    configFile: false,
    define: { __THUMBNAIL_REVISION__: JSON.stringify("fixture") },
    plugins: [react()],
    optimizeDeps: { include: ["meshoptimizer/simplifier"] },
    cacheDir: "/tmp/cabane-phase-4-vite-cache",
    envDir: "/tmp/cabane-no-runtime-env",
    server: {
      host: "127.0.0.1",
      port,
      strictPort: true,
      hmr,
      ws: hmr,
    },
  });
  await server.listen();
  return server;
}

export const serverOrigin = (server) => {
  const local = server.resolvedUrls?.local?.[0];
  if (!local) throw new Error("The fixture preview server did not expose a local URL.");
  return local.replace(/\/$/, "");
};
