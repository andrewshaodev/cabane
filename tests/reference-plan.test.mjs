import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const math = await load("/apps/web/src/editor-reference-plan/reference-plan.ts");
  const decoding = await load("/apps/web/src/editor-reference-plan/decode-reference-image.ts");
  const history = await load("/apps/web/src/editor-reference-plan/reference-history.ts");
  const plan = {
    assetId: "image-a",
    name: "floor.svg",
    pixelWidth: 800,
    pixelHeight: 600,
    center: [12, -3],
    width: 8,
    angle: 37,
  };
  const near = (a, b) =>
    a.forEach((value, index) => assert.ok(Math.abs(value - b[index]) < 1e-8, `${a} != ${b}`));
  test("image coordinates round-trip at arbitrary rotation and translated origin", () => {
    for (const point of [
      [0, 0],
      [1, 1],
      [0.3, 0.7],
    ])
      near(math.worldPointToImage(plan, math.imagePointToWorld(plan, point)), point);
  });
  test("calibration preserves rotation and the first anchor at a known real distance", () => {
    const first = [0.1, 0.2],
      second = [0.8, 0.7];
    const next = math.calibrateReference(plan, first, second, 4.2);
    near(math.imagePointToWorld(plan, first), math.imagePointToWorld(next, first));
    const a = math.imagePointToWorld(next, first),
      b = math.imagePointToWorld(next, second);
    assert.ok(Math.abs(Math.hypot(b[0] - a[0], b[1] - a[1]) - 4.2) < 1e-8);
    assert.equal(next.angle, plan.angle);
    assert.throws(() => math.calibrateReference(plan, first, first, 4), /different points/);
    for (const distance of [0, -2, NaN, Infinity])
      assert.throws(
        () => math.calibrateReference(plan, first, second, distance),
        /greater than zero/,
      );
  });
  test("each resize corner preserves aspect ratio and its opposite anchor", () => {
    for (const corner of [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]) {
      const opposite = [1 - corner[0], 1 - corner[1]],
        anchor = math.imagePointToWorld(plan, opposite),
        moving = math.imagePointToWorld(plan, corner);
      const next = math.resizeReference(plan, corner, [
        anchor[0] + (moving[0] - anchor[0]) * 2,
        anchor[1] + (moving[1] - anchor[1]) * 2,
      ]);
      near(math.imagePointToWorld(next, opposite), anchor);
      assert.ok(Math.abs(next.width - 16) < 1e-8);
      assert.ok(Math.abs(math.referenceHeight(next) - next.width * 0.75) < 1e-8);
    }
  });
  test("SVG parsing allows local vector references and rejects executable or external content", () => {
    const previous = globalThis.DOMParser;
    globalThis.DOMParser = new JSDOM().window.DOMParser;
    try {
      decoding.validateReferenceSvg(
        '<svg xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="a" /></defs><path fill="url(#a)" d="M0 0h20"/></svg>',
      );
      for (const content of [
        "<script>alert(1)</script>",
        "<foreignObject/>",
        '<image href="data:image/png;base64,abc"/>',
        '<use href="https://example.com/a.svg#x"/>',
        '<path onclick="alert(1)"/>',
        '<style>@import "https://example.com";</style>',
        '<path fill="url(https://example.com/x)"/>',
        '<animate attributeName="href"/>',
        '<path fill="u&#114;l(https://example.com/x)"/>',
      ]) {
        assert.throws(
          () =>
            decoding.validateReferenceSvg(
              `<svg xmlns="http://www.w3.org/2000/svg">${content}</svg>`,
            ),
          /unsupported|external|embedded|active|scripts/,
        );
      }
      assert.throws(() => decoding.validateReferenceSvg("<!DOCTYPE svg><svg/>"), /declarations/);
      assert.throws(() => decoding.validateReferenceSvg("<not-svg/>"), /could not be read/);
    } finally {
      globalThis.DOMParser = previous;
    }
  });
  test("decoded dimensions enforce the 32-megapixel boundary", () => {
    decoding.validateReferenceDimensions(8000, 4000);
    for (const [width, height] of [
      [8001, 4000],
      [0, 4],
      [Infinity, 2],
      [NaN, 1],
    ])
      assert.throws(() => decoding.validateReferenceDimensions(width, height), /32 megapixels/);
  });
  test("one history interleaves architecture and local references without marking reference changes as architecture", () => {
    const initial = {
      project: { floors: [{ id: "ground" }], home: { name: "Home" } },
      bindings: {},
      references: {},
    };
    let state = history.createWorkspaceHistory(initial);
    const uploaded = { ...state.present, references: { ground: plan } };
    assert.equal(history.architectureChanged(state.present, uploaded), false);
    state = history.commitWorkspaceSnapshot(state, uploaded);
    const geometry = {
      ...state.present,
      project: { ...initial.project, home: { name: "Changed" } },
    };
    state = history.commitWorkspaceSnapshot(state, geometry);
    state = history.commitWorkspaceSnapshot(state, {
      ...geometry,
      references: { ground: { ...plan, width: 12 } },
    });
    state = history.undoWorkspaceHistory(state);
    assert.equal(state.present.references.ground.width, 8);
    state = history.undoWorkspaceHistory(state);
    assert.equal(state.present.project.home.name, "Home");
    state = history.undoWorkspaceHistory(state);
    assert.deepEqual(state.present.references, {});
    state = history.redoWorkspaceHistory(state);
    assert.deepEqual(state.present.references.ground, plan);
    assert.equal("references" in state.present.project, false);
  });
});
