# EXP files open as their colour blocks, sew their original stitches and can be traced into shapes
import asyncio, pathlib
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parents[1]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto((ROOT/'index.html').as_uri()); await pg.wait_for_timeout(800)
        await pg.set_input_files('#fileIn', str(ROOT/'tests'/'sample.exp')); await pg.wait_for_timeout(600)
        await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000); await pg.wait_for_timeout(300)
        info = "(() => { const st = window.__stitchStudio; return { objs: st.S.objects.map(o => o.type + ':' + o.name), stitches: st.assembled().stitches, trims: st.assembled().C.filter(c => c === 2).length, colours: st.assembled().colors.length }; })()"
        print('imported:', await pg.evaluate(info))
        await pg.screenshot(path='/tmp/exp1.png')
        # select colour 4 (the text) and look at the Stitch tab
        await pg.click('#rightTabs [data-tab=objects]'); await pg.locator('#objList li.group [data-tw]').click()
        await pg.locator('#objList li.member').nth(0).click(); await pg.click('#rightTabs [data-tab=stitch]'); await pg.wait_for_timeout(200)
        print('types offered:', await pg.evaluate("[...document.querySelectorAll('#inspector [data-type]')].map(b => b.dataset.type)"), 'shape button:', await pg.locator('#expShapeBtn').count())
        await pg.click('#expShapeBtn'); await pg.wait_for_timeout(500); await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000)
        print('after turning colour 1 into a shape:', await pg.evaluate("window.__stitchStudio.S.objects.map(o => o.kind + '/' + o.type + ':' + o.name + (o.rings ? ' rings ' + o.rings.length : ''))"))
        await pg.click('#inspector [data-type=fill]'); await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000); await pg.wait_for_timeout(300)
        print('re-digitized as fill:', await pg.evaluate(info))
        await pg.screenshot(path='/tmp/exp2.png')
        print(errs); await b.close()
asyncio.run(main())
