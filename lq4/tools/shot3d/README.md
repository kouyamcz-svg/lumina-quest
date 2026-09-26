# 3D描画の撮影ツール

ダンジョンの3D描画を、ブラウザなしで PNG に撮る。

## 準備（初回だけ）
```
apt-get install -y libxi-dev libxext-dev libgl1-mesa-dev xvfb libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
mkdir -p /tmp/gl3d && cd /tmp/gl3d && npm init -y
export npm_config_nodedir=/usr CXXFLAGS="-include cstdint -include cstring"
npm install gl@6 pngjs canvas@2 --build-from-source
# three r128 は index.html から 取り出して /tmp/gl3d/three.js に 置く
cp /home/claude/lq4/tools/shot3d/*.js /tmp/gl3d/
```

## 撮る
```
cd /tmp/gl3d
xvfb-run -a node shot3d.js <map> <x> <y> <out.png> <chapter>
SETS="well_cave,11,1,." xvfb-run -a node shot3d.js well_cave 11 4 a.png 4     # 撮る前に ます を かえる
LATER="well_cave,20,9,l" xvfb-run -a node shot3d.js well_cave 20 11 b.png 4   # 組んだ あとで かえる（組み直しの 確認）
xvfb-run -a node shot3d.js __flow 0 0 x 4                                    # 2D→3D→2D の 行き来
```

## 2D を iPhone 条件で 撮る
```
DPR=2 SAFETOP=54 TWO_D=1 SHIP=48,2 W=395 H=473 xvfb-run -a node shot3d.js ground 48 4 out.png 4
```
- SAFETOP：画面上部の 隠れる 帯（css px）。DPR：画素比。SHIP：地上の 舟の 位置

## 注意
- vm の 別領域で 作った 型付き配列を headless-gl が 受けとれない。GL 呼び出しの 手前で 変換して いる
- headless-gl は 画像を 直接 受けとれない。texImage2D の 手前で 画素に なおして いる
