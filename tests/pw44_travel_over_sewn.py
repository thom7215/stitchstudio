import asyncio, pathlib
from playwright.async_api import async_playwright
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'index.html').as_uri()
# Letters with hand-style columns (the app's suggested columns, kept as Manual): how much travel stitching
# lies on top of satin already sewn, with the old routing and the new one
JS = """(old) => { Core.testOpts.oldTravel = old; const L = window.__stitchStudio.S.objects; const fab = {satin:0.4, fill:0.4, pull:0.15, under:'normal'};
  const objs = L.map(o => { const q = JSON.parse(JSON.stringify(o)); q.type = 'satin'; q.params.satinDir = 'columns'; q.columns = Core.autoColumns(q.rings, [], {spacing: 0.4, margin: 0.3}); return q; });
  const res = objs.map(o => Core.generate(o, [], fab, null));
  const A = Core.assemble(objs, res); Core.testOpts.oldTravel = false;
  return { travel: +A.travel.mm.toFixed(1), overSewn: +A.travel.overMm.toFixed(1), trims: A.C.filter(c => c === 2).length, stitches: A.stitches }; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(APP_URL); await pg.wait_for_timeout(1000)
        for word in ['A', 'a', 'H', 'R', 'k', 'B', 'Mm']:
            await pg.evaluate("window.__stitchStudio.S.objects.length=0"); await pg.evaluate("document.getElementById('textNewBtn').click()")
            await pg.click('#leftTabs [data-tab=text]'); await pg.fill('#txt', word)
            await pg.evaluate("txtH.value=40; txtH.dispatchEvent(new Event('input'))")
            await pg.click('#addTextBtn'); await pg.wait_for_function("document.getElementById('busy').hidden"); await pg.wait_for_timeout(300)
            o = await pg.evaluate(JS, True); n = await pg.evaluate(JS, False)
            print(f"{word}: travel on top of finished satin {o['overSewn']} mm -> {n['overSewn']} mm   (travel {o['travel']} -> {n['travel']} mm, trims {o['trims']} -> {n['trims']}, stitches {o['stitches']} -> {n['stitches']})")
        print(errs); await b.close()
asyncio.run(main())
