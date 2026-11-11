# EXP files: separated into pieces, satin read back as editable rails and rungs, fill as a fill
import asyncio, pathlib
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parents[1]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto((ROOT/'index.html').as_uri()); await pg.wait_for_timeout(800)
        await pg.set_input_files('#fileIn', str(ROOT/'tests'/'sample.exp')); await pg.wait_for_timeout(800)
        await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000); await pg.wait_for_timeout(300)
        D = "window.__stitchStudio.S.objects.map(o => o.type + (o.columns && o.columns.length ? '[' + o.columns.length + ' cols]' : '') + ':' + o.name)"
        print('imported:', await pg.evaluate(D))
        # a satin piece: edit a rail dot, then go back to the file's stitches, then rails again
        await pg.click('#rightTabs [data-tab=objects]'); await pg.locator('#objList li.group [data-tw]').click()
        await pg.locator('#objList li.member', has_text='Colour 3').click(); await pg.click('#rightTabs [data-tab=stitch]'); await pg.wait_for_timeout(200)
        print('manual columns panel:', await pg.locator('#drawColBtn').count() == 1, 'back button:', await pg.locator('#expBackBtn').count())
        await pg.click('#expBackBtn'); await pg.wait_for_timeout(300); print('back to file stitches:', await pg.evaluate(D))
        await pg.click('#expRailsBtn'); await pg.wait_for_timeout(300); print('rails again:', await pg.evaluate(D))
        await pg.click('#rightTabs [data-tab=objects]'); await pg.click('#objAll'); await pg.click('#rightTabs [data-tab=stitch]'); await pg.wait_for_timeout(300)
        print(errs); await b.close()
asyncio.run(main())
