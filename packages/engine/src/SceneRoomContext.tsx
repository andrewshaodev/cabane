import { RoomDisconnectedIcon } from "./RoomDisconnectedIcon";
import { HomePresenceStatus } from "./home-presence/HomePresenceStatus";

import { type HomePresenceSummary } from "./home-presence/model";

import { RoomStatusBadges } from "./room-status/RoomStatusBadges";

import { type RoomStatusSummary } from "./room-status/model";

import type {
  HomeAssistantConnectionStatus,
  SceneMode
} from "./types";

export function SceneRoomContext({
  mode,
  displayName,
  roomStatus,
  homePresence,
  connectionStatus,
  connectionDescription,
  sessionStatus,
}: {
  mode: SceneMode;
  displayName: string;
  roomStatus?: RoomStatusSummary;
  homePresence?: HomePresenceSummary | null;
  connectionStatus: HomeAssistantConnectionStatus;
  connectionDescription: string;
  sessionStatus?: string;
}) {
  return (
    <div className="scene-context" aria-live="polite">
      <span className="visually-hidden">
        {mode === "walk" ? "Walking in" : mode === "room" ? "Focused room" : "Overview"}
      </span>
      <div className="scene-context__heading">
        <i
          className={`connection-dot status-${connectionStatus}`}
          role="img"
          aria-label={connectionDescription}
        />
        <strong>{displayName}{mode !== "overview" && roomStatus?.connected === false && <RoomDisconnectedIcon />}</strong>
      </div>
      {sessionStatus && <small className="scene-context__session">{sessionStatus}</small>}
      {mode === "overview" && homePresence && (
        <HomePresenceStatus summary={homePresence} />
      )}
      {mode === "walk" && roomStatus && (
        <RoomStatusBadges
          summary={roomStatus}
          variant="compact"
          className="scene-context__room-status"
        />
      )}
    </div>
  );
}
