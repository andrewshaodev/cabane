import { PresenceStatusIcon } from "./PresenceStatusIcon";
import type { HomePresenceSummary } from "./model";

const accessibleLabel = (summary: HomePresenceSummary) => {
  if (summary.state === "present") {
    return `At home: ${summary.people.map(({ name }) => name).join(", ")}`;
  }
  return summary.state === "empty" ? "Nobody home" : "Presence unavailable";
};

export function HomePresenceStatus({ summary }: { summary: HomePresenceSummary }) {
  const label = accessibleLabel(summary);
  return (
    <div className="home-presence-status" data-presence-state={summary.state} aria-label={label}>
      <span className="home-presence-status__icon">
        <PresenceStatusIcon
          state={
            summary.state === "present"
              ? "present"
              : summary.state === "empty"
                ? "absent"
                : "unavailable"
          }
        />
      </span>
      {summary.state === "present" ? (
        <span className="home-presence-status__copy">
          <strong>At home</strong>
          <span aria-hidden="true"> · </span>
          <span>{summary.people.map(({ name }) => name).join(", ")}</span>
        </span>
      ) : (
        <span className="home-presence-status__copy">{label}</span>
      )}
    </div>
  );
}
