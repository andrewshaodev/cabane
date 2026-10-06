import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { create } from "@react-three/test-renderer";
import { withModules } from "./test-server.mjs";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

await withModules(async (load) => {
  const {
    constructMeasurementForState,
    constructMeasurementIsVisible,
    constructMeasureGuidePoints,
    constructMeasurePhase,
    constructMeasureReducer,
    createConstructMeasureState,
    formatConstructDistance,
    measureConstructPoints,
  } = await load("/apps/web/src/editor-preview/construct/measure-geometry.ts");
  const { ConstructionMeasureOverlay } = await load(
    "/apps/web/src/editor-preview/construct/ConstructionMeasureOverlay.tsx",
  );

  const coordinates = {
    origin: [10, -2],
    metersPerPlanUnit: 0.5,
    scaleBasis: "measured",
  };

  test("measures plan and metre distance through the floor coordinate transform", () => {
    const measurement = measureConstructPoints([10, -2], [13, 2], coordinates);

    assert.deepEqual(measurement.deltaPlanUnits, [3, 4]);
    assert.equal(measurement.distancePlanUnits, 5);
    assert.equal(measurement.distanceMeters, 2.5);
    assert.equal(measurement.label, "5.00 plan units · 2.50 m");
    assert.equal(measurement.copyText, measurement.label);
    assert.deepEqual(measurement.world.from, [0, 0]);
    assert.deepEqual(measurement.world.to, [1.5, 2]);
    assert.deepEqual(measurement.world.center, [0.75, 1]);
    assert.equal(measurement.world.lengthMeters, 2.5);
    assert.ok(Math.abs(measurement.world.rotationYRadians + Math.atan2(2, 1.5)) < 1e-12);
    assert.equal(constructMeasurementIsVisible(measurement), true);
  });

  test("uses locale-independent fixed precision for stable labels", () => {
    assert.equal(formatConstructDistance(1.2), "1.20");
    assert.equal(formatConstructDistance(1.005), "1.00");
    assert.equal(formatConstructDistance(-0.0001), "0.00");
  });

  test("keeps preview and completed measurements in transient standalone state", () => {
    let state = createConstructMeasureState();
    assert.equal(constructMeasurePhase(state), "idle");
    assert.equal(constructMeasurementForState(state, coordinates), null);

    state = constructMeasureReducer(state, { type: "place", point: [10, -2] });
    assert.equal(constructMeasurePhase(state), "drawing");
    assert.equal(constructMeasureGuidePoints(state), null);

    state = constructMeasureReducer(state, { type: "preview", point: [11, 0] });
    assert.deepEqual(constructMeasureGuidePoints(state), [
      [10, -2],
      [11, 0],
    ]);
    assert.equal(
      constructMeasurementForState(state, coordinates).label,
      "2.24 plan units · 1.12 m",
    );

    state = constructMeasureReducer(state, { type: "place", point: [13, 2] });
    assert.equal(constructMeasurePhase(state), "complete");
    assert.deepEqual(constructMeasureGuidePoints(state), [
      [10, -2],
      [13, 2],
    ]);
    const completed = state;
    assert.equal(
      constructMeasureReducer(state, { type: "preview", point: [99, 99] }),
      completed,
      "pointer movement cannot alter a completed measurement",
    );

    state = constructMeasureReducer(state, { type: "cancel" });
    assert.deepEqual(state, createConstructMeasureState());
    state = constructMeasureReducer(state, { type: "place", point: [1, 1] });
    state = constructMeasureReducer(state, { type: "reset" });
    assert.deepEqual(state, createConstructMeasureState());
  });

  test("starts a fresh transient measurement after a completed one", () => {
    let state = createConstructMeasureState();
    state = constructMeasureReducer(state, { type: "place", point: [0, 0] });
    state = constructMeasureReducer(state, { type: "place", point: [2, 0] });
    state = constructMeasureReducer(state, { type: "place", point: [4, 4] });

    assert.equal(constructMeasurePhase(state), "drawing");
    assert.deepEqual(state, { start: [4, 4], preview: null, end: null });
  });

  test("renders a visible controlled guide without owning project state", async () => {
    const measurement = measureConstructPoints([10, -2], [13, 2], coordinates);
    const renderer = await create(
      createElement(ConstructionMeasureOverlay, {
        measurement,
        preview: true,
        showLabel: false,
      }),
    );

    try {
      const guide = renderer.scene.findByProps({ name: "construction-measure-guide" });
      assert.equal(guide.props.userData.distancePlanUnits, 5);
      assert.equal(guide.props.userData.distanceMeters, 2.5);
      assert.equal(guide.props.userData.preview, true);
      assert.ok(renderer.scene.findByProps({ name: "construction-measure-guide-line" }));
    } finally {
      await renderer.unmount();
    }
  });
});
