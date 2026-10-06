import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { withModules } from "./test-server.mjs";

await withModules(async load => {
  const { CabaneDomProvider } = await load("/packages/engine/src/CabaneDom.tsx");
  const { useDesktopWalkInput } = await load("/packages/engine/src/desktop-walk-input.ts");
  const { FloorPicker } = await load("/packages/engine/src/building/FloorPicker.tsx");
  const { EditorActionButton } = await load("/apps/web/src/editor-chrome/EditorActionButton.tsx");
  const { CameraViewer } = await load("/packages/engine/src/CameraViewer.tsx");
  const { makeVideo, closeVideo } = await load("/packages/engine/src/camera-sessions/camera-video-lifecycle.ts");
  async function fixture(run) {
    const browser = new JSDOM('<body style="overflow:scroll"><button id="host">Host</button><dialog open>Host dialog</dialog><div id="panel"></div></body>', { url: "http://ha.local/" });
    const names = ["window", "document", "HTMLElement", "IS_REACT_ACT_ENVIRONMENT"];
    const previous = Object.fromEntries(names.map(name => [name, globalThis[name]]));
    Object.assign(globalThis, { window: browser.window, document: browser.window.document, HTMLElement: browser.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true });
    const shadow = document.querySelector("#panel").attachShadow({ mode: "open" });
    const container = document.createElement("div"), portals = document.createElement("div");
    shadow.append(container, portals);
    const root = createRoot(container);
    const environment = { root: shadow, container, portalContainer: portals, eventTarget: shadow };
    const render = async child => act(async () => root.render(h(CabaneDomProvider, { environment }, child)));
    try { await run({ browser, shadow, container, portals, render }); }
    finally { await act(async () => root.unmount()); browser.window.close(); Object.assign(globalThis, previous); }
  }
  test("panel keyboard shortcuts ignore host events and host dialogs while respecting local inputs", async () => fixture(async ({ browser, shadow, render }) => {
    const selected = [];
    await render(h(FloorPicker, { floors: [{ id: "g", name: "Ground" }, { id: "u", name: "Upper" }], selectedId: "g", onSelect: id => selected.push(id) }));
    const key = target => target.dispatchEvent(new browser.window.KeyboardEvent("keydown", { key: "PageUp", bubbles: true, composed: true, cancelable: true }));
    await act(async () => key(document.querySelector("#host")));
    assert.deepEqual(selected, []);
    await act(async () => key(shadow.querySelector("button")));
    assert.deepEqual(selected, ["u"]);
    const input = document.createElement("input"); shadow.append(input);
    await act(async () => key(input));
    assert.deepEqual(selected, ["u"]);
  }));
  test("walk input resets when focus leaves the panel and ignores host typing", async () => fixture(async ({ browser, shadow, render }) => {
    const movement = { current: { x: 0, y: 0 } }, sprint = { current: false };
    function WalkInput() { useDesktopWalkInput(true, movement, sprint); return h("button", null, "Walk"); }
    await render(h(WalkInput));
    const button = shadow.querySelector("button");
    await act(async () => { button.focus(); button.dispatchEvent(new browser.window.KeyboardEvent("keydown", { code: "KeyW", bubbles: true, composed: true })); });
    assert.equal(movement.current.y, -1);
    await act(async () => document.querySelector("#host").focus());
    assert.deepEqual(movement.current, { x: 0, y: 0 });
    await act(async () => document.querySelector("#host").dispatchEvent(new browser.window.KeyboardEvent("keydown", { code: "KeyW", bubbles: true, composed: true })));
    assert.deepEqual(movement.current, { x: 0, y: 0 });
  }));
  test("editor tooltip stays inside the shadow portal and accounts for panel offsets", async () => fixture(async ({ shadow, portals, render }) => {
    portals.getBoundingClientRect = () => ({ left: 240, top: 112, width: 800, height: 700 });
    await render(h(EditorActionButton, { icon: "undo", label: "Undo", onClick() {} }));
    const button = shadow.querySelector("button");
    button.getBoundingClientRect = () => ({ left: 540, top: 212, width: 40, height: 40, bottom: 252 });
    await act(async () => button.focus());
    const tooltip = portals.querySelector('[role="tooltip"]');
    assert.ok(tooltip);
    assert.equal(document.querySelector('[role="tooltip"]'), null);
    assert.equal(tooltip.style.left, "320px");
    assert.equal(tooltip.style.top, "149px");
    assert.equal(shadow.activeElement, button);
  }));
  test("camera viewer keeps focus, overflow and parked video inside its panel", async () => fixture(async ({ browser, shadow, container, render }) => {
    const opener = document.createElement("button"); shadow.append(opener); opener.focus();
    const video = makeVideo(true, container);
    video.play = async () => {}; video.pause = () => {}; video.load = () => {};
    assert.equal(video.parentElement, container);
    let closes = 0;
    await render(h(CameraViewer, { roomName: "Room", deviceName: "Camera", onClose: () => closes++, media: { kind: "camera-stream", video, state: "playing", transport: "hls", previewState: "live", posterUrl: null, error: null } }));
    assert.equal(document.body.style.overflow, "scroll");
    assert.equal(container.style.overflow, "hidden");
    assert.equal(shadow.activeElement, shadow.querySelector("[data-camera-close]"));
    await act(async () => document.querySelector("#host").dispatchEvent(new browser.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, composed: true })));
    assert.equal(closes, 0);
    await act(async () => shadow.activeElement.dispatchEvent(new browser.window.KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, composed: true, cancelable: true })));
    const buttons = shadow.querySelectorAll(".camera-viewer button");
    assert.equal(shadow.activeElement, buttons[buttons.length - 1]);
    await render(null);
    assert.equal(shadow.activeElement, opener);
    assert.equal(video.parentElement, container);
    assert.equal(container.style.overflow, "");
    closeVideo(video);
    assert.equal(video.isConnected, false);
  }));
});
