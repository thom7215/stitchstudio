import pathlib
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'dist' / 'index.html').as_uri()
import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
        await pg.goto(APP_URL); await pg.wait_for_timeout(1200)
        await pg.click('#leftTabs [data-tab=hoop]')
        shots = [('brother','br-sa444',False),('janome','jn-re20',False),('viking','hv-majestic',False),('bernina','bernina-large-oval',False),('bernina','bernina-clamp',False),('bernette','bt-snap-m',False),('commercial','cm-r150',False),('brother','br-sa444',True)]
        for i,(br,hid,turn) in enumerate(shots):
            await pg.select_option('#brandSel', br); await pg.wait_for_timeout(200)
            await pg.select_option('#hoopSel', hid)
            if turn != await pg.is_checked('#hoopTurn'): await pg.click('#hoopTurn')
            await pg.wait_for_timeout(400)
            await pg.locator('#cv, canvas').first.screenshot(path=f'tests/out/hp{i}.png')
        print('machine', await pg.evaluate("window.__stitchStudio.ui.machine"))
        # vp3 export of sample
        await pg.click('#leftTabs [data-tab=art]'); await pg.click('#sampleBtn'); await pg.wait_for_timeout(2500)
        A = await pg.evaluate("(()=>{const a=window.__stitchStudio.assembled(); return a})()")
        json.dump(A, open('tests/out/a_vp3.json','w'))
        print(errs); await b.close()
asyncio.run(main())
