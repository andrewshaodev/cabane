import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { create } from "@react-three/test-renderer";
import { Box3, Raycaster, Vector3 } from "three";
import { withModules } from "./test-server.mjs";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async (load) => {
  const { stableFurnishingRegistry: models } = await load(
    "/packages/catalog/src/furnishing/index.ts",
  );
  test("silver towel ring keeps the same wall mount with a configurable finish", async () => {
    const ring = models["round-towel-ring"];
    const renderer = await create(
      createElement(ring.component, { size: ring.defaultSize, variant: "silver" }),
    );
    for (const name of ["towel-ring-wall-plate", "towel-ring-standoff", "towel-ring-loop"])
      assert.equal(
        renderer.scene.instance.getObjectByName(name).material.color.getHexString(),
        "aeb6b9",
      );
    await renderer.unmount();
  });
  test("cistern tile finishes preserve the envelope and meet their supporting enclosure", async () => {
    const def = models["tiled-cistern-enclosure"];
    for (const size of [def.defaultSize, [0.85, 1.2, 0.2]]) {
      const counts = [];
      for (const variant of ["default", "vertical"]) {
        const renderer = await create(createElement(def.component, { size, variant }));
        const scene = renderer.scene.instance;
        scene.updateMatrixWorld(true);
        const body = new Box3().setFromObject(scene.getObjectByName("cistern-enclosure-body"));
        const backing = new Box3().setFromObject(scene.getObjectByName("tile-grout-backing"));
        const bounds = new Box3().setFromObject(scene);
        assert.ok(Math.abs(body.max.z - backing.min.z) < 0.00001);
        assert.ok(Math.abs(bounds.min.z) < 0.00001);
        assert.ok(Math.abs(bounds.max.z - size[2]) < 0.00001);
        assert.ok(Math.abs(bounds.max.y - size[1]) < 0.00001);
        assert.ok(Math.abs(bounds.max.x - bounds.min.x - size[0]) < 0.00001);
        counts.push(
          scene.getObjectByName("white-vertical-tiles").geometry.attributes.position.count,
        );
        await renderer.unmount();
      }
      assert.ok(
        counts[1] > counts[0] * 10,
        "white finish has small vertical tiles rather than large grey courses",
      );
    }
  });
  test("grey stone cladding keeps 60 cm courses and crops edge tiles rather than stretching them", async () => {
    const renderer = await create(
      createElement(models["vertical-white-tile-panel"].component, {
        size: [0.95, 1.34, 0.01],
        variant: "stone",
      }),
    );
    const mesh = renderer.scene.instance.getObjectByName("white-vertical-tiles"),
      position = mesh.geometry.attributes.position;
    const unique = (axis) =>
      [
        ...new Set(
          Array.from({ length: position.count }, (_, i) =>
            Number((axis === "x" ? position.getX(i) : position.getY(i)).toFixed(5)),
          ),
        ),
      ].sort((a, b) => a - b);
    const xs = unique("x"),
      ys = unique("y");
    assert.ok(Math.abs(xs[1] - xs[0] - 0.597) < 0.0001, "first full tile is 60 cm minus grout");
    assert.ok(Math.abs(xs[3] - xs[2] - 0.347) < 0.0001, "35 cm edge tile is cropped");
    assert.ok(Math.abs(ys[1] - ys[0] - 0.597) < 0.0001);
    assert.ok(Math.abs(ys[5] - ys[4] - 0.137) < 0.0001, "last course is cropped to14cm");
    await renderer.unmount();
  });
  test("black flush rings and towel-ring mount retain real supporting contacts after resizing", async () => {
    for (const id of ["dual-round-flush-plate", "round-towel-ring"]) {
      const def = models[id];
      for (const size of [def.defaultSize, def.defaultSize.map((v, i) => v * [1.1, 0.9, 1.2][i])]) {
        const renderer = await create(createElement(def.component, { size, variant: "black" })),
          scene = renderer.scene.instance;
        scene.updateMatrixWorld(true);
        if (id === "dual-round-flush-plate") {
          const buttons = [],
            rings = [];
          scene.traverse((o) => {
            if (o.name === "round-flush-button") buttons.push(o);
            if (o.name === "flush-button-metal-ring") rings.push(o);
          });
          assert.equal(rings.length, 2);
          for (let i = 0; i < 2; i++)
            assert.ok(
              Math.abs(
                new Box3().setFromObject(rings[i]).min.z -
                  new Box3().setFromObject(buttons[i]).max.z,
              ) < 0.00001,
              "metal rim touches button face",
            );
        } else {
          const plate = new Box3().setFromObject(scene.getObjectByName("towel-ring-wall-plate")),
            stem = new Box3().setFromObject(scene.getObjectByName("towel-ring-standoff")),
            loop = new Box3().setFromObject(scene.getObjectByName("towel-ring-loop"));
          assert.ok(Math.abs(plate.max.z - stem.min.z) < 0.00001, "stem touches wall plate");
          assert.ok(stem.intersectsBox(loop), "ring meets standoff");
        }
        await renderer.unmount();
      }
    }
  });
  test("narrow single-door vanity keeps its basin cavity open and sides supporting its ceramic top", async () => {
    const def = models["narrow-single-door-vanity"];
    for (const size of [def.defaultSize, [0.4, 0.6, 0.32]]) {
      const renderer = await create(createElement(def.component, { size })),
        scene = renderer.scene.instance;
      scene.updateMatrixWorld(true);
      const meshes = [],
        doors = [],
        sides = [];
      scene.traverse((o) => {
        if (o.isMesh) meshes.push(o);
        if (o.name === "single-vanity-door") doors.push(o);
        if (o.name === "small-vanity-side") sides.push(o);
      });
      assert.equal(doors.length, 1);
      assert.equal(sides.length, 2);
      const z = (((0.025 * 0.295) / 0.35) * size[2]) / 0.295,
        hit = new Raycaster(new Vector3(0, size[1] * 2, z), new Vector3(0, -1, 0)).intersectObjects(
          meshes,
          false,
        )[0];
      assert.ok(
        hit && hit.point.y < size[1] * 0.9,
        "ray reaches the recessed ceramic bowl, not a solid case block",
      );
      const rim = new Box3().setFromObject(scene.getObjectByName("basin-rim"));
      for (const side of sides)
        assert.ok(
          Math.abs(new Box3().setFromObject(side).max.y - rim.min.y) < 0.0001,
          "case side supports ceramic rim",
        );
      await renderer.unmount();
    }
  });
  test("grooming accessories retain attached faces and brush head under independent resizing", async () => {
    for (const id of ["electric-toothbrush", "blue-dot-wall-control"]) {
      const def = models[id];
      for (const size of [def.defaultSize, def.defaultSize.map((v, i) => v * [1.2, 0.9, 1.1][i])]) {
        const renderer = await create(createElement(def.component, { size }));
        const scene = renderer.scene.instance;
        scene.updateMatrixWorld(true);
        if (id === "electric-toothbrush") {
          const neck = new Box3().setFromObject(scene.getObjectByName("brush-neck")),
            head = new Box3().setFromObject(scene.getObjectByName("brush-head"));
          assert.ok(Math.abs(neck.max.y - head.min.y) < 0.00001, "head connects to neck");
          const handle = new Box3().setFromObject(scene.getObjectByName("brush-handle"));
          assert.ok(Math.abs(handle.max.y - neck.min.y) < 0.00002, "neck connects to handle");
          const bristles = new Box3().setFromObject(scene.getObjectByName("blue-bristles"));
          assert.ok(bristles.intersectsBox(head), "bristles have a physical head support");
        } else {
          const body = new Box3().setFromObject(scene.getObjectByName("wall-control-body")),
            face = new Box3().setFromObject(scene.getObjectByName("wall-control-blue-face"));
          assert.ok(Math.abs(face.min.z - body.max.z) < 0.00001, "blue face touches its casing");
        }
        await renderer.unmount();
      }
    }
  });
  test("mosaic base keeps its drain opening and a recessed floor below the grate after resizing", async () => {
    const def = models["mosaic-shower-base"];
    for (const size of [def.defaultSize, [1, 0.12, 1.2]]) {
      const renderer = await create(createElement(def.component, { size })),
        scene = renderer.scene.instance;
      scene.updateMatrixWorld(true);
      const meshes = [];
      scene.traverse((o) => {
        if (o.isMesh) meshes.push(o);
      });
      const [w, h, d] = size,
        well = Math.min(0.1, w * 0.2, d * 0.2),
        inner = well * 0.88;
      const hit = new Raycaster(
        new Vector3(w * 0.25, h * 2, d * 0.25 + inner / 16),
        new Vector3(0, -1, 0),
      ).intersectObjects(meshes, false)[0];
      assert.ok(
        hit && hit.object.name === "drain-recess" && hit.point.y < h * 0.95,
        "ray between bars reaches recessed drain, not a ceramic tile",
      );
      const recess = new Box3().setFromObject(scene.getObjectByName("drain-recess"));
      scene.traverse((o) => {
        if (o.name === "drain-grate-bar" || o.name === "drain-frame") {
          const b = new Box3().setFromObject(o);
          assert.ok(Math.abs(b.min.y - recess.max.y) < 0.00001, "metal grate rests on its recess");
        }
      });
      await renderer.unmount();
    }
  });
  test("draped towel has an open tubular fold with room for a radiator rung", async () => {
    const def = models["draped-white-towel"];
    for (const size of [def.defaultSize, [0.36, 0.85, 0.048]]) {
      const renderer = await create(createElement(def.component, { size })),
        scene = renderer.scene.instance;
      scene.updateMatrixWorld(true);
      const mesh = scene.getObjectByName("towel-cloth"),
        sy = size[1] / 0.78,
        sz = size[2] / 0.04;
      const hit = new Raycaster(
        new Vector3(0, 0.76 * sy, 0.02 * sz),
        new Vector3(0, 1, 0),
      ).intersectObject(mesh, false)[0];
      assert.ok(
        hit && hit.distance > 0.013 * sy && hit.distance < 0.015 * sy,
        "fold is hollow, not a solid block across the supporting rung",
      );
      await renderer.unmount();
    }
  });
  test("shower handles connect to their glass mounts after resizing and hinge mirroring", async () => {
    const def = models["narrow-black-shower-door"];
    for (const variant of ["default", "right-hinge"])
      for (const size of [def.defaultSize, [0.7, 2.1, 0.08]]) {
        const renderer = await create(createElement(def.component, { size, variant }));
        const scene = renderer.scene.instance;
        scene.updateMatrixWorld(true);
        const glass = new Box3().setFromObject(scene.getObjectByName("shower-door-glass"));
        const mounts = [],
          handles = [],
          hinges = [];
        scene.traverse((o) => {
          if (o.name === "shower-door-pull-mount") mounts.push(o);
          if (o.name === "shower-door-pull") handles.push(o);
          if (o.name === "shower-door-hinge") hinges.push(o);
        });
        for (const mount of mounts) {
          const b = new Box3().setFromObject(mount);
          assert.ok(b.intersectsBox(glass), "mount meets the glass");
          assert.ok(
            handles.some((h) => b.intersectsBox(new Box3().setFromObject(h))),
            "mount meets a handle",
          );
        }
        for (const hinge of hinges)
          assert.ok(new Box3().setFromObject(hinge).intersectsBox(glass), "hinge meets glass edge");
        assert.equal(
          Math.sign(new Box3().setFromObject(hinges[0]).getCenter(new Vector3()).x),
          variant === "default" ? -1 : 1,
        );
        await renderer.unmount();
      }
  });
  test("marble vein geometry remains separated from its tile faces after independent resizing", async () => {
    const def = models["vertical-white-tile-panel"];
    for (const size of [def.defaultSize, [1.5, 2.4, 0.012]]) {
      const renderer = await create(createElement(def.component, { size, variant: "marble" }));
      const scene = renderer.scene.instance;
      scene.updateMatrixWorld(true);
      const face = new Box3().setFromObject(scene.getObjectByName("white-vertical-tiles")),
        veins = new Box3().setFromObject(scene.getObjectByName("marble-veins"));
      assert.ok(veins.min.z - face.max.z >= 0.0019, "veins have a real 2 mm nominal separation");
      assert.ok(
        veins.min.x >= face.min.x &&
          veins.max.x <= face.max.x &&
          veins.min.y >= 0 &&
          veins.max.y <= size[1],
      );
      await renderer.unmount();
    }
  });
  test("countertop basin remains open and supported by the drawer worktop under resizing", async () => {
    for (const factors of [
      [1, 1, 1],
      [1.1, 0.9, 1.2],
    ]) {
      const vanity = models["oak-two-drawer-vanity"],
        basin = models["round-countertop-basin"];
      const size = vanity.defaultSize.map((v, i) => v * factors[i]);
      const top = size[1];
      const renderer = await create(
        createElement(
          "group",
          null,
          createElement(vanity.component, { size }),
          createElement(
            "group",
            { position: [0, top, 0] },
            createElement(basin.component, {
              size: basin.defaultSize.map((v, i) => v * factors[i]),
            }),
          ),
        ),
      );
      const scene = renderer.scene.instance;
      scene.updateMatrixWorld(true);
      const meshes = [],
        fronts = [];
      scene.traverse((o) => {
        if (o.isMesh) meshes.push(o);
        if (o.name === "oak-drawer-front") fronts.push(o);
      });
      assert.equal(fronts.length, 2);
      const bowl = new Box3().setFromObject(scene.getObjectByName("vessel-bowl"));
      const worktop = new Box3().setFromObject(scene.getObjectByName("white-worktop"));
      assert.ok(Math.abs(bowl.min.y - worktop.max.y) < 0.0001, "ceramic base sits on the worktop");
      const hit = new Raycaster(
        new Vector3(0, top + 0.2, 0),
        new Vector3(0, -1, 0),
      ).intersectObjects(meshes, false)[0];
      assert.ok(
        hit && hit.point.y < top + 0.04 && hit.point.y > top + 0.02 * factors[1],
        "central ray reaches recessed drain, not a solid basin lid",
      );
      const back = new Box3().setFromObject(scene.getObjectByName("drawer-case-back"));
      for (const front of fronts)
        assert.ok(
          new Box3().setFromObject(front).min.z > back.max.z,
          "front panels stay ahead of case back",
        );
      await renderer.unmount();
    }
  });
  test("compact vanity has an open basin, two fronts and supported ceramic rim after resizing", async () => {
    const def = models["compact-two-door-vanity"];
    for (const size of [def.defaultSize, [0.7, 0.56, 0.4]]) {
      const renderer = await create(createElement(def.component, { size })),
        scene = renderer.scene.instance;
      scene.updateMatrixWorld(true);
      const meshes = [],
        doors = [],
        sides = [];
      scene.traverse((o) => {
        if (o.isMesh && o.material.isMeshToonMaterial) meshes.push(o);
        if (o.name === "vanity-door") doors.push(o);
        if (o.name === "side") sides.push(o);
      });
      assert.equal(doors.length, 2);
      assert.equal(sides.length, 2);
      const hit = new Raycaster(
        new Vector3(0, (0.8 * size[1]) / 0.5, (0.025 * size[2]) / 0.35),
        new Vector3(0, -1, 0),
      ).intersectObjects(meshes, false)[0];
      assert.ok(
        hit && hit.point.y < (0.4 * size[1]) / 0.5 && hit.point.y > (0.34 * size[1]) / 0.5,
        "central ray reaches recessed bowl, not a solid top",
      );
      const rim = new Box3().setFromObject(scene.getObjectByName("basin-rim"));
      for (const side of sides)
        assert.ok(
          new Box3().setFromObject(side).max.y >= rim.min.y,
          "case sides support ceramic top",
        );
      await renderer.unmount();
    }
  });
  test("wall-hung toilet retains an open bowl and attached raised lid under independent resizing", async () => {
    const def = models["wall-hung-toilet"];
    for (const size of [def.defaultSize, [0.44, 0.8, 0.61]]) {
      const renderer = await create(createElement(def.component, { size }));
      const scene = renderer.scene.instance;
      scene.updateMatrixWorld(true);
      const meshes = [];
      scene.traverse((o) => {
        if (o.isMesh && o.material.isMeshToonMaterial) meshes.push(o);
      });
      const hit = new Raycaster(
        new Vector3(0, size[1], size[2] / 2),
        new Vector3(0, -1, 0),
      ).intersectObjects(meshes, false)[0];
      assert.ok(
        hit && hit.point.y < (0.15 * size[1]) / 0.715,
        "ray reaches bowl interior below the seat",
      );
      const lid = new Box3().setFromObject(scene.getObjectByName("raised-toilet-lid"));
      const hinges = [];
      scene.traverse((o) => {
        if (o.name === "lid-hinge") hinges.push(o);
      });
      assert.equal(hinges.length, 2);
      for (const hinge of hinges)
        assert.ok(lid.intersectsBox(new Box3().setFromObject(hinge)), "lid meets each hinge");
      assert.ok(lid.max.y > (0.7 * size[1]) / 0.715, "lid is raised");
      await renderer.unmount();
    }
  });
  test("family vanity has two drawers and the empty bath has a recessed cavity after resizing", async () => {
    for (const id of ["two-drawer-basin-vanity", "empty-rectangular-bathtub"]) {
      const def = models[id];
      for (const size of [def.defaultSize, def.defaultSize.map((v, i) => v * [1.1, 1.2, 0.9][i])]) {
        const renderer = await create(createElement(def.component, { size }));
        const scene = renderer.scene.instance;
        scene.updateMatrixWorld(true);
        const meshes = [],
          drawers = [];
        scene.traverse((o) => {
          if (o.isMesh && o.material.isMeshToonMaterial) meshes.push(o);
          if (o.name === "vanity-drawer-front") drawers.push(o);
        });
        if (id === "two-drawer-basin-vanity") assert.equal(drawers.length, 2);
        const z = id === "two-drawer-basin-vanity" ? (0.025 * size[2]) / 0.35 : 0;
        const hit = new Raycaster(
          new Vector3(0, size[1] * 2, z),
          new Vector3(0, -1, 0),
        ).intersectObjects(meshes, false)[0];
        assert.ok(hit && hit.point.y < size[1] * 0.85, "centre ray reaches the bowl below its rim");
        if (id === "empty-rectangular-bathtub")
          assert.ok(hit.point.y < size[1] * 0.3, "bath floor is genuinely recessed");
        await renderer.unmount();
      }
    }
  });
  test("bathroom cups and baskets remain hollow after independent resizing", async () => {
    for (const id of ["bathroom-tumbler", "soft-laundry-basket", "mesh-storage-basket"]) {
      const def = models[id];
      for (const size of [def.defaultSize, def.defaultSize.map((v, i) => v * [1.2, 0.9, 1.1][i])]) {
        const renderer = await create(createElement(def.component, { size }));
        const scene = renderer.scene.instance;
        scene.updateMatrixWorld(true);
        const meshes = [];
        scene.traverse((o) => {
          if (o.isMesh && o.material.isMeshToonMaterial) meshes.push(o);
        });
        const hit = new Raycaster(
          new Vector3(0, size[1] * 2, 0),
          new Vector3(0, -1, 0),
        ).intersectObjects(meshes, false)[0];
        assert.ok(
          hit && hit.point.y < size[1] * 0.15,
          "central ray reaches the container floor rather than a solid lid",
        );
        await renderer.unmount();
      }
    }
  });
  test("toothbrush cup contents rest on the inside floor after resizing", async () => {
    const def = models["toothbrush-cup"];
    for (const size of [def.defaultSize, [0.08, 0.26, 0.09]]) {
      const renderer = await create(createElement(def.component, { size }));
      const scene = renderer.scene.instance;
      scene.updateMatrixWorld(true);
      const floor = (0.0096 * size[1]) / def.defaultSize[1];
      for (const name of ["toothpaste-tube", "toothbrush-stem"]) {
        const b = new Box3().setFromObject(scene.getObjectByName(name));
        assert.ok(Math.abs(b.min.y - floor) < 0.00002, "contents touch cup floor");
      }
      await renderer.unmount();
    }
  });
  test("rounded double vanity has a left-only curved return and supported side-by-side fronts under resizing", async () => {
    const definition = models["rounded-double-basin-vanity"];
    for (const variant of ["default", "round-right"])
      for (const size of [definition.defaultSize, [1.5, 0.5, 0.6]]) {
        const renderer = await create(createElement(definition.component, { size, variant }));
        const scene = renderer.scene.instance;
        scene.updateMatrixWorld(true);
        const worktop = scene.getObjectByName("white-rounded-worktop");
        const sx = size[0] / 1.2,
          sy = size[1] / 0.42,
          sz = size[2] / 0.5;
        const down = (x, z) =>
          new Raycaster(
            new Vector3(x * sx * (variant === "round-right" ? -1 : 1), size[1] + 0.1, z * sz),
            new Vector3(0, -1, 0),
          ).intersectObject(worktop, false);
        assert.equal(down(-0.59, 0.49).length, 0, "left front corner is rounded away");
        assert.ok(down(0.59, 0.49).length > 0, "right front remains square");
        assert.ok(down(-0.52, 0.4).length > 0, "rounded return joins the worktop");
        const fronts = [];
        scene.traverse((o) => {
          if (o.name === "side-by-side-drawer-front") fronts.push(new Box3().setFromObject(o));
        });
        fronts.sort((a, b) => a.min.x - b.min.x);
        assert.equal(fronts.length, 2);
        assert.ok(Math.abs(fronts[0].min.y - fronts[1].min.y) < 0.00001);
        assert.ok(fronts[0].max.x < fronts[1].min.x);
        const side = new Box3().setFromObject(scene.getObjectByName("vanity-right-support")),
          top = new Box3().setFromObject(worktop);
        assert.ok(
          Math.abs(side.max.z - fronts[0].min.z) < 0.00001,
          "side support contacts drawer rear without coplanar exposed faces",
        );
        assert.ok(Math.abs(side.max.y - top.min.y) < 0.00001, "case supports worktop");
        assert.ok(fronts.every((b) => top.min.y - b.max.y > 0.006 * sy));
        await renderer.unmount();
      }
  });
  test("mirror cabinet retains two separate doors supported on the case front", async () => {
    const definition = models["two-door-mirror-cabinet"];
    for (const size of [definition.defaultSize, [0.9, 1.2, 0.18]]) {
      const renderer = await create(createElement(definition.component, { size }));
      const scene = renderer.scene.instance;
      scene.updateMatrixWorld(true);
      const doors = [],
        sides = [];
      scene.traverse((o) => {
        if (o.name === "mirror-door") doors.push(new Box3().setFromObject(o));
        if (o.name === "mirror-case-side") sides.push(new Box3().setFromObject(o));
      });
      assert.equal(doors.length, 2);
      assert.ok(doors[0].max.x < doors[1].min.x);
      for (let i = 0; i < 2; i++) assert.ok(Math.abs(doors[i].min.z - sides[i].max.z) < 0.00001);
      await renderer.unmount();
    }
  });
  test("tubular lamp glass and mounting members stay connected under independent resizing", async () => {
    const definition = models["tubular-wall-lamp"];
    for (const size of [definition.defaultSize, [0.1, 0.4, 0.15]]) {
      const renderer = await create(createElement(definition.component, { size }));
      const scene = renderer.scene.instance;
      scene.updateMatrixWorld(true);
      const bb = (name) => new Box3().setFromObject(scene.getObjectByName(name));
      const glass = bb("opal-tube"),
        base = bb("tube-metal-base"),
        neck = bb("lamp-standoff"),
        plate = bb("lamp-wall-plate");
      assert.ok(Math.abs(glass.min.y - base.max.y) < 0.00001);
      assert.ok(neck.intersectsBox(base) && neck.intersectsBox(plate));
      assert.ok(Math.abs(plate.min.z) < 0.00001);
      await renderer.unmount();
    }
  });
  test("concrete and grey mosaic cladding preserve nominal courses with cropped edges", async () => {
    for (const [variant, size, expected] of [
      ["concrete", [0.95, 0.65, 0.01], [0.612, 0.332, 0.305, 0.031]],
      ["grey-mosaic", [0.9822, 0.35, 0.01], [0.047, 0.0292, 0.022, 0.022]],
    ]) {
      const renderer = await create(
        createElement(models["vertical-white-tile-panel"].component, { size, variant }),
      );
      const position =
        renderer.scene.instance.getObjectByName("white-vertical-tiles").geometry.attributes
          .position;
      const unique = (axis) =>
        [
          ...new Set(
            Array.from({ length: position.count }, (_, i) =>
              Number((axis === "x" ? position.getX(i) : position.getY(i)).toFixed(5)),
            ),
          ),
        ].sort((a, b) => a - b);
      const xs = unique("x"),
        ys = unique("y");
      for (const [actual, value] of [
        [xs[1] - xs[0], expected[0]],
        [xs.at(-1) - xs.at(-2), expected[1]],
        [ys[1] - ys[0], expected[2]],
        [ys.at(-1) - ys.at(-2), expected[3]],
      ])
        assert.ok(Math.abs(actual - value) < 0.00002);
      await renderer.unmount();
    }
  });
  test("concealed shower head elbow joins actual arm endpoints and supports its disc when resized", async () => {
    const def = models["concealed-round-shower-head"];
    for (const size of [def.defaultSize, [0.3, 0.3, 0.6]]) {
      const renderer = await create(createElement(def.component, { size }));
      const scene = renderer.scene.instance;
      scene.updateMatrixWorld(true);
      const arm = scene.getObjectByName("horizontal-shower-arm"),
        stem = scene.getObjectByName("head-drop-stem"),
        bend = scene.getObjectByName("shower-arm-elbow");
      const endpoint = (m) =>
        new Vector3(0, m.geometry.parameters.height / 2, 0).applyMatrix4(m.matrixWorld);
      const radius = bend.geometry.parameters.radius;
      const ends = [
        new Vector3(radius, 0, 0).applyMatrix4(bend.matrixWorld),
        new Vector3(0, radius, 0).applyMatrix4(bend.matrixWorld),
      ];
      assert.ok(endpoint(stem).distanceTo(ends[0]) < 0.00001);
      assert.ok(endpoint(arm).distanceTo(ends[1]) < 0.00001);
      const disc = new Box3().setFromObject(scene.getObjectByName("round-overhead-head")),
        drop = new Box3().setFromObject(stem);
      assert.ok(Math.abs(drop.min.y - disc.max.y) < 0.00001);
      await renderer.unmount();
    }
  });
  test("concealed mixer and pedal bin supports connect under independent resizing", async () => {
    for (const [id, size] of [
      ["concealed-shower-mixer", [0.16, 0.25, 0.08]],
      ["small-pedal-bin", [0.25, 0.4, 0.3]],
    ]) {
      const renderer = await create(createElement(models[id].component, { size }));
      const scene = renderer.scene.instance;
      scene.updateMatrixWorld(true);
      const box = (name) => new Box3().setFromObject(scene.getObjectByName(name));
      if (id === "concealed-shower-mixer") {
        const plate = box("concealed-mixer-plate"),
          knob = box("shower-mixer-knob"),
          selector = box("shower-outlet-selector"),
          lever = box("shower-mixer-lever");
        assert.ok(Math.abs(plate.max.z - knob.min.z) < 0.00001);
        assert.ok(Math.abs(plate.max.z - selector.min.z) < 0.00001);
        assert.ok(Math.abs(knob.max.z - lever.min.z) < 0.00001);
      } else {
        const hinge = box("pedal-bin-hinge");
        assert.ok(hinge.intersectsBox(box("pedal-bin-lid")));
        assert.ok(hinge.intersectsBox(box("pedal-bin-body")));
        assert.ok(box("bin-foot-pedal").intersectsBox(box("pedal-bin-body")));
      }
      await renderer.unmount();
    }
  });
  test("fixed shower glass remains seated in its wall jamb and upper rail after resizing", async () => {
    const def = models["fixed-shower-panel"];
    for (const size of [def.defaultSize, [0.32, 2.1, 0.03]]) {
      const renderer = await create(createElement(def.component, { size }));
      const scene = renderer.scene.instance;
      scene.updateMatrixWorld(true);
      const glass = new Box3().setFromObject(scene.getObjectByName("fixed-shower-glass"));
      for (const name of ["fixed-wall-jamb", "fixed-top-rail"])
        assert.ok(glass.intersectsBox(new Box3().setFromObject(scene.getObjectByName(name))));
      await renderer.unmount();
    }
  });
  test("capped bottle parts touch without an unsupported lid under resizing", async () => {
    const def = models["small-capped-bottle"];
    for (const size of [def.defaultSize, [0.07, 0.22, 0.08]]) {
      const renderer = await create(createElement(def.component, { size }));
      const scene = renderer.scene.instance;
      scene.updateMatrixWorld(true);
      const boxes = [
        "capped-bottle-body",
        "capped-bottle-shoulder",
        "bottle-neck",
        "screw-cap",
      ].map((n) => new Box3().setFromObject(scene.getObjectByName(n)));
      for (let n = 1; n < boxes.length; n++)
        assert.ok(Math.abs(boxes[n].min.y - boxes[n - 1].max.y) < 0.00001);
      await renderer.unmount();
    }
  });
});
