import { createServer } from "vite";

let serverPromise;

const getServer = () => {
  serverPromise ??= createServer({
    root: process.cwd(),
    appType: "custom",
    configFile: false,
    define: { __THUMBNAIL_REVISION__: JSON.stringify("test") },
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
  });
  return serverPromise;
};

export async function withModules(callback) {
  const server = await getServer();
  if (process.env.CABANE_TEST_SHARED_MODULES === "1") {
    return callback((path) => server.ssrLoadModule(path));
  }
  try {
    return await callback((path) => server.ssrLoadModule(path));
  } finally {
    await closeModules();
  }
}

export async function closeModules() {
  if (!serverPromise) return;
  const server = await serverPromise;
  serverPromise = undefined;
  await server.close();
}
