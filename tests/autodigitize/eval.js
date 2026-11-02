// Compares the automatic satin columns with the hand-digitized Satisfy font in samples/:
//   purity   = how much each automatic column stays inside one hand-made column
//   complete = how much each hand-made column is one automatic column
//   angErr   = mean difference in stitch direction (degrees); cov = share of the letter covered
// Run: node tests/autodigitize/eval.js [-v]   (OPT=noBarRule,noSelfCut,... to switch parts off)
const L = require('./lib.js'); for (const k of (process.env.OPT||'').split(',').filter(Boolean)) { const [a,b]=k.split('='); L.C.testOpts[a]= b===undefined ? true : +b; }
const rows = []; let tot = { purity: 0, complete: 0, angErr: 0, bigFrac: 0, acov: 0, aover: 0, ucov: 0, colDiff: 0 };
for (const { ch, o } of L.glyphs()) { const r = L.compare(o); rows.push([ch, r]); tot.angErr += r.angErr; tot.purity += r.purity; tot.complete += r.complete; tot.bigFrac += r.bigFrac; tot.acov += r.acov; tot.ucov += r.ucov; tot.aover += r.aover; tot.colDiff += Math.abs(r.acols - r.ucols); }
const n = rows.length;
if (process.argv[2] === '-v') for (const [ch, r] of rows) console.log(ch, 'ang', r.angErr.toFixed(1), 'big', (r.bigFrac * 100).toFixed(0) + '%', 'cov u/a', (r.ucov * 100).toFixed(0), (r.acov * 100).toFixed(0), 'over', (r.aover * 100).toFixed(1), 'cols u/a', r.ucols, r.acols, 'pur', (r.purity*100).toFixed(0), 'comp', (r.complete*100).toFixed(0));
console.log('MEAN purity', (tot.purity/n*100).toFixed(1), 'complete', (tot.complete/n*100).toFixed(1), 'angErr', (tot.angErr / n).toFixed(2), 'big>25°', (tot.bigFrac / n * 100).toFixed(1) + '%', 'cov user', (tot.ucov / n * 100).toFixed(1), 'auto', (tot.acov / n * 100).toFixed(1), 'auto overlap', (tot.aover / n * 100).toFixed(2), 'colDiff', (tot.colDiff / n).toFixed(2));
