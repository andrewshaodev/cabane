import { Analytics, type BeforeSendEvent } from "@vercel/analytics/react";
import { useLocation } from "react-router";

export function isOAuthUrl(url: URL) {
  const parameters = [url.searchParams, new URLSearchParams(url.hash.slice(1))];
  return (
    /(?:^|\/)(?:oauth(?:2)?|auth|authorize|callback|ha-auth-callback(?:\.(?:html|js))?)(?:\/|$)/i.test(
      url.pathname,
    ) ||
    parameters.some((params) =>
      [
        "auth_callback",
        "code",
        "state",
        "access_token",
        "id_token",
        "error",
        "error_description",
      ].some((key) => params.has(key)),
    )
  );
}

/** Only the explicitly configured public origin may load the analytics script. */
export function publicSiteAnalyticsEnabled(
  production: boolean,
  configuredOrigin: string | undefined,
  currentUrl: string,
) {
  const url = new URL(currentUrl);
  return (
    production && configuredOrigin === url.origin && url.protocol === "https:" && !isOAuthUrl(url)
  );
}

export function analyticsPath(url: URL) {
  return url.pathname.replace(/^(\/(?:workspaces|open))\/[^/]+/, "$1/:workspaceId");
}

export function publicPageView(event: BeforeSendEvent, currentUrl: string) {
  const current = new URL(currentUrl);
  const url = new URL(event.url, current.origin);
  if (
    event.type !== "pageview" ||
    isOAuthUrl(current) ||
    isOAuthUrl(url) ||
    url.origin !== current.origin
  )
    return null;
  // Strip query/fragment data, local home identities, and arbitrary event properties.
  return { type: "pageview" as const, url: `${url.origin}${analyticsPath(url)}` };
}

export function PublicSiteAnalytics() {
  const location = useLocation();
  const url = new URL(
    `${location.pathname}${location.search}${location.hash}`,
    window.location.origin,
  );
  if (
    !publicSiteAnalyticsEnabled(
      import.meta.env.PROD,
      import.meta.env.VITE_PUBLIC_ANALYTICS_ORIGIN as string | undefined,
      url.href,
    )
  )
    return null;
  const path = analyticsPath(url);
  // Explicit route/path disables automatic SDK tracking. React Router owns navigation.
  // Remount for distinct paths even when their anonymized route is identical.
  return (
    <Analytics
      key={location.pathname}
      mode="production"
      debug={false}
      route={path}
      path={path}
      beforeSend={(event) => publicPageView(event, window.location.href)}
    />
  );
}
