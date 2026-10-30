import assert from "node:assert/strict";
import test from "node:test";
import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { withModules } from "./test-server.mjs";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await withModules(async (load) => {
  const engine = await load("/packages/engine/src/index.ts");
  const { useConnectEditor } = await load("/apps/web/src/editor-connect/useConnectEditor.ts");
  const { ConnectInspector } = await load("/apps/web/src/editor-connect/ConnectInspector.tsx");
  const {
    equippedFixtureManifest: manifest,
    connectedCatalogRuntime: snapshot,
    equippedFixtureProfile: initialProfile,
  } = await load("/tests/fixtures/agent-home.tsx");
  const origin = snapshot.origin;
  const runtime = {
    ...snapshot,
    connect() {},
    retry() {},
    disconnect: async () => {},
    refreshing: false,
    refreshError: null,
    refresh: async () => {},
    callService: async () => {
      throw new Error("No services");
    },
    cameraClient: null,
  };
  const allRooms = manifest.floors[0].rooms.map((room) => room.id);
  const allSlots = engine.collectBindingSlots(manifest).map((slot) => slot.slotId);
  const protectedBindings = (profile = initialProfile) => ({
    [origin]: {
      draft: structuredClone(profile),
      published: structuredClone(profile),
      manualRoomIds: allRooms,
      manualSlotIds: allSlots,
    },
  });
  async function mount(
    initialBindings = protectedBindings(),
    showInspector = false,
    initialRequest,
  ) {
    const dom = new JSDOM('<!doctype html><div id="root"></div>', {
      url: "http://connect-test.invalid/",
      pretendToBeVisual: true,
    });
    const names = [
      "window",
      "document",
      "navigator",
      "HTMLElement",
      "requestAnimationFrame",
      "cancelAnimationFrame",
    ];
    const previous = Object.fromEntries(
      names.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]),
    );
    for (const name of names)
      Object.defineProperty(globalThis, name, {
        configurable: true,
        writable: true,
        value: name.includes("AnimationFrame")
          ? dom.window[name].bind(dom.window)
          : dom.window[name],
      });
    const root = createRoot(dom.window.document.getElementById("root"));
    let current, setBindings, bindings;
    function Harness({
      actualManifest = manifest,
      actualRuntime = runtime,
      actualOrigin = origin,
      active = true,
      onAddReading,
    }) {
      [bindings, setBindings] = useState(initialBindings);
      current = useConnectEditor({
        manifest: actualManifest,
        runtime: actualRuntime,
        origin: actualOrigin,
        bindings,
        onChange: setBindings,
        onAddReading,
        active,
        initialRequest,
      });
      return showInspector
        ? createElement(ConnectInspector, {
            editor: current,
            manifest: actualManifest,
            runtime: actualRuntime,
            homeAssistantUrl: actualOrigin,
            onSignIn: async () => {},
            onExportProfile: () => "{}",
            onBackup: async () => "{}",
            onDiscard: async () => {},
            onImportWorkspace() {},
            onExportProject: () => "{}",
          })
        : null;
    }
    const render = async (props = {}) =>
      act(async () => root.render(createElement(Harness, props)));
    await render();
    return {
      dom,
      render,
      get editor() {
        return current;
      },
      get bindings() {
        return bindings;
      },
      setBindings: async (next) => act(async () => setBindings(next)),
      async close() {
        await act(async () => root.unmount());
        dom.window.close();
        for (const name of names) {
          if (previous[name]) Object.defineProperty(globalThis, name, previous[name]);
          else delete globalThis[name];
        }
      },
    };
  }

  test("outside devices are selectable in Connect without adding architectural rooms", async () => {
    const device = manifest.floors[0].rooms.flatMap((room) => room.devices)[0];
    const actualManifest = {
      ...manifest,
      sceneItems: [
        ...manifest.sceneItems,
        {
          id: "garden-device",
          kind: "device",
          floorId: manifest.floors[0].id,
          modelId: device.model,
          placement: {
            kind: "absolute",
            at: [1000, 1000],
            elevationMeters: 0,
            rotationYRadians: 0,
          },
          entitySlots: device.entitySlots.map((slot, i) => ({ ...slot, id: `garden-slot-${i}` })),
        },
      ],
    };
    const harness = await mount(protectedBindings(), true);
    const added = [];
    const onAddReading = (itemId, entityId) => added.push({ itemId, entityId });
    try {
      await harness.render({ actualManifest, onAddReading });
      await act(async () => harness.editor.setView("devices"));
      assert.match(harness.dom.window.document.body.textContent, /Outside rooms/);
      await act(async () => assert.equal(harness.editor.selectDevice("garden-device"), true));
      assert.equal(harness.editor.relationship.id, "garden-device");
      assert.equal(harness.editor.room.name, "Outside rooms");
      assert.equal(harness.editor.rooms.length, manifest.floors[0].rooms.length);
      assert.ok(
        harness.dom.window.document.querySelector(".device-mapping-inspector__add-reading"),
      );
      const entityId = runtime.entityRegistry.find((entry) =>
        entry.entity_id.startsWith("sensor."),
      ).entity_id;
      await act(async () => harness.editor.addReading(entityId));
      assert.deepEqual(added, [{ itemId: "garden-device", entityId }]);
      await harness.render({
        actualManifest,
        onAddReading,
        actualRuntime: { ...runtime, status: "disconnected" },
      });
      await act(async () => harness.editor.addReading(entityId));
      assert.equal(added.length, 1, "disconnected sessions cannot add readings");
      await act(async () => harness.editor.setView("rooms"));
      assert.equal(harness.editor.room, null);
    } finally {
      await harness.close();
    }
  });

  test("optional unbound openings remain in Devices without reducing room connection progress", async () => {
    const harness = await mount();
    try {
      for (const room of manifest.floors[0].rooms) {
        await act(async () => harness.editor.selectRoom(room.id));
        const openingRelationships = harness.editor.groups
          .flatMap((group) => group.relationships)
          .filter(
            (relationship) =>
              relationship.kind === "entity-slot" && relationship.slotKind === "opening-contact",
          );
        const unbound = openingRelationships.filter(
          (relationship) =>
            !relationship.slotIds.some((id) => harness.editor.profile.entityIdsBySlotId[id]),
        );
        const total = harness.editor.groups.flatMap((group) => group.relationships).length;
        assert.equal(harness.editor.roomDeviceSummaries[room.id].total, total - unbound.length);
      }
    } finally {
      await harness.close();
    }
  });

  test("Connect defaults to devices only with all rooms mapped and preserves explicit entry views", async () => {
    const mapped = {
      ...initialProfile,
      roomAreaIds: Object.fromEntries(allRooms.map((id, index) => [id, `synthetic-area-${index}`])),
    };
    for (const [profile, request, expected] of [
      [mapped, { mode: "connect" }, "devices"],
      [{ ...mapped, roomAreaIds: {} }, { mode: "connect" }, "rooms"],
      [
        { ...mapped, roomAreaIds: { ...mapped.roomAreaIds, [allRooms[0]]: "" } },
        { mode: "connect" },
        "rooms",
      ],
      [mapped, { mode: "connect", view: "rooms" }, "rooms"],
      [{ ...mapped, roomAreaIds: {} }, { mode: "connect", view: "devices" }, "devices"],
    ]) {
      const harness = await mount(protectedBindings(profile), false, request);
      try {
        assert.equal(harness.editor.view, expected);
        await act(async () => harness.editor.setView("rooms"));
        assert.equal(harness.editor.view, "rooms");
        await harness.render({ actualRuntime: { ...runtime, status: "disconnected", areas: [] } });
        assert.equal(
          harness.editor.defaultView,
          Object.values(profile.roomAreaIds).filter(Boolean).length === allRooms.length
            ? "devices"
            : "rooms",
        );
      } finally {
        await harness.close();
      }
    }
  });

  test("room area change confirms dependent draft clearing, cancel is a no-op, published mappings are unchanged", async () => {
    const harness = await mount();
    try {
      const roomId = Object.keys(initialProfile.roomAreaIds).find((id) =>
        engine
          .collectBindingSlots(manifest)
          .some(
            (slot) => slot.roomIds.includes(id) && initialProfile.entityIdsBySlotId[slot.slotId],
          ),
      );
      await act(async () => harness.editor.selectRoom(roomId));
      const before = structuredClone(harness.bindings);
      await act(async () => harness.editor.assignArea(""));
      assert.ok(harness.editor.pendingAreaChange.clearedSlotIds.length);
      assert.deepEqual(harness.bindings, before);
      await act(async () => harness.editor.cancelAreaChange());
      assert.deepEqual(harness.bindings, before);
      await act(async () => harness.editor.assignArea(""));
      const cleared = harness.editor.pendingAreaChange.clearedSlotIds;
      await act(async () => harness.editor.confirmAreaChange());
      assert.equal(harness.editor.profile.roomAreaIds[roomId], undefined);
      for (const slot of cleared)
        assert.equal(harness.editor.profile.entityIdsBySlotId[slot], undefined);
      assert.deepEqual(harness.bindings[origin].published, before[origin].published);
    } finally {
      await harness.close();
    }
  });

  test("exact-device entry resolves its current room and retains selection through connection loss", async () => {
    const room = manifest.floors[0].rooms.find((room) => room.devices.length);
    const device = room.devices[0];
    const harness = await mount(protectedBindings(), true, {
      mode: "connect",
      roomId: "stale-room",
      relationshipId: device.id,
    });
    try {
      assert.equal(harness.editor.roomId, room.id);
      assert.equal(harness.editor.view, "devices");
      assert.equal(harness.editor.relationshipId, device.id);
      assert.ok(harness.dom.window.document.querySelector(".is-selected-preview"));
      await harness.render({
        actualRuntime: { ...runtime, status: "disconnected", areas: [], entityRegistry: [] },
      });
      assert.equal(harness.editor.relationshipId, device.id);
      const choices = [...harness.dom.window.document.querySelectorAll('input[type="radio"]')];
      assert.ok(choices.find((input) => input.value === "" && !input.disabled));
      assert.ok(choices.filter((input) => input.value).every((input) => input.disabled));
      await act(async () =>
        harness.dom.window.document.querySelector('[aria-label^="Back to devices"]').click(),
      );
      await act(async () =>
        harness.dom.window.document
          .querySelector(`[data-relationship-id="${device.id}"] button`)
          .click(),
      );
      await act(async () => new Promise((resolve) => requestAnimationFrame(resolve)));
      assert.match(
        harness.dom.window.document.activeElement.getAttribute("aria-label"),
        /^Back to devices/,
      );
      assert.equal(harness.dom.window.document.activeElement.disabled, false);
      const deleted = {
        ...manifest,
        floors: [
          {
            ...manifest.floors[0],
            rooms: manifest.floors[0].rooms.map((item) =>
              item.id === room.id
                ? {
                    ...item,
                    devices: room.devices.filter((candidate) => candidate.id !== device.id),
                  }
                : item,
            ),
          },
        ],
      };
      await harness.render({ actualManifest: deleted });
      assert.equal(harness.editor.relationship, null);
      assert.match(harness.editor.message, /no longer in the draft/);
    } finally {
      await harness.close();
    }
  });

  test("grid cards cover every relationship, expose search and clearing, and return focus", async () => {
    const harness = await mount(protectedBindings(), true);
    try {
      const room = manifest.floors[0].rooms.find((room) => room.devices.length);
      await act(async () => {
        harness.editor.selectRoom(room.id);
        harness.editor.setView("devices");
      });
      const rows = [
        ...harness.dom.window.document.querySelectorAll(".connect-device-grid .device-mapping-row"),
      ];
      assert.equal(
        rows.length,
        harness.editor.groups.flatMap((group) => group.relationships).length,
      );
      const row = rows.find((row) => row.dataset.relationshipId === room.devices[0].id);
      await act(async () => row.querySelector("button").click());
      const search = harness.dom.window.document.querySelector('input[type="search"]');
      assert.ok(search);
      assert.ok(harness.dom.window.document.querySelector('input[type="radio"][value=""]'));
      await act(async () =>
        harness.dom.window.document.querySelector('[aria-label^="Back to devices"]').click(),
      );
      await act(async () => new Promise((resolve) => requestAnimationFrame(resolve)));
      assert.equal(
        harness.dom.window.document.activeElement.closest("[data-relationship-id]").dataset
          .relationshipId,
        room.devices[0].id,
      );
    } finally {
      await harness.close();
    }
  });

  test("automatic resolver respects explicit empty rooms/slots and undo does not immediately refill", async () => {
    const empty = engine.createEmptyRuntimeBindingProfile(manifest.home.id);
    const harness = await mount(protectedBindings(empty));
    try {
      assert.deepEqual(harness.editor.profile, empty);
      const unprotected = {
        [origin]: { draft: empty, published: empty, manualRoomIds: [], manualSlotIds: [] },
      };
      await harness.setBindings(unprotected);
      await harness.render({
        actualRuntime: {
          ...runtime,
          areas: [...runtime.areas, { area_id: "unused", name: "Unused" }],
        },
      });
      assert.ok(Object.keys(harness.editor.profile.roomAreaIds).length);
      await harness.setBindings(unprotected);
      assert.deepEqual(harness.editor.profile, empty);
      await harness.render({
        active: false,
        actualRuntime: {
          ...runtime,
          areas: [...runtime.areas, { area_id: "unused", name: "Unused" }],
        },
      });
      await harness.render({
        active: true,
        actualRuntime: {
          ...runtime,
          areas: [...runtime.areas, { area_id: "unused", name: "Unused" }],
        },
      });
      assert.deepEqual(harness.editor.profile, empty);
    } finally {
      await harness.close();
    }
  });

  test("disconnect retains same-origin display snapshot, allows clearing, and never reuses another origin", async () => {
    const harness = await mount();
    try {
      await act(async () => harness.editor.selectRoom(Object.keys(initialProfile.roomAreaIds)[0]));
      await harness.render({
        actualRuntime: { ...runtime, status: "disconnected", areas: [], entityRegistry: [] },
      });
      assert.equal(harness.editor.disconnected, true);
      assert.deepEqual(harness.editor.displayRuntime.areas, runtime.areas);
      const before = structuredClone(harness.bindings);
      await act(async () => harness.editor.assignArea("fake-new-area"));
      assert.deepEqual(harness.bindings, before);
      await act(async () => harness.editor.assignArea(""));
      assert.ok(harness.editor.pendingAreaChange);
      await harness.render({
        actualOrigin: "https://other.invalid",
        actualRuntime: {
          ...runtime,
          origin: "https://other.invalid",
          status: "disconnected",
          areas: [],
          entityRegistry: [],
        },
      });
      assert.deepEqual(harness.editor.profile.roomAreaIds, {});
      assert.deepEqual(harness.editor.displayRuntime.areas, []);
    } finally {
      await harness.close();
    }
  });

  test("current draft target additions appear immediately and inspector reuses inline chooser with neutral clearing and focus return", async () => {
    const harness = await mount(protectedBindings(), true);
    try {
      const room = manifest.floors[0].rooms[0];
      const first = engine
        .collectBindingSlots(manifest)
        .find((slot) => slot.roomIds.includes(room.id));
      const newSlot = {
        ...first.spec,
        id: "synthetic-new-draft-slot",
        presentation: { ...first.spec.presentation, label: "New draft target" },
      };
      const next = {
        ...manifest,
        floors: [
          {
            ...manifest.floors[0],
            rooms: manifest.floors[0].rooms.map((candidate) =>
              candidate.id === room.id
                ? { ...candidate, dashboardSlots: [...candidate.dashboardSlots, newSlot] }
                : candidate,
            ),
          },
        ],
      };
      await harness.render({ actualManifest: next });
      await act(async () => {
        harness.editor.selectRoom(room.id);
        harness.editor.setView("devices");
      });
      assert.ok(
        harness.editor.groups
          .flatMap((group) => group.relationships)
          .some((relationship) => relationship.id === newSlot.id),
      );
      const row = [...harness.dom.window.document.querySelectorAll("button")].find((button) =>
        button.textContent.includes("New draft target"),
      );
      assert.ok(row);
      await act(async () => row.click());
      await act(async () => new Promise((resolve) => requestAnimationFrame(resolve)));
      assert.ok(harness.dom.window.document.querySelector(".device-mapping-inspector.is-inline"));
      assert.equal(harness.dom.window.document.querySelector('[role="dialog"]'), null);
      assert.equal(harness.dom.window.document.querySelector('input[value=""]').disabled, false);
      assert.doesNotMatch(harness.dom.window.document.body.textContent, /Save rooms|Save devices/);
      const back = harness.dom.window.document.querySelector('[aria-label^="Back to devices"]');
      await act(async () => back.click());
      await act(async () => new Promise((resolve) => requestAnimationFrame(resolve)));
      assert.ok(harness.dom.window.document.activeElement.textContent.includes("New draft target"));
    } finally {
      await harness.close();
    }
  });
});
