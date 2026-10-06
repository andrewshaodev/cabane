import assert from "node:assert/strict";
import test from "node:test";
import { getBrowserTestServer, createBrowserTestSession } from "./browser-test-environment.mjs";

// A disposable browser profile exercises the real host and IndexedDB together.
test("workspace host routes zero, one, multiple, missing and OAuth target homes", async () => {
  const { server } = await getBrowserTestServer("app");
  let browser;
  try {
    browser = await createBrowserTestSession();
    const page = await browser.newPage();
    const base = server.resolvedUrls.local[0];
    await page.goto(base);
    await page.getByRole("heading", { name: "Your home. In 3D. Under your control.", exact: true }).waitFor();
    assert.equal(new URL(page.url()).pathname, "/welcome");
    const demoId = await page.evaluate(async root => {
      const { createWorkspaceRepository } = await import(`/@fs${root}/packages/engine/src/home-project/index.ts`);
      const { ownerProjectRegistries } = await import("/src/project-runtime.ts");
      return (await createWorkspaceRepository(indexedDB, ownerProjectRegistries).readOnboarding()).demoWorkspaceId;
    }, process.cwd());
    const demoUrl = `${base}workspaces/${demoId}`;
    assert.equal(await page.getByRole("button", { name: /^Connect my Home Assistant/ }).count(), 0);
    await page.getByRole("button", { name: /^Explore the demo/ }).click();
    await page.waitForURL("**/demo");
    // The router updates history before React commits the destination. Exercise
    // the demo's menu before Back so it cannot interrupt that pending transition.
    await page.getByLabel("More options", { exact: true }).click();
    await page.getByRole("button", { name: /^Getting started/ }).waitFor();
    await page.goBack();
    await page.getByRole("heading", { name: "Your home. In 3D. Under your control.", exact: true }).waitFor();
    await page.goForward();
    await page.waitForURL("**/demo");
    await page.reload();
    await page.getByLabel("More options", { exact: true }).click();
    await page.getByRole("button", { name: /^Getting started/ }).click();
    await page.getByRole("button", { name: /^Build my home/ }).click();
    await page.waitForURL("**/build");
    const personalUrl = page.url();
    await page.getByRole("navigation", { name: "Editor mode" }).waitFor();
    await page.reload();
    await page.getByRole("navigation", { name: "Editor mode" }).waitFor();
    assert.equal(page.url(), personalUrl);
    await page.getByRole("button", { name: "Connect", exact: true }).click();
    await page.getByRole("heading", { name: "Connect your home", exact: true }).waitFor();
    await page.goto(`${demoUrl}/connect/devices`);
    await page.waitForURL(`${demoUrl}/connect/devices`);
    assert.equal(page.url(), `${demoUrl}/connect/devices`);
    await page.getByRole("navigation", { name: "Editor mode" }).waitFor();
    await page.goto(demoUrl);
    await page.getByLabel("More options", { exact: true }).click();
    await page.getByRole("button", { name: /^Getting started/ }).click();
    await page.getByRole("button", { name: /^Build my home/ }).click();
    await page.waitForURL(personalUrl);
    await page.goto(`${base}workspaces`);
    await page.getByRole("heading", { name: "Your workspaces", exact: true }).waitFor();
    await page.evaluate(async root => {
      const { createWorkspaceRepository } = await import(`/@fs${root}/packages/engine/src/home-project/index.ts`);
      const { ownerProjectRegistries } = await import("/src/project-runtime.ts");
      const repository = createWorkspaceRepository(indexedDB, ownerProjectRegistries);
      for (const entry of await repository.list()) await repository.delete(entry.metadata.id, await repository.readRaw(entry.metadata.id));
    }, process.cwd());
    await page.goto(`${base}workspaces`);
    await page.getByRole("heading", { name: "Your workspaces", exact: true }).waitFor();
    const first = await page.evaluate(async root => {
      const { createWorkspaceRepository } = await import(`/@fs${root}/packages/engine/src/home-project/index.ts`);
      const { ownerProjectRegistries } = await import("/src/project-runtime.ts");
      return (await createWorkspaceRepository(indexedDB, ownerProjectRegistries).createBlank("First home")).metadata.id;
    }, process.cwd());
    await page.goto(base);
    await page.waitForURL(`**/workspaces/${first}/construct`);
    await page.getByRole("navigation", { name: "Editor mode" }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Construct", exact: true }).getAttribute("aria-pressed"), "true");
    await page.getByRole("button", { name: "Workspaces: First home", exact: true }).click();
    await page.getByRole("heading", { name: "Your workspaces", exact: true }).waitFor();
    await page.goto(`${base}workspaces`);
    const second = await page.evaluate(async root => {
      const { createWorkspaceRepository } = await import(`/@fs${root}/packages/engine/src/home-project/index.ts`);
      const { ownerProjectRegistries } = await import("/src/project-runtime.ts");
      return (await createWorkspaceRepository(indexedDB, ownerProjectRegistries).createBlank("Second home")).metadata.id;
    }, process.cwd());
    await page.goto(`${base}workspaces`);
    await page.getByRole("heading", { name: "Your workspaces", exact: true }).waitFor();
    await page.goto(`${base}workspaces/missing-home`);
    await page.getByText("Could not open this workspace.", { exact: true }).waitFor();
    assert.equal(await page.getByRole("link", { name: "Workspaces", exact: true }).getAttribute("href"), "/workspaces");
    await page.evaluate(id => sessionStorage.setItem("cabane:editor-return:v1", JSON.stringify({ workspaceId: id, mode: "connect", view: "rooms" })), second);
    await page.goto(`${base}?auth_callback=1`);
    await page.waitForURL(`**/workspaces/${second}/connect/rooms*`);
    await page.getByRole("navigation", { name: "Editor mode" }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Connect", exact: true }).getAttribute("aria-pressed"), "true");
    await page.evaluate(() => sessionStorage.removeItem("cabane:editor-return:v1"));
    await page.goto(`${base}?auth_callback=1`);
    await page.getByText("This sign-in no longer has a workspace.", { exact: true }).waitFor();
    await page.evaluate(() => sessionStorage.setItem("cabane:editor-return:v1", JSON.stringify({ workspaceId: "deleted-home", mode: "connect" })));
    await page.goto(`${base}?auth_callback=1`);
    await page.getByText("This sign-in no longer has a workspace.", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Workspaces", exact: true }).click();
    await page.waitForURL("**/workspaces");
    await page.evaluate(async id => {
      await new Promise((resolve, reject) => {
        const request = indexedDB.open("cabane-projects-v2");
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("home-projects", "readwrite");
          tx.objectStore("home-projects").put("{damaged-fixture", id);
          tx.oncomplete = () => { db.close(); resolve(); };
          tx.onerror = () => { db.close(); reject(tx.error); };
        };
        request.onerror = () => reject(request.error);
      });
    }, first);
    await page.goto(`${base}workspaces/${first}`);
    await page.getByText("Your saved project needs recovery.", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Workspaces", exact: true }).click();
    await page.waitForURL("**/workspaces");
    await page.getByRole("heading", { name: "Your workspaces", exact: true }).waitFor();

    await page.evaluate(() => sessionStorage.removeItem("cabane:editor-return:v1"));
    await page.goto(`${base}workspaces/${second}/construct`);
    await page.getByRole("navigation", { name: "Editor mode" }).waitFor();
    await page.evaluate(async ({ root, id }) => {
      const { createWorkspaceRepository } = await import(`/@fs${root}/packages/engine/src/home-project/index.ts`);
      const { ownerProjectRegistries } = await import("/src/project-runtime.ts");
      const repository = createWorkspaceRepository(indexedDB, ownerProjectRegistries);
      await repository.delete(id, await repository.readRaw(id));
      window.dispatchEvent(new Event("focus"));
    }, { root: process.cwd(), id: second });
    await page.getByText("This workspace was deleted in another tab.", { exact: true }).waitFor();
    assert.equal(await page.getByRole("navigation", { name: "Editor mode" }).count(), 0);

    // A shared /build link is a real entry point even without a prior welcome visit.
    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobile.goto(`${base}build`);
    await mobile.getByRole("heading", { name: "Make room for the bigger picture." }).waitFor();
    assert.equal(new URL(mobile.url()).pathname, "/build");
    await mobile.reload();
    await mobile.getByRole("heading", { name: "Make room for the bigger picture." }).waitFor();
    assert.equal(new URL(mobile.url()).pathname, "/build");
    await mobile.getByRole("button", { name: /^Explore the demo/ }).click();
    await mobile.waitForURL("**/demo");
    await mobile.goto(`${base}welcome`);
    await mobile.getByRole("button", { name: /^Build my home/ }).click();
    await mobile.waitForURL("**/build");
    await mobile.getByRole("button", { name: "Build on mobile anyway" }).click();
    await mobile.waitForURL("**/construct");
    await mobile.getByRole("navigation", { name: "Editor mode" }).waitFor();
    const localHomes = await mobile.evaluate(async root => {
      const { createWorkspaceRepository } = await import(`/@fs${root}/packages/engine/src/home-project/index.ts`);
      const { ownerProjectRegistries } = await import("/src/project-runtime.ts");
      const repository = createWorkspaceRepository(indexedDB, ownerProjectRegistries);
      return { count: (await repository.list()).length, build: (await repository.readOnboarding()).destinations.build };
    }, process.cwd());
    assert.equal(localHomes.count, 2);
    assert.equal(new URL(mobile.url()).pathname, `/workspaces/${localHomes.build}/construct`);
    await mobile.setViewportSize({ width: 1280, height: 900 });
    await mobile.goto(`${base}build`);
    await mobile.getByRole("navigation", { name: "Editor mode" }).waitFor();
    assert.equal(new URL(mobile.url()).pathname, "/build");
    await mobile.goto(`${base}workspaces`);
    await mobile.evaluate(async root => {
      const { createWorkspaceRepository } = await import(`/@fs${root}/packages/engine/src/home-project/index.ts`);
      const { ownerProjectRegistries } = await import("/src/project-runtime.ts");
      const repository = createWorkspaceRepository(indexedDB, ownerProjectRegistries);
      for (const entry of await repository.list()) await repository.delete(entry.metadata.id, await repository.readRaw(entry.metadata.id));
    }, process.cwd());
    await mobile.goto(`${base}demo`);
    await mobile.getByText("The demo home is no longer in this browser.", { exact: true }).waitFor();
    await mobile.goto(`${base}build`);
    await mobile.getByText("Could not open this workspace.", { exact: true }).waitFor();
    await mobile.close();
  } finally { await browser?.close(); }
});
