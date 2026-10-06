import assert from 'node:assert/strict';
import test from 'node:test';
import { withModules } from './test-server.mjs';

await withModules(async load => {
  const {createPortalTransition} = await load('/packages/walk-laser/src/portals/portal-transition.ts');
  const travel={landing:{x:2,z:3,elevation:0,floorId:'ground'},facing:{yaw:1,pitch:0},entry:'blue',exit:'gold'};
  for (const fps of [30,60,120]) test(`portal cut occurs after an opaque frame and reveals once at ${fps} FPS`,()=>{
    const transition=createPortalTransition(), samples=[];
    let commits=0;
    assert.equal(transition.start(travel,false),true);
    assert.equal(transition.start(travel,false),false);
    for(let frame=0;frame<fps;frame++) samples.push(transition.advance(1/fps,request=>{
      assert.deepEqual(request,travel);
      assert.equal(samples.at(-1).opacity,1,'scene must already be covered before relocation');
      commits++;return true;
    }));
    assert.equal(commits,1);
    assert.ok(samples.some(sample=>sample.color==='gold' && sample.opacity===1));
    assert.ok(samples.some(sample=>sample.opacity>0 && sample.opacity<1));
    assert.ok(samples.every(sample=>sample.fovOffset<=3));
    assert.equal(samples.at(-1).opacity,0);
    assert.equal(samples.at(-1).fovOffset,0);
    assert.equal(transition.busy,false);
    assert.equal(transition.start({...travel,entry:'gold',exit:'blue'},false),true);
  });
  test('canceling before the covered cut prevents late relocation; failed exits reveal the original view',()=>{
    const transition=createPortalTransition();let calls=0;
    transition.start(travel,false);
    transition.advance(.05,()=>{calls++;return true;});
    transition.cancel();
    assert.equal(transition.advance(.05,()=>{calls++;return true;}).opacity,0);
    assert.equal(calls,0);
    transition.start(travel,false);
    for(let i=0;i<12;i++){
      const sample=transition.advance(.05,()=>{calls++;return false;});
      assert.notEqual(sample.color,'gold');
    }
    assert.equal(calls,1);
    assert.equal(transition.busy,false);
  });
  test('reduced motion relocates immediately with only a short gentle tint and no lens motion',()=>{
    const transition=createPortalTransition();let calls=0;
    transition.start(travel,true);
    const first=transition.advance(1/60,()=>{calls++;return true;});
    assert.equal(calls,1);assert.equal(first.opacity,.18);assert.equal(first.fovOffset,0);assert.equal(first.reduced,true);
    for(let i=0;i<10;i++)assert.equal(transition.advance(1/60,()=>{throw Error('repeated teleport');}).fovOffset,0);
    assert.equal(transition.busy,false);
  });
  test('a slow frame cannot skip the full-cover frame or invoke relocation more than once',()=>{
    const transition=createPortalTransition();let calls=0,previous;
    transition.start(travel,false);
    for(let i=0;i<12;i++)previous=transition.advance(10,()=>{
      assert.equal(previous.opacity,1);calls++;return true;
    });
    assert.equal(calls,1);assert.equal(previous.opacity,0);assert.equal(transition.busy,false);
  });
});
