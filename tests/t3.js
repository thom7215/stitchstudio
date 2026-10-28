const C=require('../src/core.js');
const circle=(cx,cy,r,n=80)=>Array.from({length:n},(_,i)=>[cx+r*Math.cos(i/n*6.2832),cy+r*Math.sin(i/n*6.2832)]);
const fab={fill:0.4,satin:0.4,pull:0.2,under:'normal'};
const L={kind:'area',rings:[[[-40,-40],[-10,-40],[-10,-36],[-36,-36],[-36,-15],[-40,-15]]],color:'#cc3333',type:'satin',params:{satinDir:'guides'}};
L.guides=C.autoGuides(L.rings,[],{spacing:0.4});
console.log(JSON.stringify(L.guides));
const ring={kind:'area',rings:[circle(20,-25,12),circle(20,-25,9).reverse()],color:'#3366cc',type:'satin',params:{satinDir:'guides'}};
ring.guides=C.autoGuides(ring.rings,[],{spacing:0.4}); console.log(ring.guides.map(g=>[g.pts.length,g.closed]));
// hand guide on a T bar with direction lines making slanted stitches
const T={kind:'area',rings:[[[5,10],[40,10],[40,14],[24.5,14],[24.5,38],[20.5,38],[20.5,14],[5,14]]],color:'#990099',type:'satin',params:{satinDir:'guides'},
 guides:[{pts:[[8,12],[37,12]]},{pts:[[22.5,36],[22.5,16]]}], dirs:[{a:[8,10],b:[11,14]},{a:[36,10],b:[34,14]}]};
const objs=[L,ring,T]; const res=objs.map(o=>C.generate(o,[],fab,null)); console.log(res.map(r=>[r.segs.length,r.warn]));
require('fs').writeFileSync('tests/out/out3.json',JSON.stringify(C.assemble(objs,res)));
