import { ClosetPanelBlock } from "./closet-panel-block";
import { SlidingLouverPanel } from "./sliding-louver-panel";
import { PANEL_COUNT, OPENING_LENGTH, PANEL_WIDTH, PANEL_HEIGHT, WOOD_RECESS } from "./louvered-closet-finish";

export function LouveredCloset() {
  const panelCenters = Array.from(
    { length: PANEL_COUNT },
    (_, index) => (index - 1) * PANEL_WIDTH,
  );
  return (
    <group name="portes-coulissantes-placard-entree-custom" userData={{ walkCollider: true }}>
      {[0.0275, PANEL_HEIGHT + 0.0275].map((y) => (
        <ClosetPanelBlock
          key={y}
          size={[0.075, 0.055, OPENING_LENGTH - 0.07]}
          position={[0.015, y, 0]}
          color={WOOD_RECESS}
        />
      ))}
      {panelCenters.map((z, index) => (
        <SlidingLouverPanel
          key={z}
          position={[index === 1 ? 0.018 : 0, 0, z]}
        />
      ))}
    </group>
  );
}
