const C = require('../src/core.js');
// test column: straight 20 mm, then a half circle, then straight 20 mm; inner radius 10, outer 15
function rail(R, n){ const p=[]; for(let i=0;i<=20;i++) p.push([-R, 20-i]); for(let k=1;k<=n;k++){ const a=Math.PI*k/n; p.push([-R*Math.cos(a), -R*Math.sin(a)]); } for(let i=1;i<=20;i++) p.push([R, i]); return p; }
const A = { pts: rail(10, 60), modes: [], closed:false }; A.modes = A.pts.slice(1).map(()=> 'line');
const B = { pts: rail(15, 60), modes: [], closed:false }; B.modes = B.pts.slice(1).map(()=> 'line');
function score(col){
  const pv = C.columnPreview([], col);
  let worst=0, sum=0, n=0;
  for (const [a,b] of pv.dirs){
    // ideal: stitch direction along the line through the centre for the arc, horizontal on the straights
    const mx=(a[0]+b[0])/2, my=(a[1]+b[1])/2;
    let ideal = my > 0 ? [1,0] : [mx, my];
    const L=Math.hypot(...ideal); ideal=[ideal[0]/L, ideal[1]/L];
    const d=[b[0]-a[0], b[1]-a[1]]; const Ld=Math.hypot(...d);
    const cos=Math.abs((d[0]*ideal[0]+d[1]*ideal[1])/Ld);
    const ang=Math.acos(Math.min(1,cos))*180/Math.PI; worst=Math.max(worst,ang); sum+=ang; n++;
  }
  return {avg:+(sum/n).toFixed(1), worst:+worst.toFixed(1), n};
}
console.log('no rungs', score({A,B,rungs:[]}));
console.log('one rung at the top', score({A,B,rungs:[{a:[0,-10],b:[0,-15]}]}));
