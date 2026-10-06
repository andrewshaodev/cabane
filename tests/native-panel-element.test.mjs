import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { withModules } from "./test-server.mjs";

await withModules(async load => {
  const { createCabanePanelElement } = await load("/apps/web/src/panel/panel-element.ts");
  test("panel borrows only the connection and remounts without touching host history or socket", () => {
    const dom = new JSDOM('<main id="host"></main>', { url: "https://ha.example/cabane?host=kept" });
    const before = dom.window.location.href;
    const saved = Object.getOwnPropertyDescriptor(globalThis, "HTMLElement");
    Object.defineProperty(globalThis, "HTMLElement", { configurable: true, value: dom.window.HTMLElement });
    const mounts = [], updates = [], disposals = [];
    const connection = { close() { assert.fail("panel must not close host socket"); } };
    try {
      const Panel = createCabanePanelElement({ assetBaseUrl: "https://ha.example/cabane_static/revision/",
        mount(input) { mounts.push(input); return { update(session) { updates.push(session); }, dispose() { disposals.push(true); } }; },
      });
      dom.window.customElements.define("cabane-panel", Panel);
      const panel = dom.window.document.createElement("cabane-panel");
      panel.hass = { connection, states: { private: true }, auth: { token: "must-not-retain" } };
      dom.window.document.querySelector("#host").append(panel);
      assert.equal(mounts.length, 1);
      assert.deepEqual(mounts[0].session, { connection, origin: "https://ha.example" });
      assert.equal(mounts[0].root, panel.shadowRoot);
      assert.equal(mounts[0].portalContainer.getRootNode(), panel.shadowRoot);
      panel.hass = { connection, states: { changed: true } };
      assert.equal(updates.length, 0, "ordinary hass state updates keep the same runtime");
      const replacement = { ...connection };
      panel.hass = { connection: replacement };
      assert.equal(updates.length, 1);
      assert.equal(updates[0].connection, replacement);
      let menuEvents = 0;
      dom.window.document.addEventListener("hass-toggle-menu", () => menuEvents++);
      panel.shadowRoot.querySelector('[aria-label="Open Home Assistant menu"]').click();
      assert.equal(menuEvents, 1);
      const styles = [...panel.shadowRoot.querySelectorAll('link[rel="stylesheet"]')];
      assert.equal(styles[0].href, "https://ha.example/cabane_static/revision/cabane-panel.css");
      assert.equal(dom.window.document.head.querySelectorAll('link[data-cabane-fonts]').length, 1);
      panel.remove();
      assert.equal(disposals.length, 1);
      assert.equal(dom.window.document.head.querySelectorAll('link[data-cabane-fonts]').length, 0);
      dom.window.document.querySelector("#host").append(panel);
      assert.equal(mounts.length, 2);
      panel.hass = undefined;
      assert.equal(disposals.length, 2);
      assert.equal(dom.window.location.href, before);
      panel.remove();
    } finally {
      dom.window.close();
      if (saved) Object.defineProperty(globalThis, "HTMLElement", saved); else delete globalThis.HTMLElement;
    }
  });
});
