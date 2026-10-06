import { useCabaneDom } from "@cabane/engine";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { EditorIcon } from "../editor-chrome/EditorIcon";
import { buildPlanGenerationPrompt } from "./plan-generation-prompt";
import "./plan-import.css";

export function PlanImportActions({
  homeId,
  disabled,
  onImport,
}: {
  homeId: string;
  disabled: boolean;
  onImport: (json: string) => void;
}) {
  const [mode, setMode] = useState<"prompt" | "import" | null>(null);
  const [imported, setImported] = useState(false);
  return (
    <section
      className="construction-inspector__selection construction-inspector__selection-hint plan-import"
      aria-label="Build from a floor plan"
    >
      <header>
        <h3>Have a floor plan?</h3>
      </header>
      <p className="construction-inspector__tool-hint">
        Turn it into an editable draft with your favorite AI tool.
      </p>
      <div className="plan-import__actions">
        <button type="button" disabled={disabled} onClick={() => setMode("prompt")}>
          <EditorIcon name="plan" />
          Generate from a plan
        </button>
        <button type="button" disabled={disabled} onClick={() => setMode("import")}>
          <EditorIcon name="import" />
          Import JSON
        </button>
      </div>
      {imported && (
        <p role="status">
          Imported into your draft. Review in Construct and Explore before Save. Undo restores your
          previous draft.
        </p>
      )}
      {mode && (
        <PlanImportDialog
          key={mode}
          mode={mode}
          homeId={homeId}
          disabled={disabled}
          onClose={() => setMode(null)}
          onImport={(json) => {
            onImport(json);
            setImported(true);
            setMode(null);
          }}
        />
      )}
    </section>
  );
}

function PlanImportDialog({
  mode,
  homeId,
  disabled,
  onClose,
  onImport,
}: {
  mode: "prompt" | "import";
  homeId: string;
  disabled: boolean;
  onClose: () => void;
  onImport: (json: string) => void;
}) {
  const dom = useCabaneDom();
  const dialog = useRef<HTMLDialogElement>(null);
  const promptField = useRef<HTMLTextAreaElement>(null);
  const titleId = useId();
  const prompt = useMemo(() => buildPlanGenerationPrompt(homeId), [homeId]);
  const [json, setJson] = useState("");
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const previous = dom.root.activeElement as HTMLElement | null;
    dialog.current?.showModal?.();
    return () => previous?.focus();
  }, [dom]);
  const copy = async () => {
    setError(null);
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
    } catch {
      setCopied(false);
      promptField.current?.focus();
      promptField.current?.select();
      setError(
        "Clipboard access is unavailable. The instructions are selected below; copy them with your keyboard or text selection menu.",
      );
    }
  };
  return (
    <dialog
      ref={dialog}
      className="plan-import-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header>
        <h2 id={titleId}>
          {mode === "prompt" ? "Generate from a floor plan" : "Import your generated home"}
        </h2>
        <button
          type="button"
          className="plan-import-dialog__close"
          aria-label="Close"
          onClick={onClose}
        >
          <EditorIcon name="close" />
        </button>
      </header>
      {mode === "prompt" ? (
        <>
          <ol>
            <li>
              Copy the instructions below into your favorite AI tool that accepts images, then
              attach your floor plan.
            </li>
            <li>
              Include a known measurement if the plan has no readable dimensions. Answer any
              questions from the AI.
            </li>
            <li>
              Save its response as <strong>cabane-plan.json</strong>. Return here and choose{" "}
              <strong>Import JSON</strong>.
            </li>
          </ol>
          <p>
            The instructions include the complete schema for one unfurnished floor. No API key is
            needed in Cabane. Your chosen AI provider processes the plan you share.
          </p>
          <p>
            Start in a blank home: importing replaces this home’s entire draft, including other
            floors and furnishings. It does not merge a floor or change Home until you Save.
          </p>
          <button type="button" className="plan-import-dialog__primary" onClick={() => void copy()}>
            {copied ? "Copy instructions again" : "Copy instructions"}
          </button>
          <span role="status">{copied ? "Instructions copied." : ""}</span>
          <label>
            Full instructions and JSON schema
            <textarea ref={promptField} readOnly value={prompt} spellCheck={false} rows={12} />
          </label>
        </>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (disabled || reading || !json.trim()) return;
            setError(null);
            try {
              onImport(json);
            } catch (cause) {
              setError(
                `${cause instanceof Error ? cause.message : "Could not import this project."} Send this error and the JSON back to your AI tool for correction, then try again.`,
              );
            }
          }}
        >
          <p>
            This replaces the entire draft, including other floors and furnishings. You can Undo
            afterward. Review the result before Save changes Home.
          </p>
          <label>
            Cabane JSON file
            <input
              type="file"
              accept=".json,application/json"
              disabled={disabled || reading}
              onChange={(event) => {
                void (async () => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  setReading(true);
                  setError(null);
                  setJson("");
                  try {
                    setJson(await file.text());
                  } catch {
                    setError("Could not read this file. Select it again or paste the JSON below.");
                  } finally {
                    setReading(false);
                  }
                })();
              }}
            />
          </label>
          <label>
            Or paste the generated JSON
            <textarea
              value={json}
              onInput={(event) => {
                setJson(event.currentTarget.value);
                setError(null);
              }}
              disabled={disabled || reading}
              spellCheck={false}
              rows={10}
              placeholder="Paste the complete project JSON here"
            />
          </label>
          <button
            type="submit"
            className="plan-import-dialog__primary"
            disabled={disabled || reading || !json.trim()}
          >
            {reading ? "Reading file…" : "Import and replace draft"}
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="plan-import-dialog__error">
          {error}
        </p>
      )}
    </dialog>
  );
}
