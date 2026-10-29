import asyncio, pathlib, random, json
from playwright.async_api import async_playwright
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'index.html').as_uri()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width':1440,'height':900}, accept_downloads=True); pg = await ctx.new_page()
        errs=[]
        pg.on('pageerror', lambda e: errs.append(('pageerror', str(e)[:300])))
        pg.on('console', lambda m: errs.append(('console', m.text[:300])) if m.type=='error' else None)
        await pg.goto(APP_URL); await pg.wait_for_timeout(1000); await pg.evaluate("localStorage.clear()")
        step = lambda name: errs.append(('step', name))
        async def tab(side, t): await pg.click(f'#{side}Tabs [data-tab={t}]'); await pg.wait_for_timeout(100)
        async def busy(): await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000); await pg.wait_for_timeout(300)
        # --- SVG import
        step('svg'); await tab('left','art'); await pg.set_input_files('#fileIn', 'tests/messy.svg'); await busy(); await pg.wait_for_timeout(1500)
        step('sample'); await pg.click('#sampleBtn'); await pg.wait_for_timeout(2000)
        # --- per object: all stitch types
        n = await pg.evaluate("window.__stitchStudio.S.objects.length")
        for i in range(n):
            await pg.evaluate(f"(()=>{{const S=window.__stitchStudio.S;window.__stitchStudio.ui.sel=new Set([S.objects[{i}].id]);}})()")
            await tab('right','order'); await pg.click(f'#layers li:nth-child({i+1})'); await tab('right','stitch')
            for t in ['fill','running','skip','satin']:
                if await pg.locator(f'#inspector [data-type={t}]').count(): await pg.click(f'#inspector [data-type={t}]'); await pg.wait_for_timeout(150)
            for sel in ['#inspector [data-param=border] [data-val=satin]','#inspector [data-param=border] [data-val=running]','#inspector [data-param=curveMode] [data-val=center]','#inspector [data-param=satinDir] [data-val=follow]']:
                if await pg.locator(sel).count(): await pg.click(sel); await pg.wait_for_timeout(150)
            for _ in range(2):
                for stp in await pg.locator('#inspector .stepper button').all()[:6] if False else (await pg.locator('#inspector .stepper button').all())[:6]:
                    try: await stp.click(timeout=1000)
                    except Exception: pass
            await pg.keyboard.press('Escape')
        step('auto'); await tab('right','stitch'); await pg.keyboard.press('Control+a'); await pg.wait_for_timeout(300)
        if await pg.locator('#autoSelBtn').count(): await pg.click('#autoSelBtn'); await pg.wait_for_timeout(1500)
        # --- arrange
        step('arrange'); await tab('right','arrange')
        for bt in ['#rotL','#rotR','#flipBtn','#centerSel','#dupBtn']:
            if await pg.locator(bt).count(): await pg.click(bt); await pg.wait_for_timeout(700)
        # --- undo/redo storm
        step('undo'); 
        for _ in range(15): await pg.keyboard.press('Control+z'); await pg.wait_for_timeout(60)
        for _ in range(15): await pg.keyboard.press('Control+y'); await pg.wait_for_timeout(60)
        for _ in range(8): await pg.keyboard.press('Control+Shift+z'); await pg.wait_for_timeout(60)
        await pg.wait_for_timeout(1500)
        # --- hoops
        step('hoops'); await tab('left','hoop')
        brands = await pg.evaluate("[...brandSel.options].map(o=>o.value)")
        for br in brands:
            await pg.select_option('#brandSel', br); await pg.wait_for_timeout(120)
            hs = await pg.evaluate("[...hoopSel.options].map(o=>o.value)")
            for h in hs: await pg.select_option('#hoopSel', h); await pg.wait_for_timeout(30)
            await pg.click('#hoopTurn'); await pg.wait_for_timeout(60); await pg.click('#hoopTurn')
        for i in range(await pg.evaluate("fabricSel.options.length")): await pg.select_option('#fabricSel', index=i); await pg.wait_for_timeout(500)
        # --- text with everything
        step('text'); await tab('left','text')
        await pg.evaluate("document.getElementById('textNewBtn').click()")
        await pg.fill('#txt', 'Hey you\nOK dodo'); await pg.click('#boldBtn'); await pg.click('#italBtn')
        await pg.click('#addTextBtn'); await busy()
        for js in ["txtCv.value=40","txtSp.value=-8","txtLs.value=1.6","txtH.value=20","txtCv.value=-50","txtCv.value=0"]:
            await pg.evaluate(js+"; document.querySelector('#'+'"+js.split('.')[0]+"').dispatchEvent(new Event('input'))"); await pg.wait_for_timeout(700)
        for a in ['left','right','center']: await pg.click(f'#txtAlign [data-align={a}]'); await pg.wait_for_timeout(700)
        await pg.fill('#txt', ''); await pg.dispatch_event('#txt','input'); await pg.wait_for_timeout(600)
        await pg.fill('#txt', 'Z'); await pg.dispatch_event('#txt','input'); await pg.wait_for_timeout(900)
        # --- export all formats
        step('export'); 
        for m in ['pes','jef','dst','exp','vp3','all']:
            await pg.click('#exportBtn'); await pg.wait_for_timeout(300)
            await pg.locator(f'#machines input[value={m}]').locator('xpath=..').click(); await pg.wait_for_timeout(100)
            async with pg.expect_download(timeout=15000) as dl: await pg.click('#doExport')
            d = await dl.value; path = await d.path(); errs.append(('dl', m, d.suggested_filename, pathlib.Path(path).stat().st_size))
            await pg.wait_for_timeout(300)
            errs.append(('dlg', m, await pg.locator('#exportDlg[open]').count()))
        # --- save / open project round trip
        step('save'); 
        proj = await pg.evaluate("(()=>{const S=window.__stitchStudio.S;return JSON.stringify({app:'stitch-studio',v:1,name:'fz',objects:S.objects,hoop:S.hoop,hoopTurn:S.hoopTurn,fabric:S.fabric,fabricColor:S.fabricColor,knockout:S.knockout,nextId:S.nextId})})()")
        open('tests/out/fz.json','w').write(proj)
        await pg.set_input_files('#projIn','tests/out/fz.json'); await pg.wait_for_timeout(2500)
        errs.append(('reopened', await pg.evaluate("window.__stitchStudio.S.objects.length")))
        # --- monkey
        step('monkey'); random.seed(7)
        cvb = await pg.locator('#cv').bounding_box()
        for i in range(400):
            r = random.random()
            try:
                if r < 0.35:
                    x = cvb['x']+random.random()*cvb['width']; y = cvb['y']+random.random()*cvb['height']
                    await pg.mouse.click(x,y, button='right' if random.random()<0.1 else 'left', click_count=2 if random.random()<0.1 else 1)
                elif r < 0.5:
                    x = cvb['x']+random.random()*cvb['width']; y = cvb['y']+random.random()*cvb['height']
                    await pg.mouse.move(x,y); await pg.mouse.down(); await pg.mouse.move(x+random.uniform(-80,80), y+random.uniform(-80,80), steps=4); await pg.mouse.up()
                elif r < 0.65:
                    await pg.keyboard.press(random.choice(['Tab','Delete','Escape','Enter','s','f','o','x','ArrowLeft','ArrowUp','Control+z','Control+y','Control+a','Shift+Tab','Backspace']))
                else:
                    btns = await pg.locator('aside button:visible, #inspector button:visible, .drawbar button:visible, nav button:visible').all()
                    btns = [bt for bt in btns if (await bt.get_attribute('id')) not in ('exportBtn','saveBtn','openBtn','getAppBtn','clearBtn','sampleBtn','showAllFonts','addFontBtn')]
                    if btns: await random.choice(btns).click(timeout=800)
            except Exception as e:
                pass
            if await pg.locator('dialog[open]').count(): await pg.keyboard.press('Escape')
            if i % 50 == 0: await pg.wait_for_timeout(300)
        await pg.wait_for_timeout(2000)
        bad = [e for e in errs if e[0] in ('pageerror','console')]
        print('downloads:', [e for e in errs if e[0]=='dl'])
        print('dialog left open after export:', [e for e in errs if e[0]=='dlg' and e[2]])
        print('reopen:', [e for e in errs if e[0]=='reopened'])
        # report errors with the step they happened in
        cur=None
        for e in errs:
            if e[0]=='step': cur=e[1]
            elif e[0] in ('pageerror','console'): print(cur, e)
        print('total errors', len(bad))
        await b.close()
asyncio.run(main())
