import type { CameraTransport, EntityId, EntityStateSnapshot } from "./types";

export const CAMERA_FIRST_FRAME_TIMEOUT_MS = 8_000;
export const CAMERA_HLS_FIRST_FRAME_TIMEOUT_MS = 30_000;
export const CAMERA_TRANSPORT_STAGGER_MS = 450;
export const CAMERA_DISCONNECT_RETRY_MS = 2_500;
export const CAMERA_ERROR_RETRY_MS = 5_000;

const cameraAbortError = (signal?: AbortSignal) =>
  signal?.reason instanceof Error ? signal.reason : new Error("Camera connection interrupted.");

const waitForCameraDelay = (delayMs: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timeoutId = globalThis.setTimeout(() => {
      signal.removeEventListener("abort", aborted);
      resolve();
    }, delayMs);
    const aborted = () => {
      globalThis.clearTimeout(timeoutId);
      reject(cameraAbortError(signal));
    };
    if (signal.aborted) aborted();
    else signal.addEventListener("abort", aborted, { once: true });
  });

export const runCameraTransportRace = async <T>(
  transports: readonly CameraTransport[],
  open: (transport: CameraTransport, signal: AbortSignal) => Promise<T>,
  staggerMs = CAMERA_TRANSPORT_STAGGER_MS,
  parentSignal?: AbortSignal,
): Promise<T> => {
  if (transports.length === 0) throw new Error("No camera transport is available.");
  const controllers = transports.map(() => new AbortController());
  const abortFromParent = () =>
    controllers.forEach((controller) => {
      controller.abort(cameraAbortError(parentSignal));
    });
  if (parentSignal?.aborted) abortFromParent();
  else parentSignal?.addEventListener("abort", abortFromParent, { once: true });

  const errors: unknown[] = [];
  const attempts = transports.map(async (transport, index) => {
    const signal = controllers[index].signal;
    try {
      if (index > 0 && staggerMs > 0) await waitForCameraDelay(staggerMs * index, signal);
      return { index, value: await open(transport, signal) };
    } catch (error) {
      errors[index] = error;
      throw error;
    }
  });

  try {
    const winner = await Promise.any(attempts);
    controllers.forEach((controller, index) => {
      if (index !== winner.index)
        controller.abort(new Error("Another camera transport connected first."));
    });
    return winner.value;
  } catch (error) {
    if (parentSignal?.aborted) throw cameraAbortError(parentSignal);
    for (let index = errors.length - 1; index >= 0; index -= 1) {
      if (errors[index] !== undefined) throw errors[index];
    }
    throw error;
  } finally {
    parentSignal?.removeEventListener("abort", abortFromParent);
  }
};

export const runCameraAttempt = async <T>(
  open: (signal: AbortSignal) => Promise<T>,
  timeoutMs = CAMERA_FIRST_FRAME_TIMEOUT_MS,
  parentSignal?: AbortSignal,
): Promise<T> => {
  const controller = new AbortController();
  const abortFromParent = () => controller.abort(cameraAbortError(parentSignal));
  if (parentSignal?.aborted) abortFromParent();
  else parentSignal?.addEventListener("abort", abortFromParent, { once: true });
  const timeoutId = globalThis.setTimeout(
    () => controller.abort(new Error("Camera first-frame timeout.")),
    timeoutMs,
  );
  const aborted = new Promise<never>((_resolve, reject) => {
    const rejectAbort = () => reject(cameraAbortError(controller.signal));
    if (controller.signal.aborted) rejectAbort();
    else controller.signal.addEventListener("abort", rejectAbort, { once: true });
  });
  try {
    return await Promise.race([open(controller.signal), aborted]);
  } finally {
    globalThis.clearTimeout(timeoutId);
    parentSignal?.removeEventListener("abort", abortFromParent);
  }
};

export const preferHlsForRemoteAppleClient = (
  uiUrl: string,
  homeAssistantUrl: string,
  userAgent: string,
) => {
  try {
    return (
      /\b(iPhone|iPad|iPod)\b/i.test(userAgent) &&
      new URL(uiUrl).hostname !== new URL(homeAssistantUrl).hostname
    );
  } catch {
    return false;
  }
};

export const cameraTransportCandidates = (
  frontendStreamTypes: readonly ("hls" | "web_rtc")[],
  preferHls: boolean,
  webRtcSupported: boolean,
): CameraTransport[] => {
  const available = new Set<CameraTransport>();
  if (frontendStreamTypes.includes("hls")) available.add("hls");
  if (frontendStreamTypes.includes("web_rtc") && webRtcSupported) available.add("webrtc");
  return (preferHls ? ["hls", "webrtc"] : ["webrtc", "hls"]).filter(
    (transport): transport is CameraTransport => available.has(transport as CameraTransport),
  );
};

export const appendEarlyCameraIceCandidates = (
  offerSdp: string,
  candidates: readonly Pick<RTCIceCandidate, "candidate">[],
) => candidates.reduce((sdp, candidate) => `${sdp}a=${candidate.candidate}\r\n`, offerSdp);

export const normalizeRemoteCameraCandidate = (
  candidate: RTCIceCandidateInit,
): RTCIceCandidateInit =>
  candidate.sdpMid || candidate.sdpMLineIndex != null
    ? candidate
    : { candidate: candidate.candidate, sdpMid: "0" };

export const cameraEntityAvailable = (state: EntityStateSnapshot | undefined) =>
  Boolean(
    state &&
    !state.stale &&
    state.available &&
    !["off", "unknown", "unavailable"].includes(state.state),
  );

export const deduplicateCameraStreamRequirements = <T extends { entityId: EntityId }>(
  requirements: readonly T[],
) => [...new Map(requirements.map((requirement) => [requirement.entityId, requirement])).values()];

export const resolveHomeAssistantMediaUrl = (
  path: unknown,
  homeAssistantOrigin: string | null | undefined,
) => {
  if (typeof path !== "string" || path.length === 0 || !homeAssistantOrigin) return null;
  try {
    const origin = new URL(homeAssistantOrigin).origin;
    const resolved = new URL(path, `${origin}/`);
    return resolved.origin === origin ? resolved.toString() : null;
  } catch {
    return null;
  }
};

export const cameraPosterUrl = (
  state: EntityStateSnapshot | undefined,
  homeAssistantOrigin: string | null | undefined,
) => resolveHomeAssistantMediaUrl(state?.attributes.entity_picture, homeAssistantOrigin);

export const cameraTextureIsSafe = (video: HTMLVideoElement) => {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return false;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d");
    if (!context) return false;
    context.drawImage(video, 0, 0, 1, 1);
    context.getImageData(0, 0, 1, 1);
    return true;
  } catch {
    return false;
  }
};
