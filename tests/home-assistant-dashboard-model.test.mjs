import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";
import {
  connectedManifestFixture,
  connectedProfileFixture,
  connectedRuntimeFixture,
} from "./fixtures/home-assistant.mjs";

await withModules(async (load) => {
  const { neutralDemoManifest } = await load("/packages/engine/src/demo.ts");
  const { resolveHomeAssistantBindings } = await load("/packages/engine/src/home-assistant-resolver.ts");
  const { buildRoomModules, focusedDeviceModule, safeIssueMessage } = await load("/packages/engine/src/home-assistant-dashboard/module-model.ts");

  const resolvedRoom = () => resolveHomeAssistantBindings(
    connectedManifestFixture(neutralDemoManifest),
    connectedProfileFixture(),
    connectedRuntimeFixture(),
  ).rooms["demo-room"];

  test("normalizes device and dashboard bindings into one ordered module list", () => {
    const modules = buildRoomModules(resolvedRoom());

    assert.deepEqual(modules.map(({ id }) => id), [
      "device:fixture-light-device",
      "slot:demo-climate-slot",
      "device:fixture-speaker-device",
      "slot:demo-coffee-slot",
      "slot:demo-quiet-slot",
      "slot:demo-cover-slot",
      "slot:demo-fan-slot",
      "slot:demo-humidifier-slot",
      "slot:demo-water-heater-slot",
      "slot:demo-vacuum-slot",
      "slot:demo-lock-slot",
      "slot:demo-alarm-slot",
      "slot:demo-valve-slot",
      "slot:demo-siren-slot",
      "slot:demo-select-slot",
      "slot:demo-number-slot",
      "slot:demo-button-slot",
      "slot:demo-temperature-slot",
    ]);
    assert.deepEqual(modules.map(({ priority }) => priority), [
      "primary",
      "primary",
      "secondary",
      "secondary",
      "secondary",
      "secondary",
      "secondary",
      "secondary",
      "secondary",
      "secondary",
      "secondary",
      "secondary",
      "secondary",
      "secondary",
      "secondary",
      "secondary",
      "secondary",
      "diagnostic",
    ]);
  });

  test("focuses a device module with its exact profile-bound entity scope", () => {
    const module = focusedDeviceModule(buildRoomModules(resolvedRoom()), "fixture-light-device");

    assert.equal(module?.label, "Ceiling light");
    assert.equal(module?.deviceSlotId, "fixture-light-device");
    assert.deepEqual(module?.entities.map(({ entityId }) => entityId), ["light.demo_ceiling"]);
    assert.equal(module?.entities.some(({ entityId }) => entityId === "light.unmodeled_path"), false);
  });

  test("returns no focused module for null or unknown device ids", () => {
    const modules = buildRoomModules(resolvedRoom());

    assert.equal(focusedDeviceModule(modules, null), undefined);
    assert.equal(focusedDeviceModule(modules, "not-modeled"), undefined);
  });

  test("maps a hidden primary device slot to secondary priority", () => {
    const resolved = structuredClone(resolvedRoom());
    resolved.room.devices[0].entitySlots[0].presentation.dashboardRole = "hidden";

    const module = buildRoomModules(resolved).find(({ deviceSlotId }) => deviceSlotId === "fixture-light-device");

    assert.equal(module?.priority, "secondary");
  });

  test("places dashboard entities missing from the manifest slot order after known slots", () => {
    const resolved = structuredClone(resolvedRoom());
    resolved.room.dashboardSlots = resolved.room.dashboardSlots.filter(({ id }) => id !== "demo-coffee-slot");

    const secondaryIds = buildRoomModules(resolved)
      .filter(({ priority }) => priority === "secondary")
      .map(({ id }) => id);

    assert.deepEqual(secondaryIds, [
      "device:fixture-speaker-device",
      "slot:demo-quiet-slot",
      "slot:demo-cover-slot",
      "slot:demo-fan-slot",
      "slot:demo-humidifier-slot",
      "slot:demo-water-heater-slot",
      "slot:demo-vacuum-slot",
      "slot:demo-lock-slot",
      "slot:demo-alarm-slot",
      "slot:demo-valve-slot",
      "slot:demo-siren-slot",
      "slot:demo-select-slot",
      "slot:demo-number-slot",
      "slot:demo-button-slot",
      "slot:demo-coffee-slot",
    ]);
  });

  test("uses safe messages for every binding issue code", () => {
    const sensitive = ["internal-sensitive-message", "light.secret_entity", "secret-slot", "private.path"];
    const cases = [
      ["binding.slot-unmapped", "Room light is not connected yet."],
      ["binding.unavailable", "Room light is currently unavailable."],
      ["binding.area-mismatch", "Room light is assigned to a different Home Assistant area."],
      ["binding.domain-incompatible", "Room light is connected to an incompatible entity type."],
      ["binding.device-class-incompatible", "Room light is connected to an incompatible device type."],
      ["binding.disabled", "Room light is disabled in Home Assistant."],
      ["binding.hidden", "Room light is hidden in Home Assistant."],
      ["binding.registry-missing", "Room light needs its connection reviewed."],
    ];

    for (const [code, expected] of cases) {
      const output = safeIssueMessage("Room light", {
        code,
        severity: "error",
        path: sensitive[3],
        message: sensitive[0],
        entityId: sensitive[1],
        slotId: sensitive[2],
      });
      assert.equal(output, expected);
      for (const value of sensitive) assert.equal(output.includes(value), false);
    }
  });
});
