declare const __THUMBNAIL_REVISION__: string;

// Cache Storage is best-effort (private browsing, quota limits, and insecure
// origins may disable it). The memory cache still works in those environments.
const cacheName = `cabane-model-previews-${__THUMBNAIL_REVISION__}`;
const memory = new Map<string, Blob>();
const limit = 400;

function remember(key: string, blob: Blob) {
  memory.delete(key);
  memory.set(key, blob);
  if (memory.size > limit) memory.delete(memory.keys().next().value!);
}

async function storage() {
  const cache = await caches.open(cacheName);
  return cache;
}

export async function readThumbnail(key: string): Promise<Blob | undefined> {
  const hit = memory.get(key);
  if (hit) return hit;
  try {
    const blob = await (await (await storage()).match(key))?.blob();
    if (blob) remember(key, blob);
    return blob;
  } catch { return undefined; }
}

export function saveThumbnail(key: string, canvas: HTMLCanvasElement) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    remember(key, blob);
    void (async () => {
      try {
        const cache = await storage();
        await cache.put(key, new Response(blob));
        const keys = await cache.keys();
        for (const old of keys.slice(0, Math.max(0, keys.length - limit))) await cache.delete(old);
        for (const name of await caches.keys()) {
          if (name.startsWith("cabane-model-previews-") && name !== cacheName) await caches.delete(name);
        }
      } catch { /* A preview must remain usable when persistence fails. */ }
    })();
  }, "image/png");
}

export async function paintThumbnail(blob: Blob, canvas: HTMLCanvasElement, width: number, height: number, current: () => boolean) {
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (!current()) return false;
    const context = canvas.getContext("2d");
    if (!context) return false;
    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);
    return true;
  } catch { return false; }
  finally { URL.revokeObjectURL(url); }
}
