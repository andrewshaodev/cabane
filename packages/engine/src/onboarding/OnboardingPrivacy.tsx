export function OnboardingPrivacy() {
  return (
    <details className="onboarding-privacy">
      <summary>Your browser connects directly to Home Assistant</summary>
      <p>
        Cabane talks to your Home Assistant from this browser. Your home, connection mappings, and
        sign-in tokens are stored here, without a Cabane account or cloud workspace.
      </p>
      <p>
        Clearing browser data can remove your work. Export a backup to keep a copy; private backups
        can contain your Home Assistant entity IDs, but do not include sign-in tokens.
      </p>
      <p>
        The hosted page still loads from its web host. Self-hosting lets you choose where Cabane
        itself is served.
      </p>
    </details>
  );
}
