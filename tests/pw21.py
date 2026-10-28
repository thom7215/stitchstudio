import pathlib
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'dist' / 'index.html').as_uri()
import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900}, accept_downloads=True)
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
        await pg.goto(APP_URL); await pg.wait_for_timeout(1500)
        await pg.click('#sampleBtn'); await pg.wait_for_timeout(2000)
        # this headless Chromium has showSaveFilePicker? disable it to test the download path
        await pg.evaluate("delete window.showSaveFilePicker; window.showSaveFilePicker = undefined")
        await pg.keyboard.press('Control+s'); await pg.wait_for_timeout(300)
        print('dialog open:', await pg.evaluate("document.getElementById('saveDlg').open"), '| name:', repr(await pg.input_value('#saveName')))
        print('where:', await pg.inner_text('#saveWhere'))
        await pg.screenshot(path='tests/out/save1.png')
        await pg.fill('#saveName', 'Team Patch')
        async with pg.expect_download() as dl:
            await pg.click('#doSave')
        d = await dl.value; await d.save_as('tests/out/Team Patch.json'); print('downloaded as', d.suggested_filename)
        await pg.wait_for_timeout(300)
        print('header:', await pg.inner_text('#projName'), '| title:', await pg.title())
        # open it again in a fresh page and check the dialog prefills the name
        pg2 = await b.new_page(viewport={'width':1440,'height':900})
        await pg2.goto(APP_URL); await pg2.wait_for_timeout(1200)
        await pg2.evaluate("window.showOpenFilePicker = undefined; window.showSaveFilePicker = undefined")
        await pg2.set_input_files('#projIn', 'tests/out/Team Patch.json'); await pg2.wait_for_timeout(1500)
        print('reopened header:', await pg2.inner_text('#projName'), '| shapes:', await pg2.evaluate("window.__stitchStudio.S.objects.length"))
        await pg2.click('#saveBtn'); await pg2.wait_for_timeout(300)
        print('prefilled name:', repr(await pg2.input_value('#saveName')))
        await pg2.keyboard.press('Escape')
        await pg2.click('#exportBtn'); await pg2.wait_for_timeout(300)
        print('export file name:', await pg2.input_value('#fileName'))
        print(json.load(open('tests/out/Team Patch.json'))['name'])
        print(errs); await b.close()
asyncio.run(main())
