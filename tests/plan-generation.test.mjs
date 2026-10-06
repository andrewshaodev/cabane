import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const { buildPlanGenerationPrompt } = await load(
    "/apps/web/src/editor-plan-import/plan-generation-prompt.ts",
  );
  const { PlanImportActions } = await load(
    "/apps/web/src/editor-plan-import/PlanImportActions.tsx",
  );
  const { stageImportedWorkspace } = await load("/apps/web/src/editor-connect/profile-transfer.ts");
  const { createEmptyHomeProject, createSeedProjectRecord, validateHomeProject } = await load(
    "/packages/engine/src/index.ts",
  );
  const registries = { furnishingModels: {}, deviceModels: {} };
  const homeId = 'synthetic-home-"quoted"';
  const generated = createEmptyHomeProject(homeId, "Generated home");
  generated.seedRevision = "ai-plan-v1";
  const floor = generated.floors[0];
  const points = [
    [0, 0],
    [6, 0],
    [6, 4],
    [0, 4],
  ];
  floor.footprint = points;
  floor.walls = points.map((from, i) => ({
    id: `wall-${i}`,
    from,
    to: points[(i + 1) % 4],
    classification: "exterior",
    thicknessMeters: 0.2,
    heightMeters: 2.4,
  }));
  floor.wallJunctions = points.map((at, i) => ({
    id: `junction-${i}`,
    at,
    wallIds: [`wall-${(i + 3) % 4}`, `wall-${i}`],
  }));
  floor.rooms = [
    {
      id: "room-main",
      name: "Main room",
      polygon: points,
      accent: "#d48a54",
      devices: [],
      dashboardSlots: [],
    },
  ];
  floor.ceilings = [
    { id: "ceiling-main", kind: "flat", roomIds: ["room-main"], heightMeters: 2.4 },
  ];
  floor.openings = [
    {
      id: "door-entry",
      wallId: "wall-0",
      kind: "door",
      offsetFromWallStartPlanUnits: 1,
      widthPlanUnits: 0.9,
      openingHeightMeters: 2.1,
      sillHeightMeters: 0,
      operation: "hinged",
      variant: "panel",
      finish: "wood",
      leafCount: 1,
      hingeSide: "start",
      openingSide: "left",
    },
    {
      id: "door-slide",
      wallId: "wall-3",
      kind: "door",
      offsetFromWallStartPlanUnits: 1,
      widthPlanUnits: 0.9,
      openingHeightMeters: 2.1,
      sillHeightMeters: 0,
      operation: "sliding",
      variant: "plank",
      finish: "wood",
      leafCount: 1,
      openingSide: "left",
      slideDirection: "start",
    },
    {
      id: "door-garage",
      wallId: "wall-0",
      kind: "door",
      offsetFromWallStartPlanUnits: 3,
      widthPlanUnits: 2.4,
      openingHeightMeters: 2.1,
      sillHeightMeters: 0,
      operation: "roll-up",
      variant: "slatted",
      finish: "white",
      openingSide: "left",
    },
    {
      id: "window-main",
      wallId: "wall-1",
      kind: "window",
      offsetFromWallStartPlanUnits: 1,
      widthPlanUnits: 1.2,
      openingHeightMeters: 1.2,
      sillHeightMeters: 0.9,
      operation: "fixed",
      variant: "plain",
      panelCount: 1,
      glazing: "clear",
      hingeSide: "start",
      openingSide: "left",
    },
    {
      id: "passage-main",
      wallId: "wall-2",
      kind: "passage",
      offsetFromWallStartPlanUnits: 1,
      widthPlanUnits: 1,
      openingHeightMeters: 2.1,
      sillHeightMeters: 0,
      variant: "rectangular",
    },
  ];

  test("prompt embeds a complete scoped schema and its fields roundtrip through the real importer", () => {
    const prompt = buildPlanGenerationPrompt(homeId);
    const schema = JSON.parse(prompt.slice(prompt.indexOf('{\n  "$schema"')));
    assert.equal(schema.properties.home.properties.id.const, homeId);
    assert.equal(schema.properties.floors.maxItems, 1);
    assert.equal(schema.additionalProperties, false);
    assert.match(prompt, /offset = c - w\/2/);
    assert.match(prompt, /ask me for one known wall length/);
    for (const [definition, instance] of [
      [schema, generated],
      [schema.$defs.floor, floor],
      [schema.$defs.room, floor.rooms[0]],
      [schema.$defs.wall, floor.walls[0]],
      [schema.$defs.junction, floor.wallJunctions[0]],
      [schema.$defs.ceiling, floor.ceilings[0]],
      ...schema.$defs.opening.oneOf.map((definition, i) => [definition, floor.openings[i]]),
    ]) {
      assert.deepEqual(Object.keys(instance).sort(), definition.required.toSorted());
    }
    const validation = validateHomeProject(generated, registries);
    assert.equal(validation.valid, true, JSON.stringify(validation.issues));
    const record = createSeedProjectRecord(createEmptyHomeProject(homeId, "Blank"));
    const before = structuredClone(record);
    assert.deepEqual(
      stageImportedWorkspace(record, JSON.stringify(generated), registries).project,
      generated,
    );
    assert.deepEqual(record, before);
    const invalid = structuredClone(generated);
    invalid.floors[0].openings[0].widthPlanUnits = 100;
    assert.throws(() => stageImportedWorkspace(record, JSON.stringify(invalid), registries));
    assert.deepEqual(record, before);
  });

  test("prompt copy, clipboard fallback, and import errors are usable without changing the draft", async () => {
    const dom = new JSDOM('<div id="root"></div>', { url: "https://cabane.local" });
    const keys = ["window", "document", "navigator", "HTMLElement", "IS_REACT_ACT_ENVIRONMENT"];
    const previous = keys.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]);
    for (const key of keys)
      Object.defineProperty(globalThis, key, {
        value: key === "IS_REACT_ACT_ENVIRONMENT" ? true : dom.window[key],
        configurable: true,
        writable: true,
      });
    dom.window.HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute("open", "");
    };
    // React was loaded before JSDOM and uses its legacy focus-event fallback.
    dom.window.HTMLElement.prototype.attachEvent = () => {};
    dom.window.HTMLElement.prototype.detachEvent = () => {};
    const root = createRoot(document.getElementById("root"));
    let copied = "";
    let imported = null;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text) => {
          copied = text;
        },
      },
    });
    const click = async (label) => {
      const button = [...document.querySelectorAll("button")].find(
        (node) => node.textContent === label || node.getAttribute("aria-label") === label,
      );
      assert.ok(button, label);
      await act(async () => button.click());
    };
    try {
      await act(async () =>
        root.render(
          React.createElement(PlanImportActions, {
            homeId,
            disabled: false,
            onImport: (json) => {
              imported = stageImportedWorkspace(
                createSeedProjectRecord(createEmptyHomeProject(homeId, "Blank")),
                json,
                registries,
              );
            },
          }),
        ),
      );
      await click("Generate from a plan");
      await click("Copy instructions");
      assert.equal(copied, buildPlanGenerationPrompt(homeId));
      navigator.clipboard.writeText = async () => {
        throw new Error("Denied");
      };
      await click("Copy instructions again");
      assert.match(
        document.querySelector('[role="alert"]').textContent,
        /Clipboard access is unavailable/,
      );
      const instructions = document.querySelector("textarea");
      assert.equal(instructions.selectionEnd, instructions.value.length);
      await click("Close");
      await click("Import JSON");
      assert.equal(document.querySelector('button[type="submit"]').disabled, true);
      const paste = async (value) => {
        await act(async () => {
          const textarea = document.querySelector("textarea");
          Object.getOwnPropertyDescriptor(
            dom.window.HTMLTextAreaElement.prototype,
            "value",
          ).set.call(textarea, value);
          textarea.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
          textarea.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
        });
      };
      await paste("not json");
      await click("Import and replace draft");
      assert.equal(imported, null);
      assert.match(document.querySelector('[role="alert"]').textContent, /valid Cabane JSON/);
      await paste(JSON.stringify(generated));
      await click("Import and replace draft");
      assert.deepEqual(imported.project, generated);
      assert.equal(document.querySelector("dialog"), null);
      assert.match(
        document.querySelector('[role="status"]').textContent,
        /Imported into your draft/,
      );
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      for (const [key, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
    }
  });
});
