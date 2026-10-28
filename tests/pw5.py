import pathlib
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'dist' / 'index.html').as_uri()
import asyncio
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
        await pg.fill('#txt','S')
        await pg.evaluate("document.getElementById('txtH').value=40; document.getElementById('txtH').dispatchEvent(new Event('input'))")
        await pg.click('#addTextBtn')
        await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000)
        await pg.click('#zoomFit'); await pg.wait_for_timeout(300)
        print('type:', (await pg.inner_text('#inspector'))[:200].replace('\n',' | '))
        # make it satin if fill
        await pg.click('#inspector [data-type=satin]'); await pg.wait_for_timeout(500)
        await pg.click('#inspector [data-param=satinDir] [data-val=guides]'); await pg.wait_for_timeout(1500)
        await pg.screenshot(path='tests/out/g1.png')
        print(await pg.inner_text('.guidebox'))
        # world->screen helper
        w2s = "([x,y])=>{const r=document.getElementById('cv').getBoundingClientRect();return null}"
        # remove all paths and draw our own via clicks
        await pg.click('#clearGuides'); await pg.wait_for_timeout(500)
        box = await pg.locator('#cv').bounding_box()
        cx, cy = box['x']+box['width']/2, box['y']+box['height']/2
        # S shape approx: scale ~ fit; draw roughly along an S
        pts=[(60,-120),(0,-140),(-60,-110),(-40,-30),(40,20),(60,100),(0,135),(-65,110)]
        for (x,y) in pts:
            await pg.mouse.click(cx+x, cy+y); await pg.wait_for_timeout(60)
        await pg.screenshot(path='tests/out/g2.png')
        await pg.keyboard.press('Enter'); await pg.wait_for_timeout(1200)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        print(await pg.inner_text('.guidebox'))
        # direction lines
        await pg.click('#dirBtn')
        await pg.mouse.move(cx-20, cy-20); await pg.mouse.down(); await pg.mouse.move(cx+15, cy+25, steps=4); await pg.mouse.up()
        await pg.wait_for_timeout(300)
        await pg.keyboard.press('Escape')
        # drag a dot
        await pg.mouse.move(cx+60, cy+100); await pg.mouse.down(); await pg.mouse.move(cx+70, cy+90, steps=4); await pg.mouse.up()
        await pg.wait_for_timeout(1500)
        await pg.click('#viewSeg [data-v=stitch]'); await pg.wait_for_timeout(500)
        await pg.screenshot(path='tests/out/g3.png')
        print(await pg.inner_text('#stats'))
        print('warns:', await pg.locator('.warn').all_inner_texts())
        print('\n'.join(errs))
        await b.close()
asyncio.run(main())
