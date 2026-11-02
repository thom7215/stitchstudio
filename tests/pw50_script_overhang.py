# letters whose ink reaches past their advance width (script swashes) must be traced whole
import asyncio, pathlib, base64, sys
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parents[1]
FONTS = {'GV': '/tmp/fnt/fontsource-great-vibes-5.3.0/files/great-vibes-latin-400-normal.woff2', 'AL': '/tmp/fnt/fontsource-allura-5.3.0/files/allura-latin-400-normal.woff2'}
async def run(url):
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page()
        await pg.goto(url); await pg.wait_for_timeout(600)
        for name, path in FONTS.items():
            data = base64.b64encode(open(path,'rb').read()).decode()
            res = await pg.evaluate("""async ([name, data]) => {
              const buf = Uint8Array.from(atob(data), c => c.charCodeAt(0));
              const ff = new FontFace(name, buf); await ff.load(); document.fonts.add(ff);
              const c = document.createElement('canvas').getContext('2d'); c.font = `160px "${name}"`;
              const capH = c.measureText('H').actualBoundingBoxAscent;
              const bad = [];
              for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
                const m = c.measureText(ch), k = 25 / capH;
                const inkW = (m.actualBoundingBoxLeft + m.actualBoundingBoxRight) * k, inkH = (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) * k;
                const gl = await Importer.traceText({ str: ch, font: name, height: 25 });
                let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
                for (const r of gl) for (const [x,y] of r) { x0=Math.min(x0,x); x1=Math.max(x1,x); y0=Math.min(y0,y); y1=Math.max(y1,y); }
                const dw = inkW - (x1-x0), dh = inkH - (y1-y0);
                if (dw > 0.4 || dh > 0.4) bad.push(`${ch}: ${dw.toFixed(1)}w ${dh.toFixed(1)}h mm short`);
              }
              return bad;
            }""", [name, data])
            print(' ', name, len(res), 'clipped', res[:8])
        await b.close()
for label, f in (('before', '/tmp/old_index.html'), ('after', str(ROOT / 'index.html'))):
    print(label); asyncio.run(run(pathlib.Path(f).as_uri()))
