import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
// Bounded feasibility prototype: can cached, resolved HDR color/depth seed the
// existing 4-sample render target without losing per-sample edge coverage?
const browser = await chromium.launch({channel:'chrome',headless:false});
try {
  const page=await browser.newPage();
  const result=await page.evaluate(()=>{
    const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl2');
    if(!gl)throw Error('WebGL2 unavailable');
    gl.getExtension('EXT_color_buffer_float');
    const make=samples=>{
      const f=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,f);
      for(const [attachment,format]of [[gl.COLOR_ATTACHMENT0,gl.RGBA16F],[gl.DEPTH_ATTACHMENT,gl.DEPTH_COMPONENT24]]){
        const r=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,r);
        gl.renderbufferStorageMultisample(gl.RENDERBUFFER,samples,format,32,32);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER,attachment,gl.RENDERBUFFER,r);
      }
      if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Incomplete framebuffer');
      return f;
    };
    const live=make(4),cache=make(0),restore=make(4);
    gl.bindFramebuffer(gl.FRAMEBUFFER,live);gl.clearColor(.2,.3,.4,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const blit=(from,to)=>{gl.bindFramebuffer(gl.READ_FRAMEBUFFER,from);gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,to);gl.blitFramebuffer(0,0,32,32,0,0,32,32,gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT,gl.NEAREST);return gl.getError();};
    return {maxSamples:gl.getParameter(gl.MAX_SAMPLES),resolveError:blit(live,cache),restoreResolvedError:blit(cache,restore),copyMultisampleError:blit(live,restore),invalidOperation:gl.INVALID_OPERATION};
  });
  assert.equal(result.resolveError,0);
  assert.equal(result.restoreResolvedError,result.invalidOperation);
  assert.equal(result.copyMultisampleError,result.invalidOperation);
  console.log(JSON.stringify({result,decision:'Do not ship resolved-background composition: WebGL2 rejects copying into a multisampled destination. Shader copying resolved color/depth cannot reconstruct per-sample depth/coverage. Keep full beauty rendering and unchanged 4x MSAA/HDR.'},null,2));
} finally {await browser.close();}
