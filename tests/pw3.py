import pathlib
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'dist' / 'index.html').as_uri()
import asyncio, time
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]
        pg.on('pageerror', lambda e: errs.append('PAGEERROR '+str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
        await pg.goto(APP_URL)
        await pg.wait_for_timeout(3000)
        await pg.click('#clearBtn')
        await pg.set_input_files('#fileIn','tests/messy.svg')
        await pg.wait_for_timeout(2500)
        print(await pg.inner_text('#toast'))
        print((await pg.inner_text('#layers')).replace('⋮⋮\n','').replace('\n',' | '))
        await pg.screenshot(path='tests/out/s5.png')
        # long text timing
        await pg.click('#clearBtn')
        await pg.fill('#txt','The quick brown fox jumps over\nthe lazy dog 0123456789')
        await pg.evaluate("document.getElementById('txtH').value=7; document.getElementById('txtH').dispatchEvent(new Event('input'))")
        t=time.time()
        await pg.click('#addTextBtn')
        await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000)
        print('long text secs', round(time.time()-t,2))
        print(await pg.inner_text('#stats'))
        await pg.click('#viewSeg [data-v=stitch]')
        await pg.screenshot(path='tests/out/s6.png')
        # drag move + undo
        box = await pg.locator('#cv').bounding_box()
        cx, cy = box['x']+box['width']/2, box['y']+box['height']/2
        await pg.keyboard.press('Escape')
        print('\n'.join(errs))
        await b.close()
asyncio.run(main())
