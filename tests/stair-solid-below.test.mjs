import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { create } from "@react-three/test-renderer";
import { withModules } from "./test-server.mjs";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async (load) => {
  const { StairTreads } = await load("/packages/engine/src/stairs/models/StairTreads.tsx");
  const { deriveStairFlight } = await load("/packages/engine/src/stairs/flight-geometry.ts");
  const { validateStairs } = await load("/packages/engine/src/stairs/stair-validation.ts");
  const { makeStairProject } = await load("/tests/fixtures/multiple-floors.ts");

  const opens = async () => {
    const project = makeStairProject();
    const flight = deriveStairFlight(project, project.stairs[0]);
    const renderer = await create(createElement(StairTreads, { flight }));
    try {
      return { flight, meshes: renderer.scene.findAllByType("Mesh").length };
    } finally {
      await renderer.unmount();
    }
  };
  const vertices = async (solidBelowRunMeters) => {
    const project = makeStairProject();
    const flight = deriveStairFlight(project, {
      ...project.stairs[0],
      ...(solidBelowRunMeters === undefined ? {} : { solidBelowRunMeters }),
    });
    const renderer = await create(createElement(StairTreads, { flight }));
    try {
      const position = renderer.scene.findByType("Mesh").instance.geometry.getAttribute("position");
      return {
        flight,
        points: Array.from({ length: position.count }, (_, index) => [
          position.getX(index),
          position.getY(index),
        ]),
      };
    } finally {
      await renderer.unmount();
    }
  };
  const hasPoint = (points, x, y) =>
    points.some(([px, py]) => Math.abs(px - x) < 1e-6 && Math.abs(py - y) < 1e-6);

  test("a straight stair is filled to the floor only under its first part", async () => {
    const open = await opens();
    const { runMeters, riseMeters } = open.flight;
    assert.equal(
      open.meshes,
      open.flight.stepCount,
      "without a fill the treads stay separate slabs",
    );

    const partial = await vertices(1.5);
    const soffitAtEnd = riseMeters - 0.2;
    assert.ok(hasPoint(partial.points, 1.5, 0), "the fill reaches the floor at its end");
    assert.ok(
      hasPoint(partial.points, 1.5, (soffitAtEnd / runMeters) * 1.5),
      "the open underside resumes at its end",
    );
    assert.ok(
      hasPoint(partial.points, runMeters, soffitAtEnd),
      "the far end keeps its open underside",
    );
    assert.equal(hasPoint(partial.points, runMeters, 0), false);

    const full = await vertices(runMeters);
    assert.ok(
      hasPoint(full.points, runMeters, 0),
      "filling the whole run reaches the floor at the top",
    );
  });

  test("the fill length must be positive and fit within the run", () => {
    const codes = (solidBelowRunMeters) => {
      const project = makeStairProject();
      project.stairs[0] = { ...project.stairs[0], solidBelowRunMeters };
      return validateStairs(project).map((issue) => issue.code);
    };
    assert.equal(codes(1.5).includes("stair.solid-below"), false);
    assert.equal(codes(4).includes("stair.solid-below"), false);
    for (const bad of [0, -1, 4.5, Number.NaN]) assert.ok(codes(bad).includes("stair.solid-below"));
  });
});
