import { createGeometryLods } from "./geometry-lod";
import {
  geometryTransfers,
  packGeometry,
  unpackGeometry,
  type LodRequest,
  type LodReply,
} from "./geometry-lod-transfer";

self.onmessage = async (event: MessageEvent<LodRequest>) => {
  const source = unpackGeometry(event.data.geometry);
  const reply: LodReply = { id: event.data.id, levels: [] };
  try {
    const levels = await createGeometryLods(source);
    reply.levels = levels.map((level) => ({
      geometry: packGeometry(level.geometry, false),
      error: level.error,
    }));
    levels.forEach((level) => level.geometry.dispose());
  } catch {
    /* Keep authored geometry when a mesh cannot be simplified. */
  } finally {
    source.dispose();
  }
  self.postMessage(reply, {
    transfer: reply.levels.flatMap((level) => geometryTransfers(level.geometry)),
  });
};
