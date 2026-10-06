export const makeVideo = (requestCorsFrames = true, container: HTMLElement = document.body) => {
  const video = document.createElement("video");
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  if (requestCorsFrames) video.crossOrigin = "anonymous";
  video.preload = "auto";
  video.disablePictureInPicture = true;
  video.className = "camera-stream-video is-parked";
  video.setAttribute("aria-hidden", "true");
  container.appendChild(video);
  return video;
};

export const closeVideo = (video: HTMLVideoElement) => {
  video.dataset.cameraClosed = "true";
  video.pause();
  video.removeAttribute("src");
  video.srcObject = null;
  video.load();
  video.remove();
};

export const waitForFirstFrame = (
  video: HTMLVideoElement,
  signal: AbortSignal,
) => new Promise<void>((resolve, reject) => {
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    resolve();
    return;
  }
  const cleanup = () => {
    video.removeEventListener("loadeddata", loaded);
    video.removeEventListener("error", failed);
    signal.removeEventListener("abort", aborted);
  };
  const loaded = () => { cleanup(); resolve(); };
  const failed = () => { cleanup(); reject(new Error("Camera media playback failed.")); };
  const aborted = () => { cleanup(); reject(signal.reason ?? new Error("Camera connection interrupted.")); };
  if (signal.aborted) aborted();
  else {
    video.addEventListener("loadeddata", loaded, { once: true });
    video.addEventListener("error", failed, { once: true });
    signal.addEventListener("abort", aborted, { once: true });
  }
});

export const waitWithSignal = <T,>(promise: Promise<T>, signal: AbortSignal) =>
  new Promise<T>((resolve, reject) => {
    const aborted = () => reject(signal.reason ?? new Error("Camera connection interrupted."));
    if (signal.aborted) {
      aborted();
      return;
    }
    signal.addEventListener("abort", aborted, { once: true });
    promise.then(
      (value) => { signal.removeEventListener("abort", aborted); resolve(value); },
      (error) => { signal.removeEventListener("abort", aborted); reject(error); },
    );
  });

export const throwIfAborted = (signal: AbortSignal) => {
  if (signal.aborted) throw signal.reason ?? new Error("Camera connection interrupted.");
};
