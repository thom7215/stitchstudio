const C = require('../../src/core.js');
const fs = require('fs');
const font = JSON.parse(fs.readFileSync(require('path').join(__dirname, '../../samples/Satisfy-stitch.ssfont.json'))).font;
const fab = { fill: 0.4, satin: 0.4, pull: 0.2, under: 'normal' };
const P = { spacing: 0.4, curveMode: 'outer', shortAmt: 0.3, pull: 0.2, underlay: 'normal', maxLen: 7.5, margin: 0.3 };
function glyphs() { return Object.entries(font.glyphs).filter(([ch, g]) => g.objects.length && (g.objects[0].columns || []).length).map(([ch, g]) => ({ ch, o: g.objects[0] })); }
// user's rungs (as dense direction lines) per column
function userCols(o) { return o.columns.map((c) => { const pv = C.columnPreview(o.rings, c); return pv ? { dirs: pv.dirs, A: pv.A, B: pv.B } : null; }).filter(Boolean); }
function autoCols(o, fn) { const cols = (fn || C.satinFollowColumns)(o.rings, [], P, null); return cols.map((c) => ({ dirs: c.rungs })); }
function pip(x, y, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
function samples(o, step = 0.35) { const bb = C.bbox(o.rings); const out = []; for (let y = bb.y0 + step / 2; y < bb.y1; y += step) for (let x = bb.x0 + step / 2; x < bb.x1; x += step) if (C.pointInRings(x, y, o.rings)) out.push([x, y]); return out; }
function quads(cols) { const qs = []; cols.forEach((c, ci) => { const d = c.dirs; for (let i = 1; i < d.length; i++) { const q = [d[i - 1][0], d[i - 1][1], d[i][1], d[i][0]]; const xs = q.map((p) => p[0]), ys = q.map((p) => p[1]); qs.push({ q, ci, ang: Math.atan2(d[i][1][1] - d[i][0][1] + d[i - 1][1][1] - d[i - 1][0][1], d[i][1][0] - d[i][0][0] + d[i - 1][1][0] - d[i - 1][0][0]), x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }); } }); return qs; }
// per sample: the stitch angle there (or null) and how many layers cover it
function field(S, cols) { const qs = quads(cols); return S.map(([x, y]) => { let ang = null, id = -1, n = 0; const seen = new Set(); for (const q of qs) { if (x < q.x0 || x > q.x1 || y < q.y0 || y > q.y1) continue; if (pip(x, y, q.q)) { if (ang == null) { ang = q.ang; id = q.ci; } if (!seen.has(q.ci)) { seen.add(q.ci); n++; } } } return { ang, n, id }; }); }
const adiff = (a, b) => { let d = Math.abs(a - b) % Math.PI; if (d > Math.PI / 2) d = Math.PI - d; return d * 180 / Math.PI; };
function compare(o, fn) {
  const S = samples(o); const U = field(S, userCols(o)); const AC = autoCols(o, fn); const A = field(S, AC);
  let both = 0, err = 0, big = 0, ucov = 0, acov = 0, aover = 0;
  for (let i = 0; i < S.length; i++) { if (U[i].ang != null) ucov++; if (A[i].ang != null) acov++; if (A[i].n > 1) aover++; if (U[i].ang != null && A[i].ang != null) { both++; const d = adiff(U[i].ang, A[i].ang); err += d; if (d > 25) big++; } }
  // structure: purity (each auto column lies inside one user column) and completeness (each user column is one auto column)
  const cnt = new Map(); let tot = 0;
  for (let i = 0; i < S.length; i++) { if (U[i].id < 0 || A[i].id < 0) continue; tot++; const k = U[i].id + ',' + A[i].id; cnt.set(k, (cnt.get(k) || 0) + 1); }
  const bestBy = (idx) => { const m = new Map(); for (const [k, v] of cnt) { const key = k.split(',')[idx]; m.set(key, Math.max(m.get(key) || 0, v)); } let s = 0; for (const v of m.values()) s += v; return s / Math.max(1, tot); };
  const purity = bestBy(1), complete = bestBy(0);
  return { purity, complete, n: S.length, angErr: err / Math.max(1, both), bigFrac: big / Math.max(1, both), ucov: ucov / S.length, acov: acov / S.length, aover: aover / S.length, ucols: o.columns.length, acols: AC.length };
}
module.exports = { C, font, P, glyphs, userCols, autoCols, compare, samples };
