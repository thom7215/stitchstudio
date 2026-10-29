const C = require('../src/core.js');
const mk = (pts, closed=false) => ({ pts, modes: pts.slice(closed?0:1).map(()=>'line'), closed });
function check(name, col, extra){
  const t0=Date.now(); let pv; for(let i=0;i<20;i++) pv = C.columnPreview([], col); const ms=(Date.now()-t0)/20;
  const d = pv.dirs; let bad=0, cross=0;
  for (const [a,b] of d) if (![...a,...b].every(Number.isFinite)) bad++;
  // stitches crossing each other: consecutive segments intersect
  const inter=(p1,p2,p3,p4)=>{const d=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]); const d1=d(p3,p4,p1),d2=d(p3,p4,p2),d3=d(p1,p2,p3),d4=d(p1,p2,p4); return d1*d2<-1e-9&&d3*d4<-1e-9;};
  for (let i=1;i<d.length;i++) if (inter(d[i-1][0],d[i-1][1],d[i][0],d[i][1])) cross++;
  const segs = C.generate({kind:'area', rings: extra||[], type:'satin', params:{satinDir:'columns', density:'normal', underlay:true, pull:null, border:'none', spacing:null, curveMode:'outer', shortAmt:0.3}, columns:[col]}, [], {satin:0.4, fill:0.4, pull:0.15, under:'normal'}, null);
  const n = segs.segs.reduce((s,q)=>s+q.pts.length,0);
  console.log(name.padEnd(28), 'rungs', d.length, 'NaN', bad, 'crossing pairs', cross, 'stitch pts', n, 'ms/preview', ms.toFixed(1));
}
// L corner: inner A, outer B
check('L corner', {A: mk([[0,30],[0,0],[30,0]]), B: mk([[-5,30],[-5,-5],[30,-5]]), rungs:[]});
// closed ring with offset starts
const circ=(R,n,off)=>Array.from({length:n},(_,i)=>{const a=2*Math.PI*i/n+off;return [R*Math.cos(a),R*Math.sin(a)]});
check('closed ring', {A: mk(circ(10,72,0),true), B: mk(circ(14,90,0.3),true), rungs:[]});
// taper
check('taper', {A: mk([[0,0],[40,0]]), B: mk([[0,8],[40,1]]), rungs:[]});
// very uneven: A short, B long wiggly
const wig=Array.from({length:80},(_,i)=>[i*0.5, 6+2*Math.sin(i/3)]);
check('uneven wiggly', {A: mk([[0,0],[40,0]]), B: mk(wig), rungs:[]});
// S curve
const sA=[],sB=[]; for(let i=0;i<=100;i++){const t=i/100*2*Math.PI; const x=i*0.6, y=10*Math.sin(t); const dx=0.6, dy=10*Math.cos(t)*2*Math.PI/100; const L=Math.hypot(dx,dy); sA.push([x - dy/L*2.5, y + dx/L*2.5]); sB.push([x + dy/L*2.5, y - dx/L*2.5]);}
check('S curve', {A: mk(sA), B: mk(sB), rungs:[]});
check('S curve + user rungs', {A: mk(sA), B: mk(sB), rungs:[{a:sA[30],b:sB[38]},{a:sA[70],b:sB[66]}]});
