import { chromium } from "playwright-core";
const browser = await chromium.launch({ channel: "chrome", headless: false });
try {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    window.roots = new Set();
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      supportsFiber: true,
      inject: () => 1,
      onCommitFiberRoot: (_, r) => window.roots.add(r),
      onCommitFiberUnmount() {},
    };
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4199");
  await page.getByRole("button", { name: /Explore the demo/ }).click();
  for (const floor of ["Ground floor", "First floor"]) {
    await page.getByRole("button", { name: floor, exact: true }).click();
    await page.waitForTimeout(2500);
    const result = await page.evaluate(async () => {
      let store;
      const visit = (f) => {
        if (!f) return;
        if (f.stateNode?.object?.__r3f?.root) store = f.stateNode.object.__r3f.root;
        visit(f.child);
        visit(f.sibling);
      };
      window.roots.forEach((r) => visit(r.current));
      const s = store.getState(),
        before = new Map();
      let cache;
      const resources = (f) => {
        if (!f) return;
        for (let h = f.memoizedState; h && typeof h === "object"; h = h.next) {
          const v = h.memoizedState;
          if (Array.isArray(v) && v[0]?.shadows) cache = v[0].shadows;
        }
        resources(f.child);
        resources(f.sibling);
      };
      window.roots.forEach((r) => resources(r.current));
      const reasons = [];
      const baseObject = Object.getPrototypeOf(Object.getPrototypeOf(s.scene));
      s.scene.traverseVisible((o) => {
        if (o.onBeforeRender !== baseObject.onBeforeRender)
          reasons.push({ kind: "before-render", name: o.name, type: o.type });
        if (o.isMesh && o.castShadow) {
          for (const m of Array.isArray(o.material) ? o.material : [o.material])
            if (!m.isMeshToonMaterial)
              reasons.push({ kind: "material", name: o.name, type: m.type });
          if (o.matrixWorld.elements.some(Number.isNaN))
            reasons.push({ kind: "NaN", name: o.name });
        }
      });
      let difference;
      if (cache) {
        const original = cache.needsUpdate;
        cache.needsUpdate = function (...args) {
          const before = [...this.inputs.values];
          const dirty = original.apply(this, args);
          const after = this.inputs.values;
          if (dirty && !difference) {
            const i = after.findIndex((v, i) => v !== before[i]);
            const describe = (v) =>
              typeof v === "object" && v ? { type: v.type, name: v.name, uuid: v.uuid } : v;
            difference = {
              beforeLength: before.length,
              afterLength: after.length,
              index: i,
              before: before.slice(Math.max(0, i - 4), i + 5).map(describe),
              after: after.slice(Math.max(0, i - 4), i + 5).map(describe),
            };
          }
          return dirty;
        };
      }

      s.scene.traverseVisible((o) => {
        if (o.isMesh && o.castShadow) before.set(o, [...o.matrixWorld.elements]);
      });
      await new Promise((r) => setTimeout(r, 250));
      const changed = [];
      s.scene.traverseVisible((o) => {
        if (!o.isMesh || !o.castShadow || !before.has(o)) return;
        if (o.matrixWorld.elements.some((v, i) => v !== before.get(o)[i])) {
          const names = [];
          for (let p = o; p; p = p.parent) if (p.name) names.push(p.name);
          changed.push({ names, material: o.material.type });
        }
      });
      return {
        changed,
        reasons,
        difference,
        renderer: {
          clipping: s.gl.localClippingEnabled,
          shadowType: s.gl.shadowMap.type,
          autoUpdate: s.gl.shadowMap.autoUpdate,
        },
      };
    });
    console.log(JSON.stringify({ floor, changed: result }));
  }
} finally {
  await browser.close();
}
