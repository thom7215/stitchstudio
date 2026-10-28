import asyncio, pathlib, math
from playwright.async_api import async_playwright
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'index.html').as_uri()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(APP_URL); await pg.wait_for_timeout(1200)
        await pg.click('#leftTabs [data-tab=text]'); await pg.fill('#txt','O')
        await pg.evaluate("txtH.value=50; txtH.dispatchEvent(new Event('input'))")
        await pg.click('#addTextBtn'); await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000)
        await pg.click('#zoomFit'); await pg.wait_for_timeout(300)
        await pg.click('#quickDraw'); await pg.wait_for_timeout(300)
        cvb = await pg.locator('#cv').bounding_box()
        async def scr(x,y):
            sx, sy = await pg.evaluate(f"window.__stitchStudio.toScreen({x},{y})"); return cvb['x']+sx, cvb['y']+sy
        rings = await pg.evaluate("window.__stitchStudio.S.objects[0].rings")
        rings.sort(key=lambda r: -abs(sum(r[i][0]*r[(i+1)%len(r)][1]-r[(i+1)%len(r)][0]*r[i][1] for i in range(len(r)))))
        for r in rings[:2]:
            n=len(r); pts=[r[int(n*k/5)] for k in range(5)]
            for q in pts: await pg.mouse.click(*(await scr(*q))); await pg.wait_for_timeout(60)
            await pg.mouse.click(*(await scr(*pts[0]))); await pg.wait_for_timeout(300)
        await pg.click('#dbDone'); await pg.wait_for_timeout(600)
        C="window.__stitchStudio.S.objects[0].columns[0].A"
        A=await pg.evaluate(C)
        print('before', A['closed'], A['modes'], len(A['pts']))
        q=A['pts'][0]; cx=sum(p[0] for p in A['pts'])/len(A['pts']); cy=sum(p[1] for p in A['pts'])/len(A['pts'])
        d=math.hypot(q[0]-cx,q[1]-cy); tx,ty=q[0]+(q[0]-cx)/d*5, q[1]+(q[1]-cy)/d*5
        x,y=await scr(*q); X,Y=await scr(tx,ty)
        await pg.mouse.move(x,y); await pg.mouse.down(); await pg.mouse.move(X,Y,steps=8); await pg.mouse.up(); await pg.wait_for_timeout(800)
        A=await pg.evaluate(C)
        print('after ', A['modes'], len(A['pts']), 'moved dot', [round(v,1) for v in A['pts'][0]], 'target', [round(tx,1),round(ty,1)])
        print('active', await pg.evaluate("JSON.stringify(window.__stitchStudio.ui.active)"), 'stitches', (await pg.inner_text('#stats')).split('\n')[1])
        await pg.screenshot(path='tests/out/railpull2.png')
        print(errs); await b.close()
asyncio.run(main())
