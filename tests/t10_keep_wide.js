// A 10 mm wide satin column: by default every stitch gets a needle point near the middle;
// with "keep wide stitches whole" each stitch goes all the way across.
const C = require('../src/core.js');
const F = require('../src/formats.js');
const mk = (pts) => ({ pts, modes: pts.slice(1).map(() => 'line'), closed: false });
const fab = { satin: 0.4, fill: 0.4, pull: 0.15, under: 'normal' };
for (const keepWide of [false, true]) {
  const o = { id: 1, kind: 'area', rings: [[[0, 0], [40, 0], [40, 10], [0, 10]]], type: 'satin', color: '#203080',
    params: { satinDir: 'columns', density: 'normal', underlay: false, pull: 0, border: 'none', spacing: null, curveMode: 'outer', shortAmt: 0, keepWide },
    columns: [{ A: mk([[0, 0], [40, 0]]), B: mk([[0, 10], [40, 10]]), rungs: [] }] };
  const res = C.generate(o, [], fab, null);
  const A = C.assemble([o], [res]);
  // stitches that cross the column (both ends near opposite edges) vs. ones that stop near the middle
  let across = 0, half = 0;
  for (let i = 1; i < A.X.length; i++) {
    if (A.C[i] !== 0 || A.C[i - 1] !== 0) continue;
    const y0 = A.Y[i - 1], y1 = A.Y[i];
    const dy = Math.abs(y1 - y0);
    if (dy > 9) across++; else if (dy > 3 && (Math.abs(y1 - 5) < 2.5 || Math.abs(y0 - 5) < 2.5)) half++;
  }
  // what the machine file holds: decode the EXP stitches back and count full-width ones
  const exp = F.writeEXP(A);
  let x = 0, y = 0, full = 0, k = 0, pts = [];
  while (k < exp.length) {
    if (exp[k] === 0x80) { k += 4; continue; }
    const dx = (exp[k] << 24) >> 24, dyy = (exp[k + 1] << 24) >> 24; k += 2;
    if (Math.abs(dyy) > 90) full++;
  }
  console.log(`keepWide=${keepWide}: stitches across ${across}, half stitches ${half}, warnings ${JSON.stringify(res.warn)}, EXP full-width stitches ${full}`);
}
