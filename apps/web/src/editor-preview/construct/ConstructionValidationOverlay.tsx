import { Html } from "@react-three/drei";
import { resolveItemTransform, ToonMaterial as LitMaterial, type FloorSpec, type SceneItemSpec } from "@cabane/engine";
import { PlanOverlayMaterial } from "./PlanDrawing";
import { DoubleSide } from "three";
import { useMemo } from "react";
import { useValidationLabels } from "./useValidationLabels";
import { constructPlanToWorld, wallOverlayTransform } from "./drag-geometry";
import type { ConstructContextualIssue } from "./contextual-validation";
import {
  constructIssueShortLabel,
  constructIssueKey,
  constructIssuePlanPoint,
  constructIssueVisualTargets,
  constructTargetPlanPoint,
} from "./validation-visuals";

export function ConstructionValidationOverlay({
  planMode = false,
  floor,
  sceneItems,
  issues,
  activeIssueKey,
  focusVersion = 0,
  showLabels = true,
  onActivate,
}: {
  planMode?: boolean;
  floor: FloorSpec;
  sceneItems: readonly SceneItemSpec[];
  issues: readonly ConstructContextualIssue[];
  activeIssueKey: string | null;
  focusVersion?: number;
  showLabels?: boolean;
  onActivate: (issue: ConstructContextualIssue) => void;
}) {
  const ToonMaterial = planMode ? PlanOverlayMaterial : LitMaterial;
  // Dismissal is local to this editor session and only hides the HTML marker.
  // Keep validation, blocking errors, and geometry highlights unchanged.
  const { hiddenKeys: dismissedIssueKeys, hide } = useValidationLabels(issues, activeIssueKey, focusVersion);
  const errorIssues = useMemo(() => issues.filter((issue) => issue.severity !== "warning"), [issues]);
  const visuals = useMemo(() => errorIssues.flatMap((issue) =>
    constructIssueVisualTargets(issue, floor, sceneItems).map((target) => ({ issue, target }))
  ), [errorIssues, floor, sceneItems]);
  const areaEdges = useMemo(() => visuals.flatMap(({ issue, target }) => {
    const area = target.kind === "outdoor-platform" ? floor.outdoorPlatforms?.find(p=>p.id===target.id) : target.kind === "pool"
      ? floor.pools?.find((candidate) => candidate.id === target.id)
      : target.kind === "room"
        ? floor.rooms.find((candidate) => candidate.id === target.id)
        : target.kind === "floor-zone"
          ? [...(floor.groundZones ?? []), ...floor.rooms.flatMap((room) => room.floorZones ?? [])]
            .find((candidate) => candidate.id === target.id)
          : undefined;
    if (!area) return [];
    return area.polygon.map((from, edgeIndex) => ({
      issue,
      target,
      edgeIndex,
      transform: wallOverlayTransform(from, area.polygon[(edgeIndex + 1) % area.polygon.length], floor.coordinates),
    }));
  }), [floor, visuals]);
  const markerGroups = useMemo(() => {
    const groups = new Map<string, {
      point: readonly [number, number];
      issues: ConstructContextualIssue[];
    }>();
    errorIssues.forEach((issue) => {
      if (dismissedIssueKeys.has(constructIssueKey(issue))) return;
      const point = constructIssuePlanPoint(issue, floor, sceneItems);
      if (!point) return;
      const key = `${point[0].toFixed(4)}:${point[1].toFixed(4)}`;
      const group = groups.get(key);
      if (group) group.issues.push(issue);
      else groups.set(key, { point, issues: [issue] });
    });
    return [...groups.values()];
  }, [dismissedIssueKeys, errorIssues, floor, sceneItems]);

  return (
    <group name="construction-validation-overlay">
      {visuals.map(({ issue, target }, index) => {
        if (target.kind === "wall") {
          const wall = floor.walls.find((candidate) => candidate.id === target.id);
          if (!wall) return null;
          const transform = wallOverlayTransform(wall.from, wall.to, floor.coordinates);
          const wallHeight = wall.heightMeters ?? floor.defaultWallHeightMeters;
          return (
            <mesh key={`${constructIssueKey(issue)}:${target.kind}:${target.id}`} name={`validation-wall-${target.id}`} position={[transform.center[0], wallHeight / 2 + index * .002, transform.center[1]]} rotation={[0, transform.rotationYRadians, 0]} renderOrder={31}>
              <boxGeometry args={[transform.length + .06, wallHeight + .08, wall.thicknessMeters + .1]} />
              <ToonMaterial color="#c53f32" transparent opacity={.7} wireframe depthTest={false} depthWrite={false} />
            </mesh>
          );
        }
        if (target.kind === "opening") {
          const opening = floor.openings.find((candidate) => candidate.id === target.id);
          const wall = opening && floor.walls.find((candidate) => candidate.id === opening.wallId);
          const point = constructTargetPlanPoint(target, floor, sceneItems);
          if (!opening || !wall || !point) return null;
          const [x, z] = constructPlanToWorld(point, floor.coordinates);
          const rotation = -Math.atan2(wall.to[1] - wall.from[1], wall.to[0] - wall.from[0]);
          return (
            <mesh key={`${constructIssueKey(issue)}:${target.kind}:${target.id}`} name={`validation-opening-${target.id}`} position={[x, opening.sillHeightMeters + opening.openingHeightMeters / 2, z]} rotation={[0, rotation, 0]} renderOrder={32}>
              <boxGeometry args={[opening.widthPlanUnits * floor.coordinates.metersPerPlanUnit + .08, opening.openingHeightMeters + .08, .24]} />
              <ToonMaterial color="#d94738" transparent opacity={.78} wireframe depthTest={false} depthWrite={false} />
            </mesh>
          );
        }
        if (target.kind === "junction") {
          const point = constructTargetPlanPoint(target, floor, sceneItems);
          if (!point) return null;
          const [x, z] = constructPlanToWorld(point, floor.coordinates);
          return (
            <mesh key={`${constructIssueKey(issue)}:${target.kind}:${target.id}`} name={`validation-junction-${target.id}`} position={[x, .12, z]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={33}>
              <ringGeometry args={[.2, .31, 28]} />
              <ToonMaterial color="#d94738" transparent opacity={.95} side={DoubleSide} depthTest={false} depthWrite={false} />
            </mesh>
          );
        }
        if (target.kind === "scene-item") {
          const item = sceneItems.find((candidate) => candidate.id === target.id);
          const point = constructTargetPlanPoint(target, floor, sceneItems);
          if (!item || !point) return null;
          const [x, z] = constructPlanToWorld(point, floor.coordinates);
          let rotationYRadians = 0;
          let baseY = item.placement.kind === "ceiling"
            ? floor.defaultCeilingHeightMeters - item.placement.dropMeters
            : item.placement.elevationMeters;
          try {
            const transform = resolveItemTransform(item.placement, floor);
            rotationYRadians = transform.rotationYRadians;
            baseY = transform.position[1];
          } catch {
            // Invalid supports still need a visible, non-crashing marker.
          }
          return (
            <mesh key={`${constructIssueKey(issue)}:${target.kind}:${target.id}`} name={`validation-item-${target.id}`} position={[x, Math.max(.15, baseY + item.size[1] / 2), z]} rotation={[0, rotationYRadians, 0]} renderOrder={31}>
              <boxGeometry args={[item.size[0] + .12, item.size[1] + .12, item.size[2] + .12]} />
              <ToonMaterial color="#d94738" transparent opacity={.68} wireframe depthTest={false} depthWrite={false} />
            </mesh>
          );
        }
        return null;
      })}
      {areaEdges.map(({ issue, target, edgeIndex, transform }) => (
        <mesh
          key={`${constructIssueKey(issue)}:${target.id}:${edgeIndex}`}
          name={`validation-${target.kind}-${target.id}-edge-${edgeIndex}`}
          position={[transform.center[0], .06, transform.center[1]]}
          rotation={[0, transform.rotationYRadians, 0]}
          renderOrder={30}
        >
          <boxGeometry args={[transform.length + .035, .055, .09]} />
          <ToonMaterial color="#c53f32" transparent opacity={.84} side={DoubleSide} depthTest={false} depthWrite={false} />
        </mesh>
      ))}
      {showLabels && markerGroups.map(({ point, issues: markerIssues }, index) => {
        const [x, z] = constructPlanToWorld(point, floor.coordinates);
        const issue = markerIssues[0];
        const active = markerIssues.some((candidate) => constructIssueKey(candidate) === activeIssueKey);
        const label = markerIssues.length === 1
          ? constructIssueShortLabel(issue)
          : `${markerIssues.length} issues here`;
        return (
          <Html
            key={`${x}:${z}`}
            position={[x, .55, z]}
            center
            zIndexRange={[90, 70]}
            wrapperClass="construction-validation-overlay-label"
            style={{ pointerEvents: "none" }}
          >
            <div
              className={`construction-validation-marker ${active ? "is-active" : ""}`}
              role="group"
              aria-label={label}
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="construction-validation-marker__details"
                aria-label={`${label}. ${markerIssues.map((candidate) => candidate.message).join(" ")}`}
                title={markerIssues.map((candidate) => candidate.message).join("\n")}
                onClick={(event) => { event.stopPropagation(); onActivate(issue); }}
              >
                <span>{index + 1}</span>
                <strong>{label}</strong>
              </button>
              <button
                type="button"
                className="construction-validation-marker__dismiss"
                aria-label={`Hide error label: ${label}`}
                title="Hide this label. Use Locate in the issue list to show it again."
                onClick={(event) => {
                  event.stopPropagation();
                  hide(markerIssues.map(constructIssueKey));
                }}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          </Html>
        );
      })}
    </group>
  );
}
