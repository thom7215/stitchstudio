const C = require('../src/core.js');
const circle=(cx,cy,r,n=80)=>Array.from({length:n},(_,i)=>[cx+r*Math.cos(i/n*6.2832),cy+r*Math.sin(i/n*6.2832)]);
const fab={fill:0.4,satin:0.4,pull:0.2,under:'normal'};
const objs=[
 {kind:'area',rings:[[[-40,-40],[-10,-40],[-10,-36],[-36,-36],[-36,-15],[-40,-15]]],color:'#c33',params:{}}, // L
 {kind:'area',rings:[circle(20,-25,12),circle(20,-25,9).reverse()],color:'#36c',params:{}}, // ring
 {kind:'area',rings:[[[-40,0],[0,0],[0,35],[-40,35]]],color:'#3a3',params:{angle:45}}, // square fill
 {kind:'area',rings:[[[-30,10],[-10,10],[-10,20],[-30,20]]],color:'#fc0',params:{}}, // on top of square
 {kind:'area',rings:[[[5,10],[40,10],[40,14],[24.5,14],[24.5,38],[20.5,38],[20.5,14],[5,14]]],color:'#909',params:{}}, // T
 {kind:'line',paths:[{pts:Array.from({length:60},(_,i)=>[5+i*0.6, 0+4*Math.sin(i/6)]),closed:false}],width:2,color:'#000',params:{}},
];
let t0=Date.now();
const res=[];
objs.forEach((o,i)=>{const a=C.analyze(o);o.type=a.type;console.log(i,a.type,a.why);});
objs.forEach((o,i)=>{
  const occ=objs.slice(i+1).filter(q=>q.kind==='area'&&q.type!=='skip').map(q=>q.rings);
  res.push(C.generate(o,occ,fab,null));
});
console.log('gen ms',Date.now()-t0);
const A=C.assemble(objs,res);
console.log('stitches',A.stitches,'colors',A.colors.length, res.map(r=>r.warn));
require('fs').writeFileSync('out.json',JSON.stringify(A));
