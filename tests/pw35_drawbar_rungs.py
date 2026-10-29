import pathlib
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'dist' / 'index.html').as_uri()
import asyncio
exec(open('tests/pw16.py').read().split("asyncio.run(main())")[0].replace("async def main():","async def main_unused():"))
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(APP_URL); await pg.wait_for_timeout(1500)
        await pg.click('#leftTabs [data-tab=text]'); await pg.fill('#txt','I')
        await pg.evaluate("document.getElementById('txtH').value=40; document.getElementById('txtH').dispatchEvent(new Event('input'))")
        await pg.click('#addTextBtn'); await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000)
        await pg.click('#zoomFit'); await pg.wait_for_timeout(300)
        await pg.click('#quickDraw'); await pg.wait_for_timeout(300)
        cvb = await pg.locator('#cv').bounding_box()
        async def scr(x,y):
            sx, sy = await pg.evaluate(f"window.__stitchStudio.toScreen({x},{y})"); return cvb['x']+sx, cvb['y']+sy
        rings = await pg.evaluate("window.__stitchStudio.S.objects[0].rings")
        xs=[q[0] for r in rings for q in r]; ys=[q[1] for r in rings for q in r]
        x0,x1,y0,y1=min(xs),max(xs),min(ys),max(ys)
        print('button at start:', await pg.evaluate("[dbRungs.hidden, dbRungs.disabled]"))
        for x in [x0,x1]:
            for y in [y0+1,(y0+y1)/2,y1-1]: await pg.mouse.click(*(await scr(x,y))); await pg.wait_for_timeout(60)
            await pg.keyboard.press('Enter'); await pg.wait_for_timeout(300)
        print('button before first column:', await pg.evaluate("[dbRungs.hidden, dbRungs.disabled]"))
        x0b = x0
        for x in [x0,x1]:
            pass
        print('after column, button:', await pg.evaluate("[dbRungs.hidden, dbRungs.disabled]"), 'tool', await pg.evaluate("window.__stitchStudio.ui.tool"))
        await pg.click('#dbRungs'); await pg.wait_for_timeout(400)
        print('tool now', await pg.evaluate("window.__stitchStudio.ui.tool"), 'drawbar hidden', await pg.evaluate("drawBar.hidden"))
        ym=(y0+y1)/2
        sx,sy = await scr(x0-2, ym+3); ex,ey = await scr(x1+2, ym-3)
        await pg.mouse.move(sx,sy); await pg.mouse.down(); await pg.mouse.move(ex,ey,steps=6); await pg.mouse.up(); await pg.wait_for_timeout(600)
        print('rungs', await pg.evaluate("window.__stitchStudio.S.objects[0].columns[0].rungs.length"))
        print(errs); await b.close()
asyncio.run(main())
