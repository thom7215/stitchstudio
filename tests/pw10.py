import pathlib
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'dist' / 'index.html').as_uri()
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width':1440,'height':900})
        await pg.goto(APP_URL)
        await pg.wait_for_timeout(3000)
        r = await pg.evaluate("""(()=>{try{const o=window.__stitchStudio.S.objects[4];
          const g={pts:[[-10,-25],[0,-27],[10,-25]],closed:false};
          const pv=Core.guidePreview(o.rings,[], [g], []); return JSON.stringify(pv[0]&&{l:pv[0].left.length,h:pv[0].handles.length});}catch(e){return 'ERR '+e.stack}})()""")
        print(r)
        await b.close()
asyncio.run(main())
