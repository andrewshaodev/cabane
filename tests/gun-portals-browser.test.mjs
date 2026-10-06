import assert from 'node:assert/strict';
import test from 'node:test';
import { createBrowserTestSession, getBrowserTestServer } from './browser-test-environment.mjs';

const fixture = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Portal walk fixture</title></head><body><div id="root"></div><script type="module">
import React from 'react';
import { createRoot } from 'react-dom/client';
import { useFrame, useThree } from '@react-three/fiber';
import { DataUtils } from 'three';
import { CabaneDashboard, HomeAssistantRuntimeProvider, ToonMaterial } from '@cabane/engine';
import { stableArchitectureModelRegistry } from '@cabane/catalog/architecture';
import { laserWalkTool } from '@cabane/walk-laser';
import { neutralDemoManifest } from '/@fs/${process.cwd()}/packages/engine/src/demo.ts';
import '@cabane/engine/styles.css';
const manifest = structuredClone(neutralDemoManifest);
manifest.floors[0].openings = [];
manifest.home.walkStart = {floorId: manifest.floors[0].id, at: [2.4, 1.8]};
manifest.actionBar = {items: [{id:'walk',target:{kind:'built-in',action:'walk'}},{id:'gun',target:{kind:'walk-tool',toolId:laserWalkTool.id}}]};
function ObservedGun(props) {
 const {scene,camera,gl} = useThree();
 React.useEffect(() => {
  const previous = scene.onAfterRender;
  scene.onAfterRender = function(...args) {
   previous.apply(this,args);
   const target=gl.getRenderTarget();
   if (!window.inspectPortalCapture || target?.texture.name!=='portal-destination-view') return;
   window.inspectPortalCapture=false;
   const pixels=new Uint16Array(target.width*target.height*4);
   gl.readRenderTargetPixels(target,0,0,target.width,target.height,pixels);
   let cyan=0,magenta=0,magentaX=0;
   for(let i=0;i<pixels.length;i+=4) {
    const r=DataUtils.fromHalfFloat(pixels[i]),g=DataUtils.fromHalfFloat(pixels[i+1]),b=DataUtils.fromHalfFloat(pixels[i+2]);
    if(g>r*1.5 && b>r*1.5 && b>.3) cyan++;
    if(r>.3 && b>.3 && g<r*.25 && g<b*.25) {magenta++;magentaX+=(i/4)%target.width;}
   }
   window.portalCapture={cyan,magenta,magentaX:magentaX/Math.max(1,magenta),width:target.width,height:target.height};
  };
  return () => {scene.onAfterRender=previous;};
 },[scene,gl]);
 // Read-only instrumentation; all actions still use the ordinary dashboard inputs.
 useFrame(() => { const portals=[]; scene.traverse(object => {if(object.name.startsWith('gun-portal-')) portals.push({name:object.name,position:object.position.toArray(),normal:object.userData.portalAnchor.normal.toArray(),scale:object.children[0].scale.x});
  if(object.name==='laser-electric-arc' && object.visible) { window.zapColors ??= []; const color=object.material.emissive.getHexString(); if(!window.zapColors.includes(color)) window.zapColors.push(color); } });
  window.portalObservation = {portals,position:camera.position.toArray(),yaw:camera.rotation.y,pitch:camera.rotation.x,fov:camera.fov};
  const veil=document.querySelector('.walk-portal-transit');
  if(veil) {window.transitSamples ??= []; window.transitSamples.push({opacity:Number(veil.style.opacity),fov:camera.fov,z:camera.position.z});}
 });
 return React.createElement(React.Fragment,null,React.createElement(laserWalkTool.Scene,props),
  // A distinctive scene object behind the walker is visible through the gold
  // portal. It does not participate in the placement/collision fixture.
  React.createElement('mesh',{position:[2.4,1.4,2.7],raycast:()=>undefined,userData:{walkToolVisual:true}},
   React.createElement('sphereGeometry',{args:[.22,16,12]}),
   React.createElement(ToonMaterial,{color:'#ff00ff',emissive:'#ff00ff',emissiveIntensity:1})));
}
createRoot(document.getElementById('root')).render(React.createElement(HomeAssistantRuntimeProvider,null,
 React.createElement(CabaneDashboard,{manifest,architectureModels:stableArchitectureModelRegistry,walkTools:[{...laserWalkTool,Scene:ObservedGun}]})));
</script></body></html>`;

for (const reducedMotion of ['no-preference','reduce']) test(`Chrome paired portal travel and transition (${reducedMotion})`, async () => {
  const {server} = await getBrowserTestServer('app');
  const browser = await createBrowserTestSession();
  const page = await browser.newPage({viewport:{width:1280,height:800},reducedMotion});
  page.setDefaultTimeout(12000);
  const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  try {
    await page.route('**/portal-fixture',async route => route.fulfill({contentType:'text/html',body:await server.transformIndexHtml('/portal-fixture',fixture)}));
    await page.goto(server.resolvedUrls.local[0]+'portal-fixture');
    await page.getByRole('button',{name:'Walk mode',exact:true}).click();
    await page.keyboard.press('g');
    await page.waitForFunction(()=>window.portalObservation);
    await page.waitForFunction(()=>document.pointerLockElement);
    await page.locator('[data-action=portal][data-next-portal=blue]').waitFor();
    assert.equal(await page.locator('.walk-laser-crosshair').innerText(),'');
    await page.evaluate(() => window.dispatchEvent(new MouseEvent('mousemove', {movementX:(window.portalObservation.yaw-Math.PI)/.0024})));
    await page.waitForFunction(()=>Math.abs(window.portalObservation.yaw-Math.PI)<.001);
    await page.mouse.down({button:'right'}); await page.mouse.up({button:'right'});
    await page.waitForFunction(()=>window.portalObservation.portals.length===1);
    assert.equal((await page.evaluate(()=>window.portalObservation.portals[0].name)),'gun-portal-blue');
    await page.locator('[data-action=portal][data-next-portal=gold]').waitFor();
    // Turn 180 degrees using the same relative mouse input as desktop gameplay.
    await page.evaluate(() => window.dispatchEvent(new MouseEvent('mousemove', {movementX:Math.PI/.0024})));
    await page.waitForFunction(()=>Math.abs(Math.sin(window.portalObservation.yaw))<.02 && Math.cos(window.portalObservation.yaw)>.99);
    await page.mouse.down({button:'right'}); await page.mouse.up({button:'right'});
    await page.waitForFunction(()=>window.portalObservation.portals.length===2);
    await page.locator('[data-action=portal][data-next-portal=blue]').waitFor();
    if(reducedMotion==='no-preference') {
      await page.waitForFunction(()=>window.zapColors?.includes('efa632'));
      assert.deepEqual(await page.evaluate(()=>window.zapColors),['42cfff','efa632']);
    }
    await page.waitForFunction(()=>window.portalObservation.portals.every(portal=>portal.scale===1));
    // The blue exit rim must not be drawn over the gold entry's live image.
    // Sample during a strafe, where the overlapping rims are most apparent.
    await page.evaluate(()=>{window.inspectPortalCapture=true;window.portalCapture=null;});
    await page.waitForFunction(()=>window.portalCapture);
    const capture=await page.evaluate(()=>window.portalCapture);
    assert.equal(capture.cyan,0,'destination rim must not overlap the live portal view during movement');
    assert.ok(capture.magenta>10,'the destination room object is visible through the supporting wall');
    assert.ok(capture.width<=1024 && capture.height<=1024);
    const startX=await page.evaluate(()=>window.portalObservation.position[0]);
    await page.keyboard.down('d');
    await page.waitForFunction(x=>window.portalObservation.position[0]>x+.15,startX);
    await page.evaluate(()=>{window.inspectPortalCapture=true;window.portalCapture=null;});
    await page.waitForFunction(()=>window.portalCapture);
    await page.keyboard.up('d');
    const moved=await page.evaluate(()=>window.portalCapture);
    assert.equal(moved.cyan,0,'moving does not reveal clipped fragments of the exit rim');
    assert.ok(moved.magenta>10 && Math.abs(moved.magentaX-capture.magentaX)>2,'the live scene tracks lateral movement');
    await page.keyboard.down('a');
    await page.waitForFunction(x=>window.portalObservation.position[0]<=x,startX);
    await page.keyboard.up('a');
    await page.screenshot({path:'/tmp/cabane-portals-chrome.png'});
    await page.keyboard.down('w');
    await page.waitForFunction(()=>window.portalObservation.position[2]>2.5 && Math.cos(window.portalObservation.yaw)>.99,{},{timeout:5000});
    await page.keyboard.up('w');
    await page.screenshot({path:`/tmp/cabane-portal-transit-${reducedMotion}.png`});
    await page.waitForFunction(()=>window.portalObservation.fov===68 && document.querySelector('.walk-portal-transit')?.style.visibility==='hidden');
    const transit=await page.evaluate(()=>window.transitSamples);
    if(reducedMotion==='no-preference') {
      assert.ok(transit.some(sample=>sample.opacity===1),'transition covers the spatial cut');
      assert.ok(transit.some(sample=>sample.fov>68 && sample.fov<=71),'bounded lens easing');
    } else {
      assert.ok(transit.every(sample=>sample.fov===68),'reduced motion leaves the camera lens still');
      assert.ok(transit.some(sample=>sample.opacity>0) && transit.every(sample=>sample.opacity<=.18),'gentle reduced-motion feedback');
    }
    await page.screenshot({path:'/tmp/cabane-portal-emergence.png'});
    assert.equal(errors.length,0,errors.join('\n'));
    // Stowing removes both surfaces, then equipping starts with an empty pair.
    await page.keyboard.press('g'); await page.keyboard.press('g');
    await page.waitForFunction(()=>window.portalObservation.portals.length===0);
  } catch (error) {
    await page.screenshot({path:"/tmp/cabane-portals-failure.png"});
    console.error(errors, await page.evaluate(()=>window.portalObservation), await page.locator("body").innerText()); throw error;
  } finally {await browser.close();}
});

for(const viewport of [{width:667,height:375},{width:844,height:390}]) test(`mobile touch actions and portal travel without pointer lock (${viewport.width}x${viewport.height})`,async()=>{
  const {server}=await getBrowserTestServer('app');
  const browser=await createBrowserTestSession();
  const page=await browser.newPage({viewport,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  // Raw CDP gestures can reset Chrome's pointer media emulation. Keep the
  // phone capability stable while exercising real touch events and controls.
  await page.addInitScript(()=>{
    const match=window.matchMedia.bind(window);
    window.matchMedia=query=>{const result=match(query);if(query==='(any-pointer: coarse)') Object.defineProperty(result,'matches',{value:true});return result;};
    Object.defineProperty(navigator,'maxTouchPoints',{value:5});
  });
  const cdp=await page.context().newCDPSession(page);
  const touch=async(type,x,y)=>{await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});return cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:1}]});};
  try {
    await page.route('**/portal-touch-fixture',async route=>route.fulfill({contentType:'text/html',body:await server.transformIndexHtml('/portal-touch-fixture',fixture)}));
    await page.goto(server.resolvedUrls.local[0]+'portal-touch-fixture');
    await page.getByRole('button',{name:'Walk mode',exact:true}).tap();
    await page.getByRole('button',{name:'Equip Laser',exact:true}).tap();
    await page.getByRole('button',{name:'Fire zap',exact:true}).tap();
    await page.waitForFunction(()=>window.zapColors?.includes('51e8f3') || window.zapColors?.length>0);
    assert.equal(await page.evaluate(()=>Boolean(document.pointerLockElement)),false);
    await page.getByRole('button',{name:'Create blue portal'}).tap();
    await page.waitForFunction(()=>window.portalObservation.portals.length===1);
    // Turn around with the actual touch-look joystick.
    await touch('touchStart',viewport.width*.75,viewport.height-60);await touch('touchMove',viewport.width*.75+32,viewport.height-60);
    await page.waitForFunction(()=>window.portalObservation.yaw<.1);
    await touch('touchEnd');
    await page.waitForTimeout(200);
    await page.getByRole('button',{name:'Create gold portal'}).tap();
    await page.waitForFunction(()=>window.portalObservation.portals.length===2);
    await page.getByRole('button',{name:'Create blue portal'}).waitFor();
    // Walk into the north portal using the touch-movement joystick.
    await touch('touchStart',90,viewport.height-60);await touch('touchMove',90,viewport.height-92);
    await page.waitForFunction(()=>window.portalObservation.position[2]>2.5,{},{timeout:5000});
    await touch('touchEnd');
    await page.waitForFunction(()=>document.querySelector('.walk-portal-transit')?.style.visibility==='hidden');
    {
      for(const label of ['Fire zap','Create blue portal']) {
        const button=page.getByRole('button',{name:label,exact:true});
        const bounds=await button.boundingBox();
        assert.ok(bounds.x>viewport.width/2 && bounds.x+bounds.width<=viewport.width && bounds.y>=0 && bounds.y+bounds.height<=viewport.height);
        assert.equal(await button.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),true,'touch controls are not covered by look joystick');
      }
    }
    assert.deepEqual(errors,[]);
  } catch(error) {
    console.error(JSON.stringify(await page.evaluate(()=>window.portalObservation)),errors);
    await page.screenshot({path:'/tmp/cabane-mobile-gun.png'});throw error;
  } finally {await browser.close();}
});

test('Chrome portal placement on indoor floors, outdoor ground and exterior walls',async()=>{
  const {server}=await getBrowserTestServer('app');
  const browser=await createBrowserTestSession();
  const page=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});
  page.setDefaultTimeout(12000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  // Start near the north wall, with a wide door centered on the south wall.
  const outdoorFixture=fixture.replace('manifest.floors[0].openings = [];',
    `manifest.floors[0].openings = [{...manifest.floors[0].openings[0],offsetFromWallStartPlanUnits:1.65,widthPlanUnits:1.5}];`)
    .replace('at: [2.4, 1.8]','at: [2.4, .65]');
  const aim=async(yaw,pitch)=>{
    await page.evaluate(({yaw,pitch})=>window.dispatchEvent(new MouseEvent('mousemove',{
      movementX:(window.portalObservation.yaw-yaw)/.0024,movementY:(window.portalObservation.pitch-pitch)/.002,
    })),{yaw,pitch});
    await page.waitForFunction(({yaw,pitch})=>Math.abs(window.portalObservation.yaw-yaw)<.005 && Math.abs(window.portalObservation.pitch-pitch)<.005,{yaw,pitch});
  };
  const shoot=async()=>{await page.mouse.down({button:'right'});await page.mouse.up({button:'right'});};
  try {
    await page.route('**/portal-outdoor-fixture',async route=>route.fulfill({contentType:'text/html',body:await server.transformIndexHtml('/portal-outdoor-fixture',outdoorFixture)}));
    await page.goto(server.resolvedUrls.local[0]+'portal-outdoor-fixture');
    await page.getByRole('button',{name:'Walk mode',exact:true}).click();await page.keyboard.press('g');
    await page.waitForFunction(()=>window.portalObservation && document.pointerLockElement);
    await aim(Math.PI,-.9);await shoot();
    await page.waitForFunction(()=>window.portalObservation.portals.length===1);
    assert.ok((await page.evaluate(()=>window.portalObservation.portals[0].normal[1]))>.98,'indoor floor portal');
    await aim(Math.PI,0);
    await page.keyboard.down('w');
    await page.waitForFunction(()=>window.portalObservation.position[2]>4.6);
    await page.keyboard.up('w');
    await aim(Math.PI,-.9);await shoot();
    await page.waitForFunction(()=>window.portalObservation.portals.length===2);
    const floor=await page.evaluate(()=>window.portalObservation.portals.find(p=>p.name==='gun-portal-gold'));
    assert.ok(floor.normal[1]>.98 && floor.position[2]>5,'outdoor ground portal');
    // Look at solid exterior wall to the side of the passage.
    await aim(1,0);await shoot();
    await page.waitForFunction(()=>window.portalObservation.portals.some(p=>p.name==='gun-portal-blue' && Math.abs(p.normal[1])<.05));
    const wall=await page.evaluate(()=>window.portalObservation.portals.find(p=>p.name==='gun-portal-blue'));
    assert.ok(wall.normal[2]>.98 && wall.position[2]>3.6,'exterior wall portal faces the terrain');
    await page.screenshot({path:'/tmp/cabane-portals-outdoors.png'});
    assert.deepEqual(errors,[]);
  } catch(error) {
    console.error(errors,await page.evaluate(()=>window.portalObservation),await page.locator('body').innerText());
    await page.screenshot({path:'/tmp/cabane-portals-outdoor-failure.png'});throw error;
  } finally {await browser.close();}
});

// The real host adapter and IndexedDB repository; scene actions remain normal UI input.
const persistedFixture = fixture.replace("import React from 'react';", `import React from 'react';
import { WalkToolStorageProvider, createHomeProjectRepository, createIndexedDbProjectRecordStore, createEmptyHomeProject } from '@cabane/engine';
import { useWorkspaceToolStorage } from '/@fs/${process.cwd()}/apps/web/src/workspaces/useWorkspaceToolStorage.ts';
const repository = createHomeProjectRepository(createIndexedDbProjectRecordStore(indexedDB), {furnishingModels:{},deviceModels:{}});
window.readSavedPortals = async () => (await repository.load('portal-test')).published.toolState?.['cabane.laser'];
const initial = (await repository.loadOrCreate(createEmptyHomeProject('portal-test','Portal test'),0)).record;
function PersistentHome({children}) {
 const [record,setRecord] = React.useState(initial);
 const {storage}=useWorkspaceToolStorage(record,setRecord,message=>{window.storageError=message;});
 return React.createElement(WalkToolStorageProvider,{storage},children);
}
`).replace("React.createElement(HomeAssistantRuntimeProvider,null,", "React.createElement(PersistentHome,null,React.createElement(HomeAssistantRuntimeProvider,null,")
.replace("Scene:ObservedGun}]})));", "Scene:ObservedGun}]}))));");

for (const reducedMotion of ['no-preference','reduce']) test(`Chrome saved portals reload and either shot closes them (${reducedMotion})`, async () => {
 const {server}=await getBrowserTestServer('app');
 const browser=await createBrowserTestSession();
 const page=await browser.newPage({viewport:{width:1280,height:800},reducedMotion});
 page.setDefaultTimeout(12000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const equip=async()=>{
  await page.locator('canvas').first().waitFor();
  const walk=page.getByRole('button',{name:'Walk mode',exact:true});
  if(await walk.count()) await walk.click();
  else await page.locator('canvas').first().click();
  await page.keyboard.press('g');
  await page.waitForFunction(()=>window.portalObservation && document.pointerLockElement);
 };
 const turn=async yaw=>{
  await page.evaluate(yaw=>window.dispatchEvent(new MouseEvent('mousemove',{movementX:(window.portalObservation.yaw-yaw)/.0024})),yaw);
  await page.waitForFunction(yaw=>Math.abs(window.portalObservation.yaw-yaw)<.01,yaw);
 };
 const shoot=async button=>{await page.mouse.down({button});await page.mouse.up({button});};
 const saved=()=>page.evaluate(()=>window.readSavedPortals());
 try {
  await page.route('**/portal-fixture',async route=>route.fulfill({contentType:'text/html',body:await server.transformIndexHtml('/portal-fixture',persistedFixture)}));
  await page.goto(server.resolvedUrls.local[0]+'portal-fixture');await equip();
  await turn(Math.PI);await shoot('right');
  await page.waitForFunction(()=>window.portalObservation.portals.length===1);
  await page.locator('[data-action=portal][data-next-portal=gold]').waitFor();
  // Let the revision-checked home write settle before another action or reload.
  await page.waitForTimeout(150);
  await turn(0);await shoot('right');
  await page.waitForFunction(()=>window.portalObservation.portals.length===2 && window.portalObservation.portals.every(p=>p.scale===1));
  const before=await saved();assert.ok(before.pair.blue && before.pair.gold);
  await page.keyboard.press('g');
  await page.waitForFunction(()=>!document.querySelector('.walk-laser'));
  await page.keyboard.press('g');
  await page.waitForFunction(()=>window.portalObservation.portals.length===2);
  await page.reload();await equip();
  await page.waitForFunction(()=>window.portalObservation.portals.length===2 && window.portalObservation.portals.every(p=>p.scale===1));
  assert.deepEqual(await saved(),before);
  await turn(0);await shoot('left');
  if(reducedMotion==='no-preference') {
   await page.waitForFunction(()=>window.portalObservation.portals.some(p=>p.name==='gun-portal-closing-gold' && p.scale>0 && p.scale<.9));
   await page.screenshot({path:'/tmp/cabane-portal-closing.png'});
  }
  await page.waitForFunction(()=>window.portalObservation.portals.length===1 && window.portalObservation.portals[0].name==='gun-portal-blue');
  assert.equal((await saved()).pair.gold,undefined);
  await turn(Math.PI);await shoot('right');
  await page.waitForFunction(()=>window.portalObservation.portals.length===0);
  assert.deepEqual((await saved()).pair,{});
  await page.reload();await equip();await page.waitForTimeout(250);
  assert.equal(await page.evaluate(()=>window.portalObservation.portals.length),0);
  assert.equal(await page.evaluate(()=>window.storageError),undefined);
  assert.deepEqual(errors,[]);
 } catch(error) {console.error(errors,await page.locator('body').innerText());throw error;} finally {await browser.close();}
});


test('Chrome default shortcuts include the installed Laser without configuration', async () => {
 const {server}=await getBrowserTestServer('app');
 const browser=await createBrowserTestSession();
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 try {
  const defaults=fixture.replace(/manifest.actionBar = .*?;\n/, 'delete manifest.actionBar;\n');
  await page.route('**/portal-fixture',async route=>route.fulfill({contentType:'text/html',body:await server.transformIndexHtml('/portal-fixture',defaults)}));
  await page.goto(server.resolvedUrls.local[0]+'portal-fixture');
  await page.getByRole('button',{name:'Walk mode',exact:true}).click();
  await page.keyboard.press('g');
  await page.waitForFunction(()=>window.portalObservation && document.querySelector('.walk-laser'));
  assert.equal(await page.getByRole('button',{name:'Unequip Laser',exact:true}).count(),1);
 } finally {await browser.close();}
});
