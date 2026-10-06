/*
 * Planar face traversal follows the conventional directed half-edge walk used
 * by OpenPlan3D and ai_room_planner (MIT). The implementation is original to
 * Cabane and keeps the data model independent from either application.
 */

import { polygonSignedArea } from "../../geometry";

import type { ManifestIssue, PlanPoint, Polygon } from "../../types";
import {
  DirectedEdge,
  EditorWall,
  FLOOR_EDITOR_EPSILON,
  Node,
  Subsegment,
} from "./topology-contract";
import {
  collinearOverlap,
  issue,
  point,
  pointKey,
  pointOnSegment,
  progressOnWall,
  properIntersection,
  samePoint,
} from "./topology-plan-math";

export const buildGraph = (walls: readonly EditorWall[], issues: ManifestIssue[]) => {
  const splitPoints = new Map(walls.map((wall) => [wall.id, [wall.from, wall.to] as PlanPoint[]]));
  for (let leftIndex = 0; leftIndex < walls.length; leftIndex += 1) {
    const left = walls[leftIndex];
    for (let rightIndex = leftIndex + 1; rightIndex < walls.length; rightIndex += 1) {
      const right = walls[rightIndex];
      if (collinearOverlap(left, right)) {
        issues.push(
          issue(
            "topology.wall-overlap",
            `walls.${right.id}`,
            `Wall “${right.id}” overlaps collinear wall “${left.id}”.`,
          ),
        );
        continue;
      }
      const intersection = properIntersection(left, right);
      if (intersection) {
        splitPoints.get(left.id)!.push(intersection);
        splitPoints.get(right.id)!.push(intersection);
      }
      for (const endpoint of [left.from, left.to]) {
        if (pointOnSegment(endpoint, right)) splitPoints.get(right.id)!.push(endpoint);
      }
      for (const endpoint of [right.from, right.to]) {
        if (pointOnSegment(endpoint, left)) splitPoints.get(left.id)!.push(endpoint);
      }
    }
  }
  const nodeByKey = new Map<string, Node>();
  const nodeFor = (value: PlanPoint) => {
    const key = pointKey(value);
    const existing = nodeByKey.get(key);
    if (existing) return existing;
    const node = { key, point: point(value[0], value[1]) };
    nodeByKey.set(key, node);
    return node;
  };
  const subsegments: Subsegment[] = [];
  for (const wall of walls) {
    const ordered = splitPoints
      .get(wall.id)!
      .filter(
        (candidate, index, all) =>
          !all.slice(0, index).some((other) => samePoint(candidate, other)),
      )
      .sort((left, right) => progressOnWall(left, wall) - progressOnWall(right, wall));
    for (let index = 1; index < ordered.length; index += 1) {
      const from = nodeFor(ordered[index - 1]);
      const to = nodeFor(ordered[index]);
      if (samePoint(from.point, to.point)) continue;
      subsegments.push({ id: `${wall.id}:${index - 1}`, wallId: wall.id, from, to });
    }
  }
  return { nodes: [...nodeByKey.values()], subsegments };
};

export const traverseFaces = (nodes: readonly Node[], segments: readonly Subsegment[]) => {
  const edges = new Map<string, DirectedEdge>();
  const outgoing = new Map(nodes.map((node) => [node.key, [] as DirectedEdge[]]));
  for (const segment of segments) {
    const forward: DirectedEdge = {
      id: `${segment.id}:forward`,
      segment,
      from: segment.from,
      to: segment.to,
      reverseId: `${segment.id}:reverse`,
    };
    const reverse: DirectedEdge = {
      id: `${segment.id}:reverse`,
      segment,
      from: segment.to,
      to: segment.from,
      reverseId: `${segment.id}:forward`,
    };
    edges.set(forward.id, forward);
    edges.set(reverse.id, reverse);
    outgoing.get(forward.from.key)!.push(forward);
    outgoing.get(reverse.from.key)!.push(reverse);
  }
  for (const list of outgoing.values())
    list.sort(
      (left, right) =>
        Math.atan2(left.to.point[1] - left.from.point[1], left.to.point[0] - left.from.point[0]) -
        Math.atan2(
          right.to.point[1] - right.from.point[1],
          right.to.point[0] - right.from.point[0],
        ),
    );
  const visited = new Set<string>();
  const edgeFace = new Map<string, number>();
  const faces: Polygon[] = [];
  for (const start of edges.values()) {
    if (visited.has(start.id)) continue;
    const walked: DirectedEdge[] = [];
    let current = start;
    let closed = false;
    for (let guard = 0; guard <= edges.size + 1; guard += 1) {
      if (visited.has(current.id) && current.id !== start.id) break;
      visited.add(current.id);
      walked.push(current);
      const candidates = outgoing.get(current.to.key)!;
      const reverseIndex = candidates.findIndex((candidate) => candidate.id === current.reverseId);
      if (reverseIndex < 0) break;
      current = candidates[(reverseIndex - 1 + candidates.length) % candidates.length];
      if (current.id === start.id) {
        closed = true;
        break;
      }
    }
    if (!closed) continue;
    // A separator is traversed in both directions by the same face. Keep it
    // in edgeFace for classification, but omit its out-and-back excursion
    // from the room polygon so that the boundary stays simple.
    const walkedIds = new Set(walked.map((edge) => edge.id));
    const polygon = walked
      .filter((edge) => !walkedIds.has(edge.reverseId))
      .map((edge) => edge.from.point);
    if (polygon.length < 3) continue;
    const candidate = polygon as [PlanPoint, PlanPoint, PlanPoint, ...PlanPoint[]];
    if (polygonSignedArea(candidate) <= FLOOR_EDITOR_EPSILON) continue;
    const faceIndex = faces.length;
    faces.push(candidate);
    walked.forEach((edge) => edgeFace.set(edge.id, faceIndex));
  }
  return { faces, edgeFace };
};

export const connected = (nodes: readonly Node[], segments: readonly Subsegment[]) => {
  if (nodes.length === 0) return false;
  const adjacent = new Map(nodes.map((node) => [node.key, new Set<string>()]));
  segments.forEach((segment) => {
    adjacent.get(segment.from.key)!.add(segment.to.key);
    adjacent.get(segment.to.key)!.add(segment.from.key);
  });
  const pending = [nodes[0].key];
  const seen = new Set<string>();
  while (pending.length) {
    const key = pending.pop()!;
    if (seen.has(key)) continue;
    seen.add(key);
    adjacent.get(key)?.forEach((next) => pending.push(next));
  }
  return seen.size === nodes.length;
};
