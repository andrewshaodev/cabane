import { useRef, useState, type CSSProperties, type PointerEvent } from "react";

export const ROOM_SHEET_COLLAPSED_DVH = 68;
export const ROOM_SHEET_EXPANDED_DVH = 94;

export const settleRoomSheetHeight = (height: number): "dismiss" | 68 | 94 => {
  if (height < ROOM_SHEET_COLLAPSED_DVH) return "dismiss";
  return Math.abs(height - ROOM_SHEET_COLLAPSED_DVH) <= Math.abs(height - ROOM_SHEET_EXPANDED_DVH)
    ? ROOM_SHEET_COLLAPSED_DVH
    : ROOM_SHEET_EXPANDED_DVH;
};

export function useBottomSheetDrag(onDismiss: () => void) {
  const [height, setHeight] = useState<number>(ROOM_SHEET_COLLAPSED_DVH);
  const heightRef = useRef<number>(ROOM_SHEET_COLLAPSED_DVH);
  const drag = useRef<{
    pointerId: number;
    startY: number;
    startHeight: number;
    moved: boolean;
  } | null>(null);
  const suppressNextClick = useRef(false);

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    drag.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startHeight: heightRef.current,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    if (Math.abs(event.clientY - drag.current.startY) > 2) drag.current.moved = true;
    const delta = ((drag.current.startY - event.clientY) / window.innerHeight) * 100;
    const next = Math.max(0, Math.min(ROOM_SHEET_EXPANDED_DVH, drag.current.startHeight + delta));
    heightRef.current = next;
    setHeight(next);
  };

  const finish = (event: PointerEvent<HTMLButtonElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    suppressNextClick.current = drag.current.moved;
    drag.current = null;
    const settled = settleRoomSheetHeight(heightRef.current);
    if (settled === "dismiss") {
      onDismiss();
      return;
    }
    heightRef.current = settled;
    setHeight(settled);
  };

  const cancel = (event: PointerEvent<HTMLButtonElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    const { startHeight } = drag.current;
    drag.current = null;
    suppressNextClick.current = false;
    heightRef.current = startHeight;
    setHeight(startHeight);
  };

  const toggle = () => {
    if (suppressNextClick.current) {
      suppressNextClick.current = false;
      return;
    }
    const next =
      heightRef.current === ROOM_SHEET_EXPANDED_DVH
        ? ROOM_SHEET_COLLAPSED_DVH
        : ROOM_SHEET_EXPANDED_DVH;
    heightRef.current = next;
    setHeight(next);
  };

  return {
    expanded: height === ROOM_SHEET_EXPANDED_DVH,
    style: { "--room-sheet-mobile-height": `${height}dvh` } as CSSProperties,
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finish,
      onPointerCancel: cancel,
      onClick: toggle,
    },
  };
}
