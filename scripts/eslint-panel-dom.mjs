const propertyName = (node) => (node.computed ? node.property.value : node.property.name);

// These notifications belong to the browser rather than a Cabane DOM subtree.
const documentEvents = new Set(["visibilitychange", "pointerlockchange", "pointerlockerror"]);
const windowEvents = new Set([
  "blur",
  "focus",
  "resize",
  "scroll",
  "storage",
  "orientationchange",
  "pagehide",
  "pageshow",
  "beforeunload",
  "online",
  "offline",
  "error",
  "unhandledrejection",
]);

export default {
  rules: {
    "panel-dom": {
      meta: {
        type: "problem",
        schema: [],
        messages: {
          focus: "Read focus from useCabaneDom().root.activeElement so it stays inside the panel.",
          event:
            "Use useCabaneDom().events for application input listeners; global targets retarget shadow DOM events.",
        },
      },
      create(context) {
        const globalIdentifier = (node) => {
          if (node.type !== "Identifier") return false;
          for (let scope = context.sourceCode.getScope(node); scope; scope = scope.upper) {
            const variable = scope.set.get(node.name);
            if (variable) return variable.defs.length === 0;
          }
          return true;
        };
        const targetName = (node) => {
          if (globalIdentifier(node) && ["window", "document"].includes(node.name))
            return node.name;
          if (
            node.type === "MemberExpression" &&
            globalIdentifier(node.object) &&
            ["window", "globalThis"].includes(node.object.name) &&
            ["window", "document"].includes(propertyName(node))
          )
            return propertyName(node);
          return null;
        };
        return {
          MemberExpression(node) {
            const target = targetName(node.object);
            if (!target) return;
            const name = propertyName(node);
            if (target === "document" && name === "activeElement") {
              context.report({ node, messageId: "focus" });
            } else if (["addEventListener", "removeEventListener"].includes(name)) {
              const call = node.parent;
              const event =
                call.type === "CallExpression" && call.callee === node
                  ? call.arguments[0]?.value
                  : null;
              const allowed = target === "document" ? documentEvents : windowEvents;
              if (!allowed.has(event)) context.report({ node, messageId: "event" });
            }
          },
        };
      },
    },
  },
};
