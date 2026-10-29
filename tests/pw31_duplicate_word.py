import asyncio, pathlib
from playwright.async_api import async_playwright
URL = (pathlib.Path('index.html').resolve()).as_uri()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1000)
        await pg.click('#leftTabs [data-tab=text]'); await pg.fill('#txt','AB')
        await pg.click('#addTextBtn'); await pg.wait_for_function("document.getElementById('busy').hidden"); await pg.wait_for_timeout(500)
        await pg.click('#rightTabs [data-tab=arrange]'); await pg.click('#dupBtn'); await pg.wait_for_timeout(800)
        names = "window.__stitchStudio.S.objects.map(o=>o.name.split('  ')[0]+'@'+o.text.cx.toFixed(0))"
        print('after duplicate:', await pg.evaluate(names))
        await pg.click('#leftTabs [data-tab=text]'); await pg.fill('#txt','AC'); await pg.dispatch_event('#txt','input'); await pg.wait_for_timeout(1500)
        print('after editing the copy to AC:', await pg.evaluate(names), errs)
        await b.close()
asyncio.run(main())
