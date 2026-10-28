import pathlib
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'dist' / 'index.html').as_uri()
import asyncio, math
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
        await pg.fill('#txt','C')
        await pg.evaluate("document.getElementById('txtH').value=40; document.getElementById('txtH').dispatchEvent(new Event('input'))")
        await pg.click('#addTextBtn')
        await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000)
        await pg.click('#zoomFit'); await pg.wait_for_timeout(300)
        await pg.click('#quickDraw'); await pg.wait_for_timeout(400)
        cvb = await pg.locator('#cv').bounding_box()
        async def click_mm(x,y, **kw):
            sx, sy = await pg.evaluate(f"window.__stitchStudio.toScreen({x},{y})")
            await pg.mouse.click(cvb['x']+sx, cvb['y']+sy, **kw)
        # get letter bbox
        bb = await pg.evaluate("(()=>{const o=window.__stitchStudio.S.objects[0];let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const r of o.rings)for(const p of r){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);}return [x0,y0,x1,y1]})()")
        print('bbox', [round(v,1) for v in bb])
        cx=(bb[0]+bb[2])/2; cy=(bb[1]+bb[3])/2; rx=(bb[2]-bb[0])/2-3.2; ry=(bb[3]-bb[1])/2-3.2
        # draw along the C from top-right going counter-clockwise to bottom-right
        angs=[-50,-90,-130,-180,-230,-270,-310]
        for i,a in enumerate(angs):
            await click_mm(cx+rx*math.cos(math.radians(a)), cy+ry*math.sin(math.radians(a)))
            await pg.wait_for_timeout(80)
            if i==3:
                sx, sy = await pg.evaluate(f"window.__stitchStudio.toScreen({cx+rx*math.cos(math.radians(-205))},{cy+ry*math.sin(math.radians(-205))})"); await pg.mouse.move(cvb['x']+sx, cvb['y']+sy); await pg.wait_for_timeout(200)
                await pg.screenshot(path='tests/out/d1.png')
        # finish by clicking last dot again
        a=angs[-1]
        await click_mm(cx+rx*math.cos(math.radians(a)), cy+ry*math.sin(math.radians(a)))
        await pg.wait_for_timeout(1200)
        await pg.click('#dbDone'); await pg.wait_for_timeout(500)
        g = await pg.evaluate("window.__stitchStudio.S.objects[0].guides")
        print('guides', len(g), [len(x['pts']) for x in g])
        # first and last stitch of the object
        se = await pg.evaluate("(()=>{const r=window.__stitchStudio.results()[0];const s=r.segs[0].pts;return [s[0],s[s.length-1]]})()")
        print('first stitch', [round(v,2) for v in se[0]], 'first click', [round(cx+rx*math.cos(math.radians(angs[0])),2), round(cy+ry*math.sin(math.radians(angs[0])),2)])
        print('last stitch', [round(v,2) for v in se[1]])
        # select the path and set custom width
        await click_mm(cx+rx*math.cos(math.radians(-180)), cy+ry*math.sin(math.radians(-180)))
        await pg.wait_for_timeout(500)
        print(await pg.inner_text('.guidebox'))
        await pg.click('#pwMode [data-v=custom]'); await pg.wait_for_timeout(600)
        await pg.evaluate("const r=document.getElementById('pwAll'); r.value=2; r.dispatchEvent(new Event('input')); r.dispatchEvent(new Event('change'))")
        await pg.wait_for_timeout(1200)
        await pg.screenshot(path='tests/out/d2.png')
        print('\n'.join(errs))
        await b.close()
asyncio.run(main())
