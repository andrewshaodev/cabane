import type {
  CameraTransport,
  DeviceLiveMedia,
  EntityId,
} from "../types";

export interface CameraCapabilities {
  frontend_stream_types: Array<"hls" | "web_rtc">;
}

export interface WebRtcClientConfiguration {
  configuration: RTCConfiguration;
  dataChannel?: string;
}

export type WebRtcOfferEvent =
  | { type: "session"; session_id: string }
  | { type: "answer"; answer: string }
  | { type: "candidate"; candidate: RTCIceCandidateInit }
  | { type: "error"; code: string; message: string };

export interface CameraSession {
  video: HTMLVideoElement;
  transport: CameraTransport;
  close: () => void;
}

export interface CameraStreamRequirement {
  entityId: EntityId;
  available: boolean;
  posterUrl: string | null;
}

export type CameraStreamsByEntityId = Readonly<Partial<Record<EntityId, DeviceLiveMedia>>>;
