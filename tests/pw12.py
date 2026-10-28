import pathlib
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'dist' / 'index.html').as_uri()
import asyncio, math
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
        await pg.click('#leftTabs [data-tab=text]'); await pg.fill('#txt','U')
        await pg.evaluate("document.getElementById('txtH').value=40; document.getElementById('txtH').dispatchEvent(new Event('input'))")
        await pg.click('#addTextBtn')
        await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000)
        await pg.click('#zoomFit'); await pg.wait_for_timeout(300)
        await pg.click('#quickDraw'); await pg.wait_for_timeout(300)
        cvb = await pg.locator('#cv').bounding_box()
        async def scr(x,y):
            sx, sy = await pg.evaluate(f"window.__stitchStudio.toScreen({x},{y})"); return cvb['x']+sx, cvb['y']+sy
        rings = await pg.evaluate("window.__stitchStudio.S.objects[0].rings")
        # outer ring = longest
        pts = [pt for r in rings for pt in r]
        x0=min(p[0] for p in pts); x1=max(p[0] for p in pts); y0=min(p[1] for p in pts); y1=max(p[1] for p in pts)
        print('bbox', round(x0,1),round(y0,1),round(x1,1),round(y1,1))
        # rail A: outer edge: top-left -> bottom middle -> top-right (edge mode snaps)
        A=[(x0, y0+0.5),(x0, (y0+y1)/2),((x0+x1)/2, y1),(x1,(y0+y1)/2),(x1, y0+0.5)]
        for q in A: await pg.mouse.click(*(await scr(*q))); await pg.wait_for_timeout(60)
        await pg.mouse.click(*(await scr(*A[-1]))); await pg.wait_for_timeout(300)
        # rail B: inner edge. stroke width ~ ? find inner x by scanning: assume stroke ~ 0.17*width
        sw=(x1-x0)*0.2
        B=[(x0+sw, y0+0.5),(x0+sw,(y0+y1)/2),((x0+x1)/2, y1-sw),(x1-sw,(y0+y1)/2),(x1-sw,y0+0.5)]
        for i,q in enumerate(B):
            await pg.mouse.click(*(await scr(*q))); await pg.wait_for_timeout(60)
            if i==3: await pg.mouse.move(*(await scr(x1-sw-0.5, y0+3))); await pg.wait_for_timeout(150); await pg.screenshot(path='tests/out/r1.png')
        await pg.keyboard.press('Enter'); await pg.wait_for_timeout(1000)
        await pg.click('#dbDone'); await pg.wait_for_timeout(500)
        col = await pg.evaluate("window.__stitchStudio.S.objects[0].columns")
        print('columns', len(col), [ (c['A']['modes'], c['B']['modes']) for c in col])
        # add a rung: slanted across the left stem
        await pg.click('#rungBtn')
        a=await scr(x0-1, (y0+y1)/2-4); bpt=await scr(x0+sw+1, (y0+y1)/2+2)
        await pg.mouse.move(*a); await pg.mouse.down(); await pg.mouse.move(*bpt, steps=5); await pg.mouse.up()
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(1000)
        col = await pg.evaluate("window.__stitchStudio.S.objects[0].columns")
        print('rungs', len(col[0]['rungs']))
        # select a rail dot on rail A (index 1) and Tab
        q = col[0]['A']['pts'][1]
        await pg.mouse.click(*(await scr(*q))); await pg.wait_for_timeout(300)
        await pg.keyboard.press('Tab'); await pg.wait_for_timeout(600)
        col = await pg.evaluate("window.__stitchStudio.S.objects[0].columns")
        print('modes after Tab', col[0]['A']['modes'])
        print(await pg.locator('.railinfo').inner_text())
        await pg.keyboard.press('Shift+Tab'); await pg.wait_for_timeout(500)
        await pg.click('#viewSeg [data-v=stitch]'); await pg.wait_for_timeout(600)
        await pg.screenshot(path='tests/out/r2.png')
        print(await pg.inner_text('#stats'))
        print('warns', await pg.locator('.warn').all_inner_texts())
        print('\n'.join(errs))
        await b.close()
asyncio.run(main())
