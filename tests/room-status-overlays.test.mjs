import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const { neutralDemoManifest } = await load("/packages/engine/src/demo.ts");
  const {
    RoomStatusOverlayButton,
    roomStatusOverlayPosition,
    roomStatusOverlayLimitForWidth,
    roomStatusOverlayPriority,
    selectRoomStatusOverlayIds,
    shouldShowRoomStatusOverlays,
  } = await load("/packages/engine/src/room-status/RoomStatusOverlays.tsx");
  const summary = {
    roomId: "demo-room",
    temperature: { value: "21", unit: "°C" },
    humidity: { value: "48", unit: "%" },
    heating: false,
    cooling: true,
    lighting: "on",
    presence: "present",
    doorOpen: false,
  };

  test("anchors an overlay above the room polygon centroid", () => {
    const floor = neutralDemoManifest.floors[0];
    const position = roomStatusOverlayPosition(floor.rooms[0], floor);
    assert.deepEqual(position.slice(0, 2), [2.4, 2.9]);
    assert.ok(Math.abs(position[2] - 1.8) < 1e-9);
  });

  test("limits orbital overlays to the general overview", () => {
    assert.equal(shouldShowRoomStatusOverlays("overview"), true);
    assert.equal(shouldShowRoomStatusOverlays("room"), false);
    assert.equal(shouldShowRoomStatusOverlays("walk"), false);
  });

  test("exposes the room and compact status through one accessible button", () => {
    const html = renderToStaticMarkup(
      React.createElement(RoomStatusOverlayButton, {
        roomName: "Demo room",
        summary,
        onSelect: () => undefined,
      }),
    );
    assert.match(html, /<button/);
    assert.match(
      html,
      /aria-label="Open Demo room\. Temperature 21 °C, Cooling, Lights on, Presence"/,
    );
    assert.match(html, /data-visible="true"/);
    assert.match(html, /Demo room/);
    assert.equal(html.includes("Humidity"), false);
    assert.equal(html.includes("48 %"), false);
  });

  test("uses a compact cap and prioritizes useful status before center distance", () => {
    assert.equal(roomStatusOverlayLimitForWidth(759), 6);
    assert.equal(roomStatusOverlayLimitForWidth(760), 10);
    assert.equal(roomStatusOverlayPriority(summary), 3);
    assert.equal(
      roomStatusOverlayPriority({
        roomId: "humidity-only",
        humidity: { value: "48", unit: "%" },
        heating: false,
        cooling: false,
        doorOpen: false,
      }),
      0,
    );

    const candidates = Array.from({ length: 7 }, (_, index) => ({
      id: `room-${index}`,
      screenX: index * 180,
      screenY: 100,
      distanceFromCenter: index / 10,
      labelWidth: 88,
      priority: index === 6 ? 2 : 1,
      inViewport: true,
    }));
    const selected = selectRoomStatusOverlayIds(candidates, 5);
    assert.equal(selected.size, 5);
    assert.equal(selected.has("room-6"), true);
    assert.equal(selected.has("room-4"), false);
    assert.equal(selected.has("room-5"), false);
  });

  test("declutters overlapping labels and ignores off-screen rooms", () => {
    const selected = selectRoomStatusOverlayIds(
      [
        {
          id: "priority",
          screenX: 100,
          screenY: 100,
          distanceFromCenter: 0.2,
          labelWidth: 100,
          priority: 2,
          inViewport: true,
        },
        {
          id: "overlap",
          screenX: 112,
          screenY: 108,
          distanceFromCenter: 0.1,
          labelWidth: 100,
          priority: 1,
          inViewport: true,
        },
        {
          id: "clear",
          screenX: 300,
          screenY: 100,
          distanceFromCenter: 0.3,
          labelWidth: 100,
          priority: 1,
          inViewport: true,
        },
        {
          id: "offscreen",
          screenX: 500,
          screenY: 100,
          distanceFromCenter: 0.05,
          labelWidth: 100,
          priority: 3,
          inViewport: false,
        },
      ],
      5,
    );
    assert.deepEqual([...selected], ["priority", "clear"]);
  });

  test("keeps nearby readable labels and more rooms than the previous cap", () => {
    const candidates = Array.from({ length: 20 }, (_, index) => ({
      id: `room-${index}`,
      screenX: (index % 5) * 108,
      screenY: Math.floor(index / 5) * 52,
      distanceFromCenter: index / 20,
      labelWidth: 100,
      priority: 1,
      inViewport: true,
    }));
    assert.equal(
      selectRoomStatusOverlayIds(candidates, roomStatusOverlayLimitForWidth(1200)).size,
      10,
    );
    assert.equal(
      selectRoomStatusOverlayIds(candidates, roomStatusOverlayLimitForWidth(390)).size,
      6,
    );
    assert.equal(selectRoomStatusOverlayIds(candidates.slice(0, 8), 10).size, 8);
  });

  test("selects the exact room on click", async () => {
    const dom = new JSDOM("<!doctype html><div id='root'></div>", {
      url: "http://dashboard.local/",
    });
    const previous = {
      window: globalThis.window,
      document: globalThis.document,
      navigator: globalThis.navigator,
      HTMLElement: globalThis.HTMLElement,
      Event: globalThis.Event,
      actEnvironment: globalThis.IS_REACT_ACT_ENVIRONMENT,
    };
    Object.assign(globalThis, {
      window: dom.window,
      document: dom.window.document,
      navigator: dom.window.navigator,
      HTMLElement: dom.window.HTMLElement,
      Event: dom.window.Event,
      IS_REACT_ACT_ENVIRONMENT: true,
    });
    const selected = [];
    const root = createRoot(dom.window.document.getElementById("root"));
    try {
      await act(async () =>
        root.render(
          React.createElement(RoomStatusOverlayButton, {
            roomName: "Demo room",
            summary,
            onSelect: () => selected.push("demo-room"),
          }),
        ),
      );
      await act(async () => dom.window.document.querySelector("button").click());
      assert.deepEqual(selected, ["demo-room"]);

      await act(async () =>
        root.render(
          React.createElement(RoomStatusOverlayButton, {
            roomName: "Demo room",
            summary,
            visible: false,
            onSelect: () => selected.push("hidden-room"),
          }),
        ),
      );
      const hidden = dom.window.document.querySelector("button");
      assert.equal(hidden.getAttribute("aria-hidden"), "true");
      assert.equal(hidden.tabIndex, -1);
      await act(async () => hidden.click());
      assert.deepEqual(selected, ["demo-room"]);
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      Object.assign(globalThis, {
        window: previous.window,
        document: previous.document,
        navigator: previous.navigator,
        HTMLElement: previous.HTMLElement,
        Event: previous.Event,
        IS_REACT_ACT_ENVIRONMENT: previous.actEnvironment,
      });
    }
  });
});
