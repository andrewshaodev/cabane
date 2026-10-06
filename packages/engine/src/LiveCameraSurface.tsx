import { useThree } from "@react-three/fiber";
import {
  DataTexture,
  LinearFilter,
  RGBAFormat,
  SRGBColorSpace,
  TextureLoader,
  UnsignedByteType,
  VideoTexture,
  type Texture,
} from "three";
import { useEffect, useMemo, useState } from "react";
import { ToonMaterial } from "./rendering";
import type { DeviceLiveMedia } from "./types";

const VIDEO_FRAME_WATCHDOG_INTERVAL_MS = 125;
const VIDEO_FRAME_STALL_MS = 250;

const makeOfflineTexture = () => {
  const width = 32;
  const height = 18;
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const scanline = y % 3 === 0 ? 10 : 0;
      const glow = Math.max(0, 1 - Math.hypot(x - 22, y - 5) / 22);
      data[index] = 10 + Math.round(glow * 16);
      data[index + 1] = 31 + scanline + Math.round(glow * 45);
      data[index + 2] = 32 + scanline + Math.round(glow * 40);
      data[index + 3] = 255;
    }
  }
  const texture = new DataTexture(data, width, height, RGBAFormat, UnsignedByteType);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
};

export function LiveCameraSurface({
  media,
  width,
  height,
  active = true,
  opacity = 0.82,
}: {
  media?: DeviceLiveMedia;
  width: number;
  height: number;
  active?: boolean;
  opacity?: number;
}) {
  const { invalidate } = useThree();
  const offlineTexture = useMemo(makeOfflineTexture, []);
  const [posterTexture, setPosterTexture] = useState<Texture | null>(null);
  const liveVideo =
    media?.state === "playing" && media.previewState === "live" ? media.video : null;
  const videoTexture = useMemo(() => {
    if (!liveVideo) return null;
    const texture = new VideoTexture(liveVideo);
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.generateMipmaps = false;
    return texture;
  }, [liveVideo]);

  useEffect(() => () => offlineTexture.dispose(), [offlineTexture]);
  useEffect(() => () => videoTexture?.dispose(), [videoTexture]);
  useEffect(() => {
    let cancelled = false;
    let loadedTexture: Texture | null = null;
    setPosterTexture(null);
    if (!media?.posterUrl) return undefined;
    const loader = new TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      media.posterUrl,
      (texture) => {
        loadedTexture = texture;
        texture.colorSpace = SRGBColorSpace;
        texture.minFilter = LinearFilter;
        texture.magFilter = LinearFilter;
        texture.generateMipmaps = false;
        if (cancelled) texture.dispose();
        else {
          setPosterTexture(texture);
          invalidate();
        }
      },
      undefined,
      () => {
        if (!cancelled) setPosterTexture(null);
      },
    );
    return () => {
      cancelled = true;
      loadedTexture?.dispose();
    };
  }, [invalidate, media?.posterUrl]);

  useEffect(() => {
    if (!liveVideo || !videoTexture || !active) return undefined;
    let cancelled = false;
    let callbackId = 0;
    let lastVideoFrameAt = performance.now();
    const update = () => {
      if (cancelled) return;
      lastVideoFrameAt = performance.now();
      videoTexture.needsUpdate = true;
      invalidate();
      callbackId = liveVideo.requestVideoFrameCallback(update);
    };
    const supportsVideoFrameCallback = typeof liveVideo.requestVideoFrameCallback === "function";
    if (supportsVideoFrameCallback) callbackId = liveVideo.requestVideoFrameCallback(update);
    const intervalId = globalThis.setInterval(() => {
      const callbackStalled =
        !supportsVideoFrameCallback || performance.now() - lastVideoFrameAt >= VIDEO_FRAME_STALL_MS;
      if (
        callbackStalled &&
        !liveVideo.paused &&
        liveVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
      ) {
        videoTexture.needsUpdate = true;
        invalidate();
      }
    }, VIDEO_FRAME_WATCHDOG_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (callbackId && typeof liveVideo.cancelVideoFrameCallback === "function") {
        liveVideo.cancelVideoFrameCallback(callbackId);
      }
      globalThis.clearInterval(intervalId);
    };
  }, [active, invalidate, liveVideo, videoTexture]);

  const map = videoTexture ?? posterTexture ?? offlineTexture;
  return (
    <mesh name="camera-screen-live-surface" renderOrder={10}>
      <planeGeometry args={[width, height]} />
      <ToonMaterial
        map={map}
        emissiveMap={map}
        emissive="#eafff8"
        emissiveIntensity={videoTexture ? 0.72 : posterTexture ? 0.58 : 0.38}
        toneMapped={false}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  );
}
