import re
sh=open('src/shell.html').read()
css=open('src/style.css').read()
js='\n'.join(open('src/'+f).read() for f in ['core.js','formats.js','import.js','app.js'])
assert '</script' not in js.lower()
out=sh.replace('/*__CSS__*/',css).replace('/*__JS__*/',js)
open('dist/index.html','w').write(out)
# the same page at the top of the repository, for GitHub Pages
open('index.html','w').write(out)
print(len(out))
