import assert from "node:assert/strict";
import test from "node:test";
import { scopePanelCss } from "../scripts/panel-build-tools.mjs";

test("panel CSS stays inside its host, sizes against the panel, and separates font faces", () => {
  const { css, fonts } = scopePanelCss(`
    @font-face { font-family: Fixture; src: url(./assets/fixture.woff2); }
    :root { color: red; } html, body, #root { height: 100dvh; }
    .modal { max-width: calc(100vw - 20px); height: 40vh; }
    @media (max-width: 600px) { .modal { width: 100vw; } }
    .brand { background: url(/cabane-icon.png); }
  `);
  assert.match(css, /:host\s*\{/);
  assert.doesNotMatch(css, /@font-face|\bhtml\b|\bbody\b|100dvh|100vw|40vh/);
  assert.match(css, /var\(--cabane-panel-height\)/);
  assert.match(css, /var\(--cabane-panel-width\)/);
  assert.match(css, /@container cabane \(max-width: 600px\)/);
  assert.match(css, /url\(\.\/cabane-icon.png\)/);
  assert.match(fonts, /@font-face/);
  assert.match(fonts, /\.\/assets\/fixture.woff2/);
  assert.doesNotMatch(fonts, /\.modal/);
});


test("compound panel breakpoints separate container dimensions from input capabilities", () => {
  const { css } = scopePanelCss(`
    @media (max-width:760px) and (orientation:portrait) { .a { color:red } }
    @media (pointer:coarse) and (min-width:1241px) and (min-height:501px) { .b { color:red } }
    @media (max-width:699px), (hover:none) and (pointer:coarse) { .c { color:red } }
    @media (prefers-reduced-motion:reduce) { .d { color:red } }
  `);
  assert.match(css, /@container cabane \(max-width:760px\) and \(orientation:portrait\)/);
  assert.match(css, /@media \(pointer:coarse\)\s*\{\s*@container cabane \(min-width:1241px\) and \(min-height:501px\)/);
  assert.match(css, /@container cabane \(max-width:699px\)/);
  assert.match(css, /@media \(hover:none\) and \(pointer:coarse\)/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
});
