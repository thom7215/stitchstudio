// A shape-edge rail must not run back over itself, and a column's second rail must not run over the first.
const C = require('../src/core.js');
const circ = (R, n) => Array.from({ length: n }, (_, i) => { const a = 2 * Math.PI * i / n; return [R * Math.cos(a), R * Math.sin(a)]; });
const ring = circ(20, 180);
const at = (deg) => [20 * Math.cos(deg * Math.PI / 180), 20 * Math.sin(deg * Math.PI / 180)];
const angleOf = (q) => ((Math.atan2(q[1], q[0]) * 180 / Math.PI) + 360) % 360;
// dots at 0, 150 and 340 degrees: from 150 to 340 the shorter way is backwards, over 150 -> 0
const rail = { pts: [at(0), at(150), at(340)], modes: ['edge', 'edge'], closed: false };
const D = C.railDense(rail, [ring]);
const reached250 = D.some((q) => Math.abs(angleOf(q) - 250) < 3);
let back = 0; for (const q of D.slice(Math.floor(D.length / 2))) { const a = angleOf(q); if (a > 5 && a < 145) back++; }
console.log('own rail: goes on round through 250 deg:', reached250, '| points back over the start:', back);
// second rail on the same outline: A from 200 to 340 deg, B from 190 to 350 the other way would be shorter
// through 200..340; it must go round the top instead
const A = { pts: [at(200), at(270), at(340)], modes: ['edge', 'edge'], closed: false };
const B = { pts: [at(190), at(350)], modes: ['edge'], closed: false };
const dA = C.railDense(A, [ring]), dB = C.railDense(B, [ring], [dA]);
const overA = dB.filter((q) => { const a = angleOf(q); return a > 205 && a < 335; }).length;
const viaTop = dB.some((q) => Math.abs(angleOf(q) - 90) < 3);
console.log('second rail: points on the first rail:', overA, '| goes round the other side:', viaTop);
// without anything to avoid, the plain shorter way is still used
const plain = C.railDense({ pts: [at(10), at(60)], modes: ['edge'], closed: false }, [ring]);
console.log('plain short segment stays short:', plain.every((q) => { const a = angleOf(q); return a >= 9 && a <= 61; }));
