import { BUILD_TUTORIAL_STEPS, type BuildTutorialState } from "@cabane/engine";
import "./build-tutorial.css";

const instructions = {
  walls: ["Create your first room", "Click to start a wall, then click each corner. Return to the first corner to close your room.", "Select Wall"],
  door: ["Add a door", "Choose Door, then click a wall of your first room to place it.", "Select Door"],
  window: ["Add a window", "Choose Window, then click a wall of your first room to let the light in.", "Select Window"],
  name: ["Name your room", "Click “Name room” on the plan and give this space a name.", "Name room"],
  arrange: ["Make it your room", "Go to Arrange to add furniture and devices. Take your time; continue whenever you’re ready.", "Go to Arrange"],
  connect: ["Connect your home", "Link your rooms and devices to Home Assistant. You can keep editing your home later.", "Go to Connect"],
};
export function BuildTutorial({ state, mode, disabled, warning, onAction, onSkip, onDismiss }: {
  state: BuildTutorialState; mode: string; disabled: boolean; warning: string | null;
  onAction: () => void; onSkip: () => void; onDismiss: () => void;
}) {
  const [title, description, action] = instructions[state.step];
  return <section className="build-tutorial" aria-label="Build your first room">
    <div className="build-tutorial__heading"><span>Getting started · {BUILD_TUTORIAL_STEPS.indexOf(state.step) + 1} of 6</span>
      <button type="button" aria-label="Dismiss tutorial" title="Dismiss tutorial" onClick={onDismiss}>×</button></div>
    <div aria-live="polite" aria-atomic="true"><h2>{title}</h2><p>{description}</p></div>
    <div className="build-tutorial__actions">
      <button className="build-tutorial__primary" type="button" disabled={disabled} onClick={onAction}>
        {state.step === "arrange" && mode === "furnish" ? "I’m ready" : action}
      </button>
      <button type="button" disabled={disabled} onClick={onSkip}>Skip step</button>
    </div>
    {warning && <p role="status">{warning}</p>}
  </section>;
}
