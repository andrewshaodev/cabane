import type { ManifestIssue } from "./types";

export function ConfigurationScreen({ issues }: { issues: readonly ManifestIssue[] }) {
  return (
    <main className="configuration-screen">
      <section>
        <p className="configuration-screen__eyebrow">Configuration required</p>
        <h1>The home could not be rendered.</h1>
        <p>
          Fix the manifest paths below. The scene remains closed so invalid geometry cannot fail as
          a blank canvas.
        </p>
        <ol>
          {issues.map((issue) => (
            <li key={`${issue.path}-${issue.code}`}>
              <code>{issue.path}</code>
              <span>{issue.message}</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
