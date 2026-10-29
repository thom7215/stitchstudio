import asyncio, pathlib, sys
from playwright.async_api import async_playwright
URL = (pathlib.Path('index.html').resolve()).as_uri()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        await pg.goto(URL); await pg.wait_for_timeout(1000)
        await pg.click('#leftTabs [data-tab=art]'); await pg.click('#sampleBtn'); await pg.wait_for_timeout(2000)
        await pg.click('#rightTabs [data-tab=order]'); await pg.click('#layers li:nth-child(2)'); await pg.click('#rightTabs [data-tab=stitch]'); await pg.wait_for_timeout(500)
        g = "window.__stitchStudio.S.objects[1].params.shortAmt"
        print('start', await pg.evaluate(g))
        await pg.locator('#inspector [data-param=shortAmt]').locator('xpath=..').locator('[data-dir="-1"]').click(); 
        for t in [300, 1000, 3000]:
            await pg.wait_for_timeout(t if t==300 else t-300); print(f'after {t} ms', await pg.evaluate(g))
        # hold for 1 s
        bt = pg.locator('#inspector [data-param=spacing]').locator('xpath=..').locator('[data-dir="1"]')
        bb = await bt.bounding_box(); await pg.mouse.move(bb['x']+5, bb['y']+5); await pg.mouse.down(); await pg.wait_for_timeout(1000); await pg.mouse.up()
        g2='window.__stitchStudio.S.objects[1].params.spacing'; v1 = await pg.evaluate(g2); await pg.wait_for_timeout(2000); print('held 1 s (spacing):', v1, '2 s after release:', await pg.evaluate(g2))
        await b.close()
asyncio.run(main())
