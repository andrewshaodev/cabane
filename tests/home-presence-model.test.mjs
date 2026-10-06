import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";
import { connectedRuntimeFixture } from "./fixtures/home-assistant.mjs";

await withModules(async (load) => {
  const { deriveHomePresence } = await load(
    "/packages/engine/src/home-presence/model.ts",
  );

  const addPerson = (runtime, id, state, overrides = {}) => {
    const entityId = `person.${id}`;
    runtime.entityRegistry.push({
      entity_id: entityId,
      area_id: null,
      device_id: null,
      platform: "person",
      disabled_by: null,
      hidden_by: null,
      name: null,
      original_name: null,
      ...overrides.registry,
    });
    runtime.entityStates[entityId] = {
      entityId,
      state,
      attributes: {
        friendly_name: overrides.name,
        latitude: 48.8,
        longitude: 2.3,
        source: `device_tracker.${id}`,
      },
      available: !["unknown", "unavailable"].includes(state),
      stale: false,
      ...overrides.snapshot,
    };
  };

  test("lists only confirmed people at home in stable display-name order", () => {
    const runtime = connectedRuntimeFixture();
    addPerson(runtime, "zoe", "home", { name: "Zoë" });
    addPerson(runtime, "alex", "home", { name: "Alex" });
    addPerson(runtime, "marc", "work", { name: "Marc" });

    assert.deepEqual(deriveHomePresence(runtime), {
      state: "present",
      people: [
        { entityId: "person.alex", name: "Alex" },
        { entityId: "person.zoe", name: "Zoë" },
      ],
    });
  });

  test("treats not_home and named zones as reliably away", () => {
    const runtime = connectedRuntimeFixture();
    addPerson(runtime, "alex", "not_home", { name: "Alex" });
    addPerson(runtime, "marc", "work", { name: "Marc" });

    assert.deepEqual(deriveHomePresence(runtime), {
      state: "empty",
      people: [],
    });
  });

  test("does not claim an empty home while any person state is unreliable", () => {
    for (const prepare of [
      (runtime) => addPerson(runtime, "alex", "unknown", { name: "Alex" }),
      (runtime) => addPerson(runtime, "alex", "unavailable", { name: "Alex" }),
      (runtime) => addPerson(runtime, "alex", "not_home", {
        name: "Alex",
        snapshot: { stale: true },
      }),
      (runtime) => {
        addPerson(runtime, "alex", "not_home", { name: "Alex" });
        addPerson(runtime, "marc", "unknown", { name: "Marc" });
      },
    ]) {
      const runtime = connectedRuntimeFixture();
      prepare(runtime);
      assert.deepEqual(deriveHomePresence(runtime), {
        state: "unavailable",
        people: [],
      });
    }
  });

  test("keeps confirmed people visible when another person's state is unreliable", () => {
    const runtime = connectedRuntimeFixture();
    addPerson(runtime, "alex", "home", { name: "Alex" });
    addPerson(runtime, "marc", "unknown", { name: "Marc" });

    assert.deepEqual(deriveHomePresence(runtime), {
      state: "present",
      people: [{ entityId: "person.alex", name: "Alex" }],
    });
  });

  test("ignores hidden and disabled people and hides the summary when none remain", () => {
    const runtime = connectedRuntimeFixture();
    addPerson(runtime, "hidden", "home", {
      name: "Hidden",
      registry: { hidden_by: "user" },
    });
    addPerson(runtime, "disabled", "home", {
      name: "Disabled",
      registry: { disabled_by: "user" },
    });

    assert.equal(deriveHomePresence(runtime), null);
  });

  test("uses registry names and readable entity ids as deterministic fallbacks", () => {
    const runtime = connectedRuntimeFixture();
    addPerson(runtime, "jane_doe", "home", {
      registry: { name: "Jane" },
    });
    addPerson(runtime, "john_smith", "home");

    assert.deepEqual(deriveHomePresence(runtime), {
      state: "present",
      people: [
        { entityId: "person.jane_doe", name: "Jane" },
        { entityId: "person.john_smith", name: "John Smith" },
      ],
    });
  });
});
