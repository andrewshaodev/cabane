/** Broken-chain counterpart of the Connect editor icon. */
export const roomDisconnectedIconPath = "m8 16-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 3 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0M3 3l18 18";

export function RoomDisconnectedIcon() {
  return (
    <span className="room-disconnected-icon" role="img" aria-label="Room not connected to Home Assistant" title="Room not connected to Home Assistant">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d={roomDisconnectedIconPath} />
      </svg>
    </span>
  );
}
