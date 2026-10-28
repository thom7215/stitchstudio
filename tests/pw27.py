import asyncio, pathlib
from playwright.async_api import async_playwright
APP_URL = (pathlib.Path(__file__).resolve().parents[1] / 'index.html').as_uri()
CHECK = """(()=>{const L=window.__stitchStudio.S.objects; const pin=(x,y,r)=>{let c=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const[a,b]=r[i],[d,e]=r[j];if((b>y)!==(e>y)&&x<(d-a)*(y-b)/(e-b)+a)c=!c}return c};
 const ar=(r)=>{let s=0;for(let i=0;i<r.length;i++){const[a,b]=r[i],[c,d]=r[(i+1)%r.length];s+=a*d-c*b}return Math.abs(s/2)};
 return L.map(o=>{const big=o.rings.reduce((m,r)=>ar(r)>ar(m)?r:m,o.rings[0]); const insideOther=L.some(q=>q!==o&&q.rings.some(r=>ar(r)>ar(big)&&pin(big[0][0],big[0][1],r)));
  return o.name.split('  ')[0]+':'+o.rings.length+(insideOther?' STRAY-HOLE':'')})})()"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(APP_URL); await pg.wait_for_timeout(1200)
        await pg.click('#leftTabs [data-tab=text]')
        for words in ['Vall', 'dodo bag']:
            await pg.evaluate("document.getElementById('textNewBtn').click()")
            await pg.fill('#txt', words); await pg.click('#boldBtn'); await pg.click('#italBtn')
            await pg.evaluate("txtSp.value=-10; txtSp.dispatchEvent(new Event('input')); txtH.value=30; txtH.dispatchEvent(new Event('input'))")
            await pg.evaluate("window.__stitchStudio.S.objects.length=0")
            await pg.click('#addTextBtn'); await pg.wait_for_function("document.getElementById('busy').hidden", timeout=60000); await pg.wait_for_timeout(600)
            print(words, await pg.evaluate(CHECK))
            await pg.click('#boldBtn'); await pg.click('#italBtn')
        print(errs); await b.close()
asyncio.run(main())
