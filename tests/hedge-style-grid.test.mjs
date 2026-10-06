import assert from "node:assert/strict";
import test from "node:test";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const { HedgeProperties } = await load(
    "/apps/web/src/editor-preview/construct/HedgeProperties.tsx",
  );
  test("hedge thumbnail cards choose all five styles, set new defaults, and preserve an existing hedge's dimensions", async () => {
    const dom = new JSDOM('<div id="root"></div>', { url: "http://cabane.local/" });
    const names = [
      "window",
      "document",
      "navigator",
      "ResizeObserver",
      "IntersectionObserver",
      "IS_REACT_ACT_ENVIRONMENT",
    ];
    const previous = Object.fromEntries(
      names.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]),
    );
    dom.window.ResizeObserver = class {
      observe() {}
      disconnect() {}
    };
    dom.window.IntersectionObserver = class {
      observe() {}
      disconnect() {}
    };
    for (const name of names)
      Object.defineProperty(globalThis, name, {
        configurable: true,
        writable: true,
        value: name === "IS_REACT_ACT_ENVIRONMENT" ? true : dom.window[name],
      });
    const root = createRoot(dom.window.document.getElementById("root"));
    const editor = {
      tool: "hedge",
      selection: null,
      draft: {},
      hedgeSettings: { style: "clipped", heightMeters: 1.4, widthMeters: 0.65 },
      setHedgeSettings(settings) {
        editor.hedgeSettings = settings;
      },
      dispatch(action) {
        editor.action = action;
      },
    };
    const render = () =>
      act(async () => root.render(React.createElement(HedgeProperties, { editor })));
    try {
      await render();
      const document = dom.window.document;
      assert.equal(document.querySelectorAll(".catalog-card__preview canvas").length, 5);
      assert.equal(document.querySelector("select"), null);
      assert.equal(
        document.querySelector('[aria-label="Clipped box"]').getAttribute("aria-pressed"),
        "true",
      );
      await act(async () => document.querySelector('[aria-label="Tall mixed hedge"]').click());
      assert.deepEqual(editor.hedgeSettings, {
        style: "mixed",
        heightMeters: 2.6,
        widthMeters: 1.2,
      });
      await render();
      assert.equal(
        document.querySelector('[aria-label="Tall mixed hedge"]').getAttribute("aria-pressed"),
        "true",
      );
      editor.selection = { kind: "hedge", id: "existing" };
      editor.draft.hedges = [{ id: "existing", style: "mixed", heightMeters: 3, widthMeters: 1.5 }];
      await render();
      await act(async () => document.querySelector('[aria-label="Ivy-covered wall"]').click());
      assert.deepEqual(editor.action, {
        type: "update-hedge",
        id: "existing",
        changes: { style: "ivy-wall" },
      });
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      for (const name of names) {
        if (previous[name]) Object.defineProperty(globalThis, name, previous[name]);
        else delete globalThis[name];
      }
    }
  });
});
