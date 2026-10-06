import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { create } from "@react-three/test-renderer";
import { withModules } from "./test-server.mjs";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Source-policy assertions span the editor's responsibility modules; behavior
// tests above continue to mount the public HomeEditor entry point.
async function readEditorSource() {
  return (
    await Promise.all(
      [
        "apps/web/src/HomeEditor.tsx",
        ...(await readdir("apps/web/src/editor-workspace"))
          .filter((name) => /\.tsx?$/.test(name))
          .map((name) => `apps/web/src/editor-workspace/${name}`),
      ].map((path) => readFile(path, "utf8")),
    )
  ).join("\n");
}

await withModules(async (load) => {
  const {
    ownerEditorResolvedBindings,
    ownerHomeProject,
    ownerProjectManifest,
    ownerSceneDeviceItems,
    homeExtensions,
    homeManifest,
  } = await load("/tests/fixtures/bundled-home.ts");
  const { stableDeviceRegistry } = await load("/packages/catalog/src/device/index.ts");
  const ownerDeviceModels = {
    ...stableDeviceRegistry,
    ...homeExtensions.deviceModels,
  };
  const { SceneItemRenderer, createSeedProjectRecord } = await load(
    "/packages/engine/src/index.ts",
  );
  const { useHomeEditorController } = await load(
    "/apps/web/src/editor-workspace/useHomeEditorController.ts",
  );
  const { HomeEditor } = await load("/apps/web/src/HomeEditor.tsx");

  test("action bar panel keeps slot edits in draft history until Save", async () => {
    const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: "http://cabane.local/" });
    const names = [
      "window",
      "document",
      "navigator",
      "screen",
      "HTMLElement",
      "ResizeObserver",
      "addEventListener",
      "removeEventListener",
    ];
    const previous = Object.fromEntries(
      names.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]),
    );
    const ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    dom.window.ResizeObserver = ResizeObserver;
    for (const name of names)
      Object.defineProperty(globalThis, name, {
        configurable: true,
        writable: true,
        value:
          name === "ResizeObserver"
            ? ResizeObserver
            : name.endsWith("EventListener")
              ? dom.window[name].bind(dom.window)
              : dom.window[name],
      });
    const root = createRoot(dom.window.document.getElementById("root"));
    const record = createSeedProjectRecord(ownerHomeProject, 1);
    const closed = [];
    const lifecycle = {
      autosave: async (current, draft, _now, bindings) => ({
        status: "saved",
        record: { ...current, draft, bindings, revision: current.revision + 1 },
      }),
      resetDraftToPublished: async (current) => ({
        status: "saved",
        record: {
          ...current,
          draft: structuredClone(current.published),
          revision: current.revision + 1,
        },
      }),
      publish: async (current) => ({
        status: "published",
        record: {
          ...current,
          published: current.draft,
          publishedAt: 2,
          revision: current.revision + 1,
        },
      }),
    };
    const button = (label) =>
      [...dom.window.document.querySelectorAll("button")].find(
        (entry) => entry.getAttribute("aria-label") === label || entry.textContent === label,
      );
    try {
      await act(async () =>
        root.render(
          createElement(HomeEditor, {
            initialRecord: record,
            lifecycle,
            onClose: (next) => closed.push(next),
            initialRequest: { mode: "construct", panel: "action-bar" },
          }),
        ),
      );
      assert.equal(
        dom.window.document.querySelector(".direction-preview__model"),
        null,
        "Shortcuts does not mount the 3D scene",
      );
      assert.equal(button("Shortcuts")?.getAttribute("aria-pressed"), "true");
      assert.ok(button("Add shortcut"));
      await act(async () => button("Add shortcut").click());
      await act(async () => button("Add room").click());
      await act(async () => button(ownerHomeProject.floors[0].rooms[0].name).click());
      assert.ok(button(`Edit ${ownerHomeProject.floors[0].rooms[0].name} shortcut`));
      await act(async () => button("Undo").click());
      assert.equal(button(`Edit ${ownerHomeProject.floors[0].rooms[0].name} shortcut`), undefined);
      await act(async () => button("Redo").click());
      assert.ok(button(`Edit ${ownerHomeProject.floors[0].rooms[0].name} shortcut`));
      dom.window.confirm = () => false;
      await act(async () => button("Reset changes").click());
      assert.ok(button(`Edit ${ownerHomeProject.floors[0].rooms[0].name} shortcut`));
      dom.window.confirm = () => true;
      await act(async () => button("Reset changes").click());
      assert.equal(button(`Edit ${ownerHomeProject.floors[0].rooms[0].name} shortcut`), undefined);
      assert.equal(button("Reset changes").disabled, true);
      assert.equal(button("Undo").disabled, true);
      await act(async () => button("Back").click());
      assert.equal(closed.length, 1);
      assert.equal(closed[0].draft.actionBar, undefined);
      assert.equal(closed[0].published.actionBar, undefined);
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      for (const name of names) {
        if (previous[name]) Object.defineProperty(globalThis, name, previous[name]);
        else delete globalThis[name];
      }
    }
  });

  test("floor removal restores through undo and redo without changing the lower floor", async () => {
    const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: "http://cabane.local/" });
    const names = [
      "window",
      "document",
      "navigator",
      "screen",
      "HTMLElement",
      "ResizeObserver",
      "addEventListener",
      "removeEventListener",
    ];
    const previous = Object.fromEntries(
      names.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]),
    );
    const ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    dom.window.ResizeObserver = ResizeObserver;
    for (const name of names)
      Object.defineProperty(globalThis, name, {
        configurable: true,
        writable: true,
        value:
          name === "ResizeObserver"
            ? ResizeObserver
            : name.endsWith("EventListener")
              ? dom.window[name].bind(dom.window)
              : dom.window[name],
      });
    const root = createRoot(dom.window.document.getElementById("root"));
    const record = createSeedProjectRecord(ownerHomeProject, 1);
    const profile = {
      schemaVersion: 1,
      homeId: record.homeId,
      roomAreaIds: {},
      entityIdsBySlotId: {},
    };
    record.bindings = {
      "https://fixture.invalid": {
        draft: profile,
        published: profile,
        manualRoomIds: [],
        manualSlotIds: [],
      },
    };
    dom.window.HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute("open", "");
    };
    const lifecycle = {
      autosave: async (current, draft, _now, bindings) => ({
        status: "saved",
        record: { ...current, draft, bindings, revision: current.revision + 1 },
      }),
    };
    const button = (label) =>
      [...dom.window.document.querySelectorAll("button")].find(
        (entry) => entry.getAttribute("aria-label") === label || entry.textContent === label,
      );
    const click = async (label) => {
      assert.ok(button(label), label);
      await act(async () => button(label).click());
    };
    try {
      await act(async () =>
        root.render(
          createElement(HomeEditor, {
            initialRecord: record,
            lifecycle,
            onClose: () => {},
            initialRequest: { mode: "construct" },
          }),
        ),
      );
      const expand = async (label) => {
        await act(async () => {
          button(label).blur();
          button(label).focus();
        });
      };
      await expand("Ground floor");
      await click("Manage floors");
      await click("Add floor above");
      assert.equal(button("Floor 2").getAttribute("aria-pressed"), "true");
      await expand("Floor 2");
      await click("Manage floors");
      await click("Remove floor");
      await click("Remove floor");
      assert.equal(button("Floor 2"), undefined);
      await click("Undo");
      assert.ok(button("Floor 2"));
      await click("Redo");
      assert.equal(button("Floor 2"), undefined);
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      for (const name of names) {
        if (previous[name]) Object.defineProperty(globalThis, name, previous[name]);
        else delete globalThis[name];
      }
    }
  });

  test("HomeEditor reviews errors, saves warnings directly, locks chrome and closes with the published home", async () => {
    const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: "http://cabane.local/" });
    const names = [
      "window",
      "document",
      "navigator",
      "screen",
      "HTMLElement",
      "ResizeObserver",
      "addEventListener",
      "removeEventListener",
    ];
    const previous = Object.fromEntries(
      names.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]),
    );
    const ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    dom.window.ResizeObserver = ResizeObserver;
    for (const name of names)
      Object.defineProperty(globalThis, name, {
        configurable: true,
        writable: true,
        value:
          name === "ResizeObserver"
            ? ResizeObserver
            : name.endsWith("EventListener")
              ? dom.window[name].bind(dom.window)
              : dom.window[name],
      });
    const root = createRoot(dom.window.document.getElementById("root"));
    const record = createSeedProjectRecord(ownerHomeProject, 1);
    record.publishedAt = 0;
    record.draft.sceneItems.find((item) => item.kind === "furnishing").modelId =
      "fixture-unavailable-model";
    const profile = {
      schemaVersion: 1,
      homeId: record.homeId,
      roomAreaIds: {},
      entityIdsBySlotId: {},
    };
    record.bindings = {
      "https://fixture.invalid": {
        draft: profile,
        published: profile,
        manualRoomIds: [],
        manualSlotIds: [],
      },
    };
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    const calls = [];
    const closed = [];
    const lifecycle = {
      autosave: async (current, draft, _now, bindings) => ({
        status: "saved",
        record: { ...current, draft, bindings, revision: current.revision + 1 },
      }),
      publish: async (current) => {
        calls.push(current);
        await gate;
        return {
          status: "published",
          record: {
            ...current,
            published: current.draft,
            publishedAt: 2,
            revision: current.revision + 1,
          },
        };
      },
    };
    const button = (label) =>
      [...dom.window.document.querySelectorAll("button")].find(
        (entry) => entry.textContent === label,
      );
    try {
      const invalid = structuredClone(record);
      invalid.draft.floors[0].rooms[0].name = "";
      await act(async () =>
        root.render(
          createElement(HomeEditor, {
            key: "errors",
            initialRecord: invalid,
            lifecycle,
            onClose: (next) => closed.push(next),
          }),
        ),
      );
      await act(async () => button("Save").click());
      assert.match(dom.window.document.getElementById("publish-title").textContent, /to fix/);
      assert.equal(calls.length, 0, "errors still block publication");
      assert.equal(closed.length, 0);
      assert.equal(button("Save anyway").disabled, true);
      await act(async () => button("Cancel").click());
      await act(async () =>
        root.render(
          createElement(HomeEditor, {
            key: "warnings",
            initialRecord: record,
            lifecycle,
            onClose: (next) => closed.push(next),
          }),
        ),
      );
      assert.equal(button("Back").disabled, true, "Back is unavailable before the first save");
      await act(async () => button("Save").click());
      assert.equal(dom.window.document.querySelector('[aria-labelledby="publish-title"]'), null);
      assert.equal(calls.length, 1);
      assert.equal(button("Back").disabled, true);
      assert.equal(button("Save").disabled, true);
      assert.ok(dom.window.document.querySelector(".direction-rail").hasAttribute("inert"));
      await act(async () => {
        release();
        await gate;
      });
      assert.equal(closed.length, 1);
      assert.deepEqual(closed[0].published, calls[0].draft);
      assert.deepEqual(closed[0].bindings, record.bindings);
      assert.equal(dom.window.document.querySelector('[aria-labelledby="publish-title"]'), null);
    } catch (error) {
      if (error instanceof AggregateError)
        throw new Error(error.errors.map((entry) => entry.stack).join("\n"), { cause: error });
      throw error;
    } finally {
      release();
      await act(async () => root.unmount());
      dom.window.close();
      for (const name of names) {
        if (previous[name]) Object.defineProperty(globalThis, name, previous[name]);
        else delete globalThis[name];
      }
    }
  });

  test("copy and paste duplicate the remembered selection in Construct and Arrange", async () => {
    const renderEditor = async (initialRequest, run) => {
      const dom = new JSDOM('<!doctype html><div id="root"></div>', {
        url: "http://cabane.local/",
      });
      const names = [
        "window",
        "document",
        "navigator",
        "screen",
        "HTMLElement",
        "ResizeObserver",
        "IntersectionObserver",
        "addEventListener",
        "removeEventListener",
      ];
      const previous = Object.fromEntries(
        names.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]),
      );
      const ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
      const IntersectionObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
      dom.window.ResizeObserver = ResizeObserver;
      dom.window.IntersectionObserver = IntersectionObserver;
      for (const name of names)
        Object.defineProperty(globalThis, name, {
          configurable: true,
          writable: true,
          value:
            name === "ResizeObserver"
              ? ResizeObserver
              : name === "IntersectionObserver"
                ? IntersectionObserver
                : name.endsWith("EventListener")
                  ? dom.window[name].bind(dom.window)
                  : dom.window[name],
        });
      const root = createRoot(dom.window.document.getElementById("root"));
      const record = createSeedProjectRecord(ownerHomeProject, 1);
      let publishedProject = null;
      let controller;
      function ConstructHarness(props) {
        controller = useHomeEditorController(props);
        return null;
      }
      const lifecycle = {
        autosave: async (current, draft, _now, bindings) => ({
          status: "saved",
          record: { ...current, draft, bindings, revision: current.revision + 1 },
        }),
        publish: async (current) => {
          publishedProject = current.draft;
          return {
            status: "published",
            record: {
              ...current,
              published: current.draft,
              publishedAt: 2,
              revision: current.revision + 1,
            },
          };
        },
      };
      try {
        await act(async () =>
          root.render(
            createElement(initialRequest.mode === "construct" ? ConstructHarness : HomeEditor, {
              initialRecord: record,
              lifecycle,
              initialRequest,
              onClose() {},
            }),
          ),
        );
        await run({
          dom,
          record,
          getPublishedProject: () => publishedProject,
          getController: () => controller,
        });
      } catch (error) {
        if (error instanceof AggregateError)
          throw new Error(error.errors.map((entry) => entry.stack).join("\n"), { cause: error });
        throw error;
      } finally {
        await act(async () => root.unmount());
        dom.window.close();
        for (const name of names) {
          if (previous[name]) Object.defineProperty(globalThis, name, previous[name]);
          else delete globalThis[name];
        }
      }
    };
    const shortcut = (window, key, modifier) =>
      window.dispatchEvent(
        new window.KeyboardEvent("keydown", {
          key,
          bubbles: true,
          cancelable: true,
          [modifier]: true,
        }),
      );

    await renderEditor({ mode: "construct" }, async ({ dom, record, getController }) => {
      const document = dom.window.document;
      assert.equal(shortcut(dom.window, "c", "ctrlKey"), true);
      assert.equal(shortcut(dom.window, "v", "ctrlKey"), true);
      const source = record.draft.floors[0].openings[0];
      await act(async () => getController().constructEditor.selectOpening(source.id));
      const openingCount = () => getController().constructEditor.draft.openings.length;
      const before = openingCount();
      await act(async () => {
        assert.equal(shortcut(dom.window, "c", "ctrlKey"), false);
      });
      assert.equal(openingCount(), before, "copy alone does not mutate the floor");
      const input = document.body.appendChild(document.createElement("input"));
      await act(async () =>
        assert.equal(
          input.dispatchEvent(
            new dom.window.KeyboardEvent("keydown", {
              key: "v",
              ctrlKey: true,
              bubbles: true,
              cancelable: true,
            }),
          ),
          true,
        ),
      );
      assert.equal(openingCount(), before, "shortcuts stay inactive in editable fields");
      await act(async () => {
        assert.equal(shortcut(dom.window, "v", "ctrlKey"), false);
      });
      assert.equal(openingCount(), before + 1);
      assert.equal(getController().constructEditor.selection.id, `${source.id}-copy`);
      await act(async () => getController().constructEditor.selectOpening(source.id));
      await act(async () => {
        assert.equal(shortcut(dom.window, "c", "ctrlKey"), false);
      });
      await act(async () => {
        assert.equal(
          dom.window.dispatchEvent(
            new dom.window.KeyboardEvent("keydown", {
              key: "Delete",
              bubbles: true,
              cancelable: true,
            }),
          ),
          false,
        );
      });
      assert.equal(openingCount(), before);
      await act(async () => {
        assert.equal(shortcut(dom.window, "v", "ctrlKey"), false);
      });
      assert.equal(openingCount(), before, "a removed copied source cannot be pasted");
      await act(async () => getController().selectMode("furnish"));
      assert.equal(
        shortcut(dom.window, "v", "ctrlKey"),
        true,
        "a copied opening is inactive in Arrange",
      );
    });

    const furnishing = ownerHomeProject.sceneItems.find((item) => item.kind === "furnishing");
    await renderEditor(
      { mode: "furnish", arrange: { selectedItemId: furnishing.id } },
      async ({ dom, getPublishedProject }) => {
        const document = dom.window.document;
        await act(async () => {
          assert.equal(shortcut(dom.window, "c", "metaKey"), false);
        });
        const input = document.body.appendChild(document.createElement("input"));
        await act(async () =>
          assert.equal(
            input.dispatchEvent(
              new dom.window.KeyboardEvent("keydown", {
                key: "v",
                metaKey: true,
                bubbles: true,
                cancelable: true,
              }),
            ),
            true,
          ),
        );
        await act(async () => {
          assert.equal(shortcut(dom.window, "v", "metaKey"), false);
        });
        const button = (label) =>
          [...document.querySelectorAll("button")].find((entry) => entry.textContent === label);
        await act(async () => button("Save").click());
        assert.equal(document.querySelector('[aria-labelledby="publish-title"]'), null);
        const originalIds = new Set(ownerHomeProject.sceneItems.map((item) => item.id));
        const copies = getPublishedProject().sceneItems.filter((item) => !originalIds.has(item.id));
        assert.equal(copies.length, 1);
        assert.equal(copies[0].modelId, furnishing.modelId);
      },
    );
  });

  test("the recovery button passes the rejected raw snapshot to guarded recovery and surfaces stale errors", async () => {
    const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: "http://cabane.local/" });
    const names = ["window", "document", "navigator", "HTMLElement"];
    const previous = Object.fromEntries(
      names.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]),
    );
    for (const name of names)
      Object.defineProperty(globalThis, name, {
        configurable: true,
        writable: true,
        value: dom.window[name],
      });
    const root = createRoot(dom.window.document.getElementById("root"));
    const record = createSeedProjectRecord(ownerHomeProject, 1);
    const raw = "{corrupt-fixture";
    const resetCalls = [];
    const repairCalls = [];
    const lifecycle = {
      resetToSeed: async () => {
        throw new Error("Ordinary revision reset must not handle recovery.");
      },
      recoverToSeed: async (...args) => {
        resetCalls.push(args);
        return {
          status: "storage-error",
          record,
          error: new Error("The workspace changed in another tab."),
        };
      },
      recoverWithoutMissingSceneItems: async (...args) => {
        repairCalls.push(args);
        return {
          status: "storage-error",
          record,
          error: new Error("The workspace changed in another tab."),
        };
      },
    };
    try {
      await act(async () =>
        root.render(
          createElement(HomeEditor, {
            initialRecord: record,
            lifecycle,
            recoveryMessage: "Invalid saved record.",
            recoveryRaw: raw,
            onClose() {},
          }),
        ),
      );
      const repairButton = [...dom.window.document.querySelectorAll("button")].find(
        (entry) => entry.textContent === "Remove unavailable items and continue",
      );
      await act(async () => repairButton.click());
      assert.deepEqual(repairCalls, [[record, raw]]);
      assert.match(dom.window.document.body.textContent, /workspace changed in another tab/);
      const button = [...dom.window.document.querySelectorAll("button")].find(
        (entry) => entry.textContent === "Reset to empty home",
      );
      dom.window.confirm = () => false;
      await act(async () => button.click());
      assert.deepEqual(resetCalls, []);
      dom.window.confirm = () => true;
      await act(async () => button.click());
      assert.deepEqual(resetCalls, [[record, raw]]);
      assert.match(dom.window.document.body.textContent, /workspace changed in another tab/);
      await act(async () =>
        root.render(
          createElement(HomeEditor, {
            key: "missing-raw",
            initialRecord: record,
            lifecycle,
            recoveryMessage: "Storage unavailable.",
            onClose() {},
          }),
        ),
      );
      assert.equal(
        [...dom.window.document.querySelectorAll("button")].find(
          (entry) => entry.textContent === "Reset to empty home",
        ).disabled,
        true,
      );
      assert.equal(
        [...dom.window.document.querySelectorAll("button")].find(
          (entry) => entry.textContent === "Remove unavailable items and continue",
        ).disabled,
        true,
      );
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
      for (const name of names) {
        if (previous[name]) Object.defineProperty(globalThis, name, previous[name]);
        else delete globalThis[name];
      }
    }
  });
  test("the editor consumes the bundled project directly with empty runtime bindings", () => {
    assert.deepEqual(homeManifest.sceneItems, ownerHomeProject.sceneItems);
    assert.deepEqual(
      ownerSceneDeviceItems,
      ownerHomeProject.sceneItems.filter((item) => item.kind === "device"),
    );
    assert.ok(ownerHomeProject.sceneItems.some((item) => item.kind === "furnishing"));
    assert.equal(ownerEditorResolvedBindings.issues.length, 0);
    for (const room of Object.values(ownerEditorResolvedBindings.rooms)) {
      for (const device of room.devices) assert.deepEqual(device.entities, []);
    }
  });

  test("renders all preview furnishings and devices once without Home Assistant", async () => {
    const deviceById = Object.fromEntries(
      Object.values(ownerEditorResolvedBindings.rooms).flatMap((room) =>
        room.devices.map((device) => [device.slot.id, device]),
      ),
    );
    const renderer = await create(
      createElement(
        "group",
        {},
        ...ownerProjectManifest.sceneItems.map((item) =>
          createElement(SceneItemRenderer, {
            key: item.id,
            item,
            floor: ownerProjectManifest.floors.find((floor) => floor.id === item.floorId),
            furnishingModels: ownerProjectManifest.extensions.furnishingModels,
            deviceModels: ownerDeviceModels,
            resolvedDevice:
              item.kind === "device"
                ? (deviceById[item.id] ?? {
                    slot: {
                      id: item.id,
                      model: item.modelId,
                      entitySlots: item.entitySlots,
                      placement: {
                        at: [0, 0],
                        elevationMeters: 0,
                        support: { kind: "surface" },
                      },
                    },
                    entities: [],
                    issues: [],
                  })
                : undefined,
            entityStatesBySlotId: {},
            reducedMotion: true,
            walkMode: false,
            onInteract: () => undefined,
            liveMediaByEntityId: {},
          }),
        ),
      ),
    );
    const groups = renderer.scene
      .findAll(
        (node) => typeof node.props.name === "string" && node.props.name.startsWith("scene-item-"),
      )
      .map((node) => node.props.name);
    assert.equal(groups.length, ownerProjectManifest.sceneItems.length);
    assert.equal(new Set(groups).size, ownerProjectManifest.sceneItems.length);
    await renderer.unmount();
  });
});

test("the product opens the unified editor and exposes its approved chrome", async () => {
  const [main, editor, app, dashboard, host] = await Promise.all([
    readFile("apps/web/src/main.tsx", "utf8"),
    readEditorSource(),
    readFile("packages/engine/src/CabaneApp.tsx", "utf8"),
    readFile("packages/engine/src/useDashboardController.ts", "utf8"),
    readFile("apps/web/src/ConnectedProduct.tsx", "utf8"),
  ]);
  assert.doesNotMatch(main, /editor-preview/);
  assert.match(main, /<WorkspaceApplication/);
  assert.doesNotMatch(main, /<HomeAssistantRuntimeProvider/);
  const workspaceHost = await readFile("apps/web/src/workspaces/WorkspaceHost.tsx", "utf8");
  assert.match(workspaceHost, /<HomeAssistantRuntimeProvider/);
  assert.match(workspaceHost, /<ConnectedProduct/);
  assert.match(app, /onEditHome=\{onEditHome\}/);
  assert.match(dashboard, /case "construct-mode":\s*onEditHome\?\.\("construct"\)/);
  assert.match(dashboard, /case "arrange-mode":\s*onEditHome\?\.\("furnish"\)/);
  assert.doesNotMatch(app, /FloorLayoutEditor/);
  assert.match(
    editor,
    /<EditorModeNav mode=\{shortcutsMode \? "shortcuts" : mode\} onModeChange=\{onModeTabChange\}/,
  );
  assert.match(editor, /<EditorActionBar/);
  assert.match(editor, /onUndo=\{undoProject\}/);
  assert.match(editor, /onRedo=\{redoProject\}/);
  assert.match(editor, /cabane-icon\.png/);
  assert.doesNotMatch(
    editor,
    /Coming later|Home model|direction-gesture|direction-rail__heading|ConnectRail/,
  );
  assert.match(editor, />\s*3D\s*</);
  assert.match(editor, />\s*2D\s*</);
  assert.match(editor, /wallFadeEnabled=\{cameraView === "3d"\}/);
  assert.doesNotMatch(editor, />Fit<|>Top</);
  assert.match(editor, /handleConstructShortcut/);
  assert.match(editor, /input, textarea, select/);
  assert.match(editor, /key === "v"/);
  assert.match(editor, /key === "w"/);
  assert.match(editor, /key === "d"/);
  assert.match(editor, /key === "n"/);
  assert.match(editor, /key === "a"/);
  assert.match(editor, /key === "delete"/);
  assert.match(editor, /<ConstructionEditLayer/);
  assert.match(editor, /onPlaceOpening=\{constructEditor\.placeOpening\}/);
  assert.match(editor, /<ConstructionInspector/);
  assert.match(editor, /<FurnishingEditLayer/);
  assert.match(editor, /<FurnishingInspector/);
  assert.match(editor, /shadows=\{false\}/);
  assert.match(editor, /powerPreference: "high-performance"/);
  const applySuccess = editor.slice(
    editor.indexOf('if (result.status === "published")'),
    editor.indexOf('if (result.status === "storage-error")'),
  );
  assert.match(applySuccess, /setPublishOpen\(false\)/);
  assert.match(applySuccess, /onClose\(result\.record, "applied"\)/);
  assert.match(editor, /onClose\(result\.record, "draft-saved"\)/);

  assert.match(host, /setConstructionApplied\(reason === "applied"\)/);
  assert.match(host, /constructionApplied=\{constructionApplied\}/);
  assert.match(
    await readFile(
      new URL("../packages/engine/src/onboarding/OnboardingExperience.tsx", import.meta.url),
      "utf8",
    ),
    /useSetupRecord\(manifest\.home\.id, constructionApplied\)/,
  );
  assert.match(editor, /name="save" \/>\s*Save\s*<\/EditorButton>/);
  assert.match(editor, /"Saving…"[\s\S]*"Save anyway"[\s\S]*"Save changes"/);
  assert.doesNotMatch(editor, /[">](?:Publish|Publishing|Ready to publish)/);
  assert.doesNotMatch(editor, /<SolarLighting/);
});

test("furnish rail is an add catalog while existing selection stays in the scene", async () => {
  const inspector = await readFile(
    "apps/web/src/editor-preview/furnish/FurnishingInspector.tsx",
    "utf8",
  );
  const catalog = await readFile(
    "apps/web/src/editor-preview/furnish/catalog/ArrangeCatalog.tsx",
    "utf8",
  );
  const editor = await readEditorSource();
  assert.match(catalog, /aria-label="Catalog room types"/);
  assert.match(catalog, /onClick=\{\(\) => onChoose\(entry\)/);
  assert.match(editor, /detailsItemId === selectedItem.id/);
  const panel = await readFile("apps/web/src/editor-chrome/SelectionDetailsPanel.tsx", "utf8");
  const properties = await readFile(
    "apps/web/src/editor-preview/furnish/FurnishingProperties.tsx",
    "utf8",
  );
  assert.match(panel, /className="selection-details"/);
  assert.match(properties, /<SelectionDetailsPanel/);
  assert.doesNotMatch(inspector, /onAddPreset|__catalog/);
  assert.doesNotMatch(
    inspector,
    /Click an object in the house to edit it|__history|items\.length.*placed/,
  );
  assert.doesNotMatch(inspector, /role="option"/);
});

test("selected walls expose friendly facts before exact expert controls", async () => {
  const inspector = (
    await Promise.all(
      [
        "apps/web/src/editor-preview/construct/ConstructionInspector.tsx",
        "apps/web/src/editor-preview/construct/DebouncedColorInput.tsx",
        "apps/web/src/editor-preview/construct/WallFinishFields.tsx",
      ].map((path) => readFile(path, "utf8")),
    )
  ).join("\n");
  assert.match(inspector, /construction-inspector__wall-facts/);
  assert.match(inspector, />Direction</);
  assert.match(inspector, /Thickness\s*<CommittedNumberInput/);
  assert.match(inspector, /CommittedNumberInput/);
  assert.match(inspector, /label="Wall thickness"/);
  assert.match(inspector, /DebouncedColorInput/);
  assert.match(inspector, /inputLabel="Wall exterior color"/);
  // Debounce timing is verified by the inspector behavior test with a controlled clock.
  assert.doesNotMatch(inspector, /construction-inspector__tools|construction-inspector__history/);
  const openingProperties = await readFile(
    "apps/web/src/editor-preview/construct/OpeningProperties.tsx",
    "utf8",
  );
  assert.match(
    await readFile("apps/web/src/editor-preview/construct/OpeningDetails.tsx", "utf8"),
    /<OpeningProperties/,
  );
  assert.match(
    await readFile("apps/web/src/editor-preview/construct/DoorDesignFields.tsx", "utf8"),
    /aria-label="Door operation"/,
  );
  assert.match(openingProperties, /aria-label="Window glazing"/);
  assert.match(openingProperties, /aria-label="Passage shape"/);
  assert.match(openingProperties, /replaceSelectedOpening/);
  assert.doesNotMatch(inspector, /Move over a wall, then click the highlighted position/);
  assert.match(inspector, /Selected room/);
  assert.match(inspector, /label="Room name"/);
  assert.match(inspector, /label="Room ceiling height"/);
  assert.match(inspector, /Choose the room to keep/);
  assert.match(inspector, /resolveRoomMerge/);
});
