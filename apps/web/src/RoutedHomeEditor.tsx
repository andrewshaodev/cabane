import { lazy, Suspense, useMemo, useRef, type ComponentProps } from "react";
import { useBlocker, useLocation, useNavigate } from "react-router";
import {
  editorPath,
  editorRequestForPath,
  workspaceHomePath,
  shouldFlushEditorExit,
} from "./editor-routes";
import type { EditorOpenRequest } from "./editor-connect/connect-navigation";

const HomeEditor = lazy(() =>
  import("./HomeEditor").then((module) => ({ default: module.HomeEditor })),
);

export function RoutedHomeEditor({ onClose, ...props }: ComponentProps<typeof HomeEditor>) {
  const location = useLocation();
  const navigate = useNavigate();
  const request = useMemo(
    () =>
      ({
        ...(location.state as { editorRequest?: EditorOpenRequest } | null)?.editorRequest,
        ...editorRequestForPath(location.pathname),
      }) as EditorOpenRequest,
    [location.pathname, location.state],
  );
  // Browser Back must save the draft just like the editor's Home button.
  const allowExit = useRef(false);
  const blocker = useBlocker(
    ({ nextLocation }) =>
      !allowExit.current &&
      shouldFlushEditorExit(props.initialRecord.homeId, nextLocation.pathname),
  );
  const go = (next: EditorOpenRequest, replace = false) => {
    void navigate(editorPath(next, props.initialRecord.homeId), {
      replace,
      state: { editorRequest: next },
    });
  };
  return (
    <Suspense fallback={<main className="direction-project-loading">Opening the editor…</main>}>
      <HomeEditor
        {...props}
        initialRequest={request}
        onWorkspaces={() => void navigate("/workspaces")}
        onHomeAssistantSettings={() =>
          void navigate(`${workspaceHomePath(props.initialRecord.homeId)}/home-assistant`)
        }
        onRecoveryWorkspaces={() => {
          allowExit.current = true;
          void navigate("/workspaces");
        }}
        navigation={{ request, go, exitRequested: blocker.state === "blocked" }}
        onClose={(record, reason) => {
          allowExit.current = true;
          onClose(record, reason);
          if (blocker.state === "blocked") blocker.proceed();
          else void navigate(workspaceHomePath(props.initialRecord.homeId));
        }}
      />
    </Suspense>
  );
}
