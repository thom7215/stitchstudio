import asyncio, pathlib
from playwright.async_api import async_playwright
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'index.html').as_uri()
def abc(l): return sorted(l, key=lambda x: x.lower()) == l or sorted(l, key=str.casefold)==l
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(APP_URL); await pg.wait_for_timeout(900)
        await pg.click('#leftTabs [data-tab=text]') if await pg.locator('#leftTabs [data-tab=text]').count() else None
        groups = await pg.evaluate("""(()=>{const out=[];let cur=null;for(const el of document.querySelectorAll('#fontList > *')){if(el.classList.contains('grp')){cur=[];out.push(cur)}else cur.push(el.querySelector('small').textContent)}return out})()""")
        print('stitch studio groups sorted:', [abc(g) for g in groups], [g[:4] for g in groups])
        await pg.click('#modeSeg [data-mode=font]'); await pg.wait_for_timeout(600)
        names = await pg.evaluate("[...document.querySelectorAll('#sfSrcList small')].map(s=>s.textContent)")
        print('traced-from sorted:', abc(names), len(names), names[:5])
        print('sample shown in its font:', await pg.evaluate("(()=>{const b=document.querySelector('#sfSrcList button');return b.querySelector('span').textContent+' / '+b.style.fontFamily})()"))
        await pg.fill('#sfSrcSearch', 'an'); await pg.wait_for_timeout(100)
        print('search an:', await pg.evaluate("[...document.querySelectorAll('#sfSrcList small')].map(s=>s.textContent)"))
        await pg.click('#sfSrcList button[data-font]'); 
        print('name box:', await pg.input_value('#sfName'), '| src:', await pg.input_value('#sfSrc'))
        await pg.click('#sfCreate'); await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000); await pg.wait_for_timeout(400)
        await pg.click('#sfNewBtn'); await pg.click('#sfSrcList button[data-font]'); await pg.click('#sfCreate')
        await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000); await pg.wait_for_timeout(400)
        dn = await pg.evaluate("[...document.querySelectorAll('#sfSel small')].map(s=>s.textContent)")
        print('digitized list:', dn, abc(dn), 'selected:', await pg.evaluate("document.querySelector('#sfSel [aria-selected=true] small').textContent"))
        await pg.click('#sfSel button[data-font]'); await pg.wait_for_timeout(400)
        print('after click selected:', await pg.evaluate("document.querySelector('#sfSel [aria-selected=true] small').textContent"))
        await pg.screenshot(path='/tmp/fontstudio.png')
        print(errs); await b.close()
asyncio.run(main())
