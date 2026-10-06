import { useEffectEvent } from "react";
import { useCabaneDom } from "./CabaneDom";
import { collectBindingSlots } from "./binding-slot-descriptors";
import { resolveOpeningPositions, type RetainedOpeningPositions } from "./opening-pose";
import { pointInsidePolygon, worldPointToPlan } from "./geometry";
import { requestWalkPointerLock as acquireWalkPointerLock } from "./request-walk-pointer-lock";
import { safeBuildingSpawn } from "./stairs/stair-navigation";
import { useFloorNavigation, deriveFloorLevels } from "./building";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAdaptiveSceneQuality } from "./useAdaptiveSceneQuality";
import { useSceneCameraRequirements } from "./useSceneCameraRequirements";

import { resolveDeviceModelDefinition } from "./devices";

import { useHomeAssistantRuntime } from "./HomeAssistantRuntime";

import { allLightsOffCall } from "./home-assistant-controls";

import { resolveHomeAssistantBindings } from "./home-assistant-resolver";

import { deriveHomePresence } from "./home-presence/model";

import { isNightLighting, type SolarLightingMode } from "./lighting";
import { loadLightingMode, saveLightingMode } from "./WalkPreferences";

import {
  readSceneSession,
  spawnPoseForRoom,
  writeSceneSession,
  type StickVector,
  type WalkPose,
} from "./navigation";

import { deriveRoomStatusMap } from "./room-status/model";

import {
  useCoarsePointer,
  useDesktopWalkInput,
  useDocumentVisible,
  useReducedMotion,
} from "./SceneControls";

import type { BuiltInShortcutId, EntityId, ExtensionInteractionTarget, SceneMode } from "./types";

import { orbitalEditorActionFromKey } from "./SceneActionBar";
import type { ActionBarItem } from "./action-bar/action-bar-config";
import {
  openActionBarDestination,
  resolveActionBarDestination,
} from "./action-bar/action-bar-navigation";

import { ValidatedDashboardProps } from "./validated-dashboard-contract";

export function useDashboardController({
  manifest,
  architectureModels,
  deviceModels,
  bindingManager,
  fallbackDemo,
  sessionPresentation,
  setupAction,
  setupOpen,
  mappingRequest,
  focusRoomId,
  onEditHome,
  onExportBrowserData,
  onOpenConnect,
  walkthrough,
  walkTools = [],
}: ValidatedDashboardProps) {
  const dom = useCabaneDom();
  const [equippedToolId, setEquippedToolId] = useState<string | null>(null);
  const onExitWalkthrough = walkthrough?.onExit;
  const walkthroughStarted = useRef(false);
  const floorNavigation = useFloorNavigation(manifest.floors);
  const { activeFloorId: floorNavigationActiveFloorId, selectFloor: floorNavigationSelectFloor } =
    floorNavigation;
  const floor =
    manifest.floors.find((floor) => floor.id === floorNavigationActiveFloorId) ??
    manifest.floors[0];
  const floorLevels = deriveFloorLevels(manifest.floors);
  const elevation = floorLevels.find((level) => level.floorId === floor.id)?.elevationMeters ?? 0;
  const runtime = useHomeAssistantRuntime();
  const demoSession =
    sessionPresentation?.mode === "demo" || (fallbackDemo && runtime.status === "unconfigured");
  const resolvedBindings = useMemo(
    () => resolveHomeAssistantBindings(manifest, bindingManager.profile, runtime, deviceModels),
    [manifest, bindingManager.profile, runtime, deviceModels],
  );
  const doorOpeningIds = useMemo(
    () =>
      new Set(
        manifest.floors.flatMap((floor) =>
          floor.openings.filter((opening) => opening.kind === "door").map((opening) => opening.id),
        ),
      ),
    [manifest.floors],
  );
  const roomStatuses = useMemo(
    () => deriveRoomStatusMap(manifest, bindingManager.profile, resolvedBindings, runtime),
    [bindingManager.profile, manifest, resolvedBindings, runtime],
  );
  const homePresence = useMemo(() => deriveHomePresence(runtime), [runtime]);
  const roomDisplayNames = useMemo(
    () =>
      Object.fromEntries(
        floor.rooms.map((room) => [
          room.id,
          resolvedBindings.rooms[room.id]?.displayName ?? room.name,
        ]),
      ),
    [floor.rooms, resolvedBindings.rooms],
  );
  const initialSession = useRef(
    readSceneSession(typeof window === "undefined" ? null : window.sessionStorage),
  );
  const validInitialRoom = floor.rooms.some(
    (room) => room.id === initialSession.current.selectedRoomId,
  )
    ? initialSession.current.selectedRoomId
    : null;
  const [mode, setMode] = useState<SceneMode>(
    walkthrough || (initialSession.current.mode === "room" && !validInitialRoom)
      ? "overview"
      : initialSession.current.mode,
  );
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(validInitialRoom);
  const [walkRoomId, setWalkRoomId] = useState<string | null>(validInitialRoom);
  const [wallFadeEnabled, setWallFadeEnabled] = useState(initialSession.current.wallFadeEnabled);
  const [lightingMode, setLightingMode] = useState<SolarLightingMode>(loadLightingMode);
  const chooseLightingMode = (mode: SolarLightingMode) => {
    setLightingMode(mode);
    saveLightingMode(mode);
  };
  const [localTime, setLocalTime] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setLocalTime(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const [cameraResetKey, setCameraResetKey] = useState(0);
  const [automaticOpeningIds, setAutomaticOpeningIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [devicePanelRoomId, setDevicePanelRoomId] = useState<string | null>(null);
  const [walkPointerLocked, setWalkPointerLocked] = useState(false);
  const [walkDeviceTarget, setWalkDeviceTarget] = useState<ExtensionInteractionTarget | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<{
    roomId: string;
    deviceId: string;
    entityId: EntityId;
    label: string;
  } | null>(null);
  const [mappingOpen, setMappingOpen] = useState(false);
  const [mappingView, setMappingView] = useState<"rooms" | "devices">("rooms");
  const [allLightsBusy, setAllLightsBusy] = useState(false);
  const [sceneActionError, setSceneActionError] = useState<string | null>(null);
  const lastBoundOpenRef = useRef<RetainedOpeningPositions>(new Map());
  const shellRef = useRef<HTMLElement>(null);
  const mobileOrientationLockRef = useRef(false);
  const mobileFullscreenRef = useRef(false);
  const walkDevicePanelOpenRef = useRef(false);
  const walkPointerLockPendingRef = useRef(false);
  const coarsePointer = useCoarsePointer();
  const reducedMotion = useReducedMotion();
  const documentVisible = useDocumentVisible();
  const { liveCameraDeviceIds, cameraStreamRequirements } = useSceneCameraRequirements(
    manifest,
    deviceModels,
    resolvedBindings,
    runtime.origin,
  );
  const selectedRoom = floor.rooms.find((room) => room.id === selectedRoomId);
  const devicePanelRoom = floor.rooms.find((room) => room.id === devicePanelRoomId);
  const deviceOverlay = selectedDeviceId !== null && devicePanelRoom !== undefined;
  const controlRoom = deviceOverlay ? devicePanelRoom : mode === "room" ? selectedRoom : undefined;
  const walkRoom = floor.rooms.find((room) => room.id === walkRoomId);
  const selectedRoomDisplayName = selectedRoom
    ? (resolvedBindings.rooms[selectedRoom.id]?.displayName ?? selectedRoom.name)
    : floor.name;
  const walkRoomDisplayName = walkRoom
    ? (resolvedBindings.rooms[walkRoom.id]?.displayName ?? walkRoom.name)
    : floor.name;
  const poseRef = useRef<WalkPose>(spawnPoseForRoom(selectedRoom, floor));
  const sprintInputRef = useRef(false);
  const jumpRequestRef = useRef(false);
  const movementInputRef = useRef<StickVector>({ x: 0, y: 0 });
  const lookInputRef = useRef<StickVector>({ x: 0, y: 0 });
  const lookDeltaRef = useRef<StickVector>({ x: 0, y: 0 });
  const walkMode = mode === "walk";
  const requestWalkPointerLock = useCallback(() => {
    const target = walkthrough?.pointerLockTarget ?? shellRef.current;
    if (coarsePointer || !target || dom.root.pointerLockElement === target) return;
    lookDeltaRef.current = { x: 0, y: 0 };
    walkPointerLockPendingRef.current = true;
    void acquireWalkPointerLock(target).catch(() => {
      walkPointerLockPendingRef.current = false;
      setSceneActionError("Click the scene to resume mouse control.");
    });
  }, [coarsePointer, walkthrough, dom]);
  const { quality, canvasDpr, adjustQuality } = useAdaptiveSceneQuality(coarsePointer, walkMode);
  const boundOpeningIds = useMemo(
    () =>
      new Set(
        Object.values(resolvedBindings.openings)
          .filter((opening) => opening.bound)
          .map((opening) => opening.openingId),
      ),
    [resolvedBindings.openings],
  );
  const openingPositions = useMemo(
    () =>
      resolveOpeningPositions(
        automaticOpeningIds,
        resolvedBindings.openings,
        lastBoundOpenRef.current,
      ),
    [automaticOpeningIds, resolvedBindings.openings],
  );
  const sunState = runtime.entityStates["sun.sun"];
  const nightLighting = isNightLighting(
    lightingMode,
    sunState?.available !== false && !sunState?.stale ? sunState : undefined,
    localTime,
  );
  const allLightsCall = allLightsOffCall(runtime.entityStates);
  useDesktopWalkInput(
    walkMode && walkPointerLocked && !coarsePointer && !deviceOverlay,
    movementInputRef,
    sprintInputRef,
    jumpRequestRef,
  );

  useEffect(() => {
    if (walkthrough) return;
    writeSceneSession(window.sessionStorage, { mode, selectedRoomId, wallFadeEnabled });
  }, [mode, selectedRoomId, wallFadeEnabled, walkthrough]);

  useEffect(() => {
    if ((!walkMode && !onExitWalkthrough) || deviceOverlay) return;
    const exit = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || walkDevicePanelOpenRef.current)
        return;
      if (onExitWalkthrough) onExitWalkthrough();
      else setMode(selectedRoomId ? "room" : "overview");
    };
    dom.events.addEventListener("keydown", exit);
    return () => dom.events.removeEventListener("keydown", exit);
  }, [deviceOverlay, onExitWalkthrough, selectedRoomId, walkMode, dom]);

  useEffect(() => {
    const shell = walkthrough?.pointerLockTarget ?? shellRef.current;
    if (!walkMode || coarsePointer) {
      if (!walkMode && !walkthrough && dom.root.pointerLockElement === shell)
        document.exitPointerLock();
      return;
    }
    let acquired = dom.root.pointerLockElement === shell;
    const syncPointerLock = () => {
      const locked = dom.root.pointerLockElement === shell;
      setWalkPointerLocked(locked);
      if (locked) {
        acquired = true;
        setSceneActionError((current) =>
          current === "Click the scene to resume mouse control." ? null : current,
        );
        walkPointerLockPendingRef.current = false;
        return;
      }
      // Do not interrupt an overlay or an in-flight browser request.
      if (!acquired || walkDevicePanelOpenRef.current || walkPointerLockPendingRef.current) return;
      // Losing browser pointer lock pauses input; it must not replace the camera.
      movementInputRef.current = { x: 0, y: 0 };
      lookDeltaRef.current = { x: 0, y: 0 };
    };
    syncPointerLock();
    document.addEventListener("pointerlockchange", syncPointerLock);
    return () => {
      document.removeEventListener("pointerlockchange", syncPointerLock);
      queueMicrotask(() => {
        if (shell && !shell.isConnected && dom.root.pointerLockElement === shell)
          document.exitPointerLock();
      });
    };
  }, [coarsePointer, onExitWalkthrough, selectedRoomId, walkMode, walkthrough, dom]);

  const enterWalkMode = useCallback(() => {
    walkDevicePanelOpenRef.current = false;
    walkPointerLockPendingRef.current = false;
    const start = manifest.home.walkStart;
    const safeSpawn = safeBuildingSpawn(manifest, start?.floorId ?? floor.id, start?.at);
    if (!safeSpawn) {
      setSceneActionError(
        "The walk starting area is blocked or unavailable. Move the starting point in Construct or clear a walking area in Arrange.",
      );
      return;
    }
    floorNavigationSelectFloor(safeSpawn.floorId);
    requestWalkPointerLock();
    poseRef.current = safeSpawn;
    const spawnFloor = manifest.floors.find((candidate) => candidate.id === safeSpawn.floorId)!;
    const spawnPoint = worldPointToPlan(safeSpawn, manifest.coordinates);
    setWalkRoomId(
      spawnFloor.rooms.find((room) => pointInsidePolygon(spawnPoint, room.polygon))?.id ?? null,
    );
    setAutomaticOpeningIds(new Set());
    setSelectedDeviceId(null);
    setDevicePanelRoomId(null);
    setSceneActionError(null);
    setMode("walk");
  }, [floor.id, floorNavigationSelectFloor, manifest, requestWalkPointerLock]);

  const leaveWalkMode = useCallback(() => {
    movementInputRef.current = { x: 0, y: 0 };
    lookInputRef.current = { x: 0, y: 0 };
    lookDeltaRef.current = { x: 0, y: 0 };
    setAutomaticOpeningIds(new Set());
    setWalkDeviceTarget(null);
    setWalkPointerLocked(false);
    if (dom.root.pointerLockElement) document.exitPointerLock();
    walkPointerLockPendingRef.current = false;
    if (onExitWalkthrough) {
      onExitWalkthrough();
      return;
    }
    setMode(selectedRoomId ? "room" : "overview");
  }, [onExitWalkthrough, selectedRoomId, dom]);

  useEffect(() => {
    if (!coarsePointer) return;
    const landscape = window.matchMedia("(orientation: landscape)");
    const updateWalkMode = () => {
      if (landscape.matches) enterWalkMode();
      else if (walkMode) leaveWalkMode();
    };
    if (!landscape.matches && walkMode) leaveWalkMode();
    landscape.addEventListener("change", updateWalkMode);
    return () => landscape.removeEventListener("change", updateWalkMode);
  }, [coarsePointer, enterWalkMode, leaveWalkMode, walkMode]);

  useEffect(() => {
    if (walkMode) return;
    if (mobileOrientationLockRef.current) {
      mobileOrientationLockRef.current = false;
      try {
        screen.orientation.unlock();
      } catch {
        // The browser may already have released the lock after leaving fullscreen.
      }
    }
    if (mobileFullscreenRef.current) {
      mobileFullscreenRef.current = false;
      if (dom.root.fullscreenElement === shellRef.current) {
        void document.exitFullscreen().catch(() => undefined);
      }
    }
  }, [walkMode, dom]);

  const requestMobileLandscape = useCallback(() => {
    setSceneActionError("Rotate your device to landscape to use walk mode.");
    // Keep the editor's return bar visible instead of making only the scene fullscreen.
    if (walkthrough || typeof screen.orientation?.lock !== "function") return;
    void (async () => {
      try {
        if (!dom.root.fullscreenElement && shellRef.current?.requestFullscreen) {
          await shellRef.current.requestFullscreen();
          mobileFullscreenRef.current = true;
        }
        await screen.orientation.lock("landscape");
        mobileOrientationLockRef.current = true;
      } catch {
        if (mobileFullscreenRef.current && dom.root.fullscreenElement === shellRef.current) {
          mobileFullscreenRef.current = false;
          void document.exitFullscreen().catch(() => undefined);
        }
      }
    })();
  }, [walkthrough, dom]);

  useEffect(() => {
    if (!onExitWalkthrough || walkthroughStarted.current) return;
    // The pointer hook resolves after mount; wait before requesting desktop input on touch devices.
    const touch =
      window.matchMedia("(any-pointer: coarse)").matches && navigator.maxTouchPoints > 0;
    if (touch && !coarsePointer) return;
    walkthroughStarted.current = true;
    if (coarsePointer && !window.matchMedia("(orientation: landscape)").matches)
      requestMobileLandscape();
    else enterWalkMode();
  }, [coarsePointer, enterWalkMode, onExitWalkthrough, requestMobileLandscape]);

  const selectRoom = useCallback(
    (roomId: string) => {
      if (walkthrough) return;
      setSelectedRoomId(roomId);
      setSelectedDeviceId(null);
      setDevicePanelRoomId(null);
      walkDevicePanelOpenRef.current = false;
      setMode("room");
    },
    [walkthrough],
  );
  const goHome = useCallback(() => {
    movementInputRef.current = { x: 0, y: 0 };
    lookInputRef.current = { x: 0, y: 0 };
    lookDeltaRef.current = { x: 0, y: 0 };
    setAutomaticOpeningIds(new Set());
    setSelectedRoomId(null);
    setSelectedDeviceId(null);
    setDevicePanelRoomId(null);
    walkDevicePanelOpenRef.current = false;
    setMode("overview");
  }, []);

  useEffect(() => {
    if (!setupOpen) return;
    setMappingOpen(false);
    setSelectedCamera(null);
    goHome();
  }, [goHome, setupOpen]);

  useEffect(() => {
    if (!mappingRequest) return;
    if (onOpenConnect) {
      onOpenConnect(mappingRequest.view, mappingRequest.roomId);
      return;
    }
    setMappingView(mappingRequest.view);
    setSelectedRoomId(mappingRequest.roomId ?? null);
    setSelectedDeviceId(null);
    setDevicePanelRoomId(null);
    setMappingOpen(true);
  }, [mappingRequest, onOpenConnect]);
  const runAction = (action: BuiltInShortcutId) => {
    switch (action) {
      case "home-view":
        goHome();
        break;
      case "room-details":
        if (walkRoomId) selectRoom(walkRoomId);
        else if (floor.rooms[0]) selectRoom(floor.rooms[0].id);
        break;
      case "construct-mode":
        onEditHome?.("construct");
        break;
      case "arrange-mode":
        onEditHome?.("furnish");
        break;
      case "connect-mode":
        if (onEditHome) onEditHome("connect");
        else if (onOpenConnect) onOpenConnect("rooms");
        else {
          setMappingView("rooms");
          setMappingOpen(true);
        }
        break;
      case "walk-mode":
        if (walkMode) leaveWalkMode();
        else if (coarsePointer && !window.matchMedia("(orientation: landscape)").matches) {
          requestMobileLandscape();
        } else enterWalkMode();
        break;
      case "lighting-mode":
        chooseLightingMode(nightLighting ? "day" : "night");
        break;
      case "wall-fade":
        setWallFadeEnabled((current) => !current);
        break;
      case "all-lights":
        if (!runtime.canMutate || !allLightsCall || allLightsBusy) break;
        setAllLightsBusy(true);
        setSceneActionError(null);
        void runtime
          .callService(allLightsCall)
          .catch(() => {
            setSceneActionError("Home Assistant could not turn off every available light.");
          })
          .finally(() => setAllLightsBusy(false));
        break;
    }
  };
  const runConfiguredAction = (item: ActionBarItem) => {
    if (item.target.kind === "walk-tool") {
      const toolId = item.target.toolId;
      if (walkMode && walkTools.some((tool) => tool.id === toolId)) {
        setEquippedToolId((current) => (current === toolId ? null : toolId));
        requestWalkPointerLock();
      }
      return;
    }
    if (item.target.kind === "built-in") {
      const action = {
        walk: "walk-mode",
        night: "lighting-mode",
        "all-lights": "all-lights",
      } as const;
      if (item.target.action in action)
        runAction(action[item.target.action as keyof typeof action]);
      return;
    }
    const destination = resolveActionBarDestination(manifest, item.target);
    if (!destination) {
      setSceneActionError(
        `This ${item.target.kind} is no longer available. Edit the action bar to replace it.`,
      );
      return;
    }
    openActionBarDestination(destination, {
      walkMode,
      leaveWalkMode,
      selectFloor: floorNavigationSelectFloor,
      selectRoom,
      openDevice: (roomId, deviceId) => {
        setDevicePanelRoomId(roomId);
        setSelectedDeviceId(deviceId);
      },
    });
    setSceneActionError(null);
  };
  const handleAutomaticOpeningsChange = (next: ReadonlySet<string>) => {
    setAutomaticOpeningIds(new Set([...next].filter((openingId) => doorOpeningIds.has(openingId))));
  };
  const closeCameraViewer = useCallback(() => setSelectedCamera(null), []);
  // A focus request selects a room once; later floor and selection changes remain user controlled.
  const focusRequestedRoom = useEffectEvent(() => {
    if (!focusRoomId) return;
    const targetFloor = manifest.floors.find((candidate) =>
      candidate.rooms.some((room) => room.id === focusRoomId),
    );
    if (!targetFloor) return;
    floorNavigationSelectFloor(targetFloor.id);
    selectRoom(focusRoomId);
  });
  useEffect(() => {
    focusRequestedRoom();
  }, [focusRoomId]);

  const openCameraViewer = useCallback(
    (roomId: string, deviceId: string) => {
      const resolvedRoom = resolvedBindings.rooms[roomId];
      const device = resolvedRoom?.devices.find((candidate) => candidate.slot.id === deviceId);
      if (!device) return;
      const definition = resolveDeviceModelDefinition(
        device.slot.model,
        deviceModels,
        manifest.extensions.deviceModels,
      );
      if (definition?.liveMedia?.kind !== "camera-stream") return;
      const primarySlot = device.slot.entitySlots.find(
        (slot) => slot.deviceRole === definition.liveMedia?.slotRole,
      );
      const primary = device.entities.find((entity) => entity.slotId === primarySlot?.id);
      const invalid = device.issues.some((issue) => issue.severity === "error");
      if (!primary || invalid || !primary.entityId.startsWith("camera.")) {
        if (onOpenConnect) {
          onOpenConnect("devices", roomId);
          return;
        }
        setSelectedCamera(null);
        setSelectedRoomId(roomId);
        setSelectedDeviceId(deviceId);
        setMode("room");
        setMappingOpen(true);
        if (runtime.status !== "connected") runtime.connect();
        return;
      }
      setSelectedCamera({
        roomId,
        deviceId,
        entityId: primary.entityId,
        label: primarySlot?.presentation.label ?? device.slot.id,
      });
    },
    [
      resolvedBindings.rooms,
      deviceModels,
      manifest.extensions.deviceModels,
      onOpenConnect,
      runtime,
    ],
  );
  const closeDevicePanel = useCallback(
    (pointerLockTiming: "immediate" | "after-escape" = "immediate") => {
      setSelectedDeviceId(null);
      setDevicePanelRoomId(null);
      if (!walkMode || coarsePointer) {
        walkDevicePanelOpenRef.current = false;
        return;
      }
      const resumeWalk = () => {
        walkDevicePanelOpenRef.current = false;
        requestWalkPointerLock();
      };
      if (pointerLockTiming === "after-escape") window.setTimeout(resumeWalk, 0);
      else resumeWalk();
    },
    [coarsePointer, requestWalkPointerLock, walkMode],
  );
  const openDevicePanel = useCallback(
    (roomId: string, deviceId: string) => {
      setDevicePanelRoomId(roomId);
      setSelectedDeviceId(deviceId);
      if (!walkMode) return;
      movementInputRef.current = { x: 0, y: 0 };
      lookInputRef.current = { x: 0, y: 0 };
      lookDeltaRef.current = { x: 0, y: 0 };
      walkDevicePanelOpenRef.current = true;
      walkPointerLockPendingRef.current = false;
      if (dom.root.pointerLockElement === shellRef.current) document.exitPointerLock();
    },
    [walkMode, dom],
  );
  const handleExtensionInteraction = useCallback(
    (target: ExtensionInteractionTarget) => {
      if (walkthrough || (walkMode && equippedToolId)) return;
      const openingDescriptor = collectBindingSlots(manifest).find(
        (descriptor) => descriptor.kind === "opening-cover" && descriptor.openingId === target.id,
      );
      const room = floor.rooms.find(
        (candidate) =>
          openingDescriptor?.roomIds.includes(candidate.id) ||
          candidate.devices.some(
            (device) =>
              device.id === target.id ||
              (target.slotId
                ? device.entitySlots.some((slot) => slot.id === target.slotId)
                : false),
          ) ||
          (target.slotId
            ? candidate.dashboardSlots.some((slot) => slot.id === target.slotId)
            : false),
      );
      if (!room) return;
      const device = room.devices.find(
        (candidate) =>
          candidate.id === target.id ||
          (target.slotId ? candidate.entitySlots.some((slot) => slot.id === target.slotId) : false),
      );
      if (device && target.intent === "camera-viewer") {
        openCameraViewer(room.id, device.id);
        return;
      }
      if (device) {
        openDevicePanel(room.id, device.id);
        return;
      }
      setSelectedRoomId(room.id);
      setSelectedDeviceId(null);
      setDevicePanelRoomId(null);
      setMode("room");
    },
    [
      walkthrough,
      walkMode,
      equippedToolId,
      floor.rooms,
      manifest,
      openCameraViewer,
      openDevicePanel,
    ],
  );
  const openWalkDevice = useCallback(() => {
    if (!walkDeviceTarget) return;
    if (floor.openings.some((opening) => opening.id === walkDeviceTarget.id && opening.coverSlot)) {
      handleExtensionInteraction(walkDeviceTarget);
      setWalkDeviceTarget(null);
      if (dom.root.pointerLockElement) document.exitPointerLock();
      return;
    }
    const room = floor.rooms.find((candidate) =>
      candidate.devices.some((device) => device.id === walkDeviceTarget.id),
    );
    if (!room) return;
    setWalkDeviceTarget(null);
    openDevicePanel(room.id, walkDeviceTarget.id);
  }, [
    floor.rooms,
    floor.openings,
    handleExtensionInteraction,
    openDevicePanel,
    walkDeviceTarget,
    dom,
  ]);

  useEffect(() => {
    if (walkthrough || !walkMode || !walkDeviceTarget || coarsePointer || selectedDeviceId) return;
    const activateWithKeyboard = (event: KeyboardEvent) => {
      if (event.code !== "KeyE" && event.code !== "Enter") return;
      event.preventDefault();
      openWalkDevice();
    };
    const activateWithPointer = (event: PointerEvent) => {
      if (
        equippedToolId ||
        event.defaultPrevented ||
        event.button !== 0 ||
        dom.root.pointerLockElement !== shellRef.current
      )
        return;
      openWalkDevice();
    };
    dom.events.addEventListener("keydown", activateWithKeyboard);
    dom.events.addEventListener("pointerdown", activateWithPointer);
    return () => {
      dom.events.removeEventListener("keydown", activateWithKeyboard);
      dom.events.removeEventListener("pointerdown", activateWithPointer);
    };
  }, [
    coarsePointer,
    equippedToolId,
    openWalkDevice,
    selectedDeviceId,
    walkDeviceTarget,
    walkMode,
    walkthrough,
    dom,
  ]);
  useEffect(() => {
    if (!walkMode || !walkTools.some((tool) => tool.id === equippedToolId)) setEquippedToolId(null);
  }, [walkMode, walkTools, equippedToolId]);
  const runKeyboardAction = useEffectEvent(runAction);
  useEffect(() => {
    if (walkMode || walkthrough || setupOpen || mappingOpen || deviceOverlay || selectedCamera)
      return;
    const activateEditorShortcut = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.isComposing ||
        event.repeat ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      )
        return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.closest("input, textarea, select") || target.isContentEditable)
      )
        return;
      const action = orbitalEditorActionFromKey(event.key, event.shiftKey);
      if (!action) return;
      event.preventDefault();
      runKeyboardAction(action);
    };
    dom.events.addEventListener("keydown", activateEditorShortcut);
    return () => dom.events.removeEventListener("keydown", activateEditorShortcut);
  }, [deviceOverlay, mappingOpen, mode, selectedCamera, setupOpen, walkMode, walkthrough, dom]);
  return {
    equippedToolId,
    floorNavigation,
    elevation,
    setCameraResetKey,
    requestWalkPointerLock,
    cameraStreamRequirements,
    runtime,
    documentVisible,
    shellRef,
    mode,
    mappingOpen,
    setupOpen,
    manifest,
    canvasDpr,
    walkMode,
    quality,
    lightingMode,
    chooseLightingMode,
    sunState,
    nightLighting,
    floor,
    poseRef,
    movementInputRef,
    sprintInputRef,
    jumpRequestRef,
    lookInputRef,
    lookDeltaRef,
    reducedMotion,
    openingPositions,
    boundOpeningIds,
    resolvedBindings,
    handleAutomaticOpeningsChange,
    setWalkRoomId,
    selectedRoom,
    cameraResetKey,
    architectureModels,
    selectedRoomId,
    wallFadeEnabled,
    deviceModels,
    selectRoom,
    handleExtensionInteraction,
    walkthrough,
    setWalkDeviceTarget,
    roomStatuses,
    roomDisplayNames,
    coarsePointer,
    adjustQuality,
    walkRoomDisplayName,
    selectedRoomDisplayName,
    walkRoomId,
    homePresence,
    sessionPresentation,
    demoSession,
    setupAction,
    setMappingOpen,
    goHome,
    onExportBrowserData,
    controlRoom,
    selectedDeviceId,
    deviceOverlay,
    closeDevicePanel,
    setSelectedDeviceId,
    enterWalkMode,
    onOpenConnect,
    setMappingView,
    liveCameraDeviceIds,
    openCameraViewer,
    bindingManager,
    mappingView,
    selectedCamera,
    closeCameraViewer,
    setSelectedCamera,
    setSelectedRoomId,
    setMode,
    walkDeviceTarget,
    openWalkDevice,
    walkPointerLocked,
    allLightsCall,
    allLightsBusy,
    runAction,
    runConfiguredAction,
    sceneActionError,
    setSceneActionError,
  };
}
