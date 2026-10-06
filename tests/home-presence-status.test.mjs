import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const { HomePresenceStatus } = await load(
    "/packages/engine/src/home-presence/HomePresenceStatus.tsx",
  );

  test("renders present names with concise accessible text", () => {
    const html = renderToStaticMarkup(React.createElement(HomePresenceStatus, {
      summary: {
        state: "present",
        people: [
          { entityId: "person.alex", name: "Alex" },
          { entityId: "person.sam", name: "Sam" },
        ],
      },
    }));

    assert.match(html, /aria-label="At home: Alex, Sam"/);
    assert.match(html, /<strong>At home<\/strong>/);
    assert.match(html, /Alex, Sam/);
    assert.match(html, /data-presence-state="present"/);
  });

  test("renders distinct empty and unavailable states", () => {
    const empty = renderToStaticMarkup(React.createElement(HomePresenceStatus, {
      summary: { state: "empty", people: [] },
    }));
    const unavailable = renderToStaticMarkup(React.createElement(HomePresenceStatus, {
      summary: { state: "unavailable", people: [] },
    }));

    assert.match(empty, /aria-label="Nobody home"/);
    assert.match(empty, /data-presence-state="empty"/);
    assert.match(empty, /Nobody home/);
    assert.match(unavailable, /aria-label="Presence unavailable"/);
    assert.match(unavailable, /data-presence-state="unavailable"/);
    assert.match(unavailable, /Presence unavailable/);
  });
});
