import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { createElement } from "react";
import { create } from "@react-three/test-renderer";
import { OrthographicCamera } from "three";
import { withModules } from "./test-server.mjs";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

await withModules(async (load) => {
  const { wallConnectionMeasurements } = await load(
    "/apps/web/src/editor-preview/construct/wall-connection-measurements.ts",
  );
  const { ConstructionWallMeasurements } = await load(
    "/apps/web/src/editor-preview/construct/ConstructionWallMeasurements.tsx",
  );
  const coordinates = { origin: [0, 0], metersPerPlanUnit: 1, scaleBasis: "measured" };
  const measure = (primary, walls, junctions = [primary.from, primary.to]) =>
    wallConnectionMeasurements({ primary, walls, junctions, coordinates });

  test("drawing measures the new wall and walls joined at either end, once per wall", () => {
    const primary = { from: [4, 0], to: [4, 3] };
    const walls = [
      { id: "before", from: [0, 0], to: [4, 0] },
      { id: "after", from: [4, 3], to: [7, 3] },
      { id: "nearby", from: [4.01, 3], to: [7, 4] },
    ];
    const before = structuredClone(walls);
    const result = measure(primary, walls);
    assert.deepEqual(
      result.lengths.map(({ id }) => id),
      [undefined, "before", "after"],
    );
    assert.deepEqual(
      result.angles.map(({ label }) => label),
      ["90°", "90°"],
    );
    assert.deepEqual(walls, before, "measurement must not mutate persisted geometry");
    const across = measure({ from: [1, 0], to: [3, 0] }, [walls[0]]);
    assert.equal(
      across.lengths.length,
      2,
      "a supporting wall touching both ends is not duplicated",
    );
  });

  test("a wall-surface join shows both actual angles without measuring unrelated sectors", () => {
    const result = measure({ from: [3, 0], to: [4, 2] }, [
      { id: "base", from: [0, 0], to: [6, 0] },
    ]);
    assert.equal(result.lengths.length, 2);
    assert.deepEqual(result.angles.map(({ label }) => label).sort(), ["116.6°", "63.4°"]);
    assert.ok(Math.abs(result.angles.reduce((sum, angle) => sum + angle.degrees, 0) - 180) < 1e-10);
    assert.ok(result.angles.every(({ wallKeys }) => wallKeys.includes("primary")));
  });

  test("shared corners include every connected wall and adjacent angle, regardless of endpoint order", () => {
    const primary = { id: "east", from: [3, 0], to: [0, 0] };
    const walls = [
      primary,
      { id: "north", from: [0, 0], to: [0, 2] },
      { id: "west", from: [-4, 0], to: [0, 0] },
      { id: "coincident", from: [1, 0], to: [0, 0] },
    ];
    const result = measure(primary, walls, [
      [0, 0],
      [0, 0],
    ]);
    assert.equal(result.lengths.length, 4);
    assert.deepEqual(
      result.angles.map(({ label }) => label),
      ["90°", "90°", "180°"],
    );
    assert.ok(result.angles.every(({ degrees }) => degrees > 0 && degrees <= 180));
    const straight = measure(primary, [primary, walls[2]], [[0, 0]]);
    assert.deepEqual(
      straight.angles.map(({ label }) => label),
      ["180°"],
    );
  });

  test("angles take the smaller sector across wraparound and retain free-angle precision", () => {
    const endAt = (degrees) => [
      Math.cos((degrees * Math.PI) / 180) * 4,
      Math.sin((degrees * Math.PI) / 180) * 4,
    ];
    const primary = { from: [0, 0], to: endAt(10) };
    const walls = [{ id: "before", from: endAt(345), to: [0, 0] }];
    const result = measure(primary, walls);
    assert.equal(result.angles[0].label, "25°");
    assert.ok(Math.abs(result.angles[0].degrees - 25) < 1e-10);
    const free = measure({ from: [0, 0], to: [2, 0.8] }, [
      { id: "base", from: [0, 0], to: [4, 0] },
    ]);
    assert.equal(free.angles[0].label, "21.8°");
  });

  test("scaled off-grid coordinates preserve angles, and zero-length branches never make invalid angles", () => {
    const scaled = { origin: [10, -2], metersPerPlanUnit: 0.5, scaleBasis: "measured" };
    const primary = { from: [10.03, -2.07], to: [12.03, -0.07] };
    const walls = [
      { id: "base", from: [6.03, -2.07], to: primary.from },
      { id: "zero", from: primary.from, to: primary.from },
    ];
    const result = wallConnectionMeasurements({
      primary,
      walls,
      junctions: [primary.from],
      coordinates: scaled,
    });
    assert.equal(result.angles[0].label, "135°");
    assert.equal(result.lengths.length, 2);
    const zero = measure({ from: [0, 0], to: [0, 0] }, [{ id: "base", from: [0, 0], to: [4, 0] }]);
    assert.equal(zero.lengths.length, 1);
    assert.deepEqual(zero.angles, []);
    const collapsed = { id: "collapsed", from: [0, 0], to: [0, 0] };
    const resized = measure(
      collapsed,
      [collapsed, { id: "other", from: [0, 0], to: [4, 0] }],
      [[0, 0]],
    );
    assert.equal(
      resized.lengths.length,
      2,
      "a collapsed primary must not hide a valid connected wall's length",
    );
    assert.deepEqual(resized.angles, []);
  });

  test("renders both metre lengths and a non-interactive angle arc with zoom-independent size", async () => {
    const camera = new OrthographicCamera(-500, 500, 400, -400, 0.1, 100);
    camera.zoom = 100;
    const scaled = { ...coordinates, origin: [10, -2], metersPerPlanUnit: 0.5 };
    const primary = { from: [14, -2], to: [14, 1] };
    const props = {
      primary,
      walls: [{ id: "base", from: [10, -2], to: [14, -2] }],
      junctions: [primary.from, primary.to],
      coordinates: scaled,
      planMode: true,
      defaultThicknessMeters: 0.12,
    };
    const renderer = await create(createElement(ConstructionWallMeasurements, props), {
      camera,
      width: 1000,
      height: 800,
    });
    try {
      assert.equal(
        renderer.scene.findByProps({ name: "construction-wall-guide" }).props.userData.label,
        "1.50 m",
      );
      assert.equal(
        renderer.scene.findByProps({ name: "construction-wall-guide-base" }).props.userData.label,
        "2.00 m",
      );
      const angle = renderer.scene.findByProps({ name: "construction-angle-guide" });
      assert.equal(angle.props.userData.label, "90°");
      assert.deepEqual(angle.props.position, [2, 0.24, 0]);
      const scaledArc = renderer.scene.findByProps({ name: "construction-angle-screen-scale" });
      assert.equal(scaledArc.children[0].props.raycast(), undefined);
      for (const zoom of [25, 100, 200]) {
        camera.zoom = zoom;
        camera.updateProjectionMatrix();
        await renderer.advanceFrames(1, 0.016);
        assert.ok(Math.abs(scaledArc.instance.scale.x * zoom - 1) < 1e-10);
      }
      await renderer.update(
        createElement(ConstructionWallMeasurements, {
          ...props,
          primary: { ...primary, to: primary.from },
        }),
      );
      assert.equal(
        renderer.scene.findByProps({ name: "construction-wall-guide" }).props.userData.labelVisible,
        false,
      );
      assert.equal(
        renderer.scene.findAllByProps({ name: "construction-wall-guide-base" }).length,
        0,
      );
      assert.equal(renderer.scene.findAllByProps({ name: "construction-angle-guide" }).length, 0);
    } finally {
      await renderer.unmount();
    }
  });

  test("all live measurement HTML containers let drawing pointers pass through", async () => {
    const dom = new JSDOM("<!doctype html><body></body>");
    const previous = {
      window: globalThis.window,
      document: globalThis.document,
      HTMLCanvasElement: globalThis.HTMLCanvasElement,
    };
    Object.assign(globalThis, {
      window: dom.window,
      document: dom.window.document,
      HTMLCanvasElement: dom.window.HTMLCanvasElement,
    });
    let renderer;
    try {
      renderer = await create(
        createElement(ConstructionWallMeasurements, {
          primary: { from: [2, 0], to: [2, 2] },
          walls: [{ id: "base", from: [0, 0], to: [2, 0] }],
          junctions: [[2, 0]],
          coordinates,
          planMode: true,
          defaultThicknessMeters: 0.12,
        }),
        { beforeReturn: (canvas) => dom.window.document.body.appendChild(canvas) },
      );
      const labels = dom.window.document.querySelectorAll(
        '[aria-label="Wall length"], [aria-label="Wall angle"]',
      );
      assert.equal(labels.length, 3);
      for (const label of labels) {
        const centeredContainer = label.parentElement.parentElement;
        assert.equal(
          dom.window.getComputedStyle(centeredContainer).pointerEvents,
          "none",
          label.getAttribute("aria-label"),
        );
        assert.equal(dom.window.getComputedStyle(label).pointerEvents, "none");
      }
    } finally {
      await renderer?.unmount();
      dom.window.close();
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete globalThis[key];
        else globalThis[key] = value;
      }
    }
  });
});
