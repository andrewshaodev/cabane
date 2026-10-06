// Read-only R3F observation for screenshots after normal UI navigation.
export async function waitForSceneCamera(page, cameraType, moduleUrl) {
  await page.evaluate(async (providedUrl) => {
    const url =
      providedUrl ??
      performance
        .getEntriesByType("resource")
        .map((entry) => entry.name)
        .find((name) => name.includes("/@react-three_fiber.js"));
    if (!url) throw new Error("Scene R3F module was not loaded");
    const { _roots } = await import(url);
    window.sceneCameraProbe = { roots: _roots, previous: null, stable: 0 };
  }, moduleUrl);
  await page.waitForFunction(
    (type) => {
      const probe = window.sceneCameraProbe;
      const state = [...probe.roots.values()]
        .map((root) => root.store.getState())
        .find((state) => state.internal.active && state.camera.type === type);
      if (!state || state.gl.info.render.frame === 0) return false;
      const pose = [
        ...state.camera.position.toArray(),
        ...state.camera.quaternion.toArray(),
        state.camera.zoom,
      ];
      probe.stable =
        probe.previous && pose.every((value, i) => Math.abs(value - probe.previous[i]) < 0.00001)
          ? probe.stable + 1
          : 0;
      probe.previous = pose;
      return probe.stable >= 3;
    },
    cameraType,
    { polling: "raf" },
  );
}
