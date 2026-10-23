import { useEffect, useEffectEvent, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Spherical, Vector3, type OrthographicCamera } from "three";
import type { OrbitControls } from "three-stdlib";
import type { FloorSpec, RoomSpec } from "../types";
import {
  advanceRoomSpring,
  nearestOrbitAngle,
  roomCameraFraming,
  type OrbitPose,
  type RoomFocusFrame,
} from "./room-camera-framing";

type Motion = { values: number[]; velocities: number[]; destination: number[] };
const valuesFor = (pose: OrbitPose) => [
  ...pose.target.toArray(),
  pose.offset.radius,
  pose.offset.phi,
  pose.offset.theta,
  Math.log(pose.zoom),
];
const readPose = (controls: OrbitControls): OrbitPose => ({
  target: controls.target.clone(),
  offset: new Spherical().setFromVector3(controls.object.position.clone().sub(controls.target)),
  zoom: (controls.object as OrthographicCamera).zoom,
});
const applyPose = (controls: OrbitControls, values: number[]) => {
  controls.target.set(values[0], values[1], values[2]);
  controls.object.position
    .copy(controls.target)
    .add(new Vector3().setFromSpherical(new Spherical(values[3], values[4], values[5])));
  const camera = controls.object as OrthographicCamera;
  camera.zoom = Math.exp(values[6]);
  camera.updateProjectionMatrix();
  controls.update();
};

export function RoomCameraTransition({
  controls,
  interruptRef,
  defaultPose,
  enabled,
  floor,
  room,
  elevation,
  frame,
  requestKey,
  reducedMotion,
}: {
  controls: React.RefObject<OrbitControls | null>;
  interruptRef: React.RefObject<(() => void) | null>;
  defaultPose: OrbitPose;
  enabled: boolean;
  floor: FloorSpec;
  room: RoomSpec | undefined;
  elevation: number;
  frame: RoomFocusFrame | null;
  requestKey: number;
  reducedMotion: boolean;
}) {
  const { camera, size, invalidate } = useThree();
  const motion = useRef<Motion | null>(null);
  const previousFloor = useRef(floor.id);
  const previousRequest = useRef(requestKey);
  const currentRoom = useRef<string | null>(null);
  const overviewPose = useEffectEvent(() => defaultPose);

  useEffect(() => {
    interruptRef.current = () => {
      motion.current = null;
      if (controls.current) controls.current.enableDamping = true;
    };
    return () => {
      interruptRef.current = null;
    };
  }, [controls, interruptRef]);

  useEffect(() => {
    const orbit = controls.current;
    if (!orbit || orbit.object !== camera || !(camera as OrthographicCamera).isOrthographicCamera)
      return;
    const requested = previousRequest.current !== requestKey;
    previousRequest.current = requestKey;
    if (!enabled || previousFloor.current !== floor.id) {
      motion.current = null;
      orbit.enableDamping = true;
      currentRoom.current = null;
      previousFloor.current = floor.id;
    }
    if (!enabled) return;
    if (room && !frame) return;
    const roomId = room?.id ?? null;
    const selectionChanged = currentRoom.current !== roomId;
    const retargetingActiveMotion = motion.current !== null && !selectionChanged;
    if (!selectionChanged && !requested && !retargetingActiveMotion) return;
    const from = readPose(orbit);
    let destination: OrbitPose;
    if (room && frame) {
      destination = roomCameraFraming(floor, room, elevation, size, frame);
    } else {
      destination = overviewPose();
    }
    currentRoom.current = roomId;
    const values = valuesFor(from);
    const next = valuesFor(destination);
    next[5] = nearestOrbitAngle(values[5], next[5]);
    orbit.enableDamping = false;
    if (reducedMotion) {
      motion.current = null;
      applyPose(orbit, next);
      orbit.enableDamping = true;
    } else {
      motion.current = {
        values,
        destination: next,
        velocities: motion.current?.velocities ?? values.map(() => 0),
      };
    }
    invalidate();
  }, [
    camera,
    controls,
    enabled,
    floor,
    room,
    elevation,
    frame,
    requestKey,
    reducedMotion,
    size,
    invalidate,
  ]);

  useFrame((_state, delta) => {
    const flight = motion.current;
    const orbit = controls.current;
    if (!flight || !orbit) return;
    let settled = true;
    flight.values.forEach((value, index) => {
      const next = advanceRoomSpring(
        value,
        flight.velocities[index],
        flight.destination[index],
        delta,
      );
      flight.values[index] = next.value;
      flight.velocities[index] = next.velocity;
      if (
        Math.abs(next.value - flight.destination[index]) > 0.0001 ||
        Math.abs(next.velocity) > 0.001
      )
        settled = false;
    });
    applyPose(orbit, settled ? flight.destination : flight.values);
    if (settled) {
      motion.current = null;
      orbit.enableDamping = true;
    } else invalidate();
  });
  return null;
}
