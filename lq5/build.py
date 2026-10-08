# Ⅴ：src/template.html に 絵の データを 入れて index.html を 作る
#   python3 build.py
import json, os
D=os.path.dirname(os.path.abspath(__file__))
t=open(os.path.join(D,'src/template.html'),encoding='utf8').read()
for key,f in [('__SPR__','spr.json'),('__WOBJ__','wobj.json'),('__RAB__','rabbit.json')]:
    t=t.replace(key, open(os.path.join(D,'src',f),encoding='utf8').read())
open(os.path.join(D,'index.html'),'w',encoding='utf8').write(t)
print('index.html', len(t))
