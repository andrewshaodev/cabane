import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "vite";
import { chromium } from "playwright-core";

import { captureBrowserFailure, registerBrowserDiagnostics } from "./browser-test-diagnostics.mjs";

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
    if (!app)
      server.middlewares.use((request, response, next) => {
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
  const contexts = new Set();
  const messages = [];
  const record = (entry) => {
    if (messages.length === 200) messages.shift();
    messages.push(entry);
  };
  const dispose = async () => {
    try {
      await Promise.all([...contexts].map((context) => context.close()));
    } finally {
      if (process.env.CABANE_TEST_SHARED_MODULES !== "1") await closeBrowserTestEnvironment();
    }
  };
  const managed = registerBrowserDiagnostics({
    capture: (name, error) => captureBrowserFailure(name, error, contexts, messages),
    dispose,
  });
  browserPromise ??= chromium.launch({
    channel: "chromium",
    headless: true,
    // Hosted Linux runners have no native GPU. Match the production-panel
    // verifier's explicit software renderer instead of probing unavailable GPU
    // backends while loading WebGL scenes.
    args:
      process.env.GITHUB_ACTIONS === "true"
        ? ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
        : [],
  });
  const browser = await browserPromise;
  const newContext = async (options) => {
    const context = await browser.newContext(options);
    contexts.add(context);
    context.on("page", (page) => {
      page.on("console", (message) => {
        if (["error", "warning"].includes(message.type()))
          record({
            type: message.type(),
            text: message.text(),
            url: page.url(),
            location: message.location(),
          });
      });
      page.on("pageerror", (error) =>
        record({ type: "pageerror", text: error.stack ?? error.message, url: page.url() }),
      );
    });
    if (managed) await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
    context.on("close", () => contexts.delete(context));
    return context;
  };
  return {
    newContext,
    async newPage(options) {
      return (await newContext(options)).newPage();
    },
    async close() {
      // The callback wrapper saves evidence before closing on failure.
      if (!managed) await dispose();
    },
  };
}

export async function closeBrowserTestEnvironment() {
  const pendingBrowser = browserPromise;
  const pendingServers = [...servers.values()];
  browserPromise = undefined;
  servers.clear();
  const cleanup = await Promise.allSettled([
    (async () => {
      const browser = await pendingBrowser?.catch(() => null);
      await browser?.close();
    })(),
    ...pendingServers.map(async (pending) => {
      const result = await pending.catch(() => null);
      if (!result) return;
      try {
        await result.server.close();
      } finally {
        await rm(result.cacheDir, { recursive: true, force: true });
      }
    }),
  ]);
  const errors = cleanup
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason);
  if (errors.length) throw new AggregateError(errors, "Browser environment cleanup failed");
}
