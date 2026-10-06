import { omitUndefinedProperties } from "@cabane/engine";
import { ArchedSteelGlassPanel } from "../steel-glazing";
import { openingWorldPlacement, resolveOpeningOrientation } from "@cabane/engine";
import type { WindowSpec } from "@cabane/engine";
import { AnimatedOpeningLeaf } from "../animation/animated-opening-leaf";
import { FramedGlassPanel } from "../windows/framed-glass-panel";
import { OpeningFrameBox } from "../opening-frame-box";
import type { OpeningModelProps } from "../opening-model-props";
import { WindowHandle } from "./window-handle";

export function WindowModel({
  wall,
  opening,
  floor,
  position,
  reducedMotion,
}: OpeningModelProps<WindowSpec>) {
  const placement = openingWorldPlacement(wall, opening, floor.coordinates);
  const orientation = resolveOpeningOrientation(opening);
  const panelWidth = placement.widthMeters / opening.panelCount;
  const columns = opening.variant === "muntined" ? opening.muntins!.columns : 1;
  const rows = opening.variant === "muntined" ? opening.muntins!.rows : 1;

  return (
    <group
      name={`opening-model-${opening.variant}`}
      position={[
        placement.start[0],
        opening.sillHeightMeters + opening.openingHeightMeters / 2,
        placement.start[1],
      ]}
      rotation={[0, placement.rotationY, 0]}
    >
      {orientation.leaves.map((leaf, index) => {
        const pivotX = leaf.pivotRatio * placement.widthMeters;
        const childX = (leaf.extentSign * panelWidth) / 2;

        return (
          <group key={index} position={[pivotX, 0, 0]}>
            <AnimatedOpeningLeaf
              operation={opening.operation}
              open={position > 0}
              reducedMotion={reducedMotion}
              direction={leaf.rotationSign}
              travel={0}
            >
              <group position={[childX, 0, 0]}>
                {opening.variant === "steel-arched" ? (
                  <ArchedSteelGlassPanel
                    width={Math.max(0.08, panelWidth)}
                    height={opening.openingHeightMeters}
                    privacy={opening.glazing === "privacy"}
                    {...omitUndefinedProperties({ frameColor: opening.color })}
                  />
                ) : (
                  <FramedGlassPanel
                    width={Math.max(0.08, panelWidth)}
                    height={opening.openingHeightMeters}
                    columns={columns}
                    rows={rows}
                    privacy={opening.glazing === "privacy"}
                    {...omitUndefinedProperties({ frameColor: opening.color })}
                    frameDepth={opening.glazing === "privacy" ? 0.105 : 0.09}
                  />
                )}
                {opening.operation === "casement" && (
                  <WindowHandle
                    width={panelWidth}
                    glazing={opening.glazing}
                    handleSide={leaf.extentSign}
                    faceSide={orientation.sideSign}
                  />
                )}
              </group>
            </AnimatedOpeningLeaf>
          </group>
        );
      })}
      {opening.variant !== "steel-arched" && (
        <OpeningFrameBox
          size={[placement.widthMeters + 0.08, 0.055, wall.thicknessMeters + 0.06]}
          position={[placement.widthMeters / 2, -opening.openingHeightMeters / 2 - 0.02, 0]}
          {...omitUndefinedProperties({ color: opening.color })}
        />
      )}
    </group>
  );
}
