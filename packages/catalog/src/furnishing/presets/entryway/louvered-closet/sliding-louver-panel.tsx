import { ClosetPanelBlock } from "./closet-panel-block";
import { LouverBand } from "./louver-band";
import { PANEL_WIDTH, PANEL_HEIGHT, WOOD, WOOD_RECESS } from "./louvered-closet-finish";

export function SlidingLouverPanel({ position }: { readonly position: [number, number, number] }) {
  return (
    <group name="panneau-coulissant-persienne-entree" position={position}>
      <ClosetPanelBlock
        size={[0.038, PANEL_HEIGHT - 0.16, PANEL_WIDTH - 0.12]}
        position={[-0.012, PANEL_HEIGHT / 2, 0]}
        color={WOOD_RECESS}
      />
      <LouverBand bottom={0.16} top={0.73} />
      <LouverBand bottom={0.88} top={1.62} />
      {[-1, 1].map((side) => (
        <ClosetPanelBlock
          key={side}
          size={[0.064, PANEL_HEIGHT, 0.07]}
          position={[0.012, PANEL_HEIGHT / 2, side * (PANEL_WIDTH / 2 - 0.035)]}
          color={WOOD}
        />
      ))}
      {[0.0525, PANEL_HEIGHT - 0.0525].map((y) => (
        <ClosetPanelBlock
          key={y}
          size={[0.064, 0.105, PANEL_WIDTH]}
          position={[0.012, y, 0]}
          color={WOOD}
        />
      ))}
      <ClosetPanelBlock
        size={[0.068, 0.13, PANEL_WIDTH - 0.07]}
        position={[0.018, 0.805, 0]}
        color={WOOD}
      />
    </group>
  );
}
