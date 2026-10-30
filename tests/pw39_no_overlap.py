import asyncio, pathlib
from playwright.async_api import async_playwright
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'index.html').as_uri()
# area (mm²) where two satin columns lie on top of each other, with the old behaviour ('allow') and the new one
JS = """(word) => { const o = window.__stitchStudio.S.objects; const out = {};
  for (const mode of ['allow', 'split']) {
    let area = 0, cols = 0, total = 0;
    for (const ob of o) {
      const p = { spacing: 0.4, margin: 0.3, pull: 0.15, underlay: 'normal', curveMode: 'outer', shortAmt: 0.3, maxLen: 7.5, overlap: mode };
      const C = Core.satinFollowColumns(ob.rings, [], p, null); cols += C.length;
      const res = 0.05, bb = Core.bbox(ob.rings), W = Math.ceil(bb.w / res) + 20, H = Math.ceil(bb.h / res) + 20, ox = bb.x0 - 10 * res, oy = bb.y0 - 10 * res;
      const cnt = new Uint8Array(W * H);
      C.forEach((c) => { const own = new Uint8Array(W * H);
        const quad = (P) => { let ya = 1e9, yb = -1e9; for (const q of P) { ya = Math.min(ya, q[1]); yb = Math.max(yb, q[1]); }
          for (let r = Math.max(0, Math.floor((ya - oy) / res)); r <= Math.min(H - 1, Math.ceil((yb - oy) / res)); r++) { const y = oy + (r + .5) * res, xs = [];
            for (let i = 0; i < 4; i++) { const a = P[i], b = P[(i + 1) % 4]; if ((a[1] > y) !== (b[1] > y)) xs.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1])); }
            xs.sort((u, v) => u - v); for (let k = 0; k + 1 < xs.length; k += 2) for (let cc = Math.max(0, Math.ceil((xs[k] - ox) / res - .5)); cc <= Math.min(W - 1, Math.floor((xs[k + 1] - ox) / res - .5)); cc++) own[r * W + cc] = 1; } };
        for (let i = 1; i < c.rungs.length; i++) { const a = c.rungs[i - 1], b = c.rungs[i]; quad([a[0], b[0], b[1], a[1]]); }
        for (let i = 0; i < own.length; i++) cnt[i] += own[i]; });
      for (let i = 0; i < cnt.length; i++) { if (cnt[i] >= 2) area++; if (cnt[i]) total++; }
      area *= res * res; total *= res * res;
      out[mode] = { columns: cols, overlap_mm2: +area.toFixed(1), covered_mm2: +total.toFixed(1), shape_mm2: +Core.ringsArea(ob.rings).toFixed(1) };
    }
  } return out; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(APP_URL); await pg.wait_for_timeout(1000)
        for w in ['X', 'x', 'T', 'A', 'K', 'H', 'Y', 'O', '4', 'B', 'k']:
            await pg.evaluate("window.__stitchStudio.S.objects.length=0")
            await pg.evaluate("document.getElementById('textNewBtn').click()")
            await pg.click('#leftTabs [data-tab=text]'); await pg.fill('#txt', w)
            await pg.evaluate("txtH.value=40; txtH.dispatchEvent(new Event('input'))")
            await pg.click('#addTextBtn'); await pg.wait_for_function("document.getElementById('busy').hidden"); await pg.wait_for_timeout(300)
            r = await pg.evaluate(JS, w)
            a, s = r['allow'], r['split']
            print(f"{w}: two layers {a['overlap_mm2']} mm² -> {s['overlap_mm2']} mm²   columns {a['columns']} -> {s['columns']}   covered {a['covered_mm2']} -> {s['covered_mm2']} of {s['shape_mm2']} mm²")
        print(errs); await b.close()
asyncio.run(main())
