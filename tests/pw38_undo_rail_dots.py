import pathlib
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'dist' / 'index.html').as_uri()
import asyncio
exec(open('tests/pw16.py').read().split("asyncio.run(main())")[0].replace("async def main():","async def main_unused():"))
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(APP_URL); await pg.wait_for_timeout(1500)
        await pg.click('#leftTabs [data-tab=text]'); await pg.fill('#txt','I')
        await pg.evaluate("document.getElementById('txtH').value=40; document.getElementById('txtH').dispatchEvent(new Event('input'))")
        await pg.click('#addTextBtn'); await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000)
        await pg.click('#zoomFit'); await pg.wait_for_timeout(300)
        await pg.click('#rightTabs [data-tab=stitch]'); await pg.click('#inspector [data-type=satin]'); await pg.wait_for_timeout(300)
        if await pg.evaluate("window.__stitchStudio.ui.tool") != 'rail': await pg.click('#inspector [data-param=satinDir] [data-val=columns]'); await pg.wait_for_timeout(300)
        cvb = await pg.locator('#cv').bounding_box()
        async def scr(x,y):
            sx, sy = await pg.evaluate(f"window.__stitchStudio.toScreen({x},{y})"); return cvb['x']+sx, cvb['y']+sy
        rings = await pg.evaluate("window.__stitchStudio.S.objects[0].rings")
        xs=[q[0] for r in rings for q in r]; ys=[q[1] for r in rings for q in r]
        x0,x1,y0,y1=min(xs),max(xs),min(ys),max(ys)
        for x in [x0,x1]:
            for y in [y0+1,(y0+y1)/2,y1-1]: await pg.mouse.click(*(await scr(x,y))); await pg.wait_for_timeout(60)
            await pg.keyboard.press('Enter'); await pg.wait_for_timeout(300)
        D = "(()=>{const S=window.__stitchStudio, d=S.ui.colDraft, o=S.S.objects[0]; return JSON.stringify({cols:(o.columns||[]).length, stage:d&&d.stage, A:d?d.A.pts.length:null, B:d?d.B.pts.length:null})})()"
        print('after drawing a column:', await pg.evaluate(D))
        for i in range(7):
            await pg.keyboard.press('Control+z'); await pg.wait_for_timeout(250)
            print(f'  Ctrl+Z {i+1}:', await pg.evaluate(D), 'tool', await pg.evaluate("window.__stitchStudio.ui.tool"))
        # draw one rail, then use the Undo button in the header
        await pg.mouse.click(*(await scr(x0, y0+1))); await pg.mouse.click(*(await scr(x0, (y0+y1)/2))); await pg.wait_for_timeout(200)
        print('two dots drawn:', await pg.evaluate(D))
        await pg.click('#undoBtn'); await pg.wait_for_timeout(250)
        print('header Undo:', await pg.evaluate(D))
        await pg.click('#dbUndo'); await pg.wait_for_timeout(250)
        print('drawing bar Undo:', await pg.evaluate(D), 'dbUndo disabled', await pg.evaluate("dbUndo.disabled"))
        print(errs); await b.close()
asyncio.run(main())
