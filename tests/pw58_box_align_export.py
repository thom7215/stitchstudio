# drag a box to select, centre alignment, export asks where to save
import asyncio, pathlib
from playwright.async_api import async_playwright
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'index.html').as_uri()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(APP_URL); await pg.wait_for_timeout(800)
        await pg.click('#leftTabs [data-tab=text]')
        for w, dy in (('AB', -20), ('C', 15)):
            await pg.evaluate("document.getElementById('objNone').click()")
            await pg.fill('#txt', w); await pg.click('#addTextBtn'); await pg.wait_for_function("document.getElementById('busy').hidden"); await pg.wait_for_timeout(300)
            await pg.evaluate(f"(()=>{{const st=window.__stitchStudio; for (const o of st.S.objects.filter(o=>st.ui.sel.has(o.id))) {{ o.rings=o.rings.map(r=>r.map(p=>[p[0]+{dy/2},p[1]+{dy}])); o.text.cx+={dy/2}; o.text.cy+={dy}; o.ver++; }} }})()")
        await pg.evaluate("document.getElementById('objNone').click()"); await pg.click('#zoomFit'); await pg.wait_for_timeout(300)
        cvb = await pg.locator('#cv').bounding_box()
        scr = lambda x, y: pg.evaluate(f"window.__stitchStudio.toScreen({x},{y})")
        sel = "window.__stitchStudio.S.objects.filter(o=>window.__stitchStudio.ui.sel.has(o.id)).map(o=>o.name.split(' ')[0])"
        # box around the top word only
        a = await scr(-30, -35); c = await scr(30, -5)
        await pg.mouse.move(cvb['x']+a[0], cvb['y']+a[1]); await pg.mouse.down(); await pg.mouse.move(cvb['x']+c[0], cvb['y']+c[1], steps=8); await pg.mouse.up(); await pg.wait_for_timeout(200)
        print('box around top word:', await pg.evaluate(sel))
        a = await scr(-45, -45); c = await scr(45, 45)
        await pg.mouse.move(cvb['x']+a[0], cvb['y']+a[1]); await pg.mouse.down(); await pg.mouse.move(cvb['x']+c[0], cvb['y']+c[1], steps=8); await pg.mouse.up(); await pg.wait_for_timeout(200)
        print('box around everything:', await pg.evaluate(sel))
        cen = "(()=>{const st=window.__stitchStudio; const g={}; for (const o of st.S.objects){ const xs=o.rings.flat(); (g[o.group]=g[o.group]||[]).push(...xs);} return Object.values(g).map(xs=>[((Math.min(...xs.map(p=>p[0]))+Math.max(...xs.map(p=>p[0])))/2).toFixed(2), ((Math.min(...xs.map(p=>p[1]))+Math.max(...xs.map(p=>p[1])))/2).toFixed(2)])})()"
        print('word centres before:', await pg.evaluate(cen))
        await pg.click('#rightTabs [data-tab=objects]'); await pg.click('#alignH'); await pg.wait_for_timeout(200)
        print('after center horizontally:', await pg.evaluate(cen))
        await pg.click('#alignV'); await pg.wait_for_timeout(200)
        print('after center vertically:', await pg.evaluate(cen))
        # a click on empty canvas clears; middle button still pans
        e0 = await scr(48, 48); await pg.mouse.click(cvb['x']+e0[0], cvb['y']+e0[1]); print('click empty ->', await pg.evaluate(sel))
        v0 = await pg.evaluate("window.__stitchStudio.view.ox")
        await pg.mouse.move(cvb['x']+200, cvb['y']+200); await pg.mouse.down(button='middle'); await pg.mouse.move(cvb['x']+260, cvb['y']+200, steps=5); await pg.mouse.up(button='middle')
        print('middle drag pans by', round(await pg.evaluate("window.__stitchStudio.view.ox") - v0))
        # export asks where to save
        await pg.evaluate("(() => { window.__saved=null; window.showSaveFilePicker = async (o) => { window.__picked=o; return { name: o.suggestedName, createWritable: async () => ({ write: async (d) => { window.__saved = d.length || d.byteLength; }, close: async () => {} }) }; }; })()")
        await pg.click('#objAll'); await pg.click('#rightTabs [data-tab=stitch]'); await pg.click('#inspector [data-type=fill]'); await pg.wait_for_function("document.getElementById('busy').hidden"); await pg.wait_for_timeout(300)
        await pg.click('#exportBtn'); await pg.wait_for_timeout(200)
        print('export button text:', await pg.inner_text('#doExport'))
        await pg.click('#doExport'); await pg.wait_for_timeout(400)
        print('picker asked for:', await pg.evaluate("window.__picked && window.__picked.suggestedName"), 'bytes written:', await pg.evaluate("window.__saved"))
        print(errs); await b.close()
asyncio.run(main())
