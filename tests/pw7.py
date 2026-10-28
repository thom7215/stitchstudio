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
        print(await pg.inner_text('#stats'))
        await pg.click('#layers li:nth-child(2)'); await pg.wait_for_timeout(400)  # gold rim satin
        await pg.screenshot(path='tests/out/c1.png')
        # change spacing slider
        await pg.evaluate("const r=document.querySelector('[data-param=spacing]'); r.value=0.3; r.dispatchEvent(new Event('input')); r.dispatchEvent(new Event('change'))")
        await pg.wait_for_timeout(1200)
        print(await pg.inner_text('#stats'))
        # zoom on rim
        await pg.click('#viewSeg [data-v=stitch]')
        box = await pg.locator('#cv').bounding_box()
        await pg.mouse.move(box['x']+box['width']/2+150, box['y']+box['height']/2-150)
        for i in range(6): await pg.mouse.wheel(0,-200); await pg.wait_for_timeout(50)
        await pg.wait_for_timeout(600)
        await pg.screenshot(path='tests/out/c2.png', clip={'x':box['x'],'y':box['y'],'width':box['width'],'height':box['height']})
        print('\n'.join(errs))
        await b.close()
asyncio.run(main())
