import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";
import { createBrowserTestSession, getBrowserTestServer } from "./browser-test-environment.mjs";
import { withBrowserDiagnostics } from "./browser-test-diagnostics.mjs";

test(
  "room modules reorder by pointer and keyboard, persist after reload, and fit mobile",
  withBrowserDiagnostics(async () => {
    const { server } = await getBrowserTestServer();
    server.middlewares.use(async (request, response, next) => {
      if (!request.url?.startsWith("/tests/dashboard-harness.html")) return next();
      response.setHeader("Content-Type", "text/html");
      response.end(
        await server.transformIndexHtml(
          request.url,
          await readFile("tests/dashboard-harness.html", "utf8"),
        ),
      );
    });
    const session = await createBrowserTestSession();
    try {
      const page = await session.newPage({ viewport: { width: 1440, height: 960 } });
      await page.goto(
        `${server.resolvedUrls.local[0]}tests/dashboard-harness.html?scenario=connected`,
      );
      await page.getByRole("button", { name: "Demo room", exact: true }).click();
      await page.getByRole("button", { name: "Reorder devices", exact: true }).click();
      const rows = page.locator("[data-reorder-id]");
      const ids = () => rows.evaluateAll((nodes) => nodes.map((node) => node.dataset.reorderId));
      const initial = await ids();
      assert.ok(initial.length > 2);
      const handle = await rows.nth(0).getByRole("button").first().boundingBox();
      const target = await rows.nth(1).boundingBox();
      await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
      await page.mouse.down();
      await page.mouse.move(target.x + 24, target.y + target.height / 2, { steps: 8 });
      await page.mouse.up();
      assert.deepEqual((await ids()).slice(0, 2), [initial[1], initial[0]]);
      await rows.nth(1).getByRole("button").first().focus();
      await page.keyboard.press("ArrowDown");
      const expected = await ids();
      assert.equal(expected[2], initial[0]);
      await page.getByRole("button", { name: "Done reordering devices" }).click();
      const titles = await page.locator(".room-module__header h2").allTextContents();
      await page.reload();
      const reorder = page.getByRole("button", { name: "Reorder devices", exact: true });
      if (!(await reorder.isVisible()))
        await page.getByRole("button", { name: "Demo room", exact: true }).click();
      await reorder.click();
      assert.deepEqual(await ids(), expected);
      await page.screenshot({ path: "/tmp/cabane-room-reorder-desktop.png" });
      await page.setViewportSize({ width: 390, height: 844 });
      await rows.first().scrollIntoViewIfNeeded();
      await page.screenshot({ path: "/tmp/cabane-room-reorder-mobile.png" });
      const touchHandle = await rows.nth(0).getByRole("button").first().boundingBox();
      const touchTarget = await rows.nth(1).boundingBox();
      const cdp = await page.context().newCDPSession(page);
      const point = { x: touchHandle.x + 20, y: touchHandle.y + 20 };
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: point.x, y: touchTarget.y + touchTarget.height / 2 }],
      });
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      assert.deepEqual((await ids()).slice(0, 2), [expected[1], expected[0]]);
      await rows.nth(1).getByRole("button", { name: /up$/ }).click();
      assert.deepEqual(await ids(), expected);
      assert.equal(
        await page
          .locator(".room-control-sheet")
          .evaluate((node) => node.scrollWidth <= node.clientWidth),
        true,
      );
      await page.getByRole("button", { name: "Done reordering devices" }).click();
      assert.deepEqual(await page.locator(".room-module__header h2").allTextContents(), titles);
      await reorder.click();
      await page.keyboard.press("Escape");
      assert.equal(await reorder.isVisible(), true);
      assert.equal(await rows.count(), 0);
    } finally {
      await session.close();
    }
  }),
);
