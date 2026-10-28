import pathlib
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'dist' / 'index.html').as_uri()
# Load the app, build a design, dump the assembled stitches to JSON
import asyncio, json, sys
from playwright.async_api import async_playwright
async def run(setup_js_steps, out, svg=None, texts=()):
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(APP_URL); await pg.wait_for_timeout(1200)
        if svg: await pg.set_input_files('#fileIn', svg); await pg.wait_for_timeout(2500)
        for (t, h, font, bold) in texts:
            await pg.click('#leftTabs [data-tab=text]')
            await pg.fill('#txt', t)
            await pg.evaluate(f"document.getElementById('txtH').value={h}; document.getElementById('txtH').dispatchEvent(new Event('input'))")
            if font: await pg.evaluate(f"(()=>{{const b=[...document.querySelectorAll('#fontList button')].find(x=>x.dataset.font==={json.dumps(font)}); if(b) b.click();}})()")
            if bold != await pg.evaluate("document.getElementById('boldBtn').getAttribute('aria-pressed')==='true'"): await pg.click('#boldBtn')
            await pg.click('#addTextBtn'); await pg.wait_for_timeout(300)
            await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000)
            await pg.keyboard.press('Escape')
        await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000)
        await pg.wait_for_timeout(500)
        data = await pg.evaluate("""(()=>{const st=window.__stitchStudio; return {objs: st.S.objects.map(o=>({name:o.name,type:o.type,why:o.why,color:o.color,kind:o.kind})), stats: document.getElementById('stats').innerText}})()""")
        A = await pg.evaluate("(()=>{const st=window.__stitchStudio;return null})()")
        print(json.dumps(data['objs'], indent=0)[:3000]); print(data['stats'].replace('\n',' | '))
        print(errs)
        await b.close()
