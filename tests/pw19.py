import pathlib
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'dist' / 'index.html').as_uri()
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
        await pg.goto(APP_URL); await pg.wait_for_timeout(1500)
        await pg.click('#sampleBtn'); await pg.wait_for_timeout(2500)
        await pg.select_option('#brandSel','bernina'); await pg.wait_for_timeout(600)
        print('hoop:', await pg.input_value('#hoopSel'), '| options:', [o.strip() for o in await pg.locator('#hoopSel option').all_inner_texts()])
        print('note:', await pg.inner_text('#hoopNote'))
        print('stats:', (await pg.inner_text('#stats')).split('\n')[-1])
        await pg.select_option('#hoopSel','bernina-small'); await pg.wait_for_timeout(500)
        print('small:', (await pg.inner_text('#stats')).split('\n')[-2:])
        await pg.select_option('#hoopSel','bernina-large-oval'); await pg.wait_for_timeout(500)
        await pg.screenshot(path='tests/out/hoop1.png')
        await pg.check('#hoopTurn'); await pg.wait_for_timeout(500)
        await pg.screenshot(path='tests/out/hoop2.png')
        await pg.click('#exportBtn'); await pg.wait_for_timeout(300)
        print('export machine:', await pg.evaluate("document.querySelector('#machines input:checked').value"))
        await pg.keyboard.press('Escape')
        await pg.keyboard.press('Control+z'); await pg.wait_for_timeout(400)
        print('undo turn:', await pg.is_checked('#hoopTurn'))
        print(errs); await b.close()
asyncio.run(main())
