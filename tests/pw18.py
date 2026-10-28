import pathlib
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'dist' / 'index.html').as_uri()
import asyncio, math
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
        await pg.goto(APP_URL); await pg.wait_for_timeout(1500)
        await pg.click('#sampleBtn'); await pg.wait_for_timeout(2500)
        before = await pg.inner_text('#stats')
        await pg.click('#rightTabs [data-tab=order]'); await pg.click('#layers li:nth-child(3)'); await pg.wait_for_timeout(400)  # Star (fill)
        await pg.click('#rightTabs [data-tab=borders]'); await pg.click('#traceBorderBtn'); await pg.wait_for_timeout(300)
        cvb = await pg.locator('#cv').bounding_box()
        async def scr(x,y):
            sx, sy = await pg.evaluate(f"window.__stitchStudio.toScreen({x},{y})"); return cvb['x']+sx, cvb['y']+sy
        ring = await pg.evaluate("window.__stitchStudio.S.objects[2].rings[0]")
        # star vertices: pick 4 consecutive outline points spread out (top arm left edge to right edge)
        n=len(ring); idx=[0, n//10, n//5, 3*n//10]
        for k in idx: await pg.mouse.click(*(await scr(*ring[k]))); await pg.wait_for_timeout(60)
        await pg.mouse.click(*(await scr(*ring[idx[-1]]))); await pg.wait_for_timeout(800)
        await pg.click('#dbDone'); await pg.wait_for_timeout(600)
        bs = await pg.evaluate("window.__stitchStudio.S.objects[2].borders")
        print('borders', len(bs), bs[0]['R']['modes'], bs[0]['width'], bs[0]['align'])
        print('stats before', before.split('\n')[1], 'after', (await pg.inner_text('#stats')).split('\n')[1])
        await pg.click('.guides.bords li'); await pg.wait_for_timeout(300)
        await pg.evaluate("const r=document.getElementById('bW'); r.value=3; r.dispatchEvent(new Event('input')); r.dispatchEvent(new Event('change'))")
        await pg.wait_for_timeout(600)
        await pg.click('#bAlign [data-al=inside]'); await pg.wait_for_timeout(800)
        print('after width 3 inside', (await pg.inner_text('#stats')).split('\n')[1])
        await pg.click('#zoomFit')
        box = cvb
        await pg.mouse.move(box['x']+box['width']/2, box['y']+box['height']/2+20)
        for i in range(3): await pg.mouse.wheel(0,-200); await pg.wait_for_timeout(50)
        await pg.wait_for_timeout(600)
        await pg.screenshot(path='tests/out/b1.png')
        # edit a border dot: click first dot, check arrows/info
        q = (await pg.evaluate("window.__stitchStudio.S.objects[2].borders[0].R.pts"))[1]
        await pg.mouse.click(*(await scr(*q))); await pg.wait_for_timeout(400)
        print('railinfo:', (await pg.locator('.railinfo').nth(1).inner_text()).split('\n')[0])
        await pg.keyboard.press('Tab'); await pg.wait_for_timeout(500)
        print('modes after Tab', (await pg.evaluate("window.__stitchStudio.S.objects[2].borders[0].R.modes")))
        print(errs); await b.close()
asyncio.run(main())
