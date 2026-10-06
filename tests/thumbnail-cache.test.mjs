import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const { readThumbnail, saveThumbnail } = await load(
    "/apps/web/src/editor-preview/furnish/catalog/thumbnailCache.ts",
  );
  test(
    "previews survive memory misses through browser storage and tolerate storage failure",
    { timeout: 5000 },
    async () => {
      const previous = Object.getOwnPropertyDescriptor(globalThis, "caches");
      const persisted = new Blob(["persisted"], { type: "image/png" });
      const writes = new Map();
      let written;
      const persistedWrite = new Promise((resolve) => {
        written = resolve;
      });
      globalThis.caches = {
        open: async () => ({
          match: async (key) => (key === "persisted" ? new Response(persisted) : undefined),
          put: async (key, response) => {
            writes.set(key, await response.blob());
            written();
          },
          keys: async () => [],
        }),
        keys: async () => [],
      };
      try {
        assert.equal(await (await readThumbnail("persisted")).text(), "persisted");
        const rendered = new Blob(["rendered"], { type: "image/png" });
        saveThumbnail("rendered", { toBlob: (callback) => callback(rendered) });
        await persistedWrite;
        assert.equal(await writes.get("rendered").text(), "rendered");
        globalThis.caches.open = async () => {
          throw new Error("Storage blocked");
        };
        assert.equal(await (await readThumbnail("rendered")).text(), "rendered");
        assert.equal(await readThumbnail("missing"), undefined);
        saveThumbnail("memory-only", { toBlob: (callback) => callback(rendered) });
        assert.equal(await (await readThumbnail("memory-only")).text(), "rendered");
      } finally {
        if (previous) Object.defineProperty(globalThis, "caches", previous);
        else delete globalThis.caches;
      }
    },
  );
});
