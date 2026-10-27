import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { useCabaneDom } from "@cabane/engine";
import type { useHomeEditorController } from "../editor-workspace/useHomeEditorController";
import { useAgentPilotBridge } from "./browser-bridge";

type Props = {
  workspaceId: string;
  controller: ReturnType<typeof useHomeEditorController>;
  open: boolean;
  onClose: () => void;
};

export function AgentPilotPanel({ workspaceId, controller, open, onClose }: Props) {
  const [code, setCode] = useState("");
  const dialogRef = useRef<HTMLElement>(null);
  const dom = useCabaneDom();
  const { connection, pair, disconnect } = useAgentPilotBridge(workspaceId, controller);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void pair(code);
  };
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    dom.events.addEventListener("keydown", onKeyDown);
    dialogRef.current?.querySelector<HTMLElement>("#agent-pilot-code")?.focus({
      preventScroll: true,
    });
    return () => dom.events.removeEventListener("keydown", onKeyDown);
  }, [dom.events, onClose, open]);

  if (!open) return null;

  const closeFromBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div className="agent-pilot-dialog-backdrop" onMouseDown={closeFromBackdrop}>
      <section
        ref={dialogRef}
        className="agent-pilot-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-pilot-title"
        aria-describedby="agent-pilot-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="agent-pilot-dialog__header">
          <div>
            <p className="agent-pilot-dialog__eyebrow">Local agent connection</p>
            <h2 id="agent-pilot-title">Connect LLM agent</h2>
          </div>
          <button
            type="button"
            className="agent-pilot-dialog__close"
            aria-label="Close Connect LLM agent"
            onClick={onClose}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <p id="agent-pilot-description" className="agent-pilot-dialog__description">
          Connect an LLM agent running on this computer to this workspace. It can inspect and edit
          the draft, manage catalog items, and use this workspace’s existing Home Assistant
          connection.
        </p>
        <div className="agent-pilot-dialog__status">
          <span>Status</span>
          <strong className={`is-${connection.status}`}>{connection.status}</strong>
        </div>
        <p className="agent-pilot-dialog__message" role="status">
          {connection.message}
        </p>
        {connection.status !== "connected" ? (
          <>
            <ol className="agent-pilot-dialog__steps">
              <li>
                <strong>Start the local bridge</strong>
                <span>
                  Open a terminal in the Cabane repository on this computer and run:
                  <code>npm run agent:bridge</code>
                </span>
              </li>
              <li>
                <strong>Copy the pairing code</strong>
                <span>Copy the code printed by the command. It starts with MCBN-.</span>
              </li>
              <li>
                <strong>Connect this workspace</strong>
                <span>Paste the code below, then select Connect.</span>
              </li>
            </ol>
            <p className="agent-pilot-dialog__notice">
              Keep the terminal running. The browser and the terminal must be on the same computer.
            </p>
            <form onSubmit={submit}>
              <label htmlFor="agent-pilot-code">Pairing code from your terminal</label>
              <div className="agent-pilot-dialog__form-row">
                <input
                  id="agent-pilot-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="MCBN-XXXXXX"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="submit"
                  className="agent-pilot-dialog__primary"
                  disabled={!code.trim() || connection.status === "connecting"}
                >
                  Connect
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <p className="agent-pilot-dialog__notice">
              The LLM agent can now use the Cabane CLI with this workspace. Keep the bridge terminal
              running.
            </p>
            <button type="button" onClick={disconnect}>
              Disconnect
            </button>
          </>
        )}
        <small>
          The agent can use only Cabane’s exposed commands. It cannot read browser storage or
          credentials, run arbitrary code, or start a second Home Assistant connection. Publishing
          remains an explicit command.
        </small>
      </section>
    </div>
  );
}
