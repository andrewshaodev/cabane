import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { withModules } from "./test-server.mjs";

await withModules(async load => {
  const { FloorPicker } = await load("/packages/engine/src/building/FloorPicker.tsx");
  test("floor stack opens before touch selection, supports focus, and guards unavailable floors", async () => {
    const dom = new JSDOM('<div id="root"></div><button id="outside">Outside</button>');
    const keys = ["window", "document", "HTMLElement", "IS_REACT_ACT_ENVIRONMENT"];
    const previous = Object.fromEntries(keys.map(key => [key, globalThis[key]]));
    Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true });
    const root = createRoot(document.getElementById("root"));
    const selected = [];
    const props = { floors: [{ id: "g", name: "Ground floor" }, { id: "1", name: "First floor" }, { id: "2", name: "Second floor" }], selectedId: "g", onSelect: id => selected.push(id), unavailable: { "2": "No clear walking entry" } };
    const pointer = element => {
      const event = new dom.window.Event("pointerdown", { bubbles: true });
      Object.defineProperty(event, "pointerType", { value: "touch" });
      element.dispatchEvent(event);
    };
    try {
      await act(async () => root.render(createElement(FloorPicker, props)));
      const stack = document.querySelector(".floor-picker");
      const floors = [...document.querySelectorAll(".floor-picker__level")];
      assert.deepEqual(floors.map(button => button.getAttribute("aria-label")), ["Second floor", "First floor", "Ground floor"]);
      assert.equal(floors[0].disabled, true);
      assert.match(floors[0].title, /No clear walking entry/);
      await act(async () => { pointer(floors[1]); floors[1].click(); });
      assert.equal(stack.dataset.expanded, "true");
      assert.deepEqual(selected, []);
      await act(async () => { pointer(floors[1]); floors[1].click(); });
      assert.deepEqual(selected, ["1"]);
      assert.equal(stack.dataset.expanded, "false");
      await act(async () => { floors[1].dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Tab", bubbles: true })); floors[1].focus(); });
      assert.equal(stack.dataset.expanded, "true");
      await act(async () => floors[1].dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
      assert.equal(stack.dataset.expanded, "false");
      await act(async () => root.render(createElement(FloorPicker, { ...props, disabled: true })));
      assert.ok(floors.every(button => button.disabled));
      await act(async () => floors[0].click());
      assert.deepEqual(selected, ["1"]);
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      Object.assign(globalThis, previous);
    }
  });
});
