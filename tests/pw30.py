import asyncio, pathlib
from playwright.async_api import async_playwright
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'index.html').as_uri()
BB = "(()=>{let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const o of window.__stitchStudio.S.objects)for(const r of o.rings)for(const [x,y] of r){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}return [+(x1-x0).toFixed(2), +(y1-y0).toFixed(2)]})()"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
        await pg.goto(APP_URL); await pg.wait_for_timeout(1200)
        await pg.evaluate("localStorage.clear()")
        print('steppers in text tab:', await pg.evaluate("document.querySelectorAll('[data-ltab=text] .stepper').length"), 'simRange has one:', await pg.evaluate("!!document.querySelector('#simRange').closest('.rangewrap')"))
        await pg.click('#leftTabs [data-tab=text]'); await pg.fill('#txt','AB\nCD')
        await pg.click('#addTextBtn'); await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000); await pg.wait_for_timeout(800)
        print('size at 12 mm:', await pg.evaluate(BB), await pg.inner_text('#txtHo'))
        # corner-drag the word bigger
        cvb = await pg.locator('#cv').bounding_box()
        bb = await pg.evaluate("(()=>{let x1=-1e9,y1=-1e9;for(const o of window.__stitchStudio.S.objects)for(const r of o.rings)for(const [x,y] of r){x1=Math.max(x1,x);y1=Math.max(y1,y)}return [x1,y1]})()")
        sx,sy = await pg.evaluate(f"window.__stitchStudio.toScreen({bb[0]},{bb[1]})")
        found=None
        for d in range(0,30,2):
            x,y=cvb['x']+sx+d,cvb['y']+sy+d; await pg.mouse.move(x,y); await pg.wait_for_timeout(30)
            if 'resize' in await pg.evaluate("cv.style.cursor"): found=(x,y); break
        await pg.mouse.down(); await pg.mouse.move(found[0]+45,found[1]+45,steps=8); await pg.mouse.up(); await pg.wait_for_timeout(2500)
        big = await pg.evaluate(BB)
        print('after resize:', big, 'form says', await pg.inner_text('#txtHo'))
        # line spacing up one step with the arrow
        up = pg.locator('[data-ltab=text] #txtLs').locator('xpath=..').locator('.stepper [data-dir="1"]')
        await up.click(); await pg.wait_for_timeout(1500)
        print('line spacing', await pg.inner_text('#txtLso'), 'size', await pg.evaluate(BB), '(width should match', big[0], ')')
        # inspector slider arrows: pick a letter, satin spacing down one step
        await pg.click('#rightTabs [data-tab=stitch]')
        n = await pg.evaluate("document.querySelectorAll('#inspector .stepper').length")
        sp0 = await pg.evaluate("document.querySelector('#inspector [data-param=spacing]')?.value")
        await pg.locator('#inspector [data-param=spacing]').locator('xpath=..').locator('[data-dir="-1"]').click(); await pg.wait_for_timeout(800)
        print('inspector steppers', n, 'spacing', sp0, '->', await pg.evaluate("window.__stitchStudio.S.objects[0].params.spacing"), 'output', await pg.evaluate("document.querySelector('#inspector [data-param=spacing]').closest('.angle').querySelector('output').textContent"))
        await pg.screenshot(path='tests/out/steppers.png')
        print(errs); await b.close()
asyncio.run(main())
