import { useEffect, useRef, useState, type RefObject } from "react";
import type { OrthographicCamera } from "three";
import type { OrbitControls } from "three-stdlib";

export function OrbitNavigation({ controlsRef }: { controlsRef: RefObject<OrbitControls | null> }) {
  const [isTopView, setIsTopView] = useState(false);
  const previousPolarAngle = useRef(Math.PI / 4);
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const syncView = () => setIsTopView(controls.getPolarAngle() < 0.01);
    syncView();
    controls.addEventListener("change", syncView);
    return () => controls.removeEventListener("change", syncView);
  }, [controlsRef]);
  const zoom = (factor: number) => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.dispatchEvent({ type: "start", target: controls });
    const camera = controls.object as OrthographicCamera;
    if (!camera.isOrthographicCamera) return;
    camera.zoom = Math.min(controls.maxZoom, Math.max(controls.minZoom, camera.zoom * factor));
    camera.updateProjectionMatrix();
    controls.update();
    controls.dispatchEvent({ type: "change", target: controls });
  };
  const rotate = () => {
    const controls = controlsRef.current;
    controls?.dispatchEvent({ type: "start", target: controls });
    if (controls) controls.setAzimuthalAngle(controls.getAzimuthalAngle() + Math.PI / 2);
  };
  const topView = () => {
    const controls = controlsRef.current;
    if (!controls) return;
    const angle = controls.getPolarAngle();
    controls.dispatchEvent({ type: "start", target: controls });
    if (angle < 0.01) {
      controls.setPolarAngle(previousPolarAngle.current);
    } else {
      previousPolarAngle.current = angle;
      controls.setPolarAngle(0);
    }
    setIsTopView(controls.getPolarAngle() < 0.01);
  };
  return (
    <div className="orbit-navigation" role="group" aria-label="Camera controls">
      <button type="button" aria-label="Zoom out" title="Zoom out" onClick={() => zoom(1 / 1.25)}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h14" />
        </svg>
      </button>
      <button type="button" aria-label="Zoom in" title="Zoom in" onClick={() => zoom(1.25)}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h14M12 5v14" />
        </svg>
      </button>
      <button
        type="button"
        className="orbit-navigation__rotate"
        aria-label="Rotate camera 90 degrees"
        title="Rotate camera 90°"
        onClick={rotate}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19 10a7 7 0 1 0-1 8M19 4v6h-6" />
        </svg>
        <span>90°</span>
      </button>
      <button
        type="button"
        aria-label={isTopView ? "3D view" : "Top view"}
        title={isTopView ? "3D view" : "Top view"}
        onClick={topView}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d={
              isTopView
                ? "M12 3 21 8v9l-9 5-9-5V8l9-5ZM3 8l9 5 9-5M12 13v9"
                : "M5 5h14v14H5zM5 12h7v7M12 5v7h7"
            }
          />
        </svg>
      </button>
    </div>
  );
}
