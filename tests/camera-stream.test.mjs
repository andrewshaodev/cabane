import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";

await withModules(async (load) => {
  const camera = await load("/packages/engine/src/camera-stream.ts");

  test("orders only camera transports supported by Home Assistant and the browser", () => {
    assert.deepEqual(camera.cameraTransportCandidates(["hls", "web_rtc"], false, true), [
      "webrtc",
      "hls",
    ]);
    assert.deepEqual(camera.cameraTransportCandidates(["hls", "web_rtc"], true, true), [
      "hls",
      "webrtc",
    ]);
    assert.deepEqual(camera.cameraTransportCandidates(["web_rtc"], false, false), []);
  });

  test("prefers HLS only for a remote Apple mobile client", () => {
    const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)";
    assert.equal(
      camera.preferHlsForRemoteAppleClient(
        "http://dashboard.local",
        "http://ha.local:8123",
        iphone,
      ),
      true,
    );
    assert.equal(
      camera.preferHlsForRemoteAppleClient(
        "http://ha.local/dashboard",
        "http://ha.local:8123",
        iphone,
      ),
      false,
    );
    assert.equal(
      camera.preferHlsForRemoteAppleClient(
        "http://dashboard.local",
        "http://ha.local:8123",
        "Mozilla/5.0 Chrome/140",
      ),
      false,
    );
  });

  test("accepts only media URLs on the configured Home Assistant origin", () => {
    const origin = "http://ha.local:8123";
    assert.equal(
      camera.resolveHomeAssistantMediaUrl("/api/hls/stream.m3u8?token=redacted", origin),
      "http://ha.local:8123/api/hls/stream.m3u8?token=redacted",
    );
    assert.equal(
      camera.resolveHomeAssistantMediaUrl("http://other.local/stream.m3u8", origin),
      null,
    );
    assert.equal(camera.resolveHomeAssistantMediaUrl("not a valid url", null), null);
  });

  test("includes early ICE in the initial offer and normalizes remote candidates", () => {
    assert.equal(
      camera.appendEarlyCameraIceCandidates("v=0\r\n", [
        { candidate: "candidate:one" },
        { candidate: "candidate:two" },
      ]),
      "v=0\r\na=candidate:one\r\na=candidate:two\r\n",
    );
    assert.deepEqual(camera.normalizeRemoteCameraCandidate({ candidate: "candidate:remote" }), {
      candidate: "candidate:remote",
      sdpMid: "0",
    });
    assert.deepEqual(
      camera.normalizeRemoteCameraCandidate({ candidate: "candidate:remote", sdpMLineIndex: 1 }),
      { candidate: "candidate:remote", sdpMLineIndex: 1 },
    );
  });

  test("staggered transport race returns the first frame and aborts the loser", async () => {
    let loserAborted = false;
    const winner = await camera.runCameraTransportRace(
      ["webrtc", "hls"],
      (transport, signal) =>
        transport === "webrtc"
          ? new Promise((resolve, reject) => {
              signal.addEventListener(
                "abort",
                () => {
                  loserAborted = true;
                  reject(signal.reason);
                },
                { once: true },
              );
            })
          : Promise.resolve("hls-session"),
      1,
    );
    assert.equal(winner, "hls-session");
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(loserAborted, true);
  });

  test("camera attempts time out and inherit parent aborts", async () => {
    await assert.rejects(
      camera.runCameraAttempt(() => new Promise(() => undefined), 5),
      /timeout/i,
    );
    const parent = new AbortController();
    const attempt = camera.runCameraAttempt(
      () => new Promise(() => undefined),
      1_000,
      parent.signal,
    );
    parent.abort(new Error("visibility changed"));
    await assert.rejects(attempt, /visibility changed/);
  });

  test("camera availability rejects stale and unavailable states", () => {
    const state = { state: "idle", available: true, stale: false };
    assert.equal(camera.cameraEntityAvailable(state), true);
    assert.equal(camera.cameraEntityAvailable({ ...state, stale: true }), false);
    assert.equal(
      camera.cameraEntityAvailable({ ...state, state: "unavailable", available: false }),
      false,
    );
  });

  test("deduplicates placed screens mapped to the same camera entity", () => {
    const first = { entityId: "camera.entry", available: false, posterUrl: null };
    const latest = { entityId: "camera.entry", available: true, posterUrl: "/signed-poster" };
    assert.deepEqual(
      camera.deduplicateCameraStreamRequirements([
        first,
        { entityId: "camera.garden", available: true, posterUrl: null },
        latest,
      ]),
      [latest, { entityId: "camera.garden", available: true, posterUrl: null }],
    );
  });

  test("rejects a playable video frame when browser security blocks canvas readback", () => {
    const previousDocument = globalThis.document;
    const previousMediaElement = globalThis.HTMLMediaElement;
    globalThis.HTMLMediaElement = { HAVE_CURRENT_DATA: 2 };
    globalThis.document = {
      createElement: () => ({
        width: 0,
        height: 0,
        getContext: () => ({
          drawImage: () => undefined,
          getImageData: () => {
            throw new Error("SecurityError");
          },
        }),
      }),
    };
    try {
      assert.equal(camera.cameraTextureIsSafe({ readyState: 2 }), false);
    } finally {
      globalThis.document = previousDocument;
      globalThis.HTMLMediaElement = previousMediaElement;
    }
  });
});
