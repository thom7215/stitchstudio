import asyncio, pathlib
from playwright.async_api import async_playwright
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'index.html').as_uri()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(APP_URL); await pg.wait_for_timeout(1000)
        await pg.click('#leftTabs [data-tab=text]'); await pg.fill('#txt','O')
        await pg.evaluate("txtH.value=50; txtH.dispatchEvent(new Event('input'))")
        await pg.click('#addTextBtn'); await pg.wait_for_function("document.getElementById('busy').hidden"); await pg.wait_for_timeout(400)
        await pg.click('#zoomFit'); await pg.wait_for_timeout(300)
        await pg.click('#rightTabs [data-tab=stitch]'); await pg.click('#inspector [data-type=fill]'); await pg.click('#inspector [data-type=satin]'); await pg.wait_for_timeout(400)
        cvb = await pg.locator('#cv').bounding_box()
        async def scr(x,y):
            sx, sy = await pg.evaluate(f"window.__stitchStudio.toScreen({x},{y})"); return cvb['x']+sx, cvb['y']+sy
        rings = await pg.evaluate("window.__stitchStudio.S.objects[0].rings")
        area = lambda r: abs(sum(r[i][0]*r[(i+1)%len(r)][1]-r[(i+1)%len(r)][0]*r[i][1] for i in range(len(r))))
        rings.sort(key=lambda r: -area(r)); outer, inner = rings[0], rings[1]
        D = "(()=>{const d=window.__stitchStudio.ui.colDraft; return JSON.stringify({stage:d.stage, A:d.A.pts.length, cols:(window.__stitchStudio.S.objects[0].columns||[]).length})})()"
        # 1. clicks right next to the last dot add dots instead of finishing the rail
        q0 = outer[0]; q1 = outer[len(outer)//12]
        await pg.mouse.click(*(await scr(*q0))); await pg.wait_for_timeout(500)
        x,y = await scr(*q1); await pg.mouse.click(x,y); await pg.wait_for_timeout(500)
        await pg.mouse.click(x+5,y+3); await pg.wait_for_timeout(500)
        print('three clicks, the last 6 px from the one before:', await pg.evaluate(D))
        # 2. cursor on the inner edge: the live line jumps to it and follows it
        qi = inner[len(inner)//10]
        await pg.mouse.move(*(await scr(*qi)), steps=5); await pg.wait_for_timeout(300)
        live = await pg.evaluate("""(()=>{const S=window.__stitchStudio, d=S.ui.colDraft, o=S.S.objects[0]; const r=d.A;
            const pts=r.pts.concat([S.ui.snap||S.ui.cursor]); const modes=r.modes.concat([S.ui.railMode]); modes.length=pts.length-1;
            const P=Core.railDense({pts,modes,closed:false}, o.rings); const last=P.slice(-25);
            const onInner = last.filter(q=>Core.nearestOnRings(o.rings, q).ri===%d).length; return [P.length, onInner, last.length, !!S.ui.snap]})()""" % (await pg.evaluate("(()=>{const o=window.__stitchStudio.S.objects[0]; const a=r=>Math.abs(Core.ringArea(r)); let k=0,m=Infinity; const big=o.rings.map(a); const sorted=[...big].sort((x,y)=>y-x); return big.indexOf(sorted[1])})()")))
        print('live line: dense points', live[0], '| last 25 that lie on the inner edge:', live[1], '/', live[2], '| snapped to an edge:', live[3])
        await pg.screenshot(path='tests/out/rail_hop_live.png')
        await pg.mouse.click(*(await scr(*qi))); await pg.wait_for_timeout(500)
        # 3. double-click finishes the rail
        qj = inner[len(inner)//4]
        x,y = await scr(*qj); await pg.mouse.dblclick(x,y); await pg.wait_for_timeout(400)
        print('after a double-click:', await pg.evaluate(D))
        await pg.screenshot(path='tests/out/rail_hop.png')
        print(errs); await b.close()
asyncio.run(main())
