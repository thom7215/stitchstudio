import pathlib
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'dist' / 'index.html').as_uri()
import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
        await pg.goto(APP_URL); await pg.wait_for_timeout(1200)
        await pg.click('#leftTabs [data-tab=text]'); await pg.fill('#txt','HOLA')
        await pg.evaluate("document.getElementById('txtH').value=25; document.getElementById('txtH').dispatchEvent(new Event('input'))")
        await pg.click('#addTextBtn'); await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000); await pg.wait_for_timeout(800)
        O="window.__stitchStudio.S.objects"
        print('objects', await pg.evaluate(O+".map(o=>[o.name,o.type,o.rings.length])"))
        print('sel', await pg.evaluate("window.__stitchStudio.ui.sel.size"))
        cvb = await pg.locator('#cv').bounding_box()
        async def scr(x,y):
            sx, sy = await pg.evaluate(f"window.__stitchStudio.toScreen({x},{y})"); return cvb['x']+sx, cvb['y']+sy
        # click on the L (index 2): find a point inside its rings
        pt = await pg.evaluate(O+"[2].rings[0].reduce((a,q)=>a, null) || null")
        bb = await pg.evaluate("(()=>{const o="+O+"[2]; const xs=o.rings.flat().map(q=>q[0]), ys=o.rings.flat().map(q=>q[1]); return [Math.min(...xs),Math.max(...xs),Math.min(...ys),Math.max(...ys)]})()")
        # L: vertical stem near the left edge
        await pg.mouse.click(*(await scr(bb[0]+1.0, (bb[2]+bb[3])/2))); await pg.wait_for_timeout(600)
        print('sel after click', await pg.evaluate("[...window.__stitchStudio.ui.sel]"), await pg.evaluate(O+"[2].id"))
        await pg.click('#rightTabs [data-tab=stitch]')
        print('hint:', (await pg.inner_text('#inspector'))[:200].replace('\n',' | '))
        await pg.click('#inspector [data-type=satin]'); await pg.wait_for_timeout(600)
        print('dir buttons', await pg.evaluate("[...document.querySelectorAll('#inspector [data-param=satinDir] button')].map(b=>b.textContent)"))
        await pg.click('#inspector [data-param=satinDir] [data-val=columns]'); await pg.wait_for_timeout(500)
        print('tool', await pg.evaluate("window.__stitchStudio.ui.tool"), 'types', await pg.evaluate(O+".map(o=>o.type+'/'+o.params.satinDir)"))
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='tests/out/let1.png')
        # double-click selects word
        await pg.mouse.dblclick(*(await scr(bb[0]+1.0, (bb[2]+bb[3])/2))); await pg.wait_for_timeout(500)
        print('sel after dbl', await pg.evaluate("window.__stitchStudio.ui.sel.size"))
        # change size: letters kept
        await pg.click('#leftTabs [data-tab=text]')
        await pg.evaluate("document.getElementById('txtH').value=30; document.getElementById('txtH').dispatchEvent(new Event('input'))"); await pg.wait_for_timeout(1500)
        print('after size', await pg.evaluate(O+".map(o=>o.type+'/'+o.params.satinDir+'/'+o.text.height)"))
        await pg.fill('#txt','HOLAS'); await pg.dispatch_event('#txt','input'); await pg.wait_for_timeout(2000)
        print('after text', await pg.evaluate(O+".map(o=>o.name+':'+o.type+'/'+o.params.satinDir)"))
        print(errs); await b.close()
asyncio.run(main())
