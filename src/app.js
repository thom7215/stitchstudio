/* ===================================================================
   Stitch Studio app
   =================================================================== */
const ORIGINAL_HTML = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Sizes are the stitchable area, listed the way the hoop sits on the machine (w = across, h = front to back).
  // frame: how the physical hoop is drawn. style screw | magnetic | clamp | oval | tubular,
  // m = gap between stitch area and the inner edge of the frame, band = frame width, R = corner radius of the opening,
  // mount = where it clips onto the machine.
  const H = (id, name, w, h, x) => ({ id, name, w, h, ...(x || {}) });
  const MAG = { style: 'magnetic', m: 7, band: 9, R: 8 };
  const HOOP_BRANDS = {
    generic: {
      name: 'Any machine (standard sizes)',
      frame: { style: 'screw', m: 8, band: 11, R: 14, mount: 'left' },
      hoops: [
        H('100x100', '4 × 4 in (100 × 100 mm)', 100, 100),
        H('130x180', '5 × 7 in (130 × 180 mm)', 130, 180),
        H('160x260', '6 × 10 in (160 × 260 mm)', 160, 260),
        H('200x200', '8 × 8 in (200 × 200 mm)', 200, 200),
        H('200x300', '8 × 12 in (200 × 300 mm)', 200, 300),
        H('240x360', '9.5 × 14 in (240 × 360 mm)', 240, 360),
      ],
    },
    brother: {
      name: 'Brother / Baby Lock',
      export: 'pes',
      frame: { style: 'screw', m: 9, band: 12, R: 18, mount: 'left' },
      note: 'Brother and Baby Lock read .PES files; the export picks it for you. Baby Lock hoops use EF numbers but the same sizes.',
      hoops: [
        H('br-sa431', 'SA431 Small (20 × 60 mm)', 20, 60, { frame: { R: 7, m: 7, band: 10 } }),
        H('br-sa432', 'SA432 4 × 4 in (100 × 100 mm)', 100, 100),
        H('br-sa434', 'SA434 4 × 6.75 in (100 × 170 mm)', 100, 170),
        H('br-sa444', 'SA444 5 × 7 in (130 × 180 mm)', 130, 180),
        H('br-6x10', '6 × 10 in (160 × 260 mm)', 160, 260),
        H('br-sa445', 'SA445 5 × 12 in (130 × 300 mm)', 130, 300),
        H('br-sa446', 'SA446 Quilting 8 × 8 in (200 × 200 mm)', 200, 200),
        H('br-sa447', 'SA447 8 × 12 in (200 × 300 mm)', 200, 300),
        H('br-sa449', 'SA449 9.5 × 14 in (240 × 360 mm)', 240, 360),
        H('br-10x10', '10 × 10 in (254 × 254 mm)', 254, 254),
        H('br-xp', 'Luminaire XP 10.7 × 16 in (272 × 408 mm)', 272, 408),
        H('br-mag-5x7', 'Magnetic 5 × 7 in (130 × 180 mm)', 130, 180, { frame: MAG }),
        H('br-mag-8x12', 'Magnetic 8 × 12 in (200 × 300 mm)', 200, 300, { frame: MAG }),
      ],
    },
    janome: {
      name: 'Janome / Elna',
      export: 'jef',
      frame: { style: 'screw', m: 10, band: 12, R: 10, mount: 'left' },
      note: 'Janome and Elna read .JEF files; the export picks it for you. Hoops with a "b" or "d" suffix fit different machine series, so check your manual.',
      hoops: [
        H('jn-re10', 'RE10 (40 × 100 mm)', 40, 100, { frame: { R: 7 } }),
        H('jn-sq10', 'SQ10 (100 × 100 mm)', 100, 100),
        H('jn-st', 'Standard ST (110 × 126 mm)', 110, 126),
        H('jn-sq14', 'SQ14 (140 × 140 mm)', 140, 140),
        H('jn-re18', 'RE18 (140 × 180 mm)', 140, 180),
        H('jn-re20', 'RE20 (140 × 200 mm)', 140, 200),
        H('jn-sq20', 'SQ20 (200 × 200 mm)', 200, 200),
        H('jn-re28', 'RE28 (200 × 280 mm)', 200, 280),
        H('jn-sq23', 'SQ23 (230 × 230 mm)', 230, 230),
        H('jn-gr', 'GR (230 × 300 mm)', 230, 300),
        H('jn-sq28', 'SQ28 (280 × 280 mm)', 280, 280),
        H('jn-re46', 'RE46 (280 × 460 mm)', 280, 460),
      ],
    },
    viking: {
      name: 'Husqvarna Viking',
      export: 'vp3',
      frame: { style: 'screw', m: 10, band: 13, R: 22, mount: 'left' },
      note: 'Husqvarna Viking machines read .VP3 files; the export picks it for you.',
      hoops: [
        H('hv-100', 'Small (100 × 100 mm)', 100, 100),
        H('hv-120', 'Splendid Square (120 × 120 mm)', 120, 120),
        H('hv-150', 'Texture (150 × 150 mm)', 150, 150),
        H('hv-epic-fa', 'EPIC 3 Free Arm (100 × 150 mm)', 100, 150),
        H('hv-design', 'Design hoop 5 × 7 in (130 × 180 mm)', 130, 180),
        H('hv-jewel', 'Jewel (240 × 150 mm)', 150, 240),
        H('hv-metal-240', 'Large Metal (240 × 150 mm)', 150, 240, { frame: MAG }),
        H('hv-endless', 'Mega Endless (260 × 150 mm)', 150, 260),
        H('hv-quilt', 'Quilters Metal (200 × 200 mm)', 200, 200, { frame: MAG }),
        H('hv-crown', 'Crown (260 × 200 mm)', 200, 260),
        H('hv-megaquilt', 'Mega Quilters (260 × 260 mm)', 260, 260),
        H('hv-royal', 'Royal (360 × 200 mm)', 200, 360),
        H('hv-imperial', 'Imperial (360 × 260 mm)', 260, 360),
        H('hv-majestic', 'Majestic (360 × 350 mm)', 350, 360),
      ],
    },
    pfaff: {
      name: 'Pfaff',
      export: 'vp3',
      frame: { style: 'screw', m: 10, band: 13, R: 22, mount: 'left' },
      note: 'Pfaff creative machines read .VP3 files; the export picks it for you. The biggest hoops need the large embroidery unit on some models.',
      hoops: [
        H('pf-petite', 'creative Petite (80 × 80 mm)', 80, 80),
        H('pf-120', 'creative 120 Square (120 × 120 mm)', 120, 120),
        H('pf-master', 'creative Master (240 × 150 mm)', 150, 240),
        H('pf-grandmetal', 'creative Grand Metal (240 × 150 mm)', 150, 240, { frame: MAG }),
        H('pf-endless', 'creative Grand Endless (260 × 150 mm)', 150, 260),
        H('pf-quilter', 'creative Quilter’s (200 × 200 mm)', 200, 200),
        H('pf-elite', 'creative Elite (260 × 200 mm)', 200, 260),
        H('pf-grandquilter', 'creative Grand Quilter’s (260 × 260 mm)', 260, 260),
        H('pf-deluxe', 'creative Deluxe (360 × 200 mm)', 200, 360),
        H('pf-supreme', 'creative Supreme (360 × 260 mm)', 260, 360),
        H('pf-dream', 'creative Grand Dream (360 × 350 mm)', 350, 360),
      ],
    },
    bernina: {
      name: 'Bernina',
      export: 'exp',
      frame: { style: 'screw', m: 9, band: 12, R: 16, mount: 'left' },
      note: 'Bernina machines read .EXP files; the export picks it for you. Bernette has its own entry in the list.',
      hoops: [
        H('bernina-small', 'Small (50 × 72 mm, oval)', 50, 72, { oval: true, frame: { style: 'oval', m: 6, band: 10 } }),
        H('bernina-medium', 'Medium (100 × 130 mm)', 100, 130),
        H('bernina-large-oval', 'Large Oval (145 × 255 mm)', 145, 255, { oval: true, frame: { style: 'oval', m: 8, band: 12 } }),
        H('bernina-mega', 'Mega Hoop (150 × 400 mm)', 150, 400),
        H('bernina-midi', 'Midi (165 × 265 mm)', 165, 265),
        H('bernina-medium-magnetic', 'Medium Magnetic (165 × 265 mm)', 165, 265, { frame: MAG }),
        H('bernina-border-magnetic', 'Medium Border Magnetic (165 × 400 mm)', 165, 400, { frame: MAG }),
        H('bernina-clamp', 'Clamp Hoop, 7 Series (210 × 215 mm)', 210, 215, { frame: { style: 'clamp', m: 6, band: 12, R: 6 } }),
        H('bernina-maxi', 'Maxi (210 × 400 mm)', 210, 400),
        H('bernina-jumbo', 'Jumbo (260 × 400 mm)', 260, 400),
      ],
    },
    bernette: {
      name: 'Bernette (b70, b79)',
      export: 'pes',
      frame: { style: 'screw', m: 8, band: 11, R: 16, mount: 'left' },
      note: 'Bernette b70 and b79 read .PES, .EXP, .JEF and .DST. The export picks .PES for you.',
      hoops: [
        H('bt-s', 'Small (50 × 70 mm)', 50, 70, { frame: { R: 9 } }),
        H('bt-m', 'Medium (120 × 180 mm)', 120, 180),
        H('bt-l', 'Large (160 × 260 mm)', 160, 260),
        H('bt-snap-s', 'Snap magnetic (100 × 100 mm)', 100, 100, { frame: MAG }),
        H('bt-snap-m', 'Snap magnetic (130 × 180 mm)', 130, 180, { frame: MAG }),
        H('bt-snap-l', 'Snap magnetic (140 × 260 mm)', 140, 260, { frame: MAG }),
      ],
    },
    commercial: {
      name: 'Multi-needle (Tajima, Ricoma, SWF, Happy)',
      export: 'dst',
      frame: { style: 'tubular', m: 6, band: 9, R: 14, mount: 'both' },
      note: 'Commercial machines read .DST files; the export picks it for you. Round hoops are named by their inside diameter; the stitch area keeps about 5 mm clear of the edge.',
      hoops: [
        H('cm-r90', 'Round 9 cm', 80, 80, { round: true }),
        H('cm-r120', 'Round 12 cm', 110, 110, { round: true }),
        H('cm-r150', 'Round 15 cm', 140, 140, { round: true }),
        H('cm-r180', 'Round 18 cm', 170, 170, { round: true }),
        H('cm-r210', 'Round 21 cm', 200, 200, { round: true }),
        H('cm-sq', 'Square (240 × 240 mm)', 240, 240),
        H('cm-rect', 'Rectangle (300 × 360 mm)', 300, 360),
      ],
    },
  };
  const HOOPS = Object.values(HOOP_BRANDS).flatMap((b) => b.hoops);
  const brandOf = (id) => Object.keys(HOOP_BRANDS).find((k) => HOOP_BRANDS[k].hoops.some((h) => h.id === id)) || 'generic';
  const FABRICS = {
    woven: { name: 'Cotton or other woven', fill: 0.40, satin: 0.40, pull: 0.20, under: 'normal', tip: 'Use a medium tear-away stabilizer.' },
    knit: { name: 'T-shirt or knit', fill: 0.45, satin: 0.42, pull: 0.35, under: 'heavy', tip: 'Use cut-away or no-show mesh stabilizer. Hoop it flat without stretching.' },
    towel: { name: 'Towel, fleece or minky', fill: 0.38, satin: 0.38, pull: 0.30, under: 'heavy', tip: 'Tear-away underneath plus a water-soluble topper so stitches sit on top of the pile.' },
    denim: { name: 'Denim or canvas', fill: 0.40, satin: 0.40, pull: 0.15, under: 'light', tip: 'Medium tear-away and a size 90/14 needle.' },
    twill: { name: 'Twill or patch', fill: 0.38, satin: 0.38, pull: 0.20, under: 'normal', tip: 'Heavy tear-away. For patches, hoop two layers of twill.' },
  };
  const WEB_FONTS = ['Bebas Neue', 'Pacifico', 'Lobster', 'Great Vibes', 'Dancing Script', 'Oswald', 'Anton', 'Alfa Slab One', 'Righteous', 'Satisfy', 'Permanent Marker', 'Playfair Display', 'Fredoka', 'Kaushan Script'];
  const MACHINES = [
    { id: 'pes', title: 'Brother, Baby Lock, Bernette', ext: 'pes', fmt: 'PES' },
    { id: 'jef', title: 'Janome, Elna, Kenmore', ext: 'jef', fmt: 'JEF' },
    { id: 'dst', title: 'Tajima and most commercial machines', ext: 'dst', fmt: 'DST' },
    { id: 'exp', title: 'Bernina, Melco', ext: 'exp', fmt: 'EXP' },
    { id: 'vp3', title: 'Husqvarna Viking, Pfaff', ext: 'vp3', fmt: 'VP3' },
    { id: 'all', title: 'Not sure? Get all five', ext: 'zip', fmt: 'ZIP' },
  ];

  /* ---------------- state ---------------- */
  let VER = 1;
  const S = {
    objects: [],
    hoop: '100x100',
    hoopTurn: false,
    fabric: 'woven',
    fabricColor: '#f4f1ea',
    knockout: true,
    nextId: 1,
  };
  const ui = {
    sel: new Set(), view: 'both', jumps: false, sim: 1, playing: false,
    font: null, bold: false, italic: false, align: 'center', editingText: null,
    lock: true, machine: 'pes',
    tool: null, draft: [], active: null, cursor: null, borderW: 1.5, borderAlign: 'center', drawWidthMode: 'shape', drawWidth: 2.5, colDraft: null, railMode: 'edge', snap: null,
  };
  let results = [];      // per object
  let A = null;          // assembled stitches
  const cache = new Map();

  const hoop = () => {
    const h = HOOPS.find((x) => x.id === S.hoop) || HOOPS[0];
    const frame = { ...HOOP_BRANDS[brandOf(h.id)].frame, ...(h.frame || {}) };
    if (h.round) frame.m = 5;
    return S.hoopTurn ? { ...h, w: h.h, h: h.w, frame, turned: true } : { ...h, frame };
  };
  const fab = () => FABRICS[S.fabric] || FABRICS.woven;
  const objById = (id) => S.objects.find((o) => o.id === id);
  const selected = () => S.objects.filter((o) => ui.sel.has(o.id));
  const threadName = (hex) => Formats.threadName(hex, 'pes').name;

  function toast(msg, ms = 3200) {
    const t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), ms);
  }
  function normHex(c) {
    if (!c) return '#000000';
    c = c.trim().toLowerCase();
    if (/^#[0-9a-f]{3}$/.test(c)) return '#' + c.slice(1).split('').map((x) => x + x).join('');
    return /^#[0-9a-f]{6}$/.test(c) ? c : '#000000';
  }

  /* ---------------- undo ---------------- */
  const hist = { stack: [], i: -1 };
  function snapshot() { return JSON.stringify({ objects: S.objects, hoop: S.hoop, hoopTurn: !!S.hoopTurn, fabric: S.fabric, fabricColor: S.fabricColor, knockout: S.knockout, nextId: S.nextId }); }
  function checkpoint() {
    const s = snapshot();
    if (hist.stack[hist.i] === s) return;
    hist.stack.length = hist.i + 1;
    hist.stack.push(s);
    if (hist.stack.length > 80) hist.stack.shift();
    hist.i = hist.stack.length - 1;
    updateUndo();
  }
  function restore(s) {
    const d = JSON.parse(s);
    Object.assign(S, d);
    for (const id of [...ui.sel]) if (!objById(id)) ui.sel.delete(id);
    // a selected dot, rung or column may not exist in the restored state
    ui.active = null;
    if (ui.editingText && !objById(ui.editingText)) ui.editingText = null;
    syncSettingsUI();
    changed(false);
  }
  function undo() { if (hist.i > 0) { hist.i--; restore(hist.stack[hist.i]); updateUndo(); } }
  function redo() { if (hist.i < hist.stack.length - 1) { hist.i++; restore(hist.stack[hist.i]); updateUndo(); } }
  function updateUndo() { $('undoBtn').disabled = hist.i <= 0; $('redoBtn').disabled = hist.i >= hist.stack.length - 1; }

  /* ---------------- objects ---------------- */
  function defaultParams() { return { angle: 45, density: 'normal', satinDir: 'follow', satinAngle: 0, underlay: true, pull: null, border: 'none', borderWidth: 1.5, triple: false, runLen: 2.5, spacing: null, curveMode: 'outer', shortAmt: 0.3 }; }
  function makeObj(base) {
    const o = Object.assign({ id: S.nextId++, name: '', kind: 'area', rings: [], paths: [], width: 0, color: '#333333', type: 'fill', auto: true, why: '', params: defaultParams(), text: null }, base);
    o.color = normHex(o.color);
    o.ver = VER++;
    return o;
  }
  function autoPick(o) {
    const a = Core.analyze(o);
    o.type = a.type; o.why = a.why; o.auto = true;
    if (a.triple != null) o.params.triple = a.triple;
    return a;
  }
  function touch(o) { o.ver = VER++; }
  function objBBox(o) {
    if (o.kind === 'area') return Core.bbox(o.rings);
    const b = Core.bbox(o.paths.map((p) => p.pts));
    const h = o.width / 2;
    return { x0: b.x0 - h, y0: b.y0 - h, x1: b.x1 + h, y1: b.y1 + h, w: b.w + o.width, h: b.h + o.width };
  }
  function unionBBox(list) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const o of list) { const b = objBBox(o); x0 = Math.min(x0, b.x0); y0 = Math.min(y0, b.y0); x1 = Math.max(x1, b.x1); y1 = Math.max(y1, b.y1); }
    return isFinite(x0) ? { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 } : null;
  }
  function mapColumns(o, f) {
    const mr = (r) => ({
      ...r, pts: r.pts.map(f),
      handles: r.handles ? r.handles.map((h, i) => {
        if (!h) return null;
        const p = r.pts[i], q = f(p);
        const t = (off) => { const z = f([p[0] + off[0], p[1] + off[1]]); return [z[0] - q[0], z[1] - q[1]]; };
        return { in: t(h.in), out: t(h.out), cusp: h.cusp };
      }) : r.handles,
    });
    if (o.columns) o.columns = o.columns.map((c) => ({ A: mr(c.A), B: mr(c.B), rungs: (c.rungs || []).map((r) => ({ a: f(r.a), b: f(r.b) })) }));
    if (o.borders) o.borders = o.borders.map((b) => ({ ...b, R: mr(b.R) }));
  }
  function mapGuides(o, f, k = 1) {
    mapColumns(o, f);
    if (o.guides) o.guides = o.guides.map((g) => ({ ...g, pts: g.pts.map(f), w: g.w ? g.w.map((v) => v * k) : g.w, e: g.e ? g.e.map((r) => r.map((v) => v * k)) : g.e, widen: (g.widen || 0) * k }));
    if (o.dirs) o.dirs = o.dirs.map((d) => ({ a: f(d.a), b: f(d.b) }));
  }
  function mapGeom(o, f) {
    o.rings = o.rings.map((r) => r.map(f));
    o.paths = o.paths.map((p) => ({ pts: p.pts.map(f), closed: p.closed }));
    mapGuides(o, f);
    touch(o);
  }
  function translate(list, dx, dy) {
    for (const o of list) {
      mapGeom(o, (p) => [p[0] + dx, p[1] + dy]);
      if (o.text) { o.text.cx += dx; o.text.cy += dy; }
    }
  }
  async function scale(list, sx, sy, cx, cy) {
    await scaleObjects(list, sx, sy, cx, cy);
    // the Text tab must show the new size, or the next text change would put the old size back
    const ed = ui.editingText && objById(ui.editingText);
    if (ed && list.includes(ed)) { setTxtH(ed.text.height); syncTextUI(); }
  }
  function setTxtH(h) {
    const el = $('txtH');
    el.max = Math.max(80, Math.ceil(h)); el.min = Math.min(4, Math.floor(h * 2) / 2);
    el.value = h;
    // the slider rounds to its step; remember the exact size so an untouched slider keeps it
    ui.txtHReal = h; ui.txtHShown = +el.value;
  }
  const formHeight = () => { const v = +$('txtH').value; return ui.txtHReal != null && v === ui.txtHShown ? ui.txtHReal : v; };
  async function scaleObjects(list, sx, sy, cx, cy) {
    for (const o of list) {
      if (o.text) {
        const oh = o.text.height;
        o.text.height = Math.max(2, o.text.height * Math.sqrt(sx * sy));
        const k = o.text.height / oh, ocx = o.text.cx, ocy = o.text.cy;
        o.text.cx = cx + (o.text.cx - cx) * sx; o.text.cy = cy + (o.text.cy - cy) * sy;
        mapGuides(o, (p) => [o.text.cx + (p[0] - ocx) * k, o.text.cy + (p[1] - ocy) * k], k);
        if (o.borders) o.borders.forEach((b) => { b.width = +((b.width || 1.5) * k).toFixed(2); });
        await rebuildText(o);
      } else {
        mapGeom(o, (p) => [cx + (p[0] - cx) * sx, cy + (p[1] - cy) * sy]);
        if (o.borders) o.borders.forEach((b) => { b.width = +((b.width || 1.5) * Math.sqrt(Math.abs(sx * sy))).toFixed(2); });
        if (o.guides) mapGuides(o, (p) => p, Math.sqrt(Math.abs(sx * sy)));
        if (o.kind === 'line') o.width *= Math.sqrt(Math.abs(sx * sy));
      }
    }
  }
  async function rotate(list, deg, cx, cy) {
    const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    const f = (p) => [cx + (p[0] - cx) * c - (p[1] - cy) * s, cy + (p[0] - cx) * s + (p[1] - cy) * c];
    for (const o of list) {
      if (o.text) {
        const q = f([o.text.cx, o.text.cy]); o.text.cx = q[0]; o.text.cy = q[1];
        o.text.rot = ((o.text.rot || 0) + deg) % 360;
        mapGuides(o, f);
        await rebuildText(o);
      } else mapGeom(o, f);
    }
  }
  async function flip(list, cx) {
    for (const o of list) {
      if (o.guides) for (const g of o.guides) if (g.e) g.e = g.e.map(([ta, na, tb, nb]) => [tb, -nb, ta, -na]);
      if (o.text) { o.text.cx = 2 * cx - o.text.cx; o.text.flip = !o.text.flip; mapGuides(o, (p) => [2 * cx - p[0], p[1]]); await rebuildText(o); }
      else { mapGeom(o, (p) => [2 * cx - p[0], p[1]]); o.rings = o.rings.map((r) => r.slice().reverse()); }
    }
  }

  /* ---------------- text ---------------- */
  // tracing is shared by every letter of a word, so it is cached by everything that changes the outlines
  const traceCache = new Map();
  const textKey = (t) => JSON.stringify([t.str, t.font, !!t.bold, !!t.italic, +t.height, +t.spacing || 0, +t.curve || 0, +t.lineSpacing || 1, t.align || 'center']);
  async function traceTextCached(t) {
    const key = textKey(t);
    let r = traceCache.get(key);
    if (!r) {
      r = await Importer.traceText(t);
      traceCache.set(key, r);
      if (traceCache.size > 24) traceCache.delete(traceCache.keys().next().value);
    }
    return r;
  }
  async function rebuildText(o) {
    const t = o.text;
    const all = await traceTextCached(t);
    let rings = t.letter == null ? all : all.filter((r, i) => all.glyph && all.glyph[i] === t.letter);
    const rot = (t.rot || 0) * Math.PI / 180, c = Math.cos(rot), s = Math.sin(rot);
    rings = rings.map((r) => r.map(([x, y]) => {
      if (t.flip) x = -x;
      return [t.cx + x * c - y * s, t.cy + x * s + y * c];
    }));
    o.rings = rings;
    touch(o);
  }
  function readTextForm() {
    return {
      str: $('txt').value.replace(/\s+$/, ''),
      font: ui.font || 'sans-serif', bold: ui.bold, italic: ui.italic,
      height: formHeight(), spacing: +$('txtSp').value, curve: +$('txtCv').value,
      lineSpacing: +$('txtLs').value, align: ui.align || 'center',
    };
  }
  function writeTextForm(t) {
    $('txt').value = t.str; ui.font = t.font; ui.bold = t.bold; ui.italic = t.italic;
    setTxtH(t.height); $('txtSp').value = t.spacing; $('txtCv').value = t.curve;
    $('txtLs').value = t.lineSpacing || 1; ui.align = t.align || 'center';
    syncTextUI();
    renderFontList();
  }
  function syncTextUI() {
    $('boldBtn').setAttribute('aria-pressed', ui.bold); $('italBtn').setAttribute('aria-pressed', ui.italic);
    $('txtHo').textContent = formHeight().toFixed(1).replace(/\.0$/, '') + ' mm';
    $('txtSpo').textContent = $('txtSp').value;
    const ls = +$('txtLs').value;
    $('txtLso').textContent = Math.abs(ls - 1) < 0.001 ? 'Normal' : ls.toFixed(2).replace(/0$/, '') + '×';
    $('txtAlign').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.align === (ui.align || 'center')));
    const multiLine = $('txt').value.replace(/\s+$/, '').includes('\n');
    $('txtLs').disabled = !multiLine; $('txtAlign').querySelectorAll('button').forEach((b) => { b.disabled = !multiLine; });
    $('txtAlign').title = multiLine ? '' : 'Type more than one line to line them up';
    const cv = +$('txtCv').value;
    $('txtCvo').textContent = cv === 0 ? 'Straight' : cv > 0 ? 'Arch ' + cv : 'Smile ' + (-cv);
    const h = +$('txtH').value;
    $('textHint').textContent = h < 5 ? 'Letters this small lose detail. Simple, bold fonts work best under 6 mm.' : h > 45 ? 'Large letters will use fill stitch automatically.' : 'Tip: bold, simple fonts sew cleanest. Thin scripts need at least 10 mm.';
    const ed = ui.editingText && objById(ui.editingText);
    $('textEditing').hidden = !ed;
    $('addTextBtn').textContent = ed ? 'Update selected text' : 'Add text to hoop';
  }
  // the letters of the word that `o` belongs to (old projects keep a whole word in one object)
  function wordOf(o) {
    if (!o || !o.text) return [];
    if (o.text.letter == null || !o.group) return [o];
    return S.objects.filter((q) => q.group === o.group && q.text);
  }
  // one object per letter, so every letter can get its own stitch type and its own manual columns
  async function makeLetters(t, place, color, group, old) {
    const all = await traceTextCached(t);
    const word = t.str.split('\n')[0].slice(0, 24);
    const idx = [...new Set(all.glyph || [])].sort((a, b) => a - b);
    const made = [];
    for (const gi of idx) {
      const ch = all.chars ? all.chars[gi] : '?';
      const o = makeObj({ kind: 'area', color, group, groupName: `“${word}”`, name: `${ch}  ·  “${word}”`, text: { ...t, ...place, letter: gi } });
      await rebuildText(o);
      if (!o.rings.length) continue;
      const prev = old && old.find((q) => q.text.letter === gi && q.name.split('  ·  ')[0] === ch);
      if (prev) { o.type = prev.type; o.params = JSON.parse(JSON.stringify(prev.params)); o.auto = prev.auto; o.why = prev.why; o.color = prev.color; if (o.auto) autoPick(o); }
      else autoPick(o);
      made.push(o);
    }
    return made;
  }
  async function addOrUpdateText() {
    const t = readTextForm();
    if (!t.str.trim()) { toast('Type some words first.'); return; }
    const color = normHex($('txtColor').value);
    const ed = ui.editingText && objById(ui.editingText);
    setBusy(true);
    try {
      if (ed) {
        const members = wordOf(ed);
        const prev = ed.text;
        const same = ['str', 'font', 'bold', 'italic', 'spacing', 'curve'].every((k) => prev[k] === t[k]) && (prev.lineSpacing || 1) === t.lineSpacing && (prev.align || 'center') === t.align && ed.text.letter != null;
        const recolor = color !== ed.color;
        if (same) {
          // only the size or colour changed: keep every letter, its columns and its settings
          for (const m of members) {
            const p = m.text;
            if (p.height !== t.height) {
              const k = t.height / p.height;
              if (m.columns && m.columns.length) mapColumns(m, (q) => [p.cx + (q[0] - p.cx) * k, p.cy + (q[1] - p.cy) * k]);
              if (m.guides && m.guides.length) mapGuides(m, (q) => [p.cx + (q[0] - p.cx) * k, p.cy + (q[1] - p.cy) * k], k);
              if (m.borders) m.borders.forEach((bd) => { bd.width = +((bd.width || 1.5) * k).toFixed(2); });
            }
            Object.assign(m.text, { ...t, letter: m.text.letter });
            if (recolor) m.color = color;
            await rebuildText(m);
            if (m.auto) autoPick(m);
          }
          // a letter left with no outline of its own (its parts now belong to a touching letter) is dropped
          const empty = members.filter((m) => !m.rings.length);
          if (empty.length) { S.objects = S.objects.filter((q) => !empty.includes(q)); empty.forEach((m) => ui.sel.delete(m.id)); if (empty.some((m) => m.id === ui.editingText)) { const k = members.find((m) => m.rings.length); ui.editingText = k ? k.id : null; } }
        } else {
          if (members.some((m) => (m.columns && m.columns.length) || (m.guides && m.guides.length) || (m.borders && m.borders.length))) toast('The letters changed, so the hand-drawn columns and borders on them were cleared.', 4200);
          const place = { cx: prev.cx, cy: prev.cy, rot: prev.rot || 0, flip: !!prev.flip };
          const group = ed.text.letter != null && ed.group ? ed.group : 'txt-' + Date.now().toString(36);
          const made = await makeLetters(t, place, recolor ? color : ed.color, group, ed.text.letter != null ? members : null);
          if (recolor) made.forEach((m) => { m.color = color; });
          if (!made.length) { toast('That font produced no outlines. Try another font.'); return; }
          const at = Math.min(...members.map((m) => S.objects.indexOf(m)).filter((i) => i >= 0));
          S.objects = S.objects.filter((q) => !members.includes(q));
          S.objects.splice(Math.min(at, S.objects.length), 0, ...made);
          ui.sel = new Set(made.map((m) => m.id));
          ui.editingText = made[0].id;
        }
      } else {
        const h = hoop();
        // place below existing artwork if there is room, otherwise in the centre
        const bb = unionBBox(S.objects);
        let cy = 0;
        if (bb && bb.y1 + t.height * 1.6 < h.h / 2) cy = bb.y1 + t.height * 0.9;
        const made = await makeLetters(t, { cx: 0, cy, rot: 0, flip: false }, color, 'txt-' + Date.now().toString(36), null);
        if (!made.length) { toast('That font produced no outlines. Try another font.'); return; }
        S.objects.push(...made);
        ui.sel = new Set(made.map((m) => m.id));
        ui.editingText = made[0].id;
        const types = new Set(made.map((m) => m.type));
        toast(`Added ${made.length} letter${made.length > 1 ? 's' : ''} as ${types.size > 1 ? 'satin and fill' : made[0].type === 'satin' ? 'satin stitch' : made[0].type}. Click one letter to change just that letter; double-click to pick the whole word.`, 5200);
      }
      checkpoint();
      changed();
      const bb = unionBBox(S.objects), hh = hoop();
      if (bb && (bb.x0 < -hh.w / 2 || bb.x1 > hh.w / 2 || bb.y0 < -hh.h / 2 || bb.y1 > hh.h / 2)) fitView();
    } finally { setBusy(false); }
  }
  let textTimer = null;
  function liveText() {
    syncTextUI();
    if (!ui.editingText || !objById(ui.editingText)) return;
    clearTimeout(textTimer);
    textTimer = setTimeout(addOrUpdateText, 350);
  }

  /* ---------------- fonts ---------------- */
  const fonts = { web: WEB_FONTS, local: [], added: [], full: false };
  function renderFontList() {
    const q = $('fontSearch').value.trim().toLowerCase();
    const sample = ($('txt').value.split('\n')[0] || 'Abc').slice(0, 14) || 'Abc';
    const box = $('fontList');
    const groups = [
      ['Added by you', fonts.added],
      [fonts.full ? 'On this computer' : 'Found on this computer', fonts.local],
      ['Web fonts that stitch well', fonts.web],
    ];
    let html = '';
    let any = false;
    for (const [label, list] of groups) {
      const L = list.filter((f) => !q || f.toLowerCase().includes(q));
      if (!L.length) continue;
      any = true;
      html += `<div class="grp">${esc(label)}</div>`;
      for (const f of L.slice(0, 400)) html += `<button type="button" role="option" data-font="${esc(f)}" aria-selected="${f === ui.font}" style="font-family:&quot;${esc(f)}&quot;,sans-serif" title="${esc(f)}"><span>${esc(sample)}</span><small>${esc(f)}</small></button>`;
    }
    box.innerHTML = any ? html : '<div class="empty">No fonts match. Try another name, or add a font file.</div>';
  }
  async function showAllFonts() {
    try {
      const list = await Importer.queryLocal();
      if (!list) { toast('This browser cannot list all fonts. Chrome and Edge can. You can still add a font file.'); return; }
      fonts.local = list; fonts.full = true;
      renderFontList();
      toast(`Found ${list.length} fonts on this computer.`);
    } catch (e) {
      toast('Font access was blocked here. Open the app file in Chrome or Edge to use every font, or add a font file.', 5200);
    }
  }
  async function addFontFile(file) {
    try {
      const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
      const ff = new FontFace(name, await file.arrayBuffer());
      await ff.load();
      document.fonts.add(ff);
      if (!fonts.added.includes(name)) fonts.added.unshift(name);
      ui.font = name;
      renderFontList(); liveText();
      toast(`Font “${name}” is ready.`);
    } catch (e) { toast('That font file could not be read.'); }
  }

  /* ---------------- SVG import ---------------- */
  function importSVGText(text, fileName) {
    let shapes;
    try { shapes = Importer.importSVG(text); }
    catch (e) { toast(e.message || 'Could not read that SVG.', 5000); return; }
    const all = Core.bbox(shapes.flatMap((s) => s.kind === 'area' ? s.rings : s.paths.map((p) => p.pts)));
    const h = hoop();
    const k = Math.min(h.w * 0.8 / (all.w || 1), h.h * 0.8 / (all.h || 1));
    const cx = (all.x0 + all.x1) / 2, cy = (all.y0 + all.y1) / 2;
    const f = (p) => [(p[0] - cx) * k, (p[1] - cy) * k];
    const created = [];
    const designArea = all.w * all.h * k * k;
    const groupId = 'svg-' + Date.now().toString(36);
    const groupName = (fileName || 'SVG').replace(/\.svg$/i, '');
    let n = 0;
    for (const s of shapes) {
      n++;
      const o = makeObj({ kind: s.kind, color: s.color, group: groupId, groupName });
      if (s.kind === 'area') {
        o.rings = s.rings.map((r) => Core.simplify(r.map(f), 0.02, true)).filter((r) => r.length >= 3 && Math.abs(Core.ringArea(r)) > 0.01);
        if (!o.rings.length) continue;
      } else {
        o.paths = s.paths.map((p) => ({ pts: Core.simplify(p.pts.map(f), 0.02, p.closed), closed: p.closed }));
        o.width = s.width * k;
      }
      o.name = s.name ? s.name.replace(/[-_]+/g, ' ') : `${threadName(o.color)} ${s.kind === 'line' ? 'line' : 'shape'}`;
      autoPick(o);
      // a big white shape at the bottom is almost always a background
      if (o.kind === 'area' && created.length === 0) {
        const b = objBBox(o);
        const lum = parseInt(o.color.slice(1, 3), 16) * 0.3 + parseInt(o.color.slice(3, 5), 16) * 0.59 + parseInt(o.color.slice(5, 7), 16) * 0.11;
        if (lum > 238 && b.w * b.h > designArea * 0.8) { o.type = 'skip'; o.why = 'Looks like a white background, so it is skipped'; }
      }
      created.push(o);
    }
    if (!created.length) { toast('Nothing in that SVG was big enough to stitch.'); return; }
    S.objects.push(...created);
    ui.sel = new Set();
    ui.editingText = null;
    const counts = {};
    created.forEach((o) => counts[o.type] = (counts[o.type] || 0) + 1);
    const parts = Object.entries(counts).map(([t, c]) => `${c} ${{ fill: 'fill', satin: 'satin', running: 'outline', skip: 'skipped' }[t]}`);
    toast(`Imported ${created.length} shape${created.length > 1 ? 's' : ''}: ${parts.join(', ')}. Click any shape to change its stitch.`, 5200);
    checkpoint();
    changed();
    fitView();
  }
  async function loadFile(file) {
    if (!file) return;
    const text = await file.text();
    if (/\.json$/i.test(file.name) || text.trim().startsWith('{')) { openProject(text, file.name); return; }
    importSVGText(text, file.name);
  }
  function nameFromFile(fn) { return (fn || '').replace(/\.json$/i, '').replace(/-project$/i, '').trim(); }
  function setProjectName(n) {
    S.projectName = n || '';
    $('projName').textContent = S.projectName || 'Untitled project';
    $('projName').classList.toggle('untitled', !S.projectName);
    document.title = S.projectName ? `${S.projectName} · Stitch Studio` : 'Stitch Studio';
  }
  function openProject(text, fileName, handle) {
    try {
      const d = JSON.parse(text);
      if (!d || d.app !== 'stitch-studio' || !Array.isArray(d.objects)) throw new Error();
      setProjectName(d.name || nameFromFile(fileName) || '');
      ui.fileHandle = handle || null;
      Object.assign(S, { objects: d.objects, hoop: d.hoop || S.hoop, hoopTurn: !!d.hoopTurn, fabric: d.fabric || S.fabric, fabricColor: d.fabricColor || S.fabricColor, knockout: d.knockout !== false, nextId: d.nextId || 1 });
      S.objects.forEach((o) => { o.ver = VER++; S.nextId = Math.max(S.nextId, o.id + 1); });
      ui.sel = new Set(); ui.editingText = null;
      selectionChanged(); // also leaves any drawing tool and forgets selected dots
      syncSettingsUI(); checkpoint(); changed(); fitView();
      toast(S.projectName ? `Opened “${S.projectName}”.` : 'Project opened.');
    } catch (e) { toast('That file is not a Stitch Studio project.'); }
  }

  /* ---------------- generation ---------------- */
  let genTimer = null;
  function setBusy(b) { $('busy').hidden = !b; }
  function changed(sync = true) {
    renderLayers();
    renderInspector();
    updateSteps();
    scheduleGen();
    draw();
  }
  function scheduleGen() {
    clearTimeout(genTimer);
    setBusy(true);
    genTimer = setTimeout(generate, 30);
  }
  function generate() {
    const F = fab();
    const fkey = S.fabric + (S.knockout ? 'k' : '');
    const boxes = S.objects.map(objBBox);
    const live = new Set();
    const prevRes = [];
    results = S.objects.map((o, i) => {
      live.add(o.id);
      let occ = [];
      if (S.knockout && o.type !== 'skip' && o.type !== 'running' && o.kind === 'area') {
        const b = boxes[i];
        for (let j = i + 1; j < S.objects.length; j++) {
          const q = S.objects[j], c = boxes[j];
          if (q.kind !== 'area' || q.type === 'skip' || q.type === 'running') continue;
          if (c.x0 > b.x1 || c.x1 < b.x0 || c.y0 > b.y1 || c.y1 < b.y0) continue;
          occ.push(q);
        }
      }
      // start near where the previous shape of the same colour finished, so they link up
      let start = null;
      for (let j = i - 1; j >= 0; j--) {
        const pr = prevRes[j];
        if (!pr || !pr.segs.length) continue;
        if (S.objects[j].color === o.color) { const ls = pr.segs[pr.segs.length - 1].pts; const q = ls[ls.length - 1]; start = [Math.round(q[0] * 2) / 2, Math.round(q[1] * 2) / 2]; }
        break;
      }
      const key = [o.ver, o.type, JSON.stringify(o.params), fkey, occ.map((q) => q.ver + q.type).join(','), start ? start.join(',') : '-'].join('|');
      const hit = cache.get(o.id);
      if (hit && hit.key === key) { prevRes[i] = hit.res; return hit.res; }
      let res;
      try { res = Core.generate(o, occ.map((q) => q.rings), F, start); }
      catch (e) { console.error(e); res = { segs: [], warn: ['Could not create stitches for this shape. Try another stitch type.'] }; }
      cache.set(o.id, { key, res });
      prevRes[i] = res;
      return res;
    });
    for (const id of [...cache.keys()]) if (!live.has(id)) cache.delete(id);
    A = Core.assemble(S.objects, results);
    setBusy(false);
    renderStats();
    renderLayers();
    renderInspector();
    draw();
  }

  /* ---------------- view & drawing ---------------- */
  const cv = $('cv');
  const ctx = cv.getContext('2d');
  const view = { s: 4, ox: 0, oy: 0 };
  let dpr = 1, cw = 0, ch = 0;
  let theme = {};
  function readTheme() {
    const cs = getComputedStyle(document.documentElement);
    theme = { stage: cs.getPropertyValue('--stage').trim(), hoop: cs.getPropertyValue('--hoop').trim(), accent: cs.getPropertyValue('--accent').trim(), ink: cs.getPropertyValue('--ink').trim() };
  }
  function resize() {
    const r = cv.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    cw = r.width; ch = r.height;
    cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
    draw();
  }
  function fitView() {
    const h = hoop();
    const bb = unionBBox(S.objects);
    const G = hoopGeom(h);
    const w = Math.max(2 * G.ex, bb ? 2 * Math.max(Math.abs(bb.x0), Math.abs(bb.x1)) : 0) + 16;
    const hh = Math.max(2 * G.ey + 24, bb ? 2 * Math.max(Math.abs(bb.y0), Math.abs(bb.y1)) : 0) + 16;
    view.s = Math.min(cw / w, ch / hh);
    view.ox = cw / 2; view.oy = ch / 2;
    draw();
  }
  const toWorld = (x, y) => [(x - view.ox) / view.s, (y - view.oy) / view.s];
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = n >> 8 & 255, b = n & 255;
    if (amt < 0) { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
    else { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  }
  const pathCache = new Map();
  function objPath(o) {
    const c = pathCache.get(o.id);
    if (c && c.ver === o.ver) return c.p;
    const p = new Path2D();
    if (o.kind === 'area') for (const r of o.rings) { r.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); p.closePath(); }
    else for (const q of o.paths) { q.pts.forEach((v, i) => i ? p.lineTo(v[0], v[1]) : p.moveTo(v[0], v[1])); if (q.closed) p.closePath(); }
    pathCache.set(o.id, { ver: o.ver, p });
    return p;
  }
  let drawQueued = false;
  function draw() {
    if (drawQueued) return;
    drawQueued = true;
    requestAnimationFrame(() => { drawQueued = false; paint(); updateScrollbars(); });
  }

  /* ---------------- hoop geometry ---------------- */
  const lumOf = (hex) => { const n = parseInt((hex || '#888888').slice(1, 7), 16); return (n >> 16) * 0.3 + (n >> 8 & 255) * 0.59 + (n & 255) * 0.11; };
  const rrect = (p, x, y, w, h, r) => { r = Math.max(0, Math.min(r, w / 2, h / 2)); p.roundRect(x, y, w, h, r); return p; };
  // Everything in the hoop's own orientation (bracket on the left); paint() rotates it when the hoop is turned.
  function hoopGeom(hp) {
    const w = hp.turned ? hp.h : hp.w, h = hp.turned ? hp.w : hp.h;
    const F = hp.frame || { style: 'screw', m: 8, band: 11, R: 14, mount: 'left' };
    const style = hp.oval ? 'oval' : F.style, m = F.m, bw = F.band;
    const ow = w + 2 * m, oh = h + 2 * m;
    const field = new Path2D(), opening = new Path2D(), outer = new Path2D();
    let seam = null;
    const round = hp.round || hp.oval;
    if (round) {
      field.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
      opening.ellipse(0, 0, ow / 2, oh / 2, 0, 0, Math.PI * 2);
      outer.ellipse(0, 0, ow / 2 + bw, oh / 2 + bw, 0, 0, Math.PI * 2);
      if (style !== 'magnetic') { seam = new Path2D(); seam.ellipse(0, 0, ow / 2 + bw * 0.42, oh / 2 + bw * 0.42, 0, 0, Math.PI * 2); }
    } else {
      field.rect(-w / 2, -h / 2, w, h);
      const R = Math.min(F.R, Math.min(ow, oh) / 2);
      rrect(opening, -ow / 2, -oh / 2, ow, oh, R);
      rrect(outer, -ow / 2 - bw, -oh / 2 - bw, ow + 2 * bw, oh + 2 * bw, R + bw);
      if (style !== 'magnetic' && style !== 'clamp') { const k = bw * 0.42; seam = rrect(new Path2D(), -ow / 2 - k, -oh / 2 - k, ow + 2 * k, oh + 2 * k, R + k); }
    }
    const X = ow / 2 + bw, Y = oh / 2 + bw; // outer half extents
    const parts = [];
    let exL = X, exR = X, exT = Y;
    // where it clips onto the embroidery arm
    if (F.mount === 'left' || F.mount === 'both') {
      const bh = Math.min(70, Math.max(26, oh * 0.42)), bwid = 20;
      const p = rrect(new Path2D(), -X - bwid, -bh / 2, bwid + bw * 0.6, bh, 3);
      parts.push({ path: p, under: true, fill: 'deep' });
      const holes = new Path2D();
      for (const yy of [-bh * 0.28, bh * 0.28]) { holes.moveTo(-X - bwid * 0.5 + 2.6, yy); holes.arc(-X - bwid * 0.5, yy, 2.6, 0, Math.PI * 2); }
      parts.push({ path: holes, fill: 'edge' });
      exL = X + bwid;
      if (F.mount === 'both') {
        parts.push({ path: rrect(new Path2D(), X - bw * 0.6, -bh / 2, bwid + bw * 0.6, bh, 3), under: true, fill: 'deep' });
        const h2 = new Path2D();
        for (const yy of [-bh * 0.28, bh * 0.28]) { h2.moveTo(X + bwid * 0.5 + 2.6, yy); h2.arc(X + bwid * 0.5, yy, 2.6, 0, Math.PI * 2); }
        parts.push({ path: h2, fill: 'edge' });
        exR = X + bwid;
      }
    }
    // tension screw on the outer ring
    if (style === 'screw' || style === 'oval' || style === 'tubular') {
      const sx = round ? 0 : Math.max(-ow / 2 + 10, -ow / 2 + Math.min(F.R, ow / 2) + 6), sy = -Y;
      parts.push({ path: rrect(new Path2D(), sx - 8, sy - 6, 16, 9, 2.5), under: true });
      const knob = new Path2D(); knob.arc(sx, sy - 6, 5.5, 0, Math.PI * 2);
      parts.push({ path: knob });
      const slot = new Path2D(); slot.rect(sx - 3.5, sy - 6.6, 7, 1.2);
      parts.push({ path: slot, fill: 'edge' });
      exT = Y + 12;
    }
    // magnets along the frame
    if (style === 'magnetic') {
      const mg = new Path2D(), t = bw * 0.5, c = bw / 2;
      const along = (len, f) => { const n = Math.max(1, Math.round(len / 55)); for (let i = 0; i < n; i++) f(-len / 2 + (i + 0.5) * len / n); };
      along(ow - 2 * F.R, (x) => { rrect(mg, x - 7, -oh / 2 - c - t / 2, 14, t, 1.5); rrect(mg, x - 7, oh / 2 + c - t / 2, 14, t, 1.5); });
      along(oh - 2 * F.R, (y) => { rrect(mg, -ow / 2 - c - t / 2, y - 7, t, 14, 1.5); rrect(mg, ow / 2 + c - t / 2, y - 7, t, 14, 1.5); });
      parts.push({ path: mg, fill: 'deep' });
    }
    // clamp levers
    if (style === 'clamp') {
      for (const sgn of [-1, 1]) {
        const lv = rrect(new Path2D(), -24, sgn * Y - (sgn < 0 ? 9 : 0), 48, 9, 3);
        parts.push({ path: lv, fill: 'deep' });
      }
      exT = Y + 9;
    }
    const notches = [];
    const n = Math.min(5, bw * 0.45);
    notches.push([0, -oh / 2 - 1, 0, -oh / 2 - 1 - n], [0, oh / 2 + 1, 0, oh / 2 + 1 + n]);
    notches.push([-ow / 2 - 1, 0, -ow / 2 - 1 - n, 0], [ow / 2 + 1, 0, ow / 2 + 1 + n, 0]);
    // extents on screen (after turning)
    const ex = hp.turned ? Math.max(Y, exT) : Math.max(exL, exR);
    const ey = hp.turned ? Math.max(exL, exR) : Math.max(exT, Y);
    return { field, opening, outer, seam, parts, notches, style, ow, oh, ex, ey };
  }
  let dragState = null;
  function paint() {
    const h = hoop();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = theme.stage || '#d9dde4';
    ctx.fillRect(0, 0, cw, ch);
    const s = view.s;
    const W = (a) => ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * view.ox, dpr * view.oy);
    W();
    // hoop: physical frame, inner opening (fabric), stitch area
    const G = hoopGeom(h);
    const dark = lumOf(theme.stage || '#d9dde4') < 100;
    ctx.save();
    if (h.turned) ctx.rotate(Math.PI / 2);
    // shadow under the frame
    ctx.save(); ctx.translate(0.8, 1.4); ctx.fillStyle = dark ? 'rgba(0,0,0,0.45)' : 'rgba(30,40,60,0.16)';
    ctx.fill(G.outer); G.parts.forEach((q) => ctx.fill(q.path)); ctx.restore();
    // fabric in the opening
    ctx.fillStyle = S.fabricColor;
    ctx.fill(G.opening);
    // grid over the fabric
    ctx.save(); ctx.clip(G.opening);
    const lum = lumOf(S.fabricColor);
    ctx.strokeStyle = lum > 128 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1 / s;
    ctx.beginPath();
    const gx = G.ow / 2, gy = G.oh / 2;
    for (let x = 0; x <= gx; x += 10) { ctx.moveTo(x, -gy); ctx.lineTo(x, gy); ctx.moveTo(-x, -gy); ctx.lineTo(-x, gy); }
    for (let y = 0; y <= gy; y += 10) { ctx.moveTo(-gx, y); ctx.lineTo(gx, y); ctx.moveTo(-gx, -y); ctx.lineTo(gx, -y); }
    ctx.stroke();
    // fabric outside the stitch area is shaded: the needle cannot reach it
    const outside = new Path2D(); outside.addPath(G.opening); outside.addPath(G.field);
    ctx.fillStyle = lum > 128 ? 'rgba(40,50,70,0.10)' : 'rgba(0,0,0,0.22)';
    ctx.fill(outside, 'evenodd');
    ctx.strokeStyle = lum > 128 ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.2)';
    ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(4, 0); ctx.moveTo(0, -4); ctx.lineTo(0, 4); ctx.stroke();
    ctx.restore();
    // stitch area edge
    ctx.setLineDash([4 / s, 3 / s]); ctx.lineWidth = 1.2 / s;
    ctx.strokeStyle = lum > 128 ? 'rgba(30,40,60,0.45)' : 'rgba(255,255,255,0.5)';
    ctx.stroke(G.field); ctx.setLineDash([]);
    // the frame itself
    const mag = G.style === 'magnetic';
    const body = mag ? (dark ? '#30353d' : '#3a3f47') : (dark ? '#3b424e' : '#f3f4f6');
    const edge = mag ? (dark ? '#14161a' : '#1c1f24') : (dark ? '#646d7d' : '#9aa2ae');
    const deep = mag ? '#5b616b' : (dark ? '#2a3039' : '#d5d9df');
    const band = new Path2D(); band.addPath(G.outer); band.addPath(G.opening);
    for (const q of G.parts) if (q.under) { ctx.fillStyle = q.fill === 'deep' ? deep : body; ctx.fill(q.path); ctx.lineWidth = 1 / s; ctx.strokeStyle = edge; ctx.stroke(q.path); }
    ctx.fillStyle = body; ctx.fill(band, 'evenodd');
    ctx.lineWidth = 1.2 / s; ctx.strokeStyle = edge;
    ctx.stroke(G.outer); ctx.stroke(G.opening);
    if (G.seam) { ctx.lineWidth = 0.8 / s; ctx.strokeStyle = deep; ctx.stroke(G.seam); }
    for (const q of G.parts) if (!q.under) { ctx.fillStyle = q.fill === 'deep' ? deep : q.fill === 'edge' ? edge : body; ctx.fill(q.path); ctx.lineWidth = 1 / s; ctx.strokeStyle = edge; ctx.stroke(q.path); }
    // centre notches on the frame
    ctx.lineWidth = 1.4 / s; ctx.strokeStyle = mag ? '#c9ced6' : edge;
    ctx.beginPath();
    for (const [x0, y0, x1, y1] of G.notches) { ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); }
    ctx.stroke();
    ctx.restore();
    ctx.font = `${12 / s}px Archivo, sans-serif`;
    ctx.fillStyle = theme.ink; ctx.globalAlpha = 0.55;
    const bn = HOOP_BRANDS[brandOf(S.hoop)].name;
    ctx.fillText(`${brandOf(S.hoop) === 'generic' ? '' : bn.replace(/\s*\(.*/, '') + ' · '}${(HOOPS.find((x) => x.id === S.hoop) || HOOPS[0]).name.replace(/\s*\(.*/, '')} · stitch area ${h.w} × ${h.h} mm`, -G.ex, G.ey + 16 / s);
    ctx.globalAlpha = 1;

    // live preview of a move or a resize of the selection: x' = a*x + e, y' = d*y + f
    let dragOff = null;
    if (dragState && dragState.moving && dragState.mode === 'move') dragOff = { a: 1, d: 1, e: dragState.dx, f: dragState.dy };
    if (dragState && dragState.mode === 'resize' && dragState.moving) { const r = dragState; dragOff = { a: r.sx, d: r.sy, e: r.ax - r.ax * r.sx, f: r.ay - r.ay * r.sy }; }
    const showArt = ui.view !== 'stitch', showSt = ui.view !== 'art';
    // artwork
    if (showArt) {
      S.objects.forEach((o) => {
        ctx.save();
        if (dragOff && ui.sel.has(o.id)) ctx.transform(dragOff.a, 0, 0, dragOff.d, dragOff.e, dragOff.f);
        const p = objPath(o);
        const faint = ui.view === 'both';
        if (o.type === 'skip') {
          ctx.globalAlpha = 0.5; ctx.setLineDash([1.2, 1.2]); ctx.lineWidth = 1.2 / s; ctx.strokeStyle = o.color === '#ffffff' ? '#999' : o.color; ctx.stroke(p);
        } else if (o.kind === 'area') {
          ctx.globalAlpha = faint ? 0.28 : 1; ctx.fillStyle = o.color; ctx.fill(p, 'evenodd');
        } else {
          ctx.globalAlpha = faint ? 0.28 : 1; ctx.strokeStyle = o.color; ctx.lineWidth = o.width; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(p);
        }
        ctx.restore();
      });
    }
    // stitches
    if (showSt && A && A.X.length) {
      const n = A.X.length;
      const lim = ui.sim >= 1 ? n : Math.max(1, Math.floor(ui.sim * n));
      const fine = s >= 3.2;
      const passes = fine ? [[-0.35, 0.40], [0, 0.30], [0.45, 0.09]] : [[0, Math.max(0.3, 1 / s)]];
      const X = A.X, Y = A.Y, C = A.C, O = A.OBJ;
      for (const [amt, lw] of passes) {
        ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.globalAlpha = amt > 0 ? 0.55 : 1;
        let ci = 0, col = A.colors[0], started = false;
        let curOff = null;
        const flush = () => { if (started) { ctx.stroke(); started = false; } };
        for (let i = 0; i < lim; i++) {
          if (C[i] === 3) { flush(); ci++; col = A.colors[ci]; continue; }
          if (C[i] !== 0 || i === 0 || C[i - 1] === 3 || C[i - 1] === 2) continue;
          const off = dragOff && ui.sel.has(S.objects[O[i]] && S.objects[O[i]].id) ? dragOff : null;
          if (!started || off !== curOff) {
            flush(); ctx.beginPath(); started = true; curOff = off;
            ctx.strokeStyle = amt ? shade(col, amt) : col;
          }
          if (off) { ctx.moveTo(off.a * X[i - 1] + off.e, off.d * Y[i - 1] + off.f); ctx.lineTo(off.a * X[i] + off.e, off.d * Y[i] + off.f); }
          else { ctx.moveTo(X[i - 1], Y[i - 1]); ctx.lineTo(X[i], Y[i]); }
        }
        flush();
      }
      ctx.globalAlpha = 1;
      if (ui.jumps) {
        ctx.setLineDash([1.5, 1]); ctx.lineWidth = 1 / s; ctx.strokeStyle = 'rgba(200,40,120,0.75)';
        ctx.beginPath();
        for (let i = 1; i < lim; i++) if (C[i] === 1) { ctx.moveTo(X[i - 1], Y[i - 1]); ctx.lineTo(X[i], Y[i]); }
        ctx.stroke(); ctx.setLineDash([]);
      }
      if (lim < n) {
        const i = lim - 1;
        ctx.fillStyle = theme.accent; ctx.beginPath(); ctx.arc(X[i], Y[i], 5 / s, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5 / s; ctx.stroke();
      }
    }
    // selection
    for (const o of S.objects) {
      const isSel = ui.sel.has(o.id), isHover = hoverId === o.id && !isSel;
      if (!isSel && !isHover) continue;
      ctx.save();
      if (dragOff && isSel) ctx.transform(dragOff.a, 0, 0, dragOff.d, dragOff.e, dragOff.f);
      const p = objPath(o);
      ctx.lineWidth = (isSel ? 2.2 : 1.5) / s;
      ctx.strokeStyle = '#fff'; ctx.setLineDash([]);
      if (o.kind === 'area') ctx.stroke(p);
      ctx.strokeStyle = theme.accent;
      ctx.setLineDash(isSel ? [4 / s, 3 / s] : []);
      if (o.kind === 'area') ctx.stroke(p);
      else { ctx.lineWidth = Math.max(o.width, 2 / s) + 2 / s; ctx.globalAlpha = 0.35; ctx.stroke(p); }
      ctx.restore();
    }
    if (ui.sel.size) {
      let bb = unionBBox(selected());
      if (bb && dragOff) {
        const x0 = dragOff.a * bb.x0 + dragOff.e, x1 = dragOff.a * bb.x1 + dragOff.e, y0 = dragOff.d * bb.y0 + dragOff.f, y1 = dragOff.d * bb.y1 + dragOff.f;
        bb = { x0: Math.min(x0, x1), x1: Math.max(x0, x1), y0: Math.min(y0, y1), y1: Math.max(y0, y1) }; bb.w = bb.x1 - bb.x0; bb.h = bb.y1 - bb.y0;
      }
      if (bb) {
        ctx.save();
        ctx.strokeStyle = theme.accent; ctx.lineWidth = 1 / s; ctx.setLineDash([]);
        const pad = 4 / s;
        ctx.strokeRect(bb.x0 - pad, bb.y0 - pad, bb.w + 2 * pad, bb.h + 2 * pad);
        // resize handles: corners keep proportions, sides stretch one way
        if (!ui.tool && !(dragState && dragState.mode === 'move')) {
          const hs = 8 / s;
          for (const hd of resizeHandles(bb, pad)) {
            ctx.fillStyle = '#fff'; ctx.strokeStyle = theme.accent; ctx.lineWidth = 1.5 / s;
            ctx.fillRect(hd.x - hs / 2, hd.y - hs / 2, hs, hs); ctx.strokeRect(hd.x - hs / 2, hd.y - hs / 2, hs, hs);
          }
        }
        ctx.fillStyle = theme.accent;
        ctx.font = `600 ${11 / s}px Archivo, sans-serif`;
        const pct = dragState && dragState.mode === 'resize' && dragState.moving ? `  (${Math.round(Math.abs(dragState.sx) * 100)}%${Math.abs(dragState.sx - dragState.sy) > 0.001 ? ' × ' + Math.round(Math.abs(dragState.sy) * 100) + '%' : ''})` : '';
        ctx.fillText(`${bb.w.toFixed(1)} × ${bb.h.toFixed(1)} mm${pct}`, bb.x0 - pad, bb.y1 + pad + 16 / s);
        ctx.restore();
      }
    }
    paintGuides(s);
    paintColumns(s);
    // bubble
    const bub = $('bubble');
    if (ui.tool === 'draw') bub.textContent = '';
    else if (ui.tool === 'rail') bub.textContent = '';
    else if (ui.tool === 'rung') bub.textContent = 'Drag a line across both rails to add a rung. Stitches follow the rungs. Esc when done.';
    else if (ui.tool === 'border') bub.textContent = '';
    else if (colObj()) {
      const co = colObj(), hasCols = co.type === 'satin' && co.params.satinDir === 'columns';
      bub.textContent = ui.active && ui.active.kind === 'rp' ? 'Drag a purple arrow to change the direction of its line. Each arrow moves on its own (Shift keeps them lined up).'
        : hasCols ? 'Click a rail dot to get its direction arrows. Drag orange squares to turn rungs.' : 'Click a border dot to move it or get its direction arrows. Double-click a border to add a dot.';
    }
    else if (ui.tool === 'dir') bub.textContent = 'Drag a line across the stroke to set the stitch slant there. Press Esc when done.';
    else if (ui.tool === 'fillDir') bub.textContent = 'Drag a line in the direction you want the fill rows to run';
    else if (!S.objects.length) bub.textContent = 'Drop an SVG on the hoop, or add text on the left';
    else if (!ui.sel.size) bub.textContent = 'Click a shape to choose satin, fill or outline';
    else if (guideObj()) bub.textContent = 'Drag a dot to move the path, a diamond to move that edge. Shift+drag a diamond to change the width on both sides.';
    else bub.textContent = '';
  }


  const GUIDE_COLORS = ['#0f9d58', '#e8730c', '#d93025'];
  function paintGuides(s) {
    const o = guideObj();
    if (!o) return;
    const px = 1 / s;
    const curvePath = (pts, closed) => { const c = Core.catmull(pts, closed); const p = new Path2D(); c.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); if (closed) p.closePath(); return { p, c }; };
    const arrow = (a, b, size) => {
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / d, uy = (b[1] - a[1]) / d;
      ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] - ux * size - uy * size * 0.6, b[1] - uy * size + ux * size * 0.6); ctx.lineTo(b[0] - ux * size + uy * size * 0.6, b[1] - uy * size - ux * size * 0.6); ctx.closePath(); ctx.fill();
    };
    const band = (pv, strong) => {
      if (!pv || pv.left.length < 2) return;
      const p = new Path2D();
      pv.left.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1]));
      if (pv.closed) { p.closePath(); pv.right.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); p.closePath(); }
      else { for (let i = pv.right.length - 1; i >= 0; i--) p.lineTo(pv.right[i][0], pv.right[i][1]); p.closePath(); }
      ctx.fillStyle = strong ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.28)';
      ctx.fill(p, 'evenodd');
      ctx.fillStyle = 'rgba(35,80,212,0.22)';
      ctx.fill(p, 'evenodd');
      ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 3 * px; ctx.stroke(p);
      ctx.strokeStyle = theme.accent; ctx.lineWidth = 1.4 * px; ctx.setLineDash([4 * px, 3 * px]); ctx.stroke(p); ctx.setLineDash([]);
      // start and end rungs, so you can see exactly where the stitches begin and stop
      if (!pv.closed) for (const k of [0, pv.left.length - 1]) {
        ctx.strokeStyle = k ? GUIDE_COLORS[2] : GUIDE_COLORS[0]; ctx.lineWidth = 2.4 * px;
        ctx.beginPath(); ctx.moveTo(pv.left[k][0], pv.left[k][1]); ctx.lineTo(pv.right[k][0], pv.right[k][1]); ctx.stroke();
      }
    };
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const pvs = previewFor(o) || [];
    (o.guides || []).forEach((g, gi) => {
      const act = ui.active && (ui.active.kind === 'g' || ui.active.kind === 'w') && ui.active.gi === gi;
      band(pvs[gi], act);
    });
    (o.guides || []).forEach((g, gi) => {
      const { p, c } = curvePath(g.pts, !!g.closed);
      const act = ui.active && (ui.active.kind === 'g' || ui.active.kind === 'w') && ui.active.gi === gi;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 4 * px; ctx.stroke(p);
      ctx.strokeStyle = theme.accent; ctx.lineWidth = (act ? 2.6 : 1.6) * px; ctx.stroke(p);
      ctx.fillStyle = theme.accent;
      let acc = 0;
      for (let k = 1; k < c.length; k++) {
        acc += Core.dist(c[k - 1], c[k]);
        if (acc > 40 * px) { acc = 0; arrow(c[k - 1], c[k], 6 * px); }
      }
      // width handles (diamonds on both edges)
      const pv = pvs[gi];
      if (pv) pv.handles.forEach((h, pi) => h.forEach((q) => {
        const isA = ui.active && ui.active.kind === 'w' && ui.active.gi === gi && ui.active.pi === pi;
        ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(Math.PI / 4);
        ctx.fillStyle = isA ? theme.accent : '#fff'; ctx.strokeStyle = theme.accent; ctx.lineWidth = 1.4 * px;
        const z = 3.6 * px; ctx.fillRect(-z, -z, 2 * z, 2 * z); ctx.strokeRect(-z, -z, 2 * z, 2 * z);
        ctx.restore();
      }));
      g.pts.forEach((q, pi) => {
        const isStart = pi === 0, isEnd = !g.closed && pi === g.pts.length - 1;
        const isAct = act && ui.active.kind === 'g' && ui.active.pi === pi;
        const r = (isStart || isEnd ? 7 : 4.5) * px;
        ctx.beginPath(); ctx.arc(q[0], q[1], r, 0, Math.PI * 2);
        ctx.fillStyle = isStart ? GUIDE_COLORS[0] : isEnd ? GUIDE_COLORS[2] : (isAct ? theme.accent : '#fff');
        ctx.fill(); ctx.lineWidth = 1.6 * px; ctx.strokeStyle = isStart || isEnd ? '#fff' : theme.accent; ctx.stroke();
        if (isAct) { ctx.beginPath(); ctx.arc(q[0], q[1], r + 3.5 * px, 0, Math.PI * 2); ctx.strokeStyle = theme.accent; ctx.lineWidth = 2 * px; ctx.stroke(); }
        if (isStart || isEnd) {
          ctx.fillStyle = '#fff'; ctx.font = `700 ${9 * px}px Archivo, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(isStart ? String(gi + 1) : '■', q[0], q[1] + 0.5 * px);
        }
      });
    });
    (o.dirs || []).forEach((d, di) => {
      const act = ui.active && ui.active.kind === 'd' && ui.active.di === di;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 5 * px;
      ctx.beginPath(); ctx.moveTo(d.a[0], d.a[1]); ctx.lineTo(d.b[0], d.b[1]); ctx.stroke();
      ctx.strokeStyle = GUIDE_COLORS[1]; ctx.lineWidth = (act ? 3.2 : 2.2) * px; ctx.stroke();
      ctx.fillStyle = act ? GUIDE_COLORS[1] : '#fff'; ctx.lineWidth = 1.6 * px; ctx.strokeStyle = GUIDE_COLORS[1];
      for (const q of [d.a, d.b]) { ctx.fillRect(q[0] - 3.5 * px, q[1] - 3.5 * px, 7 * px, 7 * px); ctx.strokeRect(q[0] - 3.5 * px, q[1] - 3.5 * px, 7 * px, 7 * px); }
    });
    // path being drawn: live preview of the satin it will make
    if (ui.tool === 'draw' && ui.draft.length) {
      let g = draftGuide(true);
      if (g.pts.length >= 2 && Core.dist(g.pts[g.pts.length - 1], g.pts[g.pts.length - 2]) < 0.3) g = draftGuide(false);
      if (g.pts.length >= 2) {
        let pv = null;
        try { pv = Core.guidePreview(o.rings, occFor(o), [g], o.dirs || [])[0]; } catch (e) { console.error(e); }
        band(pv, true);
      }
      const { p } = curvePath(g.pts, false);
      ctx.setLineDash([5 * px, 4 * px]);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 4 * px; ctx.stroke(p);
      ctx.strokeStyle = theme.accent; ctx.lineWidth = 2 * px; ctx.stroke(p);
      ctx.setLineDash([]);
      ui.draft.forEach((q, i) => {
        const last = i === ui.draft.length - 1 && i > 0;
        ctx.beginPath(); ctx.arc(q[0], q[1], (i === 0 || last ? 7 : 4) * px, 0, Math.PI * 2);
        ctx.fillStyle = i === 0 ? GUIDE_COLORS[0] : last ? GUIDE_COLORS[2] : '#fff'; ctx.fill();
        ctx.strokeStyle = i === 0 || last ? '#fff' : theme.accent; ctx.lineWidth = 1.6 * px; ctx.stroke();
      });
      // hovering the last dot: show that a click will finish here
      const lastP = ui.draft[ui.draft.length - 1];
      if (ui.cursor && ui.draft.length >= 2 && Core.dist(ui.cursor, lastP) < 9 * px) {
        ctx.beginPath(); ctx.arc(lastP[0], lastP[1], 11 * px, 0, Math.PI * 2); ctx.strokeStyle = GUIDE_COLORS[2]; ctx.lineWidth = 2 * px; ctx.stroke();
      }
    }
    if (dragState && dragState.mode === 'dirline') {
      ctx.strokeStyle = ui.tool === 'fillDir' ? theme.accent : GUIDE_COLORS[1]; ctx.lineWidth = 2.5 * px;
      ctx.beginPath(); ctx.moveTo(dragState.a[0], dragState.a[1]); ctx.lineTo(dragState.b[0], dragState.b[1]); ctx.stroke();
      if (ui.tool === 'fillDir') { ctx.fillStyle = theme.accent; arrow(dragState.a, dragState.b, 9 * px); }
    }
    ctx.restore();
  }


  /* ===================== satin columns (rails + rungs) ===================== */
  const RAIL_MODES = ['edge', 'curve', 'line'];
  const RAIL_LABEL = { edge: 'Shape edge', curve: 'Smooth curve', line: 'Straight line' };
  // a rail belongs either to a column (rail 'A' or 'B') or to a traced border (rail 'R')
  function railRef(o, a) {
    if (!o || !a) return null;
    if (a.rail === 'R') return o.borders && o.borders[a.ci] ? o.borders[a.ci].R : null;
    return o.columns && o.columns[a.ci] ? o.columns[a.ci][a.rail] : null;
  }
  function newColDraft() { return { stage: 'A', A: { pts: [], modes: [] }, B: { pts: [], modes: [] } }; }
  function colObj() {
    const sel = selected();
    if (sel.length !== 1) return null;
    const o = sel[0];
    if (o.kind !== 'area') return null;
    if (ui.tool === 'rail' || ui.tool === 'rung' || ui.tool === 'border') return o;
    if (o.borders && o.borders.length) return o;
    return o.type === 'satin' && o.params.satinDir === 'columns' ? o : null;
  }
  const colCache = new Map();
  function colPreviews(o) {
    if (!o || !o.columns || !o.columns.length) return [];
    const c = colCache.get(o.id);
    if (c && c.ver === o.ver) return c.data;
    let data = [];
    try { data = o.columns.map((col) => Core.columnPreview(o.rings, col)); } catch (e) { console.error(e); }
    colCache.set(o.id, { ver: o.ver, data });
    return data;
  }
  const borderCache = new Map();
  function borderPreviews(o) {
    if (!o || !o.borders || !o.borders.length) return [];
    const c = borderCache.get(o.id);
    if (c && c.ver === o.ver) return c.data;
    let data = [];
    try { data = o.borders.map((b) => Core.borderPreview(o.rings, b)); } catch (e) { console.error(e); }
    borderCache.set(o.id, { ver: o.ver, data });
    return data;
  }
  function snapTol() { return 12 / view.s; }
  function placePoint(o, p, mode) {
    if (mode === 'edge') { const q = Core.snapToEdge(o.rings, p, snapTol()); if (q) return q; }
    return p;
  }
  function undoRailDot() {
    const d = ui.colDraft; if (!d) return;
    const cur = d[d.stage];
    if (cur.pts.length) { cur.pts.pop(); if (cur.modes.length >= cur.pts.length && cur.modes.length) cur.modes.pop(); }
    else if (d.stage === 'B') { d.stage = 'A'; d.A.closed = false; }
    syncDrawBar(); draw();
  }
  function finishRail(closeLoop) {
    const o = colObj(), d = ui.colDraft;
    if (!o || !d) return;
    const cur = d[d.stage];
    if (cur.pts.length < 2) { toast('A rail needs at least two dots.'); return; }
    if (closeLoop) { cur.closed = true; cur.modes.push(ui.railMode); }
    cur.modes.length = cur.closed ? cur.pts.length : cur.pts.length - 1;
    for (let i = 0; i < cur.modes.length; i++) if (!cur.modes[i]) cur.modes[i] = ui.railMode;
    if (d.border) {
      o.borders = o.borders || [];
      o.borders.push({ R: cur, width: ui.borderW, align: ui.borderAlign, edgeRun: ui.borderEdgeRun && ui.borderEdgeRun.on ? { ...ui.borderEdgeRun } : undefined });
      ui.colDraft = { ...newColDraft(), border: true };
      touch(o); checkpoint(); changed();
      syncDrawBar();
      toast(`Border ${o.borders.length} added. Trace another, or press Done.`, 3600);
      return;
    }
    if (d.stage === 'A') {
      d.stage = 'B';
      syncDrawBar(); draw();
      toast(cur.closed ? 'First rail is a loop. Draw the other edge as a loop too.' : 'First rail done. Now click along the other edge, from the same end.', 4200);
      return;
    }
    o.columns = o.columns || [];
    const made = { A: d.A, B: d.B, rungs: d.rungs || [] };
    if (d.at != null) o.columns.splice(d.at, 0, made); else o.columns.push(made);
    o.type = 'satin'; o.auto = false; o.params.satinDir = 'columns';
    ui.colDraft = newColDraft();
    touch(o); checkpoint(); changed();
    syncDrawBar();
    toast(`Column ${o.columns.length} made. Add rungs to set the stitch direction, or draw the next column.`, 4800);
  }
  // keep whatever has been drawn so far, even if the column is not finished
  function keepDraft() {
    const o = colObj(), d = ui.colDraft;
    if (!o || !d) return;
    if (d.border) { if (d.A.pts.length >= 2) finishRail(); return; }
    if (d.stage === 'B' && d.B.pts.length >= 2) { finishRail(); return; }
    const A = d.A, B = d.B;
    if (!A.pts.length && !B.pts.length) return;
    for (const r of [A, B]) { r.modes.length = Math.max(0, r.closed ? r.pts.length : r.pts.length - 1); for (let i = 0; i < r.modes.length; i++) if (!r.modes[i]) r.modes[i] = ui.railMode; }
    o.columns = o.columns || [];
    const col = { A, B, rungs: d.rungs || [] };
    if (d.at != null) o.columns.splice(d.at, 0, col); else o.columns.push(col);
    o.type = 'satin'; o.auto = false; o.params.satinDir = 'columns';
    ui.colDraft = newColDraft();
    touch(o); checkpoint(); changed();
    toast('Kept your unfinished column. Its dots can be moved now; click Continue in the column list to finish it.', 5200);
  }
  function continueColumn(o, ci) {
    const col = o.columns[ci];
    if (!col) return;
    o.columns.splice(ci, 1);
    touch(o); changed();
    setTool('rail');
    const A = col.A, B = col.B;
    const stage = A.pts.length >= 2 ? 'B' : 'A';
    ui.colDraft = { stage, A, B, rungs: col.rungs || [], at: ci };
    if (stage === 'B') B.modes.length = Math.max(0, B.pts.length - 1);
    syncDrawBar(); draw();
  }
  function startColumns() {
    const sel = selected().filter((q) => q.kind === 'area');
    const o = sel[0];
    if (!o) return;
    for (const q of sel) { q.type = 'satin'; q.auto = false; q.params.satinDir = 'columns'; q.columns = q.columns || []; touch(q); }
    checkpoint(); changed();
    if (sel.length > 1) { toast('These are set to Manual. Click one of them on the hoop to draw its columns.', 4600); return; }
    if (!o.columns.length) { setTool('rail'); toast('Starting clean. Click along one edge of the stroke to draw your first rail.', 4200); }
  }
  function nodeHandleList(o, a) {
    // the two arrow handles of the selected rail dot (only for sides that lead to another dot)
    if (!a || a.kind !== 'rp' || !railRef(o, a)) return [];
    const r = railRef(o, a), n = r.pts.length;
    if (!r.pts[a.pi] || n < 2) return [];
    const h = Core.nodeHandles(r, a.pi), p = r.pts[a.pi];
    const out = [];
    const closed = !!r.closed && n >= 3;
    if (closed || a.pi > 0) out.push({ which: 'in', at: [p[0] + h.in[0], p[1] + h.in[1]] });
    if (closed || a.pi < n - 1) out.push({ which: 'out', at: [p[0] + h.out[0], p[1] + h.out[1]] });
    return out;
  }
  function colHandleAt(o, wx, wy) {
    const tol = 8 / view.s;
    let best = null, bd = tol;
    const pv = colPreviews(o);
    for (const hd of nodeHandleList(o, ui.active)) {
      const d = Core.dist(hd.at, [wx, wy]);
      if (d < bd) { bd = d; best = { kind: 'hd', ci: ui.active.ci, rail: ui.active.rail, pi: ui.active.pi, which: hd.which }; }
    }
    if (best) return best;
    (o.columns || []).forEach((col, ci) => {
      (col.rungs || []).forEach((r, ri) => ['a', 'b'].forEach((end) => { const d = Core.dist(r[end], [wx, wy]); if (d < bd) { bd = d; best = { kind: 'ru', ci, ri, end }; } }));
    });
    if (best) return best;
    (o.columns || []).forEach((col, ci) => ['A', 'B'].forEach((rail) => col[rail].pts.forEach((q, pi) => { const d = Core.dist(q, [wx, wy]); if (d < bd) { bd = d; best = { kind: 'rp', ci, rail, pi }; } })));
    (o.borders || []).forEach((b, bi) => b.R.pts.forEach((q, pi) => { const d = Core.dist(q, [wx, wy]); if (d < bd) { bd = d; best = { kind: 'rp', ci: bi, rail: 'R', pi }; } }));
    if (best) return best;
    borderPreviews(o).forEach((pv, bi) => {
      if (!pv) return;
      for (const P of [pv.mid, pv.left, pv.right]) for (let k = 1; k < P.length; k++) { const d = Core.segDist(wx, wy, P[k - 1][0], P[k - 1][1], P[k][0], P[k][1]); if (d < bd) { bd = d; best = { kind: 'bline', ci: bi, rail: 'R' }; } }
    });
    // a click on a rung line or rail line selects the column
    (o.columns || []).forEach((col, ci) => {
      const p = pv[ci]; if (!p) return;
      (col.rungs || []).forEach((r, ri) => { const d = Core.segDist(wx, wy, r.a[0], r.a[1], r.b[0], r.b[1]); if (d < bd) { bd = d; best = { kind: 'rungline', ci, ri }; } });
      for (const [rail, P] of [['A', p.A], ['B', p.B]]) for (let k = 1; k < P.length; k++) { const d = Core.segDist(wx, wy, P[k - 1][0], P[k - 1][1], P[k][0], P[k][1]); if (d < bd) { bd = d; best = { kind: 'col', ci, rail }; } }
    });
    return best;
  }
  function railSegAt(rail, wx, wy) {
    let bi = 0, bd = Infinity;
    const n = rail.pts.length, segN = rail.closed ? n : n - 1;
    for (let i = 0; i < segN; i++) { const p = rail.pts[i], q = rail.pts[(i + 1) % n]; const d = Core.segDist(wx, wy, p[0], p[1], q[0], q[1]); if (d < bd) { bd = d; bi = i; } }
    return bi;
  }
  // which rail each end of a rung sits on
  function rungRails(pv, r) {
    const near = (P, p) => { let m = Infinity; for (let k = 1; k < P.length; k++) m = Math.min(m, Core.segDist(p[0], p[1], P[k - 1][0], P[k - 1][1], P[k][0], P[k][1])); return m; };
    const straight = near(pv.A, r.a) + near(pv.B, r.b), swapped = near(pv.A, r.b) + near(pv.B, r.a);
    return straight <= swapped ? { a: pv.A, b: pv.B } : { a: pv.B, b: pv.A };
  }
  function snapRung(o, ci, r) {
    const pv = colPreviews(o)[ci];
    if (!pv) return r;
    const R = rungRails(pv, r);
    return { a: Core.railSnap(R.a, r.a, pv.closed), b: Core.railSnap(R.b, r.b, pv.closed) };
  }
  function adjustRung(o, ci, ri, how, amt) {
    const pv = colPreviews(o)[ci];
    const col = o.columns[ci];
    if (!pv || !col.rungs[ri]) return;
    const r = col.rungs[ri], R = rungRails(pv, r);
    if (how === 'slide') col.rungs[ri] = { a: Core.railSlide(R.a, r.a, amt, pv.closed), b: Core.railSlide(R.b, r.b, amt, pv.closed) };
    else if (how === 'turn') col.rungs[ri] = { a: Core.railSlide(R.a, r.a, amt / 2, pv.closed), b: Core.railSlide(R.b, r.b, -amt / 2, pv.closed) };
    else if (how === 'end') { const e = ui.active.end || 'b'; col.rungs[ri] = { ...r, [e]: Core.railSlide(R[e], r[e], amt, pv.closed) }; }
    else if (how === 'square') {
      // put the far end where the rail is closest, so stitches run straight across
      let cur = r;
      for (let it = 0; it < 6; it++) {
        const m = Core.lerp(cur.a, cur.b, 0.5);
        cur = { a: Core.railSnap(R.a, m, pv.closed), b: Core.railSnap(R.b, m, pv.closed) };
      }
      col.rungs[ri] = cur;
    }
    touch(o);
  }
  function rungAngleText(o, ci, ri) {
    const pv = colPreviews(o)[ci];
    const r = o.columns[ci].rungs[ri];
    if (!pv || !r) return '';
    // angle between the rung and "straight across" (the shortest line from its middle to both rails)
    const m = Core.lerp(r.a, r.b, 0.5), R = rungRails(pv, r);
    const sa = Core.railSnap(R.a, m, pv.closed), sb = Core.railSnap(R.b, m, pv.closed);
    const ang = (u, v) => Math.atan2(u[1] - v[1], u[0] - v[0]);
    let d = (ang(r.a, r.b) - ang(sa, sb)) * 180 / Math.PI;
    while (d > 90) d -= 180; while (d < -90) d += 180;
    return Math.abs(d) < 1 ? 'straight across' : `${Math.abs(d).toFixed(0)}° ${d > 0 ? 'clockwise' : 'counter-clockwise'} from straight across`;
  }
  function deleteColActive() {
    const o = colObj(), a = ui.active;
    if (!o || !a) return false;
    if (a.rail === 'R' || a.kind === 'bline') {
      const b = o.borders && o.borders[a.ci];
      if (!b) return false;
      if (a.kind === 'rp' && b.R.pts.length > (b.R.closed ? 3 : 2)) {
        const r = b.R;
        r.pts.splice(a.pi, 1);
        if (r.handles) r.handles.splice(a.pi, 1);
        r.modes.splice(Math.min(a.pi, r.modes.length - 1), 1);
        if (!r.closed) r.modes.length = r.pts.length - 1;
      } else { o.borders.splice(a.ci, 1); if (a.kind === 'rp') toast('That border only had two dots left, so the border was removed. Ctrl+Z brings it back.', 3600); }
      ui.active = null;
      touch(o); checkpoint(); changed();
      return true;
    }
    const col = o.columns[a.ci];
    if (!col) return false;
    if (a.kind === 'ru' || a.kind === 'rungline') col.rungs.splice(a.ri, 1);
    else if (a.kind === 'rp') {
      const r = col[a.rail];
      if (r.pts.length <= (r.closed ? 3 : 2)) {
        // too few dots left for a rail: the rail goes, and a column cannot sew with one rail
        o.columns.splice(a.ci, 1);
        ui.active = null;
        touch(o); checkpoint(); changed();
        toast('That rail only had two dots left, so it was removed along with its column. Ctrl+Z brings it back.', 3600);
        return true;
      }
      r.pts.splice(a.pi, 1);
      if (r.handles) r.handles.splice(a.pi, 1);
      r.modes.splice(Math.min(a.pi, r.modes.length - 1), 1);
      if (!r.closed) r.modes.length = r.pts.length - 1;
    } else if (a.kind === 'col') o.columns.splice(a.ci, 1);
    ui.active = null;
    touch(o); checkpoint(); changed();
    return true;
  }
  function cycleSegMode(o, a, dir = 1) {
    const r = railRef(o, a);
    if (!r.modes.length) return;
    const si = clampSeg(r, a.pi);
    const m = r.modes[si] || 'curve';
    r.modes[si] = RAIL_MODES[(RAIL_MODES.indexOf(m) + dir + RAIL_MODES.length) % RAIL_MODES.length];
    // dots on a shape-edge segment sit on the edge
    if (r.modes[si] === 'edge') { const n = r.pts.length; for (const k of [si, (si + 1) % n]) r.pts[k] = placePoint(o, r.pts[k], 'edge'); }
    touch(o); checkpoint(); changed();
    toast(`That part of the rail now follows: ${RAIL_LABEL[r.modes[si]]}.`);
  }
  // the segment that "belongs" to a dot is the one arriving at it (the first dot uses the one leaving it)
  function clampSeg(r, pi) { return pi === 0 ? (r.closed ? r.modes.length - 1 : 0) : Math.min(pi - 1, r.modes.length - 1); }
  function reverseColumn(col) {
    for (const k of ['A', 'B']) {
      const r = col[k];
      r.pts.reverse();
      if (r.handles) { while (r.handles.length < r.pts.length) r.handles.push(null); r.handles = r.handles.reverse().map((h) => h ? { in: h.out, out: h.in, cusp: h.cusp } : null); }
      if (r.closed) { const first = r.pts.pop(); r.pts.unshift(first); r.modes.reverse(); r.modes.push(r.modes.shift()); if (r.handles) r.handles.unshift(r.handles.pop()); }
      else r.modes.reverse();
    }
  }

  function paintColumns(s) {
    const o = colObj();
    if (!o) return;
    const px = 1 / s;
    const RAIL = '#12a150'; // rails stand out in green against the blue selection and stitches
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const pvs = colPreviews(o);
    const line = (P, closed) => { const p = new Path2D(); P.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); if (closed) p.closePath(); return p; };
    const a = ui.active;
    (o.columns || []).forEach((col, ci) => {
      const pv = pvs[ci];
      const on = a && a.ci === ci;
      if (!pv) {
        // unfinished column: show its rails and dots so they can be edited
        for (const rail of ['A', 'B']) {
          const r = col[rail];
          if (r.pts.length >= 2) {
            let dense = r.pts; try { dense = Core.railDense(r, o.rings); } catch (e) { }
            const p = line(dense, r.closed);
            ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 5 * px; ctx.stroke(p);
            ctx.setLineDash([6 * px, 4 * px]); ctx.strokeStyle = RAIL; ctx.lineWidth = 2.2 * px; ctx.stroke(p); ctx.setLineDash([]);
          }
          r.pts.forEach((q, pi) => {
            const act = a && a.kind === 'rp' && a.ci === ci && a.rail === rail && a.pi === pi;
            ctx.beginPath(); ctx.arc(q[0], q[1], (act ? 6 : 4.5) * px, 0, Math.PI * 2);
            ctx.fillStyle = act ? RAIL : '#fff'; ctx.fill(); ctx.strokeStyle = RAIL; ctx.lineWidth = 1.8 * px; ctx.stroke();
          });
        }
        return;
      }
      // stitch direction preview
      ctx.strokeStyle = on ? 'rgba(35,80,212,0.55)' : 'rgba(35,80,212,0.35)'; ctx.lineWidth = 1 * px;
      ctx.beginPath(); for (const [p, q] of pv.dirs) { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); } ctx.stroke();
      for (const P of [pv.A, pv.B]) {
        const p = line(P, pv.closed);
        ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 5 * px; ctx.stroke(p);
        ctx.strokeStyle = RAIL; ctx.lineWidth = (on ? 3 : 2.2) * px; ctx.stroke(p);
      }
      if (pv.start) {
        for (const [seg, c] of [[pv.start, '#0f9d58'], [pv.end, '#d93025']]) {
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 6 * px; ctx.beginPath(); ctx.moveTo(seg[0][0], seg[0][1]); ctx.lineTo(seg[1][0], seg[1][1]); ctx.stroke();
          ctx.strokeStyle = c; ctx.lineWidth = 3.4 * px; ctx.stroke();
        }
        const m = Core.lerp(pv.start[0], pv.start[1], 0.5);
        ctx.fillStyle = '#0f9d58'; ctx.beginPath(); ctx.arc(m[0], m[1], 7 * px, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = `700 ${9 * px}px Archivo, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(ci + 1), m[0], m[1] + 0.5 * px);
      }
      // rungs
      pv.rungs.forEach((r, ri) => {
        const src = col.rungs[ri];
        const act = a && (a.kind === 'ru' || a.kind === 'rungline') && a.ci === ci && a.ri === ri;
        ctx.globalAlpha = r.ignored ? 0.35 : 1;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 5 * px; ctx.beginPath(); ctx.moveTo(src.a[0], src.a[1]); ctx.lineTo(src.b[0], src.b[1]); ctx.stroke();
        ctx.strokeStyle = '#e8730c'; ctx.lineWidth = (act ? 3.2 : 2.2) * px; ctx.stroke();
        for (const q of [src.a, src.b]) {
          const isA = act && a.kind === 'ru' && src[a.end] === q;
          ctx.fillStyle = isA ? '#e8730c' : '#fff'; ctx.strokeStyle = '#e8730c'; ctx.lineWidth = 1.6 * px;
          ctx.fillRect(q[0] - 4 * px, q[1] - 4 * px, 8 * px, 8 * px); ctx.strokeRect(q[0] - 4 * px, q[1] - 4 * px, 8 * px, 8 * px);
        }
        ctx.globalAlpha = 1;
      });
      // rail dots
      for (const rail of ['A', 'B']) col[rail].pts.forEach((q, pi) => {
        const act = a && a.kind === 'rp' && a.ci === ci && a.rail === rail && a.pi === pi;
        ctx.beginPath(); ctx.arc(q[0], q[1], (act ? 6 : 4.5) * px, 0, Math.PI * 2);
        ctx.fillStyle = act ? RAIL : '#fff'; ctx.fill(); ctx.strokeStyle = RAIL; ctx.lineWidth = 1.8 * px; ctx.stroke();
      });
    });
    // traced borders
    const bpv = borderPreviews(o);
    (o.borders || []).forEach((b, bi) => {
      const pv = bpv[bi];
      const on = a && (a.rail === 'R' || a.kind === 'bline') && a.ci === bi;
      if (pv) {
        const band = new Path2D();
        pv.left.forEach((q, i) => i ? band.lineTo(q[0], q[1]) : band.moveTo(q[0], q[1]));
        if (pv.closed) { band.closePath(); pv.right.forEach((q, i) => i ? band.lineTo(q[0], q[1]) : band.moveTo(q[0], q[1])); band.closePath(); }
        else { for (let i = pv.right.length - 1; i >= 0; i--) band.lineTo(pv.right[i][0], pv.right[i][1]); band.closePath(); }
        ctx.fillStyle = on ? 'rgba(11,143,143,0.32)' : 'rgba(11,143,143,0.16)'; ctx.fill(band, 'evenodd');
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3 * px; ctx.stroke(band);
        ctx.strokeStyle = '#0b8f8f'; ctx.lineWidth = (on ? 1.8 : 1.2) * px; ctx.setLineDash([4 * px, 3 * px]); ctx.stroke(band); ctx.setLineDash([]);
      }
      const r = b.R;
      let dense = r.pts; try { dense = Core.railDense(r, o.rings); } catch (e) { }
      const p = line(dense, r.closed);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 4.5 * px; ctx.stroke(p);
      ctx.strokeStyle = '#0b8f8f'; ctx.lineWidth = (on ? 2.6 : 1.8) * px; ctx.stroke(p);
      r.pts.forEach((q, pi) => {
        const act = a && a.kind === 'rp' && a.rail === 'R' && a.ci === bi && a.pi === pi;
        ctx.beginPath(); ctx.arc(q[0], q[1], (act ? 6 : 4.5) * px, 0, Math.PI * 2);
        ctx.fillStyle = act ? '#0b8f8f' : '#fff'; ctx.fill(); ctx.strokeStyle = '#0b8f8f'; ctx.lineWidth = 1.8 * px; ctx.stroke();
      });
    });
    // arrow handles on the selected dot
    if (a && a.kind === 'rp' && railRef(o, a)) {
      const r = railRef(o, a), p = r.pts[a.pi];
      const nh = Core.nodeHandles(r, a.pi);
      for (const hd of nodeHandleList(o, a)) {
        const q = hd.at;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 4 * px; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
        ctx.strokeStyle = '#7b3fe4'; ctx.lineWidth = 1.6 * px; ctx.setLineDash([4 * px, 3 * px]); ctx.stroke(); ctx.setLineDash([]);
        // arrowhead pointing away from the dot
        const L = Core.dist(p, q) || 1, ux = (q[0] - p[0]) / L, uy = (q[1] - p[1]) / L, z = 9 * px;
        ctx.beginPath();
        ctx.moveTo(q[0] + ux * z * 0.6, q[1] + uy * z * 0.6);
        ctx.lineTo(q[0] - ux * z * 0.6 - uy * z * 0.55, q[1] - uy * z * 0.6 + ux * z * 0.55);
        ctx.lineTo(q[0] - ux * z * 0.6 + uy * z * 0.55, q[1] - uy * z * 0.6 - ux * z * 0.55);
        ctx.closePath();
        ctx.fillStyle = '#7b3fe4'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2 * px; ctx.stroke();
      }
      if (nh.cusp) { ctx.fillStyle = '#7b3fe4'; ctx.fillRect(p[0] - 3 * px, p[1] - 3 * px, 6 * px, 6 * px); }
    }
    // column being drawn
    const d = ui.colDraft;
    if ((ui.tool === 'rail' || ui.tool === 'border') && d) {
      for (const k of ['A', 'B']) {
        const r = d[k];
        if (!r.pts.length) continue;
        let pts = r.pts.slice(), modes = r.modes.slice();
        const live = k === d.stage && ui.cursor;
        if (live) { pts.push(ui.snap || ui.cursor); modes.push(ui.railMode); }
        modes.length = Math.max(0, (r.closed ? pts.length : pts.length - 1));
        let dense = pts;
        try { dense = Core.railDense({ pts, modes, closed: r.closed }, o.rings); } catch (e) { }
        const p = line(dense, r.closed);
        ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 5 * px; ctx.stroke(p);
        const ink = d.border ? '#0b8f8f' : RAIL;
        ctx.strokeStyle = ink; ctx.lineWidth = 2.6 * px; if (live) ctx.setLineDash([]); ctx.stroke(p);
        r.pts.forEach((q, i) => {
          const last = i === r.pts.length - 1 && i > 0;
          ctx.beginPath(); ctx.arc(q[0], q[1], (i === 0 || last ? 6.5 : 4.5) * px, 0, Math.PI * 2);
          ctx.fillStyle = i === 0 ? '#06612f' : last ? '#d93025' : '#fff'; ctx.fill();
          ctx.strokeStyle = i === 0 || last ? '#fff' : ink; ctx.lineWidth = 1.6 * px; ctx.stroke();
        });
      }
      // a preview of the stitches once both rails have points
      if (d.stage === 'B' && d.B.pts.length >= 1 && ui.cursor) {
        try {
          const B = { pts: d.B.pts.concat([ui.snap || ui.cursor]), modes: d.B.modes.concat([ui.railMode]) };
          B.modes.length = B.pts.length - 1;
          const pv = Core.columnPreview(o.rings, { A: d.A, B, rungs: [] });
          if (pv) { ctx.strokeStyle = 'rgba(35,80,212,0.45)'; ctx.lineWidth = 1 * px; ctx.beginPath(); for (const [p, q] of pv.dirs) { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); } ctx.stroke(); }
        } catch (e) { }
      }
      if (ui.snap) {
        ctx.strokeStyle = '#0f9d58'; ctx.lineWidth = 2 * px;
        ctx.beginPath(); ctx.arc(ui.snap[0], ui.snap[1], 7 * px, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(ui.snap[0], ui.snap[1], 2 * px, 0, Math.PI * 2); ctx.fillStyle = '#0f9d58'; ctx.fill();
      }
      const cur = d[d.stage];
      if (ui.cursor && cur.pts.length >= 2 && Core.dist(ui.cursor, cur.pts[cur.pts.length - 1]) < 9 * px) {
        const q = cur.pts[cur.pts.length - 1];
        ctx.beginPath(); ctx.arc(q[0], q[1], 11 * px, 0, Math.PI * 2); ctx.strokeStyle = '#d93025'; ctx.lineWidth = 2 * px; ctx.stroke();
      }
    }
    if (dragState && dragState.mode === 'rungline') {
      ctx.strokeStyle = '#e8730c'; ctx.lineWidth = 2.5 * px;
      ctx.beginPath(); ctx.moveTo(dragState.a[0], dragState.a[1]); ctx.lineTo(dragState.b[0], dragState.b[1]); ctx.stroke();
    }
    ctx.restore();
  }

  function resizeHandles(bb, pad) {
    const xs = [bb.x0 - pad, (bb.x0 + bb.x1) / 2, bb.x1 + pad], ys = [bb.y0 - pad, (bb.y0 + bb.y1) / 2, bb.y1 + pad];
    const out = [];
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
      if (i === 1 && j === 1) continue;
      out.push({ x: xs[i], y: ys[j], hx: i - 1, hy: j - 1, ax: xs[2 - i], ay: ys[2 - j] });
    }
    return out;
  }
  function resizeHandleAt(wx, wy) {
    if (!ui.sel.size || ui.tool) return null;
    const bb = unionBBox(selected());
    if (!bb) return null;
    const pad = 4 / view.s, tol = 7 / view.s;
    return resizeHandles(bb, pad).find((h) => Math.abs(h.x - wx) < tol && Math.abs(h.y - wy) < tol) || null;
  }
  const RESIZE_CURSOR = (h) => h.hx === 0 ? 'ns-resize' : h.hy === 0 ? 'ew-resize' : (h.hx === h.hy ? 'nwse-resize' : 'nesw-resize');

  /* ---------------- hit testing & pointer ---------------- */
  let hoverId = null;
  function hit(wx, wy) {
    const tol = 5 / view.s;
    for (let i = S.objects.length - 1; i >= 0; i--) {
      const o = S.objects[i];
      if (o.kind === 'area') {
        if (Core.pointInRings(wx, wy, o.rings)) return o;
        if (o.type === 'running' || o.type === 'skip') {
          for (const r of o.rings) for (let k = 0; k < r.length; k++) {
            const a = r[k], b = r[(k + 1) % r.length];
            if (Core.segDist(wx, wy, a[0], a[1], b[0], b[1]) < tol) return o;
          }
        }
      } else {
        for (const p of o.paths) for (let k = 1; k < p.pts.length + (p.closed ? 1 : 0); k++) {
          const a = p.pts[k - 1], b = p.pts[k % p.pts.length];
          if (Core.segDist(wx, wy, a[0], a[1], b[0], b[1]) < Math.max(o.width / 2, tol)) return o;
        }
      }
    }
    return null;
  }
  /* ---------- satin path editing helpers ---------- */
  function guideObj() {
    const sel = selected();
    if (sel.length !== 1) return null;
    const o = sel[0];
    if (o.kind !== 'area') return null;
    if (ui.tool === 'fillDir' || ui.tool === 'draw' || ui.tool === 'dir') return o;
    if (ui.tool) return null;
    return o.type === 'satin' && o.params.satinDir === 'guides' ? o : null;
  }
  function handleAt(o, wx, wy) {
    const tol = 8 / view.s;
    let best = null, bd = tol;
    (o.dirs || []).forEach((d, di) => ['a', 'b'].forEach((end) => { const q = d[end]; const dd = Math.hypot(q[0] - wx, q[1] - wy); if (dd < bd) { bd = dd; best = { kind: 'd', di, end }; } }));
    (o.guides || []).forEach((g, gi) => g.pts.forEach((q, pi) => { const dd = Math.hypot(q[0] - wx, q[1] - wy); if (dd < bd) { bd = dd; best = { kind: 'g', gi, pi }; } }));
    if (!best) {
      const pv = previewFor(o);
      (pv || []).forEach((g, gi) => g && g.handles.forEach((h, pi) => h.forEach((q, side) => { const dd = Math.hypot(q[0] - wx, q[1] - wy); if (dd < bd) { bd = dd; best = { kind: 'w', gi, pi, side }; } })));
    }
    return best;
  }
  function guideSegAt(o, wx, wy) {
    const tol = 7 / view.s;
    let best = null, bd = tol;
    (o.guides || []).forEach((g, gi) => {
      const c = Core.catmull(g.pts, !!g.closed);
      // find nearest point on the drawn curve, then map back to the control segment
      for (let k = 1; k < c.length; k++) {
        const d = Core.segDist(wx, wy, c[k - 1][0], c[k - 1][1], c[k][0], c[k][1]);
        if (d < bd) { bd = d; best = { gi, at: [wx, wy] }; }
      }
    });
    if (!best) return null;
    const g = o.guides[best.gi];
    let bi = 0, bdist = Infinity;
    const n = g.pts.length, segN = g.closed ? n : n - 1;
    for (let i = 0; i < segN; i++) {
      const p = g.pts[i], q = g.pts[(i + 1) % n];
      const d = Core.segDist(wx, wy, p[0], p[1], q[0], q[1]);
      if (d < bdist) { bdist = d; bi = i; }
    }
    return { gi: best.gi, insertAt: bi + 1 };
  }
  const previewCache = new Map();
  function previewFor(o) {
    if (!o || !o.guides || !o.guides.length) return null;
    const c = previewCache.get(o.id);
    if (c && c.ver === o.ver) return c.data;
    let data = null;
    try { data = Core.guidePreview(o.rings, occFor(o), o.guides, o.dirs || []); } catch (e) { console.error(e); }
    previewCache.set(o.id, { ver: o.ver, data });
    return data;
  }
  function draftGuide(withCursor) {
    const pts = ui.draft.concat(withCursor && ui.cursor ? [ui.cursor] : []);
    const g = { pts, closed: false };
    if (ui.drawWidthMode === 'fixed') g.w = pts.map(() => ui.drawWidth);
    return g;
  }
  function syncDrawBar() {
    const bar = $('drawBar');
    const on = (ui.tool === 'rail' || ui.tool === 'border') && !!colObj();
    bar.hidden = !on;
    if (!on) return;
    const d = ui.colDraft || newColDraft();
    const cur = d[d.stage];
    $('dbFinish').disabled = cur.pts.length < 2;
    $('dbFinish').textContent = d.stage === 'A' ? '✓ Finish first rail' : '✓ Finish second rail';
    $('dbUndo').disabled = !cur.pts.length && d.stage === 'A';
    bar.querySelectorAll('[data-rm]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.rm === ui.railMode));
    $('dbTitle').textContent = d.border ? `Tracing a satin border · ${ui.borderW.toFixed(1)} mm wide` : `Drawing a satin column · rail ${d.stage === 'A' ? '1' : '2'} of 2`;
    const o = colObj();
    $('dbRungs').hidden = !!d.border;
    $('dbRungs').disabled = !((o && o.columns && o.columns.length) || (d.stage === 'B' && d.B.pts.length >= 2));
    if (d.border) {
      $('dbFinish').textContent = '✓ Finish this border';
      $('dbStep').textContent = !cur.pts.length ? 'Click where the border should start. Shape edge mode follows the outline.' : 'Keep clicking along the part that should get a border. Click the last dot again (or Enter) to finish; click the first dot to go all the way round.';
      return;
    }
    $('dbStep').textContent = d.stage === 'A'
      ? (!cur.pts.length ? 'Click on ONE edge of the stroke, where the stitching should start.' : 'Keep clicking along that edge to where the stitching should end. Click the last dot again (or Enter) to finish this rail.')
      : (!cur.pts.length ? 'Now the OTHER edge. Start at the same end you started the first rail.' : 'Keep clicking along this edge. Click the last dot again (or Enter) to make the column.');
  }
  function setTool(t) {
    ui.tool = t; ui.draft = []; ui.active = null; ui.snap = null;
    ui.colDraft = t === 'rail' ? newColDraft() : t === 'border' ? { ...newColDraft(), border: true } : null;
    if (t === 'border') ui.rtab = 'borders';
    else if (t === 'rail' || t === 'rung' || t === 'fillDir') ui.rtab = 'stitch';
    cv.style.cursor = t ? 'crosshair' : 'default';
    syncDrawBar(); renderInspector(); draw();
  }
  function finishDraft() {
    const o = guideObj();
    let pts = [];
    for (const p of ui.draft) if (!pts.length || Core.dist(pts[pts.length - 1], p) > 0.25) pts.push(p);
    ui.draft = [];
    if (!o || pts.length < 2) { draw(); if (pts.length) toast('A path needs at least two points.'); return; }
    let closed = false;
    if (pts.length >= 4 && Core.dist(pts[0], pts[pts.length - 1]) < Math.max(1.2, 8 / view.s)) { pts.pop(); closed = true; }
    o.guides = o.guides || [];
    const g = { pts, closed, widen: 0 };
    if (ui.drawWidthMode === 'fixed') g.w = pts.map(() => ui.drawWidth);
    o.guides.push(g);
    o.type = 'satin'; o.params.satinDir = 'guides'; o.auto = false;
    touch(o); checkpoint(); changed();
    syncDrawBar();
    toast(`Path ${o.guides.length} added${closed ? ' as a loop' : ''}. Click to start another, or press Done.`, 4200);
  }
  function deleteActive() {
    const o = guideObj(), a = ui.active;
    if (!o || !a) return false;
    if (a.kind === 'd') o.dirs.splice(a.di, 1);
    else if (a.kind === 'w') return false;
    else if (a.pi == null || o.guides[a.gi].pts.length <= 2) o.guides.splice(a.gi, 1);
    else { const g = o.guides[a.gi]; g.pts.splice(a.pi, 1); if (g.w) g.w.splice(a.pi, 1); if (g.e) g.e.splice(a.pi, 1); }
    ui.active = null;
    touch(o); checkpoint(); changed();
    return true;
  }

  let pointers = new Map();
  cv.addEventListener('pointerdown', (e) => {
    cv.focus({ preventScroll: true });
    cv.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, [e.offsetX, e.offsetY]);
    if (pointers.size === 2) { dragState = { pinch: true, d0: pinchDist(), s0: view.s }; ui.draft.pop(); return; }
    const [wx, wy] = toWorld(e.offsetX, e.offsetY);
    const go = guideObj();
    if (e.button === 1 || (e.button === 0 && e.altKey && !ui.tool)) {
      dragState = { mode: 'pan', x: e.offsetX, y: e.offsetY, ox: view.ox, oy: view.oy, moved: true };
      return;
    }
    if (e.button === 2) return; // right-click is handled by the context menu (removes dots), never a deselect
    const co = colObj();
    if (co && (ui.tool === 'rail' || ui.tool === 'border')) {
      if (e.button !== 0) return;
      const d = ui.colDraft || (ui.colDraft = newColDraft());
      const cur = d[d.stage];
      const tol = 9 / view.s;
      const p = [wx, wy];
      if (cur.pts.length >= 2 && Core.dist(cur.pts[cur.pts.length - 1], p) < tol) { finishRail(); return; }
      if (cur.pts.length >= 3 && Core.dist(cur.pts[0], p) < tol) { finishRail(true); return; }
      if (e.detail >= 2) return;
      const q = placePoint(co, p, ui.railMode);
      if (cur.pts.length) cur.modes.push(ui.railMode);
      cur.pts.push(q);
      syncDrawBar(); draw();
      return;
    }
    if (co && ui.tool === 'rung') {
      dragState = { mode: 'rungline', a: [wx, wy], b: [wx, wy] };
      return;
    }
    if (co && !ui.tool && e.button === 0) {
      const h = colHandleAt(co, wx, wy);
      if (h && h.kind === 'hd') {
        dragState = { mode: 'colhandle', h, x: e.offsetX, y: e.offsetY, moving: false };
        return;
      }
      if (h) {
        ui.active = h;
        dragState = h.kind === 'rp' || h.kind === 'ru' || h.kind === 'rungline' ? { mode: 'colhandle', h, x: e.offsetX, y: e.offsetY, moving: false } : null;
        renderInspector(); draw();
        return;
      }
    }
    if (ui.tool === 'draw' && go) {
      if (e.button !== 0) return;
      const tol = 9 / view.s;
      const d = ui.draft;
      if (d.length >= 2 && Core.dist(d[d.length - 1], [wx, wy]) < tol) { finishDraft(); return; }
      if (d.length >= 3 && Core.dist(d[0], [wx, wy]) < tol) { d.push(d[0].slice()); finishDraft(); return; }
      if (e.detail >= 2) return; // the second click of a double-click
      d.push([wx, wy]);
      syncDrawBar(); draw();
      return;
    }
    if ((ui.tool === 'dir' || ui.tool === 'fillDir') && go) {
      dragState = { mode: 'dirline', a: [wx, wy], b: [wx, wy] };
      return;
    }
    if (go && e.button === 0) {
      const h = handleAt(go, wx, wy);
      if (h) {
        ui.active = h;
        dragState = { mode: 'handle', h, x: e.offsetX, y: e.offsetY, moving: false };
        renderInspector(); draw();
        return;
      }
    }
    const rh = e.button === 0 ? resizeHandleAt(wx, wy) : null;
    if (rh) {
      const bb = unionBBox(selected());
      // corners scale around the centre, so the design stays where it is;
      // side handles stretch from the opposite side (in world units, without the visual padding)
      const corner = rh.hx !== 0 && rh.hy !== 0;
      const ax = corner || rh.hx === 0 ? (bb.x0 + bb.x1) / 2 : rh.hx < 0 ? bb.x1 : bb.x0;
      const ay = corner || rh.hy === 0 ? (bb.y0 + bb.y1) / 2 : rh.hy < 0 ? bb.y1 : bb.y0;
      dragState = { mode: 'resize', h: rh, bb, ax, ay, sx: 1, sy: 1, moving: false, x: e.offsetX, y: e.offsetY };
      return;
    }
    const o = hit(wx, wy);
    if (o && e.button === 0) {
      if (e.shiftKey || e.metaKey || e.ctrlKey) {
        if (ui.sel.has(o.id)) ui.sel.delete(o.id); else ui.sel.add(o.id);
        selectionChanged();
        dragState = null;
        return;
      }
      const narrow = ui.sel.has(o.id) && ui.sel.size > 1 ? o.id : null;
      if (!ui.sel.has(o.id)) { ui.sel = new Set([o.id]); selectionChanged(); }
      if (ui.active) { ui.active = null; renderInspector(); }
      dragState = { mode: 'move', x: e.offsetX, y: e.offsetY, dx: 0, dy: 0, moving: false, narrow };
    } else {
      dragState = { mode: 'pan', x: e.offsetX, y: e.offsetY, ox: view.ox, oy: view.oy, moved: false };
    }
  });
  cv.addEventListener('dblclick', (e) => {
    const co = colObj();
    if (co && !ui.tool) {
      const [wx, wy] = toWorld(e.offsetX, e.offsetY);
      const h = colHandleAt(co, wx, wy);
      if (h && (h.kind === 'col' || h.kind === 'bline')) {
        if (h.kind === 'bline') h.rail = 'R';
        const r = railRef(co, h);
        const si = railSegAt(r, wx, wy);
        const mode = r.modes[si] || 'curve';
        r.pts.splice(si + 1, 0, placePoint(co, [wx, wy], mode));
        r.modes.splice(si, 0, mode);
        if (r.handles) r.handles.splice(si + 1, 0, null);
        ui.active = { kind: 'rp', ci: h.ci, rail: h.rail, pi: si + 1 };
        touch(co); checkpoint(); changed();
        return;
      }
      if (h) return;
    }
    const go = guideObj();
    if (ui.tool === 'draw') { finishDraft(); return; }
    if (!go && !ui.tool) {
      const [wx, wy] = toWorld(e.offsetX, e.offsetY);
      const o = hit(wx, wy);
      if (o && o.group) { selectGroup(o.group); return; }
    }
    if (!go || ui.tool) return;
    const [wx, wy] = toWorld(e.offsetX, e.offsetY);
    if (handleAt(go, wx, wy)) return;
    const seg = guideSegAt(go, wx, wy);
    if (seg) {
      const gg = go.guides[seg.gi];
      if (gg.w) { const a = gg.w[seg.insertAt - 1] ?? gg.w[0], b = gg.w[seg.insertAt % gg.w.length] ?? a; gg.w.splice(seg.insertAt, 0, (a + b) / 2); }
      if (gg.e) { const a = gg.e[seg.insertAt - 1] ?? gg.e[0], b = gg.e[seg.insertAt % gg.e.length] ?? a; gg.e.splice(seg.insertAt, 0, a.map((v, k) => (v + b[k]) / 2)); }
      gg.pts.splice(seg.insertAt, 0, [wx, wy]);
      ui.active = { kind: 'g', gi: seg.gi, pi: seg.insertAt };
      touch(go); checkpoint(); changed();
    }
  });
  cv.addEventListener('contextmenu', (e) => {
    const co = colObj();
    if (co) {
      e.preventDefault();
      if (ui.tool === 'rail') { finishRail(); return; }
      const [wx, wy] = toWorld(e.offsetX, e.offsetY);
      const h = colHandleAt(co, wx, wy);
      if (h && (h.kind === 'rp' || h.kind === 'ru' || h.kind === 'rungline')) { ui.active = h; deleteColActive(); }
      return;
    }
    const go = guideObj();
    if (!go) return;
    const [wx, wy] = toWorld(e.offsetX, e.offsetY);
    const h = handleAt(go, wx, wy);
    if (h) { e.preventDefault(); ui.active = h; deleteActive(); }
    else if (ui.tool === 'draw' && ui.draft.length) { e.preventDefault(); finishDraft(); }
  });
  function pinchDist() { const p = [...pointers.values()]; return Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]); }
  cv.addEventListener('pointermove', (e) => {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, [e.offsetX, e.offsetY]);
    const [wx, wy] = toWorld(e.offsetX, e.offsetY);
    ui.cursor = [wx, wy];
    if (dragState && dragState.pinch && pointers.size === 2) {
      const k = pinchDist() / dragState.d0;
      zoomAt(cw / 2, ch / 2, (dragState.s0 * k) / view.s);
      return;
    }
    if (!dragState) {
      if (ui.tool === 'rail' || ui.tool === 'border') {
        const co = colObj();
        ui.snap = co && ui.railMode === 'edge' ? Core.snapToEdge(co.rings, [wx, wy], snapTol()) : null;
        cv.style.cursor = 'crosshair'; draw(); return;
      }
      if (ui.tool) { if (ui.tool === 'draw' && ui.draft.length) draw(); cv.style.cursor = 'crosshair'; return; }
      const rhv = resizeHandleAt(wx, wy);
      if (rhv) { cv.style.cursor = RESIZE_CURSOR(rhv); return; }
      const co = colObj();
      if (co) { const h = colHandleAt(co, wx, wy); if (h && (h.kind === 'rp' || h.kind === 'ru' || h.kind === 'rungline' || h.kind === 'hd')) { cv.style.cursor = h.kind === 'rungline' ? 'move' : 'grab'; return; } }
      const go = guideObj();
      if (go && handleAt(go, wx, wy)) { cv.style.cursor = 'grab'; return; }
      const o = hit(wx, wy);
      const id = o ? o.id : null;
      cv.style.cursor = o ? (ui.sel.has(o.id) ? 'move' : 'pointer') : 'grab';
      if (id !== hoverId) { hoverId = id; draw(); }
      return;
    }
    const dx = e.offsetX - dragState.x, dy = e.offsetY - dragState.y;
    if (dragState.mode === 'pan') {
      if (Math.abs(dx) + Math.abs(dy) > 3) dragState.moved = true;
      view.ox = dragState.ox + dx; view.oy = dragState.oy + dy;
      cv.style.cursor = 'grabbing';
      draw();
    } else if (dragState.mode === 'move') {
      if (!dragState.moving && Math.abs(dx) + Math.abs(dy) > 4) dragState.moving = true;
      if (dragState.moving) { dragState.dx = dx / view.s; dragState.dy = dy / view.s; draw(); }
    } else if (dragState.mode === 'resize') {
      const r = dragState;
      if (!r.moving && Math.abs(dx) + Math.abs(dy) > 2) r.moving = true;
      if (!r.moving) return;
      const bb = r.bb;
      const hx = r.h.hx < 0 ? bb.x0 : bb.x1, hy = r.h.hy < 0 ? bb.y0 : bb.y1;
      let sx = r.h.hx ? (wx - r.ax) / ((hx - r.ax) || 1e-9) : 1;
      let sy = r.h.hy ? (wy - r.ay) / ((hy - r.ay) || 1e-9) : 1;
      const minS = Math.max(1 / Math.max(bb.w, 1e-6), 1 / Math.max(bb.h, 1e-6)) * 2; // keep at least ~2 mm
      sx = Math.max(sx, minS); sy = Math.max(sy, minS);
      if (r.h.hx && r.h.hy && !e.shiftKey) { const k = Math.max(sx, sy); sx = sy = k; }
      r.sx = sx; r.sy = sy;
      cv.style.cursor = RESIZE_CURSOR(r.h);
      draw();
    } else if (dragState.mode === 'dirline' || dragState.mode === 'rungline') {
      dragState.b = [wx, wy]; draw();
    } else if (dragState.mode === 'colhandle') {
      if (!dragState.moving && Math.abs(dx) + Math.abs(dy) > 2) dragState.moving = true;
      if (!dragState.moving) return;
      const co = colObj(), h = dragState.h;
      if (!co) return;
      const col = co.columns ? co.columns[h.ci] : null;
      if (h.kind === 'hd') {
        const r = railRef(co, h);
        const n = r.pts.length;
        r.handles = r.handles || [];
        while (r.handles.length < n) r.handles.push(null);
        const cur = Core.nodeHandles(r, h.pi);
        const p = r.pts[h.pi];
        const v = [wx - p[0], wy - p[1]];
        const other = h.which === 'in' ? 'out' : 'in';
        // each arrow moves on its own; hold Shift to keep the other one lined up
        const linked = e.shiftKey;
        const nh = { in: cur.in.slice(), out: cur.out.slice(), cusp: !linked };
        nh[h.which] = v;
        if (linked) {
          // smooth node: the other arrow stays in line, keeping its own length
          const L = Math.hypot(...v) || 1, Lo = Math.hypot(...cur[other]);
          nh[other] = [-v[0] / L * Lo, -v[1] / L * Lo];
        }
        r.handles[h.pi] = nh;
        // the parts of the rail next to this dot become curves so the handles take effect
        const closed = !!r.closed && n >= 3;
        const segIn = h.pi > 0 ? h.pi - 1 : (closed ? n - 1 : -1), segOut = h.pi < n - 1 || closed ? h.pi % (closed ? n : n) : -1;
        for (const k of [segIn, segOut]) if (k >= 0 && k < r.modes.length && r.modes[k] !== 'curve') { r.modes[k] = 'curve'; dragState.converted = true; }
      } else if (h.kind === 'ru') {
        const pv = colPreviews(co)[h.ci];
        if (pv) { if (!dragState.rails) dragState.rails = rungRails(pv, col.rungs[h.ri]); col.rungs[h.ri][h.end] = Core.railSnap(dragState.rails[h.end], [wx, wy], pv.closed); }
        else col.rungs[h.ri][h.end] = [wx, wy];
      } else if (h.kind === 'rungline') {
        const pv = colPreviews(co)[h.ci];
        if (!dragState.orig) { dragState.orig = { ...col.rungs[h.ri] }; dragState.rails = pv ? rungRails(pv, col.rungs[h.ri]) : null; dragState.w0 = [wx, wy]; }
        const ddx = wx - dragState.w0[0], ddy = wy - dragState.w0[1];
        const o0 = dragState.orig;
        const na = [o0.a[0] + ddx, o0.a[1] + ddy], nb = [o0.b[0] + ddx, o0.b[1] + ddy];
        col.rungs[h.ri] = pv ? { a: Core.railSnap(dragState.rails.a, na, pv.closed), b: Core.railSnap(dragState.rails.b, nb, pv.closed) } : { a: na, b: nb };
      }
      else {
        const r = railRef(co, h);
        // always work from the rail as it was when the drag started
        if (!dragState.orig) dragState.orig = { pts: r.pts.map((q) => q.slice()), modes: r.modes.slice(), handles: r.handles ? r.handles.slice() : null, pi: h.pi };
        const O = dragState.orig, pi0 = O.pi, n = O.pts.length;
        r.pts = O.pts.map((q) => q.slice()); r.modes = O.modes.slice(); if (O.handles) r.handles = O.handles.slice(); else delete r.handles;
        const closed = !!r.closed && n >= 3;
        const segIn = pi0 > 0 ? pi0 - 1 : (closed ? n - 1 : -1);
        const segOut = pi0 < n - 1 ? pi0 : (closed ? n - 1 : -1);
        const touchesEdge = [segIn, segOut].some((k) => k >= 0 && O.modes[k] === 'edge');
        // snap only when dropped right on the outline (Alt = never snap)
        const snapped = touchesEdge && !e.altKey ? Core.snapToEdge(co.rings, [wx, wy], 5 / view.s) : null;
        const np = snapped || [wx, wy];
        let pi = pi0;
        if (touchesEdge && !snapped) {
          // the traced parts stay on the outline: only a short piece next to this dot leaves the edge and curves to it
          const pull = Core.dist(O.pts[pi0], np);
          const along = (P, s) => { let acc = 0; for (let k = 1; k < P.length; k++) { const L = Core.dist(P[k - 1], P[k]); if (acc + L >= s) { const t = L ? (s - acc) / L : 0; return [P[k - 1][0] + (P[k][0] - P[k - 1][0]) * t, P[k - 1][1] + (P[k][1] - P[k - 1][1]) * t]; } acc += L; } return P[P.length - 1].slice(); };
          const plen = (P) => { let L = 0; for (let k = 1; k < P.length; k++) L += Core.dist(P[k - 1], P[k]); return L; };
          const ins = (at, pt, modeBefore, modeAfter, seg) => {
            r.pts.splice(at, 0, pt);
            r.modes[seg] = modeBefore; r.modes.splice(seg + 1, 0, modeAfter);
            if (r.handles) r.handles.splice(at, 0, null);
          };
          // the piece after the dot first, so the index of the piece before it does not move
          let shift = 0;
          if (segOut >= 0 && O.modes[segOut] === 'edge') {
            const P = Core.edgePath(co.rings, O.pts[pi0], O.pts[(pi0 + 1) % n]), L = plen(P);
            if (L > 3) { const d = Core.clamp(1.2 * pull + 1, 1.5, 0.45 * L); ins(pi0 + 1, along(P, d), 'curve', 'edge', segOut); shift = 1; }
            else r.modes[segOut] = 'curve';
          }
          if (segIn >= 0 && O.modes[segIn] === 'edge') {
            // on a closed rail the piece before dot 0 is the last one, which moved along if a dot was just added after dot 0
            const a = segIn + (segIn > pi0 ? shift : 0), P = Core.edgePath(co.rings, O.pts[segIn], O.pts[pi0]), L = plen(P);
            if (L > 3) { const d = Core.clamp(1.2 * pull + 1, 1.5, 0.45 * L); ins(a + 1, along(P, L - d), 'edge', 'curve', a); if (a + 1 <= pi) pi++; }
            else r.modes[segIn] = 'curve';
          }
        }
        r.pts[pi] = np;
        h.pi = pi;
        dragState.unsnapped = touchesEdge && !snapped;
      }
      touch(co); scheduleGen(); draw();
      cv.style.cursor = 'grabbing';
    } else if (dragState.mode === 'handle') {
      if (!dragState.moving && Math.abs(dx) + Math.abs(dy) > 2) dragState.moving = true;
      if (!dragState.moving) return;
      const go = guideObj(), h = dragState.h;
      if (!go) return;
      if (h.kind === 'g') go.guides[h.gi].pts[h.pi] = [wx, wy];
      else if (h.kind === 'w') {
        const g = go.guides[h.gi];
        const shift = e.shiftKey;
        if (!dragState.base) {
          dragState.base = { fr: Core.ctrlFrames(g)[h.pi] };
          if (!shift && !g.e) { g.e = Core.captureEdges(go.rings, occFor(go), g, go.dirs || []); delete g.w; g.widen = 0; }
          if (shift && !g.e && !g.w) { g.w = Core.measureWidths(go.rings, occFor(go), g.pts, !!g.closed).map((v) => +(v + (g.widen || 0)).toFixed(2)); g.widen = 0; }
        }
        const { fr } = dragState.base;
        const dx0 = wx - fr.q[0], dy0 = wy - fr.q[1];
        const along = dx0 * fr.T[0] + dy0 * fr.T[1], across = dx0 * fr.N[0] + dy0 * fr.N[1];
        if (g.e) {
          const E = g.e[h.pi];
          if (shift) { const m = Math.max(0.15, Math.abs(across)); E[1] = m; E[3] = -m; }
          else if (h.side === 0) { E[0] = along; E[1] = across; }
          else { E[2] = along; E[3] = across; }
        } else {
          g.w[h.pi] = Math.max(0.3, Math.min(12, 2 * Math.abs(across) - (g.widen || 0)));
        }
      }
      else go.dirs[h.di][h.end] = [wx, wy];
      touch(go); scheduleGen(); draw();
      cv.style.cursor = 'grabbing';
    }
  });
  const endPointer = (e) => {
    pointers.delete(e.pointerId);
    if (!dragState) return;
    if (dragState.pinch) { if (pointers.size < 2) dragState = null; return; }
    // a plain click on one part of a selected word or SVG picks just that part (drag to move them all)
    if (dragState.mode === 'move' && !dragState.moving && dragState.narrow != null && e.type === 'pointerup') {
      ui.sel = new Set([dragState.narrow]); dragState = null; selectionChanged(); return;
    }
    if (dragState.mode === 'move' && dragState.moving) {
      translate(selected(), dragState.dx, dragState.dy);
      dragState = null;
      checkpoint(); changed();
      return;
    }
    if (dragState.mode === 'resize') {
      const r = dragState;
      dragState = null;
      if (r.moving && (Math.abs(r.sx - 1) > 1e-4 || Math.abs(r.sy - 1) > 1e-4)) {
        setBusy(true);
        scale(selected(), r.sx, r.sy, r.ax, r.ay).then(() => {
          checkpoint(); changed();
          const bb = unionBBox(selected());
          if (bb) toast(`Resized to ${bb.w.toFixed(1)} × ${bb.h.toFixed(1)} mm. Stitches were recalculated, so the density stays right.`);
        });
      } else draw();
      return;
    }
    if (dragState.mode === 'colhandle') {
      const moved = dragState.moving, uns = dragState.unsnapped, conv = dragState.converted;
      dragState = null;
      if (moved && conv) toast('That part of the rail is now a curve shaped by the handles.', 3600);
      if (moved) { checkpoint(); changed(); if (uns) toast('The rail still follows the outline you traced; only the short piece next to this dot curves off to it. New dots mark where it leaves the edge, and you can move them too.', 5600); }
      return;
    }
    if (dragState.mode === 'rungline') {
      const { a, b } = dragState;
      dragState = null;
      const co = colObj();
      if (co && Core.dist(a, b) >= 0.6) {
        // attach to the column whose rails are closest to both ends
        const pvs = colPreviews(co);
        let bi = -1, bd = Infinity;
        const near = (P, p) => { let m = Infinity; for (let k = 1; k < P.length; k++) m = Math.min(m, Core.segDist(p[0], p[1], P[k - 1][0], P[k - 1][1], P[k][0], P[k][1])); return m; };
        pvs.forEach((pv, ci) => { if (!pv) return; const d1 = Math.min(near(pv.A, a) + near(pv.B, b), near(pv.A, b) + near(pv.B, a)); if (d1 < bd) { bd = d1; bi = ci; } });
        if (bi < 0) { toast('Add rails for a column first, then add rungs across it.'); draw(); return; }
        co.columns[bi].rungs.push(snapRung(co, bi, { a, b }));
        ui.active = { kind: 'rungline', ci: bi, ri: co.columns[bi].rungs.length - 1 };
        touch(co); checkpoint(); changed();
      } else draw();
      return;
    }
    if (dragState.mode === 'handle') {
      const moved = dragState.moving;
      dragState = null;
      if (moved) { checkpoint(); changed(); }
      return;
    }
    if (dragState.mode === 'dirline') {
      const { a, b } = dragState;
      dragState = null;
      const go = guideObj();
      if (go && Core.dist(a, b) >= 0.8) {
        if (ui.tool === 'fillDir') {
          let ang = Math.round(-Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI);
          ang = ((ang % 180) + 180) % 180;
          go.params.angle = ang;
          touch(go); setTool(null); checkpoint(); changed();
          toast(`Fill direction set to ${ang}°.`);
        } else {
          go.dirs = go.dirs || [];
          go.dirs.push({ a, b });
          touch(go); checkpoint(); changed();
        }
      } else draw();
      return;
    }
    if (dragState.mode === 'pan' && !dragState.moved && e.type === 'pointerup') {
      if (ui.sel.size) { ui.sel = new Set(); selectionChanged(); }
    }
    dragState = null;
    cv.style.cursor = 'grab';
    draw();
  };
  cv.addEventListener('pointerup', endPointer);
  cv.addEventListener('pointercancel', endPointer);
  cv.addEventListener('pointerleave', () => { if (hoverId != null) { hoverId = null; draw(); } });
  function zoomAt(x, y, k) {
    const ns = Math.min(80, Math.max(0.5, view.s * k));
    k = ns / view.s;
    view.ox = x - (x - view.ox) * k; view.oy = y - (y - view.oy) * k; view.s = ns;
    draw();
  }
  cv.addEventListener('wheel', (e) => { e.preventDefault(); zoomAt(e.offsetX, e.offsetY, Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018))); }, { passive: false });
  $('zoomIn').onclick = () => zoomAt(cw / 2, ch / 2, 1.3);
  $('zoomOut').onclick = () => zoomAt(cw / 2, ch / 2, 1 / 1.3);
  $('zoomFit').onclick = fitView;


  /* ---------------- scrollbars ---------------- */
  // the scrollable area is the hoop with its frame plus the design, with room to spare around it,
  // and always includes what is on screen now
  function scrollExtent() {
    const G = hoopGeom(hoop());
    let x0 = -G.ex, x1 = G.ex, y0 = -G.ey, y1 = G.ey + 20;
    const bb = unionBBox(S.objects);
    if (bb) { x0 = Math.min(x0, bb.x0); x1 = Math.max(x1, bb.x1); y0 = Math.min(y0, bb.y0); y1 = Math.max(y1, bb.y1); }
    const mx = (x1 - x0) * 0.25 + 20, my = (y1 - y0) * 0.25 + 20;
    x0 -= mx; x1 += mx; y0 -= my; y1 += my;
    const v = viewRect();
    return { x0: Math.min(x0, v.x0), x1: Math.max(x1, v.x1), y0: Math.min(y0, v.y0), y1: Math.max(y1, v.y1) };
  }
  const viewRect = () => ({ x0: -view.ox / view.s, x1: (cw - view.ox) / view.s, y0: -view.oy / view.s, y1: (ch - view.oy) / view.s });
  let scrollDrag = null;
  function updateScrollbars() {
    if (!cw || !ch) return;
    const E = scrollDrag ? scrollDrag.E : scrollExtent(), v = viewRect();
    for (const [id, a0, a1, e0, e1] of [['hScroll', v.x0, v.x1, E.x0, E.x1], ['vScroll', v.y0, v.y1, E.y0, E.y1]]) {
      const bar = $(id), th = bar.firstElementChild;
      const span = e1 - e0, frac = (a1 - a0) / span;
      bar.classList.toggle('off', frac >= 0.995);
      const start = Math.max(0, (a0 - e0) / span), size = Math.min(1, frac);
      if (id === 'hScroll') { th.style.left = (start * 100) + '%'; th.style.width = (size * 100) + '%'; }
      else { th.style.top = (start * 100) + '%'; th.style.height = (size * 100) + '%'; }
    }
  }
  function wireScrollbar(id, horiz) {
    const bar = $(id), th = bar.firstElementChild;
    const len = () => horiz ? bar.clientWidth : bar.clientHeight;
    th.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      th.setPointerCapture(e.pointerId);
      scrollDrag = { E: scrollExtent(), p: horiz ? e.clientX : e.clientY, o: horiz ? view.ox : view.oy };
      bar.classList.add('drag');
    });
    th.addEventListener('pointermove', (e) => {
      if (!scrollDrag) return;
      const E = scrollDrag.E, span = horiz ? E.x1 - E.x0 : E.y1 - E.y0;
      const d = ((horiz ? e.clientX : e.clientY) - scrollDrag.p) / len() * span * view.s; // in screen pixels of the canvas
      if (horiz) view.ox = scrollDrag.o - d; else view.oy = scrollDrag.o - d;
      draw();
    });
    const end = () => { if (!scrollDrag) return; scrollDrag = null; bar.classList.remove('drag'); draw(); };
    th.addEventListener('pointerup', end); th.addEventListener('pointercancel', end);
    // a click on the empty part of the bar moves one screen towards the click
    bar.addEventListener('pointerdown', (e) => {
      if (e.target !== bar) return;
      e.preventDefault();
      const r = th.getBoundingClientRect(), before = horiz ? e.clientX < r.left : e.clientY < r.top;
      const page = (horiz ? cw : ch) * 0.85 * (before ? 1 : -1);
      if (horiz) view.ox += page; else view.oy += page;
      draw();
    });
  }
  wireScrollbar('hScroll', true);
  wireScrollbar('vScroll', false);

  function selectGroup(g) {
    const members = S.objects.filter((q) => q.group === g);
    ui.sel = new Set(members.map((q) => q.id));
    selectionChanged();
    toast(members[0].text ? `Selected the whole word ${members[0].groupName} (${members.length} letters).` : `Selected all ${members.length} parts of “${members[0].groupName || 'the SVG'}”. Drag a corner handle to resize it.`);
  }
  function selectionChanged() {
    const sel = selected();
    ui.tool = null; ui.draft = []; ui.active = null; ui.colDraft = null; ui.snap = null;
    syncDrawBar();
    if (sel.length && ui.rtab === 'order' && !ui.keepTab) ui.rtab = 'stitch';
    ui.keepTab = false;
    if (sel.length && sel.every((q) => q.text) && ui.ltab !== 'text') ui.ltab = 'text';
    if (sel.length && sel[0].text && sel.every((q) => q.text && (q === sel[0] || (q.group && q.group === sel[0].group)))) { ui.editingText = sel[0].id; writeTextForm(sel[0].text); $('txtColor').value = sel[0].color; }
    else if (ui.editingText) { ui.editingText = null; syncTextUI(); }
    renderInspector(); renderLayers(); draw();
  }

  /* ---------------- keyboard ---------------- */
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if (mod && e.key.toLowerCase() === 'y' && !typing) { e.preventDefault(); redo(); return; }
    if (typing) return;
    if (e.key === 'Tab' && (ui.tool === 'rail' || ui.tool === 'border' || (ui.active && ui.active.kind === 'rp' && colObj()))) {
      e.preventDefault();
      if (ui.tool === 'rail' || ui.tool === 'border') {
        ui.railMode = RAIL_MODES[(RAIL_MODES.indexOf(ui.railMode) + (e.shiftKey ? 2 : 1)) % 3];
        const co = colObj();
        ui.snap = co && ui.railMode === 'edge' && ui.cursor ? Core.snapToEdge(co.rings, ui.cursor, snapTol()) : null;
        syncDrawBar(); draw();
        toast('Rail follows: ' + RAIL_LABEL[ui.railMode], 1600);
      } else cycleSegMode(colObj(), ui.active, e.shiftKey ? -1 : 1);
      return;
    }
    if (ui.tool === 'rail' || ui.tool === 'border') {
      if (e.key === 'Escape') { e.preventDefault(); keepDraft(); setTool(null); return; }
      if (e.key === 'Enter') { e.preventDefault(); finishRail(); return; }
      if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); undoRailDot(); return; }
      return;
    }
    if (ui.tool === 'rung' && (e.key === 'Escape' || e.key === 'Enter')) { e.preventDefault(); setTool(null); return; }
    if (ui.active && colObj() && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); deleteColActive(); return; }
    if (ui.active && (ui.active.kind === 'ru' || ui.active.kind === 'rungline') && colObj() && e.key.startsWith('Arrow')) {
      e.preventDefault();
      const o = colObj(), a = ui.active, st = e.shiftKey ? 1.5 : 0.3;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') adjustRung(o, a.ci, a.ri, a.kind === 'ru' ? 'end' : 'slide', e.key === 'ArrowRight' ? st : -st);
      else adjustRung(o, a.ci, a.ri, 'turn', e.key === 'ArrowUp' ? st : -st);
      clearTimeout(adjustRung.t); adjustRung.t = setTimeout(checkpoint, 400);
      changed();
      return;
    }
    if (ui.tool) {
      if (e.key === 'Escape') { e.preventDefault(); if (ui.tool === 'draw' && ui.draft.length) { ui.draft = []; syncDrawBar(); draw(); } else setTool(null); return; }
      if (e.key === 'Enter') { e.preventDefault(); if (ui.tool === 'draw') finishDraft(); else setTool(null); return; }
      if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); if (ui.draft.length) { ui.draft.pop(); syncDrawBar(); draw(); } return; }
      return;
    }
    if (ui.active && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); deleteActive(); return; }
    if (ui.active && e.key === 'Escape') { ui.active = null; renderInspector(); draw(); return; }
    if (mod && e.key.toLowerCase() === 'a') { e.preventDefault(); ui.sel = new Set(S.objects.map((o) => o.id)); selectionChanged(); return; }
    if (e.key === 'Escape') { ui.sel = new Set(); selectionChanged(); return; }
    if (!ui.sel.size) return;
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeSelected(); return; }
    const step = e.shiftKey ? 5 : 0.5;
    const mv = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (mv) { e.preventDefault(); translate(selected(), mv[0], mv[1]); checkpoint(); changed(); return; }
    const t = { s: 'satin', f: 'fill', o: 'running', x: 'skip' }[e.key.toLowerCase()];
    if (t && !mod) setType(t);
  });

  /* ---------------- actions ---------------- */
  function setType(t) {
    const sel = selected();
    if (!sel.length) return;
    for (const o of sel) {
      if (o.kind === 'line' && t === 'fill') continue;
      o.type = t; o.auto = false;
    }
    checkpoint(); changed();
  }
  function setParam(k, v, live) {
    for (const o of selected()) o.params[k] = v;
    if (!live) checkpoint();
    changed();
  }
  function removeSelected() {
    const n = ui.sel.size;
    S.objects = S.objects.filter((o) => !ui.sel.has(o.id));
    ui.sel = new Set(); ui.editingText = null;
    syncTextUI();
    checkpoint(); changed();
    toast(`Deleted ${n} shape${n > 1 ? 's' : ''}. Press Ctrl+Z to undo.`);
  }
  function duplicateSelected() {
    // copies form their own word or SVG group, so editing a copy never touches the original
    const regroup = new Map();
    const stamp = Date.now().toString(36);
    const copies = selected().map((o) => {
      const c = JSON.parse(JSON.stringify(o));
      c.id = S.nextId++; c.ver = VER++; c.name = o.name + ' copy';
      if (c.group) { if (!regroup.has(c.group)) regroup.set(c.group, c.group.replace(/-.*$/, '') + '-' + stamp + '-' + regroup.size); c.group = regroup.get(c.group); }
      return c;
    });
    translate(copies, 5, 5);
    S.objects.push(...copies);
    ui.sel = new Set(copies.map((c) => c.id));
    checkpoint(); selectionChanged(); changed();
  }
  function moveOrder(dir) {
    const ids = [...ui.sel];
    const arr = S.objects;
    const idx = arr.map((o, i) => ui.sel.has(o.id) ? i : -1).filter((i) => i >= 0);
    if (dir < 0) { for (const i of idx) if (i > 0 && !ui.sel.has(arr[i - 1].id)) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; }
    else { for (const i of idx.reverse()) if (i < arr.length - 1 && !ui.sel.has(arr[i + 1].id)) [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; }
    checkpoint(); changed();
  }
  function autoAll(list) {
    for (const o of list) autoPick(o);
    checkpoint(); changed();
    toast(`Picked stitches for ${list.length} shape${list.length > 1 ? 's' : ''}.`);
  }
  function groupColors() {
    // move each object earlier, next to the last object of the same colour, if it does not cross anything it overlaps
    const arr = S.objects.slice();
    const boxes = new Map(arr.map((o) => [o.id, objBBox(o)]));
    const overlap = (a, b) => { const p = boxes.get(a.id), q = boxes.get(b.id); return !(p.x0 > q.x1 || p.x1 < q.x0 || p.y0 > q.y1 || p.y1 < q.y0); };
    const before = colorChanges(arr);
    for (let i = 1; i < arr.length; i++) {
      const o = arr[i];
      let j = i - 1;
      while (j >= 0 && arr[j].color !== o.color) {
        if (overlap(arr[j], o)) { j = -2; break; }
        j--;
      }
      if (j >= 0 && j < i - 1) { arr.splice(i, 1); arr.splice(j + 1, 0, o); }
    }
    S.objects = arr;
    const after = colorChanges(arr);
    checkpoint(); changed();
    toast(after < before ? `Colour changes cut from ${before} to ${after}.` : 'Colours are already grouped as far as possible without changing what sits on top.');
  }
  function colorChanges(arr) { let n = 0, c = null; for (const o of arr) { if (o.type === 'skip') continue; if (c && o.color !== c) n++; c = o.color; } return n; }

  /* ---------------- inspector ---------------- */
  const ICONS = {
    satin: '<svg viewBox="0 0 40 30"><path d="M6 6 L10 24 L12 6 L16 24 L18 6 L22 24 L24 6 L28 24 L30 6 L34 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    fill: '<svg viewBox="0 0 40 30"><rect x="5" y="5" width="30" height="20" rx="3" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M5 11 L11 5 M5 17 L17 5 M5 23 L23 5 M9 25 L29 5 M15 25 L35 5 M21 25 L35 11 M27 25 L35 17" stroke="currentColor" stroke-width="1.3"/></svg>',
    running: '<svg viewBox="0 0 40 30"><rect x="6" y="6" width="28" height="18" rx="6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-dasharray="4 2.5"/></svg>',
    skip: '<svg viewBox="0 0 40 30"><circle cx="20" cy="15" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M13.6 21.4 L26.4 8.6" stroke="currentColor" stroke-width="1.6"/></svg>',
  };
  const TYPE_LABEL = { satin: 'Satin', fill: 'Fill', running: 'Outline', skip: 'Skip' };
  const TYPE_HELP = {
    satin: 'Smooth, shiny zig-zag stitches. Best for letters, borders and narrow shapes up to about 7 mm wide.',
    fill: 'Rows of stitches that cover large areas. Best for anything wider than about 7 mm.',
    running: 'A single line of stitches along the edge. Good for fine details and outlines.',
    skip: 'Leave this shape out. Useful for backgrounds and fabric-coloured areas.',
  };
  function angleDial(deg) {
    const a = -deg * Math.PI / 180, x = 17 + Math.cos(a) * 13, y = 17 + Math.sin(a) * 13;
    return `<svg viewBox="0 0 34 34" aria-hidden="true"><circle cx="17" cy="17" r="15" fill="none" stroke="var(--line)" stroke-width="1.5"/><line x1="${34 - x}" y1="${34 - y}" x2="${x}" y2="${y}" stroke="var(--accent)" stroke-width="2.4" stroke-linecap="round"/></svg>`;
  }
  function segHTML(name, opts, cur) {
    return `<div class="seg" data-param="${name}">${opts.map(([v, l]) => `<button type="button" data-val="${v}" aria-pressed="${String(cur) === String(v)}">${l}</button>`).join('')}</div>`;
  }
  function renderInspector() {
    if (ui.reordering) return;
    const box = $('inspector');
    const sel = selected();
    if (document.activeElement && box.contains(document.activeElement) && document.activeElement.type === 'range') return; // keep slider while dragging
    if (!sel.length) {
      const bb = unionBBox(S.objects);
      box.innerHTML = `<div class="rtab" data-rtab="stitch"><h2>Pick stitches</h2>
        <div class="empty-state">
          <p>${S.objects.length ? 'Click any shape on the hoop to choose how it is stitched. Hold Shift to pick several.' : 'Add an SVG or some text to get started. Every shape gets a stitch type picked for it automatically.'}</p>
          ${S.objects.length ? `<button id="autoAllBtn" class="primary big">Auto-digitize everything</button>
          <p class="hint">Narrow parts become satin, wide parts become fill, tiny details become outlines. You can change any of them after.</p>` : ''}
        </div></div>
        <div class="rtab" data-rtab="borders"><h2>Satin borders</h2><p class="hint">${S.objects.length ? 'Click a shape on the hoop, then trace the parts of its outline that should get a satin border.' : 'Add a shape first.'}</p></div>
        <div class="rtab" data-rtab="arrange">${bb ? `<h2>Whole design size</h2>${sizeBoxHTML(bb)}
        <div class="row"><button class="small ghost" id="fitHoopBtn">Fit to hoop</button><button class="small ghost" id="centerBtn">Centre in hoop</button></div>` : '<p class="hint">Nothing on the hoop yet.</p>'}</div>`;
      applyTabs();
      const ab = $('autoAllBtn'); if (ab) ab.onclick = () => autoAll(S.objects);
      wireSizeBox(S.objects);
      const fb = $('fitHoopBtn');
      if (fb) fb.onclick = async () => { const b = unionBBox(S.objects), h = hoop(); const k = Math.min((h.w - 12) / b.w, (h.h - 12) / b.h); const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2; await scale(S.objects, k, k, cx, cy); translate(S.objects, -cx, -cy); checkpoint(); changed(); fitView(); };
      const cb = $('centerBtn');
      if (cb) cb.onclick = () => { const b = unionBBox(S.objects); translate(S.objects, -(b.x0 + b.x1) / 2, -(b.y0 + b.y1) / 2); checkpoint(); changed(); };
      return;
    }
    const o = sel[0];
    const multi = sel.length > 1;
    const types = sel.some((q) => q.kind === 'area') ? ['satin', 'fill', 'running', 'skip'] : ['satin', 'running', 'skip'];
    const curType = sel.every((q) => q.type === o.type) ? o.type : null;
    const P = o.params;
    const res = results[S.objects.indexOf(o)];
    const warns = multi ? [] : (res ? res.warn : []);
    const rec = multi ? null : Core.analyze(o);
    const bb = unionBBox(sel);
    const sizeWarn = !multi && o.type === 'satin' && o.kind === 'area' && rec && rec.type === 'fill' ? 'This shape is wide for satin. Long satin stitches can snag; fill is safer.' : null;
    const fillWarn = !multi && o.type === 'fill' && rec && rec.type === 'satin' ? 'This shape is narrow. Satin usually looks better on narrow shapes.' : null;
    let opts = '';
    if (curType === 'fill') {
      opts += `<div class="optrow"><span>Direction</span><div class="angle">${angleDial(P.angle)}<input type="range" min="0" max="179" step="1" value="${P.angle}" data-param="angle" aria-label="Fill direction"><output>${P.angle}°</output></div></div>`;
      if (!multi) opts += `<div class="optrow"><span></span><button type="button" class="small ${ui.tool === 'fillDir' ? 'toggle' : 'ghost'}" id="fillDirBtn" aria-pressed="${ui.tool === 'fillDir'}">✎ Draw the direction on the shape</button></div>`;
      opts += `<div class="optrow"><span>Density</span>${segHTML('density', [['light', 'Light'], ['normal', 'Normal'], ['dense', 'Dense']], P.density)}</div>`;
      opts += `<div class="optrow"><span>Edge</span>${segHTML('border', [['none', 'None'], ['running', 'Outline'], ['satin', 'Satin border']], P.border)}</div>`;
      if (P.border === 'satin') opts += `<div class="optrow"><span>Border width</span><div class="angle"><span></span><input type="range" min="0.8" max="5" step="0.1" value="${P.borderWidth}" data-param="borderWidth" aria-label="Border width"><output>${(+P.borderWidth).toFixed(1)} mm</output></div></div>`;
      if (P.border === 'satin' && !multi) opts += edgeRunHTML('erBorderAll', P.edgeRun, true);
    } else if (curType === 'satin') {
      if (o.kind === 'area') {
        const dirOpts = [['follow', 'Automatic'], ['columns', 'Manual']];
        if (P.satinDir === 'guides') dirOpts.push(['guides', 'Old paths']);
        if (P.satinDir === 'angle') dirOpts.push(['angle', 'Old: one angle']);
        opts += `<div class="optrow"><span>Direction</span>${segHTML('satinDir', dirOpts, P.satinDir)}</div>`;
        if (P.satinDir === 'guides' && !multi) opts += guidePanelHTML(o);
        if (P.satinDir === 'columns' && !multi) opts += columnPanelHTML(o);
        if (P.satinDir === 'angle') opts += `<div class="optrow"><span>Angle</span><div class="angle">${angleDial(P.satinAngle)}<input type="range" min="0" max="179" step="1" value="${P.satinAngle}" data-param="satinAngle" aria-label="Satin angle"><output>${P.satinAngle}°</output></div></div>`;
      } else {
        opts += `<p class="hint">Satin column ${o.width.toFixed(1)} mm wide, following the line.</p>`;
        if (!multi) opts += edgeRunHTML('erLine', P.edgeRun, o.paths.every((q) => q.closed));
      }
      const dens = { light: 1.25, normal: 1, dense: 0.85 }[P.density || 'normal'];
      const sp = P.spacing != null ? P.spacing : +(fab().satin * dens).toFixed(2);
      const sh = P.shortAmt != null ? P.shortAmt : 0.3;
      opts += `<div class="optrow"><span>Spacing</span><div class="angle"><span class="sp-auto">${P.spacing != null ? '<button type="button" class="link" id="spAuto" title="Back to the fabric default">Auto</button>' : ''}</span><input type="range" min="0.25" max="0.8" step="0.01" value="${sp}" data-param="spacing" aria-label="Distance between stitches on the edge"><output>${sp.toFixed(2)} mm</output></div></div>
        <p class="hint">Distance between stitch points along the edge. Smaller is denser.</p>
        <div class="optrow"><span>On curves</span>${segHTML('curveMode', [['outer', 'Keep outside edge full'], ['center', 'Even in the middle']], P.curveMode || 'outer')}</div>
        <div class="optrow"><span>Short stitches</span><div class="angle"><span></span><input type="range" min="0" max="0.5" step="0.05" value="${sh}" data-param="shortAmt" aria-label="Short stitches on the inside of curves"><output>${sh === 0 ? 'Off' : Math.round(sh * 100) + '%'}</output></div></div>
        <p class="hint">On the inside of a curve, every other stitch stops short so the thread does not pile up. Raise it if inside corners look bulky.</p>`;
      if (o.kind === 'area') opts += `<div class="optrow"><span>Edge</span>${segHTML('border', [['none', 'None'], ['running', 'Outline'], ['satin', 'Satin border']], P.border)}</div>`;
      if (o.kind === 'area' && P.border === 'satin' && !multi) opts += edgeRunHTML('erBorderAll', P.edgeRun, true);
    } else if (curType === 'running') {
      opts += `<div class="optrow"><span>Line</span>${segHTML('triple', [[false, 'Single'], [true, 'Bold (triple)']], P.triple)}</div>`;
      opts += `<div class="optrow"><span>Stitch length</span><div class="angle"><span></span><input type="range" min="1.5" max="4" step="0.1" value="${P.runLen}" data-param="runLen" aria-label="Stitch length"><output>${(+P.runLen).toFixed(1)} mm</output></div></div>`;
    }
    let more = '';
    if (curType === 'fill' || curType === 'satin') {
      const pullV = P.pull == null ? fab().pull : P.pull;
      more = `<details class="more"><summary>More settings</summary><div class="opts">
        <label class="check"><input type="checkbox" data-param="underlay" ${P.underlay !== false ? 'checked' : ''}> Underlay stitches (keeps the top layer smooth)</label>
        <div class="optrow"><span>Pull compensation</span><div class="angle"><span></span><input type="range" min="0" max="0.8" step="0.05" value="${pullV}" data-param="pull" aria-label="Pull compensation"><output>${pullV.toFixed(2)} mm</output></div></div>
        <p class="hint">Pull compensation makes shapes slightly wider to make up for the fabric pulling in. Your fabric choice sets a good default.</p>
      </div></details>`;
    }
    const isText = o.text && sel.every((q) => q.text && (q === o || (q.group && q.group === o.group)));
    box.innerHTML = `
      <div class="selhead">
        <input type="color" id="selColor" value="${o.color}" aria-label="Thread colour">
        ${multi ? `<strong>${sel.length} shapes selected</strong>` : `<input type="text" id="selName" value="${esc(o.name)}" aria-label="Name">`}
      </div>
      <div class="thread">${multi ? '' : `Closest Brother thread: ${esc(threadName(o.color))}`}</div>
      ${(() => {
        const g = o.group;
        if (!g || !sel.every((q) => q.group === g)) return '';
        const members = S.objects.filter((q) => q.group === g);
        if (members.length < 2) return '';
        if (o.text) {
          if (members.every((q) => ui.sel.has(q.id))) return `<p class="hint">The whole word ${esc(o.groupName)} is selected. Click one letter on the hoop to change just that letter.</p>`;
          return `<p class="hint">${multi ? `${sel.length} letters` : `The letter <b>${esc(o.name.split('  ·  ')[0])}</b>`} of ${esc(o.groupName)}. Settings here change only ${multi ? 'these letters' : 'this letter'}.</p><button type="button" class="small ghost" id="selGroup">Select the whole word (${members.length} letters)</button>`;
        }
        if (members.every((q) => ui.sel.has(q.id))) return `<p class="hint">The whole SVG “${esc(o.groupName || 'SVG')}” is selected. Drag a handle on the hoop, or type a size below, to resize it.</p>`;
        return `<button type="button" class="small" id="selGroup">Select the whole SVG (${members.length} parts) to resize it</button>`;
      })()}
      <div class="rtab" data-rtab="stitch">
      <h2 style="margin-top:6px">Stitch type</h2>
      <div class="types ${types.length === 3 ? 'three' : ''}">${types.map((t) => `<button type="button" data-type="${t}" aria-pressed="${curType === t}" title="${esc(TYPE_HELP[t])}">${ICONS[t]}${TYPE_LABEL[t]}<span class="kbd">${{ satin: 'S', fill: 'F', running: 'O', skip: 'X' }[t]}</span></button>`).join('')}</div>
      ${curType ? `<p class="hint">${TYPE_HELP[curType]}</p>` : '<p class="hint">These shapes use different stitch types. Pick one to set them all.</p>'}
      ${!multi && o.kind === 'area' && !(o.type === 'satin' && P.satinDir === 'columns') ? '<button type="button" class="small" id="quickDraw">✎ Manual: draw the satin columns yourself</button>' : ''}
      ${!multi && rec ? `<div class="rec">${o.auto ? '<span class="auto">Auto</span>' : ''}<span>Suggested: <b>${TYPE_LABEL[rec.type]}</b>. ${esc(rec.why)}.</span>${o.type !== rec.type ? '<button class="link" id="useRec">Use suggestion</button>' : ''}</div>` : `<button class="small ghost" id="autoSelBtn">Let the app pick for these</button>`}
      ${(warns.length || sizeWarn || fillWarn) ? `<div class="warns">${[sizeWarn, fillWarn, ...warns].filter(Boolean).map((w) => `<div class="warn">${esc(w)}</div>`).join('')}</div>` : ''}
      ${opts ? `<div class="opts">${opts}</div>` : ''}
      ${more}
      </div>
      <div class="rtab" data-rtab="borders">${!multi && o.kind === 'area' ? borderPanelHTML(o) : `<h2>Satin borders</h2><p class="hint">${multi ? 'Select one shape at a time to trace its borders.' : 'Borders can be traced on filled shapes and letters. Lines from an SVG already are a satin or outline.'}</p>`}</div>
      <div class="rtab" data-rtab="arrange">
      <h2 style="margin-top:6px">Size and position</h2>
      ${sizeBoxHTML(bb)}
      <div class="row">
        <button class="small ghost" id="rotL" title="Rotate left">⟲ 90°</button>
        <button class="small ghost" id="rotR" title="Rotate right">⟳ 90°</button>
        <button class="small ghost" id="flipBtn" title="Mirror">Mirror</button>
        <button class="small ghost" id="centerSel">Centre</button>
      </div>
      <div class="row">
        ${isText ? '<button class="small" id="editTextBtn">Edit text</button>' : ''}
        <button class="small ghost" id="upBtn" title="Sew earlier">Sew earlier</button>
        <button class="small ghost" id="downBtn" title="Sew later">Sew later</button>
        <button class="small ghost" id="dupBtn">Duplicate</button>
        <button class="small ghost" id="delBtn">Delete</button>
      </div>
      </div>`;
    applyTabs();
    box.querySelectorAll('[data-type]').forEach((b) => b.onclick = () => setType(b.dataset.type));
    box.querySelectorAll('.seg[data-param]').forEach((sg) => sg.querySelectorAll('button').forEach((b) => b.onclick = () => {
      let v = b.dataset.val; if (v === 'true') v = true; else if (v === 'false') v = false;
      if (sg.dataset.param === 'satinDir' && v === 'guides') { startGuides(); return; }
      if (sg.dataset.param === 'satinDir' && v === 'columns') { startColumns(); return; }
      setParam(sg.dataset.param, v);
    }));
    box.querySelectorAll('input[type=range][data-param]').forEach((r) => {
      const k = r.dataset.param;
      r.oninput = () => {
        const v = +r.value;
        const out = rowOf(r).querySelector('output');
        if (out) out.textContent = k === 'angle' || k === 'satinAngle' ? v + '°' : k === 'shortAmt' ? (v === 0 ? 'Off' : Math.round(v * 100) + '%') : ((k === 'pull' || k === 'spacing') ? v.toFixed(2) : v.toFixed(1)) + ' mm';
        const dial = rowOf(r).querySelector('svg');
        if (dial && (k === 'angle' || k === 'satinAngle')) dial.outerHTML = angleDial(v);
        for (const q of selected()) q.params[k] = v;
        scheduleGen(); draw();
      };
      r.onchange = () => { checkpoint(); r.blur(); renderInspector(); };
    });
    box.querySelectorAll('input[type=checkbox][data-param]').forEach((c) => c.onchange = () => setParam(c.dataset.param, c.checked));
    $('selColor').oninput = (e) => { for (const q of selected()) { q.color = normHex(e.target.value); } draw(); renderLayers(); scheduleGen(); };
    $('selColor').onchange = () => { checkpoint(); changed(); };
    const nm = $('selName'); if (nm) nm.onchange = () => { o.name = nm.value.trim() || o.name; checkpoint(); renderLayers(); };
    const ur = $('useRec'); if (ur) ur.onclick = () => { autoPick(o); checkpoint(); changed(); };
    const as = $('autoSelBtn'); if (as) as.onclick = () => autoAll(sel);
    wireGuidePanel(o);
    wireColumnPanel(o);
    wireBorderPanel(o);
    wireEdgeRun('erLine', () => o.params.edgeRun, (v) => { o.params.edgeRun = v; }, o);
    wireEdgeRun('erBorderAll', () => o.params.edgeRun, (v) => { o.params.edgeRun = v; }, o);
    wireRailPoint(o);
    const sg = $('selGroup'); if (sg) sg.onclick = () => selectGroup(o.group);
    const qd = $('quickDraw');
    if (qd) qd.onclick = () => {
      o.type = 'satin'; o.auto = false; o.params.satinDir = 'columns'; o.columns = o.columns || [];
      touch(o); checkpoint(); changed(); setTool('rail');
    };
    const spa = $('spAuto'); if (spa) spa.onclick = () => setParam('spacing', null);
    const fd = $('fillDirBtn'); if (fd) fd.onclick = () => setTool(ui.tool === 'fillDir' ? null : 'fillDir');
    wireSizeBox(sel);
    const c = () => { const b = unionBBox(selected()); return [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2]; };
    $('rotL').onclick = async () => { const [x, y] = c(); await rotate(selected(), -90, x, y); checkpoint(); changed(); };
    $('rotR').onclick = async () => { const [x, y] = c(); await rotate(selected(), 90, x, y); checkpoint(); changed(); };
    $('flipBtn').onclick = async () => { const [x] = c(); await flip(selected(), x); checkpoint(); changed(); };
    $('centerSel').onclick = () => { const [x, y] = c(); translate(selected(), -x, -y); checkpoint(); changed(); };
    $('upBtn').onclick = () => moveOrder(-1);
    $('downBtn').onclick = () => moveOrder(1);
    $('dupBtn').onclick = duplicateSelected;
    $('delBtn').onclick = removeSelected;
    const et = $('editTextBtn'); if (et) et.onclick = () => { setTab('l', 'text'); $('txt').focus(); };
  }

  /* ---------- satin path panel ---------- */
  function occFor(o) {
    if (!S.knockout) return [];
    const i = S.objects.indexOf(o), b = objBBox(o);
    const out = [];
    for (let j = i + 1; j < S.objects.length; j++) {
      const q = S.objects[j];
      if (q.kind !== 'area' || q.type === 'skip' || q.type === 'running') continue;
      const c = objBBox(q);
      if (c.x0 > b.x1 || c.x1 < b.x0 || c.y0 > b.y1 || c.y1 < b.y0) continue;
      out.push(q.rings);
    }
    return out;
  }
  function startGuides() {
    const o = selected()[0];
    if (!o) return;
    o.type = 'satin'; o.auto = false; o.params.satinDir = 'guides';
    if (!o.guides || !o.guides.length) {
      o.guides = Core.autoGuides(o.rings, occFor(o), { spacing: fab().satin, margin: 0.3 });
      o.dirs = o.dirs || [];
      toast(o.guides.length ? `Started you with ${o.guides.length} path${o.guides.length > 1 ? 's' : ''} from the automatic satin. Drag the dots to change them, or draw your own.` : 'Draw a path along the middle of the stroke.', 5200);
    }
    touch(o); checkpoint(); changed();
  }
  function guideLen(g) { const c = Core.catmull(g.pts, !!g.closed); let L = 0; for (let i = 1; i < c.length; i++) L += Core.dist(c[i - 1], c[i]); return L; }

  function columnPanelHTML(o) {
    const C = o.columns || [];
    const a = ui.active;
    const pvs = colPreviews(o);
    const railLen = (P) => { let L = 0; for (let i = 1; i < P.length; i++) L += Core.dist(P[i - 1], P[i]); return L; };
    let info = '';
    if (a && C[a.ci] && a.rail !== 'R' && a.kind !== 'bline') {
      const col = C[a.ci];
      if (a.kind === 'rp') {
        info = railPointHTML(o, a, `Column ${a.ci + 1} · rail ${a.rail === 'A' ? 1 : 2} · dot ${a.pi + 1}`);
      } else if ((a.kind === 'ru' || a.kind === 'rungline') && col.rungs[a.ri]) {
        info = `<div class="railinfo">
          <b>Column ${a.ci + 1} · rung ${a.ri + 1}</b>
          <span class="hint">Stitches here run ${esc(rungAngleText(o, a.ci, a.ri))}.</span>
          <span class="lbl">Turn it</span>
          <div class="row"><button type="button" class="small" data-ra="turn" data-v="-1.5" title="Turn more">↺↺</button><button type="button" class="small" data-ra="turn" data-v="-0.3">↺</button><button type="button" class="small" data-ra="square">Square it up</button><button type="button" class="small" data-ra="turn" data-v="0.3">↻</button><button type="button" class="small" data-ra="turn" data-v="1.5" title="Turn more">↻↻</button></div>
          <span class="lbl">Slide it along the column</span>
          <div class="row"><button type="button" class="small" data-ra="slide" data-v="-1.5">◀◀</button><button type="button" class="small" data-ra="slide" data-v="-0.3">◀ start</button><button type="button" class="small" data-ra="slide" data-v="0.3">end ▶</button><button type="button" class="small" data-ra="slide" data-v="1.5">▶▶</button></div>
          <p class="hint">On the canvas: drag an orange square to move that end along its rail, or drag the middle of the rung to slide it. Keys: <kbd>↑</kbd><kbd>↓</kbd> turn, <kbd>←</kbd><kbd>→</kbd> slide (hold Shift for bigger steps).</p>
          <div class="row"><button type="button" class="small ghost" id="ruDel">Remove this rung</button></div>
        </div>`;
      }
    }
    return `<div class="guidebox">
      <div class="row">
        <button type="button" class="small ${ui.tool === 'rail' ? 'primary' : 'ghost'}" aria-pressed="${ui.tool === 'rail'}" id="drawColBtn">✎ Add Rails</button>
        <button type="button" class="small ${ui.tool === 'rung' ? 'primary' : 'ghost'}" aria-pressed="${ui.tool === 'rung'}" id="rungBtn">⟋ Add rungs</button>
      </div>
      <p class="hint">${ui.tool === 'rung' ? 'Drag a line across both rails. The stitches near it run in that direction, and blend smoothly to the next rung. Press Esc when done.'
        : 'Each column has two <b>rails</b> (the outer edges of the stitches) and <b>rungs</b> (orange, the stitch direction). Stitching starts at the green end and stops at the red end.'}</p>
      ${C.length ? `<ol class="guides cols">${C.map((col, i) => { const pv = pvs[i]; return `<li class="${a && a.ci === i ? 'on' : ''}" data-ci="${i}">
          <span class="grip" aria-hidden="true">⋮⋮</span><span class="gnum">${i + 1}</span><span class="gnm">Column ${i + 1}${col.A.closed && col.B.closed ? ' (loop)' : ''} <small>${pv ? railLen(pv.A).toFixed(0) + ' mm · ' + (col.rungs || []).length + ' rung' + ((col.rungs || []).length === 1 ? '' : 's') : 'unfinished: needs ' + (col.A.pts.length < 2 ? 'its first rail' : 'its second rail')}</small></span>
          <span class="gact">${pv ? '' : '<button type="button" class="tiny" data-c="cont" title="Keep drawing this column">Continue</button>'}<button type="button" class="tiny ghost" data-c="up" title="Sew earlier" ${i === 0 ? 'disabled' : ''}>↑</button><button type="button" class="tiny ghost" data-c="rev" title="Swap start and end">⇄</button><button type="button" class="tiny ghost" data-c="del" title="Delete column">✕</button></span></li>`; }).join('')}</ol>`
        : '<p class="hint"><b>No columns yet.</b> Nothing is stitched on this shape until you draw one.</p>'}
      ${a && C[a.ci] && (C[a.ci].rungs || []).length ? `<div class="row"><span class="lbl inline">Rungs in column ${a.ci + 1}</span>${C[a.ci].rungs.map((_, ri) => `<button type="button" class="tiny ${(a.kind === 'ru' || a.kind === 'rungline') && a.ri === ri ? 'toggle' : 'ghost'}" aria-pressed="${(a.kind === 'ru' || a.kind === 'rungline') && a.ri === ri}" data-rsel="${ri}">${ri + 1}</button>`).join('')}</div>` : ''}
      ${info}
      <details class="more"><summary>How to edit</summary><p class="hint">Drag a blue dot anywhere to move a rail; it only snaps to the outline if you drop it right on the edge (hold <kbd>Alt</kbd> to never snap). Double-click a rail to add a dot; right-click a dot or rung (or click it and press <kbd>Delete</kbd>) to remove it. Removing a dot from a rail with only two dots removes that rail and its column. Click a dot and press <kbd>Tab</kbd> to switch that part of the rail between following the shape edge, a smooth curve and a straight line.</p></details>
      <div class="row">
        <button type="button" class="small ghost" id="autoColsBtn">${C.length ? 'Replace with automatic columns' : 'Or let the app suggest columns'}</button>
        ${C.length ? '<button type="button" class="small ghost" id="clearCols">Remove all columns</button>' : ''}
      </div>
    </div>`;
  }
  function wireColumnPanel(o) {
    const dc = $('drawColBtn');
    if (!dc) return;
    dc.onclick = () => { if (ui.tool === 'rail') { keepDraft(); setTool(null); } else setTool('rail'); };
    $('rungBtn').onclick = () => setTool(ui.tool === 'rung' ? null : 'rung');
    const ac = $('autoColsBtn');
    if (ac) ac.onclick = () => { o.columns = Core.autoColumns(o.rings, occFor(o), { spacing: fab().satin, margin: 0.3 }); ui.active = null; touch(o); checkpoint(); changed(); };
    const cc = $('clearCols'); if (cc) cc.onclick = () => { o.columns = []; ui.active = null; touch(o); checkpoint(); changed(); setTool('rail'); };
    const cl = document.querySelector('.guides.cols');
    if (cl) sortable(cl, 'li[data-ci]', (from, to) => {
      const [m] = o.columns.splice(from, 1);
      o.columns.splice(to, 0, m);
      ui.active = { kind: 'col', ci: to };
      touch(o); checkpoint(); changed();
      toast(`Column moved: it now sews ${to === 0 ? 'first' : 'as number ' + (to + 1)}.`);
    });
    document.querySelectorAll('.guides li[data-ci]').forEach((li) => {
      const ci = +li.dataset.ci;
      li.onclick = (e) => {
        const b = e.target.closest('button[data-c]');
        if (!b) { ui.active = { kind: 'col', ci }; renderInspector(); draw(); return; }
        const C = o.columns;
        if (b.dataset.c === 'cont') { continueColumn(o, ci); return; }
        if (b.dataset.c === 'up' && ci > 0) [C[ci - 1], C[ci]] = [C[ci], C[ci - 1]];
        if (b.dataset.c === 'rev') reverseColumn(C[ci]);
        if (b.dataset.c === 'del') C.splice(ci, 1);
        ui.active = null;
        touch(o); checkpoint(); changed();
      };
    });
    document.querySelectorAll('[data-rsel]').forEach((b) => b.onclick = () => { ui.active = { kind: 'rungline', ci: ui.active.ci, ri: +b.dataset.rsel }; renderInspector(); draw(); });
    document.querySelectorAll('[data-ra]').forEach((b) => b.onclick = () => {
      const a = ui.active;
      adjustRung(o, a.ci, a.ri, b.dataset.ra, +(b.dataset.v || 0));
      checkpoint(); changed();
    });
    const ud = $('ruDel'); if (ud) ud.onclick = deleteColActive;
  }


  function railPointHTML(o, a, title) {
    const r = railRef(o, a);
    if (!r || !r.pts[a.pi]) return '';
    const si = clampSeg(r, a.pi);
    const m = r.modes[si] || 'curve';
    return `<div class="railinfo">
          <div class="row"><b>${esc(title)}</b></div>
          <span class="lbl">The line ${a.pi === 0 ? 'leaving' : 'arriving at'} this dot follows <kbd>Tab</kbd></span>
          <div class="seg wide" id="segMode">${RAIL_MODES.map((k) => `<button type="button" data-sm="${k}" aria-pressed="${k === m}">${RAIL_LABEL[k]}</button>`).join('')}</div>
          <p class="hint">Drag a purple arrow to change the direction of its line. Each arrow only changes its own line: the one arriving at this dot or the one leaving it. Hold <kbd>Shift</kbd> while dragging if you want the other arrow to stay lined up.</p>
          <div class="row" id="nodeType"><button type="button" class="small ghost" data-nt="smooth">Line up the arrows</button><button type="button" class="small ghost" id="rpReset" ${r.handles && r.handles[a.pi] ? '' : 'disabled'}>Reset arrows</button><button type="button" class="small ghost" id="rpDel">Remove this dot</button></div>
        </div>`;
  }
  function wireRailPoint(o) {
    const sm = $('segMode');
    if (sm) sm.querySelectorAll('[data-sm]').forEach((b) => b.onclick = () => {
      const a = ui.active, r = railRef(o, a);
      const si = clampSeg(r, a.pi);
      r.modes[si] = b.dataset.sm;
      if (b.dataset.sm === 'edge') { const n = r.pts.length; for (const k of [si, (si + 1) % n]) r.pts[k] = placePoint(o, r.pts[k], 'edge'); }
      touch(o); checkpoint(); changed();
    });
    const nt = $('nodeType');
    if (nt) nt.querySelectorAll('[data-nt]').forEach((b) => b.onclick = () => {
      const a = ui.active, r = railRef(o, a);
      r.handles = r.handles || []; while (r.handles.length < r.pts.length) r.handles.push(null);
      const cur = Core.nodeHandles(r, a.pi);
      const nh = { in: cur.in.slice(), out: cur.out.slice(), cusp: false };
      if (!nh.cusp) {
        // line the arrows back up, averaging their directions
        const li = Math.hypot(...nh.in) || 1, lo = Math.hypot(...nh.out) || 1;
        let dx = nh.out[0] / lo - nh.in[0] / li, dy = nh.out[1] / lo - nh.in[1] / li; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
        nh.out = [dx * lo, dy * lo]; nh.in = [-dx * li, -dy * li];
      }
      r.handles[a.pi] = nh;
      touch(o); checkpoint(); changed();
    });
    const rr = $('rpReset'); if (rr) rr.onclick = () => { const a = ui.active, r = railRef(o, a); if (r.handles) r.handles[a.pi] = null; touch(o); checkpoint(); changed(); };
    const rd = $('rpDel'); if (rd) rd.onclick = deleteColActive;
  }

  /* ---------- running stitch along the edge of a satin (patch style) ---------- */
  function edgeRunHTML(id, er, closedHint) {
    const on = !!(er && er.on);
    return `<div class="edgerun" id="${id}">
      <label class="check"><input type="checkbox" data-er="on" ${on ? 'checked' : ''}> Running stitch along the ${on && er.side === 'outside' ? 'outside' : on && er.side === 'both' ? 'edges' : 'inside edge'} (like a patch border)</label>
      ${on ? `<div class="opts">
        <div class="optrow"><span>Placed</span><div class="seg" data-erk="mode"><button type="button" data-v="under" aria-pressed="${er.mode !== 'beside'}">Under the satin edge</button><button type="button" data-v="beside" aria-pressed="${er.mode === 'beside'}">Beside it, visible</button></div></div>
        <div class="optrow"><span>Edge</span><div class="seg" data-erk="side"><button type="button" data-v="inside" aria-pressed="${(er.side || 'inside') === 'inside'}">Inside</button><button type="button" data-v="outside" aria-pressed="${er.side === 'outside'}">Outside</button><button type="button" data-v="both" aria-pressed="${er.side === 'both'}">Both</button></div></div>
        <label class="check"><input type="checkbox" data-er="triple" ${er.triple ? 'checked' : ''}> Bold (triple stitch)</label>
        <p class="hint">${er.mode === 'beside' ? 'Sewn after the satin, just next to its edge, as a visible line.' : 'Sewn before the satin, tucked just inside its edge. It tacks the fabric down and gives a crisp, even edge; the satin covers it.'}${closedHint ? '' : ' On an open line, "inside" is the side the line curves towards.'}</p>
      </div>` : ''}
    </div>`;
  }
  function wireEdgeRun(id, get, set, o) {
    const box = document.getElementById(id);
    if (!box) return;
    const commit = (er) => { set(er); touch(o); checkpoint(); changed(); };
    box.querySelector('[data-er="on"]').onchange = (e) => commit(e.target.checked ? { mode: 'under', side: 'inside', triple: false, ...(get() || {}), on: true } : { ...(get() || {}), on: false });
    const tr = box.querySelector('[data-er="triple"]');
    if (tr) tr.onchange = (e) => commit({ ...get(), triple: e.target.checked });
    box.querySelectorAll('[data-erk]').forEach((sg) => sg.querySelectorAll('button').forEach((b) => b.onclick = () => commit({ ...get(), [sg.dataset.erk]: b.dataset.v })));
  }

  /* ---------- traced satin borders ---------- */
  const ALIGN_LABEL = { inside: 'Inside the line', center: 'Centred on it', outside: 'Outside the line' };
  function borderPanelHTML(o) {
    const B = o.borders || [];
    const a = ui.active;
    const act = a && (a.rail === 'R' || a.kind === 'bline') && B[a.ci] ? a.ci : -1;
    const pvs = borderPreviews(o);
    const len = (P) => { let L = 0; if (P) for (let i = 1; i < P.length; i++) L += Core.dist(P[i - 1], P[i]); return L; };
    let edit = '';
    if (act >= 0) {
      const b = B[act];
      edit = `<div class="railinfo">
        <b>Border ${act + 1}</b>
        <div class="optrow"><span>Width</span><div class="angle"><span></span><input type="range" id="bW" min="0.6" max="8" step="0.1" value="${(b.width || 1.5).toFixed(1)}" aria-label="Border width"><output>${(b.width || 1.5).toFixed(1)} mm</output></div></div>
        <span class="lbl">Where the satin sits</span>
        <div class="seg wide" id="bAlign">${['inside', 'center', 'outside'].map((k) => `<button type="button" data-al="${k}" aria-pressed="${(b.align || 'center') === k}">${ALIGN_LABEL[k]}</button>`).join('')}</div>
        ${edgeRunHTML('erBorder', b.edgeRun, b.R.closed)}
        <div class="row"><button type="button" class="small ghost" id="bRev">⇄ Swap start and end</button><button type="button" class="small ghost" id="bDel">Delete this border</button></div>
      </div>`;
      if (a.kind === 'rp') edit += railPointHTML(o, a, `Border ${act + 1} · dot ${a.pi + 1}`);
    }
    return `<h2 style="margin-top:6px">Satin borders</h2>
      <div class="guidebox">
        <div class="row">
          <button type="button" class="small ${ui.tool === 'border' ? 'toggle' : 'primary'}" aria-pressed="${ui.tool === 'border'}" id="traceBorderBtn">✎ Trace a border</button>
          <span class="angle" style="grid-template-columns:auto 1fr 52px;flex:1"><span class="lbl inline">New width</span><input type="range" id="bNewW" min="0.6" max="8" step="0.1" value="${ui.borderW.toFixed(1)}" aria-label="Width for new borders"><output>${ui.borderW.toFixed(1)} mm</output></span>
        </div>
        <p class="hint">${ui.tool === 'border' ? 'Click along the part of the outline that should get a border. Shape edge mode follows the outline; <kbd>Tab</kbd> switches to a smooth curve or straight line. Click the last dot again to finish, or the first dot to go all the way round.'
          : 'Trace only the parts you want edged. Each border is a satin column you can make wider or narrower. Borders sew after the shape.'}</p>
        ${B.length ? `<ol class="guides bords">${B.map((b, i) => `<li class="${act === i ? 'on' : ''}" data-bi="${i}"><span class="grip" aria-hidden="true">⋮⋮</span><span class="gnum" style="background:#0b8f8f">${i + 1}</span><span class="gnm">Border ${i + 1}${b.R.closed ? ' (all round)' : ''} <small>${len(pvs[i] && pvs[i].mid).toFixed(0)} mm long · ${(b.width || 1.5).toFixed(1)} mm wide</small></span><span class="gact"><button type="button" class="tiny ghost" data-b="del" title="Delete border">✕</button></span></li>`).join('')}</ol>` : ''}
        ${edit}
      </div>`;
  }
  function wireBorderPanel(o) {
    const tb = $('traceBorderBtn');
    if (!tb) return;
    tb.onclick = () => { if (ui.tool === 'border') { keepDraft(); setTool(null); } else setTool('border'); };
    const nw = $('bNewW');
    nw.oninput = () => { ui.borderW = +nw.value; rowOf(nw).querySelector('output').textContent = ui.borderW.toFixed(1) + ' mm'; syncDrawBar(); };
    const bl = document.querySelector('.guides.bords');
    if (bl) sortable(bl, 'li[data-bi]', (from, to) => {
      const [m] = o.borders.splice(from, 1); o.borders.splice(to, 0, m);
      ui.active = { kind: 'bline', ci: to, rail: 'R' };
      touch(o); checkpoint(); changed();
    });
    document.querySelectorAll('.guides li[data-bi]').forEach((li) => {
      const bi = +li.dataset.bi;
      li.onclick = (e) => {
        const b = e.target.closest('button[data-b]');
        if (b && b.dataset.b === 'del') { o.borders.splice(bi, 1); ui.active = null; touch(o); checkpoint(); changed(); return; }
        ui.active = { kind: 'bline', ci: bi, rail: 'R' }; renderInspector(); draw();
      };
    });
    const a = ui.active;
    const b = a && (a.rail === 'R' || a.kind === 'bline') && o.borders ? o.borders[a.ci] : null;
    if (!b) return;
    const w = $('bW');
    w.oninput = () => { b.width = +w.value; rowOf(w).querySelector('output').textContent = b.width.toFixed(1) + ' mm'; ui.borderW = b.width; touch(o); scheduleGen(); draw(); };
    w.onchange = () => { checkpoint(); w.blur(); renderInspector(); };
    $('bAlign').querySelectorAll('[data-al]').forEach((x) => x.onclick = () => { b.align = x.dataset.al; ui.borderAlign = b.align; touch(o); checkpoint(); changed(); });
    $('bRev').onclick = () => {
      reverseColumn({ A: b.R, B: { pts: [], modes: [] } }); touch(o); checkpoint(); changed();
    };
    $('bDel').onclick = () => { o.borders.splice(a.ci, 1); ui.active = null; touch(o); checkpoint(); changed(); };
    wireEdgeRun('erBorder', () => b.edgeRun, (v) => { b.edgeRun = v; ui.borderEdgeRun = v; }, o);
  }

  function widthSummary(g) {
    const wd = g.widen ? ` ${g.widen > 0 ? '+' : ''}${g.widen.toFixed(1)}` : '';
    if (g.e) return 'free edges' + wd;
    if (!g.w) return 'fits shape' + wd;
    const mn = Math.min(...g.w), mx = Math.max(...g.w);
    return (Math.abs(mx - mn) < 0.05 ? mn.toFixed(1) : mn.toFixed(1) + '–' + mx.toFixed(1)) + ' mm' + wd;
  }
  function activeGuide(o) {
    const a = ui.active;
    if (!a || (a.kind !== 'g' && a.kind !== 'w') || !o.guides || !o.guides[a.gi]) return null;
    return o.guides[a.gi];
  }
  function guidePanelHTML(o) {
    const G = o.guides || [], D = o.dirs || [];
    const act = ui.active;
    const g = activeGuide(o);
    let edit = '';
    if (g) {
      const gi = act.gi, pi = act.pi;
      const avg = g.w ? g.w.reduce((x, y) => x + y, 0) / g.w.length : null;
      edit = `<div class="pathedit">
        <div class="row"><span class="gnum">${gi + 1}</span><b>Path ${gi + 1}</b><span class="hint">${pi != null ? 'dot ' + (pi + 1) + ' of ' + g.pts.length : g.pts.length + ' dots'}</span></div>
        <span class="lbl">Edges</span><div class="seg wide" id="pwMode"><button type="button" data-v="shape" aria-pressed="${!g.w && !g.e}">Fit the shape</button><button type="button" data-v="custom" aria-pressed="${!!g.w && !g.e}">Even widths</button><button type="button" data-v="edges" aria-pressed="${!!g.e}">Free edges</button></div>
        ${g.w && !g.e ? `<div class="optrow"><span>Whole path</span><div class="angle"><span></span><input type="range" id="pwAll" min="0.5" max="10" step="0.1" value="${avg.toFixed(1)}" aria-label="Width of the whole path"><output>${avg.toFixed(1)} mm</output></div></div>` : ''}
        ${g.w && !g.e && pi != null && act.kind !== 'd' ? `<div class="optrow"><span>At dot ${pi + 1}</span><div class="angle"><span></span><input type="range" id="pwPoint" min="0.3" max="10" step="0.1" value="${g.w[pi].toFixed(1)}" aria-label="Width at this dot"><output>${g.w[pi].toFixed(1)} mm</output></div></div>` : ''}
        <div class="optrow"><span>Wider / narrower</span><div class="angle"><span></span><input type="range" id="pwWiden" min="-1.5" max="2" step="0.1" value="${(g.widen || 0).toFixed(1)}" aria-label="Make the path wider or narrower"><output>${(g.widen || 0) > 0 ? '+' : ''}${(g.widen || 0).toFixed(1)} mm</output></div></div>
        <p class="hint">${g.e ? 'Each diamond is placed by you. Drag one to move that edge; the stitch at that dot runs between its two diamonds. Hold <b>Shift</b> while dragging to change the width evenly on both sides. Direction lines are ignored on this path.'
          : 'Drag a diamond to move that edge on its own (this switches to Free edges). Hold <b>Shift</b> while dragging to change the width evenly on both sides.'}</p>
        <div class="row"><button type="button" class="small ghost" id="pwRev">⇄ Swap start and end</button><button type="button" class="small ghost" id="pwDel">Delete path</button></div>
      </div>`;
    }
    return `<div class="guidebox">
      <div class="row">
        <button type="button" class="small ${ui.tool === 'draw' ? 'toggle' : 'primary'}" aria-pressed="${ui.tool === 'draw'}" id="drawGuideBtn">✎ Draw a new path</button>
        <button type="button" class="small ${ui.tool === 'dir' ? 'toggle' : 'ghost'}" aria-pressed="${ui.tool === 'dir'}" id="dirBtn">⟋ Direction lines</button>
      </div>
      <p class="hint">${ui.tool === 'dir' ? 'Drag short lines across the stroke. Stitches take that slant there and blend smoothly between lines. Press Esc when done.'
        : 'Stitches start exactly at the green dot and stop exactly at the red one. The shaded band is the satin you will get.'}</p>
      ${G.length ? `<ol class="guides">${G.map((gg, i) => `<li class="${g && act.gi === i ? 'on' : ''}" data-gi="${i}">
          <span class="gnum">${i + 1}</span><span class="gnm">Path ${i + 1}${gg.closed ? ' (loop)' : ''} <small>${guideLen(gg).toFixed(1)} mm long · ${widthSummary(gg)}</small></span>
          <span class="gact"><button type="button" class="tiny ghost" data-g="up" title="Sew earlier" ${i === 0 ? 'disabled' : ''}>↑</button><button type="button" class="tiny ghost" data-g="rev" title="Swap start and end">⇄</button><button type="button" class="tiny ghost" data-g="del" title="Delete path">✕</button></span></li>`).join('')}</ol>`
        : '<p class="hint"><b>No paths yet.</b> Until you draw one, the automatic satin is used.</p>'}
      ${edit || (G.length ? '<p class="hint">Click a path on the canvas, or a row above, to change its width.</p>' : '')}
      ${D.length ? `<div class="row"><span class="hint">${D.length} direction line${D.length > 1 ? 's' : ''}</span><button type="button" class="link" id="clearDirs">Remove them</button></div>` : ''}
      <div class="row">
        <button type="button" class="small ghost" id="autoGuidesBtn">${G.length ? 'Reset to automatic paths' : 'Start from automatic paths'}</button>
        ${G.length ? '<button type="button" class="small ghost" id="clearGuides">Remove all paths</button>' : ''}
      </div>
    </div>`;
  }
  function wireGuidePanel(o) {
    const db = $('drawGuideBtn');
    if (!db) return;
    db.onclick = () => setTool(ui.tool === 'draw' ? null : 'draw');
    $('dirBtn').onclick = () => setTool(ui.tool === 'dir' ? null : 'dir');
    const ag = $('autoGuidesBtn');
    if (ag) ag.onclick = () => { o.guides = Core.autoGuides(o.rings, occFor(o), { spacing: fab().satin, margin: 0.3 }); o.dirs = []; ui.active = null; touch(o); checkpoint(); changed(); };
    const cg = $('clearGuides'); if (cg) cg.onclick = () => { o.guides = []; ui.active = null; touch(o); checkpoint(); changed(); setTool('draw'); };
    const cd = $('clearDirs'); if (cd) cd.onclick = () => { o.dirs = []; touch(o); checkpoint(); changed(); };
    document.querySelectorAll('.guides li[data-gi]').forEach((li) => {
      const gi = +li.dataset.gi;
      li.onclick = (e) => {
        const b = e.target.closest('button[data-g]');
        if (!b) { ui.active = { kind: 'g', gi, pi: null }; renderInspector(); draw(); return; }
        const G = o.guides;
        if (b.dataset.g === 'up' && gi > 0) [G[gi - 1], G[gi]] = [G[gi], G[gi - 1]];
        if (b.dataset.g === 'rev') reverseGuide(G[gi]);
        if (b.dataset.g === 'del') G.splice(gi, 1);
        ui.active = null;
        touch(o); checkpoint(); changed();
      };
    });
    const g = activeGuide(o);
    if (!g) return;
    $('pwMode').querySelectorAll('button').forEach((b) => b.onclick = () => {
      const v = b.dataset.v;
      if (v === 'custom') {
        if (g.e) { g.w = g.e.map(([, na, , nb]) => +Math.max(0.3, Math.abs(na - nb)).toFixed(2)); delete g.e; }
        else if (!g.w) { g.w = Core.measureWidths(o.rings, occFor(o), g.pts, !!g.closed).map((x) => +(x + (g.widen || 0)).toFixed(2)); g.widen = 0; }
      }
      if (v === 'edges' && !g.e) { g.e = Core.captureEdges(o.rings, occFor(o), g, o.dirs || []); delete g.w; g.widen = 0; }
      if (v === 'shape') { delete g.w; delete g.e; }
      touch(o); checkpoint(); changed();
    });
    const live = (el, fn, fmt) => {
      if (!el) return;
      el.oninput = () => { const v = +el.value; fn(v); rowOf(el).querySelector('output').textContent = fmt(v); touch(o); scheduleGen(); draw(); };
      el.onchange = () => { checkpoint(); el.blur(); renderInspector(); };
    };
    live($('pwAll'), (v) => { g.w = g.w.map(() => v); }, (v) => v.toFixed(1) + ' mm');
    live($('pwPoint'), (v) => { g.w[ui.active.pi] = v; }, (v) => v.toFixed(1) + ' mm');
    live($('pwWiden'), (v) => { g.widen = v; }, (v) => (v > 0 ? '+' : '') + v.toFixed(1) + ' mm');
    $('pwRev').onclick = () => { reverseGuide(g); ui.active = { kind: 'g', gi: ui.active.gi, pi: null }; touch(o); checkpoint(); changed(); };
    $('pwDel').onclick = () => { o.guides.splice(ui.active.gi, 1); ui.active = null; touch(o); checkpoint(); changed(); };
  }
  function reverseGuide(g) {
    g.pts.reverse(); if (g.w) g.w.reverse();
    // running the other way flips the path's frame: left edge becomes right edge
    if (g.e) g.e = g.e.reverse().map(([ta, na, tb, nb]) => [-tb, -nb, -ta, -na]);
  }
  function sizeBoxHTML(bb) {
    return `<div class="sizebox">
      <input type="number" id="szW" min="1" step="0.5" value="${bb.w.toFixed(1)}" aria-label="Width in mm">
      <button type="button" class="small ghost lock" id="szLock" aria-pressed="${ui.lock}" title="Keep proportions">${ui.lock ? '🔒' : '🔓'}</button>
      <input type="number" id="szH" min="1" step="0.5" value="${bb.h.toFixed(1)}" aria-label="Height in mm">
      <span>mm</span></div>
      <div class="row"><span class="lbl inline">Scale by</span><input type="number" id="szPct" min="5" max="1000" step="5" value="100" style="width:76px" aria-label="Scale percent"><span>%</span>
        <button type="button" class="tiny ghost" data-pct="50">50%</button><button type="button" class="tiny ghost" data-pct="90">90%</button><button type="button" class="tiny ghost" data-pct="110">110%</button><button type="button" class="tiny ghost" data-pct="200">200%</button></div>
      <p class="hint">Or drag a handle on the hoop: corners resize around the centre and keep the proportions, sides stretch. Hold Shift on a corner to stretch freely.</p>`;
  }
  function wireSizeBox(list) {
    const w = $('szW'), h = $('szH'), l = $('szLock');
    if (!w) return;
    l.onclick = () => { ui.lock = !ui.lock; l.setAttribute('aria-pressed', ui.lock); l.textContent = ui.lock ? '🔒' : '🔓'; };
    const apply = async (which) => {
      const bb = unionBBox(list);
      if (!bb) return;
      let sx = (+w.value || bb.w) / bb.w, sy = (+h.value || bb.h) / bb.h;
      if (ui.lock) { if (which === 'w') sy = sx; else sx = sy; }
      if (!isFinite(sx) || !isFinite(sy) || sx <= 0 || sy <= 0) return;
      setBusy(true);
      await scale(list, sx, sy, (bb.x0 + bb.x1) / 2, (bb.y0 + bb.y1) / 2);
      checkpoint(); changed();
    };
    w.onchange = () => apply('w');
    h.onchange = () => apply('h');
    const pctApply = async (p) => {
      const k = p / 100, bb = unionBBox(list);
      if (!bb || !(k > 0) || k === 1) return;
      setBusy(true);
      await scale(list, k, k, (bb.x0 + bb.x1) / 2, (bb.y0 + bb.y1) / 2);
      checkpoint(); changed();
    };
    const pc = $('szPct'); if (pc) pc.onchange = () => pctApply(+pc.value);
    document.querySelectorAll('[data-pct]').forEach((b) => b.onclick = () => pctApply(+b.dataset.pct));
  }

  /* ---------------- layers ---------------- */
  let dragLayer = null;
  function renderLayers() {
    if (ui.reordering) return;
    if ($('orderBadge')) $('orderBadge').textContent = S.objects.length ? String(S.objects.length) : '';
    const ol = $('layers');
    if (!S.objects.length) { ol.innerHTML = '<li class="empty">Nothing on the hoop yet.</li>'; return; }
    const counts = new Map();
    if (A) for (let i = 0; i < A.C.length; i++) if (A.C[i] === 0) counts.set(A.OBJ[i], (counts.get(A.OBJ[i]) || 0) + 1);
    ol.innerHTML = S.objects.map((o, i) => `<li data-id="${o.id}" class="${ui.sel.has(o.id) ? 'sel' : ''} ${o.type === 'skip' ? 'skip' : ''}">
      <span class="grip" aria-hidden="true">⋮⋮</span><span class="dot" style="background:${o.color}"></span>
      <span class="nm" title="${esc(o.name)}">${esc(o.name || 'Shape')}</span>
      <span class="ty">${TYPE_LABEL[o.type]}${o.type !== 'skip' ? ' · ' + (counts.get(i) || 0).toLocaleString() : ''}</span></li>`).join('');
    ol.querySelectorAll('li[data-id]').forEach((li) => {
      const id = +li.dataset.id;
      li.onclick = (e) => {
        if (e.shiftKey || e.metaKey || e.ctrlKey) { if (ui.sel.has(id)) ui.sel.delete(id); else ui.sel.add(id); }
        else ui.sel = new Set([id]);
        ui.keepTab = true;
        selectionChanged();
      };
    });
    sortable(ol, 'li[data-id]', (from, to) => {
      const [m] = S.objects.splice(from, 1);
      S.objects.splice(to, 0, m);
      checkpoint(); changed();
      toast(`“${m.name || 'Shape'}” now sews ${to === 0 ? 'first' : to === S.objects.length - 1 ? 'last' : 'in position ' + (to + 1)}.`);
    });
  }

  /* drag-to-reorder for lists (mouse, pen and touch) */
  function sortable(list, selector, onMove) {
    list.querySelectorAll(selector).forEach((li) => {
      li.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 || e.target.closest('button, input, a')) return;
        if (e.pointerType === 'touch' && !e.target.closest('.grip')) return; // let fingers scroll the panel
        const items = [...list.querySelectorAll(selector)];
        const from = items.indexOf(li);
        const others = items.filter((x) => x !== li);
        const scroller = list.closest('.panel');
        const st0 = scroller ? scroller.scrollTop : 0;
        const y0 = e.clientY;
        let dragging = false, to = from, raf = 0, lastY = y0;
        const clearMarks = () => others.forEach((x) => x.classList.remove('drop-before', 'drop-after'));
        const update = () => {
          const dy = lastY - y0 + (scroller ? scroller.scrollTop - st0 : 0);
          li.style.transform = `translateY(${dy}px)`;
          let k = 0;
          for (const x of others) { const r = x.getBoundingClientRect(); if (lastY > r.top + r.height / 2) k++; }
          to = k;
          clearMarks();
          if (k < others.length) others[k].classList.add('drop-before'); else if (others.length) others[others.length - 1].classList.add('drop-after');
        };
        const move = (ev) => {
          lastY = ev.clientY;
          if (!dragging) {
            if (Math.abs(lastY - y0) < 5) return;
            dragging = true; ui.reordering = true;
            li.classList.add('dragging'); list.classList.add('sorting');
            try { li.setPointerCapture(e.pointerId); } catch (er) { }
          }
          ev.preventDefault();
          if (scroller) {
            const r = scroller.getBoundingClientRect();
            if (lastY < r.top + 40) scroller.scrollTop -= 10; else if (lastY > r.bottom - 40) scroller.scrollTop += 10;
          }
          cancelAnimationFrame(raf); raf = requestAnimationFrame(update);
        };
        const up = () => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
          window.removeEventListener('pointercancel', up);
          cancelAnimationFrame(raf);
          if (!dragging) return;
          update();
          clearMarks();
          li.classList.remove('dragging'); list.classList.remove('sorting'); li.style.transform = '';
          ui.reordering = false;
          // swallow the click that follows a drag
          const stop = (ce) => { ce.stopPropagation(); ce.preventDefault(); };
          li.addEventListener('click', stop, { capture: true, once: true });
          setTimeout(() => li.removeEventListener('click', stop, { capture: true }), 50);
          if (to !== from) onMove(from, to); else { renderLayers(); renderInspector(); }
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        window.addEventListener('pointercancel', up);
      });
    });
  }

  /* ---------------- stats & steps ---------------- */
  function designBounds() {
    if (!A || !A.X.length) return null;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < A.X.length; i++) if (A.C[i] === 0) { x0 = Math.min(x0, A.X[i]); x1 = Math.max(x1, A.X[i]); y0 = Math.min(y0, A.Y[i]); y1 = Math.max(y1, A.Y[i]); }
    return isFinite(x0) ? { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 } : null;
  }
  function fitsHoop() {
    const b = designBounds(), h = hoop();
    if (!b) return true;
    if (h.oval || h.round) {
      const a = h.w / 2, c = h.h / 2;
      for (let i = 0; i < A.X.length; i++) if (A.C[i] === 0 && (A.X[i] / a) ** 2 + (A.Y[i] / c) ** 2 > 1) return false;
      return true;
    }
    return b.x0 >= -h.w / 2 && b.x1 <= h.w / 2 && b.y0 >= -h.h / 2 && b.y1 <= h.h / 2;
  }
  function renderStats() {
    const el = $('stats');
    const b = designBounds();
    if (!b) { el.innerHTML = '<span>No stitches yet</span>'; return; }
    const changes = A.colors.length - 1;
    const trims = A.C.filter((c) => c === 2).length;
    const mins = Math.round(A.stitches / 650 + changes * 0.5 + trims * 0.05);
    el.innerHTML = `<span>Size <b>${b.w.toFixed(1)} × ${b.h.toFixed(1)} mm</b></span>
      <span>Stitches <b>${A.stitches.toLocaleString()}</b></span>
      <span>Colours <b>${A.colors.length}</b></span>
      <span>Trims <b>${trims}</b></span>
      <span>Sewing time <b>about ${Math.max(1, mins)} min</b></span>
      ${fitsHoop() ? `<span class="chip ok">✓ Fits the ${hoop().w} × ${hoop().h} hoop</span>` : `<span class="chip bad">Too big for this hoop</span><button class="small" id="shrinkBtn">Shrink to fit</button>`}`;
    const sb = $('shrinkBtn');
    if (sb) sb.onclick = async () => {
      const b = unionBBox(S.objects), h = hoop();
      const k = Math.min((h.w - 10) / b.w, (h.h - 10) / b.h, 1);
      const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
      setBusy(true);
      await scale(S.objects, k, k, cx, cy); translate(S.objects, -cx, -cy);
      checkpoint(); changed(); fitView();
      toast('Design shrunk to fit the hoop. Stitch density was recalculated, so it stays smooth.');
    };
  }
  function updateSteps() {
    const has = S.objects.length > 0;
    $('step1').className = has ? 'done' : 'now';
    $('step2').className = has ? (ui.exported ? 'done' : 'now') : '';
    $('step3').className = ui.exported ? 'done' : '';
    $('exportBtn').disabled = !has;
  }

  /* ---------------- simulator ---------------- */
  let playRaf = 0;
  $('simRange').oninput = (e) => { ui.sim = +e.target.value / 1000; stopPlay(false); draw(); };
  $('playBtn').onclick = () => {
    if (ui.playing) { stopPlay(); return; }
    if (!A || !A.X.length) return;
    if (ui.sim >= 1) ui.sim = 0;
    if (ui.view === 'art') setView('both');
    ui.playing = true; $('playBtn').textContent = '❚❚ Pause';
    let last = performance.now();
    const n = A.X.length;
    const rate = Math.max(300, n / 14); // finish in ~14 seconds
    const step = (t) => {
      if (!ui.playing) return;
      const dt = (t - last) / 1000; last = t;
      ui.sim = Math.min(1, ui.sim + rate * dt / n);
      $('simRange').value = Math.round(ui.sim * 1000);
      draw();
      if (ui.sim >= 1) { stopPlay(); return; }
      playRaf = requestAnimationFrame(step);
    };
    playRaf = requestAnimationFrame(step);
  };
  function stopPlay(reset) {
    ui.playing = false; cancelAnimationFrame(playRaf);
    $('playBtn').textContent = '▶ Watch it sew';
  }
  function setView(v) {
    ui.view = v;
    document.querySelectorAll('#viewSeg button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === v));
    draw();
  }
  document.querySelectorAll('#viewSeg button').forEach((b) => b.onclick = () => setView(b.dataset.v));
  $('jumpsChk').onchange = (e) => { ui.jumps = e.target.checked; draw(); };

  /* ---------------- export ---------------- */
  const inClaude = () => !!(window.claude && typeof window.claude.use === 'function');
  async function saveFile(name, data) {
    if (inClaude()) {
      try {
        const dl = await window.claude.use('downloads');
        if (dl) { await dl.save({ filename: name, data: new Blob([data]) }); return true; }
      } catch (e) {
        if (e && e.code === 'declined') { toast('Download cancelled.'); return false; }
        if (e && e.code === 'rate_limited') { toast('A download is already waiting for your answer.'); return false; }
      }
    }
    try {
      const url = URL.createObjectURL(new Blob([data], { type: 'application/octet-stream' }));
      const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      return true;
    } catch (e) { toast('Downloads are blocked here. Use "Get this app as a file" and open it in your browser.', 5200); return false; }
  }
  function cleanName() { return ($('fileName').value || S.projectName || 'my-design').trim().replace(/[^\w\- ]+/g, '').replace(/\s+/g, '-').slice(0, 40) || 'my-design'; }
  function buildFile(fmt, name) {
    if (fmt === 'pes') return Formats.writePES(A, name);
    if (fmt === 'dst') return Formats.writeDST(A, name);
    if (fmt === 'jef') return Formats.writeJEF(A);
    if (fmt === 'exp') return Formats.writeEXP(A);
    if (fmt === 'vp3') return Formats.writeVP3(A);
  }
  function renderExportDlg() {
    const m = MACHINES.find((x) => x.id === ui.machine) || MACHINES[0];
    $('machines').innerHTML = MACHINES.map((x) => `<label><input type="radio" name="machine" value="${x.id}" ${x.id === m.id ? 'checked' : ''}><b>${esc(x.title)}</b><span>Saves a <code>.${x.ext.toUpperCase()}</code> file</span></label>`).join('');
    $('machines').querySelectorAll('input').forEach((r) => r.onchange = () => { ui.machine = r.value; try { localStorage.setItem('ss-machine', r.value); } catch (e) { } renderExportDlg(); });
    const fits = fitsHoop();
    const b = designBounds();
    $('exportChecks').innerHTML = `
      <div>${fits ? '<span class="chip ok">✓</span> Fits your ' + hoop().w + ' × ' + hoop().h + ' mm hoop' : '<span class="chip bad">!</span> Bigger than your hoop. It may not load on the machine.'}</div>
      <div><span class="chip ok">✓</span> ${A.stitches.toLocaleString()} stitches, ${A.colors.length} colour${A.colors.length > 1 ? 's' : ''}, ${b ? b.w.toFixed(1) + ' × ' + b.h.toFixed(1) + ' mm' : ''}</div>`;
    const brand = m.id === 'jef' ? 'jef' : 'pes';
    $('threadList').innerHTML = A.colors.map((c, i) => {
      const t = Formats.threadName(c, brand);
      return `<li><span class="n">${i + 1}</span><span class="sw" style="background:${c}"></span><span>${esc(t.name)}</span><span class="code">${m.id === 'jef' ? 'Janome' : 'Brother'} #${t.code}</span></li>`;
    }).join('');
    const note = $('claudeNote');
    if (inClaude()) {
      note.hidden = false;
      note.textContent = m.id === 'all' ? 'You will get a .zip with all five files inside.' : `Inside Claude, machine files arrive inside a .zip (unzip it, then copy the .${m.ext.toUpperCase()} file to your USB stick). The app file saves .${m.ext.toUpperCase()} directly.`;
      $('getAppBtn').hidden = false;
    } else { note.hidden = true; $('getAppBtn').hidden = true; }
    $('doExport').textContent = m.id === 'all' ? 'Download all formats' : `Download .${m.ext.toUpperCase()}`;
  }
  $('exportBtn').onclick = () => {
    if (!A || !A.stitches) { toast('Add something to the hoop first.'); return; }
    if (S.projectName && ($('fileName').value === 'my-design' || $('fileName').dataset.auto === '1')) { $('fileName').value = S.projectName; $('fileName').dataset.auto = '1'; }
    stopPlay(); ui.sim = 1; $('simRange').value = 1000;
    renderExportDlg();
    $('exportDlg').showModal();
  };
  $('cancelExport').onclick = () => $('exportDlg').close();
  $('doExport').onclick = async () => {
    const m = MACHINES.find((x) => x.id === ui.machine) || MACHINES[0];
    const name = cleanName();
    let ok;
    if (m.id === 'all') {
      const files = ['pes', 'jef', 'dst', 'exp', 'vp3'].map((f) => ({ name: `${name}.${f}`, data: buildFile(f, name) }));
      ok = await saveFile(`${name}.zip`, Formats.zip(files));
    } else if (inClaude()) {
      ok = await saveFile(`${name}.zip`, Formats.zip([{ name: `${name}.${m.ext}`, data: buildFile(m.id, name) }]));
    } else ok = await saveFile(`${name}.${m.ext}`, buildFile(m.id, name));
    if (ok) { ui.exported = true; updateSteps(); $('exportDlg').close(); toast('Saved. Copy the file to a USB stick or send it to your machine.'); }
  };
  $('getAppBtn').onclick = () => saveFile('stitch-studio.html', new TextEncoder().encode(ORIGINAL_HTML));
  $('pngBtn').onclick = async () => {
    const b = designBounds(); if (!b) return;
    const sc = 12, pad = 6;
    const c = document.createElement('canvas');
    c.width = Math.ceil((b.w + pad * 2) * sc); c.height = Math.ceil((b.h + pad * 2) * sc);
    const g = c.getContext('2d');
    g.fillStyle = S.fabricColor; g.fillRect(0, 0, c.width, c.height);
    g.setTransform(sc, 0, 0, sc, (pad - b.x0) * sc, (pad - b.y0) * sc);
    for (const [amt, lw] of [[-0.35, 0.40], [0, 0.30], [0.45, 0.09]]) {
      g.lineWidth = lw; g.lineCap = 'round';
      let ci = 0;
      g.beginPath(); g.strokeStyle = amt ? shade(A.colors[0], amt) : A.colors[0];
      for (let i = 1; i < A.X.length; i++) {
        if (A.C[i] === 3) { g.stroke(); ci++; g.beginPath(); g.strokeStyle = amt ? shade(A.colors[ci], amt) : A.colors[ci]; continue; }
        if (A.C[i] !== 0 || A.C[i - 1] === 3 || A.C[i - 1] === 2) continue;
        g.moveTo(A.X[i - 1], A.Y[i - 1]); g.lineTo(A.X[i], A.Y[i]);
      }
      g.stroke();
    }
    const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
    saveFile(`${cleanName()}-preview.png`, new Uint8Array(await blob.arrayBuffer()));
  };

  /* ---------------- project save/open ---------------- */
  function projectData(name) {
    return JSON.stringify({ app: 'stitch-studio', v: 1, name, objects: S.objects, hoop: S.hoop, hoopTurn: !!S.hoopTurn, fabric: S.fabric, fabricColor: S.fabricColor, knockout: S.knockout, nextId: S.nextId });
  }
  const safeFileName = (n) => (n || '').trim().replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, ' ').slice(0, 80);
  const canPick = () => !inClaude() && typeof window.showSaveFilePicker === 'function';
  function openSaveDialog() {
    const dlg = $('saveDlg');
    const name = S.projectName || '';
    $('saveName').value = name;
    $('saveName').placeholder = 'For example: Team patch';
    const shapes = S.objects.length, cols = S.objects.reduce((n, o) => n + (o.columns ? o.columns.length : 0), 0), bords = S.objects.reduce((n, o) => n + (o.borders ? o.borders.length : 0), 0);
    $('saveSummary').innerHTML = `<div><span class="chip ok">✓</span> ${shapes} shape${shapes === 1 ? '' : 's'}${cols ? `, ${cols} satin column${cols === 1 ? '' : 's'}` : ''}${bords ? `, ${bords} border${bords === 1 ? '' : 's'}` : ''} · ${esc(hoop().w + ' × ' + hoop().h)} mm hoop</div>`;
    $('saveWhere').textContent = canPick()
      ? (name ? 'Next, your computer will ask where to save. Choose the same file to replace it.' : 'Next, your computer will ask where to save it.')
      : inClaude() ? 'The file will be offered as a download.' : 'The file will go to your Downloads folder.';
    $('doSave').textContent = name ? 'Save' : 'Save project';
    dlg.showModal();
    setTimeout(() => { const i = $('saveName'); i.focus(); i.select(); }, 30);
  }
  async function doSaveProject() {
    const name = safeFileName($('saveName').value);
    if (!name) { $('saveName').focus(); toast('Give the project a name first.'); return; }
    $('saveDlg').close();
    const data = new TextEncoder().encode(projectData(name));
    let ok = false;
    if (canPick()) {
      try {
        const handle = await window.showSaveFilePicker({ suggestedName: `${name}.json`, startIn: ui.fileHandle || 'documents', types: [{ description: 'Stitch Studio project', accept: { 'application/json': ['.json'] } }] });
        const w = await handle.createWritable(); await w.write(data); await w.close();
        ui.fileHandle = handle;
        ok = true;
        setProjectName(nameFromFile(handle.name) || name);
      } catch (e) {
        if (e && e.name === 'AbortError') { toast('Save cancelled.'); return; }
        ok = await saveFile(`${name}.json`, data);
        if (ok) setProjectName(name);
      }
    } else {
      ok = await saveFile(`${name}.json`, data);
      if (ok) setProjectName(name);
    }
    if (ok) { ui.savedSnap = snapshot(); toast(`Saved “${S.projectName}”.`); }
  }
  $('saveBtn').onclick = openSaveDialog;
  $('saveForm').onsubmit = (e) => { e.preventDefault(); doSaveProject(); };
  $('cancelSave').onclick = () => $('saveDlg').close();
  $('openBtn').onclick = async () => {
    if (canPick() && typeof window.showOpenFilePicker === 'function') {
      try {
        const [h] = await window.showOpenFilePicker({ types: [{ description: 'Stitch Studio project', accept: { 'application/json': ['.json'] } }] });
        const f = await h.getFile();
        openProject(await f.text(), f.name, h);
        return;
      } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    $('projIn').click();
  };
  $('projIn').onchange = async (e) => { const f = e.target.files[0]; if (f) openProject(await f.text(), f.name); e.target.value = ''; };
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (!$('saveDlg').open) openSaveDialog(); }
  });

  /* ---------------- settings UI ---------------- */
  function syncSettingsUI() {
    const br = brandOf(S.hoop);
    $('brandSel').value = br;
    fillHoopSel(br);
    $('hoopSel').value = S.hoop; $('fabricSel').value = S.fabric;
    $('hoopTurn').checked = !!S.hoopTurn;
    const note = HOOP_BRANDS[br].note;
    $('hoopNote').hidden = !note; $('hoopNote').textContent = note || '';
    $('fabricTip').textContent = fab().tip;
    $('fabricColor').value = S.fabricColor;
    $('knockout').checked = S.knockout;
  }
  // machine, hoop and fabric choices are remembered on this computer for the next visit
  function saveSetup() {
    try { localStorage.setItem('ss-setup', JSON.stringify({ hoop: S.hoop, hoopTurn: !!S.hoopTurn, fabric: S.fabric, fabricColor: S.fabricColor })); } catch (e) { }
  }
  function loadSetup() {
    try {
      const d = JSON.parse(localStorage.getItem('ss-setup') || 'null');
      if (!d) return;
      if (HOOPS.some((h) => h.id === d.hoop)) { S.hoop = d.hoop; S.hoopTurn = !!d.hoopTurn; }
      if (FABRICS[d.fabric]) S.fabric = d.fabric;
      if (/^#[0-9a-f]{6}$/i.test(d.fabricColor || '')) S.fabricColor = d.fabricColor;
    } catch (e) { }
  }
  function fillHoopSel(br) { $('hoopSel').innerHTML = HOOP_BRANDS[br].hoops.map((h) => `<option value="${h.id}">${h.name}</option>`).join(''); }
  $('brandSel').innerHTML = Object.entries(HOOP_BRANDS).map(([k, b]) => `<option value="${k}">${b.name}</option>`).join('');
  $('brandSel').onchange = (e) => {
    const br = e.target.value;
    // pick the hoop closest in size to the current one
    const cur = hoop();
    const list = HOOP_BRANDS[br].hoops;
    let best = list[0], bd = Infinity;
    for (const h of list) { const d = Math.abs(h.w * h.h - cur.w * cur.h) + (h.w >= cur.w && h.h >= cur.h ? 0 : 1e5); if (d < bd) { bd = d; best = h; } }
    S.hoop = best.id;
    if (HOOP_BRANDS[br].export) { ui.machine = HOOP_BRANDS[br].export; try { localStorage.setItem('ss-machine', ui.machine); } catch (er) { } }
    syncSettingsUI(); checkpoint(); renderStats(); fitView(); saveSetup();
    toast(`${HOOP_BRANDS[br].name} hoops loaded. Using the ${best.name.replace(/\s*\(.*/, '')} hoop.`);
  };
  $('hoopTurn').onchange = (e) => { S.hoopTurn = e.target.checked; checkpoint(); renderStats(); fitView(); saveSetup(); };
  $('fabricSel').innerHTML = Object.entries(FABRICS).map(([k, f]) => `<option value="${k}">${f.name}</option>`).join('');
  $('hoopSel').onchange = (e) => { S.hoop = e.target.value; checkpoint(); renderStats(); fitView(); saveSetup(); };
  $('fabricSel').onchange = (e) => { S.fabric = e.target.value; syncSettingsUI(); checkpoint(); changed(); saveSetup(); toast('Density, underlay and pull compensation updated for ' + fab().name.toLowerCase() + '.'); };
  $('fabricColor').oninput = (e) => { S.fabricColor = e.target.value; draw(); };
  $('fabricColor').onchange = () => { checkpoint(); saveSetup(); };
  $('knockout').onchange = (e) => { S.knockout = e.target.checked; checkpoint(); changed(); };

  /* ---------------- left panel wiring ---------------- */
  $('fileIn').onchange = (e) => { loadFile(e.target.files[0]); e.target.value = ''; };
  const drop = $('drop');
  let dragDepth = 0;
  window.addEventListener('dragenter', (e) => { if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) { dragDepth++; document.body.classList.add('dragging'); } });
  window.addEventListener('dragleave', () => { dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) document.body.classList.remove('dragging'); });
  window.addEventListener('dragover', (e) => { if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) e.preventDefault(); });
  window.addEventListener('drop', (e) => {
    if (!e.dataTransfer || !e.dataTransfer.files.length) return;
    e.preventDefault(); dragDepth = 0; document.body.classList.remove('dragging');
    const f = e.dataTransfer.files[0];
    if (/\.(ttf|otf|woff2?)$/i.test(f.name)) addFontFile(f); else loadFile(f);
  });
  $('sampleBtn').onclick = loadSample;
  $('clearBtn').onclick = () => { if (!S.objects.length) return; S.objects = []; ui.sel = new Set(); ui.editingText = null; selectionChanged(); syncTextUI(); checkpoint(); changed(); toast('Hoop cleared. Press Ctrl+Z to bring it back.'); };
  $('fontList').onclick = (e) => {
    const b = e.target.closest('button[data-font]'); if (!b) return;
    ui.font = b.dataset.font;
    $('fontList').querySelectorAll('button').forEach((x) => x.setAttribute('aria-selected', x === b));
    liveText();
  };
  $('fontSearch').oninput = renderFontList;
  $('localFontsBtn').onclick = showAllFonts;
  $('fontFile').onchange = (e) => { if (e.target.files[0]) addFontFile(e.target.files[0]); e.target.value = ''; };
  $('boldBtn').onclick = () => { ui.bold = !ui.bold; liveText(); };
  $('italBtn').onclick = () => { ui.italic = !ui.italic; liveText(); };
  $('txt').oninput = () => { liveText(); clearTimeout(renderFontList.t); renderFontList.t = setTimeout(renderFontList, 250); };
  ['txtH', 'txtSp', 'txtCv', 'txtLs'].forEach((id) => $(id).oninput = liveText);
  $('txtAlign').querySelectorAll('button').forEach((b) => b.onclick = () => { ui.align = b.dataset.align; liveText(); });
  $('txtColor').oninput = () => { const o = ui.editingText && objById(ui.editingText); if (o) { for (const m of wordOf(o)) { m.color = normHex($('txtColor').value); m.ver = VER++; } draw(); renderLayers(); scheduleGen(); } };
  $('txtColor').onchange = () => { if (ui.editingText) { checkpoint(); changed(); } };
  $('addTextBtn').onclick = addOrUpdateText;
  $('textNewBtn').onclick = () => { ui.editingText = null; ui.sel = new Set(); syncTextUI(); renderInspector(); renderLayers(); draw(); $('txt').focus(); $('txt').select(); };
  $('undoBtn').onclick = undo; $('redoBtn').onclick = redo;
  $('dbFinish').onclick = () => finishRail();
  $('dbUndo').onclick = () => undoRailDot();
  $('dbCancel').onclick = () => { ui.colDraft = newColDraft(); syncDrawBar(); draw(); };
  $('dbDone').onclick = () => { keepDraft(); setTool(null); };
  // finish whatever column is being drawn, then switch to dragging rungs across the columns
  $('dbRungs').onclick = () => {
    keepDraft();
    const o = colObj();
    if (!o || !o.columns || !o.columns.length) { toast('Draw a column first: one rail along each edge.'); return; }
    setTool('rung');
    toast('Drag a line across both rails to add a rung. Press Esc when done.', 4200);
  };
  $('drawBar').querySelectorAll('[data-rm]').forEach((b) => b.onclick = () => { ui.railMode = b.dataset.rm; syncDrawBar(); draw(); });
  $('groupBtn').onclick = groupColors;

  /* ---------------- sample ---------------- */
  const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <circle id="Badge" cx="100" cy="100" r="94" fill="#1d3f8f"/>
    <circle id="Gold rim" cx="100" cy="100" r="94" fill="none" stroke="#f0b323" stroke-width="7"/>
    <path id="Star" fill="#f0b323" d="M100 70 L110.6 98.4 L140.9 99.7 L117.1 118.6 L125.3 147.8 L100 131 L74.7 147.8 L82.9 118.6 L59.1 99.7 L89.4 98.4 Z"/>
    <path id="Ribbon" fill="#c8102e" d="M44 153 Q100 173 156 153 L159 164 Q100 186 41 164 Z"/>
  </svg>`;
  async function loadSample() {
    S.objects = []; ui.sel = new Set(); ui.editingText = null;
    if (S.hoop === '100x100') { /* fits */ }
    importSVGText(SAMPLE_SVG, 'sample.svg');
    const base = pickDefaultFont();
    const t = { str: 'MAKER', font: base, bold: true, italic: false, height: 8, spacing: 8, curve: 38 };
    const o = makeObj({ kind: 'area', color: '#ffffff', name: 'Text: MAKER', text: { ...t, cx: 0, cy: -23, rot: 0, flip: false } });
    await rebuildText(o);
    if (o.rings.length) { autoPick(o); S.objects.push(o); }
    writeTextForm({ ...t, str: 'Hello', curve: 0, height: 12, spacing: 0 });
    hist.stack = []; hist.i = -1;
    checkpoint(); changed(); fitView();
  }
  function pickDefaultFont() {
    const prefs = ['Arial', 'Helvetica', 'Segoe UI', 'Liberation Sans', 'DejaVu Sans', 'Noto Sans'];
    return prefs.find((f) => fonts.local.includes(f)) || 'sans-serif';
  }

  window.__stitchStudio = { view, S, ui, toScreen: (x, y) => [x * view.s + view.ox, y * view.s + view.oy], results: () => results, assembled: () => A };
  /* ---------------- side panel tabs ---------------- */
  try { ui.ltab = localStorage.getItem('ss-ltab') || 'art'; ui.rtab = localStorage.getItem('ss-rtab') || 'stitch'; } catch (e) { ui.ltab = 'art'; ui.rtab = 'stitch'; }
  function applyTabs() {
    document.querySelectorAll('#leftTabs [data-tab]').forEach((b) => { const on = b.dataset.tab === ui.ltab; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
    document.querySelectorAll('[data-ltab]').forEach((x) => { x.hidden = x.dataset.ltab !== ui.ltab; });
    document.querySelectorAll('#rightTabs [data-tab]').forEach((b) => { const on = b.dataset.tab === ui.rtab; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
    $('inspector').hidden = ui.rtab === 'order';
    document.querySelectorAll('#inspector .rtab').forEach((x) => { x.hidden = x.dataset.rtab !== ui.rtab; });
    $('orderSection').hidden = ui.rtab !== 'order';
    const one = selected().length === 1 ? selected()[0] : null;
    const nb = one && one.borders ? one.borders.length : 0;
    $('bordersBadge').textContent = nb ? String(nb) : '';
    $('orderBadge').textContent = S.objects.length ? String(S.objects.length) : '';
  }
  function setTab(side, t) {
    if (side === 'l') ui.ltab = t; else ui.rtab = t;
    try { localStorage.setItem(side === 'l' ? 'ss-ltab' : 'ss-rtab', t); } catch (e) { }
    applyTabs();
  }
  for (const [nav, side] of [['leftTabs', 'l'], ['rightTabs', 'r']]) {
    const bar = $(nav);
    bar.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => setTab(side, b.dataset.tab));
    bar.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const tabs = [...bar.querySelectorAll('[data-tab]')];
      const i = tabs.findIndex((b) => b.getAttribute('aria-selected') === 'true');
      const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      setTab(side, n.dataset.tab); n.focus(); e.preventDefault();
    });
  }


  /* ---------------- fine-adjust arrows beside every slider ---------------- */
  // the row a slider belongs to (its output and dial live there), whether or not it has arrows
  function rowOf(el) { const w = el.closest('.rangewrap'); return (w || el).parentElement; }
  function nudgeRange(input, dir) {
    const step = +input.step || 1, min = input.min === '' ? 0 : +input.min, max = input.max === '' ? 100 : +input.max;
    const dec = (String(input.step).split('.')[1] || '').length;
    const v = Math.min(max, Math.max(min, +(+input.value + dir * step).toFixed(dec)));
    if (v === +input.value) return false;
    input.value = v;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }
  function addSteppers(root) {
    (root || document).querySelectorAll('input[type=range]:not([data-nostep])').forEach((input) => {
      if (input.parentElement && input.parentElement.classList.contains('rangewrap')) return;
      const wrap = document.createElement('span');
      wrap.className = 'rangewrap';
      input.parentNode.insertBefore(wrap, input);
      wrap.appendChild(input);
      const lbl = input.getAttribute('aria-label') || (input.id && document.querySelector(`label[for="${input.id}"]`) ? document.querySelector(`label[for="${input.id}"]`).textContent : 'value');
      const box = document.createElement('span');
      box.className = 'stepper';
      box.innerHTML = `<button type="button" data-dir="1" aria-label="Increase ${esc(lbl)}" title="Up one step (hold to keep going)">▲</button><button type="button" data-dir="-1" aria-label="Decrease ${esc(lbl)}" title="Down one step (hold to keep going)">▼</button>`;
      wrap.appendChild(box);
      box.querySelectorAll('button').forEach((b) => {
        let t1 = null, t2 = null, changed = false;
        // the panel can be redrawn while an arrow is held, which removes the button before it hears the
        // release; so the release is watched on the whole window, and repeating stops if the slider is gone
        const stop = () => {
          clearTimeout(t1); clearInterval(t2); t1 = t2 = null;
          window.removeEventListener('pointerup', stop); window.removeEventListener('pointercancel', stop); window.removeEventListener('blur', stop);
          if (changed) { changed = false; const cur = live(); if (cur) cur.dispatchEvent(new Event('change', { bubbles: true })); }
        };
        // the same slider after a redraw (sliders are found again by their id or setting name)
        const live = () => {
          if (input.isConnected) return input;
          if (input.id) return document.getElementById(input.id);
          if (input.dataset.param) return document.querySelector(`input[type=range][data-param="${input.dataset.param}"]`);
          return null;
        };
        const tick = () => { const cur = live(); if (!cur) { stop(); return; } changed = nudgeRange(cur, +b.dataset.dir) || changed; };
        b.addEventListener('pointerdown', (e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          stop();
          window.addEventListener('pointerup', stop); window.addEventListener('pointercancel', stop); window.addEventListener('blur', stop);
          tick();
          t1 = setTimeout(() => { t2 = setInterval(tick, 70); }, 420);
        });
        // keyboard (Enter or Space on the arrow)
        b.addEventListener('click', (e) => { if (e.detail === 0 && nudgeRange(input, +b.dataset.dir)) input.dispatchEvent(new Event('change', { bubbles: true })); });
      });
    });
  }
  new MutationObserver(() => addSteppers()).observe(document.body, { childList: true, subtree: true });

  /* ---------------- boot ---------------- */
  try { const m = localStorage.getItem('ss-machine'); if (m) ui.machine = m; } catch (e) { }
  loadSetup();
  addSteppers();
  readTheme();
  if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { readTheme(); draw(); });
  new MutationObserver(() => { readTheme(); draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.addEventListener('resize', () => { resize(); });
  new ResizeObserver(() => resize()).observe($('canvasWrap'));
  syncSettingsUI();
  setView('both');
  fonts.local = Importer.detectFonts();
  ui.font = pickDefaultFont();
  renderFontList();
  syncTextUI();
  resize();
  fitView();
  setProjectName('');
  checkpoint(); changed();
})();
