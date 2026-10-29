import asyncio, pathlib
from playwright.async_api import async_playwright
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'index.html').as_uri()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(APP_URL); await pg.wait_for_timeout(1000)
        await pg.click('#leftTabs [data-tab=text]'); await pg.fill('#txt','I'); await pg.click('#boldBtn')
        await pg.evaluate("txtH.value=70; txtH.dispatchEvent(new Event('input'))")
        await pg.click('#addTextBtn'); await pg.wait_for_function("document.getElementById('busy').hidden"); await pg.wait_for_timeout(600)
        await pg.click('#inspector [data-type=satin]'); await pg.wait_for_timeout(300)
        await pg.click('#inspector [data-param=satinDir] [data-val=follow]'); await pg.wait_for_timeout(1200)
        L = """(()=>{const A=window.__stitchStudio.assembled(); let mx=0; for(let i=1;i<A.X.length;i++){ if(A.C[i]||A.C[i-1]) continue; mx=Math.max(mx, Math.hypot(A.X[i]-A.X[i-1], A.Y[i]-A.Y[i-1])); } return +mx.toFixed(2)})()"""
        warn = "[...document.querySelectorAll('#inspector .warn')].map(w=>w.textContent)"
        print('default: longest stitch', await pg.evaluate(L), 'mm', await pg.evaluate(warn), 'checked', await pg.is_checked('#inspector [data-param=keepWide]'))
        await pg.check('#inspector [data-param=keepWide]'); await pg.wait_for_timeout(1500)
        print('ticked:  longest stitch', await pg.evaluate(L), 'mm', await pg.evaluate(warn), 'param', await pg.evaluate("window.__stitchStudio.S.objects[0].params.keepWide"))
        await pg.screenshot(path='tests/out/keepwide.png', clip={'x':1110,'y':330,'width':330,'height':330})
        print(errs); await b.close()
asyncio.run(main())
