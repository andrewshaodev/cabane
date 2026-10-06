import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
export const WALL_CLEANING_TOOL_RACK_SIZE = [0.22, 1.3, 0.12] as const;
const tools = [
  {
    x: -0.05,
    headBottom: 0,
    height: 1.2,
    color: "#458fb3",
    headWidth: 0.14,
    headDepth: 0.12,
    headHeight: 0.02,
  },
  {
    x: 0,
    headBottom: 0.05,
    height: 1.3,
    color: "#af5141",
    headWidth: 0.11,
    headDepth: 0.065,
    headHeight: 0.035,
  },
  {
    x: 0.05,
    headBottom: 0.12,
    height: 0.96,
    color: "#343b37",
    headWidth: 0.1,
    headDepth: 0.065,
    headHeight: 0.02,
  },
];
export function WallCleaningToolRack({
  size = WALL_CLEANING_TOOL_RACK_SIZE,
}: {
  size?: SceneItemSize;
}) {
  return (
    <group name="wall-cleaning-tool-rack" scale={[size[0] / 0.22, size[1] / 1.3, size[2] / 0.12]}>
      <mesh name="cleaning-tool-holder" position={[0, 0.8, 0.0125]} castShadow receiveShadow>
        <boxGeometry args={[0.16, 0.035, 0.025]} />
        <ToonMaterial color="#252b29" />
      </mesh>
      {tools.map((tool, index) => (
        <group key={index}>
          <RoundedFurniturePanel
            name={`cleaning-head-${index}`}
            size={[tool.headWidth, tool.headHeight, tool.headDepth]}
            position={[tool.x, tool.headBottom + tool.headHeight / 2, tool.headDepth / 2]}
            radius={0.005}
            color={index === 0 ? "#8b9ea2" : "#929a90"}
            outline={false}
          />
          <mesh
            name={`cleaning-shaft-${index}`}
            position={[tool.x, (tool.headBottom + 0.015 + tool.height - 0.16) / 2, 0.043]}
            castShadow
            receiveShadow
          >
            <cylinderGeometry args={[0.006, 0.006, tool.height - 0.175 - tool.headBottom, 8]} />
            <ToonMaterial color="#b3bbb7" />
          </mesh>
          <mesh
            name={`cleaning-grip-${index}`}
            position={[tool.x, tool.height - 0.1, 0.043]}
            castShadow
            receiveShadow
          >
            <cylinderGeometry args={[0.008, 0.008, 0.2, 8]} />
            <ToonMaterial color={tool.color} />
          </mesh>
          <mesh
            name={`cleaning-clamp-${index}`}
            position={[tool.x, 0.8, 0.043]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
            receiveShadow
          >
            <torusGeometry args={[0.009, 0.003, 4, 12]} />
            <ToonMaterial color="#252b29" />
          </mesh>
          <mesh
            name={`cleaning-clamp-bridge-${index}`}
            position={[tool.x, 0.8, 0.026]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.022, 0.03, 0.015]} />
            <ToonMaterial color="#252b29" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
