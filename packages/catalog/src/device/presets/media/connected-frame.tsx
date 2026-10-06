import {
  LiveCameraSurface,
  Outlines,
  ToonMaterial,
  type HomeDeviceModelProps,
} from "@cabane/engine";
import { StatusBeacon } from "../../visuals/device-visual-state";

export const CONNECTED_FRAME_SIZE = [0.72, 0.52, 0.045] as const;

const FRAME_WIDTH = CONNECTED_FRAME_SIZE[0];
const FRAME_HEIGHT = CONNECTED_FRAME_SIZE[1];
const FRAME_DEPTH = CONNECTED_FRAME_SIZE[2];
const RAIL_WIDTH = 0.045;
const DISPLAY_WIDTH = FRAME_WIDTH - RAIL_WIDTH * 2;
const DISPLAY_HEIGHT = FRAME_HEIGHT - RAIL_WIDTH * 2;
const FRAME_CENTER_Z = FRAME_DEPTH / 2 - 0.001;

type ConnectedFrameFinish = "oak" | "black";

const finishPalette = (finish: ConnectedFrameFinish) =>
  finish === "oak"
    ? { vertical: "#b9824f", horizontal: "#c99863", outline: "#5f402a", inset: "#332d27" }
    : { vertical: "#252a29", horizontal: "#303534", outline: "#111514", inset: "#171b1a" };

function ConnectedFrame({
  finish,
  liveMedia,
  visualState,
}: HomeDeviceModelProps & { finish: ConnectedFrameFinish }) {
  const colors = finishPalette(finish);
  const rail = (
    name: string,
    position: readonly [number, number, number],
    size: readonly [number, number, number],
    color: string,
  ) => (
    <mesh name={name} position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <ToonMaterial color={color} />
      <Outlines color={colors.outline} thickness={0.0025} screenspace={false} />
    </mesh>
  );

  return (
    <group name={`catalog-connected-frame-${finish}`}>
      <mesh name="connected-frame-screen-inset" position={[0, FRAME_HEIGHT / 2, 0.005]}>
        <boxGeometry args={[DISPLAY_WIDTH, DISPLAY_HEIGHT, 0.012]} />
        <ToonMaterial color={colors.inset} />
      </mesh>
      <group position={[0, FRAME_HEIGHT / 2, 0.012]}>
        <LiveCameraSurface
          media={liveMedia}
          width={DISPLAY_WIDTH - 0.012}
          height={DISPLAY_HEIGHT - 0.012}
          opacity={0.9}
        />
      </group>
      {rail(
        "connected-frame-left-rail",
        [-FRAME_WIDTH / 2 + RAIL_WIDTH / 2, FRAME_HEIGHT / 2, FRAME_CENTER_Z],
        [RAIL_WIDTH, FRAME_HEIGHT, FRAME_DEPTH],
        colors.vertical,
      )}
      {rail(
        "connected-frame-right-rail",
        [FRAME_WIDTH / 2 - RAIL_WIDTH / 2, FRAME_HEIGHT / 2, FRAME_CENTER_Z],
        [RAIL_WIDTH, FRAME_HEIGHT, FRAME_DEPTH],
        colors.vertical,
      )}
      {rail(
        "connected-frame-top-rail",
        [0, FRAME_HEIGHT - RAIL_WIDTH / 2, FRAME_CENTER_Z],
        [DISPLAY_WIDTH, RAIL_WIDTH, FRAME_DEPTH],
        colors.horizontal,
      )}
      {rail(
        "connected-frame-bottom-rail",
        [0, RAIL_WIDTH / 2, FRAME_CENTER_Z],
        [DISPLAY_WIDTH, RAIL_WIDTH, FRAME_DEPTH],
        colors.horizontal,
      )}
      <StatusBeacon
        visualState={visualState}
        position={[FRAME_WIDTH / 2 - 0.0225, 0.0225, 0.037]}
        scale={0.22}
      />
    </group>
  );
}

export function ConnectedFrameOakModel(props: HomeDeviceModelProps) {
  return <ConnectedFrame {...props} finish="oak" />;
}

export function ConnectedFrameBlackModel(props: HomeDeviceModelProps) {
  return <ConnectedFrame {...props} finish="black" />;
}
