# imported artwork is not digitized; the sample patch still is
import asyncio, pathlib
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parents[1]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto((ROOT/'index.html').as_uri()); await pg.wait_for_timeout(800)
        await pg.set_input_files('#fileIn', str(ROOT/'tests'/'messy.svg')); await pg.wait_for_timeout(500)
        await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000)
        T = "window.__stitchStudio.S.objects.map(o => o.type)"
        print('imported types:', await pg.evaluate(T), 'stitches:', await pg.evaluate("window.__stitchStudio.assembled().stitches"))
        await pg.click('#rightTabs [data-tab=objects]'); await pg.locator('#objList li.group').nth(0).locator('[data-tw]').click()
        await pg.locator('#objList li.member').nth(0).click(); await pg.click('#rightTabs [data-tab=stitch]')
        print('suggestion shown:', await pg.locator('#useRec').count() > 0)
        await pg.click('#inspector [data-type=fill]'); await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000); await pg.wait_for_timeout(300)
        print('after picking Fill for one:', await pg.evaluate(T), 'stitches:', await pg.evaluate("window.__stitchStudio.assembled().stitches"))
        print(errs); await b.close()
asyncio.run(main())
