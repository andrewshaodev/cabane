import assert from "node:assert/strict";
import test from "node:test";
import { ESLint, Linter } from "eslint";
import panelDom from "../scripts/eslint-panel-dom.mjs";

test("panel lint rejects global focus and input access, including computed properties", () => {
  const linter = new Linter();
  const config = { plugins: { cabane: panelDom }, rules: { "cabane/panel-dom": "error" } };
  for (const code of [
    "document.activeElement",
    "document['activeElement']",
    "window.document.activeElement",
    "globalThis.document.activeElement",
    "document.addEventListener('pointerdown', handler)",
    "document['removeEventListener']('keydown', handler)",
    "window.addEventListener('keydown', handler)",
    "globalThis.window.removeEventListener('click', handler)",
    "document.addEventListener(eventName, handler)",
    "const listen = document.addEventListener",
  ]) {
    const messages = linter.verify(code, config);
    assert.equal(messages.length, 1, code);
    assert.equal(messages[0].ruleId, "cabane/panel-dom", code);
  }
  for (const code of [
    "dom.root.activeElement",
    "dom.events.addEventListener('pointerdown', handler)",
    "element.addEventListener('click', handler)",
    "document.addEventListener('pointerlockchange', handler)",
    "document.removeEventListener('visibilitychange', handler)",
    "window.addEventListener('resize', handler)",
    "window.addEventListener('blur', handler)",
    "function read(document) { return document.activeElement; }",
  ])
    assert.deepEqual(linter.verify(code, config), [], code);
});

test("repository lint enables the panel guard in shared UI and exempts host bootstrap", async () => {
  const eslint = new ESLint();
  for (const path of [
    "apps/web/src/editor-floors/ConstructFloorControls.tsx",
    "packages/engine/src/building/FloorPicker.tsx",
  ]) {
    const config = await eslint.calculateConfigForFile(path);
    assert.equal(config.rules["cabane/panel-dom"][0], 2, path);
  }
  const bootstrap = await eslint.calculateConfigForFile("apps/web/src/main.tsx");
  assert.equal(bootstrap.rules["cabane/panel-dom"], undefined);
});
