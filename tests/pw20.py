import pathlib
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'dist' / 'index.html').as_uri()
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
        await pg.goto(APP_URL); await pg.wait_for_timeout(1500)
        await pg.set_input_files('#fileIn','tests/messy.svg'); await pg.wait_for_timeout(2500)
        cvb = await pg.locator('#cv').bounding_box()
        async def scr(x,y):
            sx, sy = await pg.evaluate(f"window.__stitchStudio.toScreen({x},{y})"); return cvb['x']+sx, cvb['y']+sy
        # click a petal, then use the button to select the whole SVG
        o = await pg.evaluate("window.__stitchStudio.S.objects[1].rings[0][5]")
        await pg.mouse.click(*(await scr(*o))); await pg.wait_for_timeout(400)
        await pg.click('#selGroup'); await pg.wait_for_timeout(400)
        print('selected', await pg.evaluate("window.__stitchStudio.ui.sel.size"), 'of', await pg.evaluate("window.__stitchStudio.S.objects.length"))
        w0 = await pg.input_value('#szW'); print('size before', w0, await pg.input_value('#szH'))
        # drag bottom-right handle outward
        bb = await pg.evaluate("(()=>{const st=window.__stitchStudio;let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const o of st.S.objects){const P=o.kind==='area'?o.rings.flat():o.paths.flatMap(p=>p.pts);for(const q of P){x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1]);}}return [x0,y0,x1,y1]})()")
        hx,hy = await scr(bb[2],bb[3]); hx+=4; hy+=4
        await pg.mouse.move(hx,hy); await pg.mouse.down(); await pg.mouse.move(hx-60,hy-30,steps=8)
        await pg.screenshot(path='tests/out/rs1.png')
        await pg.mouse.up(); await pg.wait_for_timeout(1500)
        print('size after corner drag', await pg.input_value('#szW'), await pg.input_value('#szH'))
        # side handle: stretch width only
        bb = await pg.evaluate("(()=>{const st=window.__stitchStudio;let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const o of st.S.objects){const P=o.kind==='area'?o.rings.flat():o.paths.flatMap(p=>p.pts);for(const q of P){x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1]);}}return [x0,y0,x1,y1]})()")
        hx,hy = await scr(bb[2],(bb[1]+bb[3])/2); hx+=4
        await pg.mouse.move(hx,hy); await pg.mouse.down(); await pg.mouse.move(hx+40,hy,steps=6); await pg.mouse.up(); await pg.wait_for_timeout(1500)
        print('size after side drag', await pg.input_value('#szW'), await pg.input_value('#szH'))
        await pg.click('#rightTabs [data-tab=arrange]'); await pg.click('[data-pct="50"]'); await pg.wait_for_timeout(1500)
        print('after 50%', await pg.input_value('#szW'), await pg.input_value('#szH'))
        await pg.screenshot(path='tests/out/rs2.png')
        print(errs); await b.close()
asyncio.run(main())
