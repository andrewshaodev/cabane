import type { WalkToolNavigation } from "./walk-tools";
import { activateWalkTarget, canActivateWalkTarget } from "./walk-tools/activate-walk-target";
import { connectedCanvasEvents } from "./connected-canvas-events";
import { useCabaneDom } from "./CabaneDom";
import { ScenePreview } from "./ScenePreview";
import { RoomHoverProvider } from "./room-status/RoomHover";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { OrbitNavigation } from "./OrbitNavigation";
import { safeBuildingSpawn } from "./stairs/stair-navigation";
import { FloorPicker, deriveFloorLevels } from "./building";
import { StylizedScene } from "./StylizedScene";
import { PerformanceMonitor } from "@react-three/drei";

import { Canvas } from "@react-three/fiber";

import { Suspense, useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import { ArchitectureScene } from "./ArchitectureScene";

import { CameraStreamCoordinator } from "./CameraStreamCoordinator";

import { CameraViewer } from "./CameraViewer";

import { RoomDashboardPanel } from "./HomeAssistantDashboards";

import { HomeAssistantMappingScreen } from "./HomeAssistantMappingScreen";

import { SolarLighting } from "./SceneLighting";
import { SceneNightContext } from "./scene-light-state";

import { RoomStatusOverlays, shouldShowRoomStatusOverlays } from "./room-status/RoomStatusOverlays";

import {
  DesktopLookSurface,
  OrbitCamera,
  VirtualJoystick,
  WalkCameraController,
} from "./SceneControls";

import { SceneActionBar } from "./SceneActionBar";
import { resolvePublishedActionBarItems } from "./action-bar/action-bar-config";
import { resolveActionBarDestination } from "./action-bar/action-bar-navigation";
import { CustomizeActionBarMenuItem } from "./CustomizeActionBarMenuItem";

import { SceneMenuIcon } from "./SceneMenuIcon";
import { WalkPreferences, loadInvertYAxis, saveInvertYAxis } from "./WalkPreferences";

import { SceneRoomContext } from "./SceneRoomContext";

import { connectionLabel } from "./dashboard-contract";

import { useDashboardController } from "./useDashboardController";

export function ValidatedDashboardView(props: Parameters<typeof useDashboardController>[0]) {
  const dom = useCabaneDom();
  const toolNavigationRef = useRef<WalkToolNavigation | null>(null);
  const orbitControls = useRef<OrbitControlsImpl | null>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [invertYAxis, setInvertYAxis] = useState(loadInvertYAxis);
  const closePreferences = useCallback(() => setPreferencesOpen(false), []);
  const {
    equippedToolId,
    floorNavigation,
    elevation,
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
    solarLighting,
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
  } = useDashboardController(props);
  const equippedTool =
    walkMode && !walkthrough
      ? props.walkTools?.find((tool) => tool.id === equippedToolId)
      : undefined;
  const toolInputEnabled =
    documentVisible &&
    !setupOpen &&
    !mappingOpen &&
    !deviceOverlay &&
    !selectedCamera &&
    !preferencesOpen;
  const actionBarItems = resolvePublishedActionBarItems(manifest.actionBar, props.walkTools);
  const preferencesMenuItem = walkMode && (
    <button
      type="button"
      onClick={(event) => {
        event.currentTarget.closest("details")?.removeAttribute("open");
        if (dom.root.pointerLockElement) document.exitPointerLock();
        setPreferencesOpen(true);
      }}
    >
      <SceneMenuIcon name="preferences" />
      <span>Preferences</span>
    </button>
  );
  const actionBarTargets = Object.fromEntries(
    actionBarItems.flatMap((item) => {
      if (item.target.kind === "built-in" || item.target.kind === "walk-tool") return [];
      const destination = resolveActionBarDestination(manifest, item.target);
      if (!destination)
        return [[item.id, { label: `Unavailable ${item.target.kind}`, available: false }]];
      if (item.target.kind === "room") {
        const room = manifest.floors
          .find((floor) => floor.id === destination.floorId)
          ?.rooms.find((room) => room.id === destination.roomId);
        return [
          [
            item.id,
            {
              label:
                resolvedBindings.rooms[destination.roomId]?.displayName ?? room?.name ?? "Room",
              pictureUrl: resolvedBindings.rooms[destination.roomId]?.pictureUrl,
              available: true,
            },
          ],
        ];
      }
      const deviceId = item.target.deviceId;
      const device = manifest.sceneItems.find((candidate) => candidate.id === deviceId);
      return [
        [
          item.id,
          {
            label:
              resolvedBindings.rooms[destination.roomId]?.devices.find(
                (binding) => binding.slot.id === deviceId,
              )?.displayName ??
              (device
                ? (deviceModels[device.modelId]?.label ?? device.modelId.replaceAll("-", " "))
                : "Device"),
            modelId: device?.modelId,
            available: true,
          },
        ],
      ];
    }),
  );
  const floorLevels = deriveFloorLevels(manifest.floors);
  const cameraFloors = manifest.floors
    .map((floor, index) => ({ ...floor, elevationMeters: floorLevels[index].elevationMeters }))
    .filter((candidate, index) =>
      floorNavigation.wholeBuilding
        ? !candidate.belowGround
        : index <= manifest.floors.indexOf(floor),
    );
  const { wholeBuilding, setWholeBuilding } = floorNavigation;
  useEffect(() => {
    if (walkMode && wholeBuilding) setWholeBuilding(false);
  }, [walkMode, wholeBuilding, setWholeBuilding]);
  return (
    <CameraStreamCoordinator
      requirements={cameraStreamRequirements}
      client={runtime.cameraClient}
      origin={runtime.origin}
      documentVisible={documentVisible}
    >
      {(liveMediaByEntityId) => (
        <main
          ref={shellRef}
          className={`cabane-shell mode-${mode} ${mappingOpen ? "mapping-open" : ""} ${setupOpen ? "setup-surface-open" : ""} ${deviceOverlay ? "device-overlay-open" : ""}`}
          style={
            {
              "--home-accent": manifest.home.palette.accent,
              "--home-secondary": manifest.home.palette.secondary,
            } as CSSProperties
          }
        >
          <div className="building-floor-controls">
            {!walkMode && <OrbitNavigation controlsRef={orbitControls} />}
            <FloorPicker
              unavailable={
                walkMode
                  ? Object.fromEntries(
                      manifest.floors
                        .filter((f) => !safeBuildingSpawn(manifest, f.id))
                        .map((f) => [f.id, "No clear walking entry"]),
                    )
                  : undefined
              }
              floors={manifest.floors}
              selectedId={floor.id}
              onSelect={(id) => {
                if (walkMode) {
                  const spawn = safeBuildingSpawn(manifest, id);
                  if (!spawn) return;
                  poseRef.current = spawn;
                }
                floorNavigation.selectFloor(id);
                setSelectedRoomId(null);
                setSelectedDeviceId(null);
                if (mode === "room") setMode("overview");
              }}
            />
          </div>
          <div
            className="scene-canvas"
            aria-label="Interactive 3D home model"
            onClick={(event) => {
              if (
                walkMode &&
                !coarsePointer &&
                !walkPointerLocked &&
                !deviceOverlay &&
                event.target instanceof HTMLCanvasElement
              )
                requestWalkPointerLock();
            }}
          >
            <Suspense fallback={<div className="scene-loading">Preparing the house…</div>}>
              <Canvas
                events={connectedCanvasEvents}
                shadows="percentage"
                dpr={canvasDpr}
                frameloop={!documentVisible ? "never" : walkMode ? "always" : "demand"}
                gl={{ antialias: quality.antialias }}
              >
                <RoomHoverProvider scope={`${floor.id}-${mode}`}>
                  <StylizedScene antialias={quality.antialias}>
                    <ScenePreview enabled={!walkMode && !selectedRoomId} />
                    <SolarLighting
                      walkMode={walkMode}
                      mode={solarLighting.mode}
                      northAngleDegrees={manifest.home.northAngleDegrees ?? 0}
                      floors={manifest.floors}
                      shadowMapSize={quality.shadowMapSize}
                      sunState={sunState}
                    />
                    {walkMode ? (
                      <WalkCameraController
                        building={manifest}
                        registries={manifest.extensions}
                        elevation={elevation}
                        onFloorChange={(id) => floorNavigation.selectFloor(id, "walk")}

                        floor={floor}
                        poseRef={poseRef}
                        toolNavigationRef={toolNavigationRef}
                        movementInputRef={movementInputRef}
                        sprintInputRef={sprintInputRef}
                        jumpRequestRef={jumpRequestRef}
                        lookInputRef={lookInputRef}
                        lookDeltaRef={lookDeltaRef}
                        invertYAxis={invertYAxis}
                        reducedMotion={reducedMotion}
                        openingPositions={openingPositions}
                        boundOpeningIds={boundOpeningIds}
                        onOpeningsChange={handleAutomaticOpeningsChange}
                        onRoomChange={setWalkRoomId}
                      />
                    ) : (
                      // Room controls do not change the user’s current orbit or zoom.
                      <OrbitCamera
                        showRoof={floorNavigation.wholeBuilding}
                        controlsRef={orbitControls}
                        elevation={elevation}
                        buildingFloors={cameraFloors}

                        floor={floor}
                        resetKey={cameraResetKey}
                      />
                    )}
                    <SceneNightContext.Provider value={nightLighting}>
                      <ArchitectureScene
                        activeFloorId={floor.id}
                        floorView={floorNavigation.wholeBuilding ? "whole" : "cutaway"}

                        manifest={manifest}
                        architectureModels={architectureModels}
                        selectedRoomId={selectedRoomId}
                        walkMode={walkMode}
                        wallFadeEnabled={wallFadeEnabled && !floorNavigation.wholeBuilding}
                        reducedMotion={reducedMotion}
                        resolvedBindings={resolvedBindings}
                        deviceModels={deviceModels}
                        openingPositions={openingPositions}
                        interactionMode={
                          !walkMode && floorNavigation.wholeBuilding ? "editor" : "runtime"
                        }
                        onSelectRoom={floorNavigation.wholeBuilding ? undefined : selectRoom}
                        onInteract={handleExtensionInteraction}
                        onWalkDeviceTargetChange={
                          walkthrough || equippedTool ? undefined : setWalkDeviceTarget
                        }
                        liveMediaByEntityId={liveMediaByEntityId}
                      />
                    </SceneNightContext.Provider>
                    {equippedTool && (
                      <Suspense fallback={null}>
                        <equippedTool.Scene
                          enabled={toolInputEnabled}
                          pointerLocked={walkPointerLocked}
                          coarsePointer={coarsePointer}
                          reducedMotion={reducedMotion}
                          navigation={{
                            resolveLanding: (position) =>
                              toolNavigationRef.current?.resolveLanding(position) ?? null,
                            teleport: (landing, facing) =>
                              toolInputEnabled &&
                              (coarsePointer || walkPointerLocked) &&
                              (toolNavigationRef.current?.teleport(landing, facing) ?? false),
                          }}
                          canActivateTarget={(target) =>
                            toolInputEnabled &&
                            canActivateWalkTarget(target, resolvedBindings, runtime.canMutate)
                          }
                          activateTarget={(target) =>
                            toolInputEnabled
                              ? activateWalkTarget(target, resolvedBindings, runtime)
                              : Promise.resolve({
                                  status: "unavailable",
                                  message: "Resume walking to use this tool.",
                                })
                          }
                        />
                      </Suspense>
                    )}
                    {!walkthrough &&
                      !floorNavigation.wholeBuilding &&
                      shouldShowRoomStatusOverlays(mode) && (
                        <group position={[0, elevation, 0]}>
                          <RoomStatusOverlays
                            floor={floor}
                            summaries={roomStatuses}
                            roomNames={roomDisplayNames}
                            onSelectRoom={selectRoom}
                          />
                        </group>
                      )}
                    {walkMode && coarsePointer && (
                      <PerformanceMonitor
                        iterations={10}
                        ms={250}
                        bounds={() => [50, 58]}
                        onDecline={() => adjustQuality("down")}
                        onIncline={() => adjustQuality("up")}
                      />
                    )}
                  </StylizedScene>
                </RoomHoverProvider>
              </Canvas>
            </Suspense>
          </div>

          <header className="scene-hud">
            {!walkthrough && (
              <>
                <SceneRoomContext
                  mode={mode}
                  displayName={walkMode ? walkRoomDisplayName : selectedRoomDisplayName}
                  roomStatus={
                    walkMode && walkRoomId
                      ? roomStatuses[walkRoomId]
                      : selectedRoomId
                        ? roomStatuses[selectedRoomId]
                        : undefined
                  }
                  homePresence={homePresence}
                  connectionStatus={runtime.status}
                  connectionDescription={
                    sessionPresentation?.label ??
                    (demoSession ? "Offline demo" : connectionLabel[runtime.status])
                  }
                  sessionStatus={
                    sessionPresentation
                      ? [sessionPresentation.label, sessionPresentation.detail]
                          .filter(Boolean)
                          .join(" · ")
                      : undefined
                  }
                />
              </>
            )}
            <details className="scene-menu">
              <summary aria-label="More options">
                <span aria-hidden="true">•••</span>
                {setupAction?.attention && (
                  <i className="scene-menu__attention-dot" aria-hidden="true" />
                )}
              </summary>
              <div>
                {walkthrough && preferencesMenuItem}
                {!walkthrough && (
                  <>
                    <p>
                      {sessionPresentation?.menuDescription ??
                        runtime.error ??
                        (runtime.configured
                          ? "Your home stays local."
                          : "Connect Home Assistant to control your home.")}
                    </p>
                    {props.onWorkspaces && (
                      <button
                        type="button"
                        className="scene-menu__workspace"
                        onClick={(event) => {
                          event.currentTarget.closest("details")?.removeAttribute("open");
                          props.onWorkspaces?.();
                        }}
                      >
                        <SceneMenuIcon name="workspaces" />
                        <span className="scene-menu__copy">
                          <strong>Switch workspace</strong>
                          <small title={manifest.home.name}>{manifest.home.name}</small>
                        </span>
                      </button>
                    )}
                    {props.onEditHome && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.currentTarget.closest("details")?.removeAttribute("open");
                          props.onEditHome?.("construct");
                        }}
                      >
                        <SceneMenuIcon name="editor" />
                        <span>Edit the home</span>
                      </button>
                    )}
                    {props.onHomeAssistantSettings && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.currentTarget.closest("details")?.removeAttribute("open");
                          props.onHomeAssistantSettings?.();
                        }}
                      >
                        <SceneMenuIcon name="connect" />
                        <span>Home Assistant</span>
                      </button>
                    )}
                    {props.onCustomizeActionBar && (
                      <CustomizeActionBarMenuItem onClick={props.onCustomizeActionBar} />
                    )}
                    {setupAction && (
                      <button
                        type="button"
                        className={setupAction.attention ? "scene-menu__review" : undefined}
                        onClick={(event) => {
                          event.currentTarget.closest("details")?.removeAttribute("open");
                          setMappingOpen(false);
                          goHome();
                          setupAction.onOpen();
                        }}
                      >
                        <SceneMenuIcon name="setup" />
                        {setupAction.attention && (
                          <i className="scene-menu__review-dot" aria-hidden="true" />
                        )}
                        <span className="scene-menu__copy">
                          <strong>{setupAction.label}</strong>
                          <small>{setupAction.detail}</small>
                        </span>
                      </button>
                    )}
                    {!demoSession &&
                      runtime.configured &&
                      ["disconnected", "auth-expired"].includes(runtime.status) && (
                        <button type="button" onClick={runtime.connect}>
                          <SceneMenuIcon name="connect" />
                          <span>Connect to Home Assistant</span>
                        </button>
                      )}
                    {!demoSession && runtime.status === "error" && (
                      <button type="button" onClick={runtime.retry}>
                        <SceneMenuIcon name="retry" />
                        <span>Retry connection</span>
                      </button>
                    )}
                    {preferencesMenuItem}
                    <a
                      href="https://tally.so/r/QK6dMA"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Send feedback (opens in a new tab)"
                      onClick={(event) =>
                        event.currentTarget.closest("details")?.removeAttribute("open")
                      }
                    >
                      <SceneMenuIcon name="feedback" />
                      <span>Send feedback</span>
                    </a>
                    {!demoSession &&
                      ["connected", "connecting", "reconnecting", "error"].includes(
                        runtime.status,
                      ) && (
                        <button
                          type="button"
                          className="scene-menu__disconnect"
                          onClick={() => void runtime.disconnect()}
                        >
                          <SceneMenuIcon name="disconnect" />
                          <span className="scene-menu__copy">
                            <strong>Disconnect</strong>
                            <small>Home Assistant</small>
                          </span>
                        </button>
                      )}
                  </>
                )}
              </div>
            </details>
          </header>
          {preferencesOpen && (
            <WalkPreferences
              inverted={invertYAxis}
              lightingSource={solarLighting.source}
              lightingMode={lightingMode}
              onLightingModeChange={chooseLightingMode}
              onChange={(value) => {
                setInvertYAxis(value);
                saveInvertYAxis(value);
              }}
              onClose={closePreferences}
            />
          )}

          {controlRoom && resolvedBindings.rooms[controlRoom.id] && (
            <RoomDashboardPanel
              resolved={resolvedBindings.rooms[controlRoom.id]}
              roomStatus={roomStatuses[controlRoom.id]}
              status={runtime.status}
              canMutate={runtime.canMutate}
              selectedDeviceId={selectedDeviceId}
              onSelectDevice={(deviceId) => {
                if (deviceId === null && deviceOverlay) {
                  closeDevicePanel();
                  return;
                }
                setSelectedDeviceId(deviceId);
              }}
              onCallService={runtime.callService}
              onHome={deviceOverlay ? closeDevicePanel : goHome}
              onWalk={enterWalkMode}
              onConnectDevices={() => {
                if (onOpenConnect) {
                  onOpenConnect("devices", controlRoom.id);
                  return;
                }
                if (demoSession) setupAction?.onOpen();
                else {
                  setMappingView("devices");
                  setMappingOpen(true);
                }
              }}
              onReconnect={runtime.connect}
              onRetry={runtime.retry}
              liveCameraDeviceIds={liveCameraDeviceIds}
              onOpenLiveFeed={(deviceId) => openCameraViewer(controlRoom.id, deviceId)}
              deviceOverlay={deviceOverlay}
              onEscape={deviceOverlay ? () => closeDevicePanel("after-escape") : undefined}
            />
          )}

          {!onOpenConnect && !demoSession && runtime.status === "connected" && mappingOpen && (
            <HomeAssistantMappingScreen
              manifest={manifest}
              runtime={runtime}
              manager={bindingManager}
              initialRoomId={selectedRoomId}
              initialView={mappingView}
              refreshing={runtime.refreshing}
              refreshError={runtime.refreshError}
              onRefresh={runtime.refresh}
              onClose={() => setMappingOpen(false)}
            />
          )}

          {selectedCamera && (
            <CameraViewer
              roomName={
                floor.rooms.find((room) => room.id === selectedCamera.roomId)?.name ?? "Camera"
              }
              label={selectedCamera.label}
              media={liveMediaByEntityId[selectedCamera.entityId]}
              onClose={closeCameraViewer}
              onReviewConnections={() => {
                const camera = selectedCamera;
                if (onOpenConnect) {
                  setSelectedCamera(null);
                  onOpenConnect("devices", camera.roomId);
                  return;
                }
                setSelectedCamera(null);
                setSelectedRoomId(camera.roomId);
                setSelectedDeviceId(camera.deviceId);
                setMode("room");
                if (demoSession) setupAction?.onOpen();
                else {
                  setMappingView("devices");
                  setMappingOpen(true);
                  if (runtime.status !== "connected") runtime.connect();
                }
              }}
            />
          )}
          {walkMode && (
            <div className="walk-controls">
              {!equippedTool && <div className="walk-reticle" aria-hidden="true" />}
              {!walkthrough && !equippedTool && walkDeviceTarget && (
                <button
                  type="button"
                  className="walk-device-action"
                  aria-label={`Open ${walkDeviceTarget.label}`}
                  onClick={openWalkDevice}
                >
                  {!coarsePointer && <kbd>E</kbd>}
                  <span>Open {walkDeviceTarget.label}</span>
                </button>
              )}
              {!coarsePointer && walkPointerLocked && !deviceOverlay && (
                <DesktopLookSurface lookDeltaRef={lookDeltaRef} />
              )}
              {coarsePointer && (
                <>
                  <VirtualJoystick label="Move" side="left" inputRef={movementInputRef} />
                  <VirtualJoystick label="Look around" side="right" inputRef={lookInputRef} />
                </>
              )}
            </div>
          )}

          {!walkthrough && (
            <SceneActionBar
              items={actionBarItems}
              walkTools={props.walkTools}
              activeWalkToolId={walkMode ? equippedToolId : null}
              targets={actionBarTargets}
              renderDeviceIcon={props.renderActionBarDeviceIcon}
              mode={mode}
              roofVisible={floorNavigation.wholeBuilding}
              keyboardEnabled={toolInputEnabled}
              onToggleRoof={
                walkMode
                  ? undefined
                  : () => {
                      floorNavigation.setWholeBuilding(!floorNavigation.wholeBuilding);
                      setSelectedRoomId(null);
                      setSelectedDeviceId(null);
                      setMode("overview");
                    }
              }
              lighting={nightLighting ? "night" : "day"}
              wallFade={wallFadeEnabled}
              allLightsEnabled={runtime.canMutate && Boolean(allLightsCall) && !allLightsBusy}
              allLightsBusy={allLightsBusy}
              onAction={runConfiguredAction}
              onChildAction={runAction}
            />
          )}
          {sceneActionError && (
            <p className="scene-action-error" role="alert">
              {sceneActionError}
              <button
                type="button"
                onClick={() => setSceneActionError(null)}
                aria-label="Dismiss error"
              >
                ×
              </button>
            </p>
          )}
        </main>
      )}
    </CameraStreamCoordinator>
  );
}
