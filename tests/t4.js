const C=require('../src/core.js');
const circle=(cx,cy,r,n=120)=>Array.from({length:n},(_,i)=>[cx+r*Math.cos(i/n*6.2832),cy+r*Math.sin(i/n*6.2832)]);
const fab={fill:0.4,satin:0.4,pull:0.2,under:'normal'};
function test(params,label){
  const o={kind:'area',rings:[circle(0,0,6),circle(0,0,3).reverse()],color:'#3366cc',type:'satin',params:{...params,underlay:false}};
  const r=C.generate(o,[],fab,null); const pts=r.segs.flatMap(s=>s.pts);
  // outer points: radius > 5.5
  const outer=pts.filter(p=>Math.hypot(...p)>5.6).map(p=>Math.atan2(p[1],p[0])).sort((a,b)=>a-b);
  const gaps=outer.slice(1).map((a,i)=>(a-outer[i])*6.2); gaps.sort((a,b)=>a-b);
  const inner=pts.filter(p=>Math.hypot(...p)<3.2).length;
  const short=pts.filter(p=>{const d=Math.hypot(...p);return d>3.4&&d<5.4}).length;
  console.log(label.padEnd(26),'stitches',pts.length,'outer pts',outer.length,'median outer gap',gaps[gaps.length>>1].toFixed(2),'mm  90th pct',gaps[Math.floor(gaps.length*.9)].toFixed(2),' inner-edge pts',inner,' shortened',short);
  return {o,r};
}
test({curveMode:'center',shortAmt:0},'old (even centre)');
test({curveMode:'outer',shortAmt:0},'even outer edge');
const {o,r}=test({curveMode:'outer',shortAmt:0.3},'outer + short stitches');
const objs=[o]; require('fs').writeFileSync('tests/out/out4.json',JSON.stringify(C.assemble(objs,[r])));
