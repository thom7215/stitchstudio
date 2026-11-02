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
        await pg.click('#rightTabs [data-tab=stitch]'); await pg.click('#inspector [data-type=fill]'); await pg.click('#inspector [data-type=satin]'); await pg.wait_for_timeout(400)
        cvb = await pg.locator('#cv').bounding_box()
        async def scr(x,y):
            sx, sy = await pg.evaluate(f"window.__stitchStudio.toScreen({x},{y})"); return cvb['x']+sx, cvb['y']+sy
        ring = (await pg.evaluate("window.__stitchStudio.S.objects[0].rings"))[0]
        xs=[q[0] for q in ring]; ys=[q[1] for q in ring]; x0,x1,y0,y1=min(xs),max(xs),min(ys),max(ys)
        # the inner edge of the right stem: the vertical edge with x between the middle and the right side
        mid = [q for q in ring if x0 + (x1-x0)*0.55 < q[0] < x1 - 1 and y0 + 2 < q[1] < y1 - 2]
        inner_x = sum(q[0] for q in mid) / len(mid)
        ys_mid = sorted(q[1] for q in mid)
        bar_top, bar_bot = ys_mid[0], ys_mid[-1]
        print('inner edge x', inner_x, 'crossbar from', bar_top, 'to', bar_bot)
        L = """(()=>{const S=window.__stitchStudio, d=S.ui.colDraft, o=S.S.objects[0], r=d[d.stage];
          const pts=r.pts.concat([S.ui.snap||S.ui.cursor]); const modes=r.modes.concat([S.ui.route==='jump'?'line':S.ui.railMode]); modes.length=pts.length-1;
          const flip=(r.flip||[]).slice(); flip[modes.length-1]=S.ui.route==='other';
          const P=Core.railDense({pts,modes,flip,closed:false}, o.rings); let len=0; for(let i=1;i<P.length;i++) len+=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]); return [S.ui.route||'auto', +len.toFixed(1)]})()"""
        # rail from the bottom of the inner edge up to the bottom of the crossbar gap
        await pg.mouse.click(*(await scr(inner_x, y1-0.5))); await pg.wait_for_timeout(500)
        await pg.mouse.click(*(await scr(inner_x, bar_bot))); await pg.wait_for_timeout(500)
        # cursor on the top of the gap
        await pg.mouse.move(*(await scr(inner_x, bar_top)), steps=4); await pg.wait_for_timeout(300)
        print('cursor across the gap:', await pg.evaluate(L))
        await pg.keyboard.press(' '); await pg.wait_for_timeout(300)
        print('after Space:', await pg.evaluate(L))
        await pg.screenshot(path='tests/out/route_jump.png')
        await pg.keyboard.press(' '); await pg.wait_for_timeout(300)
        print('after Space again:', await pg.evaluate(L))
        while (await pg.evaluate(L))[0] != 'jump':
            await pg.keyboard.press(' '); await pg.wait_for_timeout(200)
        print('back on jump:', await pg.evaluate(L))
        await pg.mouse.click(*(await scr(inner_x, bar_top))); await pg.wait_for_timeout(500)
        await pg.mouse.move(*(await scr(inner_x, y0+0.5)), steps=4); await pg.wait_for_timeout(300)
        print('next part after placing the dot:', await pg.evaluate(L), 'modes', await pg.evaluate("JSON.stringify(window.__stitchStudio.ui.colDraft.A.modes)"))
        print(errs); await b.close()
asyncio.run(main())
