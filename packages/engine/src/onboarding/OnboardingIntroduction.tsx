import { useEffect, useRef } from "react";
import { OnboardingPrivacy } from "./OnboardingPrivacy";

export interface OnboardingLinks { source: string; selfHost: string; available?: boolean; }
export function OnboardingIntroduction({ onExplore, onBuild, onDismiss, busy, error, links }: {
  onExplore: () => void; onBuild: () => void; onDismiss: () => void;
  busy: boolean; error: string | null; links?: OnboardingLinks;
}) {
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => { title.current?.focus({ preventScroll: true }); }, []);
  return <aside className="setup-task-surface onboarding-intro" aria-labelledby="onboarding-title" aria-busy={busy}>
    <div className="onboarding-intro__body">
      <div className="onboarding-intro__top"><span>cabane</span><button type="button" aria-label="Dismiss introduction" onClick={onDismiss} disabled={busy}>×</button></div>
      <p className="onboarding-eyebrow">Your home, made tangible</p>
      <h1 ref={title} tabIndex={-1} id="onboarding-title">Your home. In 3D.<br />Under your control.</h1>
      <p className="onboarding-intro__description">Build your rooms, arrange furniture and devices, then connect Home Assistant to bring them to life.</p>
      <div className="onboarding-previews" aria-label="Build, connect, and control">
        {[
          ["build", "Build & arrange", "A room in Cabane’s layout and furniture editor"],
          ["connect", "Connect", "Home Assistant connection setup for a modeled device"],
          ["control", "Control", "A light controlled from the 3D home"],
        ].map(([name, label, alt], index) => <figure key={name}>
          <img src={`/onboarding/${name}.png`} alt={alt} width={320} height={200} />
          <figcaption><span>{index + 1}</span> {label}</figcaption>
        </figure>)}
      </div>
      <div className="onboarding-entry-actions">
        <button type="button" className="is-primary" onClick={onExplore} disabled={busy}><strong>Explore the demo <span aria-hidden="true">↗</span></strong><small>Try the simulated devices. No connection needed.</small></button>
        <button type="button" onClick={onBuild} disabled={busy}><strong>Build my home</strong><small>Start with an empty home. Connect devices whenever you’re ready.</small></button>
      </div>
      {error && <p className="onboarding-error" role="alert">{error}</p>}
      <footer><p>Your home is saved in this browser.</p><OnboardingPrivacy />
        {links && links.available !== false && <nav aria-label="Source and self-hosting"><a href={links.source} target="_blank" rel="noreferrer">Source code ↗</a><a href={links.selfHost} target="_blank" rel="noreferrer">Self-hosting ↗</a></nav>}
      </footer>
    </div>
  </aside>;
}
