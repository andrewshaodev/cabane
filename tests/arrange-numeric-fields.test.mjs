import assert from "node:assert/strict";
import test from "node:test";
import { act, createElement } from "react";
import { JSDOM } from "jsdom";
import { createRoot } from "react-dom/client";
import { withModules } from "./test-server.mjs";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async (load) => {
  const { FurnishingProperties } = await load(
    "/apps/web/src/editor-preview/furnish/FurnishingProperties.tsx",
  );
  test("Arrange numeric fields preserve drafts and accept comma decimals", async (context) => {
    const names = ["window", "document", "HTMLElement"];
    const previous = names.map((name) => Object.getOwnPropertyDescriptor(globalThis, name));
    context.after(() =>
      names.forEach((name, index) => {
        if (previous[index]) Object.defineProperty(globalThis, name, previous[index]);
        else delete globalThis[name];
      }),
    );
    const dom = new JSDOM('<div id="root"></div>');
    globalThis.HTMLElement = dom.window.HTMLElement;
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    const root = createRoot(document.getElementById("root"));
    const changes = [];
    const selected = {
      id: "rug",
      kind: "furnishing",
      size: [2, 0.02, 3],
      placement: { kind: "absolute", at: [1, 2], elevationMeters: 0, rotationYRadians: 0 },
    };
    const definition = {
      label: "Rug",
      category: "Decor",
      defaultSize: [2, 0.02, 3],
      resizePolicy: { kind: "axes", axes: ["width", "height", "depth"] },
    };
    const render = (item) =>
      act(() =>
        root.render(
          createElement(FurnishingProperties, {
            selected: item,
            definition,
            onClose() {},
            onPlacementChange: (_, placement) => changes.push(placement),
            onSizeChange() {},
          }),
        ),
      );
    await render(selected);
    const input = [...document.querySelectorAll("label")]
      .find((l) => l.textContent.startsWith("X"))
      .querySelector("input");
    assert.equal(input.type, "text", "decimal input must preserve comma and incomplete text");
    await act(() => {
      input.value = "0,";
      input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    });
    assert.equal(input.value, "0,");
    assert.equal(changes.length, 0);
    await act(() => {
      input.value = "0,5";
      input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    });
    await act(() => input.dispatchEvent(new dom.window.FocusEvent("focusout", { bubbles: true })));
    assert.equal(changes.at(-1).at[0], 0.5);
    await act(() => {
      input.value = "0";
      input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    });
    await act(() => input.dispatchEvent(new dom.window.FocusEvent("focusout", { bubbles: true })));
    assert.equal(changes.at(-1).at[0], 0);
    const precise = { ...selected, placement: { ...selected.placement, at: [1.123456, 2] } };
    await render(precise);
    const count = changes.length;
    await act(() => input.dispatchEvent(new dom.window.FocusEvent("focusout", { bubbles: true })));
    assert.equal(changes.length, count, "untouched fields must not round stored values");
    await act(() => {
      input.value = "9,";
      input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    });
    await render({ ...precise, id: "another-rug" });
    const nextInput = [...document.querySelectorAll("label")]
      .find((label) => label.textContent.startsWith("X"))
      .querySelector("input");
    assert.equal(
      nextInput.value,
      "1.1235",
      "changing objects discards the previous draft even at the same value",
    );
    await render({
      ...precise,
      id: "another-rug",
      placement: { ...precise.placement, at: [3, 2] },
    });
    assert.equal(nextInput.value, "3", "external edits refresh the displayed value");
    await act(() => root.unmount());
    dom.window.close();
  });
});
