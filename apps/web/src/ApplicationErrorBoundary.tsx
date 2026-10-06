import { Component, useEffect, type ErrorInfo, type ReactNode } from "react";
import { useRouteError } from "react-router";

function ApplicationErrorPage() {
  return (
    <main className="direction-project-loading is-error application-error" role="alert">
      <h1>Cabane couldn’t open this view</h1>
      <p>Something went wrong. Reload the page to try again. Any changes that weren’t saved may be lost.</p>
      <button type="button" onClick={() => window.location.reload()}>Reload page</button>
    </main>
  );
}

/** Router failures must override React Router's default stack-trace screen. */
export function ApplicationRouteError() {
  const error = useRouteError();
  useEffect(() => {
    console.error("Cabane route failed:", error);
  }, [error]);
  return <ApplicationErrorPage />;
}

/** Also covers providers and other components outside the router. */
export class ApplicationErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Cabane application failed:", error, info.componentStack);
  }

  render() {
    return this.state.hasError ? <ApplicationErrorPage /> : this.props.children;
  }
}
