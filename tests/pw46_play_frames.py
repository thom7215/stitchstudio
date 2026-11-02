import asyncio, pathlib
from playwright.async_api import async_playwright
from PIL import Image, ImageChops
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'index.html').as_uri()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for zoom in [0, 3]:
            pg = await b.new_page(viewport={'width':1440,'height':900}, device_scale_factor=1)
            errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(APP_URL); await pg.wait_for_timeout(900)
            await pg.click('#leftTabs [data-tab=art]'); await pg.click('#sampleBtn'); await pg.wait_for_timeout(2500); await pg.keyboard.press('Escape')
            for _ in range(zoom): await pg.click('#zoomIn')
            await pg.wait_for_timeout(500)
            await pg.click('#speedSeg [data-speed="1"]')
            await pg.click('#playBtn'); await pg.wait_for_timeout(2500)
            # freeze: stop the loop without redrawing, then shoot what the fast frames built up
            await pg.evaluate("window.__stitchStudio.ui.playing = false")
            await pg.wait_for_timeout(200)
            box = await pg.locator('#cv').bounding_box()
            await pg.screenshot(path='/tmp/play_fast.png', clip=box)
            marker = await pg.evaluate("!document.getElementById('playhead').hidden")
            # full redraw at the same point
            await pg.evaluate("window.dispatchEvent(new Event('resize'))"); await pg.wait_for_timeout(400)
            await pg.screenshot(path='/tmp/play_full.png', clip=box)
            a = Image.open('/tmp/play_fast.png').convert('RGB'); c = Image.open('/tmp/play_full.png').convert('RGB')
            diff = ImageChops.difference(a, c).convert('L')
            changed = sum(1 for v in diff.get_flattened_data() if v > 40) / (diff.width * diff.height)
            print(f'zoom +{zoom}: pixels that differ from a full redraw: {changed*100:.2f}% | needle marker shown while playing: {marker}', errs)
            await pg.close()
        await b.close()
asyncio.run(main())
