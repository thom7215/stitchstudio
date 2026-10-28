const C=require('../src/core.js');
const circle=(cx,cy,r,n=120)=>Array.from({length:n},(_,i)=>[cx+r*Math.cos(i/n*6.2832),cy+r*Math.sin(i/n*6.2832)]);
const fab={fill:0.4,satin:0.4,pull:0.2,under:'normal'};
// arc-shaped band: ring segment. Use full ring shape, draw rails along outer & inner edges on top half only.
const rings=[circle(0,0,10),circle(0,0,6).reverse()];
const A={pts:[[-10,0],[0,-10],[10,0]],modes:['edge','edge']};
const B={pts:[[6,0],[0,-6],[-6,0]],modes:['edge','edge']}; // drawn reversed on purpose
const col={A,B,rungs:[{a:[0,-10.5],b:[3,-5]}]};
const pv=C.columnPreview(rings,col); console.log('rails',pv.A.length,pv.B.length,'start',pv.start,'rung',pv.rungs);
const o={kind:'area',rings,type:'satin',params:{satinDir:'columns'},columns:[col],color:'#000000'};
const r=C.generate(o,[],fab,null); console.log('pts',r.segs[0].pts.length,r.warn);
const ac=C.autoColumns(rings,[],{spacing:0.4,margin:0.3}); console.log('auto',ac.length, ac.map(c=>[c.A.pts.length,c.A.modes.join(''),c.B.pts.length,c.rungs.length,c.A.closed]));
require('fs').writeFileSync('tests/out/out5.json',JSON.stringify(C.assemble([o],[r])));
