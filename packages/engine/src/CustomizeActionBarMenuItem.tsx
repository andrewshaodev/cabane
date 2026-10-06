import { SceneMenuIcon } from "./SceneMenuIcon";

export function CustomizeActionBarMenuItem({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={event => {
    event.currentTarget.closest("details")?.removeAttribute("open");
    onClick();
  }}>
    <SceneMenuIcon name="shortcuts" />
    <span>Customize action bar</span>
  </button>;
}
