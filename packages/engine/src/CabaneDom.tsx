import { createContext, useContext, type ReactNode } from "react";

/** DOM boundaries owned by one Cabane application instance. */
export interface CabaneDomEnvironment {
  root: Document | ShadowRoot;
  container: HTMLElement;
  portalContainer: HTMLElement;
  eventTarget: Window | ShadowRoot;
  assetBaseUrl?: string;
}
const CabaneDomContext = createContext<CabaneDomEnvironment | null>(null);
export function CabaneDomProvider({ environment, children }: {
  environment: CabaneDomEnvironment; children: ReactNode;
}) {
  return <CabaneDomContext.Provider value={environment}>{children}</CabaneDomContext.Provider>;
}
export function useCabaneDom() {
  const environment = useContext(CabaneDomContext);
  return {
    get root() { return environment?.root ?? document; },
    get container() { return environment?.container ?? document.body; },
    get portalContainer() { return environment?.portalContainer ?? document.body; },
    // These EventTarget operations are shared; retain typed browser event names.
    get events() { return (environment?.eventTarget ?? (typeof window === "undefined" ? globalThis : window)) as Pick<Window, "addEventListener" | "removeEventListener">; },
    assetBaseUrl: environment?.assetBaseUrl,
  };
}
export function useCabaneAssetUrl(path: string) {
  const { assetBaseUrl } = useCabaneDom();
  return assetBaseUrl ? new URL(path.replace(/^\//, ""), assetBaseUrl).href : `/${path.replace(/^\//, "")}`;
}
