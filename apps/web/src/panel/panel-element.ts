import type { HomeAssistantHostSession } from "@cabane/engine";

export interface PanelMount {
  container: HTMLElement;
  portalContainer: HTMLElement;
  root: ShadowRoot;
  assetBaseUrl: string;
  session: HomeAssistantHostSession;
}
interface PanelApplication {
  update(session: HomeAssistantHostSession): void;
  dispose(): void;
}
interface PanelOptions {
  assetBaseUrl: string;
  mount(input: PanelMount): PanelApplication;
}

// Font faces are document resources in browsers. Only font declarations (never
// application styles) live outside the shadow root, and only while a panel exists.
const fontLinks = new WeakMap<Document, Map<string, { link: HTMLLinkElement; count: number }>>();
function retainFonts(document: Document, href: string) {
  let links = fontLinks.get(document);
  if (!links) fontLinks.set(document, (links = new Map()));
  let entry = links.get(href);
  if (!entry) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.cabaneFonts = "";
    document.head.append(link);
    links.set(href, (entry = { link, count: 0 }));
  }
  entry.count++;
  return () => {
    if (--entry.count === 0) {
      entry.link.remove();
      links.delete(href);
    }
  };
}

export function createCabanePanelElement(options: PanelOptions) {
  return class CabanePanel extends HTMLElement {
    #session: HomeAssistantHostSession | null = null;
    #application: PanelApplication | null = null;
    #observer: ResizeObserver | null = null;
    #releaseFonts: (() => void) | null = null;
    #content: HTMLElement;
    #container: HTMLElement;
    #portals: HTMLElement;
    #waiting: HTMLElement;

    constructor() {
      super();
      const document = this.ownerDocument;
      const shadow = this.attachShadow({ mode: "open" });
      const stylesheet = document.createElement("link");
      stylesheet.rel = "stylesheet";
      stylesheet.href = new URL("cabane-panel.css", options.assetBaseUrl).href;
      const style = document.createElement("style");
      style.textContent = `
        :host { display:grid; grid-template-rows:48px minmax(0,1fr); height:100%; min-height:0; min-width:0; contain:layout paint; }
        .panel-toolbar { display:flex; gap:12px; align-items:center; background:var(--app-header-background-color,#f4efe5); color:var(--app-header-text-color,#35433a); font:500 16px system-ui; padding:0 12px; border-bottom:1px solid #80808030; }
        .panel-toolbar button { display:grid; place-items:center; background:none; border:0; color:inherit; width:40px; height:40px; padding:8px; border-radius:8px; }
        .panel-toolbar svg { width:24px; height:24px; fill:currentColor; }
        .panel-content { position:relative; min-width:0; min-height:0; overflow:hidden; contain:layout paint; container:cabane / size; }
        #root { position:relative; inset:auto; width:100%; height:100%; min-width:0; margin:0; overflow:hidden; }
        #cabane-portals { position:absolute; inset:0; pointer-events:none; z-index:1000; }
        #cabane-portals > * { pointer-events:auto; }
        .panel-waiting { position:absolute; inset:0; display:grid; place-items:center; padding:24px; font:14px system-ui; background:#f4efe5; color:#35433a; }
        .panel-waiting[hidden] { display:none; }
      `;
      const header = document.createElement("header");
      header.className = "panel-toolbar";
      const menu = document.createElement("button");
      menu.type = "button";
      menu.setAttribute("aria-label", "Open Home Assistant menu");
      menu.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"/></svg>';
      menu.addEventListener("click", () =>
        this.dispatchEvent(
          new this.ownerDocument.defaultView!.CustomEvent("hass-toggle-menu", {
            bubbles: true,
            composed: true,
          }),
        ),
      );
      header.append(menu, document.createTextNode("Cabane"));
      this.#content = document.createElement("div");
      this.#content.className = "panel-content";
      this.#container = document.createElement("div");
      this.#container.id = "root";
      this.#portals = document.createElement("div");
      this.#portals.id = "cabane-portals";
      this.#waiting = document.createElement("div");
      this.#waiting.className = "panel-waiting";
      this.#waiting.setAttribute("role", "status");
      this.#waiting.textContent = "Waiting for the Home Assistant session…";
      stylesheet.addEventListener("error", () => {
        this.#waiting.hidden = false;
        this.#waiting.textContent =
          "Cabane’s files could not load. Reload Home Assistant after updating the integration.";
      });
      this.#content.append(this.#container, this.#portals, this.#waiting);
      shadow.append(stylesheet, style, header, this.#content);
    }

    set hass(value: { connection?: HomeAssistantHostSession["connection"] } | undefined) {
      const connection = value?.connection;
      if (connection === this.#session?.connection) return;
      this.#session = connection
        ? { connection, origin: this.ownerDocument.location.origin }
        : null;
      this.#render();
    }
    set narrow(value: boolean) {
      this.toggleAttribute("narrow", value);
    }
    // Cabane uses memory routing. HA owns these properties and the browser URL.
    set route(_value: unknown) {}
    set panel(_value: unknown) {}

    connectedCallback() {
      this.#releaseFonts ??= retainFonts(
        this.ownerDocument,
        new URL("cabane-fonts.css", options.assetBaseUrl).href,
      );
      if (typeof ResizeObserver !== "undefined") {
        this.#observer = new ResizeObserver(() => this.#measure());
        this.#observer.observe(this.#content);
      }
      this.#measure();
      this.#render();
    }
    disconnectedCallback() {
      this.#application?.dispose();
      this.#application = null;
      this.#observer?.disconnect();
      this.#observer = null;
      this.#releaseFonts?.();
      this.#releaseFonts = null;
      this.#portals.replaceChildren();
    }
    #measure() {
      const { width, height } = this.#content.getBoundingClientRect();
      if (width > 0) this.style.setProperty("--cabane-panel-width", `${width}px`);
      if (height > 0) this.style.setProperty("--cabane-panel-height", `${height}px`);
    }
    #render() {
      if (!this.isConnected) return;
      this.#waiting.hidden = Boolean(this.#session);
      if (!this.#session) {
        this.#application?.dispose();
        this.#application = null;
        return;
      }
      if (this.#application) this.#application.update(this.#session);
      else
        this.#application = options.mount({
          container: this.#container,
          portalContainer: this.#portals,
          root: this.shadowRoot!,
          assetBaseUrl: options.assetBaseUrl,
          session: this.#session,
        });
    }
  };
}
