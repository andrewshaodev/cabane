import assert from "node:assert/strict";
import test from "node:test";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { unzipSync } from "fflate";
import { withBrowserDiagnostics } from "./browser-test-diagnostics.mjs";
import { getBrowserTestServer, createBrowserTestSession } from "./browser-test-environment.mjs";
import { testGlb } from "./fixtures/personal-glb.mjs";
import { measureScene } from "../scripts/scene-performance/browser-probe.mjs";

test(
  "personal GLB import, skill, supports, history, publication and archive transfer through Arrange",
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
      await page.getByRole("button", { name: "My models", exact: true }).waitFor();
      assert.equal(
        await page.getByRole("button", { name: "Import model (.glb file)", exact: true }).count(),
        0,
      );
      assert.equal(
        await page.getByRole("button", { name: "Generate a custom model", exact: true }).count(),
        0,
      );
      assert.equal(await page.locator(".custom-model-management").count(), 0);
      await page.getByRole("button", { name: "My models", exact: true }).click();
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
          { rootPath, id },
        );
      const waitCounts = async (models, items) => {
        const deadline = Date.now() + 10000;
        while (Date.now() < deadline) {
          const record = await read();
          if (
            (record.draft.customModels?.length ?? 0) === models &&
            record.draft.sceneItems.length === items
          )
            return;
          await page.waitForTimeout(50);
        }
        assert.fail(`Expected ${models} models and ${items} persisted items.`);
      };
      await page.getByRole("button", { name: "Generate a custom model", exact: true }).click();
      const guide = page.getByRole("dialog", { name: "Generate a custom model", exact: true });
      await guide.waitFor();
      const command = "npx skills add cabane-app/agent-skills --skill create-cabane-model";
      assert.equal(await guide.locator("pre code").innerText(), command);
      const repositoryLink = guide.getByRole("link", { name: "View the skill on GitHub" });
      assert.equal(
        await repositoryLink.getAttribute("href"),
        "https://github.com/cabane-app/agent-skills",
      );
      assert.equal(await repositoryLink.getAttribute("target"), "_blank");
      await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
      await guide.getByRole("button", { name: "Copy command", exact: true }).click();
      await guide.getByRole("button", { name: "Copied", exact: true }).waitFor();
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), command);
      assert.equal(
        await guide.getByRole("button", { name: "Download AI skill", exact: true }).count(),
        0,
      );
      assert.match(await guide.innerText(), /photo/);
      await guide.locator("img").evaluate((image) => image.decode());
      await mkdir("test-results/personal-models", { recursive: true });
      await page.screenshot({ path: "test-results/personal-models/generate-desktop.png" });
      await guide.press("Escape");
      await guide.waitFor({ state: "hidden" });
      await page.waitForFunction(
        () => document.activeElement?.textContent?.trim() === "Generate a custom model",
      );
      assert.equal(
        await page
          .getByRole("button", { name: "Generate a custom model", exact: true })
          .evaluate((button) => button === document.activeElement),
        true,
      );
      await page.getByRole("button", { name: "All items", exact: true }).click();
      assert.equal(
        await page.getByRole("button", { name: "Download AI skill", exact: true }).count(),
        0,
      );
      assert.equal(
        await page.getByRole("button", { name: "Import model (.glb file)", exact: true }).count(),
        0,
      );
      await page.getByRole("button", { name: "My models", exact: true }).click();
      const threeFixture = JSON.parse(
        await readFile("tests/fixtures/personal-three-model.json", "utf8"),
      );
      const examples = [
        {
          name: "AI desk",
          bytes: Buffer.from(threeFixture.base64, "base64"),
          support: "floor",
          profile: "furniture",
        },
        {
          name: "Textured wall model",
          bytes: testGlb({ textured: true, embedded: true }),
          support: "wall",
          profile: "furniture",
        },
        {
          name: "Personal ceiling lamp",
          bytes: testGlb({ unlit: true }),
          support: "ceiling",
          profile: "light",
        },
      ];
      for (const [index, example] of examples.entries()) {
        const chooser = page.waitForEvent("filechooser");
        await page.getByRole("button", { name: "Import model (.glb file)", exact: true }).click();
        await (
          await chooser
        ).setFiles({
          name: `${example.name}.glb`,
          mimeType: "model/gltf-binary",
          buffer: Buffer.from(example.bytes),
        });
        const dialog = page.getByRole("dialog", { name: "Import GLB", exact: true });
        await dialog
          .getByText("Original materials and textures are preserved.", { exact: false })
          .waitFor();
        await dialog.getByLabel("Name", { exact: true }).fill(example.name);
        await dialog.getByLabel("Preferred placement").selectOption(example.support);
        await dialog.getByLabel("Profile", { exact: true }).selectOption(example.profile);
        await dialog.getByLabel("Width", { exact: true }).fill("0.7");
        await dialog.getByLabel("Y", { exact: true }).fill("90");
        if (index === 1) assert.match(await dialog.innerText(), /Embedded cameras are ignored/);
        if (index === 2) await dialog.getByLabel("Light Y", { exact: true }).fill("-0.1");
        if (index === 1) {
          await mkdir("test-results/personal-models", { recursive: true });
          await page.screenshot({ path: "test-results/personal-models/import-desktop.png" });
        }
        await dialog.getByRole("button", { name: "Add to My models", exact: true }).click();
        await dialog.waitFor({ state: "hidden" });
        await page.getByRole("button", { name: `Add ${example.name}`, exact: true }).click();
        await waitCounts(index + 1, index + 1);
        const beforeElevation = (await read()).draft.sceneItems[index].placement;
        const elevationValue = (placement) =>
          placement.kind === "ceiling" ? -placement.dropMeters : placement.elevationMeters;
        const waitPlacement = async (check) => {
          for (let attempt = 0; attempt < 100; attempt++) {
            const placement = (await read()).draft.sceneItems[index].placement;
            if (check(placement)) return placement;
            await page.waitForTimeout(50);
          }
          assert.fail("Elevation did not reach the expected persisted placement");
        };
        const dragElevation = async (dy, cancel = false) => {
          const handle = page.getByRole("button", {
            name: "Drag to change elevation",
            exact: true,
          });
          const bounds = await handle.boundingBox();
          assert.ok(bounds);
          await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
          await page.mouse.down();
          await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2 + dy, {
            steps: 5,
          });
          if (cancel) await page.keyboard.press("Escape");
          await page.mouse.up();
        };
        await dragElevation(-40);
        const raised = await waitPlacement(
          (p) => elevationValue(p) > elevationValue(beforeElevation),
        );
        assert.equal(raised.kind, beforeElevation.kind);
        const { elevationMeters: _a, dropMeters: _b, ...raisedSupport } = raised;
        const { elevationMeters: _c, dropMeters: _d, ...originalSupport } = beforeElevation;
        assert.deepEqual(raisedSupport, originalSupport);
        await page.getByRole("button", { name: "Undo", exact: true }).click();
        await waitPlacement((p) => JSON.stringify(p) === JSON.stringify(beforeElevation));
        await page.getByRole("button", { name: "Redo", exact: true }).click();
        await waitPlacement((p) => JSON.stringify(p) === JSON.stringify(raised));
        await dragElevation(30, true);
        await waitPlacement((p) => JSON.stringify(p) === JSON.stringify(raised));
        await dragElevation(25);
        await waitPlacement((p) => elevationValue(p) < elevationValue(raised));
        await page.getByRole("button", { name: "Undo", exact: true }).click();
        await waitPlacement((p) => JSON.stringify(p) === JSON.stringify(raised));
        await page.getByRole("button", { name: "Undo", exact: true }).click();
        await waitPlacement((p) => JSON.stringify(p) === JSON.stringify(beforeElevation));
        if (index === 0) {
          await mkdir("test-results/elevation", { recursive: true });
          await page.screenshot({ path: "test-results/elevation/controls.png" });
          await page.getByRole("button", { name: "Duplicate", exact: true }).click();
          await waitCounts(1, 2);
          await page.getByRole("button", { name: "Undo", exact: true }).click();
          await waitCounts(1, 1);
          await page.getByRole("button", { name: "Redo", exact: true }).click();
          await waitCounts(1, 2);
          await page.getByRole("button", { name: "Undo", exact: true }).click();
          await waitCounts(1, 1);
        }
      }
      const draft = await read();
      assert.deepEqual(
        draft.draft.sceneItems.map((item) => item.placement.kind),
        ["absolute", "wall", "ceiling"],
        JSON.stringify(draft.draft.sceneItems),
      );
      assert.equal(draft.draft.sceneItems[2].entitySlots.length, 1);
      // The standalone Blender example is also accepted through the normal import UI.
      const blenderFixture = JSON.parse(
        await readFile("tests/fixtures/personal-blender-model.json", "utf8"),
      );
      await page.locator('.custom-model-library input[type="file"]').setInputFiles({
        name: "Blender desk.glb",
        mimeType: "model/gltf-binary",
        buffer: Buffer.from(blenderFixture.base64, "base64"),
      });
      const blender = page.getByRole("dialog", { name: "Import GLB", exact: true });
      await blender
        .getByText("Original materials and textures are preserved.", { exact: false })
        .waitFor();
      await blender.getByLabel("Name", { exact: true }).fill("Blender desk");
      assert.ok(
        Math.abs(Number(await blender.getByLabel("Width", { exact: true }).inputValue()) - 1.2) <
          0.001,
      );
      assert.ok(
        Math.abs(Number(await blender.getByLabel("Height", { exact: true }).inputValue()) - 0.75) <
          0.001,
      );
      await blender.getByRole("button", { name: "Add to My models", exact: true }).click();
      await blender.waitFor({ state: "hidden" });
      await waitCounts(4, 3);
      assert.equal(await page.locator(".custom-model-management").count(), 0);
      assert.equal(await page.locator(".custom-model-card").count(), 4);
      const blenderCard = page.getByRole("article", { name: "Blender desk model", exact: true });
      await blenderCard.locator(".custom-model-preview").hover();
      await blenderCard.getByRole("button", { name: "Remove Blender desk", exact: true }).click();
      await waitCounts(3, 3);
      // A failed import keeps the scene and existing catalogue usable.
      await page.locator('.custom-model-library input[type="file"]').setInputFiles({
        name: "broken.glb",
        mimeType: "model/gltf-binary",
        buffer: Buffer.from("invalid"),
      });
      const failed = page.getByRole("dialog", { name: "Import GLB", exact: true });
      await failed.getByRole("alert").waitFor();
      await failed.getByRole("button", { name: "Cancel", exact: true }).click();
      assert.equal((await read()).draft.customModels.length, 3);
      await page.locator('.custom-model-library input[type="file"]').setInputFiles({
        name: "independent.glb",
        mimeType: "model/gltf-binary",
        buffer: Buffer.from(examples[0].bytes),
      });
      const independent = page.getByRole("dialog", { name: "Import GLB", exact: true });
      await independent.getByLabel("Name", { exact: true }).fill("Independent desk");
      await independent.getByRole("button", { name: "Add to My models", exact: true }).click();
      await independent.waitFor({ state: "hidden" });
      await waitCounts(4, 3);
      const separate = (await read()).draft.customModels;
      assert.notEqual(separate[0].id, separate[3].id);
      assert.equal(separate[0].asset.sha256, separate[3].asset.sha256);
      const used = page.getByRole("article", { name: "AI desk model", exact: true });
      await used.getByRole("button", { name: "Add AI desk", exact: true }).focus();
      assert.equal(
        await used
          .locator(".custom-model-preview-actions")
          .evaluate((element) => getComputedStyle(element).opacity),
        "1",
      );
      assert.equal(
        await used.getByRole("button", { name: "Remove AI desk", exact: true }).isDisabled(),
        true,
      );
      const spare = page.getByRole("article", { name: "Independent desk model", exact: true });
      await page.getByRole("searchbox", { name: "Search my models", exact: true }).hover();
      assert.equal(
        await spare
          .locator(".custom-model-preview-actions")
          .evaluate((element) => getComputedStyle(element).opacity),
        "0",
      );
      await spare.locator(".custom-model-preview").hover();
      assert.equal(
        await spare
          .locator(".custom-model-preview-actions")
          .evaluate((element) => getComputedStyle(element).opacity),
        "1",
      );
      await page.screenshot({ path: "test-results/personal-models/models-desktop.png" });
      await spare.getByRole("button", { name: "Rename Independent desk", exact: true }).click();
      await page.getByLabel("Model name", { exact: true }).fill("Spare desk");
      await page.getByLabel("Model name", { exact: true }).press("Enter");
      const renamed = page.getByRole("article", { name: "Spare desk model", exact: true });
      await renamed.locator(".custom-model-preview").hover();
      const modelDownload = page.waitForEvent("download");
      await renamed.getByRole("button", { name: "Download Spare desk GLB", exact: true }).click();
      const downloaded = await modelDownload;
      assert.equal(downloaded.suggestedFilename(), "Spare_desk.glb");
      assert.deepEqual(await readFile(await downloaded.path()), examples[0].bytes);
      await renamed.getByRole("button", { name: "Remove Spare desk", exact: true }).click();
      await waitCounts(3, 3);
      await page.getByRole("button", { name: "Undo", exact: true }).click();
      await waitCounts(4, 3);
      await page.getByRole("button", { name: "Redo", exact: true }).click();
      await waitCounts(3, 3);
      await page.getByRole("button", { name: "Save", exact: true }).click();
      const publish = page.locator(".direction-publish-dialog");
      await publish.getByRole("button", { name: /Save/ }).click();
      await page.waitForURL(`${url}workspaces/${id}`);
      assert.equal((await read()).published.customModels.length, 3);
      await page.goto(`${url}workspaces/${id}/arrange`);
      await page.getByRole("button", { name: "My models", exact: true }).click();
      await page.getByRole("button", { name: "Add AI desk", exact: true }).waitFor();
      await page.getByRole("button", { name: "Add AI desk", exact: true }).click();
      await waitCounts(3, 4);
      page.on("dialog", (dialog) => dialog.accept());
      await page.getByRole("button", { name: "Reset changes", exact: true }).click();
      await waitCounts(3, 3);
      await page.reload();
      await page.getByRole("button", { name: "My models", exact: true }).click();
      await page.getByRole("button", { name: "Import model (.glb file)", exact: true }).waitFor();
      assert.equal((await read()).draft.customModels.length, 3);
      await page.screenshot({ path: "test-results/personal-models/arrange-desktop.png" });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.getByRole("button", { name: "Generate a custom model", exact: true }).click();
      const mobileGuide = page.getByRole("dialog", {
        name: "Generate a custom model",
        exact: true,
      });
      await mobileGuide.waitFor();
      await mobileGuide.locator("img").evaluate((image) => image.decode());
      await page.screenshot({ path: "test-results/personal-models/generate-mobile.png" });
      const guideRect = await mobileGuide.boundingBox();
      assert.ok(guideRect.width <= 390 && guideRect.x >= 0 && guideRect.height <= 812);
      assert.equal(
        await mobileGuide.evaluate((element) => element.scrollWidth <= element.clientWidth),
        true,
      );
      await mobileGuide
        .getByRole("button", { name: "Close generation guide", exact: true })
        .click();
      const mobileCard = page.getByRole("article", { name: "AI desk model", exact: true });
      await mobileCard.getByRole("button", { name: "Add AI desk", exact: true }).focus();
      await page.screenshot({ path: "test-results/personal-models/models-mobile.png" });
      assert.equal(
        await mobileCard
          .locator(".custom-model-preview-actions")
          .evaluate((element) => getComputedStyle(element).opacity),
        "1",
      );
      await page.locator('.custom-model-library input[type="file"]').setInputFiles({
        name: "mobile.glb",
        mimeType: "model/gltf-binary",
        buffer: Buffer.from(testGlb()),
      });
      const mobile = page.getByRole("dialog", { name: "Import GLB", exact: true });
      await mobile
        .getByText("Original materials and textures are preserved.", { exact: false })
        .waitFor();
      assert.equal(await mobile.getByRole("heading", { name: "Import GLB" }).isVisible(), true);
      await page.waitForTimeout(350);
      await page.screenshot({ path: "test-results/personal-models/import-mobile.png" });
      const rect = await mobile.boundingBox();
      assert.ok(rect.width <= 390 && rect.x >= 0);
      await mobile.getByRole("button", { name: "Cancel", exact: true }).click();
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
        3,
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
      await other.waitForURL(/workspaces\/[^/]+$/);
      const importedId = new URL(other.url()).pathname.split("/").at(-1);
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
      assert.deepEqual(imported, { models: 3, items: 3, assets: 3 });
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
