import pathlib
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'dist' / 'index.html').as_uri()
import asyncio, math
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]
        pg.on('pageerror', lambda e: errs.append('PAGEERROR '+str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
        await pg.goto(APP_URL)
        await pg.wait_for_timeout(3000)
        await pg.click('#clearBtn')
        await pg.fill('#txt','I')
        await pg.evaluate("document.getElementById('txtH').value=40; document.getElementById('txtH').dispatchEvent(new Event('input'))")
        await pg.click('#addTextBtn')
        await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000)
        await pg.click('#zoomFit'); await pg.wait_for_timeout(300)
        await pg.click('#quickDraw'); await pg.wait_for_timeout(300)
        cvb = await pg.locator('#cv').bounding_box()
        bb = await pg.evaluate("(()=>{const o=window.__stitchStudio.S.objects[0];let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const r of o.rings)for(const p of r){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);}return [x0,y0,x1,y1]})()")
        cx=(bb[0]+bb[2])/2
        async def scr(x,y):
            sx, sy = await pg.evaluate(f"window.__stitchStudio.toScreen({x},{y})"); return cvb['x']+sx, cvb['y']+sy
        for y in [bb[1]+2, (bb[1]+bb[3])/2, bb[3]-2]:
            await pg.mouse.click(*(await scr(cx,y))); await pg.wait_for_timeout(80)
        await pg.mouse.click(*(await scr(cx,bb[3]-2))); await pg.wait_for_timeout(800)
        await pg.click('#dbDone'); await pg.wait_for_timeout(400)
        # select path by clicking middle dot, then drag the middle right diamond up-right
        await pg.mouse.click(*(await scr(cx,(bb[1]+bb[3])/2))); await pg.wait_for_timeout(500)
        hs = await pg.evaluate("(()=>{const o=window.__stitchStudio.S.objects[0];return null})()")
        # get handle positions from preview by evaluating Core
        h = await pg.evaluate("(()=>{const o=window.__stitchStudio.S.objects[0];return Core.guidePreview(o.rings,[],o.guides,o.dirs||[])[0].handles})()")
        print('handles mid', h[1])
        a = h[1][0]
        x0,y0 = await scr(*a)
        await pg.mouse.move(x0,y0); await pg.mouse.down(); await pg.mouse.move(x0+5, y0-60, steps=6); await pg.mouse.up()
        await pg.wait_for_timeout(1200)
        g = await pg.evaluate("window.__stitchStudio.S.objects[0].guides[0]")
        print('e:', g.get('e'))
        # shift-drag other diamond at last dot
        h = await pg.evaluate("(()=>{const o=window.__stitchStudio.S.objects[0];return Core.guidePreview(o.rings,[],o.guides,o.dirs||[])[0].handles})()")
        x1,y1 = await scr(*h[2][1])
        await pg.keyboard.down('Shift'); await pg.mouse.move(x1,y1); await pg.mouse.down(); await pg.mouse.move(x1-25, y1, steps=5); await pg.mouse.up(); await pg.keyboard.up('Shift')
        await pg.wait_for_timeout(1200)
        g = await pg.evaluate("window.__stitchStudio.S.objects[0].guides[0]")
        print('e after shift:', g.get('e'))
        await pg.click('#viewSeg [data-v=stitch]'); await pg.wait_for_timeout(400)
        await pg.screenshot(path='tests/out/e1.png')
        print('\n'.join(errs))
        await b.close()
asyncio.run(main())
