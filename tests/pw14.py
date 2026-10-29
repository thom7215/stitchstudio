import pathlib
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'dist' / 'index.html').as_uri()
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
        await pg.goto(APP_URL); await pg.wait_for_timeout(2000)
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
        # rail A along left edge, then Done (unfinished)
        for y in [y0+1,(y0+y1)/2,y1-1]: await pg.mouse.click(*(await scr(x0,y))); await pg.wait_for_timeout(60)
        await pg.click('#dbDone'); await pg.wait_for_timeout(600)
        print('after Done:', await pg.inner_text('.guides'))
        # drag middle dot of rail A inward 1.5mm (off the edge)
        col = await pg.evaluate("window.__stitchStudio.S.objects[0].columns[0]")
        q = col['A']['pts'][1]; sx,sy = await scr(*q)
        tx,ty = await scr(q[0]+1.5,q[1])
        await pg.mouse.move(sx,sy); await pg.mouse.down(); await pg.mouse.move(tx,ty,steps=5); await pg.mouse.up(); await pg.wait_for_timeout(600)
        col = await pg.evaluate("window.__stitchStudio.S.objects[0].columns[0]")
        print('moved dot to', [round(v,2) for v in col['A']['pts'][1]], 'modes', col['A']['modes'], 'edge x', round(x0,2))
        # continue and draw rail B
        await pg.click('[data-c=cont]'); await pg.wait_for_timeout(300)
        print('drawbar:', await pg.inner_text('#dbTitle'))
        for y in [y0+1,(y0+y1)/2,y1-1]: await pg.mouse.click(*(await scr(x1,y))); await pg.wait_for_timeout(60)
        await pg.keyboard.press('Enter'); await pg.wait_for_timeout(600)
        await pg.click('#dbDone'); await pg.wait_for_timeout(800)
        print('after continue:', await pg.inner_text('.guides'))
        print((await pg.inner_text('#stats')).replace('\n',' | '))
        await pg.screenshot(path='tests/out/f1.png')
        print(errs); await b.close()
asyncio.run(main())
