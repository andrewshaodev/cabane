import { DEFAULT_WALL_COLORS } from "@cabane/engine";
import { createContext, useContext, useState, type ReactNode } from "react";
import type { WallFinishSide } from "./wall-finish-sides";

type Highlight = { floorId: string; wallId: string; sides: readonly WallFinishSide[] } | null;
const WallFinishPreviewContext = createContext({
  palette: {
    interior: DEFAULT_WALL_COLORS.interior as string,
    exterior: DEFAULT_WALL_COLORS.exterior as string,
  },
  highlight: null as Highlight,
  setHighlight: (_highlight: Highlight) => {},
});

export function WallFinishPreviewProvider({
  palette,
  children,
}: {
  palette: { interior: string; exterior: string };
  children: ReactNode;
}) {
  const [highlight, setHighlight] = useState<Highlight>(null);
  return (
    <WallFinishPreviewContext value={{ palette, highlight, setHighlight }}>
      {children}
    </WallFinishPreviewContext>
  );
}

export const useWallFinishPreview = () => useContext(WallFinishPreviewContext);
