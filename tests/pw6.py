import pathlib
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'dist' / 'index.html').as_uri()
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]
        pg.on('pageerror', lambda e: errs.append('PAGEERROR '+str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
        await pg.goto(APP_URL)
        await pg.wait_for_timeout(3500)
        await pg.click('#layers li:last-child'); await pg.wait_for_timeout(300)
        await pg.click('#inspector [data-param=satinDir] [data-val=guides]'); await pg.wait_for_timeout(1500)
        n1 = await pg.inner_text('#stats')
        # zoom on text
        box = await pg.locator('#cv').bounding_box()
        cx, cy = box['x']+box['width']/2, box['y']+box['height']/2
        await pg.mouse.move(cx, cy-120)
        for i in range(5): await pg.mouse.wheel(0,-200); await pg.wait_for_timeout(50)
        await pg.wait_for_timeout(600)
        await pg.screenshot(path='tests/out/g4.png', clip={'x':box['x'],'y':box['y'],'width':box['width'],'height':box['height']})
        await pg.keyboard.press('Control+z'); await pg.wait_for_timeout(800)
        print('after undo dir:', await pg.locator('#inspector [data-param=satinDir] [aria-pressed=true]').inner_text())
        print('\n'.join(errs))
        await b.close()
asyncio.run(main())
