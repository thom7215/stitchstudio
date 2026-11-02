import asyncio, pathlib, json
from playwright.async_api import async_playwright
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'index.html').as_uri()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width':1440,'height':900}, accept_downloads=True); pg = await ctx.new_page()
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
        await pg.goto(APP_URL); await pg.wait_for_timeout(1000); await pg.evaluate("localStorage.removeItem('ss-fonts')"); await pg.reload(); await pg.wait_for_timeout(1000)
        # something in Stitch Studio first, to check it comes back
        await pg.click('#leftTabs [data-tab=art]'); await pg.click('#sampleBtn'); await pg.wait_for_timeout(2000)
        n0 = await pg.evaluate("window.__stitchStudio.S.objects.length")
        # Font Studio
        await pg.click('#modeSeg [data-mode=font]'); await pg.wait_for_timeout(500)
        print('font mode: canvas empty', await pg.evaluate("window.__stitchStudio.S.objects.length") == 0, '| new-font form shown', await pg.locator('#sfCreate').count() == 1, '| left tabs hidden', not await pg.is_visible('#leftTabs'))
        await pg.fill('#sfName', 'Test Block'); await pg.fill('#sfCap', '25')
        await pg.click('#sfCreate'); await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000); await pg.wait_for_timeout(800)
        f = await pg.evaluate("JSON.parse(localStorage.getItem('ss-fonts'))[0]")
        print('created:', f['name'], '| characters', len(f['glyphs']), '| A width', round(f['glyphs']['A']['adv'],1), 'mm | A starts as', f['glyphs']['A']['objects'][0]['type'], f['glyphs']['A']['objects'][0]['params']['satinDir'])
        print('grid buttons', await pg.locator('#sfGlyphs button').count(), '|', await pg.inner_text('#sfCount'), '| on canvas:', await pg.evaluate("window.__stitchStudio.S.objects.map(o=>o.name)"))
        await pg.screenshot(path='tests/out/font_studio.png')
        # digitize I with rails
        await pg.click('#sfGlyphs [data-ch=I]'); await pg.wait_for_timeout(500)
        cvb = await pg.locator('#cv').bounding_box()
        async def scr(x,y):
            sx, sy = await pg.evaluate(f"window.__stitchStudio.toScreen({x},{y})"); return cvb['x']+sx, cvb['y']+sy
        rings = await pg.evaluate("window.__stitchStudio.S.objects[0].rings")
        xs=[q[0] for r in rings for q in r]; ys=[q[1] for r in rings for q in r]
        await pg.click('#rightTabs [data-tab=stitch]')
        if await pg.evaluate("window.__stitchStudio.S.objects[0].type") != 'satin': await pg.click('#inspector [data-type=satin]'); await pg.wait_for_timeout(300)
        await pg.click('#drawColBtn'); await pg.wait_for_timeout(200)
        for x in [min(xs), max(xs)]:
            for y in [min(ys)+0.5, max(ys)-0.5]: await pg.mouse.click(*(await scr(x,y))); await pg.wait_for_timeout(450)
            await pg.keyboard.press('Enter'); await pg.wait_for_timeout(300)
        await pg.click('#dbDone'); await pg.wait_for_timeout(1200)
        f = await pg.evaluate("JSON.parse(localStorage.getItem('ss-fonts'))[0]")
        print('I saved with columns:', len(f['glyphs']['I']['objects'][0]['columns']), '|', await pg.inner_text('#sfCount'), '| I button done:', await pg.evaluate("document.querySelector('#sfGlyphs [data-ch=I]').classList.contains('done')"))
        await pg.screenshot(path='tests/out/font_glyph_I.png')
        # back to Stitch Studio
        await pg.click('#modeSeg [data-mode=studio]'); await pg.wait_for_timeout(1200)
        print('back in Stitch Studio: design restored', await pg.evaluate("window.__stitchStudio.S.objects.length") == n0)
        await pg.click('#leftTabs [data-tab=text]')
        await pg.evaluate("document.getElementById('textNewBtn').click()")
        print('digitized fonts in list:', await pg.evaluate("[...document.querySelectorAll('#fontList .sfont')].map(b=>b.title)"))
        await pg.click('#fontList .sfont'); await pg.fill('#txt', 'II I')
        await pg.evaluate("txtH.value=30; txtH.dispatchEvent(new Event('input'))")
        await pg.evaluate("window.__stitchStudio.S.objects.length=0")
        await pg.click('#addTextBtn'); await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000); await pg.wait_for_timeout(1500)
        objs = await pg.evaluate("window.__stitchStudio.S.objects.map(o=>[o.name.split('  ')[0], o.type, o.params.satinDir, (o.columns||[]).length, +(Math.max(...o.rings.flat().map(q=>q[1]))-Math.min(...o.rings.flat().map(q=>q[1]))).toFixed(1)])")
        print('typed "II I" at 30 mm:', objs, '| stitches', await pg.evaluate("window.__stitchStudio.assembled().stitches"))
        await pg.screenshot(path='tests/out/font_typed.png')
        # size change rebuilds from the font
        await pg.evaluate("txtH.value=20; txtH.dispatchEvent(new Event('input'))"); await pg.wait_for_timeout(1500)
        print('at 20 mm, letter heights:', await pg.evaluate("window.__stitchStudio.S.objects.map(o=>+(Math.max(...o.rings.flat().map(q=>q[1]))-Math.min(...o.rings.flat().map(q=>q[1]))).toFixed(1))"), 'columns kept', await pg.evaluate("window.__stitchStudio.S.objects.map(o=>(o.columns||[]).length)"))
        # export
        await pg.click('#modeSeg [data-mode=font]'); await pg.wait_for_timeout(500)
        async with pg.expect_download() as dl: await pg.click('#sfExport')
        d = await dl.value; data = json.loads(open(await d.path()).read())
        print('exported', d.suggested_filename, data['app'], len(data['font']['glyphs']))
        # reload: font still there
        await pg.reload(); await pg.wait_for_timeout(1200)
        print('after reload, fonts kept:', await pg.evaluate("JSON.parse(localStorage.getItem('ss-fonts')).map(f=>f.name)"))
        print(errs); await b.close()
asyncio.run(main())
