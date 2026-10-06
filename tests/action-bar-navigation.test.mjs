import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const { resolveActionBarDestination, openActionBarDestination } = await load(
    "/packages/engine/src/action-bar/action-bar-navigation.ts",
  );
  const manifest = {
    floors: [
      { id: "ground", rooms: [{ id: "hall", devices: [] }] },
      { id: "upper", rooms: [{ id: "study", devices: [{ id: "desk-lamp" }] }] },
    ],
  };

  test("resolves exact room and upper-floor device destinations", () => {
    assert.deepEqual(resolveActionBarDestination(manifest, { kind: "room", roomId: "study" }), {
      floorId: "upper",
      roomId: "study",
    });
    assert.deepEqual(
      resolveActionBarDestination(manifest, { kind: "device", deviceId: "desk-lamp" }),
      { floorId: "upper", roomId: "study", deviceId: "desk-lamp" },
    );
    assert.equal(
      resolveActionBarDestination(manifest, { kind: "device", deviceId: "deleted" }),
      null,
    );
  });

  test("opens exact upper-floor device from Walk in navigation order", () => {
    const events = [];
    openActionBarDestination(
      { floorId: "upper", roomId: "study", deviceId: "desk-lamp" },
      {
        walkMode: true,
        leaveWalkMode: () => events.push("leave Walk"),
        selectFloor: (id) => events.push(`floor ${id}`),
        selectRoom: (id) => events.push(`room ${id}`),
        openDevice: (roomId, deviceId) => events.push(`device ${roomId}/${deviceId}`),
      },
    );
    assert.deepEqual(events, ["leave Walk", "floor upper", "room study", "device study/desk-lamp"]);
  });
});
