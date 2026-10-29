import asyncio, pathlib
from playwright.async_api import async_playwright
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'index.html').as_uri()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(APP_URL); await pg.wait_for_timeout(1000)
        await pg.click('#leftTabs [data-tab=art]'); await pg.click('#sampleBtn'); await pg.wait_for_timeout(1500)
        V = "JSON.stringify([+window.__stitchStudio.view.ox.toFixed(1), +window.__stitchStudio.view.oy.toFixed(1), +window.__stitchStudio.view.s.toFixed(2)])"
        T = "(()=>{const f=(id)=>{const b=document.getElementById(id), t=b.firstElementChild; return {off:b.classList.contains('off'), pos:t.style[id==='hScroll'?'left':'top'], size:t.style[id==='hScroll'?'width':'height']}}; return JSON.stringify([f('hScroll'),f('vScroll')])})()"
        print('fit view', await pg.evaluate(V), await pg.evaluate(T))
        for _ in range(4): await pg.click('#zoomIn')
        await pg.wait_for_timeout(300); print('zoomed in', await pg.evaluate(V), await pg.evaluate(T))
        th = await pg.locator('#hScroll .thumb').bounding_box()
        await pg.mouse.move(th['x']+th['width']/2, th['y']+th['height']/2); await pg.mouse.down(); await pg.mouse.move(th['x']+th['width']/2+120, th['y']+th['height']/2, steps=6); await pg.mouse.up(); await pg.wait_for_timeout(300)
        print('dragged h thumb right 120px', await pg.evaluate(V), await pg.evaluate(T))
        vb = await pg.locator('#vScroll').bounding_box(); vt = await pg.locator('#vScroll .thumb').bounding_box()
        await pg.mouse.click(vb['x']+vb['width']/2, vt['y']+vt['height']+20 if vt['y']+vt['height']+20 < vb['y']+vb['height'] else vb['y']+5); await pg.wait_for_timeout(300)
        print('clicked v track', await pg.evaluate(V), await pg.evaluate(T))
        await pg.screenshot(path='tests/out/scroll.png')
        print(errs); await b.close()
asyncio.run(main())
