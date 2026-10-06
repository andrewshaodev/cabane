import assert from "node:assert/strict";
import test from "node:test";
import { IDBFactory } from "fake-indexeddb";
import { withModules } from "./test-server.mjs";

test(
  "reference storage isolates homes and floors, retains undo assets, and deletes a workspace's assets",
  { timeout: 30_000 },
  async () => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, "indexedDB");
    Object.defineProperty(globalThis, "indexedDB", { configurable: true, value: new IDBFactory() });
    try {
      await withModules(async (load) => {
        const result = await (async () => {
          const api = await load("/apps/web/src/editor-reference-plan/reference-storage.ts");
          const decode = await load(
            "/apps/web/src/editor-reference-plan/decode-reference-image.ts",
          );
          for (const bad of [
            new File([new Uint8Array(20 * 1024 * 1024 + 1)], "big.png", { type: "image/png" }),
            new File(["<svg/>"], "renamed.png", { type: "image/png" }),
          ]) {
            let rejected = false;
            try {
              await decode.decodeReferenceImage(bad);
            } catch {
              rejected = true;
            }
            if (!rejected) throw new Error("Invalid image was accepted");
          }
          const plans = { ground: { assetId: "a" }, upper: { assetId: "b" } };
          await api.writeReferences(
            "home-a",
            { plans, preferences: {} },
            new Map([
              ["a", new Blob(["ground"])],
              ["b", new Blob(["upper"])],
            ]),
          );
          await api.writeReferences(
            "home-b",
            { plans: { ground: { assetId: "a" } }, preferences: {} },
            new Map([["a", new Blob(["other home"])]]),
          );
          const read = await api.readReferences("home-a");
          await api.writeReferences(
            "home-a",
            { plans: { ground: { assetId: "c" } }, preferences: {} },
            new Map([["c", new Blob(["replacement"])]]),
          );
          const retained = await (await api.readReferenceAsset("home-a", "a")).text();
          await api.cleanReferenceAssets("home-a", ["c"]);
          const removed = await api.readReferenceAsset("home-a", "a");
          await api.deleteReferenceHome("home-a");
          return {
            read,
            retained,
            removed: removed === undefined,
            deleted: (await api.readReferenceAsset("home-a", "c")) === undefined,
            empty: await api.readReferences("home-a"),
            independent: await (await api.readReferenceAsset("home-b", "a")).text(),
          };
        })();
        assert.deepEqual(Object.keys(result.read.plans), ["ground", "upper"]);
        assert.equal(result.retained, "ground");
        assert.equal(result.removed, true);
        assert.equal(result.deleted, true);
        assert.deepEqual(result.empty, { plans: {}, preferences: {} });
        assert.equal(result.independent, "other home");
      });
    } finally {
      if (previous) Object.defineProperty(globalThis, "indexedDB", previous);
      else delete globalThis.indexedDB;
    }
  },
);
