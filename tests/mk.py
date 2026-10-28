import pathlib
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'dist' / 'index.html').as_uri()
import asyncio, json, sys
from playwright.async_api import async_playwright
async def main(kind, out):
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(APP_URL); await pg.wait_for_timeout(1200)
        if kind=='sample':
            await pg.click('#sampleBtn')
        elif kind.endswith('.svg'):
            await pg.set_input_files('#fileIn', kind)
        else:
            text, h, bold = kind.split('|'); 
            await pg.click('#leftTabs [data-tab=text]')
            await pg.fill('#txt', text)
            await pg.evaluate(f"document.getElementById('txtH').value={h}; document.getElementById('txtH').dispatchEvent(new Event('input'))")
            isb = await pg.evaluate("document.getElementById('boldBtn').getAttribute('aria-pressed')==='true'")
            if (bold=='1') != isb: await pg.click('#boldBtn')
            await pg.click('#addTextBtn')
        await pg.wait_for_timeout(1500)
        await pg.wait_for_function("document.getElementById('busy').hidden", timeout=90000)
        await pg.wait_for_timeout(400)
        A = await pg.evaluate("window.__stitchStudio.assembled()")
        objs = await pg.evaluate("window.__stitchStudio.S.objects.map(o=>[o.name,o.type,o.why])")
        json.dump(A, open(out,'w'))
        print(objs); print((await pg.inner_text('#stats')).replace('\n',' | ')); print(errs)
        await b.close()
asyncio.run(main(sys.argv[1], sys.argv[2]))
