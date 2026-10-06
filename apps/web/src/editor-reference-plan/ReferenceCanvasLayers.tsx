import { Canvas, useFrame, useThree, type Camera } from "@react-three/fiber";
import { FloorFinishSurfaces, type FloorSpec } from "@cabane/engine";
import {
  useEffect,
  useRef,
  useState,
  type RefObject,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Plane, Raycaster, Vector2, Vector3 } from "three";
import { ConstructionGrid } from "../editor-preview/construct/ConstructionGrid";
import {
  imagePointToWorld,
  referenceHeight,
  resizeReference,
  worldPointToImage,
  type ReferencePlan,
  type ReferencePoint,
} from "./reference-plan";
import type { ReferencePlanController } from "./useReferencePlan";

interface Projection {
  camera: Camera | null;
  canvas: HTMLCanvasElement | null;
  background: ((camera: Camera) => void) | null;
}
const corners: readonly ReferencePoint[] = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];
const ground = new Plane(new Vector3(0, 1, 0), 0);
export function projectReferencePoint(
  point: ReferencePoint,
  camera: Camera,
  width: number,
  height: number,
): ReferencePoint {
  const value = new Vector3(point[0], 0, point[1]).project(camera);
  return [((value.x + 1) * width) / 2, ((1 - value.y) * height) / 2];
}
function worldAt(client: ReferencePoint, projection: Projection): ReferencePoint | null {
  if (!projection.canvas || !projection.camera) return null;
  const rect = projection.canvas.getBoundingClientRect();
  const ray = new Raycaster();
  ray.setFromCamera(
    new Vector2(
      ((client[0] - rect.left) / rect.width) * 2 - 1,
      1 - ((client[1] - rect.top) / rect.height) * 2,
    ),
    projection.camera,
  );
  const point = ray.ray.intersectPlane(ground, new Vector3());
  return point ? [point.x, point.z] : null;
}
function BackgroundCamera({ projection }: { projection: RefObject<Projection> }) {
  const { set, invalidate } = useThree();
  useEffect(() => {
    const update = (camera: Camera) => {
      set({ camera });
      invalidate();
    };
    projection.current.background = update;
    if (projection.current.camera) update(projection.current.camera);
    return () => {
      projection.current.background = null;
    };
  }, [projection, set, invalidate]);
  return null;
}
function ReferenceProjectionBridge({
  projection,
  reference,
  image,
  outline,
}: {
  projection: RefObject<Projection>;
  reference: ReferencePlanController;
  image: RefObject<HTMLImageElement | null>;
  outline: RefObject<SVGSVGElement | null>;
}) {
  const { setEvents, invalidate } = useThree();
  useEffect(() => {
    setEvents({ enabled: !reference.adjusting });
    return () => setEvents({ enabled: true });
  }, [reference.adjusting, setEvents]);
  useEffect(() => {
    invalidate();
  });
  useFrame(({ camera, size, gl }) => {
    projection.current.camera = camera;
    projection.current.canvas = gl.domElement;
    projection.current.background?.(camera);
    const center = worldAt(
      [
        size.width / 2 + gl.domElement.getBoundingClientRect().left,
        size.height / 2 + gl.domElement.getBoundingClientRect().top,
      ],
      projection.current,
    );
    const zoom = "zoom" in camera ? Number(camera.zoom) : 1;
    if (center)
      reference.viewport.current = { center, width: size.width / zoom, height: size.height / zoom };
    const plan = reference.plan;
    if (!plan) return;
    const screen = (point: ReferencePoint) =>
      projectReferencePoint(imagePointToWorld(plan, point), camera, size.width, size.height);
    const positions = corners.map(screen);
    const [origin, right, , bottom] = positions;
    if (image.current)
      image.current.style.transform = `matrix(${(right[0] - origin[0]) / plan.pixelWidth},${(right[1] - origin[1]) / plan.pixelWidth},${(bottom[0] - origin[0]) / plan.pixelHeight},${(bottom[1] - origin[1]) / plan.pixelHeight},${origin[0]},${origin[1]})`;
    const svg = outline.current;
    if (!svg) return;
    svg
      .querySelector("polygon")
      ?.setAttribute("points", positions.map((point) => point.join(",")).join(" "));
    positions.forEach((point, index) => {
      const node = svg.querySelector(`[data-handle="${index}"]`);
      node?.setAttribute("cx", String(point[0]));
      node?.setAttribute("cy", String(point[1]));
    });
    const top = screen([0.5, 0]),
      centerScreen = screen([0.5, 0.5]);
    const length = Math.hypot(top[0] - centerScreen[0], top[1] - centerScreen[1]) || 1;
    const rotation: ReferencePoint = [
      top[0] + ((top[0] - centerScreen[0]) * 28) / length,
      top[1] + ((top[1] - centerScreen[1]) * 28) / length,
    ];
    const rotate = svg.querySelector('[data-handle="rotate"]');
    rotate?.setAttribute("cx", String(rotation[0]));
    rotate?.setAttribute("cy", String(rotation[1]));
    const line = svg.querySelector("line");
    line?.setAttribute("x1", String(top[0]));
    line?.setAttribute("y1", String(top[1]));
    line?.setAttribute("x2", String(rotation[0]));
    line?.setAttribute("y2", String(rotation[1]));
    reference.points.forEach((point, index) => {
      const position = screen(point);
      const marker = svg.querySelector(`[data-point="${index}"]`);
      marker?.setAttribute("transform", `translate(${position[0]},${position[1]})`);
    });
  });
  return null;
}

export function useReferenceCanvas(
  reference: ReferencePlanController,
  floor: FloorSpec,
  active: boolean,
) {
  const projection = useRef<Projection>({ camera: null, canvas: null, background: null });
  const image = useRef<HTMLImageElement>(null);
  const outline = useRef<SVGSVGElement>(null);
  const [url, setUrl] = useState<{ id: string; value: string } | null>(null);
  const [assetError, setAssetError] = useState<string | null>(null);
  const assetId = reference.plan?.assetId;
  useEffect(() => {
    let current = true,
      objectUrl: string | undefined;
    setAssetError(null);
    if (assetId)
      void reference.storage
        .getAsset(assetId)
        .then((blob) => {
          if (!current) return;
          objectUrl = URL.createObjectURL(blob);
          setUrl({ id: assetId, value: objectUrl });
        })
        .catch((error) => {
          if (current) setAssetError(error.message);
        });
    return () => {
      current = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [assetId, reference.storage.getAsset]);
  const visible = Boolean(
    active && reference.plan && reference.preference.visible && url?.id === assetId,
  );
  const gesture = useRef<{
    plan: ReferencePlan;
    start: ReferencePoint;
    kind: "move" | "rotate" | number;
    target: HTMLElement;
    pointerId: number;
  } | null>(null);
  const release = () => {
    const current = gesture.current;
    gesture.current = null;
    reference.gestureCancel.current = null;
    if (current?.target.hasPointerCapture(current.pointerId))
      current.target.releasePointerCapture(current.pointerId);
  };
  const handlers = {
    onPointerDownCapture: (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!reference.adjusting || !reference.plan || event.button !== 0) return;
      event.stopPropagation();
      event.preventDefault();
      event.currentTarget.focus();
      const point = worldAt([event.clientX, event.clientY], projection.current);
      if (!point) return;
      if (reference.calibrating) {
        reference.pickPoint(worldPointToImage(reference.plan, point));
        return;
      }
      const rect = projection.current.canvas!.getBoundingClientRect();
      const local: ReferencePoint = [event.clientX - rect.left, event.clientY - rect.top];
      let kind: "move" | "rotate" | number = "move";
      for (const node of outline.current?.querySelectorAll("[data-handle]") ?? []) {
        if (
          Math.hypot(
            Number(node.getAttribute("cx")) - local[0],
            Number(node.getAttribute("cy")) - local[1],
          ) <= 16
        ) {
          const handle = node.getAttribute("data-handle")!;
          kind = handle === "rotate" ? "rotate" : Number(handle);
          break;
        }
      }
      const uv = worldPointToImage(reference.plan, point);
      if (kind === "move" && uv.some((value) => value < 0 || value > 1)) return;
      gesture.current = {
        plan: reference.plan,
        start: point,
        kind,
        target: event.currentTarget,
        pointerId: event.pointerId,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      reference.gestureCancel.current = () => {
        const previous = gesture.current;
        release();
        if (previous) reference.update(previous.plan);
      };
    },
    onPointerMoveCapture: (event: ReactPointerEvent<HTMLDivElement>) => {
      const current = gesture.current;
      if (!current || current.pointerId !== event.pointerId) return;
      event.stopPropagation();
      const point = worldAt([event.clientX, event.clientY], projection.current);
      if (!point) return;
      const { plan, start, kind } = current;
      if (kind === "move")
        reference.update({
          ...plan,
          center: [plan.center[0] + point[0] - start[0], plan.center[1] + point[1] - start[1]],
        });
      else if (kind === "rotate")
        reference.update({
          ...plan,
          angle:
            plan.angle +
            ((Math.atan2(point[1] - plan.center[1], point[0] - plan.center[0]) -
              Math.atan2(start[1] - plan.center[1], start[0] - plan.center[0])) *
              180) /
              Math.PI,
        });
      else reference.update(resizeReference(plan, corners[kind], point));
    },
    onPointerUpCapture: (event: ReactPointerEvent<HTMLDivElement>) => {
      if (gesture.current?.pointerId === event.pointerId) {
        event.stopPropagation();
        release();
      }
    },
    onPointerCancel: () => reference.gestureCancel.current?.(),
    onLostPointerCapture: () => reference.gestureCancel.current?.(),
  };
  const background = visible ? (
    <>
      <div className="reference-canvas-layer" aria-hidden="true">
        <Canvas frameloop="demand" dpr={1} gl={{ antialias: true, alpha: true }} events={undefined}>
          <BackgroundCamera projection={projection} />
          <ConstructionGrid />
          <FloorFinishSurfaces floor={floor} variant="plan" />
        </Canvas>
      </div>
      <div className="reference-canvas-layer" aria-hidden="true">
        <img
          ref={image}
          className="reference-image"
          src={url!.value}
          alt=""
          draggable={false}
          width={reference.plan!.pixelWidth}
          height={reference.plan!.pixelHeight}
          style={{ opacity: reference.preference.opacity }}
        />
      </div>
    </>
  ) : null;
  const controls =
    active && reference.adjusting ? (
      <div className="reference-canvas-layer reference-adjustment" aria-hidden="true">
        <svg ref={outline}>
          <g visibility={reference.calibrating ? "hidden" : "visible"}>
            <polygon />
            {corners.map((_, index) => (
              <circle key={index} data-handle={index} r="7" />
            ))}
            <line />
            <circle data-handle="rotate" r="7" />
          </g>
          {reference.points.map((_, index) => (
            <g key={index} data-point={index}>
              <circle r="6" />
              <text x="10" y="-10">
                {index + 1}
              </text>
            </g>
          ))}
        </svg>
      </div>
    ) : null;
  return {
    visible,
    background,
    controls,
    handlers,
    assetError,
    bridge: active ? (
      <ReferenceProjectionBridge
        projection={projection}
        reference={reference}
        image={image}
        outline={outline}
      />
    ) : null,
  };
}
