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
        await pg.click('#quickDraw'); await pg.wait_for_timeout(300)
        cvb = await pg.locator('#cv').bounding_box()
        async def scr(x,y):
            sx, sy = await pg.evaluate(f"window.__stitchStudio.toScreen({x},{y})"); return cvb['x']+sx, cvb['y']+sy
        rings = await pg.evaluate("window.__stitchStudio.S.objects[0].rings")
        xs=[q[0] for r in rings for q in r]; ys=[q[1] for r in rings for q in r]
        x0,x1,y0,y1=min(xs),max(xs),min(ys),max(ys)
        for x in [x0,x1]:
            for y in [y0+1,(y0+y1)/2,y1-1]: await pg.mouse.click(*(await scr(x,y))); await pg.wait_for_timeout(60)
            await pg.keyboard.press('Enter'); await pg.wait_for_timeout(300)
        await pg.click('#dbDone'); await pg.wait_for_timeout(600)
        q = (await pg.evaluate("window.__stitchStudio.S.objects[0].columns[0]"))['A']['pts'][1]
        await pg.mouse.click(*(await scr(*q))); await pg.wait_for_timeout(400)
        before = await pg.evaluate("Core.nodeHandles(window.__stitchStudio.S.objects[0].columns[0].A,1)")
        hl = [q[0]+before['out'][0], q[1]+before['out'][1]]
        hx,hy = await scr(*hl); tx,ty = await scr(hl[0]-4, hl[1]+2)
        await pg.mouse.move(hx,hy); await pg.mouse.down(); await pg.mouse.move(tx,ty,steps=6); await pg.mouse.up(); await pg.wait_for_timeout(600)
        after = await pg.evaluate("Core.nodeHandles(window.__stitchStudio.S.objects[0].columns[0].A,1)")
        print('in before', [round(v,2) for v in before['in']], 'in after', [round(v,2) for v in after['in']])
        print('out before', [round(v,2) for v in before['out']], 'out after', [round(v,2) for v in after['out']])
        print(errs); await b.close()
asyncio.run(main())
