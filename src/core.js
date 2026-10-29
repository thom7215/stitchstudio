/* ===================================================================
   Stitch engine. Units: millimetres, origin = hoop centre, y points down.
   =================================================================== */
const Core = (() => {
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  /* ---------- basic geometry ---------- */
  function ringArea(r) {
    let s = 0;
    for (let i = 0, n = r.length; i < n; i++) {
      const a = r[i], b = r[(i + 1) % n];
      s += a[0] * b[1] - b[0] * a[1];
    }
    return s / 2;
  }
  function ringsArea(rings) {
    // even-odd area approximation: outer minus holes using containment depth
    let total = 0;
    rings.forEach((r, i) => {
      const a = Math.abs(ringArea(r));
      let depth = 0;
      const p = r[0];
      rings.forEach((q, j) => { if (j !== i && pointInRing(p[0], p[1], q)) depth++; });
      total += depth % 2 ? -a : a;
    });
    return Math.max(0, total);
  }
  function perimeter(rings) {
    let s = 0;
    for (const r of rings) for (let i = 0; i < r.length; i++) s += dist(r[i], r[(i + 1) % r.length]);
    return s;
  }
  function pathLength(pts, closed) {
    let s = 0;
    for (let i = 1; i < pts.length; i++) s += dist(pts[i - 1], pts[i]);
    if (closed && pts.length > 1) s += dist(pts[pts.length - 1], pts[0]);
    return s;
  }
  function bbox(pointLists) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const L of pointLists) for (const p of L) {
      if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1];
    }
    return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
  }
  function pointInRing(x, y, r) {
    let inside = false;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const xi = r[i][0], yi = r[i][1], xj = r[j][0], yj = r[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function pointInRings(x, y, rings) {
    let c = false;
    for (const r of rings) if (pointInRing(x, y, r)) c = !c;
    return c;
  }
  function segDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const L = dx * dx + dy * dy;
    let t = L ? ((px - ax) * dx + (py - ay) * dy) / L : 0;
    t = clamp(t, 0, 1);
    return Math.hypot(px - ax - t * dx, py - ay - t * dy);
  }
  function edgeList(rings) {
    const E = [];
    for (const r of rings) for (let i = 0; i < r.length; i++) {
      const a = r[i], b = r[(i + 1) % r.length];
      E.push([a[0], a[1], b[0], b[1]]);
    }
    return E;
  }
  /* uniform grid of edges for fast ray / distance queries */
  function edgeIndex(E) {
    const bb = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    for (const e of E) {
      bb.x0 = Math.min(bb.x0, e[0], e[2]); bb.x1 = Math.max(bb.x1, e[0], e[2]);
      bb.y0 = Math.min(bb.y0, e[1], e[3]); bb.y1 = Math.max(bb.y1, e[1], e[3]);
    }
    const n = Math.max(1, Math.ceil(Math.sqrt(E.length / 2)));
    const cw = Math.max((bb.x1 - bb.x0) / n, 1e-6), ch = Math.max((bb.y1 - bb.y0) / n, 1e-6);
    const cells = Array.from({ length: n * n }, () => []);
    E.forEach((e, k) => {
      const ix0 = clamp(Math.floor((Math.min(e[0], e[2]) - bb.x0) / cw), 0, n - 1);
      const ix1 = clamp(Math.floor((Math.max(e[0], e[2]) - bb.x0) / cw), 0, n - 1);
      const iy0 = clamp(Math.floor((Math.min(e[1], e[3]) - bb.y0) / ch), 0, n - 1);
      const iy1 = clamp(Math.floor((Math.max(e[1], e[3]) - bb.y0) / ch), 0, n - 1);
      for (let iy = iy0; iy <= iy1; iy++) for (let ix = ix0; ix <= ix1; ix++) cells[iy * n + ix].push(k);
    });
    // nearest distance: expanding ring search
    function nearest(px, py) {
      let best = Infinity;
      const cx = clamp(Math.floor((px - bb.x0) / cw), 0, n - 1), cy = clamp(Math.floor((py - bb.y0) / ch), 0, n - 1);
      const seen = new Set();
      for (let rad = 0; rad < n; rad++) {
        for (let iy = cy - rad; iy <= cy + rad; iy++) for (let ix = cx - rad; ix <= cx + rad; ix++) {
          if (ix < 0 || iy < 0 || ix >= n || iy >= n) continue;
          if (Math.max(Math.abs(ix - cx), Math.abs(iy - cy)) !== rad) continue;
          for (const k of cells[iy * n + ix]) {
            if (seen.has(k)) continue; seen.add(k);
            const e = E[k];
            const d = segDist(px, py, e[0], e[1], e[2], e[3]);
            if (d < best) best = d;
          }
        }
        // any edge outside the searched square is at least rad*min(cw,ch) away
        if (best < rad * Math.min(cw, ch)) break;
      }
      return best;
    }
    // ray: march through cells along the ray
    function ray(px, py, dx, dy, maxT) {
      let best = maxT;
      const seen = new Set();
      const step = Math.min(cw, ch) * 0.5;
      for (let t = 0; t <= best + step; t += step) {
        const x = px + dx * t, y = py + dy * t;
        const ix = Math.floor((x - bb.x0) / cw), iy = Math.floor((y - bb.y0) / ch);
        if (ix < -1 || iy < -1 || ix > n || iy > n) { if (t > 0) break; }
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
          const jx = ix + ox, jy = iy + oy;
          if (jx < 0 || jy < 0 || jx >= n || jy >= n) continue;
          for (const k of cells[jy * n + jx]) {
            if (seen.has(k)) continue; seen.add(k);
            const e = E[k];
            const ex = e[2] - e[0], ey = e[3] - e[1];
            const den = dx * ey - dy * ex;
            if (Math.abs(den) < 1e-12) continue;
            const wx = e[0] - px, wy = e[1] - py;
            const tt = (wx * ey - wy * ex) / den;
            const s = (wx * dy - wy * dx) / den;
            if (tt > 1e-7 && s >= 0 && s <= 1 && tt < best) best = tt;
          }
        }
      }
      return best;
    }
    return { nearest, ray };
  }

  /* Douglas-Peucker */
  function simplify(pts, eps, closed) {
    if (pts.length < 4) return pts.slice();
    if (closed) {
      // split at the farthest point from pts[0]
      let far = 0, fd = -1;
      for (let i = 1; i < pts.length; i++) { const d = dist(pts[0], pts[i]); if (d > fd) { fd = d; far = i; } }
      const a = dp(pts.slice(0, far + 1), eps), b = dp(pts.slice(far).concat([pts[0]]), eps);
      return a.slice(0, -1).concat(b.slice(0, -1));
    }
    return dp(pts, eps);
  }
  function dp(pts, eps) {
    const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
    const stack = [[0, pts.length - 1]];
    while (stack.length) {
      const [i0, i1] = stack.pop();
      let md = -1, mi = -1;
      const a = pts[i0], b = pts[i1];
      for (let i = i0 + 1; i < i1; i++) {
        const d = segDist(pts[i][0], pts[i][1], a[0], a[1], b[0], b[1]);
        if (d > md) { md = d; mi = i; }
      }
      if (md > eps) { keep[mi] = 1; stack.push([i0, mi], [mi, i1]); }
    }
    return pts.filter((_, i) => keep[i]);
  }

  /* ---------- scanline machinery ---------- */
  function rotator(deg) {
    const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    return {
      to: (p) => [p[0] * c + p[1] * s, -p[0] * s + p[1] * c],
      back: (u, v) => [u * c - v * s, u * s + v * c],
    };
  }
  function scanner(rings, to) {
    const E = [];
    let ymin = Infinity, ymax = -Infinity;
    for (const r of rings) for (let i = 0; i < r.length; i++) {
      const a = to(r[i]), b = to(r[(i + 1) % r.length]);
      if (a[1] === b[1]) continue;
      E.push({ x1: a[0], y1: a[1], x2: b[0], y2: b[1], lo: Math.min(a[1], b[1]), hi: Math.max(a[1], b[1]) });
      ymin = Math.min(ymin, a[1]); ymax = Math.max(ymax, a[1]);
    }
    E.sort((p, q) => p.lo - q.lo);
    let ptr = 0, active = [];
    function at(y) {
      while (ptr < E.length && E[ptr].lo <= y) active.push(E[ptr++]);
      active = active.filter((e) => e.hi > y);
      const xs = [];
      for (const e of active) if (e.lo <= y && e.hi > y) xs.push(e.x1 + (y - e.y1) * (e.x2 - e.x1) / (e.y2 - e.y1));
      xs.sort((a, b) => a - b);
      const iv = [];
      for (let i = 0; i + 1 < xs.length; i += 2) iv.push([xs[i], xs[i + 1]]);
      return iv;
    }
    return { at, ymin, ymax };
  }
  function subtract(ivs, cut) {
    let out = ivs;
    for (const [c0, c1] of cut) {
      const nx = [];
      for (const [a, b] of out) {
        if (c1 <= a || c0 >= b) { nx.push([a, b]); continue; }
        if (c0 > a) nx.push([a, c0]);
        if (c1 < b) nx.push([c1, b]);
      }
      out = nx;
    }
    return out;
  }
  /* rows of intervals across a shape, minus occluders (shrunk by margin) */
  function scanRows(rings, occluders, deg, spacing, opt = {}) {
    const R = rotator(deg);
    const sc = scanner(rings, R.to);
    const oc = occluders.map((o) => scanner(o, R.to));
    const margin = opt.margin ?? 0.3;
    const minLen = opt.minLen ?? 0.3;
    const inset = opt.inset ?? 0;
    const rows = [];
    let y;
    if (opt.edgeInset != null) y = sc.ymin + opt.edgeInset;
    else y = Math.ceil((sc.ymin + spacing * 0.35) / spacing) * spacing;
    const yEnd = opt.edgeInset != null ? sc.ymax - opt.edgeInset : sc.ymax - spacing * 0.2;
    for (; y <= yEnd; y += spacing) {
      let iv = sc.at(y);
      for (const o of oc) {
        if (y < o.ymin || y > o.ymax) continue;
        const cut = o.at(y).map(([a, b]) => [a + margin, b - margin]).filter(([a, b]) => b > a);
        if (cut.length) iv = subtract(iv, cut);
      }
      if (inset) iv = iv.map(([a, b]) => [a + inset, b - inset]);
      if (opt.extend) iv = iv.map(([a, b]) => [a - opt.extend, b + opt.extend]);
      iv = iv.filter(([a, b]) => b - a >= minLen);
      rows.push({ y, k: Math.round(y / spacing), iv });
    }
    return { rows, back: R.back, to: R.to };
  }
  /* split rows of intervals into regions that can each be sewn in one go */
  function regionize(rows) {
    const regions = [];
    let active = [];
    for (const row of rows) {
      const matches = row.iv.map((iv) => active.filter((r) => Math.min(r.last[1], iv[1]) - Math.max(r.last[0], iv[0]) > 0));
      const count = new Map();
      matches.forEach((m) => m.forEach((r) => count.set(r, (count.get(r) || 0) + 1)));
      const next = [];
      row.iv.forEach((iv, k) => {
        const m = matches[k];
        if (m.length === 1 && count.get(m[0]) === 1) {
          m[0].rows.push({ y: row.y, k: row.k, iv }); m[0].last = iv; next.push(m[0]);
        } else {
          const r = { rows: [{ y: row.y, k: row.k, iv }], last: iv };
          regions.push(r); next.push(r);
        }
      });
      active = next;
    }
    return regions;
  }

  /* ---------- running stitch ---------- */
  function runPath(pts, closed, len, triple) {
    if (pts.length < 2) return pts.slice();
    const P = closed ? pts.concat([pts[0]]) : pts;
    const out = [P[0]];
    let acc = 0;
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1], b = P[i];
      const d = dist(a, b);
      let t = 0;
      // place stitches every len along this segment
      while (acc + (d - t) >= len) {
        const need = len - acc;
        t += need; acc = 0;
        out.push(lerp(a, b, t / d));
      }
      acc += d - t;
      // keep sharp corners
      if (i < P.length - 1) {
        const c = P[i + 1];
        const v1 = [b[0] - a[0], b[1] - a[1]], v2 = [c[0] - b[0], c[1] - b[1]];
        const l1 = Math.hypot(...v1), l2 = Math.hypot(...v2);
        if (l1 > 1e-9 && l2 > 1e-9) {
          const cos = (v1[0] * v2[0] + v1[1] * v2[1]) / (l1 * l2);
          if (cos < 0.82 && acc > 0.5) { out.push(b); acc = 0; }
        }
      }
    }
    const last = P[P.length - 1];
    if (dist(out[out.length - 1], last) > 0.3) out.push(last);
    else out[out.length - 1] = last;
    if (!triple) return out;
    const T = [out[0]];
    for (let i = 1; i < out.length; i++) T.push(out[i], out[i - 1], out[i]);
    return T;
  }
  function resample(pts, step, closed) {
    const P = closed ? pts.concat([pts[0]]) : pts;
    const L = pathLength(P, false);
    if (L < 1e-9) return [P[0]];
    const n = Math.max(1, Math.round(L / step));
    const st = L / n;
    const out = [P[0]];
    let seg = 1, segStart = 0, segLen = dist(P[0], P[1]);
    for (let k = 1; k <= n; k++) {
      const target = k * st;
      while (seg < P.length - 1 && segStart + segLen < target) { segStart += segLen; seg++; segLen = dist(P[seg - 1], P[seg]); }
      const t = segLen > 0 ? clamp((target - segStart) / segLen, 0, 1) : 0;
      out.push(lerp(P[seg - 1], P[seg], t));
    }
    if (closed) out.pop();
    return out;
  }
  function smoothPoly(pts, k, closed, passes = 2) {
    let P = pts;
    const n = P.length;
    if (n < 3 || k < 1) return P.slice();
    for (let pass = 0; pass < passes; pass++) {
      const Q = new Array(n);
      for (let i = 0; i < n; i++) {
        if (!closed && (i === 0 || i === n - 1)) { Q[i] = P[i]; continue; }
        let sx = 0, sy = 0, c = 0;
        for (let j = -k; j <= k; j++) {
          let m = i + j;
          if (closed) m = (m + n) % n; else if (m < 0 || m >= n) continue;
          sx += P[m][0]; sy += P[m][1]; c++;
        }
        Q[i] = [sx / c, sy / c];
      }
      P = Q;
    }
    return P;
  }
  function tangents(P, k, closed) {
    const n = P.length;
    return P.map((_, i) => {
      let a = i - k, b = i + k;
      if (closed) { a = (a + n) % n; b = (b + n) % n; } else { a = Math.max(0, a); b = Math.min(n - 1, b); }
      let dx = P[b][0] - P[a][0], dy = P[b][1] - P[a][1];
      const L = Math.hypot(dx, dy) || 1;
      return [dx / L, dy / L];
    });
  }

  /* ---------- satin from rungs ---------- */
  function satinFromRungs(rungs, o) {
    const pull = o.pull, maxLen = o.maxLen ?? 7.5;
    if (!rungs.length) return [];
    const R = rungs.map(([a, b]) => {
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1e-9;
      const ux = dx / L, uy = dy / L;
      return { a: [a[0] - ux * pull, a[1] - uy * pull], b: [b[0] + ux * pull, b[1] + uy * pull], w: L, m: lerp(a, b, 0.5) };
    });
    const out = [];
    const avgW = R.reduce((s, r) => s + r.w, 0) / R.length;
    let forward = true;
    if (o.underlay && R.length > 2) {
      // centre walk
      const mids = R.map((r) => r.m);
      out.push(...runPath(mids, o.closed, 2.0, false));
      forward = false;
      if (o.endForward && !(avgW > 2.2 || o.heavy)) {
        // walk back to the start so the top layer runs from the first click to the last one
        if (!o.closed) out.push(...runPath(mids.slice().reverse(), false, 2.0, false).slice(1));
        forward = true;
      } else if (avgW > 2.2 || o.heavy) {
        // zig-zag underlay back
        const step = Math.max(1, Math.round(1.6 / o.rungStep));
        const ins = Math.min(0.45, avgW * 0.18) + pull;
        let side = 0;
        for (let i = R.length - 1; i >= 0; i -= step) {
          const r = R[i];
          const L = dist(r.a, r.b);
          if (L < 2 * ins + 0.3) { out.push(r.m); continue; }
          const t = ins / L;
          out.push(side ? lerp(r.a, r.b, 1 - t) : lerp(r.a, r.b, t));
          side ^= 1;
        }
        forward = true;
      }
    }
    // choose where stitches go. Rungs arrive finely spaced; place a stitch each time the
    // OUTER edge has moved exactly the target spacing, so curves stay full on the outside.
    const mix = (i, j, t) => ({ ra: lerp(rungs[i][0], rungs[j][0], t), rb: lerp(rungs[i][1], rungs[j][1], t), a: lerp(R[i].a, R[j].a, t), b: lerp(R[i].b, R[j].b, t), m: lerp(R[i].m, R[j].m, t) });
    const K = [];
    if (o.target && R.length > 1) {
      let last = mix(0, 0, 0);
      K.push(last);
      const meas = (r) => o.outerFull === false ? dist(r.m, last.m) : Math.max(dist(r.ra, last.ra), dist(r.rb, last.rb));
      for (let i = 1; i < R.length; i++) {
        let guard = 0;
        while (guard++ < 50) {
          const cur = mix(i, i, 0);
          const mc = meas(cur);
          if (mc < o.target) break;
          const prevR = mix(i - 1, i - 1, 0);
          const mp = meas(prevR);
          // linear search for the crossing between rung i-1 and i
          const t = clamp((o.target - mp) / Math.max(mc - mp, 1e-9), 0, 1);
          const nr = mix(i - 1, i, t);
          if (dist(nr.m, last.m) < 1e-6 && t >= 1) break;
          K.push(nr); last = nr;
          if (t >= 1) break;
        }
      }
      if (!o.closed) {
        const fin = mix(R.length - 1, R.length - 1, 0);
        if (dist(last.m, fin.m) > o.target * 0.3 || K.length < 2) K.push(fin); else K[K.length - 1] = fin;
      }
    } else for (let i = 0; i < R.length; i++) K.push(mix(i, i, 0));
    const keep = K;
    // how squeezed each side is at each stitch (1 = even, small = inside of a curve)
    // measured over several stitches so small wobbles on straight strokes don't count as curves
    const SA = [0], SB = [0];
    for (let k = 1; k < K.length; k++) { SA.push(SA[k - 1] + dist(K[k].ra, K[k - 1].ra)); SB.push(SB[k - 1] + dist(K[k].rb, K[k - 1].rb)); }
    const squeeze = K.map((r, k) => {
      const w = 3, i0 = Math.max(0, k - w), i1 = Math.min(K.length - 1, k + w);
      const da = SA[i1] - SA[i0], db = SB[i1] - SB[i0];
      const mx = Math.max(da, db, 1e-9);
      return [da / mx, db / mx];
    });
    const order = forward ? keep.map((_, k) => k) : keep.map((_, k) => keep.length - 1 - k);
    if (o.closed) order.push(order[0]);
    const shortAmt = o.shortAmt ?? 0;
    const cnt = [0, 0];
    let prev = out.length ? out[out.length - 1] : null;
    order.forEach((k, n) => {
      const r = K[k];
      const side = n % 2;
      let p = side === 0 ? r.a : r.b;
      const q = squeeze[k][side];
      if (shortAmt > 0 && q < 0.62) {
        cnt[side]++;
        if (cnt[side] % 2 === 1) {
          const amt = shortAmt * clamp((0.62 - q) / 0.42, 0.35, 1);
          p = side === 0 ? lerp(r.a, r.b, amt) : lerp(r.b, r.a, amt);
        }
      }
      if (prev) {
        const d = dist(prev, p);
        if (d > maxLen) {
          const nn = Math.ceil(d / maxLen);
          const sh = n % 2 ? 0.22 : -0.22;
          for (let j = 1; j < nn; j++) out.push(lerp(prev, p, (j + sh) / nn));
        }
      }
      out.push(p); prev = p;
    });
    return out;
  }

  /* ---------- fill (tatami) ---------- */
  function fillRows(region, spacingStitch, back, startNear, reverseRows) {
    const rows = reverseRows ? region.rows.slice().reverse() : region.rows;
    const L = spacingStitch;
    const out = [];
    // pick first row direction so that we start near startNear
    let dirLeft = false;
    if (startNear) {
      const r0 = rows[0];
      const pl = back(r0.iv[0], r0.y), pr = back(r0.iv[1], r0.y);
      dirLeft = dist(pr, startNear) < dist(pl, startNear);
    }
    rows.forEach((row) => {
      const [x0, x1] = row.iv;
      const off = (((row.k % 3) + 3) % 3) * L / 3;
      const xs = [];
      const g0 = Math.ceil((x0 + 0.5 - off) / L), g1 = Math.floor((x1 - 0.5 - off) / L);
      for (let g = g0; g <= g1; g++) xs.push(off + g * L);
      const line = [x0, ...xs, x1];
      if (dirLeft) line.reverse();
      for (const x of line) out.push(back(x, row.y));
      dirLeft = !dirLeft;
    });
    return out;
  }
  function regionEnds(region, back) {
    const f = region.rows[0], l = region.rows[region.rows.length - 1];
    return [back(f.iv[0], f.y), back(f.iv[1], f.y), back(l.iv[0], l.y), back(l.iv[1], l.y)];
  }
  function orderRegions(regions, back, start) {
    const left = regions.slice();
    const out = [];
    let pos = start;
    while (left.length) {
      let bi = 0, bd = Infinity, brev = false;
      left.forEach((r, i) => {
        const e = regionEnds(r, back);
        const df = pos ? Math.min(dist(pos, e[0]), dist(pos, e[1])) : 0;
        const dr = pos ? Math.min(dist(pos, e[2]), dist(pos, e[3])) : 1;
        if (df < bd) { bd = df; bi = i; brev = false; }
        if (dr < bd) { bd = dr; bi = i; brev = true; }
      });
      const r = left.splice(bi, 1)[0];
      out.push({ r, rev: brev });
      const e = regionEnds(r, back);
      pos = brev ? lerp(e[0], e[1], 0.5) : lerp(e[2], e[3], 0.5);
    }
    return out;
  }
  /* a copy of each outline pulled inside by d mm (simple per-vertex offset) */
  function insetRings(rings, d) {
    const out = [];
    for (const r of rings) {
      if (r.length < 3 || Math.abs(ringArea(r)) < 4) continue;
      const P = resample(r, 0.5, true);
      if (P.length < 4) continue;
      const T = tangents(P, 2, true);
      let plus = 0;
      P.forEach((q, i) => { if (i % 4 === 0 && pointInRings(q[0] - T[i][1] * d, q[1] + T[i][0] * d, rings)) plus++; else if (i % 4 === 0) plus--; });
      const sg = plus >= 0 ? 1 : -1;
      const Q = P.map((q, i) => [q[0] - T[i][1] * d * sg, q[1] + T[i][0] * d * sg]);
      // drop pieces that fell outside (thin parts of the shape)
      const okPts = Q.filter((q) => pointInRings(q[0], q[1], rings));
      if (okPts.length > Q.length * 0.85) out.push(Q.filter((q) => pointInRings(q[0], q[1], rings)));
    }
    return out;
  }
  function genFill(rings, occ, p, start) {
    const segs = [];
    const ang = -p.angle;
    let pos = start;
    if (p.underlay !== 'none') {
      // edge run: a running stitch just inside the outline keeps the edges crisp
      for (const r of insetRings(rings, 0.5)) {
        let k = 0;
        if (pos) { let bd = Infinity; r.forEach((q, i) => { const d = dist(q, pos); if (d < bd) { bd = d; k = i; } }); }
        const R = r.slice(k).concat(r.slice(0, k));
        const pts = runPath(R, true, 2.5, false);
        if (pts.length > 2) { segs.push({ pts, phase: 'under' }); pos = pts[pts.length - 1]; }
      }
      const layers = p.underlay === 'heavy' ? [ang + 90, ang] : [ang + 90];
      const usp = p.underlay === 'light' ? 3.0 : 2.0;
      for (const a of layers) {
        const sc = scanRows(rings, occ, a, usp, { margin: 0.6, inset: 0.6, minLen: 1.2, edgeInset: 0.7 });
        pos = sewRegions(regionize(sc.rows), sc, usp, 3.5, 'under', rings, occ, segs, pos);
      }
    }
    // pull compensation: fabric pulls fill rows shorter, so each row reaches a little past the edge
    const top = scanRows(rings, occ, ang, p.spacing, { margin: 0.3, minLen: 0.3, extend: Math.max(0, (p.pull || 0) * 0.5) });
    pos = sewRegions(regionize(top.rows), top, p.spacing, p.stitchLen, 'top', rings, occ, segs, pos);
    return segs;
  }
  /* Sew fill regions in an order where the thread can travel to the next one through fill that is
     not sewn yet (or under a shape sewn later), so travel stitches end up covered. */
  function sewRegions(regs, scan, spacing, L, phase, rings, occ, segs, pos) {
    const { back, to } = scan;
    const byK = regs.map((r) => { const m = new Map(); for (const row of r.rows) m.set(row.k, row.iv); return m; });
    const sewn = new Uint8Array(regs.length);
    const status = (q) => {
      const [u, v] = to(q);
      const k = Math.round(v / spacing);
      for (let ri = 0; ri < regs.length; ri++) {
        for (const kk of [k, k - 1, k + 1]) {
          const iv = byK[ri].get(kk);
          if (iv && u >= iv[0] - 0.25 && u <= iv[1] + 0.25) return sewn[ri] ? 'sewn' : 'open';
        }
      }
      for (const o of occ) if (pointInRings(q[0], q[1], o)) return 'hole';
      return pointInRings(q[0], q[1], rings) ? 'open' : 'out';
    };
    const travelOK = (a, b) => {
      const d = dist(a, b);
      const n = Math.max(1, Math.ceil(d / 0.5));
      for (let j = 1; j < n; j++) {
        const q = lerp(a, b, j / n);
        const st = status(q);
        if (st === 'out') return false;
        // touching already-sewn rows right at the ends is fine (they are the rows we start/stop on)
        if (st === 'sewn' && dist(q, a) > 1.2 && dist(q, b) > 1.2) return false;
      }
      return true;
    };
    let cur = null;
    const left = regs.map((_, i) => i);
    while (left.length) {
      let best = null;
      for (const ri of left) {
        const e = regionEnds(regs[ri], back);
        for (const [rev, a, b] of [[false, e[0], e[1]], [true, e[2], e[3]]]) {
          for (const q of [a, b]) {
            const d = pos ? dist(pos, q) : 0;
            const ok = !pos || d < 1.6 || travelOK(pos, q);
            const cost = d + (ok ? 0 : 1000);
            if (!best || cost < best.cost) best = { ri, rev, cost, ok };
          }
        }
      }
      left.splice(left.indexOf(best.ri), 1);
      const pts = fillRows(regs[best.ri], L, back, pos, best.rev);
      sewn[best.ri] = 1;
      if (!pts.length) continue;
      if (cur && best.ok && pos) {
        // travel through unsewn fill (it gets covered), then carry on in the same piece
        const tr = runPath([pos, pts[0]], false, 2.5, false);
        cur.pts.push(...tr.slice(1), ...pts.slice(1));
      } else {
        cur = { pts, phase };
        segs.push(cur);
      }
      pos = pts[pts.length - 1];
    }
    return pos;
  }

  /* satin with a fixed angle (scanline columns) */
  function genSatinAngle(rings, occ, p, start) {
    const step = p.spacing / 2;
    const { rows, back } = scanRows(rings, occ, -p.angle, step, { margin: 0.3, minLen: 0.2 });
    const regs = regionize(rows);
    const segs = [];
    let pos = start;
    for (const { r, rev } of orderRegions(regs, back, pos)) {
      const rr = rev ? r.rows.slice().reverse() : r.rows;
      const rungs = rr.map((row) => [back(row.iv[0], row.y), back(row.iv[1], row.y)]);
      const pts = satinFromRungs(rungs, { pull: p.pull, underlay: p.underlay !== 'none', heavy: p.underlay === 'heavy', rungStep: step });
      if (pts.length) { segs.push({ pts, phase: 'top' }); pos = pts[pts.length - 1]; }
    }
    return segs;
  }

  /* ---------- raster helpers for the shape-following satin ---------- */
  function rasterize(rings, ox, oy, r, W, H) {
    const m = new Uint8Array(W * H);
    const to = (p) => [(p[0] - ox) / r, (p[1] - oy) / r];
    const sc = scanner(rings, to);
    for (let j = 0; j < H; j++) {
      const iv = sc.at(j + 0.5);
      for (const [a, b] of iv) {
        const i0 = Math.max(0, Math.ceil(a - 0.5)), i1 = Math.min(W - 1, Math.floor(b - 0.5));
        for (let i = i0; i <= i1; i++) m[j * W + i] = 1;
      }
    }
    return m;
  }
  function chamfer(mask, W, H) {
    // distance (in px) from each set pixel to the nearest unset pixel
    const INF = 1e9, d = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) d[i] = mask[i] ? INF : 0;
    const a = 1, b = Math.SQRT2;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; if (!d[i]) continue;
      let v = d[i];
      if (x > 0) v = Math.min(v, d[i - 1] + a);
      if (y > 0) { v = Math.min(v, d[i - W] + a); if (x > 0) v = Math.min(v, d[i - W - 1] + b); if (x < W - 1) v = Math.min(v, d[i - W + 1] + b); }
      d[i] = v;
    }
    for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x; if (!d[i]) continue;
      let v = d[i];
      if (x < W - 1) v = Math.min(v, d[i + 1] + a);
      if (y < H - 1) { v = Math.min(v, d[i + W] + a); if (x < W - 1) v = Math.min(v, d[i + W + 1] + b); if (x > 0) v = Math.min(v, d[i + W - 1] + b); }
      d[i] = v;
    }
    return d;
  }
  function thin(src, W, H) {
    const img = src.slice();
    const del = [];
    let changed = true, guard = 0;
    while (changed && guard++ < 500) {
      changed = false;
      for (let pass = 0; pass < 2; pass++) {
        del.length = 0;
        for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
          const i = y * W + x;
          if (!img[i]) continue;
          const p2 = img[i - W], p3 = img[i - W + 1], p4 = img[i + 1], p5 = img[i + W + 1],
            p6 = img[i + W], p7 = img[i + W - 1], p8 = img[i - 1], p9 = img[i - W - 1];
          const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
          if (B < 2 || B > 6) continue;
          const A = (!p2 && p3) + (!p3 && p4) + (!p4 && p5) + (!p5 && p6) + (!p6 && p7) + (!p7 && p8) + (!p8 && p9) + (!p9 && p2);
          if (A !== 1) continue;
          if (pass === 0) { if (p2 && p4 && p6) continue; if (p4 && p6 && p8) continue; }
          else { if (p2 && p4 && p8) continue; if (p2 && p6 && p8) continue; }
          del.push(i);
        }
        for (const i of del) img[i] = 0;
        if (del.length) changed = true;
      }
    }
    return img;
  }
  // neighbour order: N, NE, E, SE, S, SW, W, NW
  const NB = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
  const COMP = (() => {
    const t = new Uint8Array(256);
    for (let m = 0; m < 256; m++) {
      const seen = new Uint8Array(8); let c = 0;
      for (let s = 0; s < 8; s++) {
        if (!(m >> s & 1) || seen[s]) continue;
        c++; const st = [s]; seen[s] = 1;
        while (st.length) {
          const u = st.pop();
          for (let v = 0; v < 8; v++) {
            if (!(m >> v & 1) || seen[v]) continue;
            if (Math.max(Math.abs(NB[u][0] - NB[v][0]), Math.abs(NB[u][1] - NB[v][1])) === 1) { seen[v] = 1; st.push(v); }
          }
        }
      }
      t[m] = c;
    }
    return t;
  })();
  function nbMask(img, W, i) {
    let m = 0;
    for (let s = 0; s < 8; s++) if (img[i + NB[s][1] * W + NB[s][0]]) m |= 1 << s;
    return m;
  }
  function popcount(m) { let c = 0; while (m) { c += m & 1; m >>= 1; } return c; }
  function cleanSkeleton(img, W, H) {
    for (let it = 0; it < 6; it++) {
      let ch = 0;
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
        const i = y * W + x;
        if (!img[i]) continue;
        const m = nbMask(img, W, i), c = popcount(m);
        if (c >= 2 && c <= 5 && COMP[m] === 1) { img[i] = 0; ch++; }
      }
      if (!ch) break;
    }
  }
  function traceGraph(img, W, H) {
    const deg = new Uint8Array(W * H);
    const px = [];
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (img[i]) { deg[i] = popcount(nbMask(img, W, i)); px.push(i); }
    }
    const isNode = (i) => deg[i] !== 2;
    // cluster junction pixels
    const node = new Int32Array(W * H).fill(-1);
    const nodes = [];
    for (const i of px) {
      if (!isNode(i) || node[i] >= 0) continue;
      const id = nodes.length, mem = [i]; node[i] = id;
      const st = [i];
      while (st.length) {
        const u = st.pop();
        for (const [dx, dy] of NB) {
          const v = u + dy * W + dx;
          if (img[v] && isNode(v) && deg[v] >= 3 && deg[u] >= 3 && node[v] < 0) { node[v] = id; mem.push(v); st.push(v); }
        }
      }
      let sx = 0, sy = 0;
      for (const m of mem) { sx += m % W; sy += Math.floor(m / W); }
      nodes.push({ id, mem, x: sx / mem.length, y: sy / mem.length, deg: mem.length === 1 ? deg[mem[0]] : 3, pix: mem[0] });
    }
    const used = new Uint8Array(W * H);
    const branches = [];
    const direct = new Set();
    for (const nd of nodes) {
      for (const s of nd.mem) {
        for (const [dx, dy] of NB) {
          const v = s + dy * W + dx;
          if (!img[v] || node[v] === nd.id) continue;
          if (node[v] >= 0) {
            // direct node-node link
            const key = nd.id + ':' + node[v];
            if (nd.id < node[v] && !direct.has(key)) { direct.add(key); branches.push({ pts: [s, v], a: nd.id, b: node[v], closed: false }); }
            continue;
          }
          if (used[v]) continue;
          const pts = [s, v]; used[v] = 1;
          let prev = s, cur = v, end = -1;
          for (let guard = 0; guard < W * H; guard++) {
            let nx = -1;
            for (const [ex, ey] of NB) {
              const w = cur + ey * W + ex;
              if (!img[w] || w === prev) continue;
              if (node[w] >= 0) { if (node[w] === nd.id && pts.length <= 3) continue; nx = w; break; }
              if (!used[w]) { nx = w; break; }
            }
            if (nx < 0) break;
            pts.push(nx);
            if (node[nx] >= 0) { end = node[nx]; break; }
            used[nx] = 1; prev = cur; cur = nx;
          }
          branches.push({ pts, a: nd.id, b: end, closed: false });
        }
      }
    }
    // loops without nodes
    for (const i of px) {
      if (used[i] || isNode(i)) continue;
      const pts = [i]; used[i] = 1;
      let prev = -1, cur = i;
      for (let guard = 0; guard < W * H; guard++) {
        let nx = -1;
        for (const [ex, ey] of NB) {
          const w = cur + ey * W + ex;
          if (img[w] && w !== prev && !used[w]) { nx = w; break; }
        }
        if (nx < 0) break;
        pts.push(nx); used[nx] = 1; prev = cur; cur = nx;
      }
      if (pts.length > 3) branches.push({ pts, a: -1, b: -1, closed: true });
    }
    return { nodes, branches, deg };
  }

  function skeletonChains(rings, occ, p) {
    const area = ringsArea(rings), per = perimeter(rings);
    const w = Math.max(0.2, 2 * area / Math.max(per, 1e-6));
    const bb = bbox(rings);
    let r = clamp(w / 18, 0.025, 0.25);
    let W, H;
    for (;;) {
      W = Math.ceil(bb.w / r) + 8; H = Math.ceil(bb.h / r) + 8;
      if (W * H <= 2.5e6) break;
      r *= 1.2;
    }
    const ox = bb.x0 - 4 * r, oy = bb.y0 - 4 * r;
    let mask = rasterize(rings, ox, oy, r, W, H);
    const E = edgeList(rings);
    const occE = [];
    if (occ.length) {
      const om = new Uint8Array(W * H);
      for (const o of occ) {
        const m = rasterize(o, ox, oy, r, W, H);
        for (let i = 0; i < m.length; i++) om[i] |= m[i];
        occE.push(...edgeList(o));
      }
      const od = chamfer(om, W, H);
      const lim = p.margin / r;
      for (let i = 0; i < mask.length; i++) if (om[i] && od[i] > lim) mask[i] = 0;
    }
    const idx = edgeIndex(E);
    const oidx = occE.length ? edgeIndex(occE) : null;
    const toMM = (i) => [ox + (i % W + 0.5) * r, oy + (Math.floor(i / W) + 0.5) * r];
    let skel = thin(mask, W, H);
    cleanSkeleton(skel, W, H);
    let G;
    // prune short spurs repeatedly
    for (let it = 0; it < 5; it++) {
      G = traceGraph(skel, W, H);
      let pruned = 0;
      for (const br of G.branches) {
        if (br.closed) continue;
        const na = G.nodes[br.a], nb = br.b >= 0 ? G.nodes[br.b] : null;
        const aEnd = na && na.deg === 1, bEnd = !nb || nb.deg === 1;
        if (aEnd === bEnd) continue; // only spurs: one free end, one junction
        const jn = aEnd ? nb : na;
        const R = idx.nearest(...toMM(jn.pix));
        const len = br.pts.length * r;
        if (len < 1.25 * R + 2 * r) {
          for (const q of br.pts) if (!(jn.mem.includes(q))) skel[q] = 0;
          pruned++;
        }
      }
      cleanSkeleton(skel, W, H);
      if (!pruned) break;
    }
    G = traceGraph(skel, W, H);
    // single isolated pixels become nodes with deg 0
    const chains = [];
    const brs = G.branches.filter((b) => b.pts.length >= 2);
    // pair branches through junctions
    const link = brs.map(() => [null, null]);
    const byNode = new Map();
    brs.forEach((b, bi) => {
      if (b.closed) return;
      [[b.a, 0], [b.b, 1]].forEach(([nid, end]) => {
        if (nid < 0) return;
        const nd = G.nodes[nid];
        if (nd.deg < 3) return;
        if (!byNode.has(nid)) byNode.set(nid, []);
        const pts = end === 0 ? b.pts : b.pts.slice().reverse();
        const k = Math.min(pts.length - 1, Math.max(3, Math.round(pts.length * 0.5)), 12);
        const p0 = toMM(pts[0]), p1 = toMM(pts[k]);
        const L = dist(p0, p1) || 1;
        byNode.get(nid).push({ bi, end, d: [(p1[0] - p0[0]) / L, (p1[1] - p0[1]) / L] });
      });
    });
    for (const list of byNode.values()) {
      const pairs = [];
      for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
        if (list[i].bi === list[j].bi) continue;
        const dot = list[i].d[0] * list[j].d[0] + list[i].d[1] * list[j].d[1];
        if (dot < -0.55) pairs.push([dot, i, j]);
      }
      pairs.sort((a, b) => a[0] - b[0]);
      const taken = new Set();
      for (const [, i, j] of pairs) {
        if (taken.has(i) || taken.has(j)) continue;
        taken.add(i); taken.add(j);
        link[list[i].bi][list[i].end] = { bi: list[j].bi, end: list[j].end };
        link[list[j].bi][list[j].end] = { bi: list[i].bi, end: list[i].end };
      }
    }
    const visited = new Uint8Array(brs.length);
    const freeEnd = (b, end) => {
      const nid = end === 0 ? b.a : b.b;
      return nid < 0 ? true : G.nodes[nid].deg === 1;
    };
    for (let s = 0; s < brs.length; s++) {
      if (visited[s]) continue;
      if (brs[s].closed) {
        visited[s] = 1;
        chains.push({ pix: brs[s].pts, closed: true, freeA: false, freeB: false });
        continue;
      }
      // walk back to the chain start
      let cb = s, ce = 0, guard = 0;
      while (link[cb][ce] && guard++ < brs.length) {
        const L = link[cb][ce];
        if (L.bi === s) break;
        cb = L.bi; ce = 1 - L.end;
      }
      // now traverse forward from (cb, entering at end ce)
      const pix = [];
      let freeA = freeEnd(brs[cb], ce), freeB = false, closed = false;
      let b = cb, e = ce;
      guard = 0;
      while (guard++ <= brs.length) {
        if (visited[b]) { closed = true; break; }
        visited[b] = 1;
        const pts = e === 0 ? brs[b].pts : brs[b].pts.slice().reverse();
        for (const q of pts) if (pix[pix.length - 1] !== q) pix.push(q);
        const out = 1 - e;
        const L = link[b][out];
        if (!L) { freeB = freeEnd(brs[b], out); break; }
        b = L.bi; e = L.end;
      }
      chains.push({ pix, closed: closed && pix.length > 4, freeA, freeB });
    }
    // isolated dots
    for (let i = 0; i < skel.length; i++) {
      if (skel[i] && G.deg[i] === 0) chains.push({ pix: [i], closed: false, freeA: true, freeB: true, dot: true });
    }

    const out = [];
    for (const ch of chains) {
      let pts = ch.pix.map(toMM);
      if (ch.dot || pts.length < 2) {
        // find the longest chord through the dot
        const c = pts[0];
        let best = null, bl = -1;
        for (let a = 0; a < 8; a++) {
          const t = a * Math.PI / 8, d = [Math.cos(t), Math.sin(t)];
          const l1 = idx.ray(c[0], c[1], d[0], d[1], 50), l2 = idx.ray(c[0], c[1], -d[0], -d[1], 50);
          if (l1 + l2 > bl) { bl = l1 + l2; best = [d, l1, l2]; }
        }
        if (!best || bl > 40) continue;
        const [d, l1, l2] = best;
        pts = [[c[0] - d[0] * l2 * 0.7, c[1] - d[1] * l2 * 0.7], [c[0] + d[0] * l1 * 0.7, c[1] + d[1] * l1 * 0.7]];
        ch.freeA = ch.freeB = false;
      }
      const ks = Math.max(1, Math.round(0.35 / r));
      pts = smoothPoly(pts, ks, ch.closed, 2);
      out.push({ pts, closed: ch.closed, freeA: ch.freeA, freeB: ch.freeB });
    }
    return { chains: out, idx, oidx, r, E };
  }

  function genSatinFollow(rings, occ, p, start, warn) {
    const { chains, idx, oidx, E } = skeletonChains(rings, occ, p);
    const step = p.spacing / 2 / 4;
    const inside = (q) => pointInRings(q[0], q[1], rings);
    const columns = [];
    for (const ch of chains) {
      let pts = ch.pts;
      pts = resample(pts, step, ch.closed);
      if (pts.length < 2) continue;
      // extend free ends past the tip, so slanted or square ends are filled right to the edge
      const chordSet = new Set();
      const extend = (atStart) => {
        const n = pts.length;
        const e = atStart ? pts[0] : pts[n - 1];
        const q = atStart ? pts[Math.min(n - 1, 8)] : pts[Math.max(0, n - 9)];
        let dx = e[0] - q[0], dy = e[1] - q[1];
        const L = Math.hypot(dx, dy); if (L < 1e-9) return;
        dx /= L; dy /= L;
        const hw = (idx.ray(e[0], e[1], -dy, dx, 30) + idx.ray(e[0], e[1], dy, -dx, 30)) / 2;
        const maxExt = idx.ray(e[0], e[1], dx, dy, 30) + hw * 1.2;
        const ext = [];
        for (let t = step; t < maxExt; t += step) ext.push([e[0] + dx * t, e[1] + dy * t]);
        if (atStart) pts = ext.reverse().concat(pts); else pts = pts.concat(ext);
        tipHW.push(hw);
        return ext.length;
      };
      const tipHW = [];
      const tipLim = new Map();
      let nA = 0, nB = 0;
      if (!ch.closed) {
        nA = ch.freeA ? extend(true) || 0 : 0;
        const hwA = nA ? tipHW[tipHW.length - 1] : 0;
        nB = ch.freeB ? extend(false) || 0 : 0;
        const hwB = nB ? tipHW[tipHW.length - 1] : 0;
        for (let k = 0; k < nA; k++) { chordSet.add(k); tipLim.set(k, hwA); }
        for (let k = 0; k < nB; k++) { chordSet.add(pts.length - 1 - k); tipLim.set(pts.length - 1 - k, hwB); }
      }
      const T = tangents(pts, Math.max(2, Math.round(0.7 / step)), ch.closed);
      // where a rung line actually crosses the shape (used past the tips)
      const chord = (q, n, W, hw) => {
        const ts = [];
        for (const e of E) {
          const ex = e[2] - e[0], ey = e[3] - e[1];
          const den = n[0] * ey - n[1] * ex;
          if (Math.abs(den) < 1e-12) continue;
          const wx = e[0] - q[0], wy = e[1] - q[1];
          const t = (wx * ey - wy * ex) / den, u = (wx * n[1] - wy * n[0]) / den;
          if (u >= 0 && u <= 1 && Math.abs(t) <= W) ts.push(t);
        }
        ts.sort((a, b) => a - b);
        let best = null;
        for (let k = 0; k + 1 < ts.length; k++) {
          const m = (ts[k] + ts[k + 1]) / 2;
          if (!pointInRings(q[0] + n[0] * m, q[1] + n[1] * m, rings)) continue;
          // must belong to this stroke: overlap its width and not be wider than it
          if (ts[k + 1] < -hw * 1.25 || ts[k] > hw * 1.25 || ts[k + 1] - ts[k] > hw * 2.6 + 0.3) continue;
          const score = Math.abs(m);
          if (!best || score < best.score) best = { a: Math.min(ts[k + 1], hw * 1.4), b: Math.min(-ts[k], hw * 1.4), score };
        }
        return best;
      };
      const raw = [];
      pts.forEach((q, i) => {
        if (chordSet.has(i)) {
          const nx = -T[i][1], ny = T[i][0];
          const c = chord(q, [nx, ny], 12, tipLim.get(i) || 1);
          if (!c || c.a + c.b < 0.2) { raw.push(null); return; }
          raw.push({ q, n: [nx, ny], da: c.a, db: c.b, dt: Math.max(c.a, c.b), tip: true });
          return;
        }
        if (!inside(q)) { raw.push(null); return; }
        const nx = -T[i][1], ny = T[i][0];
        let da = idx.ray(q[0], q[1], nx, ny, 40), db = idx.ray(q[0], q[1], -nx, -ny, 40);
        if (oidx) {
          const oa = oidx.ray(q[0], q[1], nx, ny, 40), ob = oidx.ray(q[0], q[1], -nx, -ny, 40);
          if (oa + p.margin < da) da = oa + p.margin;
          if (ob + p.margin < db) db = ob + p.margin;
        }
        const dt = idx.nearest(q[0], q[1]);
        raw.push({ q, n: [nx, ny], da, db, dt });
      });
      // past a tip: once a rung finds nothing, drop everything further out
      for (let k = nA - 1, gone = false; k >= 0; k--) { if (!raw[k]) gone = true; if (gone) raw[k] = null; }
      for (let k = pts.length - nB, gone = false; k < pts.length; k++) { if (!raw[k]) gone = true; if (gone) raw[k] = null; }
      const good = raw.filter(Boolean);
      if (!good.length) continue;
      const ws = good.map((g) => g.da + g.db).sort((a, b) => a - b);
      const wmed = ws[Math.floor(ws.length / 2)];
      // clamp sides near junctions / spikes
      for (const g of good) {
        const lim = Math.max(1.35 * g.dt + 0.15, 0.6 * wmed);
        g.da = Math.min(g.da, lim); g.db = Math.min(g.db, lim);
      }
      // median-smooth side distances
      const med = (arr, i, k) => { const s = []; for (let j = -k; j <= k; j++) { const v = arr[i + j]; if (v != null) s.push(v); } s.sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
      const A0 = raw.map((g) => g && g.da), B0 = raw.map((g) => g && g.db);
      // median (removes spikes) then a gentle moving average (removes wobble) along the stroke
      const A1 = raw.map((g, i) => g ? (g.tip ? g.da : med(A0, i, 8)) : null), B1 = raw.map((g, i) => g ? (g.tip ? g.db : med(B0, i, 8)) : null);
      const avg = (arr, i, k) => { let s = 0, c = 0; for (let j = -k; j <= k; j++) { const v = arr[i + j]; if (v != null && !(raw[i + j] && raw[i + j].tip)) { s += v; c++; } } return c ? s / c : arr[i]; };
      const A = raw.map((g, i) => g ? (g.tip ? A1[i] : avg(A1, i, 6)) : null), B = raw.map((g, i) => g ? (g.tip ? B1[i] : avg(B1, i, 6)) : null);
      let rungs = [];
      raw.forEach((g, i) => {
        if (!g) { if (rungs.length) { columns.push({ rungs, closed: false }); rungs = []; } return; }
        const a = A[i], b = B[i];
        if (a + b < 0.15) return;
        rungs.push([[g.q[0] + g.n[0] * a, g.q[1] + g.n[1] * a], [g.q[0] - g.n[0] * b, g.q[1] - g.n[1] * b]]);
      });
      if (rungs.length) columns.push({ rungs, closed: ch.closed && rungs.length === pts.length });
      if (wmed > 9 && warn) warn('Some satin stitches are wider than 9 mm; they will be split. Fill may look better.');
    }
    // order columns
    const segs = [];
    let pos = start;
    const left = columns.filter((c) => c.rungs.length);
    while (left.length) {
      let bi = 0, bd = Infinity, rev = false;
      left.forEach((c, i) => {
        const s = lerp(c.rungs[0][0], c.rungs[0][1], 0.5), e = lerp(c.rungs[c.rungs.length - 1][0], c.rungs[c.rungs.length - 1][1], 0.5);
        const ds = pos ? dist(pos, s) : 0, de = pos ? dist(pos, e) : 1;
        if (ds < bd) { bd = ds; bi = i; rev = false; }
        if (!c.closed && de < bd) { bd = de; bi = i; rev = true; }
      });
      const c = left.splice(bi, 1)[0];
      let rungs = rev ? c.rungs.slice().reverse().map(([a, b]) => [b, a]) : c.rungs;
      const pts = satinFromRungs(rungs, { pull: p.pull, underlay: p.underlay !== 'none' && rungs.length > 6, heavy: p.underlay === 'heavy', rungStep: step, target: p.spacing / 2, outerFull: p.curveMode !== 'center', shortAmt: p.shortAmt, closed: c.closed });
      if (pts.length) { segs.push({ pts, phase: 'top', joinInside: true }); pos = pts[pts.length - 1]; }
    }
    return segs;
  }


  /* ---------- user-drawn satin paths ---------- */
  function catmull(pts, closed) {
    const n = pts.length;
    if (n < 2) return pts.slice();
    const P = (i) => {
      if (closed) return pts[(i + n) % n];
      if (i < 0) return [2 * pts[0][0] - pts[1][0], 2 * pts[0][1] - pts[1][1]];
      if (i >= n) return [2 * pts[n - 1][0] - pts[n - 2][0], 2 * pts[n - 1][1] - pts[n - 2][1]];
      return pts[i];
    };
    const out = [pts[0]];
    const marks = [0];
    const segsN = closed ? n : n - 1;
    const lerpP = (a, b, ta, tb, t) => { const d = tb - ta || 1e-9; return [a[0] + (b[0] - a[0]) * (t - ta) / d, a[1] + (b[1] - a[1]) * (t - ta) / d]; };
    for (let i = 0; i < segsN; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      // centripetal Catmull-Rom: no loops or overshoot at sharp corners
      const t0 = 0, t1 = t0 + Math.sqrt(Math.max(dist(p0, p1), 1e-6)), t2 = t1 + Math.sqrt(Math.max(dist(p1, p2), 1e-6)), t3 = t2 + Math.sqrt(Math.max(dist(p2, p3), 1e-6));
      const k = Math.max(4, Math.ceil(dist(p1, p2) / 0.15));
      for (let j = 1; j <= k; j++) {
        const t = t1 + (t2 - t1) * j / k;
        const A1 = lerpP(p0, p1, t0, t1, t), A2 = lerpP(p1, p2, t1, t2, t), A3 = lerpP(p2, p3, t2, t3, t);
        const B1 = lerpP(A1, A2, t0, t2, t), B2 = lerpP(A2, A3, t1, t3, t);
        out.push(lerpP(B1, B2, t1, t2, t));
      }
      marks.push(out.length - 1);
    }
    // arc length at each control point (for closed paths the last entry is the full loop)
    const cum = [0];
    for (let i = 1; i < out.length; i++) cum.push(cum[i - 1] + dist(out[i - 1], out[i]));
    const ctrlS = marks.map((m) => cum[m]);
    if (closed) out.pop();
    out.marks = marks;
    out.ctrlS = ctrlS;
    out.total = cum[cum.length - 1];
    return out;
  }

  /* turn the automatic centre-lines into editable guide paths */
  function autoGuides(rings, occ, p) {
    const { chains } = skeletonChains(rings, occ, { ...p, margin: p.margin ?? 0.3 });
    const guides = [];
    for (const ch of chains) {
      if (ch.pts.length < 2) continue;
      let pts = ch.closed ? simplify(ch.pts, 0.2, true) : dp(ch.pts, 0.2);
      if (pts.length < 2) continue;
      if (ch.closed && pts.length < 3) continue;
      guides.push({ pts: pts.map((q) => [+q[0].toFixed(3), +q[1].toFixed(3)]), closed: ch.closed });
    }
    // order: greedy nearest, starting top-left
    const out = [];
    let pos = null;
    const left = guides.slice();
    while (left.length) {
      let bi = 0, bd = Infinity, rev = false;
      left.forEach((g, i) => {
        const s = g.pts[0], e = g.pts[g.pts.length - 1];
        const ds = pos ? dist(pos, s) : s[0] + s[1], de = pos ? dist(pos, e) : e[0] + e[1];
        if (ds < bd) { bd = ds; bi = i; rev = false; }
        if (!g.closed && de < bd) { bd = de; bi = i; rev = true; }
      });
      const g = left.splice(bi, 1)[0];
      if (rev) g.pts.reverse();
      out.push(g);
      pos = g.pts[g.pts.length - 1];
    }
    return out;
  }

  /* Build the rungs of one guide path. The column starts exactly at the first point and ends
     exactly at the last one. Width either follows the shape edges or comes from g.w (per point). */
  function guideRungs(ctx, g, dl, step) {
    const { idx, oidx, rings, margin } = ctx;
    const closed = !!g.closed;
    const dense = catmull(g.pts, closed);
    const L = dense.total;
    if (!(L > 1e-6)) return null;
    const pts = resample(dense, step, closed);
    const n = pts.length;
    const st = closed ? L / n : L / Math.max(1, n - 1);
    const S = pts.map((_, i) => i * st);
    const ctrlS = dense.ctrlS;
    const W = g.w ? (closed ? g.w.concat([g.w[0]]) : g.w) : null;
    const widthAt = (sv) => {
      if (!W) return null;
      let j = 0;
      while (j < ctrlS.length - 2 && ctrlS[j + 1] < sv) j++;
      const span = ctrlS[j + 1] - ctrlS[j] || 1;
      const t = clamp((sv - ctrlS[j]) / span, 0, 1);
      return W[j] + (W[Math.min(j + 1, W.length - 1)] - W[j]) * t;
    };
    const ctrlIdx = ctrlS.slice(0, g.pts.length).map((sv) => clamp(Math.round(sv / st), 0, n - 1));
    const T = tangents(pts, Math.max(2, Math.round(0.5 / step)), closed);
    const dirAt = (i) => {
      const t = T[i];
      if (!dl || !dl.length) return [-t[1], t[0]];
      let th;
      if (i <= dl[0].i) th = dl[0].th;
      else if (i >= dl[dl.length - 1].i) th = dl[dl.length - 1].th;
      else {
        let k = 0; while (k < dl.length - 2 && dl[k + 1].i <= i) k++;
        const u = (i - dl[k].i) / Math.max(1, dl[k + 1].i - dl[k].i);
        const a = dl[k].th; let b = dl[k + 1].th;
        while (b - a > Math.PI / 2) b -= Math.PI;
        while (b - a < -Math.PI / 2) b += Math.PI;
        th = a + (b - a) * u;
      }
      let d = [Math.cos(th), Math.sin(th)];
      if (t[0] * d[1] - t[1] * d[0] < 0) d = [-d[0], -d[1]];
      return d;
    };
    const widen = (g.widen || 0) / 2;
    const E = g.e && g.e.length === g.pts.length ? (closed ? g.e.concat([g.e[0]]) : g.e) : null;
    if (E) {
      // free edges: each dot stores where its two edge points sit, in the path's own frame
      // (along the path, across the path). Blend between dots by distance along the path.
      const edgeAt = (sv) => {
        let j = 0;
        while (j < ctrlS.length - 2 && ctrlS[j + 1] < sv) j++;
        const span = ctrlS[j + 1] - ctrlS[j] || 1;
        const t = clamp((sv - ctrlS[j]) / span, 0, 1);
        const A = E[j], B = E[Math.min(j + 1, E.length - 1)];
        return A.map((v, k) => v + (B[k] - v) * t);
      };
      const rungs = pts.map((q, i) => {
        const T0 = T[i], N0 = [-T0[1], T0[0]];
        const [ta, na, tb, nb] = edgeAt(S[i]);
        let a = [q[0] + T0[0] * ta + N0[0] * na, q[1] + T0[1] * ta + N0[1] * na];
        let b = [q[0] + T0[0] * tb + N0[0] * nb, q[1] + T0[1] * tb + N0[1] * nb];
        if (widen) {
          const L = dist(a, b) || 1, ux = (a[0] - b[0]) / L, uy = (a[1] - b[1]) / L;
          a = [a[0] + ux * widen, a[1] + uy * widen]; b = [b[0] - ux * widen, b[1] - uy * widen];
        }
        return [a, b];
      });
      return { pts, rungs, ctrlIdx, closed, T, outside: false };
    }
    const cast = (q, d) => {
      let a = idx.ray(q[0], q[1], d[0], d[1], 40);
      if (oidx) { const o = oidx.ray(q[0], q[1], d[0], d[1], 40); if (o + margin < a) a = o + margin; }
      return a;
    };
    const raw = pts.map((q, i) => {
      const d = dirAt(i);
      const slant = Math.max(0.3, Math.abs(d[0] * -T[i][1] + d[1] * T[i][0]));
      if (W) {
        const h = Math.max(0.05, widthAt(S[i]) / 2 + widen) / slant;
        return { q, d, a: h, b: h };
      }
      if (!pointInRings(q[0], q[1], rings)) return { q, d, a: 0.05, b: 0.05, outside: true };
      let a = cast(q, d), b = cast(q, [-d[0], -d[1]]);
      const lim = (1.35 * idx.nearest(q[0], q[1]) + 0.15) / slant;
      return { q, d, a, b, lim };
    });
    if (!W) {
      const ws = raw.filter((r) => !r.outside).map((r) => r.a + r.b).sort((x, y) => x - y);
      const wmed = ws.length ? ws[Math.floor(ws.length / 2)] : 0;
      for (const r of raw) if (r.lim != null) { const Lm = Math.max(r.lim, 0.6 * wmed); r.a = Math.min(r.a, Lm); r.b = Math.min(r.b, Lm); }
      const A = raw.map((r) => r.a), B = raw.map((r) => r.b);
      const med = (arr, i) => { const v = []; for (let j = -8; j <= 8; j++) if (arr[i + j] != null) v.push(arr[i + j]); v.sort((x, y) => x - y); return v[Math.floor(v.length / 2)]; };
      raw.forEach((r, i) => { r.a = Math.max(0.05, med(A, i) + widen / (Math.abs(r.d[0] * -T[i][1] + r.d[1] * T[i][0]) || 1)); r.b = Math.max(0.05, med(B, i) + widen / (Math.abs(r.d[0] * -T[i][1] + r.d[1] * T[i][0]) || 1)); });
    }
    const rungs = raw.map((r) => [[r.q[0] + r.d[0] * r.a, r.q[1] + r.d[1] * r.a], [r.q[0] - r.d[0] * r.b, r.q[1] - r.d[1] * r.b]]);
    return { pts, rungs, ctrlIdx, closed, T, outside: raw.some((r) => r.outside) };
  }
  function guideCtx(rings, occ, margin) {
    const occE = [];
    for (const o of occ || []) occE.push(...edgeList(o));
    return { rings, idx: edgeIndex(edgeList(rings)), oidx: occE.length ? edgeIndex(occE) : null, margin: margin ?? 0.3 };
  }
  function assignDirs(G, dirs) {
    const D = G.map(() => []);
    for (const d of dirs || []) {
      const m = lerp(d.a, d.b, 0.5);
      let bg = -1, bi = 0, bd = Infinity;
      G.forEach((g, gi) => { if (g && !g.skipDirs) g.forEach((q, i) => { const dd = dist(q, m); if (dd < bd) { bd = dd; bg = gi; bi = i; } }); });
      if (bg >= 0) D[bg].push({ i: bi, th: Math.atan2(d.b[1] - d.a[1], d.b[0] - d.a[0]) });
    }
    return D.map((x) => x.sort((a, b) => a.i - b.i));
  }
  /* rails for drawing on screen (coarser) */
  function guidePreview(rings, occ, guides, dirs) {
    const ctx = guideCtx(rings, occ);
    const step = 0.25;
    const dense = guides.map((g) => { if (g.pts.length < 2) return null; const d = resample(catmull(g.pts, !!g.closed), step, !!g.closed); if (g.e) d.skipDirs = true; return d; });
    const D = assignDirs(dense, dirs);
    return guides.map((g, gi) => {
      if (g.pts.length < 2) return null;
      const r = guideRungs(ctx, g, D[gi], step);
      if (!r) return null;
      return { left: r.rungs.map((x) => x[0]), right: r.rungs.map((x) => x[1]), handles: r.ctrlIdx.map((k) => r.rungs[k]), closed: r.closed };
    });
  }
  /* current edge points of every dot, as offsets in the path's own frame [along a, across a, along b, across b] */
  function captureEdges(rings, occ, g, dirs) {
    const ctx = guideCtx(rings, occ);
    const step = 0.1;
    const dense = [resample(catmull(g.pts, !!g.closed), step, !!g.closed)];
    const D = assignDirs(dense, dirs);
    const r = guideRungs(ctx, g, D[0], step);
    if (!r) return g.pts.map(() => [0, 1, 0, -1]);
    return r.ctrlIdx.map((k, pi) => {
      const q = g.pts[pi], T0 = r.T[k], N0 = [-T0[1], T0[0]];
      const [a, b] = r.rungs[k];
      const da = [a[0] - q[0], a[1] - q[1]], db = [b[0] - q[0], b[1] - q[1]];
      const f = (v) => +v.toFixed(3);
      return [f(da[0] * T0[0] + da[1] * T0[1]), f(da[0] * N0[0] + da[1] * N0[1]), f(db[0] * T0[0] + db[1] * T0[1]), f(db[0] * N0[0] + db[1] * N0[1])];
    });
  }
  /* the path's direction at each dot (for turning a mouse position into an edge offset) */
  function ctrlFrames(g) {
    const step = 0.1;
    const dense = catmull(g.pts, !!g.closed);
    const pts = resample(dense, step, !!g.closed);
    const n = pts.length, L = dense.total;
    const st = g.closed ? L / n : L / Math.max(1, n - 1);
    const T = tangents(pts, Math.max(2, Math.round(0.5 / step)), !!g.closed);
    return dense.ctrlS.slice(0, g.pts.length).map((sv, pi) => { const k = clamp(Math.round(sv / st), 0, n - 1); return { q: g.pts[pi], T: T[k], N: [-T[k][1], T[k][0]] }; });
  }
  /* width of the shape across a path at each of its points */
  function measureWidths(rings, occ, pts, closed) {
    const ctx = guideCtx(rings, occ);
    const r = guideRungs(ctx, { pts, closed }, null, 0.1);
    if (!r) return pts.map(() => 2);
    return r.ctrlIdx.map((k) => { const w = dist(r.rungs[k][0], r.rungs[k][1]); return +clamp(w, 0.3, 12).toFixed(2); });
  }

  function genSatinGuides(rings, occ, guides, dirs, p, warn) {
    const ctx = guideCtx(rings, occ, p.margin);
    const step = p.spacing / 2 / 4;
    const valid = guides.filter((g) => g.pts && g.pts.length >= 2);
    const dense = valid.map((g) => { const d = resample(catmull(g.pts, !!g.closed), step, !!g.closed); if (g.e) d.skipDirs = true; return d; });
    const D = assignDirs(dense, dirs);
    const segs = [];
    let outside = false;
    valid.forEach((g, gi) => {
      const r = guideRungs(ctx, g, D[gi], step);
      if (!r || r.rungs.length < 2) return;
      if (r.outside) outside = true;
      const out = satinFromRungs(r.rungs, { pull: p.pull, underlay: p.underlay !== 'none' && r.rungs.length > 6, heavy: p.underlay === 'heavy', rungStep: step, target: p.spacing / 2, outerFull: p.curveMode !== 'center', shortAmt: p.shortAmt, closed: r.closed, endForward: true });
      if (out.length) segs.push({ pts: out, phase: 'top', joinInside: true });
    });
    if (outside && warn) warn('Part of a satin path that follows the shape runs outside it. Drag its dots back inside, or switch that path to "My widths".');
    return segs;
  }


  /* ===================== satin columns: two rails + rungs (like Ink/Stitch) ===================== */
  function nearestOnRings(rings, p, only) {
    let best = { d: Infinity };
    rings.forEach((r, ri) => {
      if (only != null && ri !== only) return;
      for (let i = 0; i < r.length; i++) {
        const a = r[i], b = r[(i + 1) % r.length];
        const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy;
        const t = L ? clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L, 0, 1) : 0;
        const q = [a[0] + dx * t, a[1] + dy * t];
        const d = dist(p, q);
        if (d < best.d) best = { d, ri, ei: i, t, pt: q };
      }
    });
    return best;
  }
  /* walk along the shape outline from p to q (the shorter way round) */
  function edgePath(rings, p, q, tol = 2.5) {
    const P = nearestOnRings(rings, p);
    if (!(P.d <= tol)) return [p, q];
    const Q = nearestOnRings(rings, q, P.ri);
    if (!(Q.d <= tol)) return [p, q];
    const r = rings[P.ri], n = r.length;
    const fwd = [P.pt], back = [P.pt];
    // forward: increasing vertex index
    if (Q.ei === P.ei && Q.t >= P.t) fwd.push(Q.pt);
    else {
      let i = P.ei;
      for (let guard = 0; guard <= n; guard++) { i = (i + 1) % n; fwd.push(r[i]); if (i === Q.ei) break; }
      fwd.push(Q.pt);
    }
    if (Q.ei === P.ei && Q.t <= P.t) back.push(Q.pt);
    else {
      let i = P.ei;
      back.push(r[i]);
      for (let guard = 0; guard <= n && i !== (Q.ei + 1) % n; guard++) { i = (i - 1 + n) % n; back.push(r[i]); }
      back.pop();
      if (back.length && back[back.length - 1] !== r[(Q.ei + 1) % n]) back.push(r[(Q.ei + 1) % n]);
      back.push(Q.pt);
    }
    return pathLength(fwd, false) <= pathLength(back, false) ? fwd : back;
  }
  function snapToEdge(rings, p, tol) {
    const P = nearestOnRings(rings, p);
    return P.d <= tol ? P.pt : null;
  }
  /* Bezier handles on rail dots (like CorelDRAW). handles[i] = { in: [dx,dy], out: [dx,dy], cusp } as offsets
     from the dot; missing handles are worked out automatically so the curve flows smoothly. */
  function nodeHandles(rail, i) {
    const pts = rail.pts, n = pts.length, closed = !!rail.closed && n >= 3;
    const p = pts[i];
    const prev = closed ? pts[(i - 1 + n) % n] : pts[Math.max(0, i - 1)];
    const next = closed ? pts[(i + 1) % n] : pts[Math.min(n - 1, i + 1)];
    const ends = !closed && (i === 0 || i === n - 1);
    let m = [(next[0] - prev[0]) / (ends ? 1 : 2), (next[1] - prev[1]) / (ends ? 1 : 2)];
    const ml = Math.hypot(m[0], m[1]) || 1;
    const lin = dist(prev, p), lout = dist(p, next);
    const auto = { out: [m[0] / ml * lout / 3, m[1] / ml * lout / 3], in: [-m[0] / ml * lin / 3, -m[1] / ml * lin / 3] };
    const h = rail.handles && rail.handles[i];
    return { in: (h && h.in) || auto.in, out: (h && h.out) || auto.out, cusp: !!(h && h.cusp), custom: !!h };
  }
  function bezierPts(p0, c1, c2, p3) {
    const L = dist(p0, c1) + dist(c1, c2) + dist(c2, p3);
    const k = Math.max(4, Math.ceil(L / 0.15));
    const out = [];
    for (let j = 1; j <= k; j++) {
      const t = j / k, u = 1 - t;
      out.push([u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p3[1]]);
    }
    return out;
  }
  /* rail = { pts: [clicked points], modes: [one per segment: 'edge' | 'curve' | 'line'], closed, handles } */
  function railDense(rail, rings) {
    const pts = rail.pts || [];
    if (pts.length < 2) return pts.slice();
    const closed = !!rail.closed && pts.length >= 3;
    const cm = catmull(pts, closed);
    const marks = cm.marks;
    const segN = closed ? pts.length : pts.length - 1;
    const out = [pts[0]];
    for (let i = 0; i < segN; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const mode = (rail.modes && rail.modes[i]) || 'curve';
      let seg;
      if (mode === 'edge') seg = edgePath(rings, a, b);
      else if (mode === 'line') seg = [a, b];
      else {
        const ha = nodeHandles(rail, i), hb = nodeHandles(rail, (i + 1) % pts.length);
        seg = [a].concat(bezierPts(a, [a[0] + ha.out[0], a[1] + ha.out[1]], [b[0] + hb.in[0], b[1] + hb.in[1]], b));
      }
      for (let k = 1; k < seg.length; k++) if (dist(out[out.length - 1], seg[k]) > 1e-4) out.push(seg[k]);
    }
    if (closed && dist(out[0], out[out.length - 1]) < 1e-4) out.pop();
    return out;
  }
  function cumLen(P, closed) {
    const c = [0];
    for (let i = 1; i < P.length; i++) c.push(c[i - 1] + dist(P[i - 1], P[i]));
    if (closed) c.push(c[c.length - 1] + dist(P[P.length - 1], P[0]));
    return c;
  }
  function pointAt(P, C, s, closed) {
    const n = P.length, total = C[C.length - 1];
    if (closed) s = ((s % total) + total) % total; else s = clamp(s, 0, total);
    let lo = 0, hi = C.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (C[m] <= s) lo = m; else hi = m; }
    const a = P[lo % n], b = P[(lo + 1) % n];
    const span = C[lo + 1] - C[lo] || 1;
    return lerp(a, b, (s - C[lo]) / span);
  }
  function projectS(P, C, p, closed) {
    let best = Infinity, bs = 0;
    const segN = closed ? P.length : P.length - 1;
    for (let i = 0; i < segN; i++) {
      const a = P[i], b = P[(i + 1) % P.length];
      const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy;
      const t = L ? clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L, 0, 1) : 0;
      const d = Math.hypot(a[0] + dx * t - p[0], a[1] + dy * t - p[1]);
      if (d < best) { best = d; bs = C[i] + t * Math.sqrt(L); }
    }
    return { s: bs, d: best };
  }
  /* resolve a column into matched rails and rung positions */
  function columnLayout(rings, col) {
    let A = railDense(col.A, rings), B = railDense(col.B, rings);
    if (A.length < 2 || B.length < 2) return null;
    const closed = !!(col.A.closed && col.B.closed && A.length >= 3 && B.length >= 3);
    if (!closed) {
      if (dist(A[0], B[0]) + dist(A[A.length - 1], B[B.length - 1]) > dist(A[0], B[B.length - 1]) + dist(A[A.length - 1], B[0])) B = B.slice().reverse();
    } else {
      // same winding, and start B at the point nearest A's start
      if (Math.sign(ringArea(A)) !== Math.sign(ringArea(B))) B = B.slice().reverse();
      let k = 0, kd = Infinity;
      B.forEach((q, i) => { const d = dist(q, A[0]); if (d < kd) { kd = d; k = i; } });
      B = B.slice(k).concat(B.slice(0, k));
    }
    const CA = cumLen(A, closed), CB = cumLen(B, closed);
    const LA = CA[CA.length - 1], LB = CB[CB.length - 1];
    const rungs = [];
    for (const r of col.rungs || []) {
      // which end of the rung belongs to which rail
      const a1 = projectS(A, CA, r.a, closed), b1 = projectS(B, CB, r.b, closed);
      const a2 = projectS(A, CA, r.b, closed), b2 = projectS(B, CB, r.a, closed);
      const pick = a1.d + b1.d <= a2.d + b2.d ? [a1, b1] : [a2, b2];
      rungs.push({ sA: pick[0].s, sB: pick[1].s, src: r });
    }
    rungs.sort((x, y) => x.sA - y.sA);
    const marks = [{ sA: 0, sB: 0 }];
    for (const r of rungs) {
      const last = marks[marks.length - 1];
      if (r.sA > last.sA + 0.05 && r.sB > last.sB + 0.05 && r.sA < LA - 0.05 && r.sB < LB - 0.05) marks.push(r);
      else r.ignored = true;
    }
    marks.push({ sA: LA, sB: LB });
    return { A, B, CA, CB, LA, LB, closed, marks, rungs };
  }
  // nearest point on a rail, looking only between rail positions s0 and s1 (closed rails may wrap past the end)
  function projectWin(P, C, p, closed, s0, s1) {
    const total = C[C.length - 1];
    const segN = closed ? P.length : P.length - 1;
    let best = Infinity, bs = (s0 + s1) / 2;
    for (const shift of closed ? [-total, 0, total] : [0]) {
      for (let i = 0; i < segN; i++) {
        const lo = C[i] + shift, hi = C[i + 1] + shift;
        if (hi < s0 || lo > s1) continue;
        const a = P[i], b = P[(i + 1) % P.length];
        const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy, L = Math.sqrt(L2);
        let t = L2 ? clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2, 0, 1) : 0;
        let sv = lo + t * L;
        if (sv < s0) { sv = s0; t = L ? (s0 - lo) / L : 0; } else if (sv > s1) { sv = s1; t = L ? (s1 - lo) / L : 0; }
        const d = Math.hypot(a[0] + dx * t - p[0], a[1] + dy * t - p[1]);
        if (d < best) { best = d; bs = sv; }
      }
    }
    return bs;
  }
  /* How the two rails are matched between two rungs (or a rung and an end). Each point on one rail is
     matched to the nearest point on the other, from both sides, and the two are averaged: the stitches then
     cross the column at right angles to the rails, as far as the rails allow, instead of splitting each rail
     evenly (which leans the stitches wherever one rail is longer, as on the outside of a curve). */
  function perpMatch(lay, m0, m1, h) {
    const { A, B, CA, CB, closed } = lay;
    const a0 = m0.sA, a1 = m1.sA, b0 = m0.sB, b1 = m1.sB;
    const dA = a1 - a0, dB = b1 - b0;
    const nA = Math.max(2, Math.min(600, Math.ceil(dA / h))), nB = Math.max(2, Math.min(600, Math.ceil(dB / h)));
    if (dA < 0.3 || dB < 0.3) return null;
    const SA = [], F1 = [];
    // only look near where an even split would put the match: stops a stitch jumping across the start of a
    // loop or to the far side of a U-shaped stroke
    const WB = Math.max(4, 0.35 * dB), WA = Math.max(4, 0.35 * dA);
    for (let i = 0; i <= nA; i++) {
      const sa = a0 + dA * i / nA, g = b0 + dB * i / nA;
      SA.push(sa); F1.push(projectWin(B, CB, pointAt(A, CA, sa, closed), closed, Math.max(b0, g - WB), Math.min(b1, g + WB)));
    }
    // from the other rail: each point of B to its nearest on A, kept in order
    const PA = [], PB = [];
    let run = a0;
    for (let j = 0; j <= nB; j++) {
      const sb = b0 + dB * j / nB, g = a0 + dA * j / nB;
      run = Math.max(run, projectWin(A, CA, pointAt(B, CB, sb, closed), closed, Math.max(a0, g - WA), Math.min(a1, g + WA)));
      PA.push(run); PB.push(sb);
    }
    const F2 = SA.map((sa) => {
      if (sa <= PA[0]) return PB[0];
      if (sa >= PA[PA.length - 1]) return PB[PB.length - 1];
      let lo = 0, hi = PA.length - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (PA[m] < sa) lo = m; else hi = m; }
      const span = PA[hi] - PA[lo];
      return span > 1e-9 ? PB[lo] + (PB[hi] - PB[lo]) * (sa - PA[lo]) / span : PB[hi];
    });
    let F = F1.map((v, i) => (v + F2[i]) / 2);
    // pin both ends to the rungs, then keep it running forwards
    const e0 = b0 - F[0], e1 = b1 - F[F.length - 1];
    F = F.map((v, i) => v + e0 + (e1 - e0) * i / nA);
    for (let i = 1; i < F.length; i++) F[i] = Math.max(F[i], F[i - 1]);
    F = F.map((v) => clamp(v, b0, b1));
    if (F.some((v) => !isFinite(v))) return null;
    return SA.map((sa, i) => [sa, F[i]]);
  }
  function columnRungs(lay, step) {
    const out = [];
    const { A, B, CA, CB, closed, marks } = lay;
    for (let k = 0; k + 1 < marks.length; k++) {
      const m0 = marks[k], m1 = marks[k + 1];
      const dA = m1.sA - m0.sA, dB = m1.sB - m0.sB;
      const M = perpMatch(lay, m0, m1, 0.25);
      if (!M) {
        const n = Math.max(1, Math.ceil(Math.max(dA, dB) / step));
        for (let i = 0; i < n; i++) out.push([pointAt(A, CA, m0.sA + dA * i / n, closed), pointAt(B, CB, m0.sB + dB * i / n, closed)]);
        continue;
      }
      // even spacing along whichever rail moves more, so the outside of a curve stays dense
      const D = [0];
      for (let i = 1; i < M.length; i++) D.push(D[i - 1] + Math.max(M[i][0] - M[i - 1][0], M[i][1] - M[i - 1][1], 1e-6));
      const tot = D[D.length - 1];
      const n = Math.max(1, Math.ceil(tot / step));
      let j = 0;
      for (let i = 0; i < n; i++) {
        const d = tot * i / n;
        while (j < D.length - 2 && D[j + 1] < d) j++;
        const t = (d - D[j]) / ((D[j + 1] - D[j]) || 1);
        const sa = M[j][0] + (M[j + 1][0] - M[j][0]) * t, sb = M[j][1] + (M[j + 1][1] - M[j][1]) * t;
        out.push([pointAt(A, CA, sa, closed), pointAt(B, CB, sb, closed)]);
      }
    }
    if (!closed) { const e = marks[marks.length - 1]; out.push([pointAt(A, CA, e.sA, false), pointAt(B, CB, e.sB, false)]); }
    return out;
  }
  function railSnap(P, p, closed) { const C = cumLen(P, closed); return pointAt(P, C, projectS(P, C, p, closed).s, closed); }
  function railSlide(P, p, ds, closed) { const C = cumLen(P, closed); return pointAt(P, C, projectS(P, C, p, closed).s + ds, closed); }
  function columnPreview(rings, col) {
    const lay = columnLayout(rings, col);
    if (!lay) return null;
    const dirs = columnRungs(lay, 0.9);
    return {
      A: lay.A, B: lay.B, closed: lay.closed, dirs,
      start: lay.closed ? null : [lay.A[0], lay.B[0]], end: lay.closed ? null : [lay.A[lay.A.length - 1], lay.B[lay.B.length - 1]],
      rungs: lay.rungs.map((r) => ({ a: pointAt(lay.A, lay.CA, r.sA, lay.closed), b: pointAt(lay.B, lay.CB, r.sB, lay.closed), ignored: !!r.ignored })),
    };
  }
  function genColumns(rings, cols, p, warn) {
    const step = p.spacing / 2 / 4;
    const segs = [];
    let ignored = false;
    for (const col of cols) {
      const lay = columnLayout(rings, col);
      if (!lay) continue;
      if (lay.rungs.some((r) => r.ignored)) ignored = true;
      const rungs = columnRungs(lay, step);
      if (rungs.length < 2) continue;
      const out = satinFromRungs(rungs, { pull: p.pull, underlay: p.underlay !== 'none' && rungs.length > 6, heavy: p.underlay === 'heavy', rungStep: step, target: p.spacing / 2, outerFull: p.curveMode !== 'center', shortAmt: p.shortAmt, closed: lay.closed, endForward: true });
      if (out.length) segs.push({ pts: out, phase: 'top', joinInside: true });
    }
    if (ignored && warn) warn('A rung crosses another rung or sits past the end of a rail, so it is ignored (shown faded).');
    return segs;
  }
  /* a traced satin border: a rail with a width, sitting inside, on, or outside the line */
  function borderPath(rings, b) {
    let P = railDense(b.R, rings);
    const closed = !!b.R.closed && P.length >= 3;
    if (P.length < 2) return null;
    P = resample(P, 0.2, closed);
    if (P.length < 2) return null;
    const T = tangents(P, 3, closed);
    const N = T.map((t) => [-t[1], t[0]]);
    // which side of the line is the shape?
    let inPlus = 0, inMinus = 0;
    P.forEach((q, i) => {
      if (i % 3) return;
      if (pointInRings(q[0] + N[i][0] * 0.4, q[1] + N[i][1] * 0.4, rings)) inPlus++;
      if (pointInRings(q[0] - N[i][0] * 0.4, q[1] - N[i][1] * 0.4, rings)) inMinus++;
    });
    const inward = inPlus >= inMinus ? 1 : -1;
    const w = b.width || 1.5;
    const shift = b.align === 'inside' ? inward * w / 2 : b.align === 'outside' ? -inward * w / 2 : 0;
    const pts = shift ? P.map((q, i) => [q[0] + N[i][0] * shift, q[1] + N[i][1] * shift]) : P;
    return { pts, closed, w };
  }
  function genBorders(rings, borders, P) {
    const segs = [];
    for (const b of borders || []) {
      const bp = borderPath(rings, b);
      if (!bp) continue;
      segs.push(...genStrokeSatin([{ pts: bp.pts, closed: bp.closed }], bp.w, P, null, { edgeRun: b.edgeRun, insideFn: (q) => pointInRings(q[0], q[1], rings) }));
    }
    return segs;
  }
  function borderPreview(rings, b) {
    const bp = borderPath(rings, b);
    if (!bp) return null;
    const T = tangents(bp.pts, 3, bp.closed);
    const h = bp.w / 2;
    return { mid: bp.pts, left: bp.pts.map((q, i) => [q[0] - T[i][1] * h, q[1] + T[i][0] * h]), right: bp.pts.map((q, i) => [q[0] + T[i][1] * h, q[1] - T[i][0] * h]), closed: bp.closed };
  }

  /* convert the automatic satin into editable columns */
  function autoColumns(rings, occ, p) {
    const guides = autoGuides(rings, occ, p);
    const ctx = guideCtx(rings, occ, p.margin);
    const onEdge = (q) => nearestOnRings(rings, q).d < 0.06;
    const cols = [];
    for (const g0 of guides) {
      const g = { pts: g0.pts.map((q) => q.slice()), closed: g0.closed };
      // reach out to the tips of open strokes
      if (!g.closed && g.pts.length >= 2) {
        for (const atStart of [true, false]) {
          const n = g.pts.length;
          const e = atStart ? g.pts[0] : g.pts[n - 1], q = atStart ? g.pts[1] : g.pts[n - 2];
          let dx = e[0] - q[0], dy = e[1] - q[1]; const L = Math.hypot(dx, dy); if (L < 1e-9) continue;
          dx /= L; dy /= L;
          const h = (ctx.idx.ray(e[0], e[1], -dy, dx, 40) + ctx.idx.ray(e[0], e[1], dy, -dx, 40)) / 2;
          const ext = ctx.idx.ray(e[0], e[1], dx, dy, 40);
          if (ext < 1.6 * h + 0.6 && ext > 0.25) {
            const np = [e[0] + dx * (ext - 0.15), e[1] + dy * (ext - 0.15)];
            if (atStart) g.pts[0] = np; else g.pts[n - 1] = np;
          }
        }
      }
      const r = guideRungs(ctx, g, null, 0.1);
      if (!r || r.rungs.length < 3) continue;
      const mk = (side) => {
        let P = r.rungs.map((x) => x[side]);
        P = g.closed ? simplify(P, 0.25, true) : dp(P, 0.25);
        const modes = [];
        const segN = g.closed ? P.length : P.length - 1;
        for (let i = 0; i < segN; i++) {
          const a = P[i], b = P[(i + 1) % P.length];
          modes.push(onEdge(a) && onEdge(b) && onEdge(lerp(a, b, 0.5)) ? 'edge' : 'line');
        }
        return { pts: P.map((q) => [+q[0].toFixed(3), +q[1].toFixed(3)]), modes, closed: !!g.closed };
      };
      // a few rungs: wherever the stitch angle has turned noticeably since the last one
      const rungs = [];
      const ang = (k) => { const [a, b] = r.rungs[k]; return Math.atan2(b[1] - a[1], b[0] - a[0]); };
      const mid = (k) => lerp(r.rungs[k][0], r.rungs[k][1], 0.5);
      let last = 0;
      const n = r.rungs.length;
      for (let k = 1; k < n - 1; k++) {
        let d = Math.abs(ang(k) - ang(last)); if (d > Math.PI) d = 2 * Math.PI - d;
        const far = dist(mid(k), mid(last));
        if ((d > 0.75 && far > 1.5) || far > 12) {
          if (dist(mid(k), mid(n - 1)) < 1.5 && !g.closed) break;
          rungs.push({ a: r.rungs[k][0], b: r.rungs[k][1] }); last = k;
        }
      }
      const A = mk(0), B = mk(1);
      cols.push({ A, B, rungs });
    }
    return cols;
  }
  /* satin column along an open/closed path with a fixed width */
  function genStrokeSatin(paths, width, p, start, opts = {}) {
    const er = opts.edgeRun && opts.edgeRun.on ? opts.edgeRun : null;
    const step = p.spacing / 2 / 4;
    const segs = [];
    let pos = start;
    const left = paths.filter((q) => q.pts.length >= 2);
    while (left.length) {
      let bi = 0, bd = Infinity, rev = false;
      left.forEach((q, i) => {
        const ds = pos ? dist(pos, q.pts[0]) : 0, de = pos ? dist(pos, q.pts[q.pts.length - 1]) : 1;
        if (ds < bd) { bd = ds; bi = i; rev = false; }
        if (!q.closed && de < bd) { bd = de; bi = i; rev = true; }
      });
      const q = left.splice(bi, 1)[0];
      let P = rev ? q.pts.slice().reverse() : q.pts;
      P = resample(P, step, q.closed);
      if (P.length < 2) continue;
      const T = tangents(P, Math.max(2, Math.round(Math.min(0.6, width * 0.4) / step)), q.closed);
      const h = width / 2;
      const rungs = P.map((c, i) => {
        const nx = -T[i][1], ny = T[i][0];
        return [[c[0] + nx * h, c[1] + ny * h], [c[0] - nx * h, c[1] - ny * h]];
      });
      const pts = satinFromRungs(rungs, { pull: p.pull, underlay: p.underlay !== 'none' && width > 1.4, heavy: p.underlay === 'heavy', rungStep: step, target: p.spacing / 2, outerFull: p.curveMode !== 'center', shortAmt: p.shortAmt, closed: q.closed });
      // running stitch along an edge of the satin (patch style)
      const runs = [];
      if (er) {
        // which rail is "inside": for a shape border, the side inside the shape; for a closed line, the side
        // inside the loop; for an open line, the side its curve bends towards
        const ins = opts.insideFn || ((pt) => q.closed ? pointInRing(pt[0], pt[1], P) : null);
        let aIn = 0, bIn = 0;
        rungs.forEach(([a, b], i) => { if (i % 5) return; const ia = ins(a), ib = ins(b); if (ia === true) aIn++; if (ib === true) bIn++; });
        if (!aIn && !bIn) { const bb = bbox([P]); const c = [(bb.x0 + bb.x1) / 2, (bb.y0 + bb.y1) / 2]; const k = Math.floor(rungs.length / 2); aIn = dist(rungs[k][0], c) < dist(rungs[k][1], c) ? 1 : 0; bIn = 1 - aIn; }
        const insideSide = aIn >= bIn ? 0 : 1;
        const sides = er.side === 'both' ? [0, 1] : er.side === 'outside' ? [1 - insideSide] : [insideSide];
        for (const sd of sides) {
          // under: tucked 0.3 mm in from the satin edge (covered). beside: 0.5 mm out from it (visible).
          const off = er.mode === 'beside' ? -(0.5 + (p.pull || 0)) : 0.3;
          const rail = rungs.map((r) => {
            const e = r[sd], o = r[1 - sd];
            const L = dist(e, o) || 1;
            return [e[0] + (o[0] - e[0]) / L * off, e[1] + (o[1] - e[1]) / L * off];
          });
          let R = rail;
          if (q.closed) { let k = 0, bd = Infinity; R.forEach((v, i) => { const d = dist(v, pts[0]); if (d < bd) { bd = d; k = i; } }); R = R.slice(k).concat(R.slice(0, k)); }
          runs.push({ pts: runPath(R, q.closed, 2.0, !!er.triple), phase: er.mode === 'beside' ? 'top' : 'under' });
        }
      }
      if (er && er.mode !== 'beside') segs.push(...runs);
      segs.push({ pts, phase: 'top' });
      if (er && er.mode === 'beside') segs.push(...runs);
      pos = segs[segs.length - 1].pts[segs[segs.length - 1].pts.length - 1];
    }
    return segs;
  }
  function genRunning(paths, p, start) {
    const segs = [];
    let pos = start;
    const left = paths.filter((q) => q.pts.length >= 2);
    while (left.length) {
      let bi = 0, bd = Infinity, rev = false, rot = 0;
      left.forEach((q, i) => {
        if (q.closed) {
          // start at the vertex nearest to pos
          let k = 0, kd = Infinity;
          if (pos) q.pts.forEach((v, j) => { const d = dist(pos, v); if (d < kd) { kd = d; k = j; } }); else kd = 0;
          if (kd < bd) { bd = kd; bi = i; rev = false; rot = k; }
        } else {
          const ds = pos ? dist(pos, q.pts[0]) : 0, de = pos ? dist(pos, q.pts[q.pts.length - 1]) : 1;
          if (ds < bd) { bd = ds; bi = i; rev = false; }
          if (de < bd) { bd = de; bi = i; rev = true; }
        }
      });
      const q = left.splice(bi, 1)[0];
      let P = q.closed ? q.pts.slice(rot).concat(q.pts.slice(0, rot)) : (rev ? q.pts.slice().reverse() : q.pts);
      const pts = runPath(P, q.closed, p.runLen, p.triple);
      segs.push({ pts, phase: 'top' });
      pos = pts[pts.length - 1];
    }
    return segs;
  }

  /* ---------- per-object generation ---------- */
  function analyze(o) {
    if (o.kind === 'line') {
      const w = o.width;
      if (w >= 1.0) return { type: 'satin', why: `Line ${w.toFixed(1)} mm wide: satin column` };
      return { type: 'running', why: w >= 0.55 ? 'Thin line: triple running stitch' : 'Thin line: running stitch', triple: w >= 0.55 };
    }
    const area = ringsArea(o.rings);
    if (area < 0.6) return { type: 'skip', why: 'Too small to stitch' };
    const bb = bbox(o.rings);
    const idx = edgeIndex(edgeList(o.rings));
    let R = 0;
    const N = 36;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = bb.x0 + (i + 0.5) / N * bb.w, y = bb.y0 + (j + 0.5) / N * bb.h;
      if (!pointInRings(x, y, o.rings)) continue;
      const d = idx.nearest(x, y);
      if (d > R) R = d;
    }
    const D = 2 * R;
    const T = 2 * area / perimeter(o.rings);
    if (D < 0.8) return { type: 'running', why: 'Very thin detail: outline stitch' };
    if (D <= 6.5 || (T < 3.2 && D <= 8)) return { type: 'satin', why: `Narrow shape (about ${D.toFixed(1)} mm): satin` };
    return { type: 'fill', why: `Wide shape (${D.toFixed(0)} mm across): fill` };
  }

  function generate(o, occ, fab, start) {
    const warn = [];
    const addWarn = (m) => { if (!warn.includes(m)) warn.push(m); };
    const dens = { light: 1.25, normal: 1, dense: 0.85 }[o.params.density || 'normal'];
    const P = {
      spacing: o.params.spacing != null && o.type === 'satin' ? o.params.spacing : (o.type === 'fill' ? fab.fill : fab.satin) * dens,
      curveMode: o.params.curveMode || 'outer',
      shortAmt: o.params.shortAmt != null ? o.params.shortAmt : 0.3,
      pull: o.params.pull != null ? o.params.pull : fab.pull,
      underlay: o.params.underlay === false ? 'none' : fab.under,
      angle: o.params.angle ?? 45,
      stitchLen: 4.0,
      runLen: o.params.runLen || 2.5,
      triple: !!o.params.triple,
      margin: 0.3,
    };
    let segs = [];
    if (o.type === 'skip') {
      if (o.kind === 'area' && o.borders && o.borders.length) segs = genBorders(o.rings, o.borders, { ...P, spacing: fab.satin, underlay: 'light' }).filter((q) => q.pts.length >= 2);
      return { segs, warn };
    }
    if (o.kind === 'area') {
      if (o.type === 'fill') segs = genFill(o.rings, occ, P, start);
      else if (o.type === 'satin') {
        const dir = o.params.satinDir;
        if (dir === 'angle') segs = genSatinAngle(o.rings, occ, { ...P, angle: o.params.satinAngle ?? 0 }, start);
        else if (dir === 'columns' && o.columns && o.columns.length) segs = genColumns(o.rings, o.columns, P, addWarn);
        else if (dir === 'guides' && o.guides && o.guides.length) segs = genSatinGuides(o.rings, occ, o.guides, o.dirs || [], P, addWarn);
        else if (dir === 'columns') {
          addWarn('No columns yet, so nothing is stitched on this shape. Click on one edge of the stroke to start your first rail.');
        } else {
          if (dir === 'guides') addWarn('No satin paths drawn yet, so the automatic paths are used. Draw a path or start from the automatic ones.');
          segs = genSatinFollow(o.rings, occ, P, start, addWarn);
        }
      } else if (o.type === 'running') {
        segs = genRunning(o.rings.map((r) => ({ pts: r, closed: true })), P, start);
      }
      if (o.borders && o.borders.length) segs.push(...genBorders(o.rings, o.borders, { ...P, spacing: fab.satin, underlay: 'light' }));
      const border = o.params.border || 'none';
      if (border !== 'none' && o.type !== 'running') {
        const s0 = segs.length ? segs[segs.length - 1].pts.slice(-1)[0] : start;
        const rp = o.rings.map((r) => ({ pts: r, closed: true }));
        if (border === 'satin') segs.push(...genStrokeSatin(rp, o.params.borderWidth || 1.5, { ...P, spacing: fab.satin, underlay: 'light' }, s0, { edgeRun: o.params.edgeRun, insideFn: (q) => pointInRings(q[0], q[1], o.rings) }));
        else segs.push(...genRunning(rp, { ...P, runLen: 2.0, triple: border === 'triple' }, s0));
      }
    } else {
      if (o.type === 'satin') {
        if (o.width > 9) addWarn('This line is wider than 9 mm; satin stitches will be split.');
        segs = genStrokeSatin(o.paths, o.width, P, start, { edgeRun: o.params.edgeRun });
      } else if (o.type === 'running') segs = genRunning(o.paths, P, start);
    }
    segs = segs.filter((s) => s.pts.length >= 2);
    const n = segs.reduce((s, q) => s + q.pts.length, 0);
    var occOut = occ;
    if (o.type !== 'skip' && n === 0 && !warn.length) addWarn('Nothing to stitch here (it may be hidden under other shapes).');
    return { segs, warn, occ: occOut };
  }

  /* ---------- assembly: objects -> stitch list ---------- */
  // cmd: 0 stitch, 1 jump, 2 trim, 3 colour change
  function assemble(objs, results) {
    const X = [], Y = [], C = [], OBJ = [];
    const colors = [];
    let cur = null, curColor = null, started = false;
    const push = (p, c, oi) => { X.push(p[0]); Y.push(p[1]); C.push(c); OBJ.push(oi); };
    const stitchTo = (p, oi) => {
      if (cur) {
        const d = dist(cur, p);
        if (d < 0.12) return;
        if (d > 7.5) { const n = Math.ceil(d / 7); for (let j = 1; j < n; j++) push(lerp(cur, p, j / n), 0, oi); }
      }
      push(p, 0, oi); cur = p;
    };
    const tieOff = (oi) => {
      if (!cur || X.length < 2) return;
      const n = X.length;
      const prev = [X[n - 2], Y[n - 2]];
      const d = dist(prev, cur);
      if (d < 0.05) return;
      const b = lerp(cur, prev, Math.min(0.5, d) / d);
      push(b, 0, oi); push(cur, 0, oi);
    };
    const jumpTo = (p, oi) => { push(p, 1, oi); cur = p; };
    const tieIn = (p, next, oi) => {
      const d = next ? dist(p, next) : 0;
      push(p, 0, oi);
      if (d > 0.3) { const q = lerp(p, next, Math.min(0.5, d / 2) / d); push(q, 0, oi); push(p, 0, oi); }
      cur = p;
    };
    let stitches = 0;
    let lastObj = -1;
    objs.forEach((o, oi) => {
      const res = results[oi];
      if (!res || !res.segs.length) return;
      const col = o.color;
      res.segs.forEach((s, si) => {
        const p0 = s.pts[0];
        const newColor = curColor !== col;
        let connect = false;
        let route = null;
        if (started && !newColor && cur) {
          const d = dist(cur, p0);
          if (d <= 1.6) connect = true;
          // next shape of the same colour that touches this one: run across instead of trimming
          else if (si === 0 && d <= 12 && segInsideAny(cur, p0, [o, objs[lastObj]])) connect = true;
          else if (si > 0 && s.phase === 'under' && d <= 30 && segInside(cur, p0, o)) connect = true;
          else if (si > 0 && o.kind === 'area') {
            // travel along the inside edge (hidden by the edge stitching) instead of across finished stitches
            const r = routeAlongEdge(o.rings, cur, p0, res.occ);
            if (r && pathLength(r, false) < Math.max(60, d * 4)) { route = r; connect = true; }
            else if (d <= (s.joinInside ? 4 : 6) && segInside(cur, p0, o)) connect = true;
          }
        }
        if (connect && route) {
          const pts = runPath(route, false, 2.5, false);
          for (let k = 1; k < pts.length; k++) stitchTo(pts[k], oi);
          stitchTo(p0, oi);
        } else if (connect) {
          const d = dist(cur, p0);
          if (d > 3) { const n = Math.ceil(d / 3); const a = cur; for (let j = 1; j < n; j++) stitchTo(lerp(a, p0, j / n), oi); }
          stitchTo(p0, oi);
        } else {
          if (started) { tieOff(oi); push(cur, 2, oi); }
          if (newColor) {
            if (started) push(cur, 3, oi);
            colors.push(col); curColor = col;
          }
          jumpTo(p0, oi);
          tieIn(p0, s.pts[1], oi);
          started = true;
        }
        for (let i = 1; i < s.pts.length; i++) stitchTo(s.pts[i], oi);
      });
      lastObj = oi;
    });
    if (started) tieOff(OBJ[OBJ.length - 1]);
    for (const c of C) if (c === 0) stitches++;
    return { X, Y, C, OBJ, colors, stitches };
  }
  /* run from a to b along the inside of the outline, if both are near the same edge */
  /* run from a to b along an edge: the shape's own outline (tucked just inside it), or the edge of a
     shape sewn later on top (tucked under that shape so it gets covered) */
  function routeAlongEdge(rings, a, b, occ) {
    const tryRings = (R, under) => {
      const P = nearestOnRings(R, a), Q = nearestOnRings(R, b);
      if (!(P.d < 2.5) || !(Q.d < 2.5) || P.ri !== Q.ri) return null;
      const path = edgePath([R[P.ri]], a, b, 2.5);
      if (path.length < 2) return null;
      const ring = [R[P.ri]];
      const ins = path.map((q, i) => {
        const pr = path[Math.max(0, i - 1)], nx = path[Math.min(path.length - 1, i + 1)];
        let tx = nx[0] - pr[0], ty = nx[1] - pr[1]; const L = Math.hypot(tx, ty) || 1; tx /= L; ty /= L;
        const c1 = [q[0] - ty * 0.35, q[1] + tx * 0.35], c2 = [q[0] + ty * 0.35, q[1] - tx * 0.35];
        // own outline: stay inside the shape. Covering shape: stay inside the shape on top.
        const want = (c) => under ? pointInRings(c[0], c[1], ring) : pointInRings(c[0], c[1], rings);
        return want(c1) ? c1 : want(c2) ? c2 : q;
      });
      return [a, ...ins, b];
    };
    const own = tryRings(rings, false);
    let best = own;
    for (const o of occ || []) {
      const r = tryRings(o, true);
      if (r && (!best || pathLength(r, false) < pathLength(best, false))) best = r;
    }
    return best;
  }
  function segInsideAny(a, b, list) {
    const n = Math.max(2, Math.ceil(dist(a, b) / 0.5));
    for (let j = 1; j < n; j++) {
      const q = lerp(a, b, j / n);
      if (!list.some((o) => o && o.kind === 'area' && pointInRings(q[0], q[1], o.rings))) return false;
    }
    return true;
  }
  function segInside(a, b, o) {
    if (o.kind !== 'area') return false;
    const n = Math.max(2, Math.ceil(dist(a, b) / 0.5));
    for (let j = 1; j < n; j++) { const q = lerp(a, b, j / n); if (!pointInRings(q[0], q[1], o.rings)) return false; }
    return true;
  }

  return {
    clamp, dist, lerp, ringArea, ringsArea, perimeter, bbox, pointInRings, segDist, simplify,
    analyze, generate, assemble, runPath, resample, edgeIndex, edgeList, catmull, autoGuides, guidePreview, measureWidths, captureEdges, ctrlFrames, railDense, snapToEdge, columnPreview, autoColumns, nearestOnRings, railSnap, railSlide, nodeHandles, borderPreview, edgePath,
  };
})();
if (typeof module !== 'undefined') module.exports = Core;
