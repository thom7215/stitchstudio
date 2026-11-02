const L = require('./lib.js'); const fs = require('fs');
const chars = (process.argv[2] || 'MNsFHW').split('');
const variant = process.argv[3] ? require(process.argv[3]) : null;
const COL = ['#d62728', '#1f77b4', '#2ca02c', '#9467bd', '#ff7f0e', '#17becf', '#e377c2', '#8c564b'];
let html = '<html><body style="margin:0;background:#fff;display:flex;flex-wrap:wrap;font:14px sans-serif">';
for (const ch of chars) {
  const g = L.font.glyphs[ch]; if (!g) continue; const o = g.objects[0];
  const bb = L.C.bbox(o.rings); const pad = 2;
  const vb = `${bb.x0 - pad} ${bb.y0 - pad} ${bb.w + 2 * pad} ${bb.h + 2 * pad}`;
  const ring = o.rings.map((r) => 'M' + r.map((p) => p.join(',')).join('L') + 'Z').join('');
  const draw = (cols) => cols.map((c, ci) => c.dirs.filter((_, i) => i % 2 === 0).map(([a, b]) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${COL[ci % 8]}" stroke-width="0.07"/>`).join('') + (c.dirs.length ? `<circle cx="${(c.dirs[0][0][0] + c.dirs[0][1][0]) / 2}" cy="${(c.dirs[0][0][1] + c.dirs[0][1][1]) / 2}" r="0.5" fill="${COL[ci % 8]}"/>` : '')).join('');
  const svg = (cols, label) => `<div style="margin:4px;text-align:center">${label}<br><svg width="300" height="${300 * (bb.h + 4) / (bb.w + 4)}" viewBox="${vb}"><path d="${ring}" fill="#eef" stroke="#000" stroke-width="0.08" fill-rule="evenodd"/>${draw(cols)}</svg></div>`;
  const auto = L.autoCols(o, variant && variant.fn);
  html += `<div style="display:flex;border:1px solid #ccc;margin:3px">${svg(L.userCols(o), ch + ' user')}${svg(auto, ch + ' auto')}</div>`;
}
fs.writeFileSync('require('path').join(require('os').tmpdir(), 'viz.html')', html + '</body></html>');
