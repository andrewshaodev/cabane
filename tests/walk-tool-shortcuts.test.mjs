import assert from "node:assert/strict";
import test from "node:test";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { withModules } from "./test-server.mjs";

await withModules(async load => {
  const { SceneActionBar } = await load('/packages/engine/src/SceneActionBar.tsx');
  const { ActionBarEditor } = await load('/apps/web/src/editor-action-bar/ActionBarEditor.tsx');
  const { createEmptyHomeProject } = await load('/packages/engine/src/home-project/empty-project.ts');
  const tool = { id: 'test.tool', label: 'Test tool', shortcutKey: 'G', Icon: () => null, Scene: () => null };
  const item = { id: 'slot', target: { kind: 'walk-tool', toolId: tool.id } };
  async function withDom(run) {
    const dom = new JSDOM('<div id="root"></div><input aria-label="Text field">');
    const keys = ['window','document','HTMLElement','IS_REACT_ACT_ENVIRONMENT'];
    const saved = Object.fromEntries(keys.map(key => [key, globalThis[key]]));
    Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true });
    const root = createRoot(document.getElementById('root'));
    try { await run(root, dom); } finally { await act(async () => root.unmount()); Object.assign(globalThis, saved); dom.window.close(); }
  }
  test('installed tool toggles from its slot or key only while walking; missing tools remain inert', async () => withDom(async (root, dom) => {
    const calls = [];
    const props = { items: [item], walkTools: [tool], mode: 'overview', lighting: 'day', wallFade: false,
      allLightsEnabled: false, allLightsBusy: false, onAction: item => calls.push(item) };
    const render = overrides => act(async () => root.render(React.createElement(SceneActionBar, { ...props, ...overrides })));
    const key = (target = window, repeat = false) => act(async () => target.dispatchEvent(new dom.window.KeyboardEvent('keydown', {key:'g',code:'KeyG',repeat,bubbles:true,cancelable:true})));
    await render({});
    assert.equal(document.querySelector('[aria-label="Equip Test tool"]').disabled, true);
    await key(); assert.equal(calls.length, 0);
    await render({mode:'walk'});
    await key(); assert.deepEqual(calls, [item]);
    await key(window, true); await key(document.querySelector('input')); assert.equal(calls.length, 1);
    await render({mode:'walk',activeWalkToolId:tool.id});
    assert.equal(document.querySelector('[aria-label="Unequip Test tool"]').getAttribute('aria-pressed'), 'true');
    await act(async () => document.querySelector('[aria-label="Unequip Test tool"]').click());
    assert.equal(calls.length, 2);
    await render({mode:'walk',keyboardEnabled:false}); await key(); assert.equal(calls.length, 2);
    await render({mode:'walk',walkTools:[]}); await key();
    assert.equal(document.querySelector('[aria-label="Unavailable tool"]').disabled, true);
    assert.equal(calls.length, 2);
    await act(async () => root.unmount());
    await key(); assert.equal(calls.length, 2);
  }));
  test('shortcut picker adds the host-installed tool without adding it to defaults', async () => withDom(async root => {
    const changes = [];
    const props = { project:createEmptyHomeProject('test','Test'), deviceModels:{}, roomPictures:{}, walkTools:[tool],
      disabled:false, canUndo:false, canRedo:false, onUndo(){}, onRedo(){}, onChange:items => changes.push(items) };
    await act(async () => root.render(React.createElement(ActionBarEditor, props)));
    assert.equal(document.querySelector('[aria-label="Edit Test tool shortcut"]'), null);
    await act(async () => document.querySelector('[aria-label="Add shortcut"]').click());
    await act(async () => [...document.querySelectorAll('button')].find(button => button.textContent === 'Add action').click());
    await act(async () => document.querySelector('[aria-label="Test tool"]').click());
    assert.deepEqual(changes.at(-1).at(-1).target, item.target);
  }));
});
