import assert from "node:assert/strict";
import test from "node:test";
import { withBrowserDiagnostics } from "./browser-test-diagnostics.mjs";
import { getBrowserTestServer, createBrowserTestSession } from "./browser-test-environment.mjs";

test(
  "Arrange rug numeric editing, keyboard steps, validation and persistence",
  { timeout: 120000 },
  withBrowserDiagnostics(async () => {
    const { server } = await getBrowserTestServer("app");
    const browser = await createBrowserTestSession();
    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      const url = server.resolvedUrls.local[0];
      await page.goto(url);
      const rootPath = process.cwd();
      const id = await page.evaluate(async (rootPath) => {
        const engine = await import(`/@fs${rootPath}/packages/engine/src/index.ts`);
        const fixture = await import(`/@fs${rootPath}/tests/fixtures/multiple-floors.ts`);
        const registry = await import("/src/project-runtime.ts");
        const schema = engine.parseHomeProjectSchema(fixture.makeLegacyProject());
        const result = await engine
          .createWorkspaceRepository(window.indexedDB, registry.ownerProjectRegistries)
          .create(engine.createSeedProjectRecord(schema.project), { name: "Numeric editing test" });
        return result.metadata.id;
      }, rootPath);
      await page.goto(`${url}workspaces/${id}/arrange`);
      await page.getByRole("searchbox").fill("Rug");
      await page.getByRole("button", { name: "Add Rug", exact: true }).click();
      await page.getByRole("button", { name: "Details", exact: true }).click();
      const width = page.getByRole("textbox", { name: "width · m", exact: true });
      await width.fill("0,");
      assert.equal(await width.inputValue(), "0,");
      await width.fill("0,5");
      await width.press("Enter");
      assert.equal(await width.inputValue(), "0.5");
      await width.press("ArrowUp");
      assert.equal(await width.inputValue(), "0.6");
      await width.press("Shift+ArrowUp");
      assert.equal(await width.inputValue(), "1.6");
      await width.fill("9");
      await width.press("Escape");
      assert.equal(await width.inputValue(), "1.6");
      await width.fill("0");
      await width.press("Enter");
      assert.equal(await width.getAttribute("aria-invalid"), "true");
      await width.press("Escape");
      await width.fill("");
      await width.press("Tab");
      assert.equal(await width.getAttribute("aria-invalid"), "true");
      await width.fill("0.5");
      await width.press("Tab");
      const x = page.getByRole("textbox", { name: "X · plan units", exact: true });
      await x.fill("0");
      await x.press("Enter");
      assert.equal(await x.inputValue(), "0");
      const rotation = page.getByRole("textbox", { name: "Degrees · °", exact: true });
      await rotation.fill("0");
      await rotation.press("Enter");
      await rotation.press("ArrowUp");
      assert.equal(await rotation.inputValue(), "1");
      await page.getByRole("button", { name: "Increase Degrees", exact: true }).click();
      assert.equal(await rotation.inputValue(), "2");
      await page.waitForFunction(
        async ({ rootPath, id }) => {
          const engine = await import(`/@fs${rootPath}/packages/engine/src/index.ts`);
          const registry = await import("/src/project-runtime.ts");
          const result = await engine
            .createWorkspaceRepository(window.indexedDB, registry.ownerProjectRegistries)
            .read(id);
          const item = result.record?.draft.sceneItems[0];
          return (
            item?.size[0] === 0.5 &&
            item.placement.at[0] === 0 &&
            Math.abs(item.placement.rotationYRadians - (2 * Math.PI) / 180) < 1e-8
          );
        },
        { rootPath, id },
      );
      await page.getByRole("button", { name: "Save", exact: true }).click();
      await page.locator(".direction-publish-dialog").getByRole("button", { name: /Save/ }).click();
      await page.waitForURL(`${url}workspaces/${id}`);
      await page.reload();
      const saved = await page.evaluate(
        async ({ rootPath, id }) => {
          const engine = await import(`/@fs${rootPath}/packages/engine/src/index.ts`);
          const registry = await import("/src/project-runtime.ts");
          return (
            await engine
              .createWorkspaceRepository(window.indexedDB, registry.ownerProjectRegistries)
              .read(id)
          ).record.draft.sceneItems[0];
        },
        { rootPath, id },
      );
      assert.equal(saved.size[0], 0.5);
      assert.equal(saved.placement.at[0], 0);
    } finally {
      await browser.close();
    }
  }),
);
