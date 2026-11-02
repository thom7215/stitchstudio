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
        L = "[...document.querySelectorAll('.guides.cols li')].map(e=>e.querySelector('.gnum').textContent+(e.querySelector('.revtag')?'⇄':''))"
        stat = """(()=>{const A=window.__stitchStudio.assembled();let mv=0,jl=0;for(let i=1;i<A.X.length;i++){if(A.C[i]===1||A.C[i]===2){}}
          const t=A.C.filter(c=>c===2).length, j=A.C.filter(c=>c===1).length; const R=window.__stitchStudio.results(); const r=Array.isArray(R)?R[0]:(R.get?[...R.values()][0]:Object.values(R)[0]);
          const segs=(r&&r.segs)||[]; const ends=segs.map(q=>[q.pts[0],q.pts[q.pts.length-1]].map(p=>p.map(v=>Math.round(v)).join(',')).join('>'));
          let gap=0; for(let i=1;i<segs.length;i++){const a=segs[i-1].pts[segs[i-1].pts.length-1], b=segs[i].pts[0]; gap+=Math.hypot(a[0]-b[0],a[1]-b[1]);}
          return {stitches:A.stitches, trims:t, jumps:j, moveBetween: Math.round(gap*10)/10, ends}})()"""
        print('own order:', await pg.evaluate(L), await pg.evaluate(stat))
        await pg.check('#inspector input[data-param=autoOrder]'); await pg.wait_for_timeout(800)
        print('best order:', await pg.evaluate(L), await pg.evaluate(stat), 'drag/up buttons:', await pg.locator('.guides.cols [data-c=up]').count())
        print('numbers kept:', await pg.evaluate("window.__stitchStudio.S.objects[0].columns.map(c=>c.n)"))
        await pg.screenshot(path='/tmp/bestorder.png')
        await pg.uncheck('#inspector input[data-param=autoOrder]'); await pg.wait_for_timeout(600)
        print('off again:', await pg.evaluate(L), await pg.evaluate(stat))
        # reverse a column by hand while best sew order is on: its order is kept, it turns off, that column flips
        await pg.check('#inspector input[data-param=autoOrder]'); await pg.wait_for_timeout(700)
        before = await pg.evaluate(stat)
        await pg.locator('.guides.cols li').nth(2).locator('[data-c=rev]').click(); await pg.wait_for_timeout(700)
        after = await pg.evaluate(stat)
        print('reverse with best order on -> auto:', await pg.is_checked('#inspector input[data-param=autoOrder]'), await pg.evaluate(L), 'order kept:', before['ends'][:2] == after['ends'][:2], 'last flipped:', before['ends'][2], '->', after['ends'][2], before['ends'], after['ends'])
        await pg.locator('.guides.cols li').nth(0).locator('[data-c=rev]').click(); await pg.wait_for_timeout(600)
        print('manual reverse of first:', (await pg.evaluate(stat))['ends'][0])
        await pg.locator('.guides.cols li').nth(1).locator('.gnm').click(); await pg.wait_for_timeout(300); await pg.screenshot(path='/tmp/arrows.png'); await pg.mouse.move(700,450); [await pg.mouse.wheel(0,-300) for _ in range(4)]; await pg.wait_for_timeout(500); await pg.screenshot(path='/tmp/arrows2.png')
        print(errs); await b.close()
asyncio.run(main())
