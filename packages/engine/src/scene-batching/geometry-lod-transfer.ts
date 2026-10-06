import { BufferAttribute, BufferGeometry } from "three";

export type GeometryPayload = {
  position: Float32Array;
  normal: Float32Array;
  color?: Float32Array;
  index: Uint32Array;
};
export type LodRequest = { id: number; geometry: GeometryPayload };
export type LodReply = { id: number; levels: Array<{ geometry: GeometryPayload; error: number }> };

export function packGeometry(geometry: BufferGeometry, copy = true): GeometryPayload {
  const attribute = (name: string) => {
    const array = geometry.attributes[name].array as Float32Array;
    return copy ? array.slice() : array;
  };
  return {
    position: attribute("position"),
    normal: attribute("normal"),
    color: geometry.attributes.color ? attribute("color") : undefined,
    index: geometry.index
      ? Uint32Array.from(geometry.index.array)
      : Uint32Array.from({ length: geometry.attributes.position.count }, (_, index) => index),
  };
}
export function unpackGeometry(payload: GeometryPayload): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(payload.position, 3));
  geometry.setAttribute("normal", new BufferAttribute(payload.normal, 3));
  if (payload.color) geometry.setAttribute("color", new BufferAttribute(payload.color, 3));
  geometry.setIndex(new BufferAttribute(payload.index, 1));
  return geometry;
}
export function geometryTransfers(payload: GeometryPayload): Transferable[] {
  return [
    payload.position.buffer,
    payload.normal.buffer,
    payload.index.buffer,
    ...(payload.color ? [payload.color.buffer] : []),
  ] as ArrayBuffer[];
}
