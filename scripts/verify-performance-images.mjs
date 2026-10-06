import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
const output=process.env.BENCH_OUTPUT??'/tmp/cabane-perf-images';await mkdir(output,{recursive:true});
const reference=new Map(),results=[];
for(const [build,port]of [['baseline',4198],['candidate',4199]]){
  const browser=await chromium.launch({channel:'chrome',headless:false});
  try{
    const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:2});
    await context.addInitScript(()=>{window.roots=new Set();window.__REACT_DEVTOOLS_GLOBAL_HOOK__={supportsFiber:true,inject:()=>1,onCommitFiberRoot:(_,r)=>window.roots.add(r),onCommitFiberUnmount(){}};});
    const page=await context.newPage();await page.goto(`http://127.0.0.1:${port}`);await page.getByRole('button',{name:/Explore the demo/}).click();await page.waitForTimeout(3500);
    await page.evaluate(()=>{const visit=f=>{if(!f)return;if(f.stateNode?.object?.__r3f?.root)window.store=f.stateNode.object.__r3f.root;visit(f.child);visit(f.sibling);};window.roots.forEach(r=>visit(r.current));});
    let walk=false,floor='ground',night=false,roof=false;
    for(const scenario of ['orbit-ground','orbit-upper','orbit-roof','walk-ground','walk-upper','walk-night']){
      console.log(`${build}: ${scenario}`);
      const nw=scenario.startsWith('walk'),nf=(scenario.includes('upper')||scenario.includes('night'))?'upper':'ground',nn=scenario.includes('night'),nr=scenario.includes('roof');
      await page.evaluate(()=>{const s=window.store.getState();s.setFrameloop('always');s.invalidate();});
      if(roof!==nr){await page.keyboard.press('r');roof=nr;}
      if(walk!==nw){await page.getByRole('button',{name:nw?'Walk mode':'Exit walk mode',exact:true}).click();walk=nw;}
      if(floor!==nf){await page.getByRole('button',{name:nf==='upper'?'First floor':'Ground floor',exact:true}).click();floor=nf;}
      if(night!==nn){await page.getByRole('button',{name:nn?'Use night lighting':'Use daylight',exact:true}).click();night=nn;}
      await page.mouse.move(10,450);await page.waitForTimeout(2500);
      await page.evaluate(()=>{const s=window.store.getState();s.setFrameloop('never');s.internal.frames=0;s.clock.elapsedTime=100;if(s.controls)s.controls.enabled=false;});
      for(const time of [101,101.25,101.5]){
        const data=await page.evaluate(time=>{
          const s=window.store.getState();
          // Advance from the prior time at 60 Hz. No queued native frame can inject a
          // millisecond rAF timestamp into this seconds-based test clock.
          if(s.frameloop!=='never')throw Error('Manual replay lost ownership of frameloop');
          for(let i=0;i<65&&s.clock.elapsedTime<time-1e-8;i++)s.advance(Math.min(time,s.clock.elapsedTime+1/60));
          s.advance(time);const gl=s.gl.getContext(),pixels=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);
          gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
          let binary='';for(let i=0;i<pixels.length;i+=32768)binary+=String.fromCharCode(...pixels.subarray(i,i+32768));
          return {pixels:btoa(binary),camera:s.camera.position.toArray(),rotation:s.camera.rotation.toArray(),width:gl.drawingBufferWidth,height:gl.drawingBufferHeight};
        },time);
        const key=`${scenario}-${time}`,pixels=Buffer.from(data.pixels,'base64');
        assert.ok(pixels.some(v=>v>0),'readback is not blank');
        await page.locator('canvas').screenshot({path:`${output}/${build}-${key}.png`});
        if(build==='baseline')reference.set(key,{...data,pixels});
        else{
          const ref=reference.get(key);assert.deepEqual(data.camera,ref.camera,'matching camera');assert.deepEqual(data.rotation,ref.rotation,'matching camera rotation');
          let different=0,over2=0,max=0,sum=0;
          for(let i=0;i<pixels.length;i+=4){let diff=0;for(let c=0;c<3;c++){const d=Math.abs(pixels[i+c]-ref.pixels[i+c]);max=Math.max(max,d);sum+=d;diff=Math.max(diff,d);}if(diff)different++;if(diff>2)over2++;}
          const result={scenario,time,differentPixels:different,pixelsOver2Levels:over2,percentOver2:100*over2/(data.width*data.height),maxChannelDifference:max,meanChannelDifference:sum/(data.width*data.height*3)};results.push(result);console.log(JSON.stringify(result));
        }
      }
    }
  }finally{await browser.close();}
}
await writeFile(`${output}/results.json`,JSON.stringify(results,null,2));
// Any substantial mismatch requires investigation, not automatic visual approval.
assert.ok(results.every(r=>r.percentOver2<.05),'Image mismatch exceeds 0.05% of pixels');
