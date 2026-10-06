import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = fileURLToPath(new URL("../", import.meta.url));
const bundle = resolve(root, "apps/web/dist-panel");
const mime = { ".js":"text/javascript", ".css":"text/css", ".png":"image/png", ".json":"application/json", ".woff2":"font/woff2" };
const server = createServer(async (req,res) => {
  try {
    const path = new URL(req.url, "http://fixture").pathname;
    if(path === "/cabane" || path === "/") { res.setHeader("Content-Type","text/html"); res.end(await readFile(resolve(root,"tests/fixtures/native-panel-host.html"))); return; }
    if(!path.startsWith("/fixture-assets/deep/revision/")) {res.writeHead(404).end();return;}
    const file = resolve(bundle, path.slice("/fixture-assets/deep/revision/".length));
    if(!file.startsWith(bundle+sep)) {res.writeHead(403).end();return;}
    res.setHeader("Content-Type",mime[extname(file)]??"application/octet-stream");res.end(await readFile(file));
  } catch {res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH??"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:true,args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const context=await browser.newContext({viewport:{width:1280,height:900}});
const page=await context.newPage();
const errors=[], requests=[];
page.on("pageerror",error=>errors.push(error.stack ?? error.message));
page.on("request",request=>requests.push(request.url()));
page.on("response",response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
try {
  await page.goto(`${origin}/cabane?host=kept`);
  await page.getByRole("button",{name:"Build my home"}).waitFor({timeout:60000});
  assert.equal(await page.evaluate(()=>window.__hostFixture.stats.requests.length),0,"demo must not read host registries");
  await page.getByRole("button",{name:"Open Home Assistant menu"}).click();
  assert.equal(await page.evaluate(()=>window.__hostFixture.stats.menus),1);
  await page.getByRole("button",{name:"Build my home"}).click();
  await page.getByRole("button",{name:/Workspaces:/}).waitFor({timeout:60000});
  await page.getByRole("button",{name:/Workspaces:/}).click();
  await page.getByRole("heading",{name:"Your workspaces"}).waitFor();
  await page.getByRole("button",{name:"Import",exact:true}).click();
  await page.getByRole("button",{name:"From Home Assistant",exact:true}).click();
  await page.getByText("No Cabane workspaces saved on this HA instance.").waitFor();
  assert.equal(await page.getByRole("button",{name:"Sign in to Home Assistant"}).count(),0);
  await page.getByRole("button",{name:"Cancel",exact:true}).click();
  assert.equal(page.url(),`${origin}/cabane?host=kept`);
  await page.getByRole("button",{name:"New workspace",exact:true}).click();
  await page.getByLabel("Workspace name").fill("Native fixture home");
  await page.getByRole("button",{name:"Create workspace",exact:true}).click();
  await page.getByRole("button",{name:/Workspaces: Native fixture home/}).waitFor();
  await page.getByRole("button",{name:/Workspaces: Native fixture home/}).click();
  const card=page.locator('.workspace-card').filter({has:page.getByRole('button',{name:'Open Native fixture home',exact:true})});
  await card.locator('summary').click();
  await card.getByRole('button',{name:'Home Assistant',exact:true}).click();
  await page.getByRole('button',{name:'Use this Home Assistant',exact:true}).click();
  await page.getByText('Connected',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Enable HA storage',exact:true}).click();
  await page.getByRole('button',{name:'Save',exact:true}).click();
  await page.getByText('Workspace saved on Home Assistant.').waitFor();
  const before=await page.evaluate(()=>window.__hostFixture.stats.activeRegistrySubscriptions);
  await page.evaluate(()=>{for(let i=0;i<10;i++)window.__hostFixture.repeat();});
  assert.equal(await page.evaluate(()=>window.__hostFixture.stats.activeRegistrySubscriptions),before);
  await page.evaluate(()=>window.__hostFixture.disconnect());
  await page.getByText('Connecting…',{exact:true}).waitFor();
  await page.evaluate(()=>window.__hostFixture.reconnect());
  await page.getByText('Connected',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Disconnect workspace',exact:true}).click();
  await page.getByRole('button',{name:'Use this Home Assistant',exact:true}).waitFor();
  for (let remount = 0; remount < Number(process.env.CABANE_PANEL_REMOUNTS ?? 3); remount++) {
    await page.evaluate(()=>window.__hostFixture.away());
    assert.equal(await page.evaluate(()=>window.__hostFixture.stats.activeRegistrySubscriptions),0);
    await page.evaluate(()=>window.__hostFixture.back());
    await page.getByRole('button',{name:/Workspaces: Native fixture home/}).waitFor({timeout:30000});
    // Let the canvas commit and its effects attach before the next disconnect.
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  }
  assert.equal(page.url(),`${origin}/cabane?host=kept`);
  assert.equal(await page.evaluate(()=>window.__hostFixture.stats.close),0);
  assert.equal(await page.evaluate(()=>window.__hostFixture.stats.popup),0);
  assert.equal(await page.evaluate(()=>window.__hostFixture.stats.authAccess),0);
  assert.equal(await page.evaluate(()=>getComputedStyle(document.body).position),'static');
  assert.equal(requests.some(url=>!url.startsWith(origin)),false,`unexpected external requests: ${requests.filter(url=>!url.startsWith(origin))}`);
  assert.equal(requests.some(url=>url.includes('/_vercel/')),false);
  assert.ok(requests.some(url=>url.endsWith('cabane-fonts.css')));
  assert.ok(requests.some(url=>url.includes('/assets/HomeEditor-')),'lazy editor chunk must load at the nested asset URL');
  assert.deepEqual(errors,[]);
  await mkdir(resolve(root,'screenshots/native-panel'),{recursive:true});
  await page.screenshot({path:resolve(root,'screenshots/native-panel/desktop.png')});
  await page.setViewportSize({width:950,height:900});
  assert.equal(await page.locator("cabane-panel").evaluate(element => element.getBoundingClientRect().width),750);
  assert.equal(await page.locator(".build-tutorial").evaluate(element => getComputedStyle(element).position),"static", "750px panel must use narrow layout inside a 950px host");
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:resolve(root,'screenshots/native-panel/mobile.png')});
  console.log('Native panel browser fixture passed: demo isolation, host menu, editor, memory routing, HA import, storage save, reconnect, detach/remount, local assets, no OAuth/host close.');
} catch(error) {
  console.error('Page errors:',errors);
  console.error('Visible controls:',await page.getByRole('button').allTextContents());
  await mkdir(resolve(root,'screenshots/native-panel'),{recursive:true});
  await page.screenshot({path:resolve(root,'screenshots/native-panel/failure.png')});
  throw error;
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
