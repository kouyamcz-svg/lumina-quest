'use strict';
// ============================================================
// ルミナクエストIII / コア層（DOM・THREE非依存＝ヘッドレス実行可）
// 描画は V.*（ビュー）、UIは U.*（メッセージ/メニュー）、音は A.* 経由
// ============================================================
const LQ3 = (function(){

// ---------------- データ：クラス・呪文 ----------------
const LV_CAP = 50;
const SPELL_DEFS = {
  spark:  {name:'スパーク',   mp:2, type:'dmg',    min:12, max:18},
  heal:   {name:'ヒール',     mp:3, type:'heal',   min:20, max:28},
  cure:   {name:'キュア',     mp:2, type:'cure'},
  // ★ルカの ほのおけい（おどりながら ひを まう）
  ember:  {name:'ファイア',        mp:2, type:'dmg',    min:12, max:18},
  firedance:{name:'ほのおの うず', mp:6, type:'dmgall', min:16, max:24},
  // ★たんたいに つよい ほのお（おどりから くりだす いちげき）
  flamestep:{name:'ファイガ',mp:7, type:'dmg',   min:38, max:50},
  // ★しゅびりょくを さげる（ほのおで よろいを あぶる）
  scorch: {name:'よろいわり',  mp:4, type:'defdown', cut:8},
  meltdance:{name:'よろいくだき', mp:9, type:'defdown', cut:16},
  scarletfan:{name:'ファイジャ',mp:16,type:'dmg',  min:82, max:106},
  blazering:{name:'ほのおの あらし', mp:14,type:'dmgall', min:34, max:46},
  inferno:{name:'ほのおの たいか',  mp:24,type:'dmgall', min:62, max:82},
  blaze:  {name:'スパーラ',   mp:5, type:'dmg',    min:26, max:34},
  hiheal: {name:'ヒーラ', mp:6, type:'heal',   min:45, max:60},
  nova:   {name:'ひかりの うず',     mp:10,type:'dmgall', min:26, max:36},
  revive: {name:'リヴァイブ', mp:12,type:'revive'},
  // ---- こうい じゅもん（Lv12いこう） ----
  // ★たんたいの さいじょうい（ミオ・セナの きりふだ）
  boltja: {name:'スパージャ',      mp:18,type:'dmg', min:88, max:116},
  bolt:   {name:'スパーガ',   mp:8, type:'dmg',     min:42, max:56},
  holyray:{name:'ひかりの あらし',   mp:16,type:'dmgall',  min:42, max:56},
  luminaflare:{name:'ひかりの たいか',mp:26,type:'dmgall', min:74, max:98},
  judgment:{name:'ばんぶつの ひかり',mp:34,type:'dmg',  min:140,max:185},
  fullheal:{name:'ヒーガ',    mp:12,type:'heal',    min:95, max:135},
  healall:{name:'ヒールオール',  mp:16,type:'healall', min:50, max:70},
  goddess:{name:'ヒーラオール',mp:26,type:'healall', min:95, max:130},
  sanctuary:{name:'ヒージャ',mp:14,type:'heal', min:150,max:200},
  ret:{name:'リターン',           mp:8, type:'return'},
};
const CLASSES = {
  sora:  {name:'ソラ',  hp:16,mp:5,atk:5,def:3,agi:6, g:{hp:5,mp:3,atk:2,def:2,agi:1},
          learns:[{lv:2,key:'spark'},{lv:3,key:'heal'},{lv:6,key:'blaze'},{lv:9,key:'nova'},
                  {lv:14,key:'bolt'},{lv:21,key:'holyray'},{lv:30,key:'luminaflare'},
                  {lv:40,key:'judgment'}]},
  lumia: {name:'ルミア',hp:14,mp:8,atk:3,def:3,agi:5, g:{hp:4,mp:4,atk:1,def:2,agi:1},
          learns:[{lv:1,key:'heal'},{lv:4,key:'cure'},{lv:5,key:'hiheal'},{lv:10,key:'revive'},
                  {lv:16,key:'fullheal'},{lv:24,key:'healall'},{lv:33,key:'sanctuary'},
                  {lv:42,key:'goddess'}]},
  dan:   {name:'ダン',  hp:24,mp:0,atk:8,def:4,agi:4, g:{hp:7,mp:0,atk:3,def:2,agi:1}, learns:[]},
  // 第2章 バルド（しょうにん）：たいきゅうは リオンに ちかく、
  // こうげきは ひかえめ。かわりに MPが おおく、たびの じゅもんを はやく おぼえる。
  // 第3章 セナ（うらないし）：MPが おおく こうげき じゅもんの かなめ。たいきゅうは よわい。
  sena:  {name:'セナ',  hp:16,mp:12,atk:4,def:4,agi:7, g:{hp:5,mp:4,atk:2,def:2,agi:2},
          learns:[{lv:1,key:'spark'},{lv:3,key:'heal'},{lv:6,key:'ret'},
                  {lv:9,key:'blaze'},{lv:13,key:'cure'},{lv:17,key:'bolt'},{lv:21,key:'nova'},{lv:25,key:'boltja'}]},
  // 第3章 ルカ（おどりこ）：すばやく かいふくも できる。まもりが うすい。
  ruka:  {name:'ルカ',  hp:20,mp:16,atk:6,def:5,agi:11,g:{hp:6,mp:5,atk:3,def:2,agi:3},
          // ★じょばんから じゅもんを つかえる（おどりこ＝しえんやく）
          // ★かいふくは セナに まかせ、ルカは ほのおと しゅびさげに とくかする
          learns:[{lv:1,key:'ember'},{lv:3,key:'scorch'},{lv:5,key:'cure'},
                  {lv:7,key:'firedance'},{lv:9,key:'ret'},{lv:12,key:'flamestep'},
                  {lv:15,key:'meltdance'},{lv:19,key:'blazering'},
                  {lv:24,key:'scarletfan'},{lv:29,key:'inferno'}]},
  // 第4章 ゼフ（ろうけんじゃ）：ながねん つみかさねた ちしき。からだは おとろえて いる。
  zef:   {name:'ゼフ',  hp:22,mp:20,atk:5,def:5,agi:6, g:{hp:5,mp:6,atk:2,def:2,agi:2},
          learns:[{lv:1,key:'spark'},{lv:1,key:'heal'},{lv:3,key:'cure'},{lv:5,key:'scorch'},
                  {lv:7,key:'ret'},{lv:9,key:'blaze'},{lv:12,key:'hiheal'},
                  {lv:15,key:'bolt'},{lv:19,key:'nova'},{lv:24,key:'healall'}]},
  // 第4章 ミオ（けんじゃの でし）：こうげきも かいふくも つかえる。
  //   ゼフほど MPは ないが、まえに たてる だけの からだが ある。
  mio:   {name:'ミオ',  hp:24,mp:14,atk:6,def:6,agi:9, g:{hp:6,mp:5,atk:2,def:2,agi:3},
          learns:[{lv:1,key:'heal'},   {lv:3,key:'spark'},  {lv:5,key:'cure'},
                  {lv:7,key:'ret'},    {lv:9,key:'blaze'},  {lv:11,key:'hiheal'},
                  {lv:14,key:'nova'},  {lv:17,key:'bolt'},  {lv:20,key:'healall'},
                  {lv:22,key:'boltja'},                        // ★きりふだ
                  {lv:25,key:'fullheal'}, {lv:29,key:'holyray'}]},
  bald:  {name:'バルド',hp:19,mp:7,atk:6,def:5,agi:7, g:{hp:6,mp:3,atk:2,def:2,agi:2},
          learns:[{lv:3,key:'heal'},{lv:5,key:'ret'},{lv:8,key:'spark'},
                  {lv:12,key:'cure'},{lv:16,key:'hiheal'},{lv:20,key:'blaze'}]},
  lion:  {name:'リオン',hp:20,mp:4,atk:7,def:5,agi:6, g:{hp:6,mp:2,atk:3,def:2,agi:1},
          learns:[{lv:3,key:'heal'},{lv:6,key:'ret'},{lv:8,key:'spark'},
                  {lv:15,key:'blaze'},{lv:22,key:'bolt'}]},
};
const TACTICS = {manual:'めいれいさせろ', gungan:'ガンガンいこうぜ', inochi:'いのちだいじに'};

// ---------------- データ：敵（36しゅ＋ボス3けいたい） ----------------
const ENEMIES = [
  // ============ 第3章 ミナモ地方 じょばん（Lv1〜6）============
  // みなとの まわりに でる、ちいさな いそべの まもの。
  {key:'coralslime', name:'サンゴスライム', hp:23, atk:6,  def:4,  agi:6,  exp:6,  gold:6,  minLv:1},
  {key:'babycrab',   name:'こがにガニ',     hp:26, atk:7,  def:8,  agi:5,  exp:8,  gold:7,  minLv:1},
  {key:'seagull',    name:'いそウミネコ',   hp:21, atk:8,  def:3,  agi:14, exp:9,  gold:8,  minLv:2,
   skill:{p:0.24, mul:1.20, name:'きゅうこうか'}},
  // ============ 第3章 ミナモ地方 ちゅうばん（Lv6〜10）============
  {key:'seaslug',    name:'うみうしポン',   hp:38, atk:11, def:9,  agi:7,  exp:18, gold:15, minLv:5,
   inflict:{type:'slow', p:0.20}},
  {key:'reefeel',    name:'いわばウナギ',   hp:44, atk:14, def:8,  agi:16, exp:24, gold:20, minLv:6,
   skill:{p:0.26, mul:1.25, name:'まきつき'}},
  // ============ 第3章 ミナモ地方 せんよう（Lv10〜14）============
  // ヤドガニ：しゅびが たかく、からに こもる（ぼうぎょ）
  {key:'hermitcrab', name:'ヤドガニ',      hp:78, atk:19, def:24, agi:8,  exp:60, gold:58,
   minLv:9,  skill:{p:0.30, mul:0.6, name:'からに こもる'}},
  // ジャングルメン：やりで つき、なかまを よぶ
  {key:'junglemen',  name:'ジャングルメン', hp:68, atk:23, def:13, agi:14, exp:66, gold:62,
   minLv:10, skill:{p:0.32, mul:1.38, name:'やりの ひとつき'},
   call:{p:0.22, key:'junglemen', name:'なかまを よんだ！'}},
  // スティングレイ：かっくうして たいあたり、どくばりの しっぽ
  {key:'stingray',   name:'スティングレイ', hp:62, atk:22, def:11, agi:22, exp:63, gold:55,
   minLv:9,  skill:{p:0.30, mul:1.30, name:'たいあたり'},
   inflict:{type:'slow', p:0.26}},
  // レッドゲイター：かみつき・しっぽ。ちゅうきゅうの あばれもの
  {key:'redgator',   name:'レッドゲイター', hp:95, atk:27, def:16, agi:12, exp:78, gold:70,
   minLv:11, skill:{p:0.34, mul:1.42, name:'かみつき'},
   aoe:{p:0.16, lo:10, hi:15, name:'しっぽ なぎばらい'}},
  // ブラッドフラワー：あまいかおり（ねむり）・どくのこな・ツタ
  {key:'bloodflower',name:'ブラッドフラワー',hp:72, atk:20, def:14, agi:9,  exp:70, gold:64,
   minLv:10, skill:{p:0.28, mul:1.25, name:'ツタの むちうち'},
   aoe:{p:0.20, lo:9, hi:14, name:'どくのこな'},
   inflict:{type:'sleep', p:0.30}},
  // どくめんシャーマン：じゅじゅつと こんらん
  {key:'maskshaman', name:'どくめんシャーマン',hp:66,atk:18, def:12, agi:16, exp:74, gold:72,
   minLv:11, aoe:{p:0.26, lo:12, hi:18, name:'のろいの じゅもん'},
   inflict:{type:'confuse', p:0.30}},
  // トゲトカゲン：すばやく とびかかる
  {key:'spikelizard',name:'トゲトカゲン',   hp:80, atk:25, def:15, agi:24, exp:76, gold:68,
   minLv:11, skill:{p:0.34, mul:1.35, name:'とびかかり'},
   inflict:{type:'slow', p:0.24}},
  // どくクラゲル：しびれと どく
  {key:'poisonjelly',name:'どくクラゲル',   hp:58, atk:17, def:10, agi:13, exp:58, gold:52,
   minLv:9,  aoe:{p:0.22, lo:8, hi:13, name:'しびれの しょくしゅ'},
   inflict:{type:'slow', p:0.34}},
  // === ティア1：のはら（Lv1-6） ===
  {key:'greenslime', minLv:1,  name:'グリーンスライム', hp:22, atk:6,  def:4,  agi:6,  exp:5,   gold:5},
  // ---- ヴェルサ地方（こおりの まもの）----
  {key:'icicleslime', minLv:1, name:'つららスライム',   hp:24, atk:6,  def:5,  agi:6,  exp:6,   gold:6,
   spell:{kind:'dmg', p:0.26, lo:5, hi:9, name:'つめたい しずく'}},
  {key:'frostbat', minLv:4,    name:'フロストバット',   hp:28, atk:7,  def:5,  agi:13, exp:9,   gold:8,
   skill:{p:0.28, mul:1.15, name:'こおりの つばさ'}, inflict:{type:'freeze', p:0.18}},
  {key:'yukingon', minLv:3,    name:'ゆきんこゴン',     hp:36, atk:10, def:7,  agi:5,  exp:12,  gold:11,
   skill:{p:0.34, mul:1.35, name:'ゆきだま'}},
  {key:'blizzardhawk', minLv:4, name:'ブリザードホーク', hp:34, atk:10, def:6,  agi:15, exp:14,  gold:12,
   aoe:{p:0.30, lo:7, hi:12, name:'つめたい つばさ'}},
  {key:'frostmermaid', minLv:6, name:'フロストマーメイド', hp:44, atk:12, def:8, agi:11, exp:24, gold:22,
   spell:{kind:'dmg', p:0.30, lo:11, hi:17, name:'こおりの うた'},
   spellInflict:{type:'sleep', p:0.32},
   skill:{p:0.26, mul:1.15, name:'こごえる まなざし'},
   inflict:{type:'slow', p:0.38}},
  {key:'flameslime', minLv:2,  name:'フレイムスライム', hp:30, atk:8,  def:5,  agi:6,  exp:7,   gold:7,
   spell:{kind:'dmg', p:0.26, lo:6, hi:10, name:'ひのたま'}},
  {key:'hoimislime', minLv:1,  name:'ホイミスライム',   hp:20, atk:6,  def:5,  agi:7,  exp:9,   gold:8,
   spell:{kind:'heal', p:0.22, lo:7, hi:11, name:'いやしの ひかり'}},
  {key:'drakybat', minLv:1,    name:'ドラキーバット',   hp:24, atk:7,  def:4,  agi:12, exp:17,   gold:12},
  {key:'madrock', minLv:3,     name:'マドロック',       hp:34, atk:9,  def:8,  agi:3,  exp:24,  gold:17},
  {key:'mandragora', minLv:4,  name:'マンドラゴラ',     hp:32, atk:9,  def:6,  agi:5,  exp:26,  gold:19,
   skill:{p:0.30, mul:1.05, name:'きょうきの さけび'}, inflict:{type:'sleep', p:0.35}},
  {key:'thornwolf', minLv:6,   name:'いばらウルフ',     hp:45, atk:12, def:8,  agi:11, exp:31,  gold:21,
   skill:{p:0.32, mul:1.45, name:'とげとげアタック'}},
  {key:'hornet', minLv:3,      name:'エレキホーネット', hp:35, atk:10, def:6,  agi:14, exp:29,  gold:19,
   spell:{kind:'dmg', p:0.32, lo:9, hi:14, name:'でんげき'}},
  {key:'metalslime', minLv:5,  name:'メタルスライム',   hp:20, atk:8,  def:14, agi:18, exp:120, gold:80,
   fleeP:0.58, tough:true},
  // === ティア2：どうくつB1（Lv6-12） ===
  {key:'wisp',        name:'ウィスプ',         hp:45, atk:14, def:8,  agi:16, exp:56,  gold:50,
   spell:{kind:'dmg', p:0.38, lo:14, hi:20, name:'ひとだま', minLv:8}},
  {key:'skeleton',    name:'スケルトン',       hp:58, atk:16, def:11, agi:9,  exp:44,  gold:40,
   skill:{p:0.30, mul:1.35, name:'ほねの いちげき', minLv:7}},
  {key:'ghostlamp',   name:'ゴーストランプ',   hp:50, atk:15, def:9,  agi:8,  exp:48,  gold:54,
   skill:{p:0.34, mul:1.10, name:'まどろみの ほのお', minLv:7}, inflict:{type:'sleep', p:0.40}},
  {key:'skullbat',    name:'どくろバット',     hp:55, atk:18, def:9,  agi:15, exp:52,  gold:45,
   skill:{p:0.36, mul:1.25, name:'かみつき', minLv:9}, drain:0.55},
  {key:'mushmage',    name:'マッシュメイジ',   hp:62, atk:15, def:10, agi:8,  exp:61,  gold:60,
   spell:{kind:'dmg', p:0.34, lo:16, hi:23, name:'ほうしの まい', minLv:9}, inflict:{type:'confuse', p:0.28}},
  {key:'armycrab',    name:'ぐんたいガニ',     hp:70, atk:20, def:15, agi:7,  exp:58,  gold:56,
   skill:{p:0.38, mul:1.40, name:'かにばさみ', minLv:10}},
  {key:'merman',      name:'バブルマーマン',   hp:75, atk:21, def:12, agi:10, exp:65,  gold:65,
   spell:{kind:'dmg', p:0.32, lo:18, hi:26, name:'バブルショット', minLv:11}, inflict:{type:'confuse', p:0.30}},
  {key:'mimic',       name:'ミミック',         hp:85, atk:24, def:14, agi:6,  exp:67,  gold:161,
   skill:{p:0.40, mul:1.50, name:'まるのみ', minLv:12}, drain:0.35},
  {key:'golem',       name:'ストーンゴーレム', hp:110,atk:22, def:18, agi:4,  exp:48,  gold:56,
   skill:{p:0.34, mul:1.45, name:'ぶんまわし'}},
  // === ティア3：どうくつB2（Lv12-18） ===
  {key:'darkpriest',  name:'ダークプリースト', hp:110,atk:24, def:15, agi:10, exp:70,  gold:102,
   spell:{kind:'heal', p:0.38, lo:45, hi:65, name:'くらき いやし'}},
  {key:'tornado',     name:'ふうじんトルネコア', hp:120,atk:26,def:16, agi:14, exp:62,  gold:88,
   aoe:{p:0.42, lo:16, hi:24, name:'たつまき'}},
  {key:'bloodwolf',   name:'ブラッドウルフ',   hp:120,atk:29, def:15, agi:16, exp:76,  gold:105,
   skill:{p:0.36, mul:1.40, name:'きゅうけつの きば'}, drain:0.5},
  {key:'killerpanther',name:'キラーパンサー',  hp:115,atk:31, def:14, agi:19, exp:80,  gold:112,
   acts:2},
  {key:'icephoenix',  name:'アイスフェニックス', hp:115,atk:27,def:14, agi:16, exp:75,  gold:110,
   aoe:{p:0.38, lo:18, hi:26, name:'こおりの つばさ'}},
  {key:'shadowmimic', name:'シャドウミミック', hp:130,atk:29, def:18, agi:8,  exp:78,  gold:255,
   skill:{p:0.40, mul:1.55, name:'やみの あぎと'}, drain:0.4},
  {key:'devilknight', name:'デビルナイト',     hp:135,atk:30, def:21, agi:11, exp:82,  gold:119,
   skill:{p:0.36, mul:1.45, name:'まけんの いちげき'}},
  {key:'blazedragon', name:'ブレイズドラゴン', hp:150,atk:31, def:19, agi:9,  exp:88,  gold:128,
   aoe:{p:0.36, lo:20, hi:30, name:'ほのおの いき'}},
  {key:'stonecyclops',name:'ストーンサイクロプス', hp:140,atk:30,def:20,agi:5, exp:72,  gold:105,
   skill:{p:0.35, mul:1.55, name:'いわなげ'}},
  {key:'orcking',     name:'オークキング',     hp:160,atk:33, def:20, agi:7,  exp:92,  gold:136,
   skill:{p:0.38, mul:1.50, name:'おうのいちげき'}},
  // === ティア4：どうくつB3（Lv18-25） ===
  {key:'shadowassassin',name:'シャドウアサシン', hp:148,atk:35,def:20, agi:22, exp:155, gold:216,
   acts:2, skill:{p:0.30, mul:1.35, name:'あんさつけん'}},
  {key:'icephoenixlord',name:'アイスフェニックスロード', hp:164,atk:31,def:22,agi:18, exp:165, gold:232,
   aoe:{p:0.40, lo:26, hi:36, name:'ひょうがの あらし'}},
  {key:'deathbishop', name:'デスビショップ',   hp:160,atk:31, def:24, agi:12, exp:170, gold:240,
   spell:{kind:'heal', p:0.34, lo:70, hi:100, name:'しの いのり'},
   aoe:{p:0.26, lo:24, hi:32, name:'じゃあくな みことば'}},
  {key:'darkguard',   name:'ダークガード',     hp:172,atk:32, def:30, agi:12, exp:160, gold:224,
   skill:{p:0.36, mul:1.45, name:'こくえんの いちげき'}},
  {key:'demonlord',   name:'デーモンロード',   hp:189,atk:34, def:26, agi:13, exp:170, gold:240,
   aoe:{p:0.30, lo:24, hi:34, name:'あんこくの は'},
   skill:{p:0.30, mul:1.45, name:'まおうの つめ'}},
  {key:'firedragon',  name:'ファイアドラゴン', hp:205,atk:36, def:25, agi:11, exp:185, gold:256,
   aoe:{p:0.38, lo:28, hi:40, name:'しゃくねつの いき'}},
  {key:'bluecyclops', name:'ブルーサイクロプス', hp:197,atk:37,def:27, agi:7,  exp:175, gold:240,
   skill:{p:0.38, mul:1.55, name:'こんぼう たたき'}},
  {key:'madcyclops',  name:'マッドサイクロプス', hp:213,atk:37,def:28, agi:6,  exp:180, gold:240,
   skill:{p:0.36, mul:1.60, name:'どくの こぶし'}, inflict:{type:'confuse', p:0.25}},
];
// ============ ルミナクエストIの まもの（5章 きゅうたいりく じょばん） ============
const ENEMIES_LQ1 = [
  {key:'puyo',   name:'プヨプヨ',       hp:8,  atk:4,  def:2, agi:4,  exp:3,  gold:4,  minLv:1},
  {key:'goblin', name:'ゴブリン',       hp:13, atk:7,  def:3, agi:6,  exp:8,  gold:10, minLv:1},
  {key:'bat',    name:'おおコウモリ',   hp:11, atk:6,  def:2, agi:9,  exp:7,  gold:9,  minLv:1},
  {key:'thief',  name:'やとう',         hp:17, atk:9,  def:4, agi:10, exp:14, gold:20, minLv:3},
  {key:'skel',   name:'ガイコツけんし', hp:24, atk:13, def:7, agi:4,  exp:26, gold:30, minLv:5},
];
ENEMIES_LQ1.forEach(e=>ENEMIES.push(e));

// ============ 終章 ゆめのたいりく（Lv21〜26） ============
const ENEMIES_CH6 = [
  {key:'yumewisp',   name:'ゆめの ひだま',   hp:150,atk:38, def:22, agi:26, exp:185, gold:55,  minLv:1},
  {key:'sleepknight',name:'ねむりの きし',   hp:215,atk:46, def:30, agi:18, exp:235, gold:75,  minLv:1,
   inflict:{type:'sleep', p:0.18}},
  {key:'voidgolem',  name:'こくうの ゴーレム', hp:285,atk:50, def:34, agi:8,  exp:275, gold:88,  minLv:1,
   skill:{p:0.34, mul:1.5, name:'こくうの てっつい'}},
  {key:'nightpriest',name:'あくむの しさい', hp:180,atk:42, def:24, agi:22, exp:225, gold:70,  minLv:1,
   inflict:{type:'confuse', p:0.16}},
  {key:'echoshadow', name:'こだまの かげ',   hp:190,atk:50, def:26, agi:30, exp:245, gold:80,  minLv:1},
  {key:'dreamdragon',name:'ゆめの りゅう',   hp:330,atk:54, def:30, agi:20, exp:335, gold:112, minLv:1,
   aoe:{p:0.34, lo:30, hi:42, name:'ゆめの ほのお'}},
];
ENEMIES_CH6.forEach(e=>ENEMIES.push(e));

const MIDBOSS = {
  // ---- 第1章ボス ----
  // 第3章 ちゅうボス「ぬしヤドガニ」：いそべの ぬし。
  // しゅびが たかく、こもると ダメージが とおらない。ぼうぎょを くずして たたく。
  nushicrab:{key:'nushicrab', name:'ぬしヤドガニ', hp:180, atk:18, def:23, agi:7, acts:1,
    exp:150, gold:180, art:'nushicrab',
    skill:{p:0.28, mul:1.30, name:'はさみうち'},
    aoe:{p:0.16, lo:6, hi:10, name:'すなけむり'}},
  // 第5章 ボス「ゆめの ぬし」：むらを のみこんだ きりの ぬし。
  // 第5章めぐり「よっつの かけら」：かくちの あくむの すがたを うつした かげ
  shardhound:{key:'shardhound', name:'かけらの ばんけん', hp:520, atk:38, def:19, agi:16, acts:1,
    exp:800, gold:420, art:'yumebanken',
    skill:{p:0.31, mul:1.32, name:'ゆめを かみくだく'},
    aoe:{p:0.21, lo:15, hi:21, name:'しろき とおぼえ'},
    inflict:{type:'sleep', p:0.23}},
  shardgolem:{key:'shardgolem', name:'かけらの ねむりぬし', hp:900, atk:49, def:25, agi:12, acts:1,
    exp:1000, gold:520, art:'golem',
    skill:{p:0.35, mul:1.45, name:'すなの てっつい'},
    aoe:{p:0.24, lo:22, hi:29, name:'ねむりの すなあらし'},
    inflict:{type:'sleep', p:0.24}},
  shardsis:{key:'shardsis', name:'かけらの しまい', hp:940, atk:46, def:23, agi:20, acts:2,
    exp:1250, gold:600, art:'sisA',
    skill:{p:0.29, mul:1.28, name:'ゆめうつしの まい'},
    aoe:{p:0.22, lo:20, hi:27, name:'しおの さかまき'},
    inflict:{type:'confuse', p:0.19}},
  shardeater:{key:'shardeater', name:'ゆめくいの つかい', hp:1080, atk:46, def:25, agi:18, acts:2,
    exp:1600, gold:750, art:'regretshadow',
    skill:{p:0.31, mul:1.32, name:'ゆめを すする'},
    aoe:{p:0.23, lo:21, hi:29, name:'くろい こだま'},
    inflict:{type:'sleep', p:0.21}, drain:0.16},
  dknight:{key:'dknight', name:'デスナイト', hp:74, atk:14, def:8, agi:6, acts:1,
    exp:100, gold:150, art:'dknight',
    skill:{p:0.28, mul:1.38, name:'やみの ひとふり'}},
  dreameater_a:{key:'dreameater_a', name:'ゆめくい', hp:1400, atk:51, def:28, agi:20, acts:2,
    exp:2400, gold:1000, art:'regretshadow',
    skill:{p:0.32, mul:1.36, name:'ゆめを くらう'},
    aoe:{p:0.24, lo:25, hi:34, name:'あんこくの なみ'},
    inflict:{type:'sleep', p:0.22}, drain:0.15},
  dreameater_b:{key:'dreameater_b', name:'ゆめくい・しんのすがた', hp:1620, atk:58, def:30, agi:22, acts:2,
    exp:3200, gold:1400, art:'dreamlord',
    skill:{p:0.34, mul:1.4, name:'おわらない あくむ'},
    aoe:{p:0.27, lo:30, hi:40, name:'むの こだま'},
    inflict:{type:'confuse', p:0.19}, drain:0.2},
  dreamlord:{key:'dreamlord', name:'ゆめの ぬし', hp:270, atk:25, def:16, agi:18, acts:1,
    exp:520, gold:340, art:'dreamlord',
    skill:{p:0.32, mul:1.35, name:'まどろみの て'},
    aoe:{p:0.22, lo:14, hi:20, name:'しろい きり'},
    inflict:{type:'sleep', p:0.28}},
  // 第4章 ちゅうボス「ゆきの ぬしがみ」：こやを あらし、かぎを うばった けもの。
  snowbeast:{key:'snowbeast', name:'ひとつめの あらくれ', hp:400, atk:37, def:18, agi:15, acts:1,
    exp:420, gold:300, art:'snowbeast',
    skill:{p:0.32, mul:1.35, name:'こんぼうの ひとふり'},
    aoe:{p:0.20, lo:12, hi:18, name:'あばれ まわり'},
    inflict:{type:'freeze', p:0.24}},
  // 第4章 ボス「こうかいの かげ」：ゼフの けんきゅうが うんだ、みずからの こうかい。
  regretshadow:{key:'regretshadow', name:'こうかいの かげ', hp:700, atk:58, def:20, agi:17, acts:1,
    exp:900, gold:520, art:'regretshadow',
    skill:{p:0.32, mul:1.40, name:'あの ひの こえ'},
    aoe:{p:0.22, lo:16, hi:24, name:'とりかえせぬ とき'},
    inflict:{type:'confuse', p:0.26}},
  // 第3章 ちゅうボス「まどろみの しもべ」：しまいの かげに つかえる じゅじゅつし。
  //   ナギサに ついた ころに たたかう（Lv9そうてい）。
  dreamwarlock:{key:'dreamwarlock', name:'まどろみの しもべ', hp:280, atk:30, def:12, agi:18, acts:1,
    exp:260, gold:210, art:'dreamwarlock',
    skill:{p:0.30, mul:1.30, name:'つえの いちげき'},
    aoe:{p:0.20, lo:9, hi:14, name:'ねむりの まじない'},
    inflict:{type:'sleep', p:0.28}},
  // 第3章 そうしボス「しまいの かげ」：ねえと いもうとの 2たい。
  // かたほうを たおしても、もういっぽうが いきていれば よみがえる。
  shadowsis_a:{key:'shadowsis_a', name:'あねの かげ', hp:275, atk:33, def:16, agi:16, acts:1,
    exp:520, gold:300, art:'sisA',
    skill:{p:0.28, mul:1.32, name:'ゆめの つめ'},
    aoe:{p:0.20, lo:13, hi:19, name:'ふたりの うたごえ'},
    inflict:{type:'sleep', p:0.26}},
  shadowsis_b:{key:'shadowsis_b', name:'いもうとの かげ', hp:240, atk:29, def:14, agi:20, acts:1,
    exp:480, gold:280, art:'sisB',
    skill:{p:0.26, mul:1.25, name:'ゆめの まなざし'},
    aoe:{p:0.18, lo:11, hi:16, name:'ふたりの うたごえ'},
    inflict:{type:'slow', p:0.30}},
  sandsleeper:{key:'sandsleeper', name:'すなの ねむりぬし', hp:240, atk:25, def:15, agi:14, acts:1,
    exp:600, gold:400, art:'golem',
    skill:{p:0.30, mul:1.35, name:'すなの きば'},
    aoe:{p:0.22, lo:14, hi:21, name:'すなの うず'},
    inflict:{type:'sleep', p:0.30}},
  yumebanken:{key:'yumebanken', name:'ゆめの ばんけん', hp:160, atk:15, def:8, agi:10, acts:1,
              exp:200, gold:180,
              skill:{p:0.32, mul:1.34, name:'ゆめを かみくだく'},
              aoe:{p:0.20, lo:8, hi:13, name:'とおぼえ'},
              inflict:{type:'sleep', p:0.28}},
  desgran1:{key:'desgran1', name:'まおう デスグラン', hp:500, atk:43, def:28, agi:14, acts:2,
            exp:0, gold:0,
            aoe:{p:0.26, lo:26, hi:36, name:'ダークフレア'},
            skill:{p:0.30, mul:1.35, name:'まじんの つえ'}},
  desgran2:{key:'desgran2', name:'デスグラン・おんねんのすがた', hp:580, atk:48, def:26, agi:17, acts:2,
            exp:0, gold:0,
            aoe:{p:0.34, lo:30, hi:42, name:'おんねんの ほのお'},
            inflict:{type:'confuse', p:0.24}},
  desgran3:{key:'desgran3', name:'デスグラン・まじんのすがた', hp:750, atk:51, def:30, agi:15, acts:2,
            exp:4000, gold:3000,
            aoe:{p:0.36, lo:30, hi:44, name:'ぜつぼうの まなざし'},
            skill:{p:0.28, mul:1.40, name:'むすうの しょくしゅ'},
            inflict:{type:'sleep', p:0.20}},
};
// ★マップごとの けいけんち ばいりつ。
//   「2かいは かせぎば」など、ばしょに やくわりを もたせる。
const EXP_MUL = {
  elde_tower2: 1.6,      // とう2かい：かせぎば（けいけんちが おおい）
};
// ★しょうべつの でかた（きょうつう byMap より ゆうせん）。5章の めぐりで つかう
const byMapCh = {
  // ★'5:world' は おかない。ワールドは encZones（ちたいべつ）が ただしい。
  //   5章は Lv1で はじまるため、ここを つよい てきで うわがきすると そくしぬ。
  '5:versa_dgn1':  ['icephoenix','bloodwolf','skeleton','ghostlamp','golem','wisp'],
  '5:versa_dgn2':  ['icephoenixlord','shadowassassin','darkguard','icephoenix','bloodwolf'],
  '5:zaal_dgn1':   ['golem','tornado','darkpriest','shadowmimic','killerpanther'],
  '5:zaal_dgn2':   ['darkguard','demonlord','shadowassassin','shadowmimic','tornado'],
  '5:minamo_rock': ['merman','tornado','darkpriest','killerpanther','ghostlamp'],
  '5:minamo_dgn0': ['merman','tornado','darkpriest','killerpanther','mushmage'],
  '5:minamo_dgn1': ['deathbishop','shadowassassin','tornado','demonlord','merman'],
  '5:minamo_dgn2': ['deathbishop','demonlord','shadowassassin','darkguard','firedragon'],
};
const byMap = {
  old_road: ['puyo','goblin','bat','thief'],
  // ============ 終章 ゆめのたいりく ============
  dream_field: ['yumewisp','sleepknight','nightpriest','echoshadow','voidgolem'],
  dream_cast1: ['sleepknight','voidgolem','nightpriest','echoshadow','yumewisp'],
  dream_cast2: ['voidgolem','echoshadow','sleepknight','dreamdragon','nightpriest'],
  dream_cast3: ['dreamdragon','voidgolem','echoshadow','sleepknight'],
  // ---- 第1章 ヴェルサ地方（リオン単独・Lv1〜6）----
  elde_path:  ['icicleslime','frostbat','blizzardhawk','yukingon','skullbat','wisp'],   // Lv14〜17
  elde_path2: ['blizzardhawk','frostbat','yukingon','skullbat','thornwolf','wisp'],   // Lv12〜15
  elde_tower: ['skeleton','ghostlamp','mushmage','maskshaman','spikelizard','wisp'],    // Lv16〜19
  elde_tower2:['spikelizard','maskshaman','skeleton','redgator','mimic','ghostlamp'],  // Lv17〜20（けいけんちが おおい）
  elde_top:   ['redgator','spikelizard','mimic','skeleton','bloodflower','junglemen'],  // Lv19〜22
  minamo_rock: ['seaslug','reefeel','babycrab','seagull','coralslime'],            // いそべ+                        // Lv1〜6
  minamo_dgn0: ['poisonjelly','stingray','hermitcrab','junglemen','armycrab','reefeel'], // しまなみ+
  minamo_dgn1: ['bloodflower','junglemen','redgator','spikelizard','merman','armycrab'],  // おきあい+
  minamo_dgn2: ['redgator','spikelizard','mimic','merman','bloodflower','armycrab'],     // さいきょう
  zaal_dgn1:   ['skeleton','ghostlamp','skullbat','wisp','hornet','mushmage'],        // Lv8〜12
  zaal_dgn2:   ['mushmage','armycrab','merman','skullbat','mimic','metalslime'],      // Lv11〜15
  versa_dgn1:  ['icicleslime','frostbat','yukingon','blizzardhawk'],        // Lv3〜5
  versa_dgn2:  ['yukingon','blizzardhawk','frostmermaid','thornwolf','metalslime'],// Lv5〜7
  cave1:['wisp','skeleton','ghostlamp','skullbat','mushmage','armycrab','merman','mimic','golem'],
  cave2:['darkpriest','tornado','bloodwolf','killerpanther','icephoenix','shadowmimic',
         'devilknight','blazedragon','stonecyclops','orcking'],
  cave3:['shadowassassin','icephoenixlord','deathbishop','darkguard','demonlord','firedragon',
         'bluecyclops','madcyclops'],
};

// ---------------- データ：マップ ----------------
// 共通タイル: _ ゆか / # かべ / f き / w みず / r みち / o いわ
//   I やどや / P きょうかい / S みせ / D とびら(ワープ) / n むらびと
//   t たいまつ / C たからばこ / > した階段 / < うえ階段 / B ボス
const MAPS = {
  // ============ ワールドマップ（5ちほう＋ちゅうおうかい）============
  // ~ うみ / _ すなはま / . くさち / , しげみ / = ゆきげん / : さばく / ^ やま / w みずうみ
  // r かいどう / A おうと / V むら / X どうくつ / Q まだ いけない まち
  old_road:{name:'かいどうの みはりだい', theme:'village', enc:true, tiles:[
    "###############",
    "#f..f.....f..f#",
    "#....o.B.o....#",
    "#.....rrr.....#",
    "#..C..r.r..f..#",
    "#f....r.r.....#",
    "#.....r.r...C.#",
    "#..f..r.r..f..#",
    "#.....rrr.....#",
    "#f....r....f..#",
    "#######r#######"],
    warpsXY:{
      '7,10':{to:'world', x:49, y:41}
    }},
  // ============ 終章：ゆめのたいりく（3D） ============
  dream_field:{name:'ゆめのたいりく', theme:'dream', enc:true, tiles:[
    "##########################",
    "#####..f....##....f..#####",
    "###...o......<.......o.###",
    "##..f....rrrrrrrr....f..##",
    "#....o...r......r...o....#",
    "#..f.....r..CC..r.....f..#",
    "#........r......r........#",
    "#..o..rrrr..oo..rrrr..o..#",
    "#.....r....f..f....r.....#",
    "##....r..o......o..rrrrr##",
    "###...r....f..f........###",
    "####..r......~.....r..####",
    "#####.rrrrrrrrrrrrrr.#####",
    "######....f....f....######",
    "#######..o......o..#######",
    "########....rr....########",
    "#########...rr...#########",
    "##########################"],
    warpsXY:{
      '13,2':{to:'dream_cast1', x:8, y:12},
      '24,9':{to:'dream_camp',  x:1,  y:5}
    }},
  dream_camp:{name:'ばんにんの いおり', theme:'dream', tiles:[
    "##############",
    "#..o......o..#",
    "#....rrrr....#",
    "#..n.r..r.W..#",
    "#....r..r....#",
    ".rrrrr..rrrr.#",
    "#....r..r....#",
    "#..S.r..r.n..#",
    "#....rrrr....#",
    "#..o..CC..o..#",
    "##############"],
    warpsXY:{
      '0,5':{to:'dream_field', x:24, y:9}
    }},
  dream_cast1:{name:'さかさのしろ 1かい', theme:'castle', enc:true, tiles:[
    "##################",
    "#T..............T#",
    "#.....C....C.....#",
    "#..#####..#####..#",
    "#..#..........#..#",
    "#..#..##..##..#..#",
    "#T.#..#....#..#.T#",
    "#..#..#.<..#..#..#",
    "#..#..######..#..#",
    "#..#..........#..#",
    "#..####....####..#",
    "#T...............#",
    "#........>.......#",
    "##################"],
    warpsXY:{
      '8,12':{to:'dream_field', x:13, y:3},
      '8,7':{to:'dream_cast2', x:8, y:11}
    }},
  dream_cast2:{name:'さかさのしろ 2かい', theme:'castle', enc:true, tiles:[
    "##################",
    "#....T......T....#",
    "#..C..........C..#",
    "#....######......#",
    "#....#....#..#####",
    "#.<..#.T..#......#",
    "#....#....#####..#",
    "######....#......#",
    "#.........#..#####",
    "#..#####..#......#",
    "#..#...........T.#",
    "#..#....>........#",
    "#T.###############",
    "##################"],
    warpsXY:{
      '2,5':{to:'dream_cast3', x:8, y:11},
      '8,11':{to:'dream_cast1', x:8, y:8}
    }},
  dream_cast3:{name:'さかさのしろ さいじょうかい', theme:'castle', enc:true, tiles:[
    "##################",
    "#T......K......T##",
    "#.......B........#",
    "#..T.........T...#",
    "#.....#....#.....#",
    "#.....#....#.....#",
    "#..#..#....#..#..#",
    "#..#..........#..#",
    "#..#..T....T..#..#",
    "#..#..........#..#",
    "#.....#....#.....#",
    "#T......>.......T#",
    "#.......<........#",
    "##################"],
    warpsXY:{
      '8,11':{to:'dream_cast2', x:2, y:6},
      '8,12':{to:'dream_core', x:6, y:8}
    }},
  dream_core:{name:'ゆめの しんいん', theme:'castle', tiles:[
    "#############",
    "#T....K....T#",
    "#....n.n....#",
    "#...........#",
    "#..T.....T..#",
    "#...........#",
    "#.....n.....#",
    "#..T.....T..#",
    "#.....>.....#",
    "#############"],
    warpsXY:{
      '6,8':{to:'dream_cast3', x:8, y:11}
    }},
  world:{name:'ヴェルサちほう',theme:'world',enc:true,encRate:0.05,encGrace:6,tiles:[
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~______~~~~~~~~~~_____~~===^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~__======__~~~~~~__=====_~====^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~_=========______========_====^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~_==============================^^^^^~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~_===============C=============^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~_========,======,=========,=====^^^^^~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~_==,=====,======,===============^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~_======w,======A==========,======^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~_==C==wwwww==,==r=======,=========^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~________=====,wwwwww====r====n==========^^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~_====,======,=,wwwww=====t=========,=C,===^^^^^^^~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~_=========,======www==,===r==,============^^^^^^^=___~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~_=========,===============r===========,===^^^^^^^===_~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~_===============.Vrrrrtrrrrrrrtrrrr=====^^^^^^^^^===_~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~_=================,===,===========rwww=,^^^^^^^^^===_~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~_==========,============n=========wwwww==^^^^^^^====__~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~__======,=========================.wwww==^^^^^^^==____~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~________=,=================,===.Xrrrrr=^^^^^^^==..__~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~__=,,======C======,==,====w=====^^^^^^^=..__~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~__==,====,=====,=====,=====,^^^^^^^^^=..__~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~__=============__========_^^^^^^^^^=..__~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~_=====__...._~~____==__~=^^^^^^^==..__~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^===^~~^^^^^~~~~~~^^~~~=^^^^^^^==..__~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~___~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^rrr___~~~~~~~~~~~~~~~",
    "~~~~~~__...__~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~_______~~~~~~^^^^^^^^^^^^^^^:r::::___~~~~~~~~~~~~",
    "~~~___......._~~~~~~~~~~~~~~~~~~~~~~__~~~~~~~~_......._~~~~~^^^^^^^^^^^^^^^:r:::::::___~~~~~~~~~",
    "~~_.......,..._~~~~~~~~~~~~~~~~~~~__..~~______.........__~~~^^^^^^^^^^^^^^^:r::::::::::______~~~",
    "~~_............_~~~~~~~~~~_~~~~~~_,.,.__........,......._~~~^^^^^^^^^^^^^^^:r::::::::::::::::__~",
    "~~~_.....A......_~~~~~~~~~_~~~~__..,.._........,.,......._~~^^^^^^^^^^^^^^^:r::::::::::::^:::::_",
    "~~~~_.,........._~~~~~~~~~.^~~_,,.....~__.......A........._~^^^^^^^^^^^^^^^:r:::::^::::::::^::::",
    "~~~~~_.....^^^^^.____~~~~~.^^^........~~~_................._^^^^^^^^^^^^^^^:r:::::::::::::::::::",
    "~~~~_..,.^^^^^^^^^..._~~~~.^~^..,.....~~~~_..........,....._^^^^^^^^^^^^^^^:rrrrA:::^:::::::::::",
    "~~~~_...^^^^^^^^^^^..._~~~.^^^.....,..~~~~_.........._______^^^^^^^^^^^^^^^:::::r::^::::^:^:::::",
    "~~~_...^^^^^^^^^^^^^.._~~~.^^^._......~~~_....,....._^^^^^^^^^^^^^^^^^^^^^^::^::r:::.::::::::::_",
    "~~~~_..^^^^^^^^^^^^^.._~~~.^^^_~_,..,.~~~_........._^^^^^^^^^^^^^^^^^^^^^^^rrrrrr::::::::::^::_~",
    "~~~~_.^^^^^^^^^^^^^^^.._~~.^^^_~~_....~~~~_.,....._^^^^^^^^^^^^^^^^^^^^^^^^r^rrrr:::::::::::::_~",
    "~~~_...^^^^^^^^^^^^^...._~_^^^_~~_,..,~~~_......._^^^^^^^^^^^^^^^^^^^^^^^^^::::^r:::::::^:^::_~~",
    "~~_..,.^^^^^^^^^^^^^...._~~~~~~~~~_.,.~~~~_......._^^^^^^^^^^^^^^^^^^^^^^^^:::::r:::^::::::::_~~",
    "~~_.....^^^^^^^^^^^......_~~~~~~~~_,..~~~~_........_^^^^^^^^^^^^^^^^^^^^^^^::wwwr:::::::::::^_~~",
    "~~_.,.X.,^^^^^^^^^......._~~~~~~~~_.,.~~~~~_.....X.._^^^^^^^^^^^^^^^^^^^^^^:wwwwrrrrrrV:::^::_~~",
    "~~~_.......^^^^^........._~~~~~~~~_...~~~~~~_........_______^^^^^^^^^^^^^^^::www:::::::::::::_~~",
    "~~~_....................._~~~~~~~~_...~~~~~~_......,......._^^^^^^^^^^^^^^.::ww::::::::::::::_~~",
    "~~~~_...................._~~~~~~~~_..,~~~~~~_.......,......_^^^^^^^^^^^^^..::::^::::^::::::::_~~",
    "~~~~~_......,.......X...__~~~~~~~~_...~~~~~~_.............._^^^^^^^^^^^^^^.:::::::::::::::::_~~~",
    "~~~~~_,........,......__~~~~~~~~~~~_..~~~~~~_...........__._^^^^^^^^^^^^^^^:::::::::::______~~~~",
    "~~~~~~_.....___......_~~~~~~~~~~~~~~__~~~~~~_......,..__~~__^^^^^^^^^^^^^^^:::::^::___~~~~~~~~~~",
    "~~~~~~__..._~~~_....._~~~~~~~~~~~~~~~~~~~~~~_........_~~~~~~^^^^^^^^^^^^^^^_::::___~~~~~~~~~~~~~",
    "~~~~~~~~___~~~~~_...._~~~~~~~~~~~~~~~~~~~~~~~__....__~~~~~~~^^^^^^^^^^^^^^^~____~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~_..._~~~~~~~~~~~~~~~~~~~~~~~~.X___~~~~~~~~~^^^^^^^^^^^^^^^~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~...~~~~~~~~~~~~~~~~~~~~~~~~~~.~~~~~~~~~~~~~~~~....~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~______~~~~~~~~_______~~~~___~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~_..,..._~~~~~~~_....._~~~_..._~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~_____........__~~~~~_......_~_.....____~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~___.X..,....,._~~~~~_......._........_~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~_...,......._~~~~~_.............__~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~_,..........._~~~~~_..........__~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~____....,.A..,..._~~~~~,....V...._~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~_......,........_~~~~~_..........____~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~_..............._~~~~~j.............._~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~_.............._~~~~~_..............._~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~_.........,_.,_~~~~~_......,........_~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~_......,._~__~~~~~_..,............,_~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~_...,.,.._~~~~~~~~_..X...........,._~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~_......._~~~~~~~~~_...........,..._~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~_..__.._~~~~~~~~~~_...........,,...___~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~___~~__~~~~~~~~~~~_......_............_~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~_....._~_..X......____~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~_....._~~_....,.._~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~_...,._~_........_~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~_....._........._~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
  ], warps:{}, warpsXY:{
    '48,8': {to:'versa_town',  x:13, y:18},
    '39,14':{to:'versa_town2', x:10, y:13},
    '56,18':{to:'versa_dgn1',  x:9,  y:14},
    '80,32':{to:'zaal_town',   x:14, y:18},
    '86,40':{to:'zaal_oasis',  x:9,  y:12},
    '74,42':{to:'zaal_dgn1',   x:8,  y:13},
    '48,30':{to:'toros', x:7,  y:13},
    '47,49':{to:'cave1', x:6,  y:10},
    '49,40':{to:'old_road', x:7, y:9},

    '9,29':{to:'elde_town',  x:12, y:16},
    '6,40':{to:'elde_path',  x:10, y:12},
    '20,44':{to:'elde_tower', x:9,  y:11},

    '36,58':{to:'minamo_port', x:13, y:18},
    '31,55':{to:'minamo_rock', x:10, y:14},
    '54,58':{to:'minamo_isle', x:9,  y:12},
    '58,68':{to:'minamo_dgn1', x:8,  y:13},
    '50,64':{to:'minamo_dgn0', x:8,  y:10},

  },
  // ちほうごとに でる まものを かえる
  encZones:[
    // ★きゅうたいりく（5章 じょばん）：ルミナクエストIの まものが でる
    {x0:27,y0:24,x1:65,y1:49, pool:['puyo','goblin','bat','thief','skel'],
     name:'きゅうたいりくの のはら'},
    {x0:26,y0:0, x1:70,y1:23, pool:['icicleslime','hoimislime','yukingon','frostbat'], name:'ヴェルサの せつげん'},
    // ★エルデ：れいほうの ふもと
    {x0:0,y0:24,x1:26,y1:50, pool:['icicleslime','frostbat','yukingon','blizzardhawk','wisp'],
     name:'エルデの ふもと'},
    // ★ミナモ：みなとの まわり → しまなみ → おきあい と だんだん つよく
    // ★みなとの しま ぜんたい（y53〜69）を じょばんたいに する。
    //   みなみはんぶんが おきあいゾーンに はいり、Lv1で かちりつ 0%だった。
    {x0:24,y0:50,x1:45,y1:71, pool:['coralslime','babycrab','seagull','seaslug'],
     name:'みなとの いそべ'},
    {x0:46,y0:50,x1:60,y1:63, pool:['seagull','seaslug','reefeel','hermitcrab',
       'poisonjelly','stingray'], name:'ミナモの しまなみ'},
    {x0:46,y0:50,x1:72,y1:71, pool:['stingray','bloodflower','junglemen','redgator',
       'spikelizard','maskshaman'], name:'サンゴの おきあい'},
    {x0:74,y0:26,x1:95,y1:36, pool:['drakybat','madrock','mandragora','hornet'],
     name:'ザールの こうえきろ'},
    {x0:66,y0:24,x1:95,y1:50, pool:['madrock','mandragora','hornet','thornwolf',
       'skeleton','ghostlamp','wisp'], name:'すなの かいどう'},
  ]},

  // ============ ヴェルサ地方（第1章） ============
  // = ゆき / r いしだたみ / # しろい いしかべ / T あおい せんとう
  // K おうじょうもん / F ふんすい / I やどや / P きょうかい / W ぶきや / M まほうてん
  // G みなみもん / f ゆきの き / n むらびと
  // ============ 第4章 エルデ地方（れいほう）============
  elde_town:{name:'かくれざと エルデ',theme:'snow',enc:false,tiles:[
    "##########################",
    "#========================#",
    "#===========rr===========#",
    "#==HHHH=HHHHrr==HHHH=HHHH#",
    "#==HHHH=HHHHrr==HHHH=HHHH#",
    "#==HHIH=HHWHrr==HHMH=HHSH#",
    "#===n=f=====tr=====f=====#",
    "#===========nr===========#",
    "#==rrrrrrnrrrrrrrrrrrrr==#",
    "#==rrrrrrrrrrrrrrnrrrrr==#",
    "#===========rr===========#",
    "#==HHHH=HHHHrr==HHHH=HHHH#",
    "#==HHHn=HHHHrt==HHHHnHHHH#",
    "#==HHHH=HHHHrr==HHHH=HHPH#",
    "#===========rr===========#",
    "#=C===f=====rr=n===f=====#",
    "#===========rr===========#",
    "############GG############"
  ], warps:{}, warpsXY:{'12,17':{to:'world',x:9,y:30},'13,17':{to:'world',x:9,y:30}}},
  elde_path:{name:'れいほう さんどう',theme:'ice',enc:true,encRate:0.075,encGrace:4,tiles:[
    "############################",
    "############################",
    "##======##=t##=>>=##======##",
    "##=HHHH=##========##====t=##",
    "##=HHHH=##==o=====##===C==##",
    "##=HyHH=##========##======##",
    "##======##========##======##",
    "##======##================##",
    "##=C====================o=##",
    "##=================o======##",
    "##=t===========##=========##",
    "##====##=======##=========##",
    "##====##=======##====##===##",
    "##====##====o==##====##===##",
    "##==o=##=======##====##===##",
    "##====##=======##==t=##===##",
    "##====##==o==========##=C=##",
    "##====##=====t<<=====##===##",
    "############################",
    "############################"
  ], warps:{}, warpsXY:{'14,17':{to:'world',x:6,y:41},'15,17':{to:'world',x:6,y:41},'15,2':{to:'elde_path2',x:12,y:12},'16,2':{to:'elde_path2',x:13,y:12}}},
  elde_path2:{name:'れいほう さんどう おくち',theme:'ice',enc:true,encRate:0.080,encGrace:4,tiles:[
    "########################",
    "########################",
    "##====================##",
    "##=C=======t==========##",
    "##==o======B===##==o==##",
    "##=====##======##=====##",
    "##=====##======##=====##",
    "##=====##======##=====##",
    "##=t===##==o===##===t=##",
    "##=====##======##=====##",
    "##=====##======##=====##",
    "##==o==##==========o==##",
    "##=========t========C=##",
    "##==========<<========##",
    "########################",
    "########################"
  ], warps:{}, warpsXY:{'12,13':{to:'elde_path',x:15,y:3},'13,13':{to:'elde_path',x:16,y:3}}},
  elde_tower:{name:'けんきゅうとう 1かい',theme:'castle',enc:true,encRate:0.070,encGrace:4,tiles:[
    "####################",
    "####################",
    "##=======>>=======##",
    "##=C==t===========##",
    "##==o==========o==##",
    "##====##====##====##",
    "##====##====##====##",
    "##=t==##=o==##==t=##",
    "##====##====##====##",
    "##====##====##====##",
    "##==o==========o==##",
    "##=======t======C=##",
    "##========<<======##",
    "####################",
    "####################"
  ], warps:{}, warpsXY:{'10,12':{to:'world',x:20,y:45},'11,12':{to:'world',x:20,y:45},'9,2':{to:'elde_tower2',x:11,y:12},'10,2':{to:'elde_tower2',x:12,y:12}}},
  elde_tower2:{name:'けんきゅうとう 2かい',theme:'castle',enc:true,encRate:0.085,encGrace:4,tiles:[
    "######################",
    "######################",
    "##========##>>======##",
    "##=Co====t##======o=##",
    "##====##==##========##",
    "##====##==##========##",
    "##====##======##====##",
    "##====##======##====##",
    "##=t==##==o===##==t=##",
    "##====##======##====##",
    "##============##====##",
    "##============##====##",
    "##==o=======t=====oC##",
    "##=========<<=======##",
    "######################",
    "######################"
  ], warps:{}, warpsXY:{'11,13':{to:'elde_tower',x:10,y:3},'12,13':{to:'elde_tower',x:11,y:3},
                        '12,2':{to:'elde_top',x:9,y:9},'13,2':{to:'elde_top',x:10,y:9}}},
  elde_top:{name:'けんきゅうとう 3かい',theme:'castle',enc:true,encRate:0.080,encGrace:4,tiles:[
    "##################",
    "##################",
    "##==============##",
    "##======B=======##",
    "##==o========o==##",
    "##==============##",
    "##=t==========t=##",
    "##==============##",
    "##======o=======##",
    "##=C============##",
    "##=======<<=====##",
    "##################",
    "##################"
  ], warps:{}, warpsXY:{'9,10':{to:'elde_tower2',x:12,y:3},'10,10':{to:'elde_tower2',x:13,y:3}}},
  // ============ 第3章 ミナモ地方（サンゴぐんとう）============
  // ★にしの いわば（第3章：ふなのりの いらい）
  minamo_rock:{name:'にしの いわば',theme:'sea',enc:true,encRate:0.065,encGrace:4,tiles:[
    "wwwwwwwwwwwwwwwwwwwwww",
    "wwwwwwwwwwwwwwwwwwwwww",
    "wwwwwwwwwwwwwwwwwwwwww",
    "wwwwwww===B====wwwwwww",
    "#######========#######",
    "#######=o====o=#######",
    "###=C##========#=C####",
    "###=ww#========#=ww###",
    "###=ww####==####=ww###",
    "###===###t==t###===###",
    "###================###",
    "####==============####",
    "#########====#########",
    "#########====#########",
    "#########====#########",
    "##########<<##########"
  ], warps:{}, warpsXY:{'10,15':{to:'world',x:31,y:56},'11,15':{to:'world',x:31,y:56}}},
  // ★あさせの ほら（第3章：よびがいを とりに いく）
  minamo_dgn0:{name:'あさせの ほら',theme:'sea',enc:true,encRate:0.070,encGrace:4,tiles:[
    "####################",
    "####################",
    "##======##========##",
    "##=wwB==##t=======##",
    "##=ww===##===o==t=##",
    "##======##========##",
    "##=C=o============##",
    "##================##",
    "##=t===========ww=##",
    "##=============wC=##",
    "##====o===t===o===##",
    "##======<<========##",
    "####################",
    "####################"
  ], warps:{}, warpsXY:{'8,11':{to:'world',x:50,y:63},'9,11':{to:'world',x:50,y:63}}},
  minamo_port:{name:'サンゴの みなと',theme:'coral',enc:false,tiles:[
    "############################",
    "#wwwwwwwwwwwwwwwwwwwwwwwwww#",
    "#wwwwwwwwwwwn==jwwwwwwwwwww#",
    "#wwwwwwwwwww====wwwwwwwwwww#",
    "#wwwwwwwwwww=rrywwwwwwwwwww#",
    "#==HHHH==HHH=rr==HHHH=HHHH=#",
    "#==HHHH==HHH=nr==HHHH=HHHH=#",
    "#=fHHIH==HWrrFFrrHHMH=HHPH=#",
    "#==========rrrrrr==========#",
    "#==rrrrnrrrtrrrrtrrrnrrrn==#",
    "#==rrrrrrrrrrrrrrrnrrrnrr==#",
    "#====n======yrr============#",
    "#==HHHHw=HHHHrr==HHHH=HHHH=#",
    "#==HHHH==HHHHrr==HHHH=HHHH=#",
    "#==HHSH==HHHHrr==HHHH=HHHH=#",
    "#============rr============#",
    "#=f========n=tt====*===n=*C#",
    "#===eeeee====rr============#",
    "#============rr============#",
    "#############GG#############"
  ], warps:{}, warpsXY:{'13,19':{to:'world',x:36,y:59},'14,19':{to:'world',x:36,y:59}}},
  minamo_isle:{name:'しおかぜの むら ナギサ',theme:'coral',enc:false,tiles:[
    "####################",
    "#wwwwwwwwwwwwwwwwww#",
    "#wwwwwwwwwwwwwwwwww#",
    "#==HHHH==rr==HHHH==#",
    "#==HHHHf=nr=fHHHH==#",
    "#==HHIH==tr==HHSH==#",
    "#==rrrnrrrrrrrrrrf=#",
    "#==rrrrrrrrrrnrrr==#",
    "#========rr========#",
    "#==HHHH==rr==HHHH==#",
    "#==HHHH==rtn=HHHH==#",
    "#==HHHHfnrr==HHHHC=#",
    "#========rr========#",
    "#########GG#########"
  ], warps:{}, warpsXY:{'9,13':{to:'world',x:54,y:59},'10,13':{to:'world',x:54,y:59}}},
  minamo_dgn1:{name:'かいしょくどう',theme:'sea',enc:true,encRate:0.075,encGrace:4,tiles:[
    "######################",
    "######################",
    "##====##==>>==##====##",
    "##=o==##==t===##==o=##",
    "##=ww=##======##==C=##",
    "##=ww=##======##====##",
    "##============##=t==##",
    "##========o===##====##",
    "##====##======##====##",
    "##==t=##============##",
    "##====##=========ww=##",
    "##=C==##======##=ww=##",
    "##=o==##==t===##====##",
    "##====##======##====##",
    "########<<############",
    "######################"
  ], warps:{}, warpsXY:{'8,14':{to:'world',x:58,y:67},'9,14':{to:'world',x:58,y:67},'10,2':{to:'minamo_dgn2',x:8,y:11},'11,2':{to:'minamo_dgn2',x:9,y:11}}},
  minamo_dgn2:{name:'かいしょくどう さいしんぶ',theme:'sea',enc:true,encRate:0.085,encGrace:4,tiles:[
    "##################",
    "##################",
    "##==============##",
    "##=ww=t=B=======##",
    "##=ww========o==##",
    "##==============##",
    "##==============##",
    "##=t==========t=##",
    "##==============##",
    "##==o========ww=##",
    "##=C=======t=ww=##",
    "##==============##",
    "########<<########",
    "##################"
  ], warps:{}, warpsXY:{'8,12':{to:'minamo_dgn1',x:10,y:3},'9,12':{to:'minamo_dgn1',x:11,y:3}}},
  // ============ 第2章 ザール地方 ============
  zaal_town:{name:'たいしょうのまち ザール',theme:'desert',enc:false,tiles:[
    "##############################",
    "#============================#",
    "#============================#",
    "#=============rry============#",
    "#==HHHH==HHH==rr==HHHH==HHHH=#",
    "#==HHHH==HHH==nr==HHHH==HHHH=#",
    "#=fHHIH==HWHrrFFrrHHMH==HHPf=#",
    "#===========rrrrrr===========#",
    "#==rrrrnrrrrtrrrrtrrrnrrrrr==#",
    "#==rrrrrrrrrrrrrrrrrrrrrrrr==#",
    "#==========n=yrr==n===n======#",
    "#====n========rr=============#",
    "#==HHHHw=HHHH=rr==HHHH==HHHH=#",
    "#==HHHH==HHHH=rr==HHHH==HHHH=#",
    "#==HHSH==HHHH=rr==HHHH==HHHH=#",
    "#=============rr=============#",
    "#=f===========tt====*===n=*C=#",
    "#===eeeee=====rr=====eeeee===#",
    "#=============rr=============#",
    "##############GG##############"
  ], warps:{}, warpsXY:{'14,19':{to:'world',x:80,y:33},'15,19':{to:'world',x:80,y:33}}},
  zaal_oasis:{name:'オアシスの むら サーラ',theme:'desert',enc:false,tiles:[
    "####################",
    "#==================#",
    "#==wwww==rr========#",
    "#==wwww==nr==HHHH==#",
    "#==wwww=frrf=HHHH==#",
    "#========tr==HHIH==#",
    "#==rrrnrrrrnrrrrrf=#",
    "#==rrrrrrrrrrnrrr==#",
    "#========rr========#",
    "#==HHHH==rr==HHHH==#",
    "#==HHHHn=rt==HHHH==#",
    "#==HHSHfnrr==HHHHC=#",
    "#========rr========#",
    "#########GG#########"
  ], warps:{}, warpsXY:{'9,13':{to:'world',x:86,y:41},'10,13':{to:'world',x:86,y:41}}},
  zaal_dgn1:{name:'すなの いせき',theme:'cave',enc:true,encRate:0.075,encGrace:4,tiles:[
    "######################",
    "######################",
    "##====##==>>==##====##",
    "##=o==##==t===##==o=##",
    "##=C==##======##====##",
    "##====##============##",
    "##==t=##============##",
    "##========o===##====##",
    "##============##====##",
    "##====##======##=t==##",
    "##====##======##====##",
    "##====##======##==C=##",
    "##=o==##==t===##==o=##",
    "##====##======##====##",
    "########<<############",
    "######################"
  ], warps:{}, warpsXY:{'8,14':{to:'world',x:74,y:43},'9,14':{to:'world',x:74,y:43},'10,2':{to:'zaal_dgn2',x:8,y:11},'11,2':{to:'zaal_dgn2',x:9,y:11}}},
  zaal_dgn2:{name:'すなの いせき さいしんぶ',theme:'cave',enc:true,encRate:0.085,encGrace:4,tiles:[
    "##################",
    "##################",
    "##==============##",
    "##=t====B=====t=##",
    "##==o========o==##",
    "##==============##",
    "##==============##",
    "##==============##",
    "##==============##",
    "##==o========o==##",
    "##=C==========t=##",
    "##==============##",
    "########<<########",
    "##################"
  ], warps:{}, warpsXY:{'8,12':{to:'zaal_dgn1',x:10,y:3},'9,12':{to:'zaal_dgn1',x:11,y:3}}},
  versa_town:{name:'おうと ヴェルサリア',theme:'snow',enc:false,tiles:[
    "############################",
    "#############KK#############",
    "#############==#############",
    "#############==#############",
    "#============rry===========#",
    "#==HHHH=HHH==rr==HHH=HHHH==#",
    "#==HHHH=HHH==nr==HHH=HHHH==#",
    "#=fHHIH=HWHrFFrrrHMH=HHPH=f#",
    "#==========rrrrrr==========#",
    "#==rrrrrnrrtrrrrtrrnrrrrn==#",
    "#==rrrfrrrrrrrrrrrrrrrfrr==#",
    "#====n===n==yrr=====n======#",
    "#==HHHw==HHH=rr=*=HHHH=HHH=#",
    "#==HHHH==HHn=rr==*HHHH=HHH=#",
    "#==HHSH==HHH=rr===HHHH=HHH=#",
    "#============rr============#",
    "#=f====*=====tt=====*n===Cf#",
    "#====eeeee===rr====eeeee===#",
    "#============rr============#",
    "#############GG#############"
  ], warps:{}, warpsXY:{'13,19':{to:'world',x:48,y:9},'14,19':{to:'world',x:48,y:9}}},
  versa_town2:{name:'くすしの むら ミルカ',theme:'snow',enc:false,tiles:[
    "######################",
    "#====================#",
    "#=#T#==###rr=#T#=====#",
    "#=###==###rr=###=D===#",
    "#=###=I===rr=#S#=###=#",
    "#f=======trr=n===###=#",
    "#===rrrrnrrrnrrrr###=#",
    "#===rrrrrrrrrrrrrr===#",
    "#=======n=rr====n====#",
    "#=#T#=n===rrt#T#====f#",
    "#=###=P===rr=###=====#",
    "#=###=====rn=###=====#",
    "#f====f===rr====f=C==#",
    "#====================#",
    "##########GG##########"
  ], warps:{}, warpsXY:{'10,14':{to:'world',x:39,y:15},'11,14':{to:'world',x:39,y:15},
                        '17,3':{to:'versa_hut',x:5,y:6}}},
  versa_hut:{name:'くすしの いえ',theme:'indoor',enc:false,tiles:[
    "############",
    "####rrrrrC##",
    "####rnrrr###",
    "#rrrrrrrrrr#",
    "#rrrrrrrrrr#",
    "#rrrrrrrrrr#",
    "#rrrrrrrrrr#",
    "#####DD#####"
  ], warps:{}, warpsXY:{'5,7':{to:'versa_town2',x:18,y:3},'6,7':{to:'versa_town2',x:18,y:3}}},
  versa_cast1:{name:'ヴェルサ おうじょう',theme:'castle',enc:false,tiles:[
    "######################",
    "########rrKKrr########",
    "########rrnrrr########",
    "########rrrrrr########",
    "#rrrrrrrrrrrrrrrrrrrr#",
    "######rTrrrrrrTr######",
    "##rZr#rrrrrrrrrr#rCr##",
    "##rrr#rrnrrrrnrr#rrr##",
    "##rrr#rrrrrrrrrr#rrr##",
    "##rrr#rTrrrrrrTr#rrr##",
    "###D##rrrrrrrrrr##D###",
    "#rrrrrrrrrrrrrrrrrrrr#",
    "#rrrrrnrrrrrrrrrrrrrr#",
    "#rrrrrrrrrrrrrrrrrrrr#",
    "#rrrrrrrrrrrrrrrrrrrr#",
    "##########GG##########"
  ], warps:{}, warpsXY:{'10,15':{to:'versa_town',x:13,y:4},'11,15':{to:'versa_town',x:14,y:4}}},
  versa_dgn1:{name:'こおりの どうくつ',theme:'ice',enc:true,encRate:0.075,encGrace:4,tiles:[
    "####################",
    "#========>>========#",
    "#==#C##======###C==#",
    "#==####=o====##o#==#",
    "#==####======####==#",
    "#=t=====####=====t=#",
    "#=====o=####=o=====#",
    "#==###========###==#",
    "#==###=====o==###==#",
    "#==###========###==#",
    "#========t=========#",
    "#=www==######==www=#",
    "#=www==######==www=#",
    "#====o=######======#",
    "#=t==C===========t=#",
    "#########GG#########"
  ], warps:{}, warpsXY:{'9,15':{to:'world',x:56,y:19},'10,15':{to:'world',x:56,y:19},'9,1':{to:'versa_dgn2',x:8,y:11},'10,1':{to:'versa_dgn2',x:9,y:11}}},
  versa_dgn2:{name:'こおりの どうくつ さいしんぶ',theme:'ice',enc:true,encRate:0.085,encGrace:4,tiles:[
    "##################",
    "#================#",
    "#=t===o====o===t=#",
    "#==###==B===###==#",
    "#==###======###==#",
    "#==###======###==#",
    "#=o====wwww====o=#",
    "#======wwww======#",
    "#==###======###==#",
    "#==###======###==#",
    "#=C###======###C=#",
    "#=t===o====o===t=#",
    "#================#",
    "########<<########"
  ], warps:{}, warpsXY:{'8,13':{to:'versa_dgn1',x:9,y:2},'9,13':{to:'versa_dgn1',x:10,y:2}}},
  toros:{name:'トロスむら',theme:'village',enc:false,tiles:[
    "ffffffffffffffff",
    "f____ff____ff__f",
    "f_D__________D_f",
    "f__rrrrrrrrrr__f",
    "f__r________r__f",
    "f_Ir__n___n_rS_f",
    "f__r________r__f",
    "f__rrrr__rrrr__f",
    "f__r_wwwwww_r__f",
    "f_Pr_wwwwww_r__f",
    "f__r________r__f",
    "f__rrrrrrrrrr__f",
    "f______n_______f",
    "ffffff_rr_ffffff",
    "ffffff_rr_ffffff",
  ],
  warps:{}, warpsXY:{'7,14':{to:'world',x:48,y:31},'8,14':{to:'world',x:48,y:31},'2,2':{to:'toros_h1',x:5,y:4},'13,2':{to:'toros_h2',x:5,y:4}}},
  toros_h1:{name:'みんか',theme:'indoor',enc:false,tiles:[
    "###########",
    "#____n____#",
    "#_________#",
    "#_________#",
    "#____D____#",
    "###########",
  ], warps:{}, warpsXY:{'5,4':{to:'toros',x:2,y:3}}},
  toros_h2:{name:'みんか',theme:'indoor',enc:false,tiles:[
    "###########",
    "#_n_______#",
    "#_________#",
    "#______C__#",
    "#____D____#",
    "###########",
  ], warps:{}, warpsXY:{'5,4':{to:'toros',x:13,y:3}}},
  cave1:{name:'ゆめみの どうくつ B1',theme:'cave',enc:true,tiles:[
    "##############",
    "#____t____C__#",
    "#_##___##____#",
    "#_#w___#___o_#",
    "#__ww______o_#",
    "#___w___##___#",
    "#_o_____##t__#",
    "#_______#____#",
    "#__##______o_#",
    "#__##__C_____#",
    "#t____________",
    "#_____<______#",
    "##############",
  ], warps:{}, warpsXY:{
    '6,11':{to:'world',x:47,y:48},   // ★でぐちは いりぐちの きたがわ。y50は うみに かこまれた こじまで、でられなく なる
    '13,10':{to:'cave2',x:1,y:9},
  }},
  cave2:{name:'ゆめみの どうくつ B2',theme:'cave',enc:true,tiles:[
    "##############",
    "#_____>______#",
    "#__##___##___#",
    "#__##_C_##___#",
    "#____________#",
    "#_o__wwww__o_#",
    "#____wwww____#",
    "#t___________#",
    "#___##___##_t#",
    "_____________#",
    "##############",
  ], warps:{}, warpsXY:{'0,9':{to:'cave1',x:12,y:10},'6,1':{to:'cave3',x:7,y:12}}},
  cave3:{name:'ゆめみの どうくつ B3',theme:'cave',enc:true,tiles:[
    "###############",
    "#______B______#",
    "#___#######___#",
    "#___#_____#___#",
    "#_C_#_____#_C_#",
    "#___#__#__#___#",
    "#___##___##___#",
    "#______________",
    "#_o_wwww_ww_o_#",
    "#___wwww_ww___#",
    "#t__________t_#",
    "#_____###_____#",
    "#______<______#",
    "###############",
  ], warps:{}, warpsXY:{'7,12':{to:'cave2',x:6,y:1},'14,7':{to:'cave2',x:1,y:9}}},
};

// ---------------- データ：店・宿 ----------------
const SHOPS = {
  // ============ 第1章 ヴェルサ地方 ============
  'dream_camp:W':[
    {name:'ゆめてつの けん',   kind:'w', v:26, price:5200},
    {name:'ばんにんの つえ',   kind:'w', v:22, price:3600},
    {name:'ゆめてつの よろい', kind:'a', v:28, price:5600},
    {name:'ほしくずの ローブ', kind:'a', v:24, price:4200},
  ],
  'dream_camp:S':[
    {name:'やくそう',   kind:'herb',  price:8},
    {name:'せいすい',   kind:'water', price:24},
  ],
  'versa_town:S':[                                   // どうぐや
    {kind:'h',  name:'やくそう',        v:20, price:8},
    {kind:'wtr',name:'まほうのせいすい', v:30, price:60},
    {kind:'w',  name:'ひのきのぼう',     v:2,  price:10},
    {kind:'a',  name:'たびびとのふく',   v:2,  price:20},
  ],
  'versa_town2:S':[                                  // ミルカの どうぐや
    {kind:'h',  name:'やくそう',        v:20, price:8},
    {kind:'wtr',name:'まほうのせいすい', v:30, price:60},
    {kind:'w',  name:'どうのつるぎ',     v:5,  price:100},
    {kind:'a',  name:'かわのよろい',     v:5,  price:130},
  ],
  // ============ 第4章 エルデ地方 ============
  'elde_town:W':[
    {kind:'w',name:'けんじゃの つえ',   v:16, price:1400},
    {kind:'w',name:'みかづきの やいば', v:20, price:2400},
    {kind:'a',name:'まもりの ローブ',   v:17, price:1500},
    {kind:'a',name:'せいれいの ころも', v:22, price:2600},
  ],
  'elde_town:M':[
    {kind:'wtr',name:'まほうのせいすい', v:30, price:60},
    {kind:'w',  name:'けんじゃの つえ',  v:16, price:1400},
    {kind:'a',  name:'まもりの ローブ',  v:17, price:1500},
  ],
  'elde_town:S':[
    {kind:'h',  name:'やくそう',        v:20, price:12},
    {kind:'wtr',name:'まほうのせいすい', v:30, price:70},
    {kind:'a',  name:'たびびとのふく',   v:2,  price:20},
  ],
  // ============ 第3章 ミナモ地方 ============
  'minamo_port:W':[
    {kind:'w',name:'サンゴの ナイフ',   v:8,  price:280},
    {kind:'w',name:'しおかぜの つえ',   v:11, price:520},
    {kind:'a',name:'かいがらの まもり', v:9,  price:400},
    {kind:'a',name:'うろこの よろい',   v:13, price:820},
    {kind:'w',name:'はがねのつるぎ',    v:12, price:800},
  ],
  'minamo_port:M':[
    {kind:'wtr',name:'まほうのせいすい', v:30, price:60},
    {kind:'w',  name:'うらないの つえ',  v:9,  price:380},
    {kind:'a',  name:'まいの ころも',    v:11, price:560},
  ],
  'minamo_port:S':[
    {kind:'h',  name:'やくそう',        v:20, price:8},
    {kind:'wtr',name:'まほうのせいすい', v:30, price:60},
    {kind:'a',  name:'たびびとのふく',   v:2,  price:20},
  ],
  'minamo_isle:S':[
    {kind:'h',  name:'やくそう',        v:20, price:10},
    {kind:'wtr',name:'まほうのせいすい', v:30, price:70},
    {kind:'a',  name:'かいがらの まもり',v:9,  price:400},
  ],
  // ============ 第2章 ザール地方 ============
  'zaal_town:W':[                                    // ぶきや
    {kind:'w',name:'こうえきの ナイフ', v:4,  price:60},
    {kind:'w',name:'すなよけの けん',   v:9,  price:320},
    {kind:'a',name:'たびの がいとう',   v:3,  price:70},
    {kind:'a',name:'すなの むねあて',   v:8,  price:380},
    {kind:'w',name:'はがねのつるぎ',    v:12, price:800},
    {kind:'a',name:'てつのよろい',      v:12, price:950},
  ],
  'zaal_town:M':[                                    // まほうてん
    {kind:'wtr',name:'まほうのせいすい', v:30, price:60},
    {kind:'w',  name:'まどうしの つえ',  v:7,  price:280},
    {kind:'a',  name:'まよけの ローブ',  v:9,  price:420},
  ],
  'zaal_town:S':[                                    // どうぐや
    {kind:'h',  name:'やくそう',        v:20, price:8},
    {kind:'wtr',name:'まほうのせいすい', v:30, price:60},
    {kind:'w',  name:'ひのきのぼう',     v:2,  price:10},
    {kind:'a',  name:'たびびとのふく',   v:2,  price:20},
  ],
  'zaal_oasis:S':[                                   // オアシスの どうぐや
    {kind:'h',  name:'やくそう',        v:20, price:10},
    {kind:'wtr',name:'まほうのせいすい', v:30, price:70},
    {kind:'a',  name:'すなの むねあて',  v:8,  price:380},
  ],
  'versa_town:W':[
    {kind:'w',name:'どうのけん',     v:6, price:120},
    {kind:'a',name:'かわのたて',     v:4, price:90},
    {kind:'w',name:'はがねのつるぎ', v:12,price:800},
    {kind:'a',name:'てつのよろい',   v:12,price:950},
  ],
  'versa_town:M':[
    {kind:'h',name:'やくそう',           v:20,price:8},
    {kind:'wtr',name:'まほうのせいすい', v:30,price:60},
    {kind:'a',name:'まほうのローブ',     v:8, price:420},
  ],
  'toros:S':[
    {kind:'w',name:'ひのきのぼう',   v:2, price:10},
    {kind:'w',name:'どうのつるぎ',   v:5, price:100},
    {kind:'a',name:'たびびとのふく', v:2, price:20},
    {kind:'a',name:'かわのよろい',   v:5, price:130},
    {kind:'w',name:'はがねのつるぎ', v:12,price:800},
    {kind:'a',name:'てつのよろい',   v:12,price:950},
    {kind:'w',name:'まほうのつるぎ', v:20,price:2600},
    {kind:'a',name:'りゅうのよろい', v:20,price:2900},
    {kind:'h',name:'やくそう',       v:20,price:8},
    {kind:'wtr',name:'まほうのせいすい',v:30,price:60},
  ],
};
const INN_PRICE = {toros:6, versa_town:8, versa_town2:6, zaal_town:10, zaal_oasis:8, elde_town:16,
                   minamo_port:12, minamo_isle:10};

// ---------------- 状態 ----------------
let G, P, party, reserve = [];
function startChapter(no){
  const ch=(WORLD.CHAPTERS||[]).find(x=>x.no===no);
  if(!ch) return;
  V.chapterCard('第'+no+'章', ch.title);
}
function freshState(){
  G = {mode:'field', menu:null, battle:null, flags:{}, visited:{}, gotTreasure:{},
       tactic:'manual', dex:{}, trail:[], stepFlip:false, cleared:false,
       chapter:1, chapters:{}, townState:'NORMAL', night:false, quests:{}, steps:0,
       ship:null, aboard:false};
  P = {map:'versa_town', x:13, y:18, dir:'front', gold:60, herbs:5, waters:0,
       equipBag:[], keyItems:{}, goods:{}};
  party = [mkMember('lion',1)];
  reserve = [];
  party[0].weapon = {kind:'w',name:'みならいの けん',v:3};
  party[0].armor  = {kind:'a',name:'こまもり',v:2};
  G.visited.versa_town = true;
}
// ---------------- まちの じょうたい ----------------
function setTownState(id){
  if(!WORLD.TOWN_STATES[id]) return false;
  G.townState = id;
  V.buildMap(P.map); V.setActors(true); U.hud();
  return true;
}
function setNight(v){
  G.night = !!v;
  V.buildMap(P.map); V.setActors(true);
  return G.night;
}
// 章ごとの ふっきてん（ぜんめつしたとき もどる まち）
// ※ 章データ（chapters.js）に うつした。ここは よびだしの ための のこり。
const HOME = {
  1:{map:'versa_town', x:13, y:9, name:'ヴェルサリアの きょうかい'},
  5:{map:'toros',      x:7,  y:6, name:'トロスむらの きょうかい'},
};
function homePoint(){
  // ★章データの home を さいゆうせん（章を ふやしても ここを さわらない）。
  //   これを わすれると、第2章で ぜんめつしても 第1章の まちへ もどされる。
  const cd = chData();
  if(cd && cd.home && MAPS[cd.home.map] && walkable(cd.home.map, cd.home.x, cd.home.y)){
    return cd.home;
  }
  const h = HOME[G.chapter] || HOME[1];
  return MAPS[h.map] ? h : HOME[1];
}
function townStateDef(){ return WORLD.TOWN_STATES[G.townState] || WORLD.TOWN_STATES.NORMAL; }
function mkMember(cls, lv){
  const c = CLASSES[cls];
  const m = {cls, name:c.name, lv:1, exp:0,
    maxhp:c.hp, maxmp:c.mp, batk:c.atk, bdef:c.def, agi:c.agi,
    weapon:null, armor:null, status:null};
  for(let i=1;i<lv;i++){
    m.lv++; m.maxhp+=c.g.hp; m.maxmp+=c.g.mp; m.batk+=c.g.atk; m.bdef+=c.g.def;
    if(m.lv%2===0) m.agi+=c.g.agi;
  }
  m.hp=m.maxhp; m.mp=m.maxmp;
  return m;
}
function expNext(m){ return m.lv>=LV_CAP ? Infinity : m.lv*m.lv*6; }
function mAtk(m){ return m.batk + (m.weapon?m.weapon.v:0); }
function mDef(m){ return m.bdef + (m.armor?m.armor.v:0); }
// ★じゅもんの ひょうじ：なまえの あとに しゅるいを つける。
//   なまえだけでは たんたい／ぜんたい／しゅびさげが わかりにくい ため。
const SPELL_TAG = {dmg:'たんたい', dmgall:'ぜんたい', heal:'かいふく',
                   healall:'ぜんたいかいふく', cure:'じょうたい', revive:'そせい',
                   defdown:'しゅびさげ', 'return':'いどう'};
function spellLabel(s){
  const tag = SPELL_TAG[s.type] || '';
  return s.name + '　' + s.mp + (tag ? '　' + tag : '');
}
function knownSpells(m){
  return CLASSES[m.cls].learns.filter(l=>m.lv>=l.lv)
    .map(l=>Object.assign({key:l.key}, SPELL_DEFS[l.key]));
}
function aliveMembers(){ return party.filter(p=>p.hp>0); }
function actableMembers(){ return party.filter(p=>p.hp>0 && p.status!=='sleep'); }

// ---------------- マップ ----------------
// 章ごとの きまりごとは src/chapters.js に まとめてある。
const CHD = (typeof CHAPTERS_DATA!=='undefined') ? CHAPTERS_DATA
          : (typeof require!=='undefined' ? require('./chapters.js') : null);
function chData(){ return CHD ? CHD.get(G.chapter||1) : null; }

const SOLID = new Set(['#','f','w','o','T','F','K','~','^','H','e','y','j']);
function tileAt(map,x,y){
  const m = MAPS[map]; if(!m) return '#';
  if(y<0||x<0||y>=m.tiles.length||x>=m.tiles[y].length) return '#';
  return m.tiles[y][x];
}
function isBlocked(ch){
  return SOLID.has(ch) || ch==='I' || ch==='P' || ch==='S' || ch==='W' || ch==='M'
      || ch==='n' || ch==='C' || ch==='B'
      || ch==='Q';                                   // Q は しらべる たいしょう
}
function walkable(map,x,y){ return !isBlocked(tileAt(map,x,y)); }
function warpAt(map,x,y){
  const m = MAPS[map]; if(!m) return null;
  if(m.warpsXY && m.warpsXY[x+','+y]) return m.warpsXY[x+','+y];
  const ch = tileAt(map,x,y);
  if(m.warps && m.warps[ch]) return m.warps[ch];
  return null;
}

// ---------------- メッセージ／ビューの差し替え口 ----------------
// 実UI版が上書きする。既定はヘッドレス（即時進行）。
const NullView = {
  buildMap(){}, setActors(){}, fx(kind,data,done){ done&&done(); },
  battleEnter(_,done){ done&&done(); }, battleLeave(done){ done&&done(); },
  refresh(){}, chest(){}, fade(_,done){ done&&done(); }, chapterCard(_,__,done){ done&&done(); },
  setDream(){},
};
const NullUI = {
  msgLog: [],
  msg(lines, done){ lines.forEach(l=>NullUI.msgLog.push(l)); done&&done(); },
  openTrade(){},
  menu(items, title, onPick){ onPick(0); },
  hud(){}, label(){},
};
const NullAudio = {hit(){},ehit(){},heal(){},lvup(){},win(){},lose(){},cue(){},
  cursor(){},ok(){},cancel(){},door(){},chest(){},item(){},buy(){},
  encounter(){},crit(){},miss(){},spell(){},defeat(){},flee(){},
  bgm(){}, battleBgm(){}, bgmStop(){}};
let V = NullView, U = NullUI, A = NullAudio;
function bind(view, ui, audio){ V=view||NullView; U=ui||NullUI; A=audio||NullAudio; }

// ---------------- フィールド行動 ----------------
// ---------------- しらべる（Aボタン）----------------
// むいている ほうこうの 1ますを しらべる。DQと おなじ そうさ。
function facing(){
  const d = P.dir||'front';
  const dx = d==='left' ? -1 : d==='right' ? 1 : 0;
  const dy = d==='back' ? -1 : d==='front' ? 1 : 0;
  return {x:P.x+dx, y:P.y+dy, dx, dy};
}
function interact(){
  if(G.mode!=='field' || G.busy) return false;
  const f = facing();
  const nx = f.x, ny = f.y, dx = f.dx, dy = f.dy;
  const ch = tileAt(P.map,nx,ny);
  // 施設・人物は「ぶつかって」作用
  if(ch==='n'){ talkNPC(nx,ny); return; }
  if(ch==='I'){ useInn(); return; }
  if(ch==='P'){ useChurch(); return; }
  if(ch==='S'||ch==='W'||ch==='M'){ openShop(ch); return; }
  if(ch==='C'){ openChest(nx,ny); return; }
  if(ch==='A'||ch==='V'||ch==='X'){          // ワールドの ちてん
    const w=warpAt(P.map,nx,ny);
    if(w){
      // ★けっかい：じょうけんが そろうまで はいれない
      const wd = WARDS[w.to];
      if(wd && (G.chapter||1)===wd.chapter && !G.flags[wd.flag]){
        G.mode='msg';
        U.msg(wd.msg, ()=>{ G.mode='field'; });
        return;
      }
      doWarp(w); return;
    }
  }
  if(ch==='Q'){                               // まだ いけない ちほう
    G.mode='msg';
    U.msg(['とおくに まちの かげが みえる。',
           'だが いまの ' + (party[0] ? party[0].name : 'かれら') + 'には、ここから さきへ すすむ すべが ない。',
           '（この ちほうは これから つくられます）'], ()=>{ G.mode='field'; });
    return;
  }
  if(ch==='B'){ triggerBoss(nx,ny); return; }
  // ★さんどうの こや：かぎを あずけて ある。まものに あらされて いる。
  if(ch==='y' && P.map==='elde_path' && (G.chapter||1)===4){
    G.mode='msg';
    if(!G.flags.ch4_sawHut){
      G.flags.ch4_sawHut = true;
      questAdvance('ch4_q1_key','active');
      U.msg(['こやの とびらが、うちがわから やぶられて いる。',
             'ゆかに たなが たおれ、ぬのが ちらばって いた。',
             '',
             'ミオ「……かぎを しまって おいた はこが、ない」',
             'ゼフ「おおきな あしあとじゃ。ひとの ものでは ない」',
             'ゼフ「まだ とおくには いっておらん。においが のこっとる」',
             'ミオ「おくへ いきましょう。とりかえします」',
             '', '＊ クエスト「とうの かぎを とりかえす」＊'], ()=>{ G.mode='field'; });
      return;
    }
    if(hasKey('towerkey')){
      U.msg(['あらされた こや。もう、とる ものは ない。'], ()=>{ G.mode='field'; });
      return;
    }
    U.msg(['あらされた こや。かぎは もちさられて いる。',
           'ゼフ「おくちじゃ。きたの おくへ すすめ」'], ()=>{ G.mode='field'; });
    return;
  }
  // ★けっかい：じょうけんが そろうまで はいれない。
  //   （まどろみの しもべを たおすまで かいしょくどうへ はいれない）
  {
    const w0 = warpAt(P.map, nx, ny);
    if(w0 && WARDS[w0.to] && !G.flags[WARDS[w0.to].flag] && (G.chapter||1)===WARDS[w0.to].chapter){
      G.mode='msg';
      U.msg(WARDS[w0.to].msg, ()=>{ G.mode='field'; });
      return;
    }
  }
  // ★こぶね：さんばしの さきで A を おすと うみを わたる。
  //   ふなのりの いらいを こなすまで のれない（イベントの いみを もたせる）。
  // ★かえりの こぶね（ワールドの はまべ）
  if(((G.chapter||1)===3 ? G.flags.ch3_paidFare : (G.chapter||1)>=5) && P.map==='world'
     && nx===FERRY_BACK.x && ny===FERRY_BACK.y){
    G.mode='msg';
    U.msg(FERRY_BACK.msg, ()=>{ doWarp({to:FERRY_BACK.to, x:FERRY_BACK.tx, y:FERRY_BACK.ty}); });
    return;
  }
  if(((G.chapter||1)===3 || (G.chapter||1)>=5) && FERRY[P.map]){
    const f = FERRY[P.map];
    if(nx===f.x && ny===f.y){
      G.mode='msg';
      if((G.chapter||1)===3 && !G.flags.ch3_paidFare){
        U.msg(['こぶねが つないである。',
               'だが かってに つかう わけには いかない。',
               'ふなのりに たのもう。'], ()=>{ G.mode='field'; });
        return;
      }
      U.msg(f.msg, ()=>{ doWarp({to:f.to, x:f.tx, y:f.ty}); });
      return;
    }
  }
  // ★ゆめみ：ちほうと しょうの じょうけんが そろえば おきる
  if(ch==='o' && P.map==='minamo_dgn1' && (G.chapter||1)===3
     && G.flags.ch3_enteredCave && !G.flags.ch3_sawDream){
    if(triggerDream()) return;
  }
  if(ch==='K' && P.map==='versa_cast1'){        // ★しろの なかの K は ぎょくざ
    G.mode='msg';
    U.msg(G.flags.ch1_cleared
      ? ['ヴェルサの ぎょくざ。','おうは しずかに こしかけている。']
      : ['ヴェルサの ぎょくざ。きんの かざりが にぶく ひかっている。',
         'おうは むすめの ことばかり かんがえて いるようだ。'],
      ()=>{ G.mode='field'; });
    return;
  }
  if(ch==='K'){                                 // まちの おうじょうもん
    G.mode='msg';
    const F = G.flags;
    // ★おうめいを うけていなくても、はなしが すすんでいれば とおす。
    //   （しろに はいらず ミルカへ さきに いくと、くすりを もっているのに
    //     もんで とめられて つみに なる ふぐあいが あった）
    const mayEnter = F.ch1_orderReceived || F.ch1_heardTheft || F.ch1_gotHerb
                  || F.ch1_cleared || hasKey('yukigusa') || hasKey('medicine');
    if(mayEnter){
      if(!F.ch1_orderReceived) F.ch1_orderReceived = true;   // つじつまを あわせる
      U.msg([F.ch1_cleared
              ? 'えいへい「おかえりなさいませ」'
              : 'えいへい「おうじょさまの ことだな。とおれ」'], ()=>{
        doWarp({to:'versa_cast1', x:10, y:14});
      });
    }else if(G.townState==='NORMAL'){
      U.msg(['おうじょうの もん。えいへいが かたく まもっている。',
             'えいへい「しんまいが かってに はいるな」'], ()=>{ G.mode='field'; });
    }else{
      U.msg(['おうじょうの もん。えいへいの かおいろが わるい。',
             'えいへい「おうめいの ない ものは とおせぬ」',
             'えいへい「きしだんちょうの ゆるしを もらってこい」'], ()=>{ G.mode='field'; });
    }
    return;
  }
  if(ch==='Z'){                       // ねむる おうじょ
    G.mode='msg';
    const F=G.flags;
    if(F.ch1_cleared){
      U.msg(['おうじょさまは まだ ねむっている。',
             'まくらもとの くすりの うつわは、からに なっている。'], ()=>{ G.mode='field'; });
      return;
    }
    if(hasKey('medicine') && !F.ch1_usedMedicine){        // ★くすりを つかう ばめん
      F.ch1_usedMedicine=true; takeKey('medicine');
      questAdvance('ch1_q4_medicine','clear');
      U.msg([
        'リオンは めざめの くすりを おうじょさまの くちもとへ はこんだ。',
        'じい「……のみこまれた。あとは まつだけ じゃ」',
        '……',
        'しかし、まぶたは ひらかない。',
        'じい「そんな ばかな。ゆきぐさが きかぬ ねむりなど……」',
        'おう「では これは、ただの びょうでは ないと いうことか」'
      ], ()=>{ triggerEnding(); });
      return;
    }
    if(F.ch1_gotHerb && !hasKey('medicine')){
      U.msg(['おうじょさまは ねむったまま。',
             'じい「ゆきぐさを もってきたのじゃな。ミルカの くすしに くすりに して もらうのじゃ」'],
        ()=>{ G.mode='field'; });
      return;
    }
    const first=!F.ch1_sawPrincess;
    F.ch1_sawPrincess=true;
    U.msg(first
      ? ['ベッドに おうじょさまが ねむっている。',
         'いくら よびかけても、まぶたは ひらかない。',
         'じい「わしの てには おえぬ。……ただ ひとつ、こころあたりが ある」',
         'じい「となりまち ミルカに ＜ゆきぐさ＞ という くすりぐさが ある。',
         'あれなら どんな ねむりも さますと いわれておる」',
         'じい「せつげんを にしへ ぬければ ミルカじゃ。たのむぞ、リオン」',
         '＊ クエスト「ゆきぐさを もとめて」＊']
      : ['おうじょさまは しずかに ねむっている。'],
      ()=>{ if(first) questAdvance('ch1_q2_herb','active'); G.mode='field'; });
    return;
  }
  if(ch==='F'){
    G.mode='msg';
    U.msg(G.townState==='DREAM_INVASION'
      ? ['ちゅうおうひろばの ふんすい。みずが むらさきに にごっている。']
      : ['ちゅうおうひろばの ふんすい。こおりついた みずが ひかっている。'],
      ()=>{ G.mode='field'; });
    return;
  }
  // なにも なければ
  G.mode='msg';
  U.msg(['そこには なにも ない。'], ()=>{ G.mode='field'; });
  return true;
}

function stepField(dx,dy){
  if(G.mode!=='field' || G.busy) return;
  const nx=P.x+dx, ny=P.y+dy;
  const ch = tileAt(P.map,nx,ny);
  // ★ぶつかっただけでは なにも おきない。しらべるのは Aボタン（interact）。
  //   ワープの ます（もん・かいだん・ちてん）は ふんだら すすむ。
  P.dir = dy<0?'back' : dy>0?'front' : (dx<0?'left':'right');
  // ★ふね：もやって ある ふねに あるいて ふれると のる
  if(!G.aboard && P.map==='world' && G.ship && nx===G.ship.x && ny===G.ship.y){
    G.aboard=true;
    G.trail.unshift([P.x,P.y]); if(G.trail.length>8) G.trail.pop();
    P.x=nx; P.y=ny; G.stepFlip=!G.stepFlip;
    V.setActors();
    return;
  }
  // ★ふね：うみを すすむ／りくに あがる（うみでは まものは でない）
  if(G.aboard){
    if(ch==='~'){
      G.trail.unshift([P.x,P.y]); if(G.trail.length>8) G.trail.pop();
      P.x=nx; P.y=ny; G.stepFlip=!G.stepFlip;
      V.setActors();
      return;
    }
    if(walkable(P.map,nx,ny)){
      G.ship={x:P.x, y:P.y};                 // ふねを のこして あがる
      G.aboard=false;
    }else return;
  }
  if(!walkable(P.map,nx,ny)) return;
  G.trail.unshift([P.x,P.y]); if(G.trail.length>8) G.trail.pop();
  P.dir = dy<0?'back' : dy>0?'front' : (dx<0?'left':'right');   // むきを おぼえる
  P.x=nx; P.y=ny; G.stepFlip=!G.stepFlip;
  V.setActors();
  const w = warpAt(P.map,nx,ny);
  // ★けっかい：じょうけんが そろうまで はいれない
  if(w){
    const wd = WARDS[w.to];
    if(wd && (G.chapter||1)===wd.chapter && !G.flags[wd.flag]){
      G.mode='msg';
      U.msg(wd.msg, ()=>{ G.mode='field'; });
      return;
    }
  }
  if(w){ doWarp(w); return; }
  if(MAPS[P.map].enc) maybeEncounter();
}
// ワールドマップは ばしょによって なまえが かわる
function areaName(map,x,y){
  if(map==='world' && tileAt(map,x,y)==='~') return 'おおうみ';
  const m=MAPS[map];
  if(!m || !m.encZones) return WORLD.mapName(map);
  const z=(m.encZones||[]).find(z=>x>=z.x0&&x<=z.x1&&y>=z.y0&&y<=z.y1);
  return z ? z.name : WORLD.mapName(map);
}
function doWarp(w){
  G.busy=true;
  if(A.door) A.door();
  V.fade(1, ()=>{
    P.map=w.to; P.x=w.x; P.y=w.y; P.dir='front';
    G.trail=[[w.x,w.y],[w.x,w.y]];
    G.visited[w.to]=true;
    if(w.to==='world') G.flags.ch1_enteredField=true;
    // ★章データの onEnter / onEnterState
    {
      const cd = chData();
      if(cd){
        if(cd.onEnter && cd.onEnter[w.to]) G.flags[cd.onEnter[w.to]] = true;
        if(cd.onEnterState && cd.onEnterState[w.to] && WORLD.TOWN_STATES[cd.onEnterState[w.to]])
          G.townState = cd.onEnterState[w.to];
      }
    }
    if(TRADE_MARKET[w.to]) G.marketTick = (G.marketTick|0) + 1;   // そうばが うごく
    if(w.to==='versa_town2') G.flags.ch1_reachedMirka=true;
    if(w.to==='versa_dgn1' && !G.flags.ch1_enteredCave){
      G.flags.ch1_enteredCave=true;
      G.townState='DREAM_INVASION';        // まちが ゆめに しんしょくされる
    }
    V.buildMap(w.to); V.setActors(); U.label(areaName(w.to, w.x, w.y));
    A.bgm(w.to);
    V.fade(0, ()=>{ G.busy=false; G.mode='field'; });   // メッセージ中から呼ばれても操作可へ戻す
  });
}
let encSteps = 0;
function maybeEncounter(){
  encSteps++;
  const m = MAPS[P.map];
  let rate = (m && m.encRate!==undefined) ? m.encRate : 0.085;
  const grace = (m && m.encGrace!==undefined) ? m.encGrace : 3;
  // ★もりの なかは みとおしが わるく、まものに あいやすい
  if(tileAt(P.map,P.x,P.y)===',') rate *= 1.8;
  if(encSteps<grace) return;                 // たたかいの ちょくごに また、を ふせぐ
  if(Math.random()<rate){ encSteps=0; startBattle(null); }
}

// ---------------- NPC・施設 ----------------
function talkNPC(x,y){
  const entry = NPCDATA.npcAt(P.map, x, y);
  G.mode='msg';
  if(!entry){ U.msg(['「……」'], ()=>{ G.mode='field'; }); return; }
  const lines = NPCDATA.pickLines(entry, {townState:G.townState, flags:G.flags});
  // ★こうえきしょう は はなすと あきないが できる（バルドの ミニイベント）
  if(entry.name === 'こうえきしょう'){
    if(party[0] && party[0].cls !== 'bald'){
      U.msg(['こうえきしょう「あきないは しょうにんの しごとさ」',
             '「あんたには むいて いないよ」'], ()=>{ G.mode='field'; });
      return;
    }
    U.msg(lines, ()=>{ G.mode='menu'; U.openTrade && U.openTrade(); });
    return;
  }
  // ★ものがたりの できごとが ある ときは、そちらを だす（ふだんの せりふは ださない）。
  //   りょうほう だすと おなじ ことを 2かい いう ことに なる（じっさいに でた ふぐあい）。
  if((G.chapter||1)!==1 && runTalkEvent(entry.name)) return;
  U.msg(lines, ()=>{ questOnTalk(entry.name); G.mode='field'; });
}
// ---------------- クエスト ----------------
// ---------------- 章データの ものがたりを うごかす ----------------
// chapters.js の talkEvents を じょうから みて、さいしょに あてはまった ものを おこなう。
// これに よって、章を ふやす ときに ここを さわらなくて すむ。
function matchEvent(e){
  const F = G.flags;
  if(e.unless && F[e.unless]) return false;                 // もう おきている
  if(e.cond && !e.cond.every(f=>F[f])) return false;         // まえの じょうけんが そろって いない
  if(e.when && e.when.state && G.townState !== e.when.state) return false;
  if(e.needKey && !hasKey(e.needKey)) return false;
  if(e.needGold && P.gold < e.needGold) return false;
  if(e.needQuota && !(G.quota && G.quota.n >= G.quota.need)) return false;  // ★いらいが おわって いない
  return true;
}
function runTalkEvent(npcName){
  const cd = chData();
  if(!cd || !cd.talkEvents) return false;
  const e = cd.talkEvents.find(ev => ev.npc === npcName && matchEvent(ev));
  if(!e) return false;

  (e.set || []).forEach(f => { G.flags[f] = true; });
  if(e.setState && WORLD.TOWN_STATES[e.setState]) G.townState = e.setState;
  if(e.takeKey) takeKey(e.takeKey);
  if(e.giveKey) giveKey(e.giveKey);
  if(e.moor){ G.ship={x:e.moor[0], y:e.moor[1]}; G.aboard=false; }   // ★ふねを さずける
  if(e.heal){ party.concat(reserve).forEach(m=>{ m.hp=m.maxhp; m.mp=m.maxmp; m.status=null; }); U.hud(); }
  if(e.join){                                    // ★なかまが くわわる（'lead'＝せんとうと おなじLv）
    (Array.isArray(e.join)?e.join:[e.join]).forEach(j=>{
      const lv = j.lv==='lead' ? (party[0]?party[0].lv:1) : (j.lv||1);
      const m = joinMember(j.cls, lv);
      if(m){                                     // そぶりの そうびを もって くる
        if(j.weapon) m.weapon = Object.assign({}, j.weapon);
        if(j.armor)  m.armor  = Object.assign({}, j.armor);
      }
    });
  }
  if(e.startQuota){                              // ★いらいを うける
    G.quota = {n:0, need:e.startQuota.need|0, flag:e.startQuota.flag};
  }
  if(e.clearQuota) G.quota = null;
  if(e.takeGold) P.gold = Math.max(0, P.gold - e.takeGold);
  if(e.gold) P.gold += e.gold;
  Object.keys(e.quest || {}).forEach(q => questAdvance(q, e.quest[q]));

  const lines = (e.msg || []).slice();
  U.msg(lines, () => {
    U.hud();
    // 章の おわりに たっしたか
    if(cd.ending && cd.ending.trigger && G.flags[cd.ending.trigger] && !G.flags[(cd.ending.set||[])[0]]){
      triggerChapterEnd();
      return;
    }
    G.mode = 'field';
  });
  return true;
}
// ---------------- ゆめみ（第3章）----------------
// ダンジョンの ある ますに たつと、セナの ちからで ゆめが みえる。
// がめんの いろが かわり、ものがたりが ひとつ すすむ。
function triggerDream(){
  if(G.flags.ch3_sawDream) return false;
  G.flags.ch3_sawDream = true;
  questAdvance('ch3_q2_dream','clear');
  questAdvance('ch3_q3_twins','active');
  G.dreaming = true;
  if(V.setDream) V.setDream(true);          // がめんを ゆめの いろに
  G.mode = 'msg';
  U.msg([
    'セナの あしが とまった。',
    'セナ「……みえる」',
    '',
    '＊ うみが しろく なり、おとが とおのく ＊',
    '',
    'ちいさな ふたりの おんなのこが、なみうちぎわで うたっている。',
    'ふたりは まったく おなじ かおを している。',
    '＜おきて＞　＜おきないで＞',
    'ふたつの こえが、おなじ くちから きこえた。',
    '',
    'ルカ「セナ！ しっかりして！」',
    'セナ「……おくに いる。ふたりで ひとりの、かなしい ゆめが」'
  ], () => {
    G.dreaming = false;
    if(V.setDream) V.setDream(false);
    U.hud();
    G.mode = 'field';
  });
  return true;
}
// ---------------- 章の しめくくり（データから）----------------
// 章の おわりに 「つぎへ すすむ」か「この しょうを つづける」を えらばせる
function offerNextChapter(next, title, isFinal){
  if(isFinal){
    G.mode = 'msg';
    U.msg(['＊＊ ルミナクエスト III　かんけつ ＊＊',
           '',
           'ながい たびに おつきあい いただき、',
           'ありがとう ございました！',
           'せかいは、めざめの あさを むかえた。'],
          () => { G.mode='field'; });
    return;
  }
  const ready = next && CHD && CHD.has(next);
  G.mode = 'msg';
  if(!ready){
    U.msg(['＊＊ ' + (title||'') + ' かんけつ ＊＊',
           '（つづきの しょうは これから つくります）'], () => { G.mode='field'; });
    return;
  }
  const nc = CHD.get(next);
  U.msg(['＊＊ ' + (title||'') + ' かんけつ ＊＊',
         'つぎは 第' + next + 'しょう「' + nc.title + '」。'], () => {
    G.mode = 'menu';
    U.menu(['第' + next + 'しょうへ すすむ', 'この しょうを つづける'], 'これから', (k) => {
      if(k === 0){
        switchChapter(next);
        G.mode = 'msg';
        V.buildMap(P.map); V.setActors(true);
        U.label(WORLD.mapName(P.map)); U.hud();
        A.bgm(P.map);
        V.chapterCard('第' + next + 'しょう', nc.title, () => { G.mode = 'field'; });
      }else G.mode = 'field';
    });
  });
}
function triggerChapterEnd(){
  const cd = chData();
  if(!cd || !cd.ending){ G.mode='field'; return; }
  const en = cd.ending;
  (en.set || []).forEach(f => { G.flags[f] = true; });
  G.cleared = true;
  Object.keys(en.quest || {}).forEach(q => questAdvance(q, en.quest[q]));
  G.mode = 'msg';
  U.msg(en.msg || ['……'], () => {
    const card = en.card || {title:'', sub:''};
    V.chapterCard(card.title, card.sub, () => { offerNextChapter(en.next, cd.title, en.final); });
  });
}
function questOnTalk(npcName){
  const F=G.flags;
  // ★まず 章データの ものがたりを ためす（第2章いこうは これだけで うごく）
  if((G.chapter||1) !== 1 && runTalkEvent(npcName)) return;
  // ---- ミルカの くすし ----
  if(npcName==='くすし'){
    if(F.ch1_gotHerb && !hasKey('medicine') && hasKey('yukigusa')){
      takeKey('yukigusa'); giveKey('medicine');
      F.ch1_madeMedicine=true;
      questAdvance('ch1_q3_retrieve','clear');
      questAdvance('ch1_q4_medicine','active');
      U.msg(['くすし「まあ……ほんとうに とりかえして きたのかい」',
             '（くすしは ゆきぐさを すりつぶし、ゆげの たつ くすりを つくった）',
             '＊ めざめの くすりを てにいれた！ ＊',
             'くすし「はやく おうじょさまの ところへ。さめる ことを いのってる」'], ()=>{});
      return;
    }
    if(!F.ch1_heardTheft){
      F.ch1_heardTheft=true;
      questAdvance('ch1_q2_herb','clear');
      questAdvance('ch1_q3_retrieve','active');
      U.msg(['くすし「ゆきぐさを わけて ほしい？ ……それが ないんだよ」',
             '「せんじつ、まものが かかえて いってしまってねえ」',
             '「みなみの こおりの どうくつだよ。くろい けものだった」',
             '「とりかえして きてくれるなら、くすりに して あげる」',
             '＊ クエスト「うばわれた ゆきぐさ」＊'], ()=>{});
      return;
    }
    return;
  }
  // ---- ヴェルサリア ----
  // へいおん中に きしだんちょうへ はなしかけると、じけんが うごきだす
  if(G.townState==='NORMAL' && npcName==='きしだんちょう' && !F.ch1_started){
    F.ch1_started=true;
    setTownState('SLEEPING_SICKNESS');
    questAdvance('ch1_q1_wakeup','active');
    U.msg(['きしだんちょう「たいへんだ リオン！ おうじょさまが おめざめに ならぬ！」',
           '「まちでも ねむったまま おきぬ ものが ふえておる」',
           '「まちの ものに はなしを きいて、げんいんを しらべてこい」',
           '＊ クエスト「めざめぬ おうじょ」＊'], ()=>{ U.hud(); });
    return;
  }
  if(G.townState==='NORMAL') return;
  if(npcName==='こうじょの じじょ') F.ch1_talkedMaid=true;
  if(npcName==='もんばん')          F.ch1_talkedGate=true;
  if(npcName==='きしだんちょう'){
    if(F.ch1_talkedMaid && F.ch1_talkedGate && !F.ch1_orderReceived){
      F.ch1_orderReceived=true;
      P.gold += 100;
      questAdvance('ch1_q1_wakeup','clear');
      U.msg(['きしだんちょう「よく しらべた。おうめいを だす、しろへ はいれ」',
             '「じいが まっておる。おうじょさまを みてくるのだ」',
             '（したくきんとして 100ゴールドを うけとった）',
             '＊ クエスト「めざめぬ おうじょ」を たっせい ＊'], ()=>{ U.hud(); });
    }else if(!F.ch1_orderReceived){
      questAdvance('ch1_q1_wakeup','active');
    }
  }
}
function questAdvance(id, state){
  if(!NPCDATA.QUESTS[id]) return;
  G.quests[id]=state;
}
function questList(){
  return Object.keys(G.quests).filter(k=>G.quests[k]==='active').map(k=>NPCDATA.QUESTS[k]);
}
function useInn(){
  const price = INN_PRICE[P.map]||10;
  G.mode='msg';
  if(P.gold>=price){
    U.msg(['やどやへ ようこそ。ひとばん '+price+'ゴールドです。',
           '…おはようございます！ みなさん げんきに なりました！'], ()=>{
      P.gold-=price;
      party.concat(reserve).forEach(m=>{ if(m.hp>0){ m.hp=m.maxhp; m.mp=m.maxmp; m.status=null; } });
      A.heal(); U.hud(); G.mode='field';
    });
  }else{
    U.msg(['やどやへ ようこそ。ひとばん '+price+'ゴールドです。',
           'おきゃくさん、おかねが たりないようで…'], ()=>{ G.mode='field'; });
  }
}
function useChurch(){
  const dead = party.concat(reserve).filter(p=>p.hp<=0);
  G.mode='msg';
  if(dead.length){
    const cost = 30*dead.length;
    if(P.gold>=cost){
      U.msg(['しんかんさま「いのりましょう…」',
             '（'+cost+'ゴールドを おさめた）',
             'たおれた なかまが めを さました！'], ()=>{
        P.gold-=cost;
        dead.forEach(p=>{ p.hp=Math.ceil(p.maxhp/2); p.status=null; });
        A.heal(); U.hud(); G.mode='field';
      });
      return;
    }
    U.msg(['しんかんさま「いのりには '+cost+'ゴールドが ひつようです…」'], ()=>{ G.mode='field'; });
    return;
  }
  party.concat(reserve).forEach(p=>{ p.status=null; });
  U.msg(['しんかんさま「みなさん ごぶじで なにより」',
         '（けがれが きよめられた）'], ()=>{ A.heal(); G.mode='field'; });
}
function openChest(x,y){
  const key = P.map+':'+x+','+y;
  G.mode='msg';
  if(G.gotTreasure[key]){ U.msg(['たからばこは からっぽだ。'], ()=>{ G.mode='field'; }); return; }
  G.gotTreasure[key]=true;
  if(A.chest) A.chest();
  V.chest(x,y);
  const r=Math.random();
  if(r<0.45){
    const g=30+Math.floor(Math.random()*40); P.gold+=g;
    U.msg(['たからばこを あけた！', g+'ゴールドを てにいれた！'], ()=>{ U.hud(); G.mode='field'; });
  }else if(r<0.8){
    P.herbs+=2;
    U.msg(['たからばこを あけた！','やくそうを 2つ てにいれた！'], ()=>{ G.mode='field'; });
  }else{
    P.waters+=1;
    U.msg(['たからばこを あけた！','まほうのせいすいを てにいれた！'], ()=>{ G.mode='field'; });
  }
}
// ---------------- 第1章の しめくくり ----------------
function triggerEnding(){
  G.flags.ch1_cleared=true;
  G.cleared=true;
  questAdvance('ch1_q5_cause','active');
  U.msg([
    'おう「リオン。おまえは よく やった。ゆきぐさまで とりもどした」',
    '「だが むすめは めざめぬ。……これは ヴェルサだけの ことでは あるまい」',
    'きしだんちょう「だんちょうとして いう。おまえを たびに だす」',
    'おう「せかいを みてこい。おなじ ねむりが どこかで おきているなら、',
    'その もとを つきとめるのだ」',
    '',
    'リオンは かるく うなずき、こしの けんに てを かけた。',
    'まどの そとでは、むらさきの ゆきが しずかに ふりつづけている。'
  ], ()=>{
    V.chapterCard('第1章 完', 'わかき きし', ()=>{ offerNextChapter(2, 'わかき きし'); });
  });
}
// ボスの ばしょ・とうじょうの ことば・たおした あとは 章データから ひく
function bossInfoAt(map){
  if(!CHD) return null;
  // まず いまの 章、なければ ぜんしょうから さがす（えがきは どの マップでも ひく）
  const here = CHD.bossAt(G.chapter||1, map);
  if(here) return here;
  for(const no of CHD.list()){
    const b = CHD.bossAt(no, map);
    if(b) return b;
  }
  return null;
}
function triggerBoss(x,y){
  // ★章データに かかれた ボスを ひく（章を ふやしても ここは さわらない）
  const bi = bossInfoAt(P.map);
  if(bi){
    G.mode='msg';
    if(bi.clearedFlag && G.flags[bi.clearedFlag]){
      U.msg(bi.after || ['もう だれも いない。'], ()=>{ G.mode='field'; });
      return;
    }
    // ★いらいを うけて いないと たたかいに ならない
    if(bi.needFlag && !G.flags[bi.needFlag]){
      U.msg(bi.lockMsg || ['まだ ここには ようが ない。'], ()=>{ G.mode='field'; });
      return;
    }
    // ★だいじなものが ないと たたかいに ならない
    if(bi.needKey && !hasKey(bi.needKey)){
      U.msg(bi.lockMsg || ['まだ ここには はいれない。'], ()=>{ G.mode='field'; });
      return;
    }
    U.msg(bi.intro || ['まものが たちふさがった！'], ()=>{ startBattle(bi.key); });
    return;
  }
  if(G.flags.desgran){
    G.mode='msg';
    U.msg(['まおうの きえた あとに、こげた いわだけが のこっている。'], ()=>{ G.mode='field'; });
    return;
  }
  G.mode='msg';
  U.msg(['どうくつの さいおくに、ぜつぼうの ちからが とぐろを まいている。',
         'デスグラン「よくぞ ここまで きたな、ちいさき ひかりよ。',
         'すべてを のみこむ やみを、その めに やきつけよ！」',
         'まおう デスグランが たちふさがった！'], ()=>{ startBattle('desgran1'); });
}
function openShop(kind){
  const list = SHOPS[P.map+':'+(kind||'S')]; if(!list) return;
  G.mode='menu';
  const items = list.map(it=>it.name+'　'+it.price+'G').concat(['やめる']);
  U.menu(items, 'なにを かいますか？', (sel)=>{
    if(sel>=list.length){ G.mode='field'; return; }
    const it = list[sel];
    G.mode='msg';
    if(P.gold < it.price){ U.msg(['ゴールドが たりないようです。'], ()=>{ G.mode='field'; }); return; }
    P.gold -= it.price;
    if(it.kind==='h'){ P.herbs++; U.msg([it.name+'を かった！'], ()=>{ U.hud(); G.mode='field'; }); return; }
    if(it.kind==='wtr'){ P.waters++; U.msg([it.name+'を かった！'], ()=>{ U.hud(); G.mode='field'; }); return; }
    // その わくが いちばん よわい なかまに そうび（きゅうそうびは ふくろへ）
    const slot = it.kind==='w'?'weapon':'armor';
    const target = party.slice().sort((a,b)=>
      ((a[slot]?a[slot].v:0)-(b[slot]?b[slot].v:0)))[0];
    if(target[slot] && target[slot].v>=it.v){
      U.msg(['すでに もっと よい そうびを つけています。'], ()=>{ P.gold+=it.price; U.hud(); G.mode='field'; });
      return;
    }
    if(target[slot]) P.equipBag.push(target[slot]);
    target[slot] = {kind:it.kind, name:it.name, v:it.v};
    U.msg([it.name+'を かった！', target.name+'が そうびした！'], ()=>{ U.hud(); G.mode='field'; });
  });
}

// ---------------- 戦闘 ----------------
// ひとり たびの あいだは じょうたい いじょうを うけにくくする
function statusText(type){
  return type==='sleep'   ? 'ねむってしまった！'
       : type==='confuse' ? 'こんらんした！'
       : type==='freeze'  ? 'こおりついた！'
       : type==='slow'    ? 'うごきが にぶった！'
       : 'じょうたいが おかしい！';
}
// にぶっていると すばやさが はんぶんに なる（こうどうは できる）
function effAgi(m){ return m.status==='slow' ? m.agi*0.5 : m.agi; }
function inflictP(e){
  if(!e.inflict) return 0;
  return party.length===1 ? e.inflict.p*0.6 : e.inflict.p;
}
function makeEnemy(def){
  const e = JSON.parse(JSON.stringify(def));
  e.maxhp = e.hp; e.dispName = e.name; e.status = null;
  return e;
}
function startBattle(kind){
  if(A.battleBgm) A.battleBgm(kind ? 'boss' : 'battle');
  let enemies;
  if(kind){
    enemies = [makeEnemy(MIDBOSS[kind])];
    // ★そうしボス：章データに pair が あれば 2たいで あらわれる
    {
      const bi = bossInfoAt(P.map);
      if(bi && bi.key === kind && bi.pair && MIDBOSS[bi.pair]){
        enemies.push(makeEnemy(MIDBOSS[bi.pair]));
      }
    }
  }else{
    // レベルが たりない まものは まだ でてこない（はじまりの ちいきを あんぜんに たもつ）
    let all = byMapCh[(G.chapter||1)+':'+P.map] || byMap[P.map];
    if(!all){
      const m=MAPS[P.map];
      const z=(m&&m.encZones||[]).find(z=>P.x>=z.x0&&P.x<=z.x1&&P.y>=z.y0&&P.y<=z.y1);
      all = z ? z.pool : ['icicleslime'];
    }
    const plv = party[0].lv;
    let pool = all.filter(k=>{
      const e = ENEMIES.find(x=>x.key===k);
      return !e || !e.minLv || e.minLv<=plv;
    });
    // どれも でられない ＝ レベルが たりないのに おくへ きた ばあい。
    // ここは まもらない（ふかいりの きけんは のこす）
    if(!pool.length) pool = all;
    const lv = party[0].lv;
    const byLv    = lv<4 ? 1 : (lv<9 ? 2 : 3);          // レベルが ひくいうちは たいぐんに ならない
    // ★ひとりの ときも、そだつに つれて かずを ふやす。
    //   2たい どまりだと けいけんちが たまらず、レベルあげが ながすぎる
    //   （第2章で Lv12まで 188せん かかっていた）。
    const byParty = party.length===1 ? (lv<5 ? 1 : lv<9 ? 2 : 3)
                                     : party.length+1;
    const maxN = Math.min(byLv, byParty);
    const n = Math.min(maxN, 1 + (Math.random()<0.45?1:0) + (Math.random()<0.18?1:0));
    enemies = [];
    for(let i=0;i<n;i++){
      const key = pool[Math.floor(Math.random()*pool.length)];
      enemies.push(makeEnemy(ENEMIES.find(x=>x.key===key)));
    }
  }
  // おなじ しゅるいが ふくすう いるときは A・B・C を つけて みわけられるように する
  const cnt0={};
  enemies.forEach(e=>{ cnt0[e.name]=(cnt0[e.name]||0)+1; });
  const idx={};
  enemies.forEach(e=>{
    if(cnt0[e.name]>1){
      idx[e.name]=(idx[e.name]||0)+1;
      e.dispName = e.name + 'ABCDEF'.charAt(idx[e.name]-1);
    }
  });
  enemies.forEach(e=>{ const d=G.dex[e.key]=G.dex[e.key]||{seen:0,kill:0}; d.seen++; });
  G.battle = {enemies, named:kind||null, round:0, order:[], queue:[], fled:false};
  G.mode='battle';
  // ★ここで A.bgm() を よぶと きょくが とまる（bgm は フィールドようで、
  //   いまは とめる しょりに なっている）。せんとうきょくは startBattle で たのむ。
  V.battleEnter(enemies, ()=>{
    const cnt={}; enemies.forEach(e=>{ cnt[e.name]=(cnt[e.name]||0)+1; });
    const intro = Object.keys(cnt).map(n=>cnt[n]>1?n+' '+cnt[n]+'たい':n).join('と ')+'が あらわれた！';
    U.msg([intro], ()=>beginRound());
  });
}
function beginRound(){
  const b=G.battle; if(!b) return;
  b.round++;
  if(b.round>200){ endBattle(false); return; }  // 安全弁
  b.queue=[];
  // じょうたい いじょうの かいふく はんてい
  // ひとりの ときは、ねむり・こんらんで なにも できない じかんが ながすぎるため さめやすくする
  const solo = party.length===1;
  const wakeSleep   = solo ? 0.60 : 0.34;
  const wakeConfuse = solo ? 0.62 : 0.38;
  const wakeFreeze  = solo ? 0.62 : 0.40;   // こおりは とけやすい
  const wakeSlow    = 0.30;                 // にぶりは こうどうできるので きゅうさいは しない
  // ★なおった ことを かならず しらせる。
  //   しらせが ないと 「じねんに なおらない」と おもわれて しまう。
  const RECOVER_MSG = {
    sleep:  'は めを さました！',
    confuse:'は しょうきに もどった！',
    freeze: 'の こおりが とけた！',
    slow:   'の うごきが もどった！',
  };
  const healed = [];
  party.forEach(m=>{
    const st = m.status;
    let ok = false;
    if(st==='sleep'   && Math.random()<wakeSleep)   ok = true;
    else if(st==='confuse' && Math.random()<wakeConfuse) ok = true;
    else if(st==='freeze'  && Math.random()<wakeFreeze)  ok = true;
    else if(st==='slow'    && Math.random()<wakeSlow)    ok = true;
    if(ok){ m.status = null; healed.push(m.name + (RECOVER_MSG[st] || 'は もとに もどった！')); }
  });
  if(healed.length){
    U.msg(healed, ()=>{ U.hud(); collectCommands(0); });
    return;
  }
  collectCommands(0);
}
function collectCommands(i){
  const b=G.battle; if(!b) return;
  const list = party.filter(p=>p.hp>0);
  if(i>=list.length){ resolveRound(); return; }
  const m = list[i];
  if(m.status==='sleep'){ b.queue.push({actor:m, type:'sleep'}); collectCommands(i+1); return; }
  if(m.status==='confuse'){ b.queue.push({actor:m, type:'confused'}); collectCommands(i+1); return; }
  if(m.status==='freeze'){ b.queue.push({actor:m, type:'frozen'}); collectCommands(i+1); return; }
  if(G.tactic!=='manual'){ b.queue.push(autoCommand(m)); collectCommands(i+1); return; }
  G.menu={kind:'battle'};
  const items=['こうげき','じゅもん','どうぐ','ぼうぎょ','にげる'];
  U.menu(items, m.name, (sel)=>{
    if(sel===0){
      chooseTarget(m, (tgt)=>{
        if(tgt===null){ collectCommands(i); return; }        // もどる
        b.queue.push({actor:m, type:'attack', tgt}); collectCommands(i+1);
      });
    }
    else if(sel===1){
      const sp = knownSpells(m).filter(s=>s.mp<=m.mp);
      if(!sp.length){ G.mode='msg'; U.msg(['つかえる じゅもんが ない！'], ()=>{ G.mode='battle'; collectCommands(i); }); return; }
      U.menu(sp.map(spellLabel).concat(['もどる']), m.name+'　じゅもん', (k)=>{
        if(k>=sp.length){ collectCommands(i); return; }
        const chosen=sp[k];
        if(chosen.type==='dmg'){                             // たんたい こうげき じゅもんは あいてを えらぶ
          chooseTarget(m, (tgt)=>{
            if(tgt===null){ collectCommands(i); return; }
            b.queue.push({actor:m, type:'spell', sp:chosen, tgt}); collectCommands(i+1);
          });
          return;
        }
        // ★かいふく・じょうたいかいふく・そせいは 「だれに つかうか」を えらぶ
        if(spellNeedsTarget(chosen)){
          chooseMember(m, chosen, (tgt)=>{
            if(tgt===null){ collectCommands(i); return; }
            b.queue.push({actor:m, type:'spell', sp:chosen, tgt}); collectCommands(i+1);
          });
          return;
        }
        b.queue.push({actor:m, type:'spell', sp:chosen}); collectCommands(i+1);
      });
    }
    else if(sel===2){
      const opts=[];
      if(P.herbs>0) opts.push('やくそう '+P.herbs);
      if(P.waters>0) opts.push('まほうのせいすい '+P.waters);
      if(!opts.length){ G.mode='msg'; U.msg(['どうぐが ない！'], ()=>{ G.mode='battle'; collectCommands(i); }); return; }
      U.menu(opts.concat(['もどる']), 'どうぐ', (k)=>{
        if(k>=opts.length){ collectCommands(i); return; }
        b.queue.push({actor:m, type:opts[k].startsWith('やくそう')?'herb':'water'}); collectCommands(i+1);
      });
    }
    else if(sel===3){ b.queue.push({actor:m, type:'guard'}); collectCommands(i+1); }
    else { b.queue.push({actor:m, type:'flee'}); collectCommands(i+1); }
  });
}
function bestHeal(m, need){
  const sp = knownSpells(m).filter(s=>s.type==='heal' && s.mp<=m.mp).sort((a,b)=>b.max-a.max);
  if(!sp.length) return null;
  const enough = sp.filter(s=>s.max>=need).sort((a,b)=>a.mp-b.mp);
  return enough[0] || sp[0];      // まかなえる いちばん やすい じゅもん／なければ さいだい
}
// あいてが 2たい いじょう なら えらばせる。1たいなら そのまま。
// ★せんとうちゅうに 「だれに つかうか」を えらぶ。
//   ひとりしか いない ときは きかない。
const STATUS_JP = {sleep:'ねむり', confuse:'こんらん', freeze:'こおり', slow:'にぶり'};
function chooseMember(m, sp, done){
  const alive = (sp.type==='revive') ? party.filter(p=>p.hp<=0) : aliveMembers();
  if(!alive.length){ done(null); return; }
  if(alive.length===1){ done(alive[0]); return; }
  const label = alive.map(p=>{
    if(sp.type==='heal')  return p.name + '　HP' + p.hp + '/' + p.maxhp;
    if(sp.type==='cure')  return p.name + '　' + (p.status ? (STATUS_JP[p.status]||p.status) : 'そうかい');
    return p.name;
  });
  U.menu(label.concat(['もどる']), sp.name + '　だれに？', (k)=>{
    done(k >= alive.length ? null : alive[k]);
  });
}
function chooseTarget(m, cb){
  const alive = G.battle.enemies.filter(e=>e.hp>0);
  if(alive.length<=1){ cb(alive[0]||null); return; }
  U.menu(alive.map(e=>e.dispName).concat(['もどる']), 'だれを ねらう？', (k)=>{
    cb(k>=alive.length ? null : alive[k]);
  });
}
function autoCommand(m){
  const b=G.battle;
  const sp = knownSpells(m).filter(s=>s.mp<=m.mp);
  // ① たおれた なかまの そせい
  const dead = party.find(p=>p.hp<=0);
  if(dead){
    const rv = sp.find(s=>s.type==='revive');
    if(rv) return {actor:m, type:'spell', sp:rv, tgt:dead};
  }
  // ②-a ぜんたいかいふく（3にん いじょう きずついていたら）
  const hurtAll = party.filter(p=>p.hp>0 && p.hp<p.maxhp*0.62);
  if(hurtAll.length>=2){
    const ha = sp.filter(s=>s.type==='healall').sort((a,c)=>c.max-a.max)[0];
    if(ha) return {actor:m, type:'spell', sp:ha};
  }
  // ② かいふく（のこりHPの わりあいで はんだん）
  const wounded = party.filter(p=>p.hp>0 && p.hp<p.maxhp)
                       .sort((a,c)=>a.hp/a.maxhp - c.hp/c.maxhp);
  if(wounded.length){
    const tgt = wounded[0], need = tgt.maxhp - tgt.hp, ratio = tgt.hp/tgt.maxhp;
    const limit = (G.tactic==='inochi') ? 0.62 : 0.42;
    if(ratio < limit){
      const h = bestHeal(m, need);
      if(h) return {actor:m, type:'spell', sp:h, tgt};
      if(P.herbs>0 && ratio<0.34) return {actor:m, type:'herb', tgt};
    }
  }
  // ③ MPぎれなら せいすい
  if(m.maxmp>0 && m.mp<6 && P.waters>0 && knownSpells(m).some(s=>s.type==='heal'))
    return {actor:m, type:'water', tgt:m};
  // ④ こうげき
  const alive = b.enemies.filter(e=>e.hp>0);
  const dmg = sp.filter(s=>s.type==='dmg'||s.type==='dmgall');
  if(dmg.length && alive.length>=2){
    const all = dmg.find(s=>s.type==='dmgall');
    if(all && m.mp >= all.mp*2) return {actor:m, type:'spell', sp:all};
  }
  const single = dmg.filter(s=>s.type==='dmg').sort((a,c)=>c.max-a.max)[0];
  if(single && m.mp > single.mp*3 && mAtk(m) < single.max)
    return {actor:m, type:'spell', sp:single,
            tgt:alive.slice().sort((x,y)=>x.hp-y.hp)[0]};   // ぶつりが よわい なかまは じゅもん
  const weakest = alive.slice().sort((x,y)=>x.hp-y.hp)[0];
  return {actor:m, type:'attack', tgt:weakest};
}
function resolveRound(){
  const b=G.battle; if(!b) return;
  const acts = b.queue.slice();
  b.enemies.filter(e=>e.hp>0).forEach(e=>{
    const n = e.acts||1;
    for(let i=0;i<n;i++) acts.push({enemy:e, type:'enemy'});
  });
  acts.sort((a,c)=>{
    const av = a.actor?effAgi(a.actor):(a.enemy.agi);
    const cv = c.actor?effAgi(c.actor):(c.enemy.agi);
    return (cv+Math.random()*4)-(av+Math.random()*4);
  });
  party.forEach(p=>p.guard=false);
  stepAction(acts,0);
}
function stepAction(acts,i){
  const b=G.battle; if(!b) return;
  if(b.enemies.every(e=>e.hp<=0)){ victory(); return; }
  if(aliveMembers().length===0){ defeat(); return; }
  if(i>=acts.length){ beginRound(); return; }
  const a = acts[i];
  const next = ()=>stepAction(acts,i+1);
  if(a.type==='enemy'){
    if(a.enemy.hp<=0){ next(); return; }
    enemyAct(a.enemy, next); return;
  }
  if(a.actor.hp<=0){ next(); return; }
  memberAct(a, next);
}
function memberAct(a, done){
  const b=G.battle, m=a.actor;
  const alive = b.enemies.filter(e=>e.hp>0);
  if(a.type==='sleep'){ U.msg([m.name+'は ねむっている…'], done); return; }
  if(a.type==='frozen'){ U.msg([m.name+'は こおりついて うごけない！'], done); return; }
  if(a.type==='confused'){ // こんらん：てきか みかたか わからなくなる
    const allies=aliveMembers().filter(p=>p!==m);
    if(Math.random()<0.45 && allies.length){
      const t2=allies[Math.floor(Math.random()*allies.length)];
      const d2=Math.max(1, Math.floor(mAtk(m)*0.6) - Math.floor(mDef(t2)/2));
      t2.hp-=d2; A.hit(); U.hud();
      const l=[m.name+'は こんらんしている！', m.name+'は '+t2.name+'を こうげき！',
               t2.name+'は '+d2+'の ダメージを うけた！'];
      if(t2.hp<=0){ t2.hp=0; t2.status=null; l.push(t2.name+'は たおれた…'); }
      U.msg(l, done); return;
    }
    U.msg([m.name+'は こんらんしている！', m.name+'は ふらふらと あるきまわった。'], done);
    return;
  }
  if(a.type==='guard'){ m.guard=true; U.msg([m.name+'は みを まもっている。'], done); return; }
  if(a.type==='flee'){
    if(b.named){ U.msg(['にげられない！'], done); return; }
    if(Math.random()<0.6){ b.fled=true; if(A.flee) A.flee();
      U.msg([m.name+'たちは にげだした！'], ()=>endBattle(false)); }
    else U.msg([m.name+'は にげようとしたが まわりこまれた！'], done);
    return;
  }
  if(a.type==='herb'){
    if(P.herbs<=0){ done(); return; }
    P.herbs--;
    const t = a.tgt && a.tgt.hp>0 ? a.tgt : aliveMembers().sort((x,y)=>x.hp/x.maxhp-y.hp/y.maxhp)[0];
    const h = Math.min(t.maxhp-t.hp, 20+Math.floor(Math.random()*9));
    t.hp+=h; A.heal(); U.hud();
    V.fx('heal',{member:t}, ()=>U.msg([m.name+'は やくそうを つかった！', t.name+'の HPが '+h+' かいふく！'], done));
    return;
  }
  if(a.type==='water'){
    if(P.waters<=0){ done(); return; }
    P.waters--;
    const t = a.tgt && a.tgt.hp>0 ? a.tgt : aliveMembers().filter(p=>p.maxmp>0).sort((x,y)=>x.mp-y.mp)[0]||m;
    const h = Math.min(t.maxmp-t.mp, 30);
    t.mp+=h; A.heal(); U.hud();
    U.msg([m.name+'は まほうのせいすいを つかった！', t.name+'の MPが '+h+' かいふく！'], done);
    return;
  }
  if(a.type==='spell'){
    const sp=a.sp;
    if(m.mp<sp.mp){ U.msg([m.name+'は MPが たりない！'], done); return; }
    m.mp-=sp.mp; U.hud();
    if(sp.type==='heal'){
      const t = a.tgt && a.tgt.hp>0 ? a.tgt : aliveMembers().sort((x,y)=>x.hp/x.maxhp-y.hp/y.maxhp)[0];
      const h = Math.min(t.maxhp-t.hp, sp.min+Math.floor(Math.random()*(sp.max-sp.min+1)));
      t.hp+=h; A.heal(); U.hud();
      V.fx('heal',{member:t}, ()=>U.msg([m.name+'は '+sp.name+'を となえた！', t.name+'の HPが '+h+' かいふく！'], done));
      return;
    }
    if(sp.type==='healall'){
      const targets=aliveMembers();
      const lines=[m.name+'は '+sp.name+'を となえた！'];
      A.heal();
      targets.forEach(tg=>{
        const h=Math.min(tg.maxhp-tg.hp, sp.min+Math.floor(Math.random()*(sp.max-sp.min+1)));
        if(h>0){ tg.hp+=h; lines.push(tg.name+'の HPが '+h+' かいふく！'); }
      });
      if(lines.length===1) lines.push('しかし こうかが なかった。');
      U.hud();
      V.fx('heal',{}, ()=>U.msg(lines, done));
      return;
    }
    if(sp.type==='cure'){
      const t = party.find(p=>p.status) || m;
      t.status=null; A.heal();
      U.msg([m.name+'は '+sp.name+'を となえた！', t.name+'の じょうたいが もどった。'], done);
      return;
    }
    if(sp.type==='revive'){
      const t = party.find(p=>p.hp<=0);
      if(!t){ U.msg(['しかし こうかが なかった。'], done); return; }
      t.hp=Math.ceil(t.maxhp/2); t.status=null; A.heal(); U.hud();
      U.msg([m.name+'は '+sp.name+'を となえた！', t.name+'は いきかえった！'], done);
      return;
    }
    if(sp.type==='dmgall'){
      const lines=[m.name+'は '+sp.name+'を となえた！'];
      A.hit();
      V.fx('spellall',{}, ()=>{
        alive.forEach(e=>{
          const d = sp.min+Math.floor(Math.random()*(sp.max-sp.min+1));
          e.hp-=d; lines.push(e.dispName+'に '+d+'の ダメージ！');
          if(e.hp<=0){ e.hp=0; lines.push(e.dispName+'を たおした！'); killed(e); }
        });
        U.msg(lines, done);
      });
      return;
    }
    if(A.spell) A.spell();
    // ★defdown：あいての しゅびりょくを さげる
    if(sp.type==='defdown'){
      const alive = b.enemies.filter(e=>e.hp>0);
      if(!alive.length){ done(); return; }
      const tg = (a.tgt && a.tgt.hp>0) ? a.tgt : alive[0];
      m.mp -= sp.mp;
      const cut = sp.cut || 8;
      const before = eDef(tg);
      tg.defDown = {v:Math.min((tg.def|0), ((tg.defDown&&tg.defDown.v)||0) + cut)};
      const after = eDef(tg);
      const lines=[m.name+'は '+sp.name+'を となえた！'];
      if(after < before) lines.push(tg.dispName+'の しゅびりょくが さがった！');
      else lines.push(tg.dispName+'には きかなかった。');
      U.msg(lines, done);
      return;
    }
    // dmg（単体）：えらんだ あいてが たおれていたら ほかへ
    const t = (a.tgt && a.tgt.hp>0) ? a.tgt : alive[0];
    if(!t){ done(); return; }
    const d = sp.min+Math.floor(Math.random()*(sp.max-sp.min+1));
    A.hit();
    V.fx('spell',{target:t}, ()=>{
      t.hp-=d;
      const lines=[m.name+'は '+sp.name+'を となえた！', t.dispName+'に '+d+'の ダメージ！'];
      if(t.hp<=0){ t.hp=0; lines.push(t.dispName+'を たおした！'); killed(t); }
      U.msg(lines, done);
    });
    return;
  }
  // 通常こうげき：えらんだ あいてが たおれていたら ほかへ
  const t = (a.tgt && a.tgt.hp>0) ? a.tgt
          : alive[Math.floor(Math.random()*alive.length)];
  if(!t){ done(); return; }
  const crit = Math.random()<1/16;
  let d = Math.max(1, mAtk(m) - Math.floor(eDef(t)/2) + Math.floor(Math.random()*5) - 2);
  if(crit) d = Math.floor(d*2);
  if(t.tough) d = crit ? Math.max(2, Math.floor(d*0.3)) : (Math.random()<0.5?1:2); // めったに きかない
  A.hit();
  V.fx('attack',{member:m, target:t}, ()=>{
    t.hp-=d;
    const lines=[m.name+'の こうげき！'];
    if(crit) lines.push('かいしんの いちげき！！');
    lines.push(t.dispName+'に '+d+'の ダメージ！');
    if(t.hp<=0){ t.hp=0; lines.push(t.dispName+'を たおした！'); killed(t); }
    U.msg(lines, done);
  });
}
// ★てきの しゅびりょく（よわめられて いれば さがる）
function eDef(e){
  const cut = e.defDown ? e.defDown.v : 0;
  return Math.max(0, (e.def|0) - cut);
}
function killed(e){ const d=G.dex[e.key]=G.dex[e.key]||{seen:1,kill:0}; d.kill++;
  // ★いらい（たおした かずを かぞえる）
  if(G.quota && G.quota.n < G.quota.need){
    G.quota.n++;
    if(G.quota.n >= G.quota.need) G.flags[G.quota.flag] = true;
  }
  if(A.defeat) A.defeat(); V.refresh(); }
function enemyAct(e, done){
  const alive = aliveMembers();
  if(!alive.length){ defeat(); return; }
  const lines=[];
  // にげる（ルスライム）
  if(e.fleeP && Math.random()<e.fleeP){
    e.hp=0; e.fled=true; V.refresh();
    U.msg([e.dispName+'は すばやく にげだした！'], ()=>{
      const b2=G.battle;
      if(b2 && b2.enemies.every(x=>x.hp<=0)){
        if(b2.enemies.every(x=>x.fled)) U.msg(['……にがして しまった。'], ()=>endBattle(false));
        else victory();
        return;
      }
      done();
    });
    return;
  }
  // とくぎ
  if(e.skill && Math.random()<e.skill.p){
    const ts=alive[Math.floor(Math.random()*alive.length)];
    let ds=Math.max(1, Math.floor(e.atk*e.skill.mul) - Math.floor(mDef(ts)/2) + Math.floor(Math.random()*5)-2);
    if(ts.guard) ds=Math.max(1, Math.ceil(ds*0.4));
    A.cue(); A.ehit();
    V.fx('enemyattack',{target:ts, from:e}, ()=>{
      ts.hp-=ds;
      lines.push(e.dispName+'の '+e.skill.name+'！',
                 ts.name+'は '+ds+'の ダメージを うけた！'+(ts.guard?'（ぼうぎょ）':''));
      if(e.drain){
        const h=Math.min(e.maxhp-e.hp, Math.floor(ds*e.drain));
        if(h>0){ e.hp+=h; lines.push(e.dispName+'は HPを '+h+' すいとった！'); }
      }
      if(ts.hp<=0){ ts.hp=0; ts.status=null; lines.push(ts.name+'は たおれた…'); }
      else if(e.inflict && Math.random()<inflictP(e) && !ts.status){
        ts.status=e.inflict.type;
        lines.push(ts.name+'は '+statusText(e.inflict.type));
      }
      U.hud(); U.msg(lines, done);
    });
    return;
  }
  // じゅもん
  if(e.spell && Math.random()<e.spell.p){
    const sp=e.spell;
    if(sp.kind==='heal'){
      const hurt=(G.battle.enemies.filter(x=>x.hp>0&&x.hp<x.maxhp)
                  .sort((a2,b2)=>a2.hp/a2.maxhp-b2.hp/b2.maxhp))[0];
      const tg=hurt||e;
      const h=Math.min(tg.maxhp-tg.hp, sp.lo+Math.floor(Math.random()*(sp.hi-sp.lo+1)));
      tg.hp+=h; A.heal();
      U.msg([e.dispName+'は '+sp.name+'を となえた！',
             tg.dispName+'の きずが ふさがった！ HPが '+h+' かいふく！'], done);
      return;
    }
    const tp=alive[Math.floor(Math.random()*alive.length)];
    let dp=sp.lo+Math.floor(Math.random()*(sp.hi-sp.lo+1));
    dp=Math.max(1, dp - Math.floor(mDef(tp)/5));
    if(tp.guard) dp=Math.max(1, Math.ceil(dp*0.5));
    A.cue(); A.ehit();
    V.fx('enemyattack',{target:tp, from:e}, ()=>{
      tp.hp-=dp;
      lines.push(e.dispName+'は '+sp.name+'を となえた！',
                 tp.name+'は '+dp+'の ダメージを うけた！');
      if(tp.hp<=0){ tp.hp=0; tp.status=null; lines.push(tp.name+'は たおれた…'); }
      else{
        const inf = e.spellInflict || e.inflict;     // うたは ねむらせ、まなざしは にぶらせる
        if(inf && Math.random()<inflictP({inflict:inf}) && !tp.status){
          tp.status=inf.type;
          lines.push(tp.name+'は '+statusText(inf.type));
        }
      }
      U.hud(); U.msg(lines, done);
    });
    return;
  }
  // ぜんたいわざ
  if(e.aoe && Math.random()<e.aoe.p){
    lines.push(e.dispName+'は '+e.aoe.name+'を はなった！');
    A.cue(); A.ehit();
    V.fx('enemyaoe',{from:e}, ()=>{
      alive.forEach(m=>{
        let d = e.aoe.lo + Math.floor(Math.random()*(e.aoe.hi-e.aoe.lo+1));
        d = Math.max(1, d - Math.floor(mDef(m)/4));   // いき・ぜんたいわざにも そうびが きく
        if(m.guard) d = Math.max(1, Math.ceil(d*0.4));
        m.hp-=d; lines.push(m.name+'は '+d+'の ダメージ！'+(m.guard?'（ぼうぎょ）':''));
        if(m.hp<=0){ m.hp=0; m.status=null; lines.push(m.name+'は たおれた…'); }
      });
      U.hud(); U.msg(lines, done);
    });
    return;
  }
  const t = alive[Math.floor(Math.random()*alive.length)];
  let d = Math.max(1, e.atk - Math.floor(mDef(t)/2) + Math.floor(Math.random()*5) - 2);
  if(t.guard) d = Math.max(1, Math.ceil(d*0.4));
  A.cue(); A.ehit();
  V.fx('enemyattack',{target:t, from:e}, ()=>{
    t.hp-=d;
    lines.push(e.dispName+'の こうげき！', t.name+'は '+d+'の ダメージを うけた！'+(t.guard?'（ぼうぎょ）':''));
    if(e.drain){
      const h=Math.min(e.maxhp-e.hp, Math.floor(d*e.drain));
      if(h>0){ e.hp+=h; lines.push(e.dispName+'は HPを '+h+' すいとった！'); }
    }
    if(t.hp<=0){ t.hp=0; t.status=null; lines.push(t.name+'は たおれた…'); }
    else if(e.inflict && Math.random()<inflictP(e) && !t.status){
      t.status=e.inflict.type;
      lines.push(t.name+'は '+statusText(e.inflict.type));
    }
    U.hud(); U.msg(lines, done);
  });
}
// けいたい へんかの れんせん（HP・MPは ひきつぐ）
function bossPhase(next, lines){
  showMsg2(lines, ()=>{
    G.battle=null; G.menu=null;
    startBattle(next);
  });
}
function showMsg2(lines, cb){ U.msg(lines, cb); }
function victory(){
  const b=G.battle;
  if(A.bgmStop) A.bgmStop();      // しょうりBGMは はいし。せんとうきょくを とめるだけ。
  if(b.named==='desgran1'){
    A.win();
    bossPhase('desgran2', [
      'デスグランの りょううでが、くだけおちた！',
      'デスグラン「うでなど いらぬ……おんねんこそ が わが ちから！」',
      'まおうは おんねんの ほのおに みを ゆだねた！']);
    return;
  }
  if(b.named==='desgran2'){
    A.win();
    bossPhase('desgran3', [
      'デスグランの かたから、むすうの しょくしゅが ふきだした！',
      'はらに きょだいな めと くちが ひらいていく——',
      'デスグラン「これが……まじんの すがた だ！！」']);
    return;
  }
  const got = b.enemies.filter(e=>!e.fled);
  // ★ばしょに よって けいけんちが かわる（かせぎばを つくる）
  const mul = EXP_MUL[P.map] || 1;
  const exp = Math.round(got.reduce((a,e)=>a+e.exp,0) * mul);
  const gold = got.reduce((a,e)=>a+e.gold,0);
  P.gold += gold;
  A.win();
  const lines=['まものたちを たおした！','けいけんち '+exp+'、'+gold+'ゴールドを かくとく！'];
  let leveled=false;
  aliveMembers().concat(reserve.filter(m=>m.hp>0)).forEach(m=>{
    m.exp += exp;
    while(m.exp >= expNext(m)){
      m.exp -= expNext(m); m.lv++; leveled=true;
      const g = CLASSES[m.cls].g;
      m.maxhp+=g.hp; m.maxmp+=g.mp; m.batk+=g.atk; m.bdef+=g.def;
      if(m.lv%2===0) m.agi+=g.agi;
      m.hp=m.maxhp; m.mp=m.maxmp;
      lines.push(m.name+'は レベル'+m.lv+'に あがった！');
      const ns = CLASSES[m.cls].learns.find(l=>l.lv===m.lv);
      if(ns) lines.push(m.name+'は '+SPELL_DEFS[ns.key].name+'を おぼえた！');
    }
  });
  if(leveled) A.lvup();
  // ★章データの ボスごほうび（第2章いこうは これだけで うごく）
  {
    const cd = chData();
    const rw = cd && cd.bossReward && cd.bossReward[b.named];
    if(rw && (G.chapter||1)!==1){
      (rw.set||[]).forEach(f=>{ G.flags[f]=true; });
      if(rw.giveKey) giveKey(rw.giveKey);
      // ★なかまが たびだつ／たおれる（ゼフの ぎせい）
      if(rw.removeMember){
        const i2 = party.findIndex(p=>p.cls===rw.removeMember);
        if(i2>=0) party.splice(i2,1);
        else{ const i3 = reserve.findIndex(p=>p.cls===rw.removeMember);
              if(i3>=0) reserve.splice(i3,1); }
        V.setActors(true); U.hud();
      }
      if(rw.takeKey) takeKey(rw.takeKey);
      if(rw.setState && WORLD.TOWN_STATES[rw.setState]) G.townState = rw.setState;
      Object.keys(rw.quest||{}).forEach(q=>questAdvance(q, rw.quest[q]));
      lines.push(...(rw.msg||[]));
    }
  }
  if(b.named==='yumebanken'){
    G.flags.ch1_gotHerb=true;
    giveKey('yukigusa');
    questAdvance('ch1_q3_retrieve','clear');
    questAdvance('ch1_q4_medicine','active');
    G.townState='SLEEPING_SICKNESS';        // しんしょくは しりぞいたが びょうは のこる
    lines.push('',
      'ゆめの ばんけんは、しろい いきを はいて ほどけていった。',
      '＜……もう、みはらなくて いいのか＞',
      'けものの いた あとに、あおく ひかる くさが のこされていた。',
      '',
      '＊ ゆきぐさを てにいれた！ ＊',
      'これを もって ヴェルサリアへ もどろう。');
  }
  if(b.named==='desgran3'){
    G.flags.desgran=true; G.cleared=true;
    lines.push('',
      'デスグラン「ばかな……この わしが、こんな ちいさな ひかりに……」',
      'まじんの からだが くずれ、やみが けむりと なって きえていく。',
      'どうくつの おくから、あさの ひかりが さしこんできた。',
      '',
      '＊＊ ぎじゅつスライス ここまで ＊＊');
  }
  U.hud();
  // ★れんせん：ボスが すがたを かえる（HP・MPは そのまま）
  const _cd6 = chData();
  const nxRw = (b && b.named && _cd6 && _cd6.bossReward) ? _cd6.bossReward[b.named] : null;
  if(nxRw && nxRw.nextBoss && MIDBOSS[nxRw.nextBoss]){
    U.msg(lines, ()=>{ startBattle(nxRw.nextBoss); });
    return;
  }
  U.msg(lines, ()=>endBattle(true));
}
function defeat(){
  A.lose();
  U.msg(['ぜんめつ してしまった…'], ()=>{
    party.concat(reserve).forEach(m=>{ m.hp=m.maxhp; m.mp=m.maxmp; m.status=null; });
    P.gold = Math.floor(P.gold/2);
    G.battle=null;
    G.busy=true;
    if(A.bgmStop) A.bgmStop();
    V.battleLeave(()=>{
      const h=homePoint();
      moorShipFor(h.map);                      // ★ふねも いえの はまへ
      P.map=h.map; P.x=h.x; P.y=h.y; G.trail=[[h.x,h.y],[h.x,h.y]];
      V.buildMap(h.map); V.setActors(); U.label(WORLD.mapName(h.map)); U.hud();
      A.bgm(h.map);
      G.mode='field'; G.busy=false;
      U.msg(['きがつくと '+h.name+'に いた。','（ゴールドを はんぶん おとした…）'], ()=>{});
    });
  });
}
function endBattle(won){
  // ★せんとうが おわったら じょうたい いじょうは とける。
  //   のこったままだと、あるいて いる あいだ ずっと こんらんの ままに なる。
  party.forEach(p=>{ if(p.hp>0) p.status=null; });
  G.battle=null; G.menu=null;
  G.busy=true;
  V.battleLeave(()=>{
    A.bgm(P.map);
    G.mode='field'; G.busy=false; V.setActors(); U.hud();
  });
}

// ---------------- ぎょうしょう（あきない）----------------
// バルドは しょうにん。まちごとに そうばが ちがう ものを はこんで もうける。
// おなじ まちで かって うっても そんを する ように、うりねは かいねの 85%。
const TRADE_GOODS = {
  nuno:   {key:'nuno',   name:'ぬの',          base:20},
  spice:  {key:'spice',  name:'こうしんりょう',  base:60},
  glass:  {key:'glass',  name:'がらすだま',     base:40},
  dates:  {key:'dates',  name:'ほしたなつめ',   base:15},
  silver: {key:'silver', name:'ぎんの かざり',  base:120},
};
// まちごとの そうば（1.0が きじゅん）
const TRADE_MARKET = {
  zaal_town:  {nuno:0.70, spice:1.45, glass:0.75, dates:1.35, silver:1.15},
  zaal_oasis: {nuno:1.50, spice:0.60, glass:1.40, dates:0.65, silver:0.85},
  versa_town: {nuno:1.20, spice:1.30, glass:0.90, dates:1.50, silver:0.80},
  versa_town2:{nuno:0.85, spice:1.20, glass:1.30, dates:1.20, silver:1.10},
};
function tradeTowns(){ return Object.keys(TRADE_MARKET); }
// そうばは まちに はいる たびに すこし ゆれる
function marketSeed(map){
  const t = (G.marketTick|0);
  let h = 0, s = map + ':' + t;
  for(let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function tradePrice(map, key){
  const g = TRADE_GOODS[key], mk = TRADE_MARKET[map];
  if(!g || !mk) return null;
  const wave = ((marketSeed(map + key) % 41) - 20) / 100;   // ±20%
  return Math.max(1, Math.round(g.base * mk[key] * (1 + wave)));
}
function sellPrice(map, key){
  const p = tradePrice(map, key);
  return p === null ? null : Math.max(1, Math.round(p * 0.85));
}
function goodsCount(key){ return (P.goods && P.goods[key]) | 0; }
function goodsTotal(){ return Object.values(P.goods || {}).reduce((a,b)=>a+(b|0), 0); }
const GOODS_LIMIT = 30;                       // かつげる かず
function buyGood(map, key, n){
  const p = tradePrice(map, key);
  if(p === null) return {ok:false, msg:'ここでは あつかって いない。'};
  n = Math.max(1, n|0);
  if(goodsTotal() + n > GOODS_LIMIT) return {ok:false, msg:'これいじょうは かつげない。'};
  const cost = p * n;
  if(P.gold < cost) return {ok:false, msg:'ゴールドが たりない。'};
  P.gold -= cost;
  P.goods = P.goods || {};
  P.goods[key] = goodsCount(key) + n;
  return {ok:true, msg:TRADE_GOODS[key].name + 'を ' + n + 'こ しいれた！（' + cost + 'G）', cost};
}
function sellGood(map, key, n){
  const p = sellPrice(map, key);
  if(p === null) return {ok:false, msg:'ここでは ひきとって もらえない。'};
  const have = goodsCount(key);
  if(have <= 0) return {ok:false, msg:'もって いない。'};
  n = Math.min(have, Math.max(1, n|0));
  const gain = p * n;
  P.gold += gain;
  P.goods[key] = have - n;
  if(P.goods[key] <= 0) delete P.goods[key];
  // ★はじめて もうけたら しょうかいちょうが ほめる（ものがたりの めじるし）
  G.tradeProfit = (G.tradeProfit | 0) + gain;
  return {ok:true, msg:TRADE_GOODS[key].name + 'を ' + n + 'こ うった！（' + gain + 'G）', gain};
}
// ---------------- じゅもん（せんとうの そとで つかう）----------------
// そとで つかえるのは かいふく・じょうたい かいふく・そせい だけ。
// こうげき じゅもんは 「ここでは つかえない」。
// ★けっかい：ここを とおるには じょうけんが いる
const WARDS = {
  elde_tower: {chapter:4, flag:'ch4_gotTowerKey',
    msg:['とうの とびらは かたく とじて いる。',
         'ミオ「かぎが ないと あきません」',
         'ゼフ「こやに あずけて あった はずじゃ。さんどうの こやへ」']},
  minamo_dgn1: {chapter:3, flag:'ch3_sawDream',
    msg:['ほらの いりぐちに、うすい ひかりの まくが はっている。',
         'てを のばすと、しおの ような つめたさに はじかれた。',
         'セナ「……けっかい。だれかが、なかを まもってる」',
         'ルカ「あの ずきんの やつ？」',
         'セナ「たぶん。あれを どうにか しないと、はいれない」']},
};
// ★こぶねの わたし（第3章）：さんばしの さきと、むこうの しまの はまべ
const FERRY = {
  // みなとの さんばし → むこうの しま
  minamo_port: {x:15, y:2,  to:'world', tx:50, ty:60,
    msg:['こぶねに のった。',
         'ルカ「しおに のれば、あっという まね」',
         'なみを こえて、むこうの しまへ——']},
};
// ワールドの はまべ（むこうの しま）→ みなとへ もどる
const FERRY_BACK = {x:49, y:60, to:'minamo_port', tx:14, ty:3,
  msg:['こぶねに のった。', 'みなとへ もどろう——']};
const FIELD_SPELL = {heal:true, cure:true, revive:true, healall:true, 'return':true};
// リターンで いける ばしょ（いちど おとずれた ところ だけ）
// ★リターンさきは 「いまの しょうの ちほう」だけ。
//   しょうは それぞれ べつの ものがたりなので、ほかの ちほうへ とんでは いけない
//   （第2章の バルドが 第1章の まちへ とんで、リオンあての せりふが でる ふぐあいが あった）。
function allReturnSpots(){
  if(!CHD) return [];
  const cd = CHD.get(G.chapter||1);
  return (cd && cd.returnSpots) ? cd.returnSpots.slice() : [];
}
function returnDestinations(){
  return allReturnSpots()
    .filter(s=>MAPS[s.map] && G.visited[s.map])
    .map(s=>({...s, name:WORLD.mapName(s.map)}));
}
// どうくつの なかでは つかえない（DQと おなじ）
function canReturnHere(){
  const th = (MAPS[P.map]||{}).theme;
  return th!=='ice' && th!=='cave';
}
function castReturn(ci, di){
  const m = party[ci], sp = SPELL_DEFS.ret;
  const list = returnDestinations();
  const d = list[di];
  if(!m || !d) return {ok:false, lines:['どこへ いく？']};
  if(!canReturnHere()) return {ok:false, lines:['ここでは つかえない。','そとへ でなければ ならない。']};
  if(m.mp < sp.mp) return {ok:false, lines:['MPが たりない！']};
  m.mp -= sp.mp;
  moorShipFor(d.map);                          // ★ふねも いきさきの はまへ
  return {ok:true, warp:{to:d.map, x:d.x, y:d.y},
          lines:[m.name+'は リターンを となえた！','ひかりに つつまれ、そらへ まいあがった——']};
}
function fieldSpells(m){
  return knownSpells(m).filter(s=>FIELD_SPELL[s.type]);
}
function spellNeedsTarget(sp){ return sp.type==='heal' || sp.type==='cure' || sp.type==='revive'; }
function castField(ci, key, ti){
  const m = party[ci];
  const sp = SPELL_DEFS[key];
  if(!m || !sp) return {ok:false, lines:['その じゅもんは つかえない。']};
  if(m.hp<=0)   return {ok:false, lines:[m.name+'は たおれている。']};
  if(!FIELD_SPELL[sp.type]) return {ok:false, lines:['ここでは つかっても しかたが ない。']};
  if(m.mp < sp.mp) return {ok:false, lines:['MPが たりない！']};

  const t = (ti===undefined||ti===null) ? null : party[ti];
  const lines = [m.name+'は '+sp.name+'を となえた！'];

  if(sp.type==='heal'){
    if(!t) return {ok:false, lines:['だれに つかう？']};
    if(t.hp<=0) return {ok:false, lines:[t.name+'は たおれている。リヴァイブが ひつよう だ。']};
    if(t.hp>=t.maxhp) return {ok:false, lines:[t.name+'の HPは まんたんだ。']};
    m.mp -= sp.mp;
    const v = Math.min(t.maxhp-t.hp, sp.min+Math.floor(Math.random()*(sp.max-sp.min+1)));
    t.hp += v;
    lines.push(t.name+'の HPが '+v+' かいふくした！');
  }else if(sp.type==='healall'){
    const alive = party.filter(x=>x.hp>0 && x.hp<x.maxhp);
    if(!alive.length) return {ok:false, lines:['みんな げんきだ。']};
    m.mp -= sp.mp;
    alive.forEach(x=>{
      const v = Math.min(x.maxhp-x.hp, sp.min+Math.floor(Math.random()*(sp.max-sp.min+1)));
      x.hp += v;
      lines.push(x.name+'の HPが '+v+' かいふくした！');
    });
  }else if(sp.type==='cure'){
    if(!t) return {ok:false, lines:['だれに つかう？']};
    if(!t.status) return {ok:false, lines:[t.name+'は なんとも ない。']};
    m.mp -= sp.mp;
    t.status = null;
    lines.push(t.name+'の からだが らくに なった！');
  }else if(sp.type==='revive'){
    if(!t) return {ok:false, lines:['だれに つかう？']};
    if(t.hp>0) return {ok:false, lines:[t.name+'は たおれていない。']};
    m.mp -= sp.mp;
    t.hp = Math.max(1, Math.floor(t.maxhp*0.5));
    t.status = null;
    lines.push(t.name+'は いきを ふきかえした！');
  }
  return {ok:true, lines};
}
// ---------------- だいじなもの（キーアイテム）----------------
const KEY_ITEMS = {
  lightsword:{key:'lightsword', name:'ひかりの けん',
    desc:'ちちの かたみの けん。ゆめを きりひらく ひかりが やどった。'},
  towerkey:{key:'towerkey', name:'とうの かぎ',
    desc:'けんきゅうとうの とびらを あける かぎ。こやに あずけて あった。'},
  dreamkey:{key:'dreamkey', name:'ゆめのかぎ',
    desc:'ゼフが 30ねんを かけて つくった かぎ。ゆめの たいりくへの とびらを ひらく。'},
  shard_n:{key:'shard_n', name:'ゆめのかけら（きた）',
    desc:'こおりの おくに おちた、しろく ひかる かけら。'},
  shard_e:{key:'shard_e', name:'ゆめのかけら（ひがし）',
    desc:'すなの いせきに ねむって いた かけら。'},
  shard_s:{key:'shard_s', name:'ゆめのかけら（みなみ）',
    desc:'かいしょくどうの おくで ゆれて いた かけら。'},
  shard_w:{key:'shard_w', name:'ゆめのかけら（にし）',
    desc:'けんきゅうとうの ちょうじょうに あった さいごの かけら。'},
  callshell:{key:'callshell', name:'よびがい',
    desc:'しろい かい。ふくと、ゆめの おくへ こえが とどくという。'},
  yukigusa:{id:'yukigusa', name:'ゆきぐさ',
            desc:'ミルカの くすしが つくる くすりの もと。まものに うばわれていた。'},
  medicine:{id:'medicine', name:'めざめの くすり',
            desc:'ゆきぐさから つくった くすり。ねむりを さます はず だった。'},
};
function hasKey(id){ return !!(P.keyItems && P.keyItems[id]); }
function giveKey(id){ P.keyItems = P.keyItems || {}; P.keyItems[id] = true; }
function takeKey(id){ if(P.keyItems) delete P.keyItems[id]; }
function keyItemList(){
  return Object.keys(P.keyItems||{}).map(k=>KEY_ITEMS[k]).filter(Boolean);
}
// ---------------- どうぐ（せんとうの そとで つかう）----------------
function itemList(){
  const out=[];
  if(P.herbs>0)  out.push({kind:'h',   name:'やくそう',         num:P.herbs});
  if(P.waters>0) out.push({kind:'wtr', name:'まほうのせいすい', num:P.waters});
  return out;
}
function useItemField(kind, mi){
  const m = party[mi];
  if(!m) return {ok:false, lines:['だれに つかう？']};
  if(kind==='h'){
    if(P.herbs<=0) return {ok:false, lines:['やくそうを もっていない。']};
    if(m.hp<=0)    return {ok:false, lines:[m.name+'は たおれている。きょうかいへ いこう。']};
    if(m.hp>=m.maxhp) return {ok:false, lines:[m.name+'の HPは まんたんだ。']};
    P.herbs--;
    const h=Math.min(m.maxhp-m.hp, 20+Math.floor(Math.random()*9));
    m.hp+=h;
    return {ok:true, lines:[m.name+'は やくそうを つかった！', m.name+'の HPが '+h+' かいふく！']};
  }
  if(kind==='wtr'){
    if(P.waters<=0) return {ok:false, lines:['まほうのせいすいを もっていない。']};
    if(m.maxmp<=0)  return {ok:false, lines:[m.name+'は じゅもんを つかえない。']};
    if(m.mp>=m.maxmp) return {ok:false, lines:[m.name+'の MPは まんたんだ。']};
    P.waters--;
    const h=Math.min(m.maxmp-m.mp, 30);
    m.mp+=h;
    return {ok:true, lines:[m.name+'は まほうのせいすいを つかった！', m.name+'の MPが '+h+' かいふく！']};
  }
  return {ok:false, lines:['つかえない。']};
}
// ---------------- そうび ----------------
function slotOf(it){ return it && it.kind==='w' ? 'weapon' : 'armor'; }
function equipCandidates(slot){
  return (P.equipBag||[]).map((it,i)=>({it,i})).filter(x=>slotOf(x.it)===slot);
}
function equipFromBag(mi, bagIndex){
  const m=party[mi], it=P.equipBag[bagIndex];
  if(!m||!it) return {ok:false, lines:['そうびできない。']};
  const slot=slotOf(it);
  const cur=m[slot];
  m[slot]=it;
  P.equipBag.splice(bagIndex,1);
  if(cur) P.equipBag.push(cur);
  return {ok:true, lines:[m.name+'は '+it.name+'を そうびした！'
    + (cur ? '（'+cur.name+'は ふくろへ）' : '')]};
}
function unequip(mi, slot){
  const m=party[mi];
  if(!m||!m[slot]) return {ok:false, lines:['はずす ものが ない。']};
  const cur=m[slot];
  m[slot]=null; P.equipBag.push(cur);
  return {ok:true, lines:[m.name+'は '+cur.name+'を はずした。']};
}
function equipSummary(mi){
  const m=party[mi];
  return [m.name+'　こうげき '+mAtk(m)+'　しゅび '+mDef(m),
          '　みぎて：'+(m.weapon?m.weapon.name+'（+'+m.weapon.v+'）':'なし'),
          '　からだ：'+(m.armor ?m.armor.name +'（+'+m.armor.v +'）':'なし')];
}
// ---------------- セーブ ----------------
const SAVE_VERSION = 2;
const SAVE_SLOTS = ['LQ3_SAVE_1','LQ3_SAVE_2','LQ3_SAVE_3'];
let lastSaveError = null;

function store(s){
  if(s) return s;
  try{ return (typeof localStorage!=='undefined') ? localStorage : null; }catch(e){ return null; }
}
// --- v1 → v2：章べつパーティの あずかり所を つくる ---
const MIGRATIONS = {
  1:(d)=>{
    d.chapters = d.chapters || {};
    const ch = d.chapter || 1;
    d.chapters[ch] = {party:d.party||[], gold:d.gold||0, flags:d.flags||{}};
    d.world = d.world || {visited:d.visited||{}, gotTreasure:d.gotTreasure||{}, dex:d.dex||{}};
    d.v = 2; return d;
  },
};
function migrate(d){
  let guard=0;
  while((d.v||1) < SAVE_VERSION && guard++<20){
    const f = MIGRATIONS[d.v||1];
    if(!f){ d.v = SAVE_VERSION; break; }
    d = f(d);
  }
  return d;
}
function snapshotChapter(){          // いまの 章の じょうたいを あずける
  G.chapters = G.chapters || {};
  G.chapters[G.chapter] = {
    party: party.map(serializeMember),
    reserve: reserve.map(serializeMember),
    ship: G.ship, aboard: G.aboard,
    gold: P.gold, herbs: P.herbs, waters: P.waters,
    map: P.map, x: P.x, y: P.y, dir: P.dir,
    flags: JSON.parse(JSON.stringify(G.flags||{})),
    visited: JSON.parse(JSON.stringify(G.visited||{})),   // ★しょうごとの あしあと
  };
}
function serializeMember(m){
  return {cls:m.cls, lv:m.lv, exp:m.exp, hp:m.hp, mp:m.mp,
          weapon:m.weapon, armor:m.armor, status:m.status};
}
// --- ぼうぎょてき ふくげん：こわれた セーブでも おちない ---
function reviveMember(o){
  const cls = CLASSES[o.cls] ? o.cls : 'sora';
  if(cls !== o.cls) console.warn('[save] しらない クラス: '+o.cls+' → '+cls);
  const lv = Math.max(1, Math.min(LV_CAP, o.lv|0 || 1));
  const m = mkMember(cls, lv);          // のうりょくちは クラスとLvから さいけいさん
  m.exp = Math.max(0, o.exp|0);
  m.weapon = o.weapon || null;
  m.armor  = o.armor  || null;
  m.status = ['sleep','confuse','freeze','slow'].includes(o.status) ? o.status : null;
  m.hp = Math.max(0, Math.min(m.maxhp, (o.hp===undefined? m.maxhp : o.hp|0)));
  m.mp = Math.max(0, Math.min(m.maxmp, (o.mp===undefined? m.maxmp : o.mp|0)));
  return m;
}
function safeLanding(map, x, y){
  if(!MAPS[map]) return {map:'versa_town', x:13, y:18};   // マップが きえていたら はじまりへ
  if(walkable(map,x,y)) return {map,x,y};
  for(let r=1;r<=6;r++){                                   // かべの なかなら ちかくへ おしだす
    for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
      if(walkable(map,x+dx,y+dy)) return {map, x:x+dx, y:y+dy};
    }
  }
  return {map:'versa_town', x:13, y:18};
}
function saveGame(s, slot){
  const st = store(s); if(!st) return false;
  try{
    snapshotChapter();
    st.setItem(SAVE_SLOTS[slot||0], JSON.stringify({
      v:SAVE_VERSION, at:Date.now(),
      map:P.map, x:P.x, y:P.y, dir:P.dir,
      gold:P.gold, herbs:P.herbs, waters:P.waters, equipBag:P.equipBag, keyItems:P.keyItems,
      goods:P.goods, marketTick:G.marketTick, tradeProfit:G.tradeProfit, quota:G.quota,
      party: party.map(serializeMember),
      reserve: reserve.map(serializeMember),
      ship:G.ship, aboard:G.aboard,
      chapter:G.chapter, chapters:G.chapters,
      flags:G.flags, quests:G.quests,
      world:{visited:G.visited, gotTreasure:G.gotTreasure, dex:G.dex},
      tactic:G.tactic, cleared:G.cleared, townState:G.townState, night:G.night,
    }));
    lastSaveError=null;
    return true;
  }catch(e){ lastSaveError='ほぞんに しっぱいしました'; return false; }
}
function loadGame(s, slot){
  const st = store(s); if(!st) return false;
  let d;
  try{
    const raw = st.getItem(SAVE_SLOTS[slot||0]);
    if(!raw){ lastSaveError='きろくが ありません'; return false; }
    d = JSON.parse(raw);
  }catch(e){ lastSaveError='きろくが よめませんでした（データが こわれています）'; return false; }
  try{
    d = migrate(d);
    P.gold = Math.max(0, d.gold|0);
    P.herbs = Math.max(0, d.herbs|0);
    P.waters = Math.max(0, d.waters|0);
    P.equipBag = Array.isArray(d.equipBag) ? d.equipBag : [];
    P.keyItems = (d.keyItems && typeof d.keyItems==='object') ? d.keyItems : {};
    P.goods = (d.goods && typeof d.goods==='object') ? d.goods : {};
    G.marketTick = d.marketTick|0; G.tradeProfit = d.tradeProfit|0;
    G.quota = d.quota || null;
    P.dir = d.dir || 'front';
    G.ship = (d.ship && typeof d.ship.x==='number') ? {x:d.ship.x|0, y:d.ship.y|0} : null;
    // ★うみの うえで きろくして いたら、そのまま ふねの うえに もどす
    if(d.aboard && d.map==='world' && tileAt('world', d.x|0, d.y|0)==='~'){
      G.aboard = true;
      P.map='world'; P.x=d.x|0; P.y=d.y|0;
    }else{
      G.aboard = false;
      const land = safeLanding(d.map, d.x|0, d.y|0);
      P.map = land.map; P.x = land.x; P.y = land.y;
    }

    party.length = 0; reserve.length = 0;
    const ps = Array.isArray(d.party) && d.party.length ? d.party : [{cls:'lion',lv:1}];
    ps.forEach(o=>party.push(reviveMember(o)));
    (Array.isArray(d.reserve) ? d.reserve : []).forEach(o=>reserve.push(reviveMember(o)));

    G.chapter   = d.chapter || 1;
    G.chapters  = d.chapters || {};
    G.flags     = Object.assign({}, d.flags||{});
    G.quests    = d.quests || {};
    const w     = d.world || {};
    G.visited   = w.visited || d.visited || {};
    G.gotTreasure = w.gotTreasure || d.gotTreasure || {};
    G.dex       = w.dex || d.dex || {};
    G.tactic    = TACTICS[d.tactic] ? d.tactic : 'manual';
    G.cleared   = !!d.cleared;
    G.townState = WORLD.TOWN_STATES[d.townState] ? d.townState : 'NORMAL';
    G.night     = !!d.night;
    G.trail     = [[P.x,P.y],[P.x,P.y]];
    lastSaveError = null;
    return true;
  }catch(e){
    lastSaveError='きろくの ふくげんに しっぱいしました';
    return false;
  }
}
function saveInfo(s, slot){
  const st = store(s); if(!st) return null;
  try{
    const raw = st.getItem(SAVE_SLOTS[slot||0]);
    if(!raw) return null;
    const d = JSON.parse(raw);
    const lead = (d.party&&d.party[0]) ? (CLASSES[d.party[0].cls]||{}).name : '？';
    return {ver:d.v||1, chapter:d.chapter||1, lead, lv:(d.party&&d.party[0]?d.party[0].lv:1),
            gold:d.gold||0, map:WORLD.mapName(d.map||'')};
  }catch(e){ return {broken:true}; }
}
// 章の きりかえ（M2いこうで つかう）
function switchChapter(no, newParty){
  snapshotChapter();
  G.chapter = no;
  const saved = (G.chapters||{})[no];
  party.length = 0; reserve.length = 0;
  if(saved && saved.party && saved.party.length){
    saved.party.forEach(o=>party.push(reviveMember(o)));
    (saved.reserve||[]).forEach(o=>reserve.push(reviveMember(o)));
    P.gold = saved.gold|0; P.herbs = saved.herbs|0; P.waters = saved.waters|0;
    G.ship = (saved.ship && typeof saved.ship.x==='number') ? {x:saved.ship.x, y:saved.ship.y} : null;
    if(saved.aboard && saved.map==='world' && tileAt('world', saved.x|0, saved.y|0)==='~'){
      G.aboard=true;
      P.map='world'; P.x=saved.x|0; P.y=saved.y|0; P.dir=saved.dir||'front';
    }else{
      G.aboard=false;
      const land = safeLanding(saved.map, saved.x|0, saved.y|0);
      P.map=land.map; P.x=land.x; P.y=land.y; P.dir=saved.dir||'front';
    }
    G.flags = Object.assign({}, saved.flags||{});
    G.visited = Object.assign({}, saved.visited||{});
    G.visited[P.map] = true;
  }else{
    // ★はじめて その章に はいる ときは、章データの とおりに はじめる
    const cd = CHD ? CHD.get(no) : null;
    const cls = (newParty && newParty.length) ? newParty
              : (cd && cd.party) ? cd.party : ['sora'];
    // ★はじまりの レベル。かずでも、なかまごとの ひょうでも よい。
    //   （ゼフは ながねんの けんじゃ なので、はじめから たかい）
    const sl = cd && cd.startLv;
    const lvOf = (k)=>{
      if(sl == null) return 1;
      if(typeof sl === 'number') return sl;
      return sl[k] || 1;
    };
    const inh = cd && cd.inheritParty ? (G.chapters||{})[cd.inheritParty] : null;
    if(inh && inh.party && inh.party.length){
      // ★まえの しょうの なかま・レベル・そうび・しょじひんを ひきつぐ
      inh.party.forEach(o=>{ const m=reviveMember(o);
        if(party.length<4) party.push(m); else reserve.push(m); });
      (inh.reserve||[]).forEach(o=>{ const m=reviveMember(o);
        if(party.length<4) party.push(m); else reserve.push(m); });
      P.gold=inh.gold|0; P.herbs=inh.herbs|0; P.waters=inh.waters|0;
      allMembers().forEach(m=>{ m.hp=m.maxhp; m.mp=m.maxmp; m.status=null; });
    }else{
      cls.forEach((k,i)=>{ const m = mkMember(k, lvOf(k));
        if(i<4) party.push(m); else reserve.push(m); });   // ★せんとうは 4にんまで
    }
    if(cd){
      if(cd.start){
        const land = safeLanding(cd.start.map, cd.start.x|0, cd.start.y|0);
        P.map=land.map; P.x=land.x; P.y=land.y; P.dir=cd.start.dir||'front';
      }
      G.visited = {};                       // ★ほかの しょうの きろくを もちこさない
    G.ship = null; G.aboard = false;      // ★ふねは しょうごと
      if(cd.gold!==undefined)   P.gold   = cd.gold|0;
      if(cd.herbs!==undefined)  P.herbs  = cd.herbs|0;
      if(cd.waters!==undefined) P.waters = cd.waters|0;
      if(cd.equip && party[0]){
        if(cd.equip.weapon) party[0].weapon = Object.assign({}, cd.equip.weapon);
        if(cd.equip.armor)  party[0].armor  = Object.assign({}, cd.equip.armor);
      }
      G.visited[P.map] = true;
    }
  }
  G.trail=[[P.x,P.y],[P.x,P.y]];
  return true;
}

// ---------------- ふね（じゆうこうかい）----------------
// うみタイルを じぶんで こいで わたる。りくに ふれると あがり、ふねは のこる。
// リターンや ぜんめつの ときは、いきさきの はまへ ふねが ついてくる（まいご ふせぎ）。
const MOORS = {
  toros:       {x:48, y:24},
  versa_town:  {x:48, y:2},
  zaal_town:   {x:81, y:48},
  minamo_port: {x:36, y:51},
  elde_town:   {x:9,  y:23},
};
function moorShipFor(mapId){
  G.aboard=false;
  if(G.ship && MOORS[mapId]) G.ship={x:MOORS[mapId].x, y:MOORS[mapId].y};
}

// ---------------- なかまの いれかえ（ひかえ） ----------------
function allMembers(){ return party.concat(reserve); }
function joinMember(cls, lv){                 // ごうりゅう。5にんめ いこうは ひかえへ
  if(allMembers().some(m=>m.cls===cls)) return null;
  const m = mkMember(cls, lv||1);
  if(party.length<4) party.push(m); else reserve.push(m);
  if(V.setActors) V.setActors(true); U.hud();
  return m;
}
function swapMember(cls){                     // せんとう ⇄ ひかえ
  const pi = party.findIndex(m=>m.cls===cls);
  if(pi===0) return {ok:false, msg:party[0].name+'は せんとうから はずせない。'};
  if(pi>0){ reserve.push(party.splice(pi,1)[0]);
            if(V.setActors) V.setActors(true); U.hud(); return {ok:true}; }
  const ri = reserve.findIndex(m=>m.cls===cls);
  if(ri<0)  return {ok:false, msg:'その なかまは いない。'};
  if(party.length>=4) return {ok:false, msg:'せんとうに でられるのは 4にんまで。'};
  party.push(reserve.splice(ri,1)[0]);
  if(V.setActors) V.setActors(true); U.hud();
  return {ok:true};
}
// ---------------- 公開 ----------------
return {
  // データ
  MAPS, ENEMIES, MIDBOSS, CLASSES, SPELL_DEFS, SHOPS, INN_PRICE, byMap, TACTICS, LV_CAP,
  get NPC_LINES(){return NPCDATA.NPCS;}, WORLD, QUESTS:NPCDATA.QUESTS,
  // 状態アクセサ
  get G(){return G;}, get P(){return P;}, get party(){return party;}, get reserve(){return reserve;},
  freshState, allMembers, joinMember, swapMember, mkMember, expNext, mAtk, mDef, knownSpells, spellLabel, aliveMembers,
  // マップ
  tileAt, isBlocked, walkable, warpAt,
  // 行動
  stepField, interact, facing, doWarp, startBattle, beginRound, saveGame, loadGame,
  runTalkEvent, triggerChapterEnd, offerNextChapter, homePoint,
  saveInfo, switchChapter, SAVE_SLOTS, SAVE_VERSION,
  get lastSaveError(){return lastSaveError;},
  useInn, useChurch, openShop, talkNPC,
  moorShipFor, MOORS,
  itemList, useItemField, equipCandidates, equipFromBag, unequip, equipSummary, slotOf,
  fieldSpells, castField, spellNeedsTarget,
  returnDestinations, canReturnHere, castReturn, allReturnSpots, bossInfoAt, chData,
  KEY_ITEMS, hasKey, giveKey, takeKey, keyItemList,
  TRADE_GOODS, TRADE_MARKET, tradeTowns, tradePrice, sellPrice,
  goodsCount, goodsTotal, buyGood, sellGood, GOODS_LIMIT,
  setTownState, setNight, townStateDef, questList, questAdvance, startChapter,
  // 差し替え
  bind, NullView, NullUI, NullAudio,
};
})();

