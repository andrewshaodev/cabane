import type { BufferGeometry } from "three";
import type { GeometryLod } from "./geometry-lod";
import {
  geometryTransfers,
  packGeometry,
  unpackGeometry,
  type LodReply,
  type LodRequest,
} from "./geometry-lod-transfer";

/** No main-thread simplification fallback: unavailable workers keep full detail. */
export class GeometryLodWorker {
  private worker?: Worker;
  private failed = false;
  private nextId = 0;
  private pending = new Map<number, (levels: GeometryLod[]) => void>();
  prepare = (geometry: BufferGeometry): Promise<GeometryLod[]> => {
    if (this.failed || typeof Worker === "undefined") return Promise.resolve([]);
    try {
      if (!this.worker) {
        this.worker = new Worker(new URL("./geometry-lod.worker.ts", import.meta.url), {
          type: "module",
        });
        this.worker.onmessage = (event: MessageEvent<LodReply>) => {
          const resolve = this.pending.get(event.data.id);
          if (!resolve) return;
          this.pending.delete(event.data.id);
          resolve(
            event.data.levels.map((level) => ({
              geometry: unpackGeometry(level.geometry),
              error: level.error,
            })),
          );
        };
        this.worker.onerror = () => {
          this.failed = true;
          this.dispose();
        };
      }
      const request: LodRequest = { id: ++this.nextId, geometry: packGeometry(geometry) };
      return new Promise((resolve) => {
        this.pending.set(request.id, resolve);
        try {
          this.worker!.postMessage(request, geometryTransfers(request.geometry));
        } catch {
          this.failed = true;
          this.dispose();
        }
      });
    } catch {
      this.failed = true;
      this.dispose();
      return Promise.resolve([]);
    }
  };
  dispose() {
    this.worker?.terminate();
    this.worker = undefined;
    for (const resolve of this.pending.values()) resolve([]);
    this.pending.clear();
  }
}
