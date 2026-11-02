import asyncio, pathlib
from playwright.async_api import async_playwright
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'index.html').as_uri()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(APP_URL); await pg.wait_for_timeout(1000)
        await pg.click('#leftTabs [data-tab=text]'); await pg.fill('#txt','H')
        await pg.evaluate("txtH.value=40; txtH.dispatchEvent(new Event('input'))")
        await pg.click('#addTextBtn'); await pg.wait_for_function("document.getElementById('busy').hidden"); await pg.wait_for_timeout(400)
        await pg.click('#zoomFit'); await pg.wait_for_timeout(300)
        cvb = await pg.locator('#cv').bounding_box()
        async def scr(x,y):
            sx, sy = await pg.evaluate(f"window.__stitchStudio.toScreen({x},{y})"); return cvb['x']+sx, cvb['y']+sy
        ring = (await pg.evaluate("window.__stitchStudio.S.objects[0].rings"))[0]
        xs=[q[0] for q in ring]; ys=[q[1] for q in ring]; x0,x1,y0,y1=min(xs),max(xs),min(ys),max(ys)
        w = (x1-x0)*0.18
        # three columns: left stem, right stem, crossbar (drawn in that order)
        await pg.click('#rightTabs [data-tab=stitch]'); await pg.click('#drawColBtn'); await pg.wait_for_timeout(200)
        async def column(a1, a2, b1, b2):
            for q in (a1, a2): await pg.mouse.click(*(await scr(*q))); await pg.wait_for_timeout(420)
            await pg.keyboard.press('Enter'); await pg.wait_for_timeout(250)
            for q in (b1, b2): await pg.mouse.click(*(await scr(*q))); await pg.wait_for_timeout(420)
            await pg.keyboard.press('Enter'); await pg.wait_for_timeout(350)
        await column((x0,y1-0.3),(x0,y0+0.3),(x0+w,y1-0.3),(x0+w,y0+0.3))
        await column((x1,y1-0.3),(x1,y0+0.3),(x1-w,y1-0.3),(x1-w,y0+0.3))
        ym=(y0+y1)/2
        await column((x0+w,ym-1.5),(x1-w,ym-1.5),(x0+w,ym+1.5),(x1-w,ym+1.5))
        await pg.click('#dbDone'); await pg.wait_for_timeout(500)
        L = "[...document.querySelectorAll('.guides.cols li .gnm')].map(e=>e.childNodes[0].textContent.trim())"
        N = "window.__stitchStudio.S.objects[0].columns.map(c=>c.n)"
        await pg.click('#colsDetails summary'); await pg.wait_for_timeout(200)
        print('drawn:', await pg.evaluate(L), await pg.evaluate(N))
        # move the crossbar to sew first (↑ twice)
        for _ in range(2):
            await pg.locator('.guides.cols li').nth(await pg.locator('.guides.cols li').count()-1 if _==0 else 1).locator('[data-c=up]').click(); await pg.wait_for_timeout(300)
        print('after moving column 3 to the top:', await pg.evaluate(L), await pg.evaluate(N))
        # delete the first-made column: the others keep their numbers
        await pg.locator('.guides.cols li', has_text='Column 1').locator('[data-c=del]').click(); await pg.wait_for_timeout(300)
        print('after deleting column 1:', await pg.evaluate(L), await pg.evaluate(N))
        # a new column gets the next number
        await pg.click('#drawColBtn'); await pg.wait_for_timeout(200)
        await column((x0,y1-0.3),(x0,y0+0.3),(x0+w,y1-0.3),(x0+w,y0+0.3))
        await pg.click('#dbDone'); await pg.wait_for_timeout(400)
        if not await pg.evaluate("document.getElementById('colsDetails').open"): await pg.click('#colsDetails summary')
        print('after drawing a new one:', await pg.evaluate(L), await pg.evaluate(N))
        await pg.screenshot(path='tests/out/col_numbers.png')
        print(errs); await b.close()
asyncio.run(main())
