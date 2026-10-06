import { waitForAsyncCondition } from "./async-condition.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { unzipSync } from "fflate";
import { withBrowserDiagnostics } from "./browser-test-diagnostics.mjs";
import { getBrowserTestServer, createBrowserTestSession } from "./browser-test-environment.mjs";
import { testGlb } from "./fixtures/personal-glb.mjs";
import { measureScene } from "../scripts/scene-performance/browser-probe.mjs";

test(
  "textured GLB imports, publishes, reloads and transfers through the real browser",
  { timeout: 180000 },
  withBrowserDiagnostics(async () => {
    const { server } = await getBrowserTestServer("app");
    let browser;
    try {
      browser = await createBrowserTestSession();
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      await page.addInitScript(() => {
        Object.defineProperty(crypto, "subtle", { configurable: true, value: undefined });
      });
      await mkdir("test-results/personal-models", { recursive: true });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const url = server.resolvedUrls.local[0];
      await page.goto(url);
      const rootPath = process.cwd();
      const id = await page.evaluate(async (rootPath) => {
        const engine = await import(`/@fs${rootPath}/packages/engine/src/index.ts`);
        const fixture = await import(`/@fs${rootPath}/tests/fixtures/multiple-floors.ts`);
        const registry = await import("/src/project-runtime.ts");
        const repository = engine.createWorkspaceRepository(
          window.indexedDB,
          registry.ownerProjectRegistries,
        );
        const schema = engine.parseHomeProjectSchema(fixture.makeLegacyProject());
        if (!schema.valid) throw new Error(schema.issues[0].message);
        const entry = await repository.create(engine.createSeedProjectRecord(schema.project), {
          name: "Personal GLB test",
        });
        return entry.metadata.id;
      }, rootPath);
      await page.goto(`${url}workspaces/${id}/arrange`);
      await page.getByRole("button", { name: "My models", exact: true }).click();
      // One textured file exercises the real picker, decoder, WebGL preview and
      // durable browser storage. Formats/supports/history matrices run in Node.
      const bytes = Buffer.from(testGlb({ textured: true, embedded: true }));
      const chooser = page.waitForEvent("filechooser");
      await page.getByRole("button", { name: "Import model (.glb file)", exact: true }).click();
      await (
        await chooser
      ).setFiles({ name: "Personal desk.glb", mimeType: "model/gltf-binary", buffer: bytes });
      const dialog = page.getByRole("dialog", { name: "Import GLB", exact: true });
      await dialog
        .getByText("Original materials and textures are preserved.", { exact: false })
        .waitFor();
      assert.match(await dialog.innerText(), /Embedded cameras are ignored/);
      await dialog.getByLabel("Name", { exact: true }).fill("Personal desk");
      await dialog.getByLabel("Width", { exact: true }).fill("0.7");
      await dialog.getByRole("button", { name: "Add to My models", exact: true }).click();
      await dialog.waitFor({ state: "hidden" });
      await page.getByRole("button", { name: "Add Personal desk", exact: true }).click();
      const read = () =>
        page.evaluate(
          async ({ rootPath, id }) => {
            const engine = await import(`/@fs${rootPath}/packages/engine/src/index.ts`);
            const registry = await import("/src/project-runtime.ts");
            return (
              await engine
                .createWorkspaceRepository(indexedDB, registry.ownerProjectRegistries)
                .read(id)
            ).record;
          },
          { rootPath, id },
        );
      const before = await waitForAsyncCondition(async () => (await read()).draft.sceneItems[0], {
        message: "Imported item did not persist before the gesture test",
      });
      assert.ok(before.id);
      // Retain one real gesture per control, including Escape cancellation.
      for (const label of ["Drag to change elevation", "Drag to resize proportionally"]) {
        const handle = page.getByRole("button", { name: label, exact: true });
        const bounds = await handle.boundingBox();
        assert.ok(bounds);
        await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        await page.mouse.down();
        await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2 - 40, {
          steps: 3,
        });
        await page.keyboard.press("Escape");
        await page.mouse.up();
      }
      await page.getByRole("button", { name: "Save", exact: true }).click();
      await page.locator(".direction-publish-dialog").getByRole("button", { name: /Save/ }).click();
      await page.waitForURL(`${url}workspaces/${id}`);
      const published = (await read()).published;
      assert.equal(published.customModels.length, 1);
      assert.deepEqual(
        published.sceneItems[0],
        before,
        "cancelled gestures must not leak into publication",
      );
      await page.goto(`${url}workspaces/${id}/arrange`);
      await page.getByRole("button", { name: "My models", exact: true }).click();
      await page.getByRole("button", { name: "Add Personal desk", exact: true }).waitFor();
      assert.deepEqual((await read()).draft.customModels, published.customModels);
      // Complete portable transfer through the library, with a fresh asset store.
      await page.goto(`${url}workspaces`);
      const card = page.locator(".workspace-card").filter({ hasText: "Personal GLB test" });
      await card.locator("summary").click();
      await card.getByRole("button", { name: "Export", exact: true }).click();
      const archiveDownload = page.waitForEvent("download");
      await page.getByRole("button", { name: /Portable design/ }).click();
      const archive = await archiveDownload;
      assert.match(archive.suggestedFilename(), /-project\.cabane$/);
      const archiveBytes = await readFile(await archive.path());
      assert.equal(
        Object.keys(unzipSync(new Uint8Array(archiveBytes))).filter((name) => name.endsWith(".glb"))
          .length,
        1,
      );
      const other = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      other.on("pageerror", (error) => errors.push(error.message));
      // Clearing binary storage proves the archive restores bytes before creating the home.
      await other.goto(`${url}workspaces`);
      await other.evaluate(async () => {
        await new Promise((resolve, reject) => {
          const request = indexedDB.open("cabane-projects-v2");
          request.onsuccess = () => {
            const db = request.result,
              tx = db.transaction("model-assets", "readwrite");
            tx.objectStore("model-assets").clear();
            tx.oncomplete = () => {
              db.close();
              resolve();
            };
            tx.onerror = () => reject(tx.error);
          };
          request.onerror = () => reject(request.error);
        });
      });
      await other.getByRole("button", { name: "Import workspace", exact: true }).click();
      const transfer = other.getByRole("dialog", { name: "Import workspace" });
      await transfer.locator('input[type="file"]').setInputFiles({
        name: "personal.cabane",
        mimeType: "application/zip",
        buffer: archiveBytes,
      });
      await transfer.getByRole("button", { name: "Import workspace", exact: true }).click();
      // Portable imports start unapplied and redirect to Construct. Waiting on
      // the intermediate workspace URL races the router under CPU contention.
      await other.waitForURL(/workspaces\/[^/]+\/construct$/);
      await other.getByRole("navigation", { name: "Editor mode" }).waitFor();
      const importedId = new URL(other.url()).pathname.split("/").at(-2);
      assert.notEqual(importedId, id);
      const imported = await other.evaluate(
        async ({ rootPath, importedId }) => {
          const engine = await import(`/@fs${rootPath}/packages/engine/src/index.ts`);
          const registry = await import("/src/project-runtime.ts");
          const record = (
            await engine
              .createWorkspaceRepository(window.indexedDB, registry.ownerProjectRegistries)
              .read(importedId)
          ).record;
          const restored = await engine
            .createModelAssetRepository(window.indexedDB)
            .verify(engine.modelAssetReferences([record.draft]));
          return {
            models: record.draft.customModels.length,
            items: record.draft.sceneItems.length,
            assets: restored.length,
          };
        },
        { rootPath, importedId },
      );
      assert.deepEqual(imported, { models: 1, items: 1, assets: 1 });
      await other.evaluate(async () => {
        await new Promise((resolve, reject) => {
          const request = indexedDB.open("cabane-projects-v2");
          request.onsuccess = () => {
            const db = request.result,
              tx = db.transaction("model-assets", "readwrite");
            tx.objectStore("model-assets").clear();
            tx.oncomplete = () => {
              db.close();
              resolve();
            };
            tx.onerror = () => reject(tx.error);
          };
          request.onerror = () => reject(request.error);
        });
      });
      await other.goto(`${url}workspaces/${importedId}/arrange`);
      await other.getByText("Some personal models could not load.", { exact: true }).waitFor();
      await other.locator("canvas").first().waitFor({ state: "visible" });
      assert.equal(await other.locator("canvas").first().isVisible(), true);
      assert.equal(
        (await other.getByRole("link", { name: "Workspaces", exact: true }).count()) > 0,
        true,
      );
      await other.screenshot({ path: "test-results/personal-models/missing-asset.png" });
      await other.close();
      assert.deepEqual(errors, []);
    } finally {
      await browser?.close();
    }
  }),
);

test(
  "unknown model JSON stays editable and a model pack resolves its placeholders",
  { timeout: 120000 },
  withBrowserDiagnostics(async () => {
    const { server } = await getBrowserTestServer("app");
    let browser;
    try {
      browser = await createBrowserTestSession();
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const url = server.resolvedUrls.local[0];
      const rootPath = process.cwd();
      await page.goto(url);
      const source = await page.evaluate(async (rootPath) => {
        const engine = await import(`/@fs${rootPath}/packages/engine/src/index.ts`);
        const fixture = await import(`/@fs${rootPath}/tests/fixtures/multiple-floors.ts`);
        const registry = await import("/src/project-runtime.ts");
        const parsed = engine.parseHomeProjectSchema(fixture.makeLegacyProject());
        if (!parsed.valid) throw new Error(parsed.issues[0].message);
        const modelId = "retired-furniture";
        const project = {
          ...parsed.project,
          sceneItems: [
            {
              id: "unresolved-item",
              kind: "furnishing",
              floorId: parsed.project.floors[0].id,
              modelId,
              placement: { kind: "absolute", at: [2, 1], elevationMeters: 0, rotationYRadians: 0 },
              size: [0.8, 0.8, 0.8],
            },
          ],
        };
        const repository = engine.createWorkspaceRepository(
          window.indexedDB,
          registry.ownerProjectRegistries,
        );
        const entry = await repository.create(engine.createSeedProjectRecord(project), {
          name: "Missing model test",
        });
        return { id: entry.metadata.id, modelId };
      }, rootPath);
      const read = () =>
        page.evaluate(
          async ({ rootPath, id }) => {
            const engine = await import(`/@fs${rootPath}/packages/engine/src/index.ts`);
            const registry = await import("/src/project-runtime.ts");
            const entry = await engine
              .createWorkspaceRepository(window.indexedDB, registry.ownerProjectRegistries)
              .read(id);
            if (!entry.record) throw new Error(entry.error);
            return entry.record;
          },
          { rootPath, id: source.id },
        );
      const waitForModel = async (predicate) => {
        for (let attempt = 0; attempt < 100; attempt++) {
          const record = await read();
          if (predicate(record)) return record;
          await page.waitForTimeout(50);
        }
        assert.fail("The model change was not persisted.");
      };
      await page.goto(`${url}workspaces/${source.id}/arrange`);
      await page.locator("canvas").first().waitFor({ state: "visible" });
      await mkdir("test-results/personal-models", { recursive: true });
      await page.screenshot({ path: "test-results/personal-models/missing-model-fallback.png" });
      await page.getByRole("button", { name: "My models", exact: true }).click();
      const chooser = page.waitForEvent("filechooser");
      await page.getByRole("button", { name: "Import model (.glb file)", exact: true }).click();
      await (
        await chooser
      ).setFiles({
        name: "replacement.glb",
        mimeType: "model/gltf-binary",
        buffer: Buffer.from(testGlb()),
      });
      const dialog = page.getByRole("dialog", { name: "Import GLB", exact: true });
      await dialog
        .getByText("Original materials and textures are preserved.", { exact: false })
        .waitFor();
      const replacement = dialog.getByLabel("Replace missing model (optional)");
      assert.equal(await replacement.count(), 1);
      assert.match(await replacement.innerText(), new RegExp(source.modelId));
      await replacement.selectOption(`furnishing:${source.modelId}`);
      await mkdir("test-results/personal-models", { recursive: true });
      await dialog.screenshot({
        path: "test-results/personal-models/missing-model-replacement.png",
      });
      await dialog.getByRole("button", { name: "Add to My models", exact: true }).click();
      await dialog.waitFor({ state: "hidden" });
      const replaced = await waitForModel(
        (record) =>
          record.draft.customModels?.length === 1 &&
          record.draft.sceneItems[0].modelId.startsWith("custom:"),
      );
      await page.screenshot({ path: "test-results/personal-models/model-pack-library.png" });
      const customId = replaced.draft.sceneItems[0].modelId;
      const packDownload = page.waitForEvent("download");
      await page.getByRole("button", { name: "Export model pack (.zip)", exact: true }).click();
      const pack = await packDownload;
      assert.equal(pack.suggestedFilename(), "cabane-models.zip");
      const packBytes = await readFile(await pack.path());
      const packFiles = unzipSync(new Uint8Array(packBytes));
      assert.ok(packFiles["manifest.json"]);
      assert.equal(Object.keys(packFiles).filter((name) => name.endsWith(".glb")).length, 1);

      const second = await page.evaluate(
        async ({ rootPath, modelId }) => {
          const engine = await import(`/@fs${rootPath}/packages/engine/src/index.ts`);
          const fixture = await import(`/@fs${rootPath}/tests/fixtures/multiple-floors.ts`);
          const registry = await import("/src/project-runtime.ts");
          const parsed = engine.parseHomeProjectSchema(fixture.makeLegacyProject());
          if (!parsed.valid) throw new Error(parsed.issues[0].message);
          const project = {
            ...parsed.project,
            sceneItems: [
              {
                id: "pack-placeholder",
                kind: "furnishing",
                floorId: parsed.project.floors[0].id,
                modelId,
                placement: {
                  kind: "absolute",
                  at: [2, 1],
                  elevationMeters: 0,
                  rotationYRadians: 0,
                },
                size: [0.8, 0.8, 0.8],
              },
            ],
          };
          const entry = await engine
            .createWorkspaceRepository(window.indexedDB, registry.ownerProjectRegistries)
            .create(engine.createSeedProjectRecord(project), { name: "Pack import test" });
          return entry.metadata.id;
        },
        { rootPath, modelId: customId },
      );
      await page.goto(`${url}workspaces/${second}/arrange`);
      await page.getByRole("button", { name: "My models", exact: true }).click();
      const packChooser = page.waitForEvent("filechooser");
      await page.getByRole("button", { name: "Import model pack (.zip)", exact: true }).click();
      await (
        await packChooser
      ).setFiles({
        name: "cabane-models.zip",
        mimeType: "application/zip",
        buffer: Buffer.from(packBytes),
      });
      const packDialog = page.getByRole("dialog", { name: "Import model pack", exact: true });
      await packDialog.getByRole("button", { name: "Import pack", exact: true }).click();
      await packDialog.waitFor({ state: "hidden" });
      const imported = await page.evaluate(
        async ({ rootPath, id, modelId }) => {
          const engine = await import(`/@fs${rootPath}/packages/engine/src/index.ts`);
          const registry = await import("/src/project-runtime.ts");
          const record = (
            await engine
              .createWorkspaceRepository(window.indexedDB, registry.ownerProjectRegistries)
              .read(id)
          ).record;
          return {
            modelCount: record.draft.customModels?.length ?? 0,
            sceneModelId: record.draft.sceneItems[0].modelId,
            modelId,
          };
        },
        { rootPath, id: second, modelId: customId },
      );
      assert.deepEqual(imported, { modelCount: 1, sceneModelId: customId, modelId: customId });
      assert.deepEqual(errors, []);
    } finally {
      await browser?.close();
    }
  }),
);

test(
  "representative personal models render with 20 rooms, 100 simulated bindings and shared textured resources",
  { timeout: 120000 },
  withBrowserDiagnostics(async () => {
    const { server } = await getBrowserTestServer();
    let browser;
    try {
      browser = await createBrowserTestSession();
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      const errors = [];
      let moduleUrl;
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("response", (response) => {
        if (response.url().includes("/@react-three_fiber.js")) moduleUrl = response.url();
      });
      await page.goto(server.resolvedUrls.local[0]);
      await page.evaluate(async () => {
        history.replaceState(null, "", "?stage=scale-personal&scenario=connected");
        document.body.innerHTML = '<div id="root"></div>';
        await import("/tests/agent-harness.tsx");
      });
      await page.locator('html[data-evidence-ready="true"]').waitFor();
      assert.ok(moduleUrl);
      await page.evaluate(async (moduleUrl) => {
        window.personalRoots = (await import(moduleUrl))._roots;
      }, moduleUrl);
      await page.waitForFunction(() => {
        const root = window.personalRoots.get(document.querySelector("canvas"));
        if (!root) return false;
        window.personalScene = root.store.getState().scene;
        return Boolean(window.personalScene);
      });
      await page.waitForFunction(() => {
        let imported = 0;
        window.personalScene.traverse((object) => {
          if (object.userData.importedModel) imported++;
        });
        return imported === 7;
      });
      const inventory = await page.evaluate(() => {
        const meshes = [];
        window.personalScene.traverse((object) => {
          if (object.userData.importedModel) meshes.push(object);
        });
        return {
          count: meshes.length,
          geometries: new Set(meshes.map((mesh) => mesh.geometry)).size,
          materials: new Set(meshes.map((mesh) => mesh.material)).size,
          textures: meshes.filter((mesh) => mesh.material.map).length,
          lights: meshes.filter((mesh) => mesh.material.type === "MeshStandardMaterial").length,
        };
      });
      assert.deepEqual(inventory, {
        count: 7,
        geometries: 3,
        materials: 3,
        textures: 2,
        lights: 5,
      });
      const measurement = await page.evaluate(measureScene, {
        selector: "canvas",
        moduleUrl,
        samples: 3,
        warmupFrames: 3,
      });
      assert.ok(measurement.frames.every((frame) => frame.triangles > 0 && frame.calls > 0));
      await mkdir("test-results/personal-models", { recursive: true });
      await writeFile(
        "test-results/personal-models/scale-scene.json",
        JSON.stringify(measurement, null, 2),
      );
      await page.screenshot({ path: "test-results/personal-models/scale-scene.png" });
      assert.deepEqual(errors, []);
    } finally {
      await browser?.close();
    }
  }),
);
