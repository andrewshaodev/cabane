import { readFile } from 'node:fs/promises';
const report=JSON.parse(await readFile(process.argv[2]??'/tmp/cabane-perf-comparison/comparison.json','utf8'));
const median=values=>{const v=[...values].sort((a,b)=>a-b);return v.length%2?v[Math.floor(v.length/2)]:(v[v.length/2-1]+v[v.length/2])/2;};
const f=n=>Number.isFinite(n)?n.toFixed(1):'—';
for(const cadence of [...new Set(report.samples.map(s=>s.cadence))]){
  console.log(`\n${cadence==='native'?'Normal scheduling':`${cadence} FPS test driver`} (medians)`);
  console.log('| Scenario | CPU before → after | CPU change | FPS before → after | Draws before → after | Callback ms before → after |');
  console.log('|---|---:|---:|---:|---:|---:|');
  for(const scenario of [...new Set(report.samples.map(s=>s.scenario))]){
    const a=report.samples.filter(s=>s.scenario===scenario&&s.cadence===cadence&&s.build==='baseline'),b=report.samples.filter(s=>s.scenario===scenario&&s.cadence===cadence&&s.build==='candidate');if(!a.length||!b.length)continue;
    const value=(list,get)=>median(list.map(get)),cpuA=value(a,s=>s.browserCpuPercent),cpuB=value(b,s=>s.browserCpuPercent);
    console.log(`| ${scenario} | ${f(cpuA)}% → ${f(cpuB)}% | ${f((cpuB/cpuA-1)*100)}% | ${f(value(a,s=>s.fps))} → ${f(value(b,s=>s.fps))} | ${f(value(a,s=>s.calls.mean))} → ${f(value(b,s=>s.calls.mean))} | ${f(value(a,s=>s.callbackMs.mean))} → ${f(value(b,s=>s.callbackMs.mean))} |`);
    for(const left of a){const right=b.find(s=>s.repeat===left.repeat);if(right&&JSON.stringify(left.startPose?.camera)!==JSON.stringify(right.startPose?.camera))console.log(`  Camera start differs in repeat ${left.repeat}: ${JSON.stringify(left.startPose?.camera)} vs ${JSON.stringify(right.startPose?.camera)}`);}
  }
}
console.log('\nCPU ranges (all repetitions):');
for(const key of [...new Set(report.samples.map(s=>`${s.scenario} ${s.cadence}`))]){
 const ranges=['baseline','candidate'].map(build=>{const v=report.samples.filter(s=>`${s.scenario} ${s.cadence}`===key&&s.build===build).map(s=>s.browserCpuPercent);return `${build}: ${f(Math.min(...v))}–${f(Math.max(...v))}%`;});console.log(`${key}: ${ranges.join('; ')}`);
}
