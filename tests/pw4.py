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
        await pg.wait_for_timeout(3000)
        await pg.click('#clearBtn')
        await pg.fill('#txt','Brodé goes')
        await pg.evaluate("document.getElementById('txtH').value=9; document.getElementById('txtH').dispatchEvent(new Event('input'))")
        await pg.click('#boldBtn')  # turn bold off
        await pg.click('#addTextBtn')
        await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000)
        await pg.click('#viewSeg [data-v=stitch]')
        await pg.keyboard.press('Escape')
        box = await pg.locator('#cv').bounding_box()
        cx, cy = box['x']+box['width']/2, box['y']+box['height']/2
        await pg.mouse.move(cx-60, cy)
        for i in range(7):
            await pg.mouse.wheel(0,-200); await pg.wait_for_timeout(60)
        await pg.wait_for_timeout(500)
        await pg.screenshot(path='tests/out/s7.png', clip={'x':box['x'],'y':box['y'],'width':box['width'],'height':box['height']})
        # drag test: select and drag text, then undo
        await pg.click('#zoomFit')
        await pg.wait_for_timeout(200)
        before = await pg.inner_text('#stats')
        await pg.mouse.move(cx, cy); await pg.mouse.down(); await pg.mouse.move(cx+40, cy+60, steps=5); await pg.mouse.up()
        await pg.wait_for_timeout(800)
        print('moved size line:', (await pg.input_value('#szW')))
        await pg.keyboard.press('Control+z'); await pg.wait_for_timeout(600)
        print('undo ok', await pg.is_enabled('#redoBtn'))
        print('\n'.join(errs))
        await b.close()
asyncio.run(main())
