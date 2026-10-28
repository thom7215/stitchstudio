import pathlib
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'dist' / 'index.html').as_uri()
import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]
        pg.on('console', lambda m: errs.append(m.type+': '+m.text) if m.type in ('error','warning') else None)
        pg.on('pageerror', lambda e: errs.append('PAGEERROR '+str(e)))
        await pg.goto(APP_URL)
        await pg.wait_for_timeout(4000)
        await pg.screenshot(path='tests/out/s1.png')
        print(await pg.inner_text('#stats'))
        print(await pg.inner_text('#layers'))
        print('\n'.join(errs[:20]))
        await b.close()
asyncio.run(main())
