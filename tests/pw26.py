import asyncio, pathlib
from playwright.async_api import async_playwright
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'index.html').as_uri()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
        await pg.goto(APP_URL); await pg.wait_for_timeout(1200)
        await pg.evaluate("localStorage.clear()")
        await pg.click('#leftTabs [data-tab=text]')
        print('one line disabled:', await pg.evaluate("[txtLs.disabled, txtAlign.querySelector('button').disabled]"))
        await pg.fill('#txt','WIDE LINE\nHI')
        await pg.click('#addTextBtn'); await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000); await pg.wait_for_timeout(800)
        O="window.__stitchStudio.S.objects"
        q = """(()=>{const L=window.__stitchStudio.S.objects; const bb=(o)=>{const xs=o.rings.flat().map(p=>p[0]),ys=o.rings.flat().map(p=>p[1]);return [Math.min(...xs),Math.max(...xs),Math.min(...ys),Math.max(...ys)]};
          const all=L.map(bb); const W=[Math.min(...all.map(a=>a[0])),Math.max(...all.map(a=>a[1]))]; const hi=L.filter(o=>/^[HI] /.test(o.name)&&o.text.letter>8).map(bb);
          return {wordX:W.map(v=>+v.toFixed(1)), secondLineX:[+Math.min(...hi.map(a=>a[0])).toFixed(1), +Math.max(...hi.map(a=>a[1])).toFixed(1)], line2top:+Math.min(...hi.map(a=>a[2])).toFixed(1), n:L.length}})()"""
        print('centre', await pg.evaluate(q))
        for a in ['left','right']:
            await pg.click(f'#txtAlign [data-align={a}]'); await pg.wait_for_timeout(1500)
            print(a, await pg.evaluate(q))
        await pg.evaluate("txtLs.value=1.8; txtLs.dispatchEvent(new Event('input'))"); await pg.wait_for_timeout(1500)
        print('spacing 1.8', await pg.evaluate(q), await pg.inner_text('#txtLso'))
        await pg.screenshot(path='tests/out/align.png')
        print(errs); await b.close()
asyncio.run(main())
