import "@mdi/font/css/materialdesignicons.min.css";

const MDI_ICON_PATTERN = /^mdi:([a-z0-9]+(?:-[a-z0-9]+)*)$/;

export const homeAssistantAreaIconClassName = (icon: string | null | undefined) => {
  const match = icon?.match(MDI_ICON_PATTERN);
  return match ? `mdi-${match[1]}` : null;
};

export function HomeAssistantAreaIcon({
  icon,
  className = "",
}: {
  icon: string | null | undefined;
  className?: string;
}) {
  const mdiClassName = homeAssistantAreaIconClassName(icon);
  if (!mdiClassName) return null;

  return (
    <span
      className={`home-assistant-area-icon mdi ${mdiClassName} ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
