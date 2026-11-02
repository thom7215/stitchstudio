import asyncio, pathlib
from playwright.async_api import async_playwright
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'index.html').as_uri()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(APP_URL); await pg.wait_for_timeout(800)
        await pg.click('#leftTabs [data-tab=text]')
        for w in ('Hi', 'Yo'):
            await pg.evaluate("document.getElementById('objNone').click()")
            await pg.fill('#txt', w); await pg.click('#addTextBtn'); await pg.wait_for_function("document.getElementById('busy').hidden"); await pg.wait_for_timeout(300)
        await pg.click('#rightTabs [data-tab=objects]'); await pg.wait_for_timeout(200)
        sel = "[...window.__stitchStudio.ui.sel].length"
        rows = lambda: pg.evaluate("[...document.querySelectorAll('#objList li')].map(l => l.querySelector('.nm').innerText + (l.classList.contains('sel') ? ' [sel]' : l.classList.contains('part') ? ' [part]' : ''))")
        print('rows:', await rows())
        await pg.locator('#objList li.group').nth(0).click(); await pg.wait_for_timeout(200)
        print('click group 1 -> selected', await pg.evaluate(sel), await rows(), 'tab:', await pg.evaluate("window.__stitchStudio.ui.rtab"))
        await pg.locator('#objList li.group').nth(0).locator('[data-tw]').click(); await pg.wait_for_timeout(200)
        print('expanded:', await rows())
        await pg.locator('#objList li.member').nth(1).click(); await pg.wait_for_timeout(200)
        print('one letter ->', await pg.evaluate(sel), await rows())
        await pg.locator('#objList li.group').nth(1).click(modifiers=['Shift']); await pg.wait_for_timeout(200)
        print('shift group 2 ->', await pg.evaluate(sel))
        await pg.click('#objAll'); print('all', await pg.evaluate(sel))
        await pg.click('#objNone'); await pg.wait_for_timeout(200); await pg.screenshot(path='/tmp/objtab0.png')
        await pg.locator('#objList li.group').nth(0).click(); await pg.wait_for_timeout(200)
        before = await pg.evaluate("(()=>{const s=window.__stitchStudio.S.objects.filter(o=>window.__stitchStudio.ui.sel.has(o.id)); const xs=s.flatMap(o=>o.rings.flat()); return [Math.max(...xs.map(p=>p[0]))-Math.min(...xs.map(p=>p[0])), Math.max(...xs.map(p=>p[1]))-Math.min(...xs.map(p=>p[1]))]})()")
        await pg.click('#fitSelBtn'); await pg.wait_for_function("document.getElementById('busy').hidden"); await pg.wait_for_timeout(300)
        after = await pg.evaluate("(()=>{const s=window.__stitchStudio.S.objects.filter(o=>window.__stitchStudio.ui.sel.has(o.id)); const xs=s.flatMap(o=>o.rings.flat()); return [Math.max(...xs.map(p=>p[0]))-Math.min(...xs.map(p=>p[0])), Math.max(...xs.map(p=>p[1]))-Math.min(...xs.map(p=>p[1]))]})()")
        print('fit selection to hoop:', [round(v,1) for v in before], '->', [round(v,1) for v in after])
        await pg.screenshot(path='/tmp/objtab.png')
        print(errs); await b.close()
asyncio.run(main())
