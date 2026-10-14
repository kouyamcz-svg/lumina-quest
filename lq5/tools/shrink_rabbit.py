# 戦闘の 絵（src/rabbit.json）を 256色の PNG に 減らして 小さく する（見た目は ほぼ 変わらない）。
# 新しい 絵を 入れた 後に 1回 実行する：python3 tools/shrink_rabbit.py   （小さく ならない 絵は そのまま）
import json, base64, io, os
from PIL import Image
P=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','src','rabbit.json')
d=json.load(open(P)); b0=b1=0
for k,v in d.items():
    b=base64.b64decode(v.split(',',1)[1]); im=Image.open(io.BytesIO(b)).convert('RGBA')
    q=im.quantize(colors=256,method=Image.Quantize.FASTOCTREE); buf=io.BytesIO(); q.save(buf,'PNG',optimize=True); n=buf.getvalue()
    b0+=len(b)
    if len(n)<len(b): d[k]='data:image/png;base64,'+base64.b64encode(n).decode(); b1+=len(n)
    else: b1+=len(b)
json.dump(d,open(P,'w'),separators=(',',':'),ensure_ascii=False); print('rabbit', b0//1024, '->', b1//1024, 'KB')
