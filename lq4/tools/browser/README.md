# 本物の ブラウザで 撮る（画面の 部品の 位置を 確かめる）

ドット絵の 撮影ツール（tools/shot3d）では HTML の 部品（窓・状態の 枠・地名）の 配置が 見えない。
npm の @sparticuz/chromium（chromium 本体 入り）で iPhone の 画面の 大きさで 開いて 撮る。

```
mkdir -p /tmp/br && cd /tmp/br && npm init -y && npm install @sparticuz/chromium@123 puppeteer-core@22
cp /home/claude/lq4/tools/browser/shot.js /tmp/br/
cd /home/claude/lq4 && (setsid nohup python3 -m http.server 8765 >/tmp/http.log 2>&1 &)
cd /tmp/br && ADV=1 node shot.js battle     # 第3章から ルプス戦に 入って 窓が 出た ところ
cd /tmp/br && ADV=0 node shot.js menu       # 町で メニューを 開いた ところ
```
- タイトルを タップ →「章を 選ぶ」→ 第3章 と 正規の 手順で 始める（直接 状態を 変えると タイトルの メニューが 残る）
- LQ4 は window の 下には ない（ページ全体の const）。evaluate の 中では そのまま LQ4 と 書く
