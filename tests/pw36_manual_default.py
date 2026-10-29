import asyncio, pathlib
from playwright.async_api import async_playwright
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'index.html').as_uri()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(APP_URL); await pg.wait_for_timeout(1000)
        await pg.click('#leftTabs [data-tab=text]'); await pg.fill('#txt','Hi'); await pg.click('#addTextBtn')
        await pg.wait_for_function("document.getElementById('busy').hidden"); await pg.wait_for_timeout(600)
        O = "window.__stitchStudio.S.objects.map(o=>o.name.split(' ')[0]+':'+o.type+'/'+o.params.satinDir)"
        print('auto-digitized:', await pg.evaluate(O))
        # pick one letter, make it fill, then choose Satin yourself
        await pg.click('#rightTabs [data-tab=order]'); await pg.click('#layers li:nth-child(1)'); await pg.click('#rightTabs [data-tab=stitch]')
        await pg.click('#inspector [data-type=fill]'); await pg.wait_for_timeout(300)
        await pg.click('#inspector [data-type=satin]'); await pg.wait_for_timeout(500)
        print('after picking Satin:', await pg.evaluate(O), 'tool', await pg.evaluate("window.__stitchStudio.ui.tool"))
        print('label text in row:', repr(await pg.evaluate("document.querySelector('#inspector [data-param=satinDir]').closest('.optrow').innerText")))
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
        # clicking Satin again keeps whatever was chosen
        await pg.click('#inspector [data-param=satinDir] [data-val=follow]'); await pg.wait_for_timeout(300)
        await pg.click('#inspector [data-type=satin]'); await pg.wait_for_timeout(300)
        print('Satin clicked again after choosing Automatic:', await pg.evaluate(O))
        await pg.screenshot(path='tests/out/manual_default.png', clip={'x':1110,'y':300,'width':330,'height':330})
        print(errs); await b.close()
asyncio.run(main())
