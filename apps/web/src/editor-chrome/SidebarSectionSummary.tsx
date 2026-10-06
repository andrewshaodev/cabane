import { EditorIcon, type EditorIconName } from "./EditorIcon";

export function SidebarSectionSummary({
  icon,
  title,
  description,
}: {
  icon: EditorIconName;
  title: string;
  description: string;
}) {
  return (
    <summary className="sidebar-section-summary">
      <EditorIcon name={icon} />
      <span className="sidebar-section-summary__copy">
        <span>{title}</span>
        <small>{description}</small>
      </span>
      <span className="sidebar-section-summary__chevron">
        <EditorIcon name="chevron" />
      </span>
    </summary>
  );
}
