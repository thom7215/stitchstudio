const C=require('../src/core.js'); const fs=require('fs');
const objs=JSON.parse(fs.readFileSync('tests/sample_objs.json'));
const fab={fill:0.4,satin:0.4,pull:0.2,under:'normal'};
const res=objs.map((o,i)=>{const occ=objs.slice(i+1).filter(q=>q.kind==='area'&&q.type!=='skip'&&q.type!=='running').map(q=>q.rings); return C.generate(o,occ,fab,null);});
const badge=res[0];
let long=0;
badge.segs.forEach((s,k)=>{ let mx=0; for(let i=1;i<s.pts.length;i++){const d=C.dist(s.pts[i-1],s.pts[i]); if(d>mx)mx=d;} console.log(k,s.phase,s.pts.length,'first',s.pts[0].map(v=>v.toFixed(1)).join(','),'maxstep',mx.toFixed(1)); });
const A=C.assemble(objs,res);
// find straight runs: consecutive stitches of the same object with segment >2.4mm in badge => travel/underlay
fs.writeFileSync('tests/out/a6.json',JSON.stringify(A));
let trims=0, travel=0; for(let i=0;i<A.C.length;i++){ if(A.C[i]===2) trims++; }
console.log('trims',trims,'stitches',A.stitches);
