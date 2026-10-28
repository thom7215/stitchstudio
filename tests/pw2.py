import pathlib
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'dist' / 'index.html').as_uri()
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width':1440,'height':900}, accept_downloads=True)
        errs=[]
        pg.on('pageerror', lambda e: errs.append('PAGEERROR '+str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
        await pg.goto(APP_URL)
        await pg.wait_for_timeout(3500)
        print(await pg.inner_text('#stats'))
        # click the star (canvas centre slightly below)
        box = await pg.locator('#cv').bounding_box()
        cx, cy = box['x']+box['width']/2, box['y']+box['height']/2
        await pg.mouse.click(cx, cy+15)
        await pg.wait_for_timeout(500)
        print('INSPECTOR:', (await pg.inner_text('#inspector'))[:300].replace('\n',' | '))
        await pg.click('#inspector [data-type=satin]')
        await pg.wait_for_timeout(1200)
        await pg.screenshot(path='tests/out/s2.png')
        # stitches only view, zoom on text
        await pg.click('#viewSeg [data-v=stitch]')
        await pg.keyboard.press('Escape')
        for i in range(6): await pg.mouse.wheel(0,-120); 
        await pg.mouse.move(cx, cy-100)
        for i in range(4):
            await pg.mouse.wheel(0,-150); await pg.wait_for_timeout(50)
        await pg.wait_for_timeout(400)
        await pg.screenshot(path='tests/out/s3.png')
        # add new text
        await pg.click('#zoomFit')
        await pg.click('#textNewBtn') if await pg.is_visible('#textNewBtn') else None
        await pg.fill('#txt','Team 26')
        await pg.click('#addTextBtn')
        await pg.wait_for_timeout(1500)
        print('after text:', await pg.inner_text('#stats'))
        # export
        await pg.click('#exportBtn')
        await pg.wait_for_timeout(300)
        await pg.screenshot(path='tests/out/s4.png')
        for m in ['pes','dst','jef','exp']:
            await pg.check(f'#machines input[value={m}]', force=True)
            async with pg.expect_download() as dl:
                await pg.click('#doExport')
            d = await dl.value
            await d.save_as(f'tests/out/out.{m}')
        print('\n'.join(errs))
        await b.close()
asyncio.run(main())
