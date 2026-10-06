import assert from "node:assert/strict";
import test from "node:test";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const { EditorModeNav } = await load("/apps/web/src/editor-chrome/EditorModeNav.tsx");
  const { EditorActionBar } = await load("/apps/web/src/editor-chrome/EditorActionBar.tsx");
  const { SelectedItemActionBar } = await load(
    "/apps/web/src/editor-preview/furnish/SelectedItemActionBar.tsx",
  );
  const { ArrangeCatalog } = await load(
    "/apps/web/src/editor-preview/furnish/catalog/ArrangeCatalog.tsx",
  );
  const { FurnishingInspector } = await load(
    "/apps/web/src/editor-preview/furnish/FurnishingInspector.tsx",
  );

  async function withDom(run) {
    const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: "http://cabane.local/" });
    const names = ["window", "document", "navigator", "HTMLElement", "IS_REACT_ACT_ENVIRONMENT"];
    const previous = Object.fromEntries(
      names.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]),
    );
    for (const name of names)
      Object.defineProperty(globalThis, name, {
        configurable: true,
        writable: true,
        value: name === "IS_REACT_ACT_ENVIRONMENT" ? true : dom.window[name],
      });
    const root = createRoot(dom.window.document.getElementById("root"));
    try {
      await run({ root, document: dom.window.document, window: dom.window });
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      for (const name of names) {
        if (previous[name]) Object.defineProperty(globalThis, name, previous[name]);
        else delete globalThis[name];
      }
    }
  }

  const props = (overrides = {}) => ({
    mode: "construct",
    tool: "wall",
    canUndo: true,
    canRedo: false,
    onToolChange() {},
    onUndo() {},
    onRedo() {},
    ...overrides,
  });

  test("mode navigation uses Arrange and enabled Connect with outline icons", async () => {
    await withDom(async ({ root, document }) => {
      let selected;
      await act(async () =>
        root.render(
          React.createElement(EditorModeNav, {
            mode: "construct",
            onModeChange: (mode) => {
              selected = mode;
            },
          }),
        ),
      );
      const buttons = [...document.querySelectorAll("button")];
      assert.deepEqual(
        buttons.map((button) => button.textContent),
        ["Construct", "Arrange", "Connect", "Shortcuts"],
      );
      assert.equal(buttons[0].getAttribute("aria-pressed"), "true");
      assert.equal(buttons[2].disabled, false);
      assert.equal(buttons[2].getAttribute("aria-pressed"), "false");
      await act(async () => buttons[2].click());
      assert.equal(selected, "connect");
      assert.equal(document.querySelectorAll('svg[aria-hidden="true"]').length, 4);
      await act(async () => buttons[1].click());
      assert.equal(selected, "furnish");
      assert.doesNotMatch(document.body.textContent, /Coming later|Furnish/);
    });
  });

  test("construction actions retain labels, ordering, pressed state, and callbacks", async () => {
    await withDom(async ({ root, document }) => {
      const selected = [];
      let undo = 0;
      await act(async () =>
        root.render(
          React.createElement(
            EditorActionBar,
            props({
              onToolChange: (tool) => selected.push(tool),
              onUndo: () => undo++,
            }),
          ),
        ),
      );
      const buttons = [...document.querySelectorAll("button")];
      assert.deepEqual(
        buttons.map((button) => button.getAttribute("aria-label")),
        [
          "Select",
          "Wall",
          "Door",
          "Window",
          "Passage",
          "Floor",
          "Boundary",
          "Pool",
          "Measure",
          "Undo",
          "Redo",
        ],
      );
      assert.deepEqual(
        buttons.slice(0, 9).map((button) => button.textContent),
        ["Select", "Wall", "Door", "Window", "Passage", "Floor", "Boundary", "Pool", "Measure"],
      );
      assert.equal(
        document.querySelector('[aria-label="Wall"]').getAttribute("aria-pressed"),
        "true",
      );
      assert.equal(document.querySelector('[aria-label="Redo"]').disabled, true);
      assert.equal(document.querySelectorAll('svg[aria-hidden="true"]').length, 11);
      assert.ok(document.querySelector('[role="group"][aria-label="Construction actions"]'));
      assert.equal(document.querySelector('[role="toolbar"]'), null);
      await act(async () => buttons.slice(0, 10).forEach((button) => button.click()));
      assert.deepEqual(selected, [
        "select",
        "wall",
        "door",
        "window",
        "passage",
        "floor",
        "hedge",
        "pool",
        "measure",
      ]);
      assert.equal(undo, 1);
      assert.equal(buttons[0].getAttribute("aria-keyshortcuts"), "V");
      assert.equal(buttons[5].getAttribute("aria-keyshortcuts"), "F");
      assert.equal(buttons[7].getAttribute("aria-keyshortcuts"), "P");
      assert.equal(buttons[9].getAttribute("aria-keyshortcuts"), "Control+Z Meta+Z");
      assert.equal(
        buttons[10].getAttribute("aria-keyshortcuts"),
        "Control+Shift+Z Meta+Shift+Z Control+Y",
      );
    });
  });

  test("Arrange shows shared history alone with supported shortcuts", async () => {
    await withDom(async ({ root, document }) => {
      let redone = 0;
      await act(async () =>
        root.render(
          React.createElement(
            EditorActionBar,
            props({
              mode: "furnish",
              canUndo: false,
              canRedo: true,
              onRedo: () => redone++,
            }),
          ),
        ),
      );
      const buttons = [...document.querySelectorAll("button")];
      assert.deepEqual(
        buttons.map((button) => button.getAttribute("aria-label")),
        ["Undo", "Redo"],
      );
      assert.equal(buttons[0].disabled, true);
      assert.equal(buttons[1].disabled, false);
      assert.equal(buttons[0].getAttribute("aria-keyshortcuts"), "Control+Z Meta+Z");
      assert.equal(
        buttons[1].getAttribute("aria-keyshortcuts"),
        "Control+Shift+Z Meta+Shift+Z Control+Y",
      );
      await act(async () => buttons[1].click());
      assert.equal(redone, 1);
    });
  });

  test("focus and hover tooltips escape the scroll container and dismiss accessibly", async () => {
    await withDom(async ({ root, document, window }) => {
      await act(async () => root.render(React.createElement(EditorActionBar, props())));
      const button = document.querySelector('[aria-label="Select"]');
      await act(async () => button.focus());
      const tooltip = document.querySelector('[role="tooltip"]');
      assert.match(tooltip.textContent, /Select.*V/);
      assert.equal(tooltip.parentElement, document.body);
      assert.equal(button.getAttribute("aria-describedby"), tooltip.id);
      assert.equal(button.tabIndex, 0);
      await act(async () =>
        button.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })),
      );
      assert.equal(document.querySelector('[role="tooltip"]'), null);
      await act(async () => {
        button.blur();
        button.dispatchEvent(new window.MouseEvent("mouseover", { bubbles: true }));
      });
      assert.ok(document.querySelector('[role="tooltip"]'));
      await act(async () => window.dispatchEvent(new window.Event("resize")));
      assert.equal(document.querySelector('[role="tooltip"]'), null);
    });
  });

  test("selected-item bar keeps compact actions and allows device deletion", async () => {
    await withDom(async ({ root, document }) => {
      const calls = [];
      const actions = {
        detailsOpen: false,
        onDetails: () => calls.push("details"),
        onDuplicate: () => calls.push("duplicate"),
        onDelete: () => calls.push("delete"),
      };
      await act(async () =>
        root.render(React.createElement(SelectedItemActionBar, { ...actions, isDevice: false })),
      );
      let buttons = [...document.querySelectorAll("button")];
      assert.deepEqual(
        buttons.map((b) => b.getAttribute("aria-label")),
        ["Details", "Duplicate", "Delete"],
      );
      assert.ok(buttons.every((button) => button.textContent === ""));
      await act(async () => buttons.forEach((button) => button.click()));
      assert.deepEqual(calls, ["details", "duplicate", "delete"]);
      await act(async () =>
        root.render(
          React.createElement(SelectedItemActionBar, {
            ...actions,
            isDevice: true,
          }),
        ),
      );
      assert.equal(document.querySelector('[aria-label="Connect device"]'), null);
      assert.equal(document.querySelector('[aria-label="Delete"]').disabled, false);
      await act(async () => document.querySelector('[aria-label="Delete"]').click());
      assert.equal(calls.at(-1), "delete");
      await act(async () =>
        root.render(
          React.createElement(SelectedItemActionBar, {
            ...actions,
            isDevice: true,
            onMap: () => calls.push("map"),
          }),
        ),
      );
      await act(async () => document.querySelector('[aria-label="Connect device"]').click());
      assert.equal(calls.at(-1), "map");
    });
  });

  test("item properties appear only on demand and the catalog keeps its search", async () => {
    await withDom(async ({ root, document, window }) => {
      const definition = {
        label: "Chair",
        category: "Seating",
        defaultRoomType: "living-room",
        defaultSize: [1, 1, 1],
        resizePolicy: { kind: "fixed" },
      };
      const item = {
        id: "chair",
        kind: "furnishing",
        modelId: "chair",
        size: [1, 1, 1],
        placement: { kind: "absolute", at: [1, 2], elevationMeters: 0, rotationYRadians: 0 },
      };
      let closed = 0;
      const props = {
        items: [item],
        selectedId: item.id,
        furnishingModels: { chair: definition },
        deviceModels: {},
        onPlacementChange() {},
        onSizeChange() {},
        onClose: () => closed++,
      };
      function Harness({ detailsOpen }) {
        const [browsing, onBrowse] = React.useState({ room: "all", query: "" });
        return React.createElement(
          React.Fragment,
          null,
          React.createElement(ArrangeCatalog, {
            furnishingModels: props.furnishingModels,
            deviceModels: {},
            browsing,
            onBrowse,
            onChoose() {},
            enabled: false,
          }),
          detailsOpen && React.createElement(FurnishingInspector, props),
        );
      }
      await act(async () => root.render(React.createElement(Harness, { detailsOpen: false })));
      assert.equal(document.querySelector('[aria-label="Selected furnishing"]'), null);
      const search = document.querySelector('input[placeholder="Search all items…"]');
      await act(async () => {
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(
          search,
          "Chair",
        );
        search.dispatchEvent(new window.Event("input", { bubbles: true }));
      });
      await act(async () => root.render(React.createElement(Harness, { detailsOpen: true })));
      assert.ok(document.querySelector('[aria-label="Selected furnishing"]'));
      assert.equal(document.querySelector('[aria-label="Add Chair"]').closest("[hidden]"), null);
      assert.equal(document.querySelectorAll('input[inputmode="decimal"]').length, 7);
      await act(async () => document.querySelector('[aria-label="Close details"]').click());
      assert.equal(closed, 1);
      await act(async () => root.render(React.createElement(Harness, { detailsOpen: false })));
      assert.equal(document.querySelector('input[placeholder="Search all items…"]'), search);
      assert.equal(document.querySelector('[aria-label="Selected furnishing"]'), null);
    });
  });
});
