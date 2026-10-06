import Hls from "hls.js";

import type { HomeAssistantCameraClient } from "../camera-runtime";

import {
  resolveHomeAssistantMediaUrl
} from "../camera-stream";

import type {
  CameraTransport,
  EntityId
} from "../types";
import { CameraSession } from "./camera-session-types";
import { closeVideo, makeVideo, throwIfAborted, waitForFirstFrame, waitWithSignal } from "./camera-video-lifecycle";

export const openHlsSession = async (
  client: HomeAssistantCameraClient,
  entityId: EntityId,
  homeAssistantOrigin: string,
  onDisconnected: () => void,
  onVideoCreated: (video: HTMLVideoElement, transport: CameraTransport) => void,
  signal: AbortSignal,
  videoContainer?: HTMLElement,
): Promise<CameraSession> => {
  throwIfAborted(signal);
  const stream = await waitWithSignal(client.sendMessagePromise<{ url: string }>({
    type: "camera/stream",
    entity_id: entityId,
    format: "hls",
  }), signal);
  const url = resolveHomeAssistantMediaUrl(stream.url, homeAssistantOrigin);
  if (!url) throw new Error("Home Assistant returned an unsafe camera stream URL.");
  let video = makeVideo(true, videoContainer);
  onVideoCreated(video, "hls");
  let closed = false;
  let hls: Hls | null = null;
  const close = () => {
    if (closed) return;
    closed = true;
    hls?.destroy();
    hls = null;
    closeVideo(video);
    signal.removeEventListener("abort", close);
  };
  signal.addEventListener("abort", close, { once: true });
  if (signal.aborted) close();
  throwIfAborted(signal);

  const nativeHls = Boolean(video.canPlayType("application/vnd.apple.mpegurl"));
  if (nativeHls) {
    video.src = url;
  } else if (Hls.isSupported()) {
    hls = new Hls({
      lowLatencyMode: true,
      backBufferLength: 20,
      liveDurationInfinity: false,
    });
    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (!data.fatal) return;
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) onDisconnected();
      else video.dispatchEvent(new Event("error"));
    });
    hls.attachMedia(video);
    hls.loadSource(url);
  } else {
    close();
    throw new Error("This browser cannot play the camera HLS stream.");
  }

  try {
    void video.play().catch(() => undefined);
    try {
      await waitForFirstFrame(video, signal);
    } catch (error) {
      const crossOrigin = new URL(url).origin !== window.location.origin;
      if (!nativeHls || !crossOrigin || signal.aborted) throw error;
      // Safari can play a cross-origin native HLS stream that Home Assistant
      // has not CORS-enabled. Keep that DOM playback available in the viewer;
      // the texture-safety probe below will keep it out of WebGL.
      closeVideo(video);
      video = makeVideo(false, videoContainer);
      onVideoCreated(video, "hls");
      video.src = url;
      void video.play().catch(() => undefined);
      await waitForFirstFrame(video, signal);
    }
    return { video, transport: "hls", close };
  } catch (error) {
    close();
    throw error;
  }
};
