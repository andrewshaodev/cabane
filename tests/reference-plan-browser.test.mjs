import assert from "node:assert/strict";
import test from "node:test";
import { getBrowserTestServer, createBrowserTestSession } from "./browser-test-environment.mjs";

const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="white"/><path d="M100 100H700V500H100ZM400 100V500" fill="none" stroke="black" stroke-width="8"/><text x="200" y="80" font-size="28">6 m</text></svg>';
const file = (name = "ground-floor.svg", content = svg) => ({ name, mimeType: "image/svg+xml", buffer: Buffer.from(content) });

test("reference plans trace through the normal Construct UI and remain browser-local", { timeout: 120_000 }, async () => {
  const { server } = await getBrowserTestServer("app");
  let browser;
  try {
    browser = await createBrowserTestSession();
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`${server.resolvedUrls.local[0]}build`);
    const add = page.locator(".reference-plan").getByRole("button", { name: "Add image", exact: true });
    await add.waitFor();
    await page.waitForFunction(() => !document.querySelector('.reference-plan button')?.disabled);
    const tutorial = page.getByRole("region", { name: "Build your first room" });
    assert.match(await tutorial.innerText(), /Before you start · Optional/);
    assert.equal(await tutorial.evaluate(node => getComputedStyle(node).position), "fixed");
    const panel = page.getByRole("region", { name: "Reference plan", exact: true });
    const chooser = page.waitForEvent("filechooser");
    await tutorial.getByRole("button", { name: "Add image", exact: true }).click();
    await (await chooser).setFiles(file());
    await page.getByRole("button", { name: "Done", exact: true }).waitFor();
    const done = page.getByRole("button", { name: "Done", exact: true });
    await done.hover();
    assert.equal(await done.evaluate(node => getComputedStyle(node).color), "rgb(255, 249, 239)");
    assert.equal(await done.evaluate(node => getComputedStyle(node).backgroundColor), "rgb(167, 96, 61)");
    assert.equal(await panel.getByText("Position and size", { exact: true }).count(), 0);

    await page.locator(".reference-image").waitFor();
    assert.equal(await page.getByRole("group", { name: "Construction actions" }).getAttribute("inert"), "");
    // Pointer movement and an interrupted gesture preserve the adjustment session.
    const centerPoint = await page.locator(".reference-image").boundingBox();
    const imageTransform = () => page.locator(".reference-image").evaluate(image => image.style.transform);
    const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const dragImage = async () => { const box = await page.locator(".reference-image").boundingBox(); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 25, box.y + box.height / 2 + 20, { steps: 4 }); await page.mouse.up(); await settle(); };
    const beforeDrag = await imageTransform();
    await page.mouse.move(centerPoint.x + centerPoint.width / 2, centerPoint.y + centerPoint.height / 2);
    await page.mouse.down(); await page.mouse.move(centerPoint.x + centerPoint.width / 2 + 30, centerPoint.y + centerPoint.height / 2 + 20, { steps: 4 }); await page.mouse.up();
    await settle();
    assert.notEqual(await imageTransform(), beforeDrag);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const afterDrag = await imageTransform();
    await page.mouse.down(); await page.mouse.move(centerPoint.x + centerPoint.width / 2 + 60, centerPoint.y + centerPoint.height / 2 + 20);
    await page.keyboard.press("Escape"); await page.mouse.up();
    await page.waitForFunction(value => document.querySelector(".reference-image")?.style.transform === value, afterDrag, { timeout: 2000 });
    const rotate = await page.locator('[data-handle="rotate"]').boundingBox();
    await page.mouse.move(rotate.x + rotate.width / 2, rotate.y + rotate.height / 2);
    await page.mouse.down(); await page.mouse.move(rotate.x + 45, rotate.y + 25, { steps: 4 }); await page.mouse.up();
    await settle();
    await page.getByRole("button", { name: "Set scale", exact: true }).click();
    // Read rendered image transform to choose two image-space points after rotation.
    const point = async (u, v) => page.locator(".reference-image").evaluate((image, [u, v]) => {
      const matrix = new DOMMatrix(getComputedStyle(image).transform);
      const parent = image.parentElement.getBoundingClientRect();
      const at = new DOMPoint(u * image.width, v * image.height).matrixTransform(matrix);
      return { x: parent.left + at.x, y: parent.top + at.y };
    }, [u, v]);
    for (const [u, v] of [[.2, .4], [.7, .4]]) { const at = await point(u, v); await page.mouse.click(at.x, at.y); }
    await page.getByLabel("Reference distance in metres").fill("4");
    await page.getByRole("button", { name: "Apply scale", exact: true }).click();
    assert.equal(await panel.getByLabel("Reference width in metres").count(), 0);
    await page.getByRole("button", { name: "Done", exact: true }).click();
    assert.equal(await page.getByRole("button", { name: "Reset changes" }).isDisabled(), true, "reference changes do not dirty architecture");
    await page.waitForFunction(() => document.querySelector('.build-tutorial')?.textContent.includes('1 of 6'));
    await page.getByRole("button", { name: "Dismiss tutorial" }).click();
    // Escape cancels a completed canvas drag within the adjustment session.
    await settle();
    const originalTransform = await imageTransform();
    await page.getByRole("button", { name: "Adjust", exact: true }).click();
    await dragImage();
    await page.keyboard.press("Escape");
    await settle();
    assert.equal(await imageTransform(), originalTransform);
    // A rejected replacement preserves the original reference.
    await page.locator('.reference-plan input[type="file"]').setInputFiles(file("unsafe.svg", '<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>'));
    await panel.getByRole("alert").waitFor();
    assert.match(await panel.innerText(), /ground-floor.svg/);
    // Interleave wall and reference history, verifying that undo does not skip either.
    await page.getByRole("button", { name: "Wall", exact: true }).click();
    await page.mouse.click(600, 400); await page.mouse.click(1000, 400);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Adjust", exact: true }).click();
    const beforeAdjustment = await imageTransform();
    await dragImage();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page.getByRole("button", { name: /^Undo/ }).click();
    await page.getByRole("button", { name: "Adjust", exact: true }).click();
    await settle();
    assert.equal(await imageTransform(), beforeAdjustment);
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await page.getByRole("button", { name: /^Undo/ }).click();
    assert.equal(await page.getByRole("button", { name: "Reset changes" }).isDisabled(), true);
    await page.getByRole("button", { name: /^Undo/ }).click();
    assert.equal(await page.locator(".reference-image").count(), 0);
    await page.getByRole("button", { name: /^Redo/ }).click();
    await page.locator(".reference-image").waitFor();
    // Local storage failures are visible and retryable without losing the image.
    await page.evaluate(() => {
      window.referenceOriginalPut = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function (...args) {
        if (this.transaction.db.name === "cabane-reference-plans-v1") throw new DOMException("Full", "QuotaExceededError");
        return window.referenceOriginalPut.apply(this, args);
      };
    });
    await panel.getByRole("slider").press("End");
    await panel.getByRole("button", { name: "Retry", exact: true }).waitFor();
    assert.equal(await page.locator(".reference-image").count(), 1);
    // Keep every queued autosave failing until the actual Retry click. Restoring
    // put before Playwright finishes its actionability checks lets an older save
    // succeed and remove the button before the click is dispatched.
    await panel.getByRole("button", { name: "Retry", exact: true }).evaluate(button => {
      button.addEventListener("click", () => {
        IDBObjectStore.prototype.put = window.referenceOriginalPut;
      }, { capture: true, once: true });
    });
    await panel.getByRole("button", { name: "Retry", exact: true }).click();
    await panel.getByRole("button", { name: "Retry", exact: true }).waitFor({ state: "detached" });
    await panel.getByRole("slider").press("Home");
    for (let index = 0; index < 5; index++) await panel.getByRole("slider").press("PageUp");
    // Close a room and add an opening while the locked reference remains visible.
    await page.getByRole("button", { name: "Wall", exact: true }).click();
    for (const [x, y] of [[600, 380], [1000, 380], [1000, 700], [600, 700], [600, 380]]) await page.mouse.click(x, y);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Door", exact: true }).click();
    await page.mouse.click(800, 380);
    assert.equal(await page.locator(".reference-image").count(), 1);
    // Pan and cursor-centred zoom update the DOM projection.
    const transform = await page.locator(".reference-image").evaluate(image => image.style.transform);
    await page.mouse.move(850, 500); await page.mouse.wheel(90, 60);
    await page.waitForFunction(before => document.querySelector('.reference-image')?.style.transform !== before, transform);
    await page.keyboard.down("Control"); await page.mouse.wheel(0, -100); await page.keyboard.up("Control");
    await page.setViewportSize({ width: 1100, height: 760 });
    await page.screenshot({ path: "/tmp/cabane-reference-plan-desktop.png" });
    await page.waitForTimeout(400);
    await page.reload(); await page.locator(".reference-image").waitFor();
    assert.match(await panel.innerText(), /ground-floor.svg/);
    await page.getByRole("button", { name: "Arrange", exact: true }).click();
    await page.locator(".reference-image").waitFor({ state: "detached" });
    await page.getByRole("button", { name: "Construct", exact: true }).click();
    await page.locator(".reference-image").waitFor();
    const records = await page.evaluate(async () => {
      const db = await new Promise((resolve, reject) => { const r = indexedDB.open("cabane-projects-v2"); r.onsuccess = () => resolve(r.result); r.onerror = reject; });
      const rows = await new Promise(resolve => { const r = db.transaction("home-projects").objectStore("home-projects").getAll(); r.onsuccess = () => resolve(r.result); });
      db.close(); return rows;
    });
    assert.ok(records.every(value => !String(value).includes("ground-floor.svg")));
    // Floor references remain independent, survive deletion/undo, and cancel unfinished adjustments on switching.
    await page.locator(".floor-picker").hover();
    await page.getByRole("button", { name: "Manage floors", exact: true }).click();
    await page.getByRole("button", { name: "Add floor above", exact: true }).click();
    await page.locator(".reference-image").waitFor({ state: "detached" });
    const upperName = await page.locator('.floor-picker__level[aria-pressed="true"]').getAttribute("aria-label");
    await page.locator('.reference-plan input[type="file"]').setInputFiles(file("upper-floor.svg"));
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page.locator(".floor-picker").hover();
    await page.getByRole("button", { name: "Manage floors", exact: true }).click();
    await page.getByRole("button", { name: "Remove floor", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Remove floor", exact: true }).click();
    await page.getByRole("button", { name: /^Undo/ }).click();
    await page.locator(".floor-picker").hover();
    await page.getByRole("button", { name: upperName, exact: true }).click();
    assert.match(await panel.innerText(), /upper-floor.svg/);
    await page.getByRole("button", { name: "Adjust", exact: true }).click();
    await settle();
    const upperTransform = await imageTransform();
    await dragImage();
    await page.locator(".floor-picker").hover();
    await page.getByRole("button", { name: "Ground floor", exact: true }).click();
    assert.match(await panel.innerText(), /ground-floor.svg/);
    await page.locator(".floor-picker").hover();
    await page.getByRole("button", { name: upperName, exact: true }).click();
    await page.getByRole("button", { name: "Adjust", exact: true }).click();
    await settle();
    assert.equal(await imageTransform(), upperTransform);
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("button", { name: "Reset changes", exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.reference-plan__filename')?.textContent === 'ground-floor.svg');
    await page.setViewportSize({ width: 700, height: 650 });
    await panel.scrollIntoViewIfNeeded();
    await page.screenshot({ path: "/tmp/cabane-reference-plan-narrow.png" });
    const rail = await page.locator(".direction-rail").evaluate(node => ({ scroll: node.scrollWidth, client: node.clientWidth }));
    assert.ok(rail.scroll <= rail.client + 1, "sidebar does not overflow horizontally");
    // The same editor overlay works over the furnished, two-floor demo.
    const furnished = records.map(value => JSON.parse(value)).find(record => record.draft.sceneItems.length > 0);
    assert.ok(furnished);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${server.resolvedUrls.local[0]}workspaces/${encodeURIComponent(furnished.homeId)}/construct`);
    await page.locator('.reference-plan button').first().waitFor();
    await page.waitForFunction(() => !document.querySelector('.reference-plan button')?.disabled);
    await page.locator('.reference-plan input[type="file"]').setInputFiles(file('furnished-demo-reference.svg'));
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await page.locator('.reference-image').waitFor();
    await page.screenshot({ path: '/tmp/cabane-reference-plan-furnished.png' });
    assert.deepEqual(errors, []);
  } finally { await browser?.close(); }
});
