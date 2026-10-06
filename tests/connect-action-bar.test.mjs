import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const { ConnectActionBar } = await load("/apps/web/src/editor-connect/ConnectActionBar.tsx");
  test("Connect actions select a view and refresh without separate Save or camera controls", async () => {
    const dom = new JSDOM("<div id='root'></div>", { url: "http://localhost" });
    const previous = Object.fromEntries(["window", "document", "HTMLElement", "IS_REACT_ACT_ENVIRONMENT"].map((key) => [key, globalThis[key]]));
    Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true });
    const root = createRoot(document.getElementById("root"));
    let selected = null;
    let refreshes = 0;
    const props = { view: "rooms", onViewChange: (view) => { selected = view; }, refreshing: false, disconnected: false, hasUnmappedRooms: false, onRefresh: () => { refreshes += 1; } };
    try {
      await act(async () => root.render(React.createElement(ConnectActionBar, props)));
      const buttons = [...document.querySelectorAll("button")];
      assert.deepEqual(buttons.map((button) => button.getAttribute("aria-label")), ["Rooms", "Devices", "Refresh from Home Assistant"]);
      assert.equal(buttons[0].getAttribute("aria-pressed"), "true");
      assert.equal(buttons[1].getAttribute("aria-pressed"), "false");
      assert.equal(document.querySelectorAll("svg[aria-hidden='true']").length, 3);
      assert.doesNotMatch(document.body.textContent, /Save|Fit|3D|2D/);
      await act(async () => { buttons[1].click(); buttons[2].click(); });
      assert.equal(selected, "devices");
      assert.equal(refreshes, 1);
      await act(async () => root.render(React.createElement(ConnectActionBar, { ...props, view: "devices", hasUnmappedRooms: true })));
      assert.ok(buttons[0].querySelector(".editor-action-button__warning svg"));
      assert.equal(buttons[0].getAttribute("aria-description"), "Some rooms are not mapped to Home Assistant areas.");
      assert.equal(buttons[1].querySelector(".editor-action-button__warning"), null);
      await act(async () => buttons[0].focus());
      assert.equal(document.querySelector("[role='tooltip']").textContent, "Some rooms are not mapped to Home Assistant areas.");
      await act(async () => root.render(React.createElement(ConnectActionBar, { ...props, view: "devices", disconnected: true })));
      assert.equal(buttons[0].querySelector(".editor-action-button__warning"), null);
      assert.equal(buttons[0].hasAttribute("aria-description"), false);
      assert.equal(buttons[1].getAttribute("aria-pressed"), "true");
      assert.equal(buttons[2].disabled, true);
      assert.equal(buttons[0].disabled, false);
      await act(async () => root.render(React.createElement(ConnectActionBar, { ...props, refreshing: true })));
      assert.equal(buttons[2].disabled, true);
      await act(async () => buttons[2].click());
      assert.equal(refreshes, 1);
    } finally {
      await act(async () => root.unmount());
      Object.assign(globalThis, previous);
      dom.window.close();
    }
  });
});
