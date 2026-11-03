# Rebuilds index.html from the source files: python3 src/build.py
import os
here=os.path.dirname(os.path.abspath(__file__))
r=lambda f: open(os.path.join(here,f),encoding='utf-8').read()
page=r('shell.html').replace('//@@VOCAB@@',r('vocab.js')).replace('//@@APP@@',r('app.js'))
doc=('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
     '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
     '<meta name="theme-color" content="#1d6b57">\n</head>\n<body>\n'+page+'\n</body>\n</html>\n')
open(os.path.join(here,'..','index.html'),'w',encoding='utf-8').write(doc)
print('index.html rebuilt')
