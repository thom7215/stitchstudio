import pathlib
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'dist' / 'index.html').as_uri()
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width':1440,'height':900})
        await pg.goto(APP_URL)
        await pg.wait_for_timeout(3000)
        await pg.click('#clearBtn')
        await pg.fill('#txt','AOS')
        await pg.evaluate("document.getElementById('txtH').value=20; document.getElementById('txtH').dispatchEvent(new Event('input'))")
        await pg.click('#addTextBtn')
        await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000)
        await pg.keyboard.press('Escape')
        await pg.click('#viewSeg [data-v=stitch]')
        await pg.click('#zoomFit')
        box = await pg.locator('#cv').bounding_box()
        await pg.mouse.move(box['x']+box['width']/2-60, box['y']+box['height']/2-40)
        for i in range(4): await pg.mouse.wheel(0,-200); await pg.wait_for_timeout(50)
        await pg.wait_for_timeout(700)
        await pg.screenshot(path='tests/out/c3.png', clip={'x':box['x'],'y':box['y'],'width':box['width'],'height':box['height']})
        await b.close()
asyncio.run(main())
