import type { HomeAssistantCameraClient } from "../camera-runtime";

import {
  appendEarlyCameraIceCandidates,
  normalizeRemoteCameraCandidate
} from "../camera-stream";

import type {
  CameraTransport,
  EntityId
} from "../types";
import { CameraSession, WebRtcClientConfiguration, WebRtcOfferEvent } from "./camera-session-types";
import { closeVideo, makeVideo, throwIfAborted, waitForFirstFrame, waitWithSignal } from "./camera-video-lifecycle";

export const openWebRtcSession = async (
  client: HomeAssistantCameraClient,
  entityId: EntityId,
  onDisconnected: () => void,
  onVideoCreated: (video: HTMLVideoElement, transport: CameraTransport) => void,
  signal: AbortSignal,
): Promise<CameraSession> => {
  throwIfAborted(signal);
  const clientConfig = await waitWithSignal(client.sendMessagePromise<WebRtcClientConfiguration>({
    type: "camera/webrtc/get_client_config",
    entity_id: entityId,
  }), signal);
  const peer = new RTCPeerConnection(clientConfig.configuration);
  const remoteStream = new MediaStream();
  const video = makeVideo();
  onVideoCreated(video, "webrtc");
  let closed = false;
  let established = false;
  let sessionId: string | null = null;
  let unsubscribe: (() => void | Promise<void>) | null = null;
  const pendingCandidates: RTCIceCandidate[] = [];

  const close = () => {
    if (closed) return;
    closed = true;
    remoteStream.getTracks().forEach((track) => track.stop());
    peer.close();
    closeVideo(video);
    if (unsubscribe) void unsubscribe();
    signal.removeEventListener("abort", close);
  };
  signal.addEventListener("abort", close, { once: true });
  if (signal.aborted) close();
  throwIfAborted(signal);

  const addCandidate = (candidate: RTCIceCandidate) => {
    if (!sessionId) {
      pendingCandidates.push(candidate);
      return;
    }
    void client.sendMessagePromise({
      type: "camera/webrtc/candidate",
      entity_id: entityId,
      session_id: sessionId,
      candidate: candidate.toJSON(),
    }).catch(() => undefined);
  };
  peer.onicecandidate = (event) => {
    if (event.candidate?.candidate) addCandidate(event.candidate);
  };
  peer.oniceconnectionstatechange = () => {
    if (peer.iceConnectionState === "failed") peer.restartIce();
  };
  peer.onconnectionstatechange = () => {
    if (!closed && established && ["failed", "disconnected", "closed"].includes(peer.connectionState)) {
      onDisconnected();
    }
  };
  peer.ontrack = (event) => {
    if (["audio", "video"].includes(event.track.kind)) {
      remoteStream.addTrack(event.track);
      video.srcObject = remoteStream;
      void video.play().catch(() => undefined);
    }
  };
  if (clientConfig.dataChannel) peer.createDataChannel(clientConfig.dataChannel);
  peer.addTransceiver("audio", { direction: "recvonly" });
  peer.addTransceiver("video", { direction: "recvonly" });
  const offer = await waitWithSignal(peer.createOffer({
    offerToReceiveAudio: true,
    offerToReceiveVideo: true,
  }), signal);
  await waitWithSignal(peer.setLocalDescription(offer), signal);
  const offerSdp = appendEarlyCameraIceCandidates(
    offer.sdp ?? "",
    pendingCandidates.splice(0),
  );

  const subscription = client.subscribeMessage<WebRtcOfferEvent>((event) => {
    if (closed) return;
    if (event.type === "session") {
      sessionId = event.session_id;
      pendingCandidates.splice(0).forEach(addCandidate);
    } else if (event.type === "answer") {
      if (!["stable", "closed"].includes(peer.signalingState)) {
        void peer.setRemoteDescription({ type: "answer", sdp: event.answer }).catch(() => {
          video.dispatchEvent(new Event("error"));
        });
      }
    } else if (event.type === "candidate") {
      const remoteCandidate = normalizeRemoteCameraCandidate(event.candidate);
      void peer.addIceCandidate(new RTCIceCandidate(remoteCandidate)).catch(() => undefined);
    } else if (event.type === "error") {
      video.dispatchEvent(new Event("error"));
    }
  }, {
    type: "camera/webrtc/offer",
    entity_id: entityId,
    offer: offerSdp,
  }, { resubscribe: false });
  void subscription.then((nextUnsubscribe) => {
    if (closed) void nextUnsubscribe();
    else unsubscribe = nextUnsubscribe;
  }).catch(() => video.dispatchEvent(new Event("error")));

  try {
    await waitForFirstFrame(video, signal);
    established = true;
    return { video, transport: "webrtc", close };
  } catch (error) {
    close();
    throw error;
  }
};
