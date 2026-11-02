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
        await column((x1,y0+0.3),(x1,y1-0.3),(x1-w,y0+0.3),(x1-w,y1-0.3))
        ym=(y0+y1)/2
        # drawn badly on purpose: the crossbar from right to left and the right stem from the top
        await column((x1-w,ym-1.5),(x0+w,ym-1.5),(x1-w,ym+1.5),(x0+w,ym+1.5))
        await pg.click('#dbDone'); await pg.wait_for_timeout(500)
        await pg.click('#colsDetails summary'); await pg.wait_for_timeout(200)
        A = "JSON.stringify(window.__stitchStudio.ui.active)"
        row = pg.locator('.guides.cols li').nth(0).locator('.gnm')
        await row.click(); await pg.wait_for_timeout(200); print('row click:', await pg.evaluate(A))
        await pg.locator('.guides.cols li').nth(0).locator('.gnm').click(); await pg.wait_for_timeout(200); print('row click again:', await pg.evaluate(A))
        # canvas: click the left stem's outer rail line, twice
        q = await scr(x0+0.05, (y0+y1)/2+5)
        await pg.mouse.click(*q); await pg.wait_for_timeout(300); print('line click:', await pg.evaluate(A))
        await pg.wait_for_timeout(600); await pg.mouse.click(*q); await pg.wait_for_timeout(300); print('line click again:', await pg.evaluate(A))
        # double-click on a line still adds a dot
        await pg.mouse.dblclick(*q); await pg.wait_for_timeout(400); print('double-click:', await pg.evaluate(A), await pg.evaluate("window.__stitchStudio.S.objects[0].columns[0].A.pts.length"))
        print(errs); await b.close()
asyncio.run(main())
