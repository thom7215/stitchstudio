import asyncio, pathlib, random, sys
from playwright.async_api import async_playwright
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'index.html').as_uri()
async def run(seed):
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; last=['start']
        pg.on('pageerror', lambda e: errs.append((last[0], str(e)[:400])))
        pg.on('console', lambda m: errs.append((last[0], m.text[:400])) if m.type=='error' else None)
        await pg.goto(APP_URL); await pg.wait_for_timeout(1000); await pg.evaluate("localStorage.clear()")
        await pg.click('#leftTabs [data-tab=text]'); await pg.fill('#txt', ['Ob','dog','A8'][seed%3])
        await pg.evaluate("txtH.value=45; txtH.dispatchEvent(new Event('input'))")
        await pg.click('#addTextBtn'); await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000)
        await pg.click('#zoomFit'); await pg.wait_for_timeout(300)
        cvb = await pg.locator('#cv').bounding_box()
        async def scr(x,y):
            sx, sy = await pg.evaluate(f"window.__stitchStudio.toScreen({x},{y})"); return cvb['x']+sx, cvb['y']+sy
        random.seed(seed)
        objs = await pg.evaluate("window.__stitchStudio.S.objects.map(o=>({id:o.id,rings:o.rings}))")
        for i in range(260):
            o = random.choice(objs)
            ring = random.choice(o['rings']); q = random.choice(ring)
            r = random.random()
            try:
                if r < 0.06:
                    last[0]=f'select+manual {i}'
                    await pg.evaluate(f"(()=>{{window.__stitchStudio.ui.sel=new Set([{o['id']}]);}})()"); x,y = await scr(*q); await pg.mouse.click(x,y); await pg.wait_for_timeout(100)
                    await pg.click('#rightTabs [data-tab=stitch]')
                    if await pg.locator('#quickDraw').count(): await pg.click('#quickDraw')
                elif r < 0.10:
                    last[0]=f'border tool {i}'
                    await pg.click('#rightTabs [data-tab=borders]')
                    bt = pg.locator('#inspector [data-rtab=borders] button:visible').first
                    if await bt.count(): await bt.click(timeout=800)
                elif r < 0.45:
                    last[0]=f'click near edge {i}'
                    x,y = await scr(q[0]+random.uniform(-1.5,1.5), q[1]+random.uniform(-1.5,1.5))
                    await pg.mouse.click(x,y, button='right' if random.random()<0.08 else 'left', click_count=2 if random.random()<0.08 else 1)
                elif r < 0.65:
                    last[0]=f'drag {i}'
                    x,y = await scr(*q); await pg.mouse.move(x,y); await pg.mouse.down()
                    await pg.mouse.move(x+random.uniform(-60,60), y+random.uniform(-60,60), steps=5); await pg.mouse.up()
                elif r < 0.8:
                    k = random.choice(['Tab','Tab','Enter','Escape','Delete','Backspace','Control+z','Control+y','ArrowLeft','ArrowUp','Shift+Tab','r'])
                    last[0]=f'key {k} {i}'; await pg.keyboard.press(k)
                else:
                    btns = await pg.locator('#inspector button:visible, .drawbar button:visible').all()
                    if btns:
                        bt = random.choice(btns); last[0]=f'button {(await bt.inner_text())[:30]!r} {i}'; await bt.click(timeout=800)
            except Exception: pass
            if i % 40 == 0: await pg.wait_for_timeout(400)
        await pg.wait_for_timeout(1500)
        st = await pg.evaluate("window.__stitchStudio.S.objects.map(o=>[o.name.split(' ')[0], o.type, o.params.satinDir, (o.columns||[]).length, (o.borders||[]).length])")
        await b.close()
        return errs, st
async def main():
    for seed in [1,2,3,4]:
        errs, st = await run(seed)
        print('seed', seed, 'state', st)
        for e in errs[:6]: print('   ', e)
asyncio.run(main())
