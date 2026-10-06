import { Quaternion, Vector3 } from "three";
import { type PortalAnchor, type PortalColor, type PortalPair } from "./portal-contract";
import { portalsOverlap } from "./portal-placement";

export const PORTAL_STORAGE_ID = "cabane.laser";
export interface PortalState { pair: PortalPair; next: PortalColor }
const object = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const tuple = (value: unknown, size: number): value is number[] => Array.isArray(value) && value.length === size && value.every(n => typeof n === "number" && Number.isFinite(n) && Math.abs(n) < 1e6);

function decodeAnchor(value: unknown): PortalAnchor | undefined {
  if (!object(value) || !tuple(value.center, 3) || !tuple(value.normal, 3) || !tuple(value.rotation, 4) || !object(value.landing)) return;
  const { x, z, elevation, floorId } = value.landing;
  if (![x, z, elevation].every(n => typeof n === "number" && Number.isFinite(n) && Math.abs(n) < 1e6) || typeof floorId !== "string" || !floorId) return;
  const normal = new Vector3().fromArray(value.normal);
  const rotation = new Quaternion().fromArray(value.rotation);
  if (Math.abs(normal.length() - 1) > .001 || Math.abs(rotation.length() - 1) > .001
    || (Math.abs(normal.y) > .001 && normal.y < .999)
    || new Vector3(0, 0, 1).applyQuaternion(rotation).dot(normal) < .999) return;
  return { center: new Vector3().fromArray(value.center), normal, rotation,
    landing: { x: x as number, z: z as number, elevation: elevation as number, floorId } };
}

/** Unsupported versions and damaged anchors never become render or traversal inputs. */
export function decodePortalState(value: unknown): PortalState {
  if (!object(value) || value.version !== 1 || !object(value.pair)) return { pair: {}, next: "blue" };
  const pair: PortalPair = {};
  for (const color of ["blue", "gold"] as const) {
    const anchor = decodeAnchor(value.pair[color]);
    if (anchor) pair[color] = anchor;
  }
  if (pair.blue && pair.gold && portalsOverlap(pair.blue, pair.gold)) delete pair.gold;
  return { pair, next: value.next === "gold" ? "gold" : "blue" };
}
export function encodePortalState({ pair, next }: PortalState) {
  return { version: 1, next, pair: Object.fromEntries(Object.entries(pair).map(([color, anchor]) => [color, {
    center: anchor.center.toArray(), normal: anchor.normal.toArray(), rotation: anchor.rotation.toArray(), landing: { ...anchor.landing },
  }])) };
}
