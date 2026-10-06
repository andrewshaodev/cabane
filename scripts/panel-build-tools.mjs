import postcss from "postcss";

/** Scope the ordinary application CSS without changing the standalone build. */
export function scopePanelCss(source) {
  const root = postcss.parse(source);
  const fonts = postcss.root();
  root.walkAtRules("font-face", (rule) => {
    fonts.append(rule.clone());
    rule.remove();
  });
  root.walkRules((rule) => {
    rule.selector = rule.selector
      .replace(/:root\b/g, ":host")
      .replace(/(?<![\w.-])(?:html|body)(?![\w-])/g, "#root");
  });
  root.walkAtRules("media", (rule) => {
    const branches = rule.params.split(",").map((value) => value.trim());
    const parsed = branches.map((branch) => {
      const terms = branch.split(/\s+and\s+/i);
      const sizes = terms.filter((term) =>
        /^\((?:(?:min|max)-)?(?:width|height|aspect-ratio|orientation)\s*:/.test(term),
      );
      return { sizes, environment: terms.filter((term) => !sizes.includes(term)) };
    });
    if (!parsed.some((branch) => branch.sizes.length)) return;
    for (const { sizes, environment } of parsed) {
      const contents = rule.nodes.map((node) => node.clone());
      let replacement;
      if (sizes.length) {
        replacement = postcss.atRule({
          name: "container",
          params: `cabane ${sizes.join(" and ")}`,
        });
        replacement.append(contents);
        if (environment.length) {
          const media = postcss.atRule({ name: "media", params: environment.join(" and ") });
          media.append(replacement);
          replacement = media;
        }
      } else {
        replacement = postcss.atRule({ name: "media", params: environment.join(" and ") });
        replacement.append(contents);
      }
      rule.before(replacement);
    }
    rule.remove();
  });
  root.walkDecls((declaration) => {
    declaration.value = declaration.value
      .replace(/([\d.]+)(?:d|s|l)?v([wh])\b/g, (_, number, axis) => {
        const variable = `var(--cabane-panel-${axis === "w" ? "width" : "height"})`;
        return Number(number) === 100 ? variable : `calc(${variable} * ${Number(number) / 100})`;
      })
      .replace(/url\((["']?)\/cabane-icon\.png\1\)/g, "url(./cabane-icon.png)");
  });
  return { css: root.toString(), fonts: fonts.toString() };
}
