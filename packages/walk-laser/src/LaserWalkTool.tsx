import { raycastWalkScene, useCabaneDom, type WalkToolProps } from "@cabane/engine";
import { Html } from "@react-three/drei";
import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Group, Matrix3, Raycaster, Scene, Vector2, Vector3, type PerspectiveCamera } from "three";
import { LaserGun } from "./LaserGun";
import { LaserShot, type ShotVisual } from "./LaserShot";
import { createShotGate } from "./shot-gate";
import "./laser.css";

export function LaserWalkTool({ enabled, pointerLocked, coarsePointer, reducedMotion, canActivateTarget, activateTarget }: WalkToolProps) {
  const { camera, scene } = useThree();
  const dom = useCabaneDom();
  const gun = useRef<Group>(null);
  const muzzle = useRef<Group>(null);
  const shotSequence = useRef(0);
  const weaponScene = useMemo(() => new Scene(), []);
  const [shots, setShots] = useState<ShotVisual[]>([]);
  const shot = shots.at(-1);
  const [aim, setAim] = useState<string | null>(null);
  const lastAim = useRef<string | null>(null);
  const recoil = useRef(0);
  const motion = useRef({ previous: camera.position.clone(), speed: 0, phase: 0, time: 0 });
  const gate = useMemo(() => createShotGate(), []);
  const raycaster = useMemo(() => new Raycaster(), []);
  const center = useMemo(() => new Vector2(), []);
  const ready = enabled && (coarsePointer || pointerLocked);
  const readyRef = useRef(ready);
  readyRef.current = ready;
  useEffect(() => {
    if (!shots.length) return;
    const timer = window.setTimeout(() => setShots(previous => previous.filter(item => performance.now() - (item.createdAt ?? 0) < 3400)), 250);
    return () => window.clearTimeout(timer);
  }, [shots]);

  useFrame((_, delta) => {
    const pose = motion.current;
    const distance = Math.hypot(camera.position.x - pose.previous.x, camera.position.z - pose.previous.z);
    const speed = ready && delta > 0 && distance < .5 ? distance / delta : 0;
    pose.previous.copy(camera.position);
    pose.speed += (Math.min(speed, 5) - pose.speed) * (1 - Math.exp(-10 * delta));
    pose.time += delta;
    pose.phase += delta * (7 + pose.speed * 2.5);
    const weight = reducedMotion ? 0 : Math.min(pose.speed / 2, 1.6);
    const sway = reducedMotion ? 0 : Math.sin(pose.time * 1.6) * .0015 + Math.sin(pose.phase) * .004 * weight;
    const bob = reducedMotion ? 0 : Math.cos(pose.time * 2) * .0015 + Math.cos(pose.phase * 2) * .003 * weight;
    if (gun.current) {
      recoil.current *= Math.exp(-18 * delta);
      const lens = camera as PerspectiveCamera;
      const height = 2 * 0.6 * Math.tan(lens.fov * Math.PI / 360);
      const width = height * lens.aspect;
      gun.current.scale.setScalar(Math.min(0.58, width * 0.56));
      gun.current.position.set(width * 0.29 + sway, -height * 0.19 + bob - weight * .004, -0.6 + (reducedMotion ? 0 : recoil.current));
      gun.current.position.applyQuaternion(camera.quaternion).add(camera.position);
      gun.current.quaternion.copy(camera.quaternion);
      if (!reducedMotion) { gun.current.rotateX(recoil.current * 0.9); gun.current.rotateZ(sway * 2); }
    }
    if (!ready) { if (lastAim.current !== null) { lastAim.current = null; setAim(null); } return; }
    raycaster.setFromCamera(center, camera);
    const { target } = raycastWalkScene(raycaster, scene);
    const label = target && canActivateTarget(target) ? target.label : null;
    if (label !== lastAim.current) { lastAim.current = label; setAim(label); }
  });

  // Draw the small view model after the host scene. Its own depth buffer keeps
  // the toy solid while preventing walls from clipping it; no world-scene mutation.
  useFrame(({ gl }) => {
    if (!enabled) return;
    const autoClear = gl.autoClear;
    try { gl.autoClear = false; gl.clearDepth(); gl.render(weaponScene, camera); }
    finally { gl.autoClear = autoClear; }
  }, 2);

  const fire = useCallback(() => {
    if (!readyRef.current) return;
    void gate(performance.now(), async () => {
      // Resolve at trigger time, not from a previous frame's React state.
      scene.updateMatrixWorld(true);
      raycaster.setFromCamera(center, camera);
      const { hit, target } = raycastWalkScene(raycaster, scene);
      const end = hit?.point.clone() ?? raycaster.ray.at(30, new Vector3());
      muzzle.current?.updateWorldMatrix(true, false);
      const start = muzzle.current?.getWorldPosition(new Vector3()) ?? camera.position.clone();
      if (!reducedMotion) { const normal = hit?.face?.normal.clone().applyMatrix3(new Matrix3().getNormalMatrix(hit.object.matrixWorld)).normalize();
        if (normal && normal.dot(raycaster.ray.direction) > 0) normal.negate();
        setShots(previous => [...previous.slice(-11), { id: ++shotSequence.current, start, end, hit: Boolean(hit), normal, createdAt: performance.now() }]); recoil.current = 0.055; }
      if (target) await activateTarget(target);
    });
  }, [activateTarget, camera, center, gate, raycaster, reducedMotion, scene]);

  useEffect(() => {
    const pointer = (event: PointerEvent) => {
      if (!readyRef.current || coarsePointer || event.button !== 0 || !dom.root.pointerLockElement) return;
      event.preventDefault(); fire();
    };
    const keyboard = (event: KeyboardEvent) => {
      if (!readyRef.current || event.code !== "KeyF" || event.repeat || event.ctrlKey || event.metaKey || event.altKey
        || (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable=true]"))) return;
      event.preventDefault(); fire();
    };
    dom.events.addEventListener("pointerdown", pointer);
    dom.events.addEventListener("keydown", keyboard);
    return () => { dom.events.removeEventListener("pointerdown", pointer); dom.events.removeEventListener("keydown", keyboard); };
  }, [coarsePointer, dom.events, dom.root, fire]);

  return <>
    {createPortal(<><ambientLight intensity={1.1} /><directionalLight position={[-2, 4, 3]} intensity={2.2} />
      <group ref={gun}><LaserGun muzzleRef={muzzle} shotId={shot?.id ?? 0} /></group></>, weaponScene)}
    {shots.map(item => <LaserShot key={item.id} shot={item} />)}
    {/* Screen-space HUD remains visible regardless of the world origin behind the camera. */}
    <Html onOcclude={() => undefined} fullscreen calculatePosition={(_, __, size) => [size.width / 2, size.height / 2]} zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
      {enabled && <div className="walk-laser" data-ready={ready}>
        <svg className="walk-laser__sight" data-target={Boolean(aim)} aria-hidden="true" viewBox="0 0 32 32">
          <path className="walk-laser__ticks" d="M16 3v6 M16 23v6 M3 16h6 M23 16h6" />
          <path className="walk-laser__lock" d="M7 11V7h4 M21 7h4v4 M25 21v4h-4 M11 25H7v-4" />
          <circle cx="16" cy="16" r="1.3" fill="currentColor" stroke="none" />
        </svg>
        {coarsePointer && <button type="button" className="walk-laser__fire" disabled={!ready} onClick={fire} aria-label="Fire laser">Fire</button>}
      </div>}
    </Html>
  </>;
}
