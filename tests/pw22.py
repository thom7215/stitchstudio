import pathlib
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'dist' / 'index.html').as_uri()
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
        await pg.goto(APP_URL); await pg.wait_for_timeout(1200)
        await pg.click('#sampleBtn'); await pg.wait_for_timeout(2500)
        await pg.click('#rightTabs [data-tab=order]'); await pg.click('#layers li:nth-child(2)'); await pg.wait_for_timeout(300)  # Gold rim (satin line)
        await pg.click('#rightTabs [data-tab=stitch]'); await pg.wait_for_timeout(200)
        before = (await pg.inner_text('#stats')).split('\n')[1]
        await pg.check('#erLine [data-er=on]'); await pg.wait_for_timeout(1200)
        print('edge run on:', await pg.evaluate("JSON.stringify(window.__stitchStudio.S.objects[1].params.edgeRun)"), before, '->', (await pg.inner_text('#stats')).split('\n')[1])
        await pg.screenshot(path='tests/out/er1.png')
        await pg.click('#erLine [data-erk=mode] [data-v=beside]'); await pg.wait_for_timeout(800)
        await pg.check('#erLine [data-er=triple]'); await pg.wait_for_timeout(1200)
        print('beside+triple:', await pg.evaluate("JSON.stringify(window.__stitchStudio.S.objects[1].params.edgeRun)"), (await pg.inner_text('#stats')).split('\n')[1])
        A = await pg.evaluate("window.__stitchStudio.assembled()")
        import json; json.dump(A, open('tests/out/a_er.json','w'))
        # star: all-round satin border + edge run
        await pg.click('#rightTabs [data-tab=order]'); await pg.click('#layers li:nth-child(3)'); await pg.wait_for_timeout(300)
        await pg.click('#rightTabs [data-tab=stitch]')
        await pg.click('#inspector [data-param=border] [data-val=satin]'); await pg.wait_for_timeout(800)
        await pg.check('#erBorderAll [data-er=on]'); await pg.wait_for_timeout(1000)
        print('star border edge run:', await pg.evaluate("JSON.stringify(window.__stitchStudio.S.objects[2].params.edgeRun)"))
        print(errs); await b.close()
asyncio.run(main())
