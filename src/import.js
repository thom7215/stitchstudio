/* ===================================================================
   Importers: SVG -> shapes, text -> outlines (via canvas tracing)
   =================================================================== */
const Importer = (() => {
  /* ---------- SVG path flattening ---------- */
  function parsePath(d, segs) {
    const subs = [];
    let i = 0;
    const n = d.length;
    const numRe = /[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/y;
    const skip = () => { while (i < n && /[\s,]/.test(d[i])) i++; };
    const isNum = () => { skip(); return i < n && /[-+.\d]/.test(d[i]); };
    const num = () => { skip(); numRe.lastIndex = i; const m = numRe.exec(d); if (!m) throw new Error('bad path'); i = numRe.lastIndex; return parseFloat(m[0]); };
    const flag = () => { skip(); const c = d[i++]; if (c !== '0' && c !== '1') throw new Error('bad flag'); return c === '1'; };
    let x = 0, y = 0, sx = 0, sy = 0, cur = null, cmd = null;
    let lcx = null, lcy = null, lqx = null, lqy = null;
    const start = () => { if (!cur) { cur = { pts: [[x, y]], closed: false }; subs.push(cur); } };
    const line = (nx, ny) => { start(); cur.pts.push([nx, ny]); x = nx; y = ny; };
    const cubic = (x1, y1, x2, y2, x3, y3) => {
      start();
      const L = Math.hypot(x1 - x, y1 - y) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(x3 - x2, y3 - y2);
      const k = segs(L);
      const x0 = x, y0 = y;
      for (let j = 1; j <= k; j++) {
        const t = j / k, u = 1 - t;
        cur.pts.push([u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3, u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3]);
      }
      x = x3; y = y3;
    };
    const quad = (x1, y1, x2, y2) => {
      start();
      const L = Math.hypot(x1 - x, y1 - y) + Math.hypot(x2 - x1, y2 - y1);
      const k = segs(L);
      const x0 = x, y0 = y;
      for (let j = 1; j <= k; j++) {
        const t = j / k, u = 1 - t;
        cur.pts.push([u * u * x0 + 2 * u * t * x1 + t * t * x2, u * u * y0 + 2 * u * t * y1 + t * t * y2]);
      }
      x = x2; y = y2;
    };
    const arc = (rx, ry, phi, fa, fs, x2, y2) => {
      start();
      const x1 = x, y1 = y;
      if (rx === 0 || ry === 0 || (x1 === x2 && y1 === y2)) { line(x2, y2); return; }
      rx = Math.abs(rx); ry = Math.abs(ry);
      const c = Math.cos(phi * Math.PI / 180), s = Math.sin(phi * Math.PI / 180);
      const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
      const xp = c * dx + s * dy, yp = -s * dx + c * dy;
      const lam = xp * xp / (rx * rx) + yp * yp / (ry * ry);
      if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
      const num_ = rx * rx * ry * ry - rx * rx * yp * yp - ry * ry * xp * xp;
      const den = rx * rx * yp * yp + ry * ry * xp * xp;
      let co = Math.sqrt(Math.max(0, num_ / den));
      if (fa === fs) co = -co;
      const cxp = co * rx * yp / ry, cyp = -co * ry * xp / rx;
      const cx = c * cxp - s * cyp + (x1 + x2) / 2, cy = s * cxp + c * cyp + (y1 + y2) / 2;
      const ang = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
      const t1 = ang(1, 0, (xp - cxp) / rx, (yp - cyp) / ry);
      let dt = ang((xp - cxp) / rx, (yp - cyp) / ry, (-xp - cxp) / rx, (-yp - cyp) / ry);
      if (!fs && dt > 0) dt -= Math.PI * 2; else if (fs && dt < 0) dt += Math.PI * 2;
      const k = segs(Math.abs(dt) * Math.max(rx, ry));
      for (let j = 1; j <= k; j++) {
        const t = t1 + dt * j / k;
        cur.pts.push([cx + rx * Math.cos(t) * c - ry * Math.sin(t) * s, cy + rx * Math.cos(t) * s + ry * Math.sin(t) * c]);
      }
      x = x2; y = y2;
    };
    while (true) {
      skip();
      if (i >= n) break;
      const ch = d[i];
      if (/[a-zA-Z]/.test(ch)) { cmd = ch; i++; }
      else if (cmd == null) throw new Error('bad path');
      let first = true;
      do {
        const rel = cmd === cmd.toLowerCase();
        const C = cmd.toUpperCase();
        const ox = rel ? x : 0, oy = rel ? y : 0;
        let isCurve = false, isQuad = false;
        switch (C) {
          case 'M': {
            const nx = num() + ox, ny = num() + oy;
            if (first) { cur = { pts: [[nx, ny]], closed: false }; subs.push(cur); x = sx = nx; y = sy = ny; }
            else line(nx, ny);
            break;
          }
          case 'L': line(num() + ox, num() + oy); break;
          case 'H': line(num() + (rel ? x : 0), y); break;
          case 'V': line(x, num() + (rel ? y : 0)); break;
          case 'C': {
            const a = num() + ox, b = num() + oy, c = num() + ox, e = num() + oy, f = num() + ox, g = num() + oy;
            cubic(a, b, c, e, f, g); lcx = c; lcy = e; isCurve = true; break;
          }
          case 'S': {
            const c1x = lcx != null ? 2 * x - lcx : x, c1y = lcy != null ? 2 * y - lcy : y;
            const c = num() + ox, e = num() + oy, f = num() + ox, g = num() + oy;
            cubic(c1x, c1y, c, e, f, g); lcx = c; lcy = e; isCurve = true; break;
          }
          case 'Q': {
            const a = num() + ox, b = num() + oy, c = num() + ox, e = num() + oy;
            quad(a, b, c, e); lqx = a; lqy = b; isQuad = true; break;
          }
          case 'T': {
            const a = lqx != null ? 2 * x - lqx : x, b = lqy != null ? 2 * y - lqy : y;
            const c = num() + ox, e = num() + oy;
            quad(a, b, c, e); lqx = a; lqy = b; isQuad = true; break;
          }
          case 'A': {
            const rx = num(), ry = num(), phi = num(), fa = flag(), fs = flag(), ex = num() + ox, ey = num() + oy;
            arc(rx, ry, phi, fa, fs, ex, ey); break;
          }
          case 'Z': if (cur) cur.closed = true; x = sx; y = sy; cur = null; break;
          default: throw new Error('unknown command ' + cmd);
        }
        if (!isCurve) { lcx = lcy = null; }
        if (!isQuad) { lqx = lqy = null; }
        if (C === 'M') cmd = cmd === 'm' ? 'l' : 'L';
        first = false;
        if (C === 'Z') break;
      } while (isNum());
    }
    return subs;
  }

  function shapeToD(el) {
    const tag = el.tagName.toLowerCase();
    const v = (a) => { try { return el[a].baseVal.value; } catch (e) { return parseFloat(el.getAttribute(a)) || 0; } };
    if (tag === 'path') return el.getAttribute('d') || '';
    if (tag === 'rect') {
      const x = v('x'), y = v('y'), w = v('width'), h = v('height');
      let rx = el.hasAttribute('rx') ? v('rx') : null, ry = el.hasAttribute('ry') ? v('ry') : null;
      if (rx == null) rx = ry || 0; if (ry == null) ry = rx || 0;
      rx = Math.min(rx, w / 2); ry = Math.min(ry, h / 2);
      if (!rx || !ry) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
      return `M${x + rx} ${y}H${x + w - rx}A${rx} ${ry} 0 0 1 ${x + w} ${y + ry}V${y + h - ry}A${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h}H${x + rx}A${rx} ${ry} 0 0 1 ${x} ${y + h - ry}V${y + ry}A${rx} ${ry} 0 0 1 ${x + rx} ${y}Z`;
    }
    if (tag === 'circle' || tag === 'ellipse') {
      const cx = v('cx'), cy = v('cy');
      const rx = tag === 'circle' ? v('r') : v('rx'), ry = tag === 'circle' ? v('r') : v('ry');
      if (!rx || !ry) return '';
      return `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`;
    }
    if (tag === 'polygon' || tag === 'polyline') {
      const nums = (el.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number);
      if (nums.length < 4) return '';
      let s = `M${nums[0]} ${nums[1]}`;
      for (let k = 2; k + 1 < nums.length; k += 2) s += `L${nums[k]} ${nums[k + 1]}`;
      return tag === 'polygon' ? s + 'Z' : s;
    }
    if (tag === 'line') return `M${v('x1')} ${v('y1')}L${v('x2')} ${v('y2')}`;
    return '';
  }

  function parseColor(str) {
    if (!str) return null;
    const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?/.exec(str);
    if (!m) return null;
    let a = m[4] == null ? 1 : (m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]));
    if (a === 0) return null;
    return '#' + [m[1], m[2], m[3]].map((v) => Math.round(+v).toString(16).padStart(2, '0')).join('');
  }

  function importSVG(text) {
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    const root = doc.documentElement;
    if (!root || root.nodeName.toLowerCase() !== 'svg' || doc.querySelector('parsererror')) throw new Error('This file is not a readable SVG.');
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-20000px;top:0;width:1000px;height:1000px;opacity:0;pointer-events:none;';
    document.body.appendChild(host);
    const svg = document.importNode(root, true);
    if (!svg.getAttribute('width') && !svg.getAttribute('viewBox')) { svg.setAttribute('width', '1000'); svg.setAttribute('height', '1000'); }
    host.appendChild(svg);
    try {
      // inline <use>
      for (let pass = 0; pass < 6; pass++) {
        const uses = svg.querySelectorAll('use');
        if (!uses.length) break;
        uses.forEach((u) => {
          const href = u.getAttribute('href') || u.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
          let target = null;
          if (href && href.startsWith('#')) { try { target = svg.querySelector('#' + CSS.escape(href.slice(1))); } catch (e) { } }
          const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          const tf = (u.getAttribute('transform') || '') + ` translate(${parseFloat(u.getAttribute('x')) || 0} ${parseFloat(u.getAttribute('y')) || 0})`;
          g.setAttribute('transform', tf);
          for (const a of ['fill', 'stroke', 'stroke-width', 'class', 'style']) if (u.hasAttribute(a)) g.setAttribute(a, u.getAttribute(a));
          if (target) {
            if (target.tagName.toLowerCase() === 'symbol') for (const ch of target.childNodes) g.appendChild(ch.cloneNode(true));
            else { const cl = target.cloneNode(true); cl.removeAttribute('id'); g.appendChild(cl); }
          }
          u.replaceWith(g);
        });
      }
      const bb = (() => { try { return svg.getBBox(); } catch (e) { return { width: 1000, height: 1000 }; } })();
      const ctm0 = svg.getCTM ? svg.getCTM() : null;
      const scale0 = ctm0 ? Math.sqrt(Math.abs(ctm0.a * ctm0.d - ctm0.b * ctm0.c)) || 1 : 1;
      const diag = Math.hypot(bb.width, bb.height) * scale0 || 1000;
      const tol = diag / 1600;
      const out = [];
      const els = svg.querySelectorAll('path,rect,circle,ellipse,polygon,polyline,line');
      let count = 0;
      els.forEach((el) => {
        if (el.closest('defs,clipPath,mask,symbol,pattern,marker,linearGradient,radialGradient')) return;
        for (let p = el; p && p !== svg.parentNode; p = p.parentElement) {
          const cs = getComputedStyle(p);
          if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return;
        }
        const cs = getComputedStyle(el);
        const m = el.getCTM() || svg.createSVGMatrix();
        const det = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1;
        const d = shapeToD(el);
        if (!d) return;
        let subs;
        try { subs = parsePath(d, (L) => Math.max(2, Math.min(160, Math.ceil(Math.sqrt(L * det / tol) * 1.6)))); }
        catch (e) { return; }
        const tf = (p) => [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f];
        subs = subs.map((s) => ({ pts: s.pts.map(tf), closed: s.closed })).filter((s) => s.pts.length >= 2);
        if (!subs.length) return;
        const tag = el.tagName.toLowerCase();
        count++;
        let fill = cs.fill;
        let fillColor = null;
        if (fill && fill.startsWith('url(')) {
          const id = /url\(["']?#([^"')]+)/.exec(fill);
          const grad = id ? svg.querySelector('#' + CSS.escape(id[1])) : null;
          const stop = grad && grad.querySelector('stop');
          fillColor = stop ? (parseColor(getComputedStyle(stop).stopColor) || '#888888') : '#888888';
        } else fillColor = parseColor(fill);
        if (parseFloat(cs.fillOpacity) === 0) fillColor = null;
        const name = el.id || el.getAttribute('inkscape:label') || el.getAttribute('data-name') || null;
        if (fillColor && tag !== 'line' && tag !== 'polyline' || fillColor && tag === 'polyline') {
          const rings = subs.map((s) => s.pts).filter((p) => p.length >= 3);
          if (rings.length) out.push({ kind: 'area', rings, color: fillColor, name });
        }
        const strokeColor = cs.stroke && !cs.stroke.startsWith('url(') ? parseColor(cs.stroke) : null;
        const sw = parseFloat(cs.strokeWidth) || 0;
        if (strokeColor && sw > 0 && parseFloat(cs.strokeOpacity) !== 0) {
          out.push({ kind: 'line', paths: subs, width: sw * det, color: strokeColor, name });
        }
      });
      if (!out.length) throw new Error(count ? 'The SVG has shapes but none are filled or stroked with a colour.' : 'No shapes found in this SVG. Text in SVGs must be converted to paths first.');
      return out;
    } finally {
      host.remove();
    }
  }

  /* ---------- text -> outlines ---------- */
  function traceAlpha(img, W, H, thr = 128) {
    // marching squares on the alpha channel; returns closed loops in pixel coords
    const a = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : img[(y * W + x) * 4 + 3];
    const adj = new Map();
    const pt = new Map();
    const add = (k1, k2) => {
      if (!adj.has(k1)) adj.set(k1, []); if (!adj.has(k2)) adj.set(k2, []);
      adj.get(k1).push(k2); adj.get(k2).push(k1);
    };
    const hk = (x, y) => (y + 1) * (W + 2) * 2 + (x + 1) * 2;      // horizontal edge (x,y)-(x+1,y)
    const vk = (x, y) => (y + 1) * (W + 2) * 2 + (x + 1) * 2 + 1;  // vertical edge (x,y)-(x,y+1)
    const hp = (x, y) => { const k = hk(x, y); if (!pt.has(k)) { const v0 = a(x, y), v1 = a(x + 1, y); const t = (thr - v0) / (v1 - v0); pt.set(k, [x + t, y]); } return k; };
    const vp = (x, y) => { const k = vk(x, y); if (!pt.has(k)) { const v0 = a(x, y), v1 = a(x, y + 1); const t = (thr - v0) / (v1 - v0); pt.set(k, [x, y + t]); } return k; };
    for (let y = -1; y < H; y++) for (let x = -1; x < W; x++) {
      const tl = a(x, y) >= thr, tr = a(x + 1, y) >= thr, br = a(x + 1, y + 1) >= thr, bl = a(x, y + 1) >= thr;
      const c = tl | tr << 1 | br << 2 | bl << 3;
      if (c === 0 || c === 15) continue;
      const T = () => hp(x, y), B = () => hp(x, y + 1), L = () => vp(x, y), R = () => vp(x + 1, y);
      switch (c) {
        case 1: case 14: add(L(), T()); break;
        case 2: case 13: add(T(), R()); break;
        case 3: case 12: add(L(), R()); break;
        case 4: case 11: add(R(), B()); break;
        case 6: case 9: add(T(), B()); break;
        case 7: case 8: add(L(), B()); break;
        case 5: {
          const ctr = (a(x, y) + a(x + 1, y) + a(x + 1, y + 1) + a(x, y + 1)) / 4 >= thr;
          if (ctr) { add(L(), B()); add(T(), R()); } else { add(L(), T()); add(R(), B()); }
          break;
        }
        case 10: {
          const ctr = (a(x, y) + a(x + 1, y) + a(x + 1, y + 1) + a(x, y + 1)) / 4 >= thr;
          if (ctr) { add(L(), T()); add(R(), B()); } else { add(T(), R()); add(L(), B()); }
          break;
        }
      }
    }
    const loops = [];
    const seen = new Set();
    for (const k of adj.keys()) {
      if (seen.has(k)) continue;
      const loop = [];
      let prev = -1, cur = k;
      for (let guard = 0; guard < 1e7; guard++) {
        seen.add(cur); loop.push(pt.get(cur));
        const nb = adj.get(cur);
        let nx = nb[0] !== prev ? nb[0] : nb[1];
        if (nb.length > 2) { nx = nb.find((q) => q !== prev && !seen.has(q)); if (nx == null) nx = k; }
        if (nx === k || nx == null || seen.has(nx)) break;
        prev = cur; cur = nx;
      }
      if (loop.length >= 3) loops.push(loop);
    }
    return loops;
  }

  async function traceText(t) {
    const family = t.font || 'sans-serif';
    const px = 160;
    const fam = /^(serif|sans-serif|monospace|cursive|fantasy)$/.test(family) ? family : `"${family}"`;
    const font = `${t.italic ? 'italic ' : ''}${t.bold ? 'bold ' : ''}${px}px ${fam}`;
    try { await document.fonts.load(font, t.str || 'A'); } catch (e) { }
    const c = document.createElement('canvas');
    let ctx = c.getContext('2d');
    ctx.font = font;
    const capH = ctx.measureText('H').actualBoundingBoxAscent || px * 0.7;
    const lines = (t.str || '').split('\n');
    const lineH = px * 1.25 * (t.lineSpacing || 1);
    const spacingPx = (t.spacing || 0) / 100 * px;
    const align = t.align || 'center';
    // layout every character: measure each line, then line them up on the left, centre or right
    const glyphs = [];
    const measured = lines.map((ln) => {
      const chars = Array.from(ln);
      const adv = chars.map((ch) => ctx.measureText(ch).width + spacingPx);
      const total = adv.reduce((s, v) => s + v, 0) - (chars.length ? spacingPx : 0);
      return { chars, adv, total };
    });
    const widestLine = Math.max(0, ...measured.map((m) => m.total));
    measured.forEach(({ chars, adv, total }, li) => {
      let x = align === 'left' ? -widestLine / 2 : align === 'right' ? widestLine / 2 - total : -total / 2;
      chars.forEach((ch, k) => { glyphs.push({ ch, x, w: adv[k] - spacingPx, line: li }); x += adv[k]; });
    });
    glyphs.lineWidth = widestLine;
    const curve = t.curve || 0;
    const widest = glyphs.lineWidth || px;
    const placed = glyphs.map((g) => {
      const baseY = (g.line - (lines.length - 1) / 2) * lineH + capH / 2;
      const cxg = g.x + g.w / 2;
      if (!curve) return { ...g, px: g.x, py: baseY, rot: 0 };
      const theta = Math.abs(curve) / 100 * Math.PI * 1.6;
      const R = widest / theta;
      const phi = cxg / R;
      const rr = curve > 0 ? R - baseY + capH / 2 : R + baseY - capH / 2;
      if (curve > 0) {
        const cx = rr * Math.sin(phi), cy = -rr * Math.cos(phi) + R;
        return { ...g, cx, cy, rot: phi };
      } else {
        const cx = rr * Math.sin(phi), cy = rr * Math.cos(phi) - R;
        return { ...g, cx, cy, rot: -phi };
      }
    });
    // canvas size
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const corners = (g) => {
      if (!g.rot && g.cx == null) return [[g.px, g.py - px], [g.px + g.w, g.py + px * 0.4]];
      const pts = [];
      for (const [dx, dy] of [[-g.w / 2, -px], [g.w / 2, -px], [-g.w / 2, px * 0.4], [g.w / 2, px * 0.4]]) {
        const c = Math.cos(g.rot), s = Math.sin(g.rot);
        pts.push([g.cx + dx * c - (dy + capH / 2) * s, g.cy + dx * s + (dy + capH / 2) * c]);
      }
      return pts;
    };
    placed.forEach((g) => corners(g).forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }));
    if (!isFinite(x0)) return [];
    const pad = 12;
    let W = Math.ceil(x1 - x0) + pad * 2, H = Math.ceil(y1 - y0) + pad * 2;
    const maxDim = 9000;
    let k = 1;
    if (W > maxDim || H > maxDim) k = maxDim / Math.max(W, H);
    c.width = Math.ceil(W * k); c.height = Math.ceil(H * k);
    ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.scale(k, k);
    ctx.translate(pad - x0, pad - y0);
    ctx.font = font;
    ctx.fillStyle = '#000';
    ctx.textBaseline = 'alphabetic';
    for (const g of placed) {
      if (!g.ch.trim()) continue;
      ctx.save();
      if (g.cx == null) ctx.fillText(g.ch, g.px, g.py);
      else { ctx.translate(g.cx, g.cy); ctx.rotate(g.rot); ctx.fillText(g.ch, -g.w / 2, capH / 2); }
      ctx.restore();
    }
    const img = ctx.getImageData(0, 0, c.width, c.height).data;
    let loops = traceAlpha(img, c.width, c.height);
    const mmPerPx = (t.height || 10) / (capH * k);
    const ox = (pad - x0) * k, oy = (pad - y0) * k;
    // which letter each outline belongs to (touching letters, as in scripts, end up with the letter holding most of the outline)
    const centers = placed.map((g, i) => g.ch.trim() ? (g.cx == null ? { i, x: g.px + g.w / 2, y: g.py - capH / 2, rot: 0, w: g.w } : { i, x: g.cx, y: g.cy, rot: g.rot, w: g.w }) : null).filter(Boolean);
    const glyphOf = (L) => {
      let sx = 0, sy = 0; for (const [x, y] of L) { sx += x; sy += y; }
      const lx = sx / L.length / k - pad + x0, ly = sy / L.length / k - pad + y0;
      let best = 0, bd = Infinity;
      for (const c of centers) {
        const dx = lx - c.x, dy = ly - c.y, cs = Math.cos(c.rot), sn = Math.sin(c.rot);
        const u = dx * cs + dy * sn, v = -dx * sn + dy * cs;
        const d = Math.max(Math.abs(u) - c.w / 2, 0) + Math.max(Math.abs(v) - capH * 0.75, 0) + Math.hypot(u, v) * 1e-3;
        if (d < bd) { bd = d; best = c.i; }
      }
      return best;
    };
    const out = [], glyph = [];
    for (const L of loops) {
      const r = Core.simplify(L, 0.35, true).map(([x, y]) => [(x - ox) * mmPerPx, (y - oy) * mmPerPx]);
      if (r.length < 3 || Math.abs(Core.ringArea(r)) <= 0.02) continue;
      out.push(r); glyph.push(glyphOf(L));
    }
    // a hole (the inside of an a, o, e…) always belongs to the outline around it, even when that outline
    // was given to a neighbouring letter because the letters touch
    const area = out.map((r) => Math.abs(Core.ringArea(r)));
    const parent = out.map((r, i) => {
      let best = -1;
      for (let j = 0; j < out.length; j++) {
        if (j === i || area[j] <= area[i]) continue;
        if (Core.pointInRings(r[0][0], r[0][1], [out[j]]) && (best < 0 || area[j] < area[best])) best = j;
      }
      return best;
    });
    const depth = (i) => { let d = 0; for (let p = parent[i]; p >= 0; p = parent[p]) d++; return d; };
    const outerOf = (i) => { let p = i; while (depth(p) % 2 === 1) p = parent[p]; return p; };
    for (let i = 0; i < out.length; i++) if (depth(i) % 2 === 1) glyph[i] = glyph[outerOf(i)];
    out.glyph = glyph;
    out.chars = placed.map((g) => g.ch);
    return out;
  }

  /* ---------- fonts on this computer ---------- */
  const COMMON = ['Arial', 'Arial Black', 'Arial Rounded MT Bold', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Georgia', 'Times New Roman', 'Courier New', 'Comic Sans MS', 'Impact', 'Palatino Linotype', 'Palatino', 'Garamond', 'Book Antiqua', 'Century Gothic', 'Century Schoolbook', 'Lucida Handwriting', 'Lucida Calligraphy', 'Brush Script MT', 'Segoe UI', 'Segoe Script', 'Segoe Print', 'Calibri', 'Cambria', 'Candara', 'Constantia', 'Corbel', 'Franklin Gothic Medium', 'Gabriola', 'Helvetica', 'Helvetica Neue', 'Futura', 'Gill Sans', 'Optima', 'Baskerville', 'Didot', 'Avenir', 'Avenir Next', 'Copperplate', 'Papyrus', 'Chalkboard', 'Chalkduster', 'Marker Felt', 'American Typewriter', 'Bradley Hand', 'Snell Roundhand', 'Zapfino', 'Noteworthy', 'Rockwell', 'Cooper Black', 'Bodoni MT', 'Monotype Corsiva', 'Edwardian Script ITC', 'Old English Text MT', 'Showcard Gothic', 'Stencil', 'Bauhaus 93', 'Broadway', 'Algerian', 'Freestyle Script', 'Kristen ITC', 'Jokerman', 'Chiller', 'Curlz MT', 'Harrington', 'Ink Free', 'Bahnschrift', 'Script MT Bold', 'Vladimir Script', 'Mistral', 'Magneto', 'Matura MT Script Capitals', 'Pristina', 'Viner Hand ITC', 'Noto Sans', 'Noto Serif', 'DejaVu Sans', 'DejaVu Serif', 'Liberation Sans', 'Liberation Serif', 'Ubuntu', 'Cantarell', 'Roboto', 'Open Sans', 'Lato', 'Montserrat'];
  function detectFonts() {
    const c = document.createElement('canvas').getContext('2d');
    const sample = 'mmmmmmmmmmlli WWW@#&QgjR';
    const base = ['monospace', 'serif', 'sans-serif'].map((b) => { c.font = `72px ${b}`; return c.measureText(sample).width; });
    return COMMON.filter((f) => ['monospace', 'serif', 'sans-serif'].some((b, i) => { c.font = `72px "${f}", ${b}`; return Math.abs(c.measureText(sample).width - base[i]) > 0.5; }));
  }
  async function queryLocal() {
    if (!('queryLocalFonts' in window)) return null;
    const fonts = await window.queryLocalFonts();
    return [...new Set(fonts.map((f) => f.family))].sort((a, b) => a.localeCompare(b));
  }
  return { importSVG, traceText, detectFonts, queryLocal, parsePath };
})();
