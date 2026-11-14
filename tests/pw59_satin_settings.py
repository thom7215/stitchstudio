# satin settings: underlay type, extra pull %, short stitch spacing and depths
import asyncio, pathlib
from playwright.async_api import async_playwright
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'index.html').as_uri()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':1000})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(APP_URL); await pg.wait_for_timeout(800)
        await pg.click('#leftTabs [data-tab=text]'); await pg.fill('#txt', 'O')
        await pg.evaluate("txtH.value=40; txtH.dispatchEvent(new Event('input'))")
        await pg.click('#addTextBtn'); await pg.wait_for_function("document.getElementById('busy').hidden"); await pg.wait_for_timeout(300)
        await pg.click('#rightTabs [data-tab=stitch]')
        await pg.click('#inspector [data-val=follow]') if await pg.locator('#inspector [data-val=follow]').count() else None
        await pg.evaluate("(()=>{const st=window.__stitchStudio; for (const o of st.S.objects) { o.params.satinDir='follow'; o.ver++; } })()")
        await pg.click('#rightTabs [data-tab=objects]'); await pg.click('#objAll'); await pg.click('#rightTabs [data-tab=stitch]'); await pg.wait_for_timeout(200)
        await pg.wait_for_function("document.getElementById('busy').hidden"); await pg.wait_for_timeout(300)
        n = "window.__stitchStudio.assembled().stitches"
        await pg.click('#inspector details.more summary'); await pg.wait_for_timeout(150)
        print('underlay buttons:', await pg.evaluate("[...document.querySelectorAll('[data-param=underlayMode] button')].map(b=>b.textContent + (b.getAttribute('aria-pressed')==='true'?'*':''))"))
        base = await pg.evaluate(n); print('auto underlay stitches', base)
        for mode in ('center', 'edge', 'edgezig', 'none'):
            await pg.click(f'[data-param=underlayMode] [data-val={mode}]'); await pg.wait_for_function("document.getElementById('busy').hidden"); await pg.wait_for_timeout(200)
            if not await pg.locator('#inspector details.more[open]').count(): await pg.click('#inspector details.more summary')
            print(mode, await pg.evaluate(n), await pg.evaluate("JSON.stringify([window.__stitchStudio.S.objects[0].params.underlay, window.__stitchStudio.S.objects[0].params.underlayType])"))
        await pg.click('[data-param=underlayMode] [data-val=auto]'); await pg.wait_for_function("document.getElementById('busy').hidden"); await pg.wait_for_timeout(200)
        if not await pg.locator('#inspector details.more[open]').count(): await pg.click('#inspector details.more summary')
        w = "(()=>{const st=window.__stitchStudio; const A=st.assembled(); let x0=1e9,x1=-1e9; for(let i=0;i<A.X.length;i++) if(A.C[i]===0){x0=Math.min(x0,A.X[i]);x1=Math.max(x1,A.X[i]);} return (x1-x0).toFixed(2)})()"
        print('width before extra pull', await pg.evaluate(w))
        await pg.fill('[data-param=pullPct]', '15'); await pg.dispatch_event('[data-param=pullPct]', 'change'); await pg.wait_for_function("document.getElementById('busy').hidden"); await pg.wait_for_timeout(200)
        print('width with 15%', await pg.evaluate(w), await pg.evaluate("window.__stitchStudio.S.objects[0].params.pullPct"))
        await pg.fill('#inspector [data-param=shortDepths]', '30 15'); await pg.dispatch_event('#inspector [data-param=shortDepths]', 'change'); await pg.wait_for_timeout(500)
        print('depths saved:', await pg.evaluate("window.__stitchStudio.S.objects[0].params.shortDepths"))
        await pg.fill('#inspector [data-param=shortDepths]', 'abc'); await pg.dispatch_event('#inspector [data-param=shortDepths]', 'change'); await pg.wait_for_timeout(300)
        print('bad input:', repr(await pg.evaluate("window.__stitchStudio.S.objects[0].params.shortDepths")))
        if not await pg.locator('#inspector details.more[open]').count(): await pg.click('#inspector details.more summary')
        await pg.locator('#inspector details.more').scroll_into_view_if_needed(); await pg.screenshot(path='/tmp/sat_settings.png')
        print(errs); await b.close()
asyncio.run(main())
