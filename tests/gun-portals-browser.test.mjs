import assert from 'node:assert/strict';
import test from 'node:test';
import { createBrowserTestSession, getBrowserTestServer } from './browser-test-environment.mjs';

const fixture = `<!doctype html><html><head><title>Portal walk fixture</title></head><body><div id="root"></div><script type="module">
import React from 'react';
import { createRoot } from 'react-dom/client';
import { useFrame, useThree } from '@react-three/fiber';
import { CabaneDashboard, HomeAssistantRuntimeProvider } from '@cabane/engine';
import { stableArchitectureModelRegistry } from '@cabane/catalog/architecture';
import { laserWalkTool } from '@cabane/walk-laser';
import { neutralDemoManifest } from '/@fs/${process.cwd()}/packages/engine/src/demo.ts';
import '@cabane/engine/styles.css';
const manifest = structuredClone(neutralDemoManifest);
manifest.floors[0].openings = [];
manifest.home.walkStart = {floorId: manifest.floors[0].id, at: [2.4, 1.8]};
manifest.actionBar = {items: [{id:'walk',target:{kind:'built-in',action:'walk'}},{id:'gun',target:{kind:'walk-tool',toolId:laserWalkTool.id}}]};
function ObservedGun(props) {
 const {scene,camera} = useThree();
 // Read-only instrumentation; all actions still use the ordinary dashboard inputs.
 useFrame(() => { const portals=[]; scene.traverse(object => {if(object.name.startsWith('gun-portal-')) portals.push({name:object.name,position:object.position.toArray(),scale:object.children[0].scale.x});
  if(object.name==='laser-electric-arc' && object.visible) { window.zapColors ??= []; const color=object.material.emissive.getHexString(); if(!window.zapColors.includes(color)) window.zapColors.push(color); } });
  window.portalObservation = {portals,position:camera.position.toArray(),yaw:camera.rotation.y,fov:camera.fov};
  const veil=document.querySelector('.walk-portal-transit');
  if(veil) {window.transitSamples ??= []; window.transitSamples.push({opacity:Number(veil.style.opacity),fov:camera.fov,z:camera.position.z});}
 });
 return React.createElement(laserWalkTool.Scene,props);
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
