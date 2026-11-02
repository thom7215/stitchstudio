import asyncio, pathlib, json
from playwright.async_api import async_playwright
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'index.html').as_uri()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(APP_URL); await pg.wait_for_timeout(900)
        # an older font that kept the default name although it was traced from another font
        await pg.evaluate("""localStorage.setItem('ss-fonts', JSON.stringify([{id:'old1', name:'Arial stitch', source:{font:'Georgia', bold:false, italic:false}, cap:25,
            metrics:{cap:25,xh:17,desc:6,space:7,lineH:40}, glyphs:{A:{adv:18, objects:[{kind:'area', rings:[[[0,0],[10,-25],[18,0]]], type:'satin', params:{satinDir:'columns'}, columns:[], borders:[]}]}}}]))""")
        await pg.reload(); await pg.wait_for_timeout(900)
        await pg.click('#modeSeg [data-mode=font]'); await pg.wait_for_timeout(600)
        print('old font now named:', await pg.evaluate("JSON.parse(localStorage.getItem('ss-fonts'))[0].name"), '|', (await pg.locator('#fontPanel .status').last.inner_text()))
        # new font: the name follows "Traced from"
        await pg.click('#sfNewBtn'); await pg.wait_for_timeout(300)
        opts = await pg.evaluate("[...document.querySelectorAll('#sfSrc option')].map(o=>o.value)")
        pick = 'Georgia' if 'Georgia' in opts else opts[min(3, len(opts)-1)]
        await pg.select_option('#sfSrc', pick); await pg.wait_for_timeout(100)
        print('pick', pick, '-> name box:', await pg.input_value('#sfName'))
        await pg.fill('#sfName', 'My Script'); await pg.select_option('#sfSrc', opts[0]); await pg.wait_for_timeout(100)
        print('typed own name, then changed font -> name box:', await pg.input_value('#sfName'))
        await pg.fill('#sfName', ''); await pg.dispatch_event('#sfName', 'input'); await pg.select_option('#sfSrc', pick); await pg.wait_for_timeout(100)
        print('cleared name, then picked a font -> name box:', await pg.input_value('#sfName'))
        await pg.click('#sfCreate'); await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000); await pg.wait_for_timeout(500)
        print('created:', await pg.evaluate("JSON.parse(localStorage.getItem('ss-fonts')).map(f=>f.name+' <- '+f.source.font)"))
        # an edit followed straight away by a reload is kept
        await pg.click('#sfGlyphs [data-ch=B]'); await pg.wait_for_timeout(400)
        await pg.click('#rightTabs [data-tab=stitch]'); await pg.click('#inspector [data-type=fill]')
        await pg.reload(); await pg.wait_for_timeout(800)
        f = await pg.evaluate("JSON.parse(localStorage.getItem('ss-fonts')).slice(-1)[0]")
        print('B after an immediate reload:', f['glyphs']['B']['objects'][0]['type'])
        print(errs); await b.close()
asyncio.run(main())
