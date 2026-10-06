import { ConstructionValidationMarker } from "./ConstructionValidationMarker";
import { Html } from "@react-three/drei";
import {
  resolveItemTransform,
  ToonMaterial as LitMaterial,
  type FloorSpec,
  type SceneItemSpec,
} from "@cabane/engine";
import { PlanOverlayMaterial } from "./PlanDrawing";
import { DoubleSide } from "three";
import { useMemo } from "react";
import { useValidationLabels } from "./useValidationLabels";
import { constructPlanToWorld, wallOverlayTransform } from "./drag-geometry";
import type { ConstructContextualIssue } from "./contextual-validation";
import {
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
  const { hiddenKeys: dismissedIssueKeys, hide } = useValidationLabels(
    issues,
    activeIssueKey,
    focusVersion,
  );
  const errorIssues = useMemo(
    () =>
      issues.filter(
        (issue) => issue.severity !== "warning" && (!issue.floorId || issue.floorId === floor.id),
      ),
    [issues, floor.id],
  );
  const visuals = useMemo(
    () =>
      errorIssues.flatMap((issue) =>
        constructIssueVisualTargets(issue, floor, sceneItems).map((target) => ({ issue, target })),
      ),
    [errorIssues, floor, sceneItems],
  );
  const areaEdges = useMemo(
    () =>
      visuals.flatMap(({ issue, target }) => {
        const area =
          target.kind === "outdoor-platform"
            ? floor.outdoorPlatforms?.find((p) => p.id === target.id)
            : target.kind === "pool"
              ? floor.pools?.find((candidate) => candidate.id === target.id)
              : target.kind === "room"
                ? floor.rooms.find((candidate) => candidate.id === target.id)
                : target.kind === "floor-zone"
                  ? [
                      ...(floor.groundZones ?? []),
                      ...floor.rooms.flatMap((room) => room.floorZones ?? []),
                    ].find((candidate) => candidate.id === target.id)
                  : undefined;
        if (!area) return [];
        return area.polygon.map((from, edgeIndex) => ({
          issue,
          target,
          edgeIndex,
          transform: wallOverlayTransform(
            from,
            area.polygon[(edgeIndex + 1) % area.polygon.length],
            floor.coordinates,
          ),
        }));
      }),
    [floor, visuals],
  );
  const markerGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        point: readonly [number, number];
        issues: ConstructContextualIssue[];
      }
    >();
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
            <mesh
              key={`${constructIssueKey(issue)}:${target.kind}:${target.id}`}
              name={`validation-wall-${target.id}`}
              position={[transform.center[0], wallHeight / 2 + index * 0.002, transform.center[1]]}
              rotation={[0, transform.rotationYRadians, 0]}
              renderOrder={31}
            >
              <boxGeometry
                args={[transform.length + 0.06, wallHeight + 0.08, wall.thicknessMeters + 0.1]}
              />
              <ToonMaterial
                color="#c53f32"
                transparent
                opacity={0.7}
                wireframe
                depthTest={false}
                depthWrite={false}
              />
            </mesh>
          );
        }
        if (target.kind === "opening" || target.kind === "niche") {
          const nicheWall =
            target.kind === "niche"
              ? floor.walls.find((wall) => wall.niches?.some((niche) => niche.id === target.id))
              : undefined;
          const niche = nicheWall?.niches?.find((niche) => niche.id === target.id);
          const opening = niche
            ? {
                ...niche,
                openingHeightMeters: niche.heightMeters,
                sillHeightMeters: niche.bottomMeters,
                wallId: nicheWall!.id,
              }
            : floor.openings.find((candidate) => candidate.id === target.id);
          const wall = opening && floor.walls.find((candidate) => candidate.id === opening.wallId);
          const point = constructTargetPlanPoint(target, floor, sceneItems);
          if (!opening || !wall || !point) return null;
          const [x, z] = constructPlanToWorld(point, floor.coordinates);
          const rotation = -Math.atan2(wall.to[1] - wall.from[1], wall.to[0] - wall.from[0]);
          return (
            <mesh
              key={`${constructIssueKey(issue)}:${target.kind}:${target.id}`}
              name={`validation-opening-${target.id}`}
              position={[x, opening.sillHeightMeters + opening.openingHeightMeters / 2, z]}
              rotation={[0, rotation, 0]}
              renderOrder={32}
            >
              <boxGeometry
                args={[
                  opening.widthPlanUnits * floor.coordinates.metersPerPlanUnit + 0.08,
                  opening.openingHeightMeters + 0.08,
                  0.24,
                ]}
              />
              <ToonMaterial
                color="#d94738"
                transparent
                opacity={0.78}
                wireframe
                depthTest={false}
                depthWrite={false}
              />
            </mesh>
          );
        }
        if (target.kind === "junction") {
          const point = constructTargetPlanPoint(target, floor, sceneItems);
          if (!point) return null;
          const [x, z] = constructPlanToWorld(point, floor.coordinates);
          return (
            <mesh
              key={`${constructIssueKey(issue)}:${target.kind}:${target.id}`}
              name={`validation-junction-${target.id}`}
              position={[x, 0.12, z]}
              rotation={[-Math.PI / 2, 0, 0]}
              renderOrder={33}
            >
              <ringGeometry args={[0.2, 0.31, 28]} />
              <ToonMaterial
                color="#d94738"
                transparent
                opacity={0.95}
                side={DoubleSide}
                depthTest={false}
                depthWrite={false}
              />
            </mesh>
          );
        }
        if (target.kind === "scene-item") {
          const item = sceneItems.find((candidate) => candidate.id === target.id);
          const point = constructTargetPlanPoint(target, floor, sceneItems);
          if (!item || !point) return null;
          const [x, z] = constructPlanToWorld(point, floor.coordinates);
          let rotationYRadians = 0;
          let baseY =
            item.placement.kind === "ceiling"
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
            <mesh
              key={`${constructIssueKey(issue)}:${target.kind}:${target.id}`}
              name={`validation-item-${target.id}`}
              position={[x, Math.max(0.15, baseY + item.size[1] / 2), z]}
              rotation={[0, rotationYRadians, 0]}
              renderOrder={31}
            >
              <boxGeometry args={[item.size[0] + 0.12, item.size[1] + 0.12, item.size[2] + 0.12]} />
              <ToonMaterial
                color="#d94738"
                transparent
                opacity={0.68}
                wireframe
                depthTest={false}
                depthWrite={false}
              />
            </mesh>
          );
        }
        return null;
      })}
      {areaEdges.map(({ issue, target, edgeIndex, transform }) => (
        <mesh
          key={`${constructIssueKey(issue)}:${target.id}:${edgeIndex}`}
          name={`validation-${target.kind}-${target.id}-edge-${edgeIndex}`}
          position={[transform.center[0], 0.06, transform.center[1]]}
          rotation={[0, transform.rotationYRadians, 0]}
          renderOrder={30}
        >
          <boxGeometry args={[transform.length + 0.035, 0.055, 0.09]} />
          <ToonMaterial
            color="#c53f32"
            transparent
            opacity={0.84}
            side={DoubleSide}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
      ))}
      {showLabels &&
        markerGroups.map(({ point, issues: markerIssues }, index) => {
          const [x, z] = constructPlanToWorld(point, floor.coordinates);
          const issue = markerIssues[0];
          const active = markerIssues.some(
            (candidate) => constructIssueKey(candidate) === activeIssueKey,
          );
          return (
            <Html
              key={`${x}:${z}`}
              position={[x, 0.55, z]}
              center
              zIndexRange={[90, 70]}
              wrapperClass="construction-validation-overlay-label"
              style={{ pointerEvents: "none" }}
            >
              <ConstructionValidationMarker
                issues={markerIssues}
                number={index + 1}
                active={active}
                onActivate={() => onActivate(issue)}
                onDismiss={() => hide(markerIssues.map(constructIssueKey))}
              />
            </Html>
          );
        })}
    </group>
  );
}
