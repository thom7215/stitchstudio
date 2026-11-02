import asyncio, pathlib
from playwright.async_api import async_playwright
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'index.html').as_uri()
BB = "(()=>{let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const o of window.__stitchStudio.S.objects)for(const r of (o.rings.length?o.rings:o.paths.map(p=>p.pts)))for(const [x,y] of r){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}return [+(x1-x0).toFixed(2), +(y1-y0).toFixed(2), +((x0+x1)/2).toFixed(2), +((y0+y1)/2).toFixed(2)]})()"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(APP_URL); await pg.wait_for_timeout(1000)
        print('empty hoop: size boxes hidden:', await pg.evaluate("document.getElementById('dsize').hidden"))
        await pg.click('#leftTabs [data-tab=art]'); await pg.click('#sampleBtn'); await pg.wait_for_timeout(2500)
        print('boxes show:', await pg.input_value('#dsW'), 'x', await pg.input_value('#dsH'), '| design', await pg.evaluate(BB))
        await pg.fill('#dsW', '60'); await pg.press('#dsW', 'Enter'); await pg.wait_for_timeout(2500)
        print('typed width 60 (proportions locked):', await pg.input_value('#dsW'), 'x', await pg.input_value('#dsH'), '| design', await pg.evaluate(BB))
        await pg.click('#dsLock'); await pg.wait_for_timeout(100)
        await pg.fill('#dsH', '40'); await pg.press('#dsH', 'Enter'); await pg.wait_for_timeout(2500)
        print('unlocked, typed height 40:', await pg.input_value('#dsW'), 'x', await pg.input_value('#dsH'), '| design', await pg.evaluate(BB), 'lock', await pg.inner_text('#dsLock'))
        await pg.keyboard.press('Control+z'); await pg.wait_for_timeout(1500)
        print('undo:', await pg.input_value('#dsW'), 'x', await pg.input_value('#dsH'))
        await pg.screenshot(path='tests/out/design_size.png', clip={'x':290,'y':800,'width':820,'height':100})
        print(errs); await b.close()
asyncio.run(main())
