import pathlib
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'dist' / 'index.html').as_uri()
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
        await pg.goto(APP_URL); await pg.wait_for_timeout(1500)
        await pg.click('#sampleBtn'); await pg.wait_for_timeout(2500)
        names = lambda: pg.evaluate("window.__stitchStudio.S.objects.map(o=>o.name)")
        print('before', await names())
        items = pg.locator('#layers li')
        last = await items.nth(4).bounding_box(); first = await items.nth(0).bounding_box()
        await pg.mouse.move(last['x']+40, last['y']+last['height']/2); await pg.mouse.down()
        await pg.mouse.move(last['x']+40, first['y']+5, steps=12)
        await pg.screenshot(path='tests/out/sort1.png', clip={'x':1110,'y':380,'width':330,'height':320})
        await pg.mouse.up(); await pg.wait_for_timeout(800)
        print('after drag up', await names())
        items = pg.locator('#layers li')
        a = await items.nth(0).bounding_box(); z = await items.nth(4).bounding_box()
        await pg.mouse.move(a['x']+40, a['y']+a['height']/2); await pg.mouse.down()
        await pg.mouse.move(a['x']+40, z['y']+z['height']-2, steps=12); await pg.mouse.up(); await pg.wait_for_timeout(800)
        print('after drag to end', await names())
        print('selected after drags:', await pg.evaluate("[...window.__stitchStudio.ui.sel]"))
        await pg.keyboard.press('Control+z'); await pg.wait_for_timeout(500)
        print('undo', await names())
        print(errs); await b.close()
asyncio.run(main())
