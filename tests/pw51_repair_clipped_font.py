# a font digitized with the old tracer (swashes cut off) gets its full outlines back, keeping columns
import asyncio, pathlib, base64
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parents[1]
GV = base64.b64encode(open('/tmp/fnt/fontsource-great-vibes-5.3.0/files/great-vibes-latin-400-normal.woff2','rb').read()).decode()
INJ = """async (data) => { const buf = Uint8Array.from(atob(data), c => c.charCodeAt(0)); const ff = new FontFace('GV', buf); await ff.load(); document.fonts.add(ff); }"""
BB = """(() => { const f = JSON.parse(localStorage.getItem('ss-fonts'))[0]; const out = {};
  for (const ch of ['K','F','I','o']) { const r = f.glyphs[ch].objects[0].rings.flat(); out[ch] = [Math.min(...r.map(q=>q[0])).toFixed(1), Math.max(...r.map(q=>q[0])).toFixed(1)].join('..'); }
  out.Kcols = f.glyphs.K.objects[0].columns.length; out.clipFix = f.clipFix; return out; })()"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width':1440,'height':900}); pg = await ctx.new_page()
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///tmp/old_index.html'); await pg.wait_for_timeout(600)
        await pg.evaluate("localStorage.clear()"); await pg.evaluate(INJ, GV)
        await pg.click('#modeSeg [data-mode=font]'); await pg.wait_for_timeout(400)
        await pg.evaluate("document.getElementById('sfSrc').value = 'GV'")
        await pg.click('#sfCreate'); await pg.wait_for_function("document.getElementById('busy').hidden", timeout=90000); await pg.wait_for_timeout(600)
        # pretend columns were drawn on K
        await pg.click('#modeSeg [data-mode=studio]'); await pg.wait_for_timeout(300)
        await pg.evaluate("""(() => { const fs = JSON.parse(localStorage.getItem('ss-fonts')); const o = fs[0].glyphs.K.objects[0]; const r = o.rings[0];
          o.columns = [{ A: { pts: [r[0], r[5]], modes: ['edge'] }, B: { pts: [r[20], r[25]], modes: ['edge'] }, rungs: [], n: 1 }]; delete fs[0].clipFix; localStorage.setItem('ss-fonts', JSON.stringify(fs)); })()""")
        print('old tracer:', await pg.evaluate(BB))
        await pg.goto((ROOT/'index.html').as_uri()); await pg.evaluate(INJ, GV); await pg.wait_for_timeout(600)
        await pg.click('#modeSeg [data-mode=font]'); await pg.wait_for_timeout(5000)
        print('after repair:', await pg.evaluate(BB))
        print('open letter on canvas:', await pg.evaluate("window.__stitchStudio.S.objects.length"), 'name', await pg.evaluate("JSON.parse(localStorage.getItem('ss-fonts'))[0].name"))
        await pg.screenshot(path='/tmp/repair.png')
        print(errs); await b.close()
asyncio.run(main())
