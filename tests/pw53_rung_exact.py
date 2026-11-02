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
        await pg.click('#rungBtn'); await pg.wait_for_timeout(200)
        cols = await pg.evaluate("window.__stitchStudio.S.objects[0].columns.map(c=>[c.A.pts, c.B.pts])")
        ax = cols[0][0][0][0]; bx = cols[0][1][0][0]
        for (p0, p1) in (((ax-1.2, 0), (bx+1.0, 3)), ((ax+1.0, -6), (bx-1.0, -4))):   # past the rails, then short of them
            s0 = await scr(*p0); s1 = await scr(*p1)
            await pg.mouse.move(*s0); await pg.mouse.down(); await pg.mouse.move(*s1, steps=6); await pg.mouse.up(); await pg.wait_for_timeout(400)
            s0w = await pg.evaluate(f"(()=>{{const v=window.__stitchStudio.view; return [({s0[0]}-{cvb['x']}-v.ox)/v.s, ({s0[1]}-{cvb['y']}-v.oy)/v.s]}})()")
            s1w = await pg.evaluate(f"(()=>{{const v=window.__stitchStudio.view; return [({s1[0]}-{cvb['x']}-v.ox)/v.s, ({s1[1]}-{cvb['y']}-v.oy)/v.s]}})()")
            r = await pg.evaluate("(()=>{const c=window.__stitchStudio.S.objects[0].columns[0]; return c.rungs[c.rungs.length-1]})()")
            def online(q):
                (x0_,y0_),(x1_,y1_) = s0w, s1w
                return abs((x1_-x0_)*(q[1]-y0_) - (y1_-y0_)*(q[0]-x0_)) / ((x1_-x0_)**2+(y1_-y0_)**2)**0.5
            print('drawn', [round(v,2) for v in s0w], [round(v,2) for v in s1w], '-> rung', [[round(v,2) for v in r['a']], [round(v,2) for v in r['b']]], 'off the drawn line:', round(online(r['a']),3), round(online(r['b']),3), 'rail x', round(ax,2), round(bx,2))
        print(errs); await b.close()
asyncio.run(main())
