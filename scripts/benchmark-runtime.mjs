import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

// Audit instrumentation only: no product changes, persisted owner data, or HA access.
const origin = process.env.BENCH_ORIGIN ?? 'http://127.0.0.1:4198';
const output = process.env.BENCH_OUTPUT ?? '/tmp/cabane-runtime-audit';
const seconds = Number(process.env.BENCH_SECONDS ?? 12);
const repeats = Number(process.env.BENCH_REPEATS ?? 3);
const dpr = Number(process.env.BENCH_DPR ?? 2);
const gpuTiming = process.env.BENCH_GPU_TIMING === '1';
const walkOnly = process.env.BENCH_WALK_ONLY === '1';
const quick = process.env.BENCH_QUICK === '1';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: false,
  // Preserve normal background behavior rather than Playwright's testing overrides.
  ignoreDefaultArgs: ['--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding'],
});
const report = { origin, browser: browser.version(), viewport: [1440, 900], deviceScaleFactor: dpr,
  seconds, repeats, gpuTiming, walkOnly, started: new Date().toISOString(), scenarios: [], errors: [] };
const save = () => writeFile(`${output}/results.json`, JSON.stringify(report, null, 2));
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: dpr });
  await context.addInitScript(() => {
    window.auditRoots = new Set();
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, inject: () => 1,
      onCommitFiberRoot: (_, root) => window.auditRoots.add(root), onCommitFiberUnmount() {} };
  });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  const cdp = await context.newCDPSession(page);
  const system = await browser.newBrowserCDPSession();
  await cdp.send('Performance.enable');
  const systemInfo = await system.send('SystemInfo.getInfo');
  report.gpu = systemInfo.gpu;
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Explore the demo/ }).click();
  await page.waitForTimeout(7000);
  report.startup = await page.evaluate(() => ({ navigation: performance.getEntriesByType('navigation').map(e => e.toJSON()),
    paint: performance.getEntriesByType('paint').map(e => e.toJSON()), resourceBytes: performance.getEntriesByType('resource').reduce((n, e) => n + e.encodedBodySize, 0) }));
  await page.evaluate((gpuTiming) => {
    function visit(f) {
      if (!f) return;
      if (f.stateNode?.object?.__r3f?.root) window.auditStore = f.stateNode.object.__r3f.root;
      visit(f.child); visit(f.sibling);
    }
    window.auditRoots.forEach(r => { const old = window.auditStore; visit(r.current); if (window.auditStore && (!old || window.auditStore !== old)) window.auditSceneRoot = r; });
    if (!window.auditStore) throw Error('R3F store not found');
    window.auditRoots.clear();
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = () => {};
    const state = window.auditStore.getState();
    const gl = state.gl;
    const context = gl.getContext();
    const extension = gpuTiming ? context.getExtension('EXT_disjoint_timer_query_webgl2') : null;
    window.audit = { frames: [], longTasks: [], active: false, extension: Boolean(extension), queryPending: [] };
    new PerformanceObserver(list => { if (window.audit.active) window.audit.longTasks.push(...list.getEntries().map(e => ({ start: e.startTime, duration: e.duration }))); }).observe({ type: 'longtask', buffered: false });
    const render = gl.render;
    gl.render = function (...args) {
      const t = performance.now();
      const result = render.apply(this, args);
      if (window.audit.current) {
        window.audit.current.renderCpuMs += performance.now() - t;
        window.audit.current.calls += gl.info.render.calls;
        window.audit.current.triangles += gl.info.render.triangles;
      }
      return result;
    };
    state.internal.subscribe({ current: () => {
      const a = window.audit;
      a.current = a.active ? { t: performance.now(), calls: 0, triangles: 0, renderCpuMs: 0 } : null;
      if (a.current && extension) {
        a.current.query = context.createQuery();
        context.beginQuery(extension.TIME_ELAPSED_EXT, a.current.query);
      }
    } }, -1000, window.auditStore);
    state.internal.subscribe({ current: () => {
      const a = window.audit;
      if (!a.current) return;
      const f = a.current;
      f.frameCpuMs = performance.now() - f.t;
      if (extension) {
        context.endQuery(extension.TIME_ELAPSED_EXT);
        a.queryPending.push(f);
        while (a.queryPending.length && context.getQueryParameter(a.queryPending[0].query, context.QUERY_RESULT_AVAILABLE)) {
          const ready = a.queryPending.shift();
          ready.gpuMs = context.getParameter(extension.GPU_DISJOINT_EXT) ? null : context.getQueryParameter(ready.query, context.QUERY_RESULT) / 1e6;
          context.deleteQuery(ready.query); delete ready.query;
        }
      }
      a.frames.push(f); a.current = null;
    } }, 1000, window.auditStore);
    window.auditSnapshot = () => {
      const s = window.auditStore.getState();
      const geometries = new Set(), materials = new Set();
      let objects = 0, meshes = 0, vertices = 0, geometryBytes = 0, lights = [], subscribers = s.internal.subscribers.length;
      s.scene.traverse(o => {
        objects++; if (o.isMesh) meshes++;
        if (o.geometry) geometries.add(o.geometry);
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materials.add(m));
        if (o.isLight) lights.push({ type: o.type, intensity: o.intensity, castShadow: o.castShadow, shadowAutoUpdate: o.shadow?.autoUpdate, mapSize: o.shadow?.mapSize.toArray() });
      });
      for (const g of geometries) {
        vertices += g.attributes.position?.count ?? 0;
        for (const a of Object.values(g.attributes)) geometryBytes += a.array.byteLength;
        geometryBytes += g.index?.array.byteLength ?? 0;
      }
      return { mode: document.querySelector('main.cabane-shell')?.className, visibility: document.visibilityState, pointerLocked: Boolean(document.pointerLockElement),
        frameloop: s.frameloop, canvas: [s.gl.domElement.width, s.gl.domElement.height], cssCanvas: [s.size.width, s.size.height],
        dpr: s.gl.getPixelRatio(), camera: { type: s.camera.type, position: s.camera.position.toArray(), rotation: s.camera.rotation.toArray() },
        objects, meshes, geometries: geometries.size, materials: materials.size, vertices, geometryBytes, lights, subscribers,
        gpuTimerAvailable: window.audit.extension, rendererMemory: s.gl.info.memory, programs: s.gl.info.programs.length,
        shadowAutoUpdate: s.gl.shadowMap.autoUpdate, heap: performance.memory?.usedJSHeapSize };
    };
  }, gpuTiming);
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
  const processes = async () => (await system.send('SystemInfo.getProcessInfo')).processInfo;
  const sample = async (name, duration = seconds, action = null) => {
    console.log(`Measuring ${name} (${duration}s)`);
    const before = await metrics(), procBefore = await processes();
    const beforeScene = await page.evaluate(() => { window.audit.frames = []; window.audit.longTasks = []; window.audit.active = true; return window.auditSnapshot(); });
    const start = performance.now();
    const systemGpu = [];
    const gpuPoll = setInterval(() => {
      try {
        const line = execFileSync('ioreg',['-r','-c','AGXAccelerator','-d','1'],{encoding:'utf8'}).split('\n').find(l=>l.includes('"PerformanceStatistics"'));
        systemGpu.push({t:Date.now(),utilization:Number(line?.match(/"Device Utilization %"=(\d+)/)?.[1])});
      } catch { /* macOS-only, optional diagnostic */ }
    },1000);
    let actionResult;
    if (action) actionResult = await action(duration);
    else await page.waitForTimeout(duration * 1000);
    clearInterval(gpuPoll);
    const elapsed = (performance.now() - start) / 1000;
    const after = await metrics(), procAfter = await processes();
    const data = await page.evaluate(() => { window.audit.active = false; return { frames: window.audit.frames.map(({ query, ...f }) => f), longTasks: window.audit.longTasks, scene: window.auditSnapshot() }; });
    const sorted = values => [...values].sort((a,b) => a-b);
    const stats = values => { if (!values.length) return null; const v = sorted(values); return { mean: values.reduce((a,b)=>a+b,0)/values.length, p50:v[Math.floor(v.length*.5)], p95:v[Math.min(v.length-1,Math.floor(v.length*.95))], p99:v[Math.min(v.length-1,Math.floor(v.length*.99))], max:v.at(-1) }; };
    const gaps = data.frames.slice(1).map((f,i) => f.t-data.frames[i].t);
    const result = { name, elapsed, renderedFrames: data.frames.length, renderFps: data.frames.length/elapsed,
      intervalMs: stats(gaps), frameCpuMs: stats(data.frames.map(f=>f.frameCpuMs)), renderCpuMs: stats(data.frames.map(f=>f.renderCpuMs)),
      gpuMs: stats(data.frames.flatMap(f=>f.gpuMs == null ? [] : [f.gpuMs])), calls: stats(data.frames.map(f=>f.calls)), triangles: stats(data.frames.map(f=>f.triangles)),
      over25Ms: gaps.filter(t=>t>25).length, longTasks: data.longTasks, beforeScene, scene: data.scene,
      pageMainThreadBusyPercent: (after.TaskDuration-before.TaskDuration)/elapsed*100,
      pageScriptBusyPercent: (after.ScriptDuration-before.ScriptDuration)/elapsed*100,
      heapBytes: after.JSHeapUsedSize, systemGpu, actionResult,
      processes: procAfter.map(p => ({ type:p.type, id:p.id, cpuPercent: (p.cpuTime-(procBefore.find(q=>q.id===p.id)?.cpuTime ?? p.cpuTime))/elapsed*100 })),
    };
    await writeFile(`${output}/${name}.frames.json`, JSON.stringify(data.frames));
    report.scenarios.push(result); await save();
    console.log(JSON.stringify({name, fps:result.renderFps, p95:result.intervalMs?.p95, busy:result.pageMainThreadBusyPercent, calls:result.calls?.mean, gpu:result.gpuMs?.mean}));
  };
  const orbit = async duration => {
    const box = await page.locator('canvas').boundingBox();
    const x = box.x + box.width*.55, y = box.y + box.height*.55;
    await page.mouse.move(x, y); await page.mouse.down({button:'right'});
    const start = performance.now();
    while (performance.now()-start < duration*1000) {
      const t = (performance.now()-start)/1000;
      await page.mouse.move(x+Math.sin(t*.8)*220, y+Math.sin(t*.4)*65);
      await page.waitForTimeout(16);
    }
    await page.mouse.up({button:'right'});
  };
  const walk = async duration => {
    // Normal UI entry, then deterministic controller inputs: OS pointer lock is not
    // reliably granted to automation. Explicitly verify that locomotion occurred.
    await page.evaluate(() => {
      let props;
      function visit(f) { if (!f) return; if (f.memoizedProps?.movementInputRef && f.memoizedProps?.poseRef && f.memoizedProps?.lookInputRef) props=f.memoizedProps; visit(f.child); visit(f.sibling); }
      visit(window.auditSceneRoot.current);
      if (!props) throw Error('Walk controller props not found');
      const start=performance.now(); window.auditWalkProps=props;
      window.auditWalkStart=window.auditStore.getState().camera.position.toArray();
      window.auditWalkDistance=0; let previous=window.auditWalkStart;
      window.auditDrive=setInterval(() => {
        const t=(performance.now()-start)/1000;
        props.movementInputRef.current={x:Math.sin(t*.9)*.5,y:Math.cos(t*.7)*.8};
        props.lookInputRef.current={x:.35,y:0};
        const next=window.auditStore.getState().camera.position.toArray();
        window.auditWalkDistance+=Math.hypot(next[0]-previous[0],next[2]-previous[2]); previous=next;
      },16);
    });
    await page.waitForTimeout(duration*1000);
    const distance=await page.evaluate(() => {
      clearInterval(window.auditDrive); window.auditWalkProps.movementInputRef.current={x:0,y:0};window.auditWalkProps.lookInputRef.current={x:0,y:0};return window.auditWalkDistance;
    });
    if(distance<.1) throw Error(`Walk movement benchmark did not move: ${distance}m`);
    report.lastWalkDistanceMeters=distance;
    console.log(`Verified controller movement: ${distance.toFixed(2)}m`);
    return {distanceMeters:distance,inputMethod:'synthetic movement/look refs through normal WalkCameraController'};
  };
  const series = async (name, action) => { for(let i=0;i<repeats;i++) { await page.waitForTimeout(3000); await sample(`${name}-${i+1}`, seconds, action); } };
  await page.screenshot({path:`${output}/orbit-ground.png`});
  if (!walkOnly && !quick) {
  await series('orbit-ground-idle');
  // Diagnostic control: OS accessibility preference stops decorative animation.
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.mouse.move(10,450); await page.waitForTimeout(5000);
  await sample('orbit-reduced-motion-idle',12);
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.waitForTimeout(4000);
  report.invalidation = await page.evaluate(async () => {
    const s = window.auditStore.getState(), original = s.invalidate, stacks = {};
    window.auditStore.setState({ invalidate: (...args) => { const key = new Error().stack; stacks[key] = (stacks[key] ?? 0) + 1; return original(...args); } });
    await new Promise(resolve => setTimeout(resolve,1000));
    window.auditStore.setState({ invalidate: original });
    return stacks;
  });
  await series('orbit-ground-moving',orbit);
  await page.getByRole('button',{name:'First floor',exact:true}).click();
  await page.mouse.move(10,450);
  await series('orbit-upper-moving',orbit);
  await page.keyboard.press('r');
  await series('orbit-roof-moving',orbit);
  await page.keyboard.press('r');
  }
  await page.getByRole('button',{name:'Ground floor',exact:true}).click();
  await page.getByRole('button',{name:'Walk mode',exact:true}).click();
  await page.mouse.move(10,450);
  await page.waitForTimeout(6000);
  await page.screenshot({path:`${output}/walk-ground.png`});
  if (!quick) await series('walk-ground-idle');
  else await sample('walk-ground-idle',5);
  // Single-variable diagnostic controls, restored before normal movement runs.
  if (!quick) {
  await page.evaluate(() => { window.auditStore.getState().gl.shadowMap.autoUpdate = false; });
  await page.waitForTimeout(3000); await sample('diagnostic-walk-frozen-shadows',12);
  await page.evaluate(() => { window.auditStore.getState().gl.shadowMap.autoUpdate = true; window.auditStore.getState().setDpr(1); });
  await page.waitForTimeout(3000); await sample('diagnostic-walk-dpr1',12);
  await page.evaluate((dpr) => window.auditStore.getState().setDpr(dpr),dpr);
  await page.waitForTimeout(3000);
  }
  await series('walk-ground-controller-moving',walk);
  await page.getByRole('button',{name:'First floor',exact:true}).click();
  await page.mouse.move(10,450);
  if (!quick) await series('walk-upper-idle');
  await series('walk-upper-controller-moving',walk);
  await page.getByRole('button',{name:'Use night lighting',exact:true}).click();
  await page.mouse.move(10,450);
  if (!quick) await series('walk-night-idle');
  else { await page.waitForTimeout(2000); await sample('walk-night-idle',5); }
  const { windowId } = await cdp.send('Browser.getWindowForTarget');
  // Playwright enables focus emulation by default, which forces document visibility.
  await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: false });
  await cdp.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'minimized' } });
  await page.waitForTimeout(3000);
  await sample('walk-window-minimized',quick ? 5 : 15);
  report.hiddenLifecycleVerified = report.scenarios.at(-1).scene.visibility === 'hidden'
    && report.scenarios.at(-1).scene.frameloop === 'never'
    && report.scenarios.at(-1).renderedFrames === 0;
  if (!report.hiddenLifecycleVerified) console.warn('Hidden lifecycle not verified: see visibility, frameloop and renderedFrames in results.');
  await cdp.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'normal' } });
  await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await page.bringToFront();
  await page.getByRole('button',{name:'Exit walk mode',exact:true}).click();
  await page.mouse.move(10,450); await page.waitForTimeout(6000);
  await sample('orbit-after-walk-idle',quick ? 5 : 15);
  // Sampling profiler is separate from timing runs to keep overhead out of benchmark medians.
  await page.getByRole('button',{name:'Walk mode',exact:true}).click(); await page.waitForTimeout(4000);
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.start'); await page.waitForTimeout(quick ? 3000 : 10000);
  const {profile} = await cdp.send('Profiler.stop'); await writeFile(`${output}/walk.cpuprofile`, JSON.stringify(profile));
  report.finished = new Date().toISOString();
  report.thermal = execFileSync('pmset',['-g','therm'],{encoding:'utf8'});
  await save();
} finally { await save(); await browser.close(); }
