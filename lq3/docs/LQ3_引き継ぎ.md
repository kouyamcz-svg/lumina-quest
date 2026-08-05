# ルミナクエストIII 引き継ぎ（全面改訂版）

最終更新：2026-08-03（終章完成・運用段階）
旧版は実態と大きく乖離していたため全面書き直し。**旧版に平文で書かれていたPATは失効済みとして扱うこと。**

---

## 1. 場所

| 項目 | 内容 |
|---|---|
| 公開URL | https://kouyamcz-svg.github.io/lumina-quest/lq3/ |
| リポジトリ | `kouyamcz-svg/lumina-quest`（`lq3/` 配下） |
| 作業ディレクトリ | `/home/claude/lq3/` |
| **PAT** | **文書・メモリに保存しない。毎回津野さんに依頼し、会話ごとに使い捨て・作業後に失効してもらう** |
| 文書 | `lq3/docs/`（構想書・章の作り方・本書）。LQ4は `lq4/docs/` |

## 2. 進捗 ── 全章完成・運用段階

第1〜終章まで実装済み。エンディング（トロス再会の一枚絵つき）・完結メッセージまで動作する。
現在は実機バグ対応と磨きのフェーズ。ラスボスは**まおう デスグラン（3形態：第一→腕なしの怨念→触手の真の姿）**。

## 3. ファイル構成（実態）

```
lq3/
  index.html      ビルド成果物（src/*.js を結合）
  assets.js       絵（CHR/MON、base64）。src配下ではなく lq3/ 直下
  shell.html      HTML骨組み・PWAメタ・アイコンリンク
  build.py        src/*.js → index.html（assets版クエリも更新）
  sw.js           SW。CACHE='lq3-v3'、index/assetsはネット優先
  apple-touch-icon.png / icon-180.png / icon-512.png
  BUILD.txt       Pages再ビルド起こし用
  *.mp3           field/town/castle/dungeon/battle3/boss
  src/            core/chapters/npc/world/view/view2d/ui/bgm
  docs/           構想書・章の作り方・本書
  test/           下記
```

## 4. テスト（実在するもの）

```
node test/ch5_tour.js    # 233項目
node test/ch6_final.js   # 85項目
node test/swap.js        # 41項目
node test/tune_ch5.js / tune_ch6.js / tune_lord.js / tune_road.js  # 勝率実測
```

**注意：旧版に書かれていた check.js／chapter.js／browser.js／regress_chN.js／build_verify.js は存在しない。**
BFS到達性チェッカーも未実装（ワープ監査はその場しのぎのスクリプトで2件の壁埋まりを検出した実績あり。LQ4構想書で必須化済み。LQ3に恒久追加する場合は test/ に置くこと）。

## 5. 作業手順

```bash
cd /home/claude/lq3
# 1. src/*.js をPythonパッチで編集（置換件数assert・repr()生成）
# 2. node --check src/対象.js
# 3. python3 build.py
# 4. 回帰3本＋必要ならtune
# 5. デプロイ（Contents API PUT）→ Pages built を確認
```

**デプロイの注意（頻発事象）**
- Pagesがindex.htmlのコミットを拾わないことがある → `BUILD.txt` を更新して再ビルドを起こす
- **デプロイ前に必ず最新コミットを確認**。想定外のコミットがあれば中断（並行セッションの上書き事故防止。実際に事故寸前があった）
- 納品連絡には「アプリ再起動で反映・セーブ維持」を毎回添える

## 6. 主要な仕組み（この夏に追加されたもの含む）

| 仕組み | 場所 | 内容 |
|---|---|---|
| ボスAI | core.js | charge（溜め・予告→大技）／brace（身がまえ）／enrage（HP閾値で強化） |
| 敵scale | core.js/view2d | 敵定義に scale:1.35 等でボスを拡大表示 |
| 一枚絵 | 全層 | イベント/エンディングに img:'キー' で全画面絵（192×128原寸を整数倍） |
| ビーコン | view.js | 3Dマップの warpsXY に光の柱を自動設置（金=階段/水色=他） |
| ちず | view2d/view | 3Dシーンでは2Dキャンバスを借りて表示 |
| encRate/encGrace | MAPS | マップ別エンカウント率・戦闘後猶予（未指定だと0.085/3歩で高すぎる） |
| bossInfoAt | core.js | Bタイルの絵・消滅フラグを章データから解決（ハードコード禁止） |

## 7. 決定事項（更新済み）

- **父（旧アルト）の名前は出さない**。＜ものまねし＞と呼ぶ。姿も出さない
- ラスボス名は「まおう デスグラン」。名乗り＝よみがえりし まおう
- 表記：LQ3は「ひらがな＋最小限の漢字」を維持。**漢字解禁はIVから**
- アプリ名（ホーム画面）＝ルミクエⅢ／アイコン＝とびら（apple-touch-icon.png）
- 台詞46文字以内・呪文命名規則（語尾変化/規模）は従来どおり

## 8. 既知の負債（次にやること）

1. **デッドコード掃除**：M0技術スライスの旧デスグラン3連戦（core.js 2085付近〜victory分岐）。到達不能だが「＊＊ ぎじゅつスライス ここまで ＊＊」のテスト文言が残っており規約違反状態。MON の desgran1-3 旧絵も未使用
2. 図鑑表示UI・セーブスロット選択UI・クリア後アリーナ・隠しボス「めざめぬもの」（構想書M6の未実装分）
3. BFS到達性チェッカーの恒久化（test/へ）
4. BGM：戦闘突入時の異常報告に対し、二重スタート対策・playやくそく競合対策・番犬（guardHits計測つき）の3段を実装済み。再発時はメニューのBGMデバッグの guardHits を確認して切り分ける

## 9. 地雷集

LQ4構想書 §10 に、LQ2〜LQ3で実際に踏んだ地雷の最新版がまとまっている（audio.playのPromise競合／非表示要素の計測0×0／zoomの整数丸め／壁埋まりワープ／opening表示経路／並行セッション等）。**本書と重複管理しない。あちらを正とする。**
