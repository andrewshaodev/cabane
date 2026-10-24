import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const project = JSON.parse(await readFile("home/showcase/furnished.project.json", "utf8"));

test("showcase pictures attach to solid wall faces and exhibit every landscape", () => {
  const pictures = project.sceneItems.filter((item) => item.modelId === "framed-wall-art");
  assert.equal(pictures.length, 6);
  for (const picture of pictures) {
    const placement = picture.placement;
    assert.equal(placement.kind, "wall", picture.id);
    assert.ok(placement.depthOffsetMeters >= 0 && placement.depthOffsetMeters <= 0.002);
    const floor = project.floors.find((floor) => floor.id === picture.floorId);
    const wall = floor.walls.find((wall) => wall.id === placement.wallId);
    assert.ok(wall, picture.id);
    const left = placement.offsetFromWallStartPlanUnits - picture.size[0] / 2;
    const right = left + picture.size[0];
    assert.ok(
      left >= 0 && right <= Math.hypot(wall.to[0] - wall.from[0], wall.to[1] - wall.from[1]),
    );
    for (const opening of floor.openings.filter((opening) => opening.wallId === wall.id)) {
      const overlapsWidth =
        left < opening.offsetFromWallStartPlanUnits + opening.widthPlanUnits &&
        right > opening.offsetFromWallStartPlanUnits;
      const overlapsHeight =
        placement.elevationMeters < opening.sillHeightMeters + opening.openingHeightMeters &&
        placement.elevationMeters + picture.size[1] > opening.sillHeightMeters;
      assert.ok(!(overlapsWidth && overlapsHeight), `${picture.id} covers ${opening.id}`);
    }
  }
  for (const variant of ["atlantic-village", "riviera-cliffs", "breton-harbor", "provence-village"])
    assert.ok(
      pictures.some((picture) => picture.variant === variant),
      variant,
    );
});

test("all five showcase bed headboards sit within 2 cm of their bedroom wall", () => {
  const beds = project.sceneItems.filter((item) =>
    ["single-bed", "double-bed"].includes(item.modelId),
  );
  assert.equal(beds.length, 5);
  for (const bed of beds) {
    const floor = project.floors.find((floor) => floor.id === bed.floorId);
    const [x, z] = bed.placement.at;
    assert.equal(bed.placement.rotationYRadians, 0);
    const wall = floor.walls
      .filter(
        (wall) =>
          wall.from[1] === wall.to[1] &&
          wall.from[1] < z &&
          x >= Math.min(wall.from[0], wall.to[0]) &&
          x <= Math.max(wall.from[0], wall.to[0]),
      )
      .sort((a, b) => b.from[1] - a.from[1])[0];
    const clearance = z - bed.size[2] / 2 - wall.from[1] - wall.thicknessMeters / 2;
    assert.ok(clearance >= 0 && clearance <= 0.020001, `${bed.id}: ${clearance} m`);
  }
});
