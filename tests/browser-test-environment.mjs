import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "vite";
import { chromium } from "playwright-core";

const servers = new Map();
let browserPromise;

// Reuse expensive processes, never browser storage or pages. Each worker owns
// its Vite caches so parallel shards cannot invalidate each other's modules.
export function getBrowserTestServer(kind = "fixture") {
  if (!servers.has(kind)) servers.set(kind, startServer(kind));
  return servers.get(kind);
}

async function startServer(kind) {
  const cacheDir = await mkdtemp(join(tmpdir(), `cabane-test-${kind}-`));
  const app = kind === "app";
  let server;
  try {
    server = await createServer({
      root: app ? `${process.cwd()}/apps/web` : process.cwd(),
      configFile: app ? `${process.cwd()}/apps/web/vite.config.ts` : false,
      ...(app ? {} : { appType: "custom" }),
      cacheDir,
      server: { host: "127.0.0.1", port: 0, hmr: false, ws: false, watch: null },
    });
    if (!app) server.middlewares.use((request, response, next) => {
      if (request.url !== "/") return next();
      response.setHeader("Content-Type", "text/html");
      response.end("<!doctype html><title>Cabane test</title>");
    });
    await server.listen();
    return { server, cacheDir };
  } catch (error) {
    await server?.close();
    await rm(cacheDir, { recursive: true, force: true });
    throw error;
  }
}

export async function createBrowserTestSession() {
  browserPromise ??= chromium.launch({ channel: "chrome", headless: true });
  const browser = await browserPromise;
  const contexts = new Set();
  const newContext = async options => {
    const context = await browser.newContext(options);
    contexts.add(context);
    context.on("close", () => contexts.delete(context));
    return context;
  };
  return {
    newContext,
    async newPage(options) { return (await newContext(options)).newPage(); },
    async close() {
      await Promise.all([...contexts].map(context => context.close()));
      if (process.env.CABANE_TEST_SHARED_MODULES !== "1") await closeBrowserTestEnvironment();
    },
  };
}

export async function closeBrowserTestEnvironment() {
  try { if (browserPromise) await (await browserPromise).close(); }
  finally {
    for (const pending of servers.values()) {
      const result = await pending.catch(() => null);
      if (!result) continue;
      try { await result.server.close(); }
      finally { await rm(result.cacheDir, { recursive: true, force: true }); }
    }
  }
  browserPromise = undefined;
  servers.clear();
}
