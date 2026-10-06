import { EditorButton } from "../../editor-chrome/EditorButton";
import { SidebarSectionSummary } from "../../editor-chrome/SidebarSectionSummary";

export function NorthSettingsEditor({
  value,
  onEdit,
  disabled,
}: {
  value: number;
  onEdit: () => void;
  disabled: boolean;
}) {
  return (
    <details className="construction-inspector__floor-disclosure">
      <SidebarSectionSummary
        icon="spawn"
        title="North"
        description="Orient the compass around your plan."
      />
      <section
        className="construction-inspector__floor-settings sidebar-section-content"
        aria-label="North orientation"
      >
        <EditorButton disabled={disabled} onClick={onEdit}>
          Set north on plan
        </EditorButton>
        <p className="sidebar-section-note">
          Current direction: {value}° clockwise from the top of the plan. Shared by all floors.
        </p>
      </section>
    </details>
  );
}
