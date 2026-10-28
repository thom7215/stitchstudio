const C=require('../src/core.js'); const fs=require('fs');
const objs=JSON.parse(fs.readFileSync('tests/sample_objs.json'));
const fab={fill:0.4,satin:0.4,pull:0.2,under:'normal'};
const res=objs.map((o,i)=>{const occ=objs.slice(i+1).filter(q=>q.kind==='area'&&q.type!=='skip'&&q.type!=='running').map(q=>q.rings); return C.generate(o,occ,fab,null);});
const A=C.assemble(objs,res);
for(let i=0;i<A.C.length;i++) if(A.C[i]===2){
  const oi=A.OBJ[i]; const o=objs[oi]; const a=[A.X[i],A.Y[i]];
  // next stitch target after the jump
  let j=i+1; while(j<A.C.length && A.C[j]!==1) j++; const b=[A.X[j],A.Y[j]];
  const nb=C.nearestOnRings(o.rings||[],a), nq=C.nearestOnRings(o.rings||[],b);
  const occ=res[oi].occ||[]; const oa=occ.map(R=>C.nearestOnRings(R,a).d.toFixed(1)), ob=occ.map(R=>C.nearestOnRings(R,b).d.toFixed(1));
  console.log(o.name, 'obj', A.OBJ[j]===oi?'same':'next', 'd',C.dist(a,b).toFixed(1),'own',nb.d&&nb.d.toFixed(1),nq.d&&nq.d.toFixed(1),'occA',oa.join('/'),'occB',ob.join('/'));
}
