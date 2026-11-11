/* ===================================================================
   Machine file writers: PES (Brother), DST (Tajima), JEF (Janome), EXP (Melco), VP3 (Viking, Pfaff)
   Ported from the byte layouts used by pyembroidery.
   =================================================================== */
const Formats = (() => {
  const STITCH = 0, JUMP = 1, TRIM = 2, COLOR = 3, END = 4;
  const PEC = [null, 925564, 677283, 34679, 4942767, 15537951, 13720576, 9516695, 14981835, 9527212, 10409597, 15247616, 16693813, 16776960, 7388191, 12228608, 11053224, 8220416, 16777139, 5199190, 0, 736657, 7799158, 2699571, 2757377, 16140938, 11695652, 16563141, 16660239, 15790320, 6954122, 11066820, 2458811, 16692035, 16773995, 13674080, 13718528, 6732361, 1264198, 8882055, 14208198, 4412935, 16636382, 16356284, 14370, 11710420, 6843056, 15721401, 16201830, 11881316, 1256218, 13042006, 16686642, 11067115, 26430, 5122448, 3112480, 16764108, 16767249, 613286, 15792496, 14938971, 16750848, 16773261, 16763080];
  const PEC_NAMES = [null, 'Prussian Blue', 'Blue', 'Teal Green', 'Cornflower Blue', 'Red', 'Reddish Brown', 'Magenta', 'Light Lilac', 'Lilac', 'Mint Green', 'Deep Gold', 'Orange', 'Yellow', 'Lime Green', 'Brass', 'Silver', 'Russet Brown', 'Cream Brown', 'Pewter', 'Black', 'Ultramarine', 'Royal Purple', 'Dark Gray', 'Dark Brown', 'Deep Rose', 'Light Brown', 'Salmon Pink', 'Vermilion', 'White', 'Violet', 'Seacrest', 'Sky Blue', 'Pumpkin', 'Cream Yellow', 'Khaki', 'Clay Brown', 'Leaf Green', 'Peacock Blue', 'Gray', 'Warm Gray', 'Dark Olive', 'Flesh Pink', 'Pink', 'Deep Green', 'Lavender', 'Wisteria Violet', 'Beige', 'Carmine', 'Amber Red', 'Olive Green', 'Dark Fuchsia', 'Tangerine', 'Light Blue', 'Emerald Green', 'Purple', 'Moss Green', 'Flesh Pink', 'Harvest Gold', 'Electric Blue', 'Lemon Yellow', 'Fresh Green', 'Orange', 'Cream Yellow', 'Applique'];
  const JEF = [null, 0, 16777215, 16776983, 16737792, 3103027, 2323254, 6669000, 11229846, 16148896, 16711680, 11628622, 733060, 14992221, 4725253, 11312327, 16577172, 16357815, 16429953, 13214848, 9897267, 10533068, 8372764, 15066597, 8952731, 10016445, 11723235, 3574688, 5211051, 3697297, 464464, 16357794, 16344939, 14889247, 14852488, 11900020, 14995353, 16763648, 14790100, 12779646, 8388683, 5506417, 11601189, 13295808, 9017430, 6067226, 12564, 6139540, 5029775, 30578, 5856097, 16777202, 11622424, 13339143, 9989248, 9988397, 5059609, 4993803, 3350538, 5388951, 860542, 1996716, 11722067, 15939209, 14574750, 9978209, 5002770, 5015583, 14999161, 13339162, 13345308, 16750597, 16560727, 16770309, 15741727, 1737773, 3697838, 14927028, 14920833];
  const JEF_NAMES = [null, 'Black', 'White', 'Yellow', 'Orange', 'Olive Green', 'Green', 'Sky', 'Purple', 'Pink', 'Red', 'Brown', 'Blue', 'Gold', 'Dark Brown', 'Pale Violet', 'Pale Yellow', 'Pale Pink', 'Peach', 'Beige', 'Wine Red', 'Pale Sky', 'Yellow Green', 'Silver Gray', 'Gray', 'Pale Aqua', 'Baby Blue', 'Powder Blue', 'Bright Blue', 'Slate Blue', 'Navy Blue', 'Salmon Pink', 'Coral', 'Burnt Orange', 'Cinnamon', 'Umber', 'Blond', 'Sunflower', 'Orchid Pink', 'Peony Purple', 'Burgundy', 'Royal Purple', 'Cardinal Red', 'Opal Green', 'Moss Green', 'Meadow Green', 'Dark Green', 'Aquamarine', 'Emerald Green', 'Peacock Green', 'Dark Gray', 'Ivory White', 'Hazel', 'Toast', 'Salmon', 'Cocoa Brown', 'Sienna', 'Sepia', 'Dark Sepia', 'Violet Blue', 'Blue Ink', 'Sola Blue', 'Green Dust', 'Crimson', 'Floral Pink', 'Wine', 'Olive Drab', 'Meadow', 'Mustard', 'Yellow Ocher', 'Old Gold', 'Honey Dew', 'Tangerine', 'Canary Yellow', 'Vermilion', 'Bright Green', 'Ocean Blue', 'Beige Gray', 'Bamboo'];

  const hexToInt = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); return parseInt(h, 16); };
  function colorDist(c1, c2) {
    const r1 = c1 >> 16 & 255, g1 = c1 >> 8 & 255, b1 = c1 & 255;
    const r2 = c2 >> 16 & 255, g2 = c2 >> 8 & 255, b2 = c2 & 255;
    const rm = Math.round((r1 + r2) / 2), r = r1 - r2, g = g1 - g2, b = b1 - b2;
    return (((512 + rm) * r * r) >> 8) + 4 * g * g + (((767 - rm) * b * b) >> 8);
  }
  function nearest(color, table) {
    let bi = null, bd = Infinity;
    table.forEach((t, i) => { if (t == null) return; const d = colorDist(color, t); if (d <= bd) { bd = d; bi = i; } });
    return bi;
  }
  function threadName(hex, brand) {
    const c = hexToInt(hex);
    if (brand === 'jef') { const i = nearest(c, JEF); return { name: JEF_NAMES[i], code: i, hex: '#' + JEF[i].toString(16).padStart(6, '0') }; }
    const i = nearest(c, PEC); return { name: PEC_NAMES[i], code: i, hex: '#' + PEC[i].toString(16).padStart(6, '0') };
  }

  /* ---- byte buffer ---- */
  class Buf {
    constructor() { this.a = new Uint8Array(1 << 16); this.n = 0; }
    grow(k) { if (this.n + k > this.a.length) { const b = new Uint8Array(Math.max(this.a.length * 2, this.n + k)); b.set(this.a); this.a = b; } }
    u8(v) { this.grow(1); this.a[this.n++] = v & 255; }
    bytes(arr) { for (const v of arr) this.u8(v); }
    str(s) { for (let i = 0; i < s.length; i++) this.u8(s.charCodeAt(i)); }
    i16(v) { this.u8(v); this.u8(v >> 8); }
    i16be(v) { this.u8(v >> 8); this.u8(v); }
    i24(v) { this.u8(v); this.u8(v >> 8); this.u8(v >> 16); }
    i32(v) { this.u8(v); this.u8(v >> 8); this.u8(v >> 16); this.u8(v >> 24); }
    i24be(v) { this.u8(v >> 16); this.u8(v >> 8); this.u8(v); }
    i32be(v) { this.u8(v >> 24); this.u8(v >> 16); this.u8(v >> 8); this.u8(v); }
    put32be(pos, v) { for (let k = 0; k < 4; k++) this.a[pos + k] = v >> (24 - 8 * k) & 255; }
    f32(v) { const b = new Uint8Array(new Float32Array([v]).buffer); this.bytes(b); }
    put24(pos, v) { this.a[pos] = v & 255; this.a[pos + 1] = v >> 8 & 255; this.a[pos + 2] = v >> 16 & 255; }
    put16(pos, v) { this.a[pos] = v & 255; this.a[pos + 1] = v >> 8 & 255; }
    put32(pos, v) { for (let k = 0; k < 4; k++) this.a[pos + k] = v >> (8 * k) & 255; }
    out() { return this.a.slice(0, this.n); }
  }

  /* ---- convert assembled design into integer stitch list ---- */
  function toStitches(A, maxStep) {
    const S = [];
    let px = 0, py = 0;
    for (let i = 0; i < A.X.length; i++) {
      const x = Math.round(A.X[i] * 10), y = Math.round(A.Y[i] * 10), c = A.C[i];
      if (c === STITCH || c === JUMP) {
        const dx = x - px, dy = y - py;
        const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / maxStep));
        for (let j = 1; j < n; j++) S.push([Math.round(px + dx * j / n), Math.round(py + dy * j / n), c === STITCH && n > 1 ? JUMP : c]);
        S.push([x, y, c]);
        px = x; py = y;
      } else S.push([px, py, c]);
    }
    S.push([px, py, END]);
    return S;
  }
  function bounds(S) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const s of S) { x0 = Math.min(x0, s[0]); x1 = Math.max(x1, s[0]); y0 = Math.min(y0, s[1]); y1 = Math.max(y1, s[1]); }
    if (!isFinite(x0)) return [0, 0, 0, 0];
    return [x0, y0, x1, y1];
  }
  function colorBlocks(S) {
    // list of stitch arrays for each colour (stitches only)
    const out = [[]];
    for (const s of S) { if (s[2] === COLOR) out.push([]); else if (s[2] === STITCH) out[out.length - 1].push(s); }
    return out;
  }
  function commandBlocks(S) {
    const out = [];
    let last = null, cur = [];
    for (const s of S) {
      if (last === null || s[2] === last) { cur.push(s); last = s[2]; continue; }
      out.push(cur); cur = [s]; last = s[2];
    }
    if (cur.length) out.push(cur);
    return out;
  }

  /* ---------------- PEC / PES ---------------- */
  function uniquePalette(table, threads) {
    const t = table.slice();
    const chart = new Array(t.length).fill(null);
    const uniq = [...new Set(threads)];
    for (const th of uniq) {
      const i = nearest(th, t);
      if (i == null) break;
      t[i] = null; chart[i] = th;
    }
    return threads.map((th) => nearest(th, chart));
  }
  function pecGraphic(points, ext, buffer) {
    const g = [0, 0, 0, 0, 0, 0, 240, 255, 255, 255, 255, 15, 8, 0, 0, 0, 0, 16, 4, 0, 0, 0, 0, 32];
    for (let i = 0; i < 30; i++) g.push(2, 0, 0, 0, 0, 64);
    g.push(4, 0, 0, 0, 0, 32, 8, 0, 0, 0, 0, 16, 240, 255, 255, 255, 255, 15, 0, 0, 0, 0, 0, 0);
    const [l, t, r, b] = ext;
    const dw = r - l || 1, dh = b - t || 1;
    const gw = 48, gh = g.length / 6;
    const sc = Math.min((gw - buffer) / dw, (gh - buffer) / dh);
    const tx = -(r + l) / 2 * sc + gw / 2, ty = -(b + t) / 2 * sc + gh / 2;
    for (const p of points) {
      const x = Math.floor(p[0] * sc + tx), y = Math.floor(p[1] * sc + ty);
      const idx = y * 6 + Math.floor(x / 8);
      if (x >= 0 && y >= 0 && idx < g.length) g[idx] |= 1 << (x % 8);
    }
    return g;
  }
  function writePecValue(f, v, long, flag) {
    if (!long && v > -64 && v < 63) f.u8(v & 0x7f);
    else {
      v &= 0x0fff; v |= 0x8000; v |= flag << 8;
      f.u8(v >> 8 & 255); f.u8(v & 255);
    }
  }
  function writePec(f, S, threads, name) {
    const ext = bounds(S);
    f.str(('LA:' + (name.slice(0, 8) + ' '.repeat(16)).slice(0, 16) + '\r'));
    f.bytes([32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 0xff, 0x00]);
    f.u8(6); f.u8(38);
    const idx = uniquePalette(PEC, threads);
    f.bytes(new Array(12).fill(32));
    f.u8(idx.length - 1);
    f.bytes(idx);
    for (let i = idx.length; i < 463; i++) f.u8(32);
    // stitch block
    const start = f.n;
    f.bytes([0, 0]); f.i24(0);
    f.bytes([0x31, 0xff, 0xf0]);
    f.i16(Math.round(ext[2] - ext[0])); f.i16(Math.round(ext[3] - ext[1]));
    f.i16(0x1e0); f.i16(0x1b0);
    let colorTwo = true, jumping = true, init = true, xx = 0, yy = 0;
    for (const s of S) {
      const dx = s[0] - xx, dy = s[1] - yy; xx += dx; yy += dy;
      const c = s[2];
      if (c === STITCH) {
        if (jumping) { if (dx !== 0 && dy !== 0) { writePecValue(f, 0, false, 0); writePecValue(f, 0, false, 0); } jumping = false; }
        writePecValue(f, dx, false, 0); writePecValue(f, dy, false, 0);
      } else if (c === JUMP) {
        jumping = true;
        const flag = init ? 0x10 : 0x20;
        writePecValue(f, dx, true, flag); writePecValue(f, dy, true, flag);
      } else if (c === COLOR) {
        if (jumping) { writePecValue(f, 0, false, 0); writePecValue(f, 0, false, 0); jumping = false; }
        f.bytes([0xfe, 0xb0, colorTwo ? 2 : 1]); colorTwo = !colorTwo;
      } else if (c === END) { f.u8(0xff); break; }
      init = false;
    }
    f.put24(start + 2, f.n - start);
    // graphics
    const allSt = S.filter((s) => s[2] === STITCH);
    f.bytes(pecGraphic(allSt, ext, 4));
    for (const blk of colorBlocks(S)) f.bytes(pecGraphic(blk, ext, 5));
    return idx;
  }
  function writePES(A, name) {
    const S = toStitches(A, 2047);
    const threads = A.colors.map(hexToInt);
    const f = new Buf();
    f.str('#PES0001');
    const ext = bounds(S);
    const cx = (ext[2] + ext[0]) / 2, cy = (ext[3] + ext[1]) / 2;
    const left = ext[0] - cx, top = ext[1] - cy, right = ext[2] - cx, bottom = ext[3] - cy;
    const ph = f.n; f.i32(0);
    f.i16(1); f.i16(1); f.i16(1); // scale to fit, hoop, 1 block
    f.i16(0xffff); f.i16(0);
    // CEmbOne
    f.i16(7); f.str('CEmbOne');
    const width = right - left, height = bottom - top;
    for (let i = 0; i < 8; i++) f.i16(0);
    const tx = 350 + 1300 / 2 - width / 2, ty = 100 + height + 1800 / 2 - height / 2;
    f.f32(1); f.f32(0); f.f32(0); f.f32(1); f.f32(tx); f.f32(ty);
    f.i16(1); f.i16(0); f.i16(0); f.i16(Math.trunc(width)); f.i16(Math.trunc(height));
    f.bytes([0, 0, 0, 0, 0, 0, 0, 0]);
    const secPos = f.n; f.i16(0);
    f.i16(0xffff); f.i16(0);
    f.i16(7); f.str('CSewSeg');
    // segments
    const adjX = left + cx, adjY = bottom + cy;
    let colorIndex = 0;
    let colorCode = nearest(threads[0] ?? 0, PEC);
    colorIndex = 1;
    let sx = 0, sy = 0, section = 0, flag = -1, prevCode = -1;
    const log = [];
    for (const blk of commandBlocks(S)) {
      const cmd = blk[0][2];
      let pts, fl;
      if (cmd === JUMP) { const lp = blk[blk.length - 1]; pts = [[sx - adjX, sy - adjY], [lp[0] - adjX, lp[1] - adjY]]; fl = 1; }
      else if (cmd === COLOR) { colorCode = nearest(threads[colorIndex] ?? 0, PEC); colorIndex++; continue; }
      else if (cmd === STITCH) { pts = blk.map((s) => { sx = s[0]; sy = s[1]; return [s[0] - adjX, s[1] - adjY]; }); fl = 0; }
      else continue;
      if (flag !== -1) f.i16(0x8003);
      if (prevCode !== colorCode) { log.push([section, colorCode]); prevCode = colorCode; }
      flag = fl;
      f.i16(fl); f.i16(colorCode); f.i16(pts.length);
      for (const p of pts) { f.i16(Math.trunc(p[0])); f.i16(Math.trunc(p[1])); }
      section++;
    }
    f.i16(log.length);
    for (const [s, c] of log) { f.i16(s); f.i16(c); }
    f.put16(secPos, section);
    f.i16(0); f.i16(0);
    f.put32(ph, f.n);
    writePec(f, S, threads, name);
    return f.out();
  }

  /* ---------------- DST ---------------- */
  function dstRecord(x, y, flag) {
    y = -y;
    let b0 = 0, b1 = 0, b2 = 0;
    if (flag === JUMP) b2 |= 1 << 7;
    if (flag === STITCH || flag === JUMP) {
      b2 |= 3;
      if (x > 40) { b2 |= 4; x -= 81; } if (x < -40) { b2 |= 8; x += 81; }
      if (x > 13) { b1 |= 4; x -= 27; } if (x < -13) { b1 |= 8; x += 27; }
      if (x > 4) { b0 |= 4; x -= 9; } if (x < -4) { b0 |= 8; x += 9; }
      if (x > 1) { b1 |= 1; x -= 3; } if (x < -1) { b1 |= 2; x += 3; }
      if (x > 0) { b0 |= 1; x -= 1; } if (x < 0) { b0 |= 2; x += 1; }
      if (y > 40) { b2 |= 32; y -= 81; } if (y < -40) { b2 |= 16; y += 81; }
      if (y > 13) { b1 |= 32; y -= 27; } if (y < -13) { b1 |= 16; y += 27; }
      if (y > 4) { b0 |= 32; y -= 9; } if (y < -4) { b0 |= 16; y += 9; }
      if (y > 1) { b1 |= 128; y -= 3; } if (y < -1) { b1 |= 64; y += 3; }
      if (y > 0) { b0 |= 128; y -= 1; } if (y < 0) { b0 |= 64; y += 1; }
    } else if (flag === COLOR) b2 = 0b11000011;
    else if (flag === END) b2 = 0b11110011;
    return [b0, b1, b2];
  }
  function writeDST(A, name) {
    const S = toStitches(A, 121);
    const ext = bounds(S);
    const f = new Buf();
    const pad = (v, n) => String(v).padStart(n, ' ');
    const colorChanges = S.filter((s) => s[2] === COLOR).length;
    f.str('LA:' + (name + ' '.repeat(16)).slice(0, 16) + '\r');
    f.str('ST:' + pad(S.length, 7) + '\r');
    f.str('CO:' + pad(colorChanges, 3) + '\r');
    f.str('+X:' + pad(Math.abs(ext[2]), 5) + '\r');
    f.str('-X:' + pad(Math.abs(ext[0]), 5) + '\r');
    f.str('+Y:' + pad(Math.abs(ext[3]), 5) + '\r');
    f.str('-Y:' + pad(Math.abs(ext[1]), 5) + '\r');
    const last = S[S.length - 1];
    const ax = last[0], ay = -last[1];
    f.str('AX:' + (ax >= 0 ? '+' : '-') + pad(Math.abs(ax), 5) + '\r');
    f.str('AY:' + (ay >= 0 ? '+' : '-') + pad(Math.abs(ay), 5) + '\r');
    f.str('MX:+' + pad(0, 5) + '\r');
    f.str('MY:+' + pad(0, 5) + '\r');
    f.str('PD:******\r');
    f.u8(0x1a);
    while (f.n < 512) f.u8(0x20);
    let xx = 0, yy = 0;
    for (const s of S) {
      const dx = s[0] - xx, dy = s[1] - yy; xx += dx; yy += dy;
      if (s[2] === TRIM) {
        f.bytes(dstRecord(2, 2, JUMP)); f.bytes(dstRecord(-4, -4, JUMP)); f.bytes(dstRecord(2, 2, JUMP));
      } else f.bytes(dstRecord(dx, dy, s[2]));
    }
    return f.out();
  }

  /* ---------------- EXP ---------------- */
  function writeEXP(A) {
    const S = toStitches(A, 127);
    const f = new Buf();
    let xx = 0, yy = 0;
    for (const s of S) {
      const dx = s[0] - xx, dy = s[1] - yy; xx += dx; yy += dy;
      if (s[2] === STITCH) f.bytes([dx & 255, -dy & 255]);
      else if (s[2] === JUMP) f.bytes([0x80, 0x04, dx & 255, -dy & 255]);
      else if (s[2] === TRIM) f.bytes([0x80, 0x80, 0x07, 0x00]);
      else if (s[2] === COLOR) f.bytes([0x80, 0x01, 0x00, 0x00]);
    }
    return f.out();
  }

  /* ---------------- JEF ---------------- */
  function writeJEF(A) {
    const S = toStitches(A, 127);
    const threads = A.colors.map(hexToInt);
    const f = new Buf();
    const palette = [];
    let lastIndex = null, lastThread = null;
    threads.forEach((th) => {
      let i = nearest(th, JEF);
      if (lastIndex === i && lastThread !== th) { const t = JEF.slice(); t[i] = null; i = nearest(th, t); }
      palette.push(i); lastIndex = i; lastThread = th;
    });
    const colorCount = palette.length;
    f.i32(0x74 + colorCount * 8);
    f.i32(0x14);
    const d = new Date(), z = (v) => String(v).padStart(2, '0');
    f.str(`${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}${z(d.getHours())}${z(d.getMinutes())}${z(d.getSeconds())}`);
    f.u8(0); f.u8(0);
    f.i32(colorCount);
    let pc = 1;
    for (const s of S) { if (s[2] === STITCH) pc++; else if (s[2] === JUMP || s[2] === COLOR) pc += 2; else if (s[2] === END) break; }
    f.i32(pc);
    const ext = bounds(S);
    const dw = Math.round(ext[2] - ext[0]), dh = Math.round(ext[3] - ext[1]);
    let hoop = 0;
    if (dw < 500 && dh < 500) hoop = 1; else if (dw < 1260 && dh < 1100) hoop = 3; else if (dw < 1400 && dh < 2000) hoop = 2; else if (dw < 2000 && dh < 2000) hoop = 4;
    f.i32(hoop);
    const hw = Math.round(dw / 2), hh = Math.round(dh / 2);
    f.i32(hw); f.i32(hh); f.i32(hw); f.i32(hh);
    const edge = (x, y) => { if (Math.min(x, y) >= 0) { f.i32(x); f.i32(y); f.i32(x); f.i32(y); } else { f.i32(-1); f.i32(-1); f.i32(-1); f.i32(-1); } };
    edge(550 - hw, 550 - hh); edge(250 - hw, 250 - hh); edge(700 - hw, 1000 - hh); edge(700 - hw, 1000 - hh);
    for (const t of palette) f.i32(t);
    for (let i = 0; i < colorCount; i++) f.i32(0x0d);
    let xx = 0, yy = 0;
    for (const s of S) {
      const dx = s[0] - xx, dy = s[1] - yy; xx += dx; yy += dy;
      if (s[2] === STITCH) f.bytes([dx & 255, -dy & 255]);
      else if (s[2] === COLOR) f.bytes([0x80, 0x01, dx & 255, -dy & 255]);
      else if (s[2] === JUMP) f.bytes([0x80, 0x02, dx & 255, -dy & 255]);
      else if (s[2] === END) break;
    }
    f.bytes([0x80, 0x10]);
    return f.out();
  }


  /* ---------------- VP3 (Husqvarna Viking, Pfaff) ---------------- */
  function writeVP3(A) {
    const S = toStitches(A, 255);
    const f = new Buf();
    const s16 = (str) => { f.i16be(str.length * 2); for (let i = 0; i < str.length; i++) f.i16be(str.charCodeAt(i)); };
    const s8 = (str) => { const b = new TextEncoder().encode(str); f.i16be(b.length); f.bytes(b); };
    const hole = () => { const p = f.n; f.i32be(0); return p; };
    const patch = (p) => f.put32be(p, f.n - p - 4);
    const T = Math.trunc;
    f.str('%vsm%'); f.u8(0); s16('Produced by     Software Ltd');
    f.bytes([0, 2, 0]); const p020 = hole();
    s16('');
    const ext = bounds(S);
    f.i32be(T(ext[2] * 100)); f.i32be(T(ext[1] * -100)); f.i32be(T(ext[0] * 100)); f.i32be(T(ext[3] * -100));
    // colour blocks: each later block starts at its colour-change record
    const blocks = []; let last = 0;
    S.forEach((s, i) => { if (s[2] === COLOR) { blocks.push(S.slice(last, i)); last = i; } });
    blocks.push(S.slice(last));
    const threads = A.colors.map(hexToInt);
    f.i32be(S.length - 1); f.u8(0); f.u8(blocks.length); f.u8(12); f.u8(0);
    f.u8(1);
    f.bytes([0, 3, 0]); const p030 = hole();
    const w = ext[2] - ext[0], h = ext[3] - ext[1], hw = w / 2, hh = h / 2;
    const cx = ext[2] - hw, cy = ext[3] - hh;
    f.i32be(T(cx) * 100); f.i32be(T(cy) * -100); f.u8(0); f.u8(0); f.u8(0);
    f.i32be(T(hw) * -100); f.i32be(T(hw) * 100); f.i32be(T(hh) * -100); f.i32be(T(hh) * 100);
    f.i32be(T(w) * 100); f.i32be(T(h) * 100);
    s16('');
    f.bytes([0x64, 0x64]); f.i32be(4096); f.i32be(0); f.i32be(0); f.i32be(4096);
    f.str('xxPP'); f.u8(1); f.u8(0);
    s16('Produced by     Software Ltd');
    f.i16be(blocks.length);
    blocks.forEach((st, bi) => {
      f.bytes([0, 5, 0]); const p050 = hole();
      let fx = 0, fy = 0, lx = 0, ly = 0;
      if (st.length) { fx = bi ? st[0][0] : 0; fy = bi ? st[0][1] : 0; lx = st[st.length - 1][0]; ly = st[st.length - 1][1]; }
      f.i32be(T(fx - cx) * 100); f.i32be(T(-(fy - cy)) * 100);
      const th = threads[Math.min(bi, threads.length - 1)] || 0;
      f.bytes([1, 0]); f.i24be(th); f.bytes([0, 0, 0, 5, 0x28]);
      s8(''); s8('#' + th.toString(16).padStart(6, '0')); s8('');
      f.i32be(T(lx - fx) * 100); f.i32be(T(-(ly - fy)) * 100);
      f.bytes([0, 1, 0]); const p010 = hole();
      f.bytes([0x0a, 0xf6, 0x00]);
      let xx = fx, yy = fy;
      for (const s of st) {
        const c = s[2];
        if (c === END) { f.bytes([0x80, 0x03]); break; }
        if (c === TRIM) { f.bytes([0x80, 0x03]); continue; }
        if (c !== STITCH) continue;
        const dx = s[0] - xx, dy = s[1] - yy; xx += dx; yy += dy;
        if (dx >= -127 && dx <= 127 && dy >= -127 && dy <= 127) { f.u8(dx); f.u8(dy); }
        else { f.bytes([0x80, 0x01]); f.i16be(dx); f.i16be(dy); f.bytes([0x80, 0x02]); }
      }
      patch(p010);
      f.u8(0);
      patch(p050);
    });
    patch(p030);
    patch(p020);
    return f.out();
  }

  /* ---------------- ZIP (stored) ---------------- */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(a) { let c = 0xffffffff; for (let i = 0; i < a.length; i++) c = CRC[(c ^ a[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
  function zip(files) {
    const f = new Buf();
    const cd = [];
    const enc = (s) => Array.from(new TextEncoder().encode(s));
    for (const { name, data } of files) {
      const nm = enc(name), crc = crc32(data), off = f.n;
      f.i32(0x04034b50); f.i16(20); f.i16(0); f.i16(0); f.i16(0); f.i16(0x21);
      f.i32(crc); f.i32(data.length); f.i32(data.length); f.i16(nm.length); f.i16(0);
      f.bytes(nm); f.grow(data.length); f.a.set(data, f.n); f.n += data.length;
      cd.push({ nm, crc, size: data.length, off });
    }
    const cdStart = f.n;
    for (const e of cd) {
      f.i32(0x02014b50); f.i16(20); f.i16(20); f.i16(0); f.i16(0); f.i16(0); f.i16(0x21);
      f.i32(e.crc); f.i32(e.size); f.i32(e.size); f.i16(e.nm.length); f.i16(0); f.i16(0); f.i16(0); f.i16(0); f.i32(0); f.i32(e.off);
      f.bytes(e.nm);
    }
    const cdSize = f.n - cdStart;
    f.i32(0x06054b50); f.i16(0); f.i16(0); f.i16(cd.length); f.i16(cd.length); f.i32(cdSize); f.i32(cdStart); f.i16(0);
    return f.out();
  }

  return { writePES, writeDST, writeEXP, writeJEF, writeVP3, zip, threadName };
})();
if (typeof module !== 'undefined') module.exports = Formats;
