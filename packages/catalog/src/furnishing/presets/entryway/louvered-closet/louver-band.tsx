import { ClosetPanelBlock } from "./closet-panel-block";
import { PANEL_WIDTH, WOOD, WOOD_LIGHT } from "./louvered-closet-finish";

export function LouverBand({ bottom, top }: { readonly bottom: number; readonly top: number }) {
  const spacing = 0.062;
  const count = Math.floor((top - bottom) / spacing);
  return (
    <group name="lames-persienne-entree">
      {Array.from({ length: count }, (_, index) => {
        const y = bottom + spacing * (index + 0.5);
        return (
          <ClosetPanelBlock
            key={y}
            size={[0.052, 0.026, PANEL_WIDTH - 0.15]}
            position={[0.036, y, 0]}
            rotation={[0, 0, -0.2]}
            color={index % 3 === 1 ? WOOD_LIGHT : WOOD}
            outline="#795137"
          />
        );
      })}
    </group>
  );
}
