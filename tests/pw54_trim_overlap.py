# letters of a digitized script word: each letter leaves out what lies under the next letter
import asyncio, pathlib, json
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parents[1]
FONT = json.load(open(ROOT / 'samples' / 'Satisfy-stitch.ssfont.json'))['font']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto((ROOT/'index.html').as_uri()); await pg.wait_for_timeout(600)
        await pg.evaluate("f => localStorage.setItem('ss-fonts', JSON.stringify([f]))", FONT)
        await pg.reload(); await pg.wait_for_timeout(800)
        await pg.click('#leftTabs [data-tab=text]')
        await pg.fill('#txt', 'Mavis'); await pg.dispatch_event('#txt', 'input')
        await pg.evaluate("txtSp.value=-30; txtSp.dispatchEvent(new Event('input')); txtH.value=30; txtH.dispatchEvent(new Event('input'))")
        await pg.click(f'#fontList [data-font="sfont:{FONT["id"]}"]'); await pg.wait_for_timeout(200)
        print('trim box shown:', await pg.is_visible('#txtTrim'), 'checked:', await pg.is_checked('#txtTrim'))
        await pg.click('#addTextBtn'); await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000); await pg.wait_for_timeout(600)
        M = """(() => { const st = window.__stitchStudio, objs = st.S.objects, R = st.results(); let under = 0, pts = 0;
          objs.forEach((o, i) => { const later = objs.slice(i + 1).filter((q) => q.group === o.group);
            for (const sg of (R[i] || {segs: []}).segs) for (const q of sg.pts) { pts++; if (later.some((l) => Core.pointInRings(q[0], q[1], l.rings) && Core.nearestOnRings(l.rings, q).d > 0.45)) under++; } });
          return { letters: objs.length, stitchPts: pts, underNextLetter: under, stitches: st.assembled().stitches }; })()"""
        print('trim on :', await pg.evaluate(M))
        await pg.uncheck('#txtTrim'); await pg.wait_for_timeout(900); await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000); await pg.wait_for_timeout(300)
        print('trim off:', await pg.evaluate(M), 'spec trim:', await pg.evaluate("window.__stitchStudio.S.objects[0].text.trim"))
        await pg.check('#txtTrim'); await pg.wait_for_timeout(900); await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000); await pg.wait_for_timeout(300)
        print('trim on again:', await pg.evaluate(M))
        await pg.screenshot(path='/tmp/trim.png')
        print(errs); await b.close()
asyncio.run(main())
