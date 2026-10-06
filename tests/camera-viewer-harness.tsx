import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { CameraScreenModel } from "../packages/catalog/src/device/presets/media/camera-screen";
import { TelevisionModel } from "../packages/catalog/src/device/presets/media/television";
import { CameraViewer } from "../packages/engine/src/CameraViewer";
import type { DeviceLiveMedia } from "../packages/engine/src/types";
import "../packages/engine/src/styles.css";
import "./camera-viewer-harness.css";

const SYNTHETIC_SLOT = {
  id: "synthetic-camera-screen",
  model: "camera-screen",
  entitySlots: [],
  placement: {
    at: [0, 0] as const,
    elevationMeters: 0,
    support: { kind: "surface" as const },
  },
};

const fixtureParams = new URL(window.location.href).searchParams;
const corsBlocked = fixtureParams.get("cors") === "true";
const ScreenModel =
  fixtureParams.get("model") === "television" ? TelevisionModel : CameraScreenModel;
const reducedMotion = fixtureParams.get("reduced-motion") === "true";

function SyntheticCameraFixture() {
  const [viewerOpen, setViewerOpen] = useState(true);
  const [media, setMedia] = useState<DeviceLiveMedia>({
    kind: "camera-stream",
    video: null,
    posterUrl: null,
    state: "connecting",
    transport: "webrtc",
    previewState: "poster",
    error: null,
  });

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 540;
    const context = canvas.getContext("2d");
    if (!context || typeof canvas.captureStream !== "function") return undefined;
    let frame = 0;
    const paint = () => {
      frame += 1;
      const drift = (Math.sin(frame / 18) + 1) / 2;
      const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#163b37");
      gradient.addColorStop(0.58, "#3d776d");
      gradient.addColorStop(1, "#d59b70");
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "rgba(240, 241, 218, 0.9)";
      context.fillRect(88 + drift * 72, 116, 302, 282);
      context.fillStyle = "rgba(12, 43, 39, 0.74)";
      context.fillRect(542 - drift * 58, 158, 288, 240);
      context.strokeStyle = "rgba(133, 255, 241, 0.92)";
      context.lineWidth = 8;
      context.strokeRect(42, 42, canvas.width - 84, canvas.height - 84);
      context.fillStyle = "#e9fff9";
      context.font = "700 34px system-ui";
      context.fillText("SYNTHETIC LIVE CAMERA", 72, 92);
      context.font = "500 24px system-ui";
      context.fillText(`FRAME ${String(frame).padStart(5, "0")}`, 72, 492);
    };
    paint();
    const posterUrl = canvas.toDataURL("image/jpeg", 0.82);
    const timer = window.setInterval(paint, 1_000 / 12);
    const stream = canvas.captureStream(12);
    const video = document.createElement("video");
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.className = "camera-stream-video is-parked";
    video.dataset.syntheticCamera = "true";
    video.setAttribute("aria-hidden", "true");
    document.body.appendChild(video);
    video.srcObject = stream;
    const ready = () =>
      setMedia({
        kind: "camera-stream",
        video,
        posterUrl,
        state: "playing",
        transport: "webrtc",
        previewState: corsBlocked ? "cors-blocked" : "live",
        error: corsBlocked
          ? "Live 3D preview needs this dashboard origin in Home Assistant HTTP CORS settings."
          : null,
      });
    video.addEventListener("loadeddata", ready, { once: true });
    void video
      .play()
      .then(() => {
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) ready();
      })
      .catch(() => undefined);
    return () => {
      window.clearInterval(timer);
      stream.getTracks().forEach((track) => track.stop());
      video.pause();
      video.srcObject = null;
      video.remove();
    };
  }, []);

  return (
    <main className="synthetic-camera-fixture">
      <section
        className="synthetic-camera-fixture__scene"
        aria-label="Synthetic in-room camera screen"
      >
        <div className="synthetic-camera-fixture__copy">
          <span>Deterministic media fixture</span>
          <h1>Shared camera screen</h1>
          <p>The same in-memory video powers this display and the viewer.</p>
          <button type="button" onClick={() => setViewerOpen(true)}>
            Open live feed
          </button>
        </div>
        <Canvas camera={{ position: [0, 0, 3.2], fov: 35 }} frameloop="demand">
          <ambientLight intensity={1.6} />
          <group position={[0, -0.28, 0]}>
            <ScreenModel
              slot={SYNTHETIC_SLOT}
              liveMedia={media}
              visualState="connected-active"
              reducedMotion={reducedMotion}
              walkMode={false}
              onInteract={() => setViewerOpen(true)}
            />
          </group>
        </Canvas>
      </section>
      {viewerOpen && (
        <CameraViewer
          roomName="Fixture studio"
          label="Synthetic camera"
          media={media}
          onClose={() => setViewerOpen(false)}
          onReviewConnections={() => undefined}
        />
      )}
    </main>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("The synthetic camera fixture root is missing.");
createRoot(root).render(<SyntheticCameraFixture />);
