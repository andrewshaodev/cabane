import assert from "node:assert/strict";
import test from "node:test";
import { withModules } from "./test-server.mjs";

await withModules(async load => {
  const { publicSiteAnalyticsEnabled, publicPageView } = await load("/apps/web/src/public-site-analytics.tsx");
  const origin = "https://cabane.my";
  test("analytics requires an explicitly enabled HTTPS production origin", () => {
    assert.equal(publicSiteAnalyticsEnabled(true, origin, origin), true);
    for (const [production, configured, url] of [
      [false, origin, origin], [true, undefined, origin],
      [true, origin, "https://private.example"], [true, origin, "https://preview.vercel.app"],
      [true, "http://localhost", "http://localhost"],
    ]) assert.equal(publicSiteAnalyticsEnabled(production, configured, url), false);
  });
  test("all application paths count without workspace IDs, queries, fragments, or properties", () => {
    for (const path of ["/", "/welcome", "/demo", "/build", "/workspaces", "/about", "/workspaces/personal", "/workspaces/personal/connect/devices", "/workspaces/personal/construct", "/workspaces/personal/arrange"]) {
      const url = origin + path + "?name=private#room";
      assert.deepEqual(publicPageView({ type: "pageview", url, properties: { secret: "private" } }, url),
        { type: "pageview", url: origin + path.replace("/personal", "/:workspaceId") });
    }
    assert.equal(publicPageView({ type: "event", url: origin }, origin), null);
    assert.equal(publicPageView({ type: "pageview", url: "https://other.example" }, origin), null);
  });
  test("OAuth routes and parameters are excluded both at mount and at send time", () => {
    for (const path of ["/oauth", "/oauth/callback", "/ha-auth-callback.html", "/auth/callback", "/workspaces/home?auth_callback=1", "/?code=secret", "/?state=secret", "/#access_token=secret", "/?error=access_denied"]) {
      const url = origin + path;
      assert.equal(publicSiteAnalyticsEnabled(true, origin, url), false);
      assert.equal(publicPageView({ type: "pageview", url: origin }, url), null);
      assert.equal(publicPageView({ type: "pageview", url }, origin), null);
    }
  });
});
