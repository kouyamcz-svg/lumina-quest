'use strict';
// ============================================================
// ルミナクエストIV / 章データ
//
// 「その章だけの きまりごと」を ここに あつめる。
// コア（core.js）は この データを よむだけ に して、
// 章を ふやす ときに コアを さわらなくて すむ ように する。
//
// 番号： 1＝序章／2＝第1章／…／7＝終章
// 物語・人物・技の 確定稿は docs/ の 3文書を 正と する。
// ============================================================
const CHAPTERS_DATA = (function(){

const CH = {

  // ============================================================
  // 序章 見習い試験の日（天空大陸ルミナリア・下層区）
  //   M0 の 垂直スライス：下層区 → 見習い試験 → ウンブラ戦 → セーブ/ロード
  // ============================================================
  1: {
    id: 'ch0_trial',
    title: '見習い試験の日',
    region: 'sky',

    start: {map:'home_forge', x:7, y:8, dir:'front'},
    party: ['io'],
    gold: 40, herbs: 3, waters: 0,
    equip: {weapon:{kind:'w', name:'父の 打った 剣', v:4},
            armor: {kind:'a', name:'見習いの 胴着', v:2}},

    opening: ['──天空大陸 ルミナリア 下層区──',
      '中央海の 上空 三千メートル。千年、地に 触れない 大陸。',
      '地上生まれの 見習い、イオ。今日は 騎士団の 入団試験だ。',
      '父の 鍛冶場を 出て、南の 試験場へ 向かおう。',
      '（Aボタン：しらべる・はなす　Bボタン：メニュー）'],

    home: {map:'lower_dist', x:10, y:3, name:'下層区の 光珠堂'},

    returnSpots: [
      {map:'lower_dist', x:8, y:6},
    ],

    // --- ボスが いる ばしょ（マップ → ボスのキー）---
    bosses: {
      trial_yard: {
        key: 'trialdummy',
        clearedFlag: 'ch0_trialDone',
        needFlag: 'ch0_started',
        lockMsg: ['木人が 立っている。',
                  'まずは 騎士団長に 話を 聞こう。'],
        intro: ['試験場の 中央に 木人が 立つ。',
                'グラン「打て。まっすぐで いい」',
                '＊ 見習い試験 開始 ＊'],
        after: ['木人は 割れた ままに なっている。'],
      },
      rift_yard: {
        key: 'umbra',
        clearedFlag: 'ch0_umbraDown',
        intro: ['広場の 空に、黒い 裂け目が 口を あけている。',
                'そこから にじみ出た 影が、ゆっくりと 形を とった。',
                '＜……オマエタチノ、イラナカッタ ユメ＞',
                '討伐記録は のちに この影を「ウンブラ」と 記す。'],
        after: ['裂け目は 閉じ、黒い 紙片だけが 舞っている。'],
      },
    },

    // --- しかけ：光珠灯を ふたつ ともすと 奥の扉が ひらく ---
    lampGates: {
      rift_yard: {
        flag:'ch0_gateOpen',
        open:[{x:16, y:5, ch:'.'}],
        msg:['光珠が ふたつとも ともった。',
             '奥の 扉が 低い 音を たてて 開いた。'],
      },
    },
    // --- しかけ：扉（かぎでは 開かない ものは ここに 理由を 書く）---
    locks: {
      'rift_yard:16,5': {
        lockMsg:['固く 閉ざされた 扉。',
                 '両脇の 光珠が ふたつとも 消えている。',
                 'セレン「……灯りを 入れれば、開くのでは？」'],
      },
    },

    // --- マップに はいった ときに たつ めじるし ---
    onEnter: {
      trial_yard: 'ch0_enteredYard',
      rift_yard:  'ch0_riftOpen',
    },
    onEnterState: {rift_yard: 'NIGHT_RIFT'},

    // --- ものがたりの すじ（NPCの なまえ → なにが おきるか）---
    talkEvents: [
      { npc:'騎士団長 グラン', unless:'ch0_started',
        set:['ch0_started'],
        quest:{ch0_q1_trial:'active'},
        msg:['グラン「イオか。時間どおりだな」',
             'グラン「試験を 始める。真ん中の 木人を 打て」',
             'グラン「守る 順番を 間違えるな。それだけだ」',
             '＊ クエスト「見習い試験」＊'] },

      // ---- ウンブラ撃破後 ----
      { npc:'逃げ遅れた 子ども', cond:['ch0_umbraDown'], unless:'ch0_childSaved',
        set:['ch0_childSaved'],
        herbs:2, gold:30,
        msg:['子ども「……もう、いない？」',
             'イオ「ああ。下で お母さんが 待ってる」',
             '子どもは イオの 手を 見て、それから 剣を 見た。',
             '子ども「おじさんの 剣、下層区の 鍛冶場の でしょ」',
             'イオ「……父の だ。よく 知ってるな」',
             '子ども「うちの 鍋も そこの。母さんが 大事にしてる」',
             '',
             '子どもは 薬草と、握りしめていた 銭を 押しつけて 走っていった。',
             '＊ 薬草2つと 30ゴールドを 受け取った ＊'] },

      { npc:'騎士団長 グラン', cond:['ch0_umbraDown'], unless:'ch0_knighted',
        set:['ch0_knighted'],
        quest:{ch0_q3_report:'clear'},
        heal:true,
        msg:['グラン「……ひとりで 前に 出たか」',
             'イオ「人が 残っていたので」',
             'グラン「順番は 間違えなかったな」',
             'グラン「ひとつ 聞く。怖かったか」',
             'イオ「はい。ずっと 手が 震えていました」',
             'グラン「震えたまま 立てたなら、それでいい」',
             '',
             'グランは 消えた 裂け目の あたりを 長く 見上げていた。',
             'グラン「イオ。この 裂け目は 今夜 だけの ものでは ない」',
             'グラン「……いずれ お前に 話す 日が 来る」',
             '＊ 手当てを 受けた。HPとMPが 全快した ＊'] },

      { npc:'セレン', cond:['ch0_trialDone'], unless:'ch0_serenJoined',
        set:['ch0_serenJoined'],
        join:{cls:'seren', lv:'lead',
              weapon:{kind:'w', name:'見習いの 槍', v:6},
              armor: {kind:'a', name:'貴族の 胸当て', v:5}},
        quest:{ch0_q2_umbra:'active'},
        msg:['セレン「首席は わたし。……実技は あなたが 上だった」',
             'セレン「納得は していない。だから 見ておきたいの」',
             'セレン「北の 広場が 騒がしい。ついて 行くわ」',
             '＊ セレンが 仲間に なった！ ＊'] },
    ],

    // --- ボスを たおした ときの ごほうび ---
    bossReward: {
      trialdummy: {
        set:['ch0_trialDone'],
        quest:{ch0_q1_trial:'clear', ch0_q2_umbra:'active'},
        msg:['', '木人は 肩から 下へ、まっすぐに 割れた。',
             'グラン「……実技、一位。記録に 残す」',
             '試験官「首席は セレン。上層の 家の 者だ」',
             'グラン「順位が すべてでは ない。剣を 置くな」',
             '', '＊ 見習い試験を 終えた ＊',
             'セレンに 話しかけてみよう。'],
      },
      umbra: {
        set:['ch0_umbraDown'],
        quest:{ch0_q2_umbra:'clear', ch0_q3_report:'active'},
        // ★グランが 駆けつける（ますを 足して 人を 出す）
        setTiles:[{map:'rift_yard', x:12, y:3, ch:'n'}],
        msg:['', 'ウンブラは ほどけ、黒い 紙片に なって 散った。',
             '紙片は 灰の ように 軽く、地に 着く 前に 消えていく。',
             '',
             '見物に 出ていた 夢守りの 少年が ひとり、',
             'その 紙片を 目で 追って、顔色を 変えた。',
             'ノエ「……これ、夢の 切れはしだ」',
             'ノエ「なんで こんな ものが、外に……」',
             '',
             '広場の 奥から 足音。騎士団の 灯りが 近づいてくる。',
             '', '＊ 住民は 無事だった ＊'],
      },
    },

    // --- 章の おわり ---
    ending: {
      trigger: 'ch0_knighted',
      set:['ch0_cleared'],
      msg:['',
           '── 翌朝　下層区 ──',
           '',
           '騎士団の 布告が 光珠堂の 壁に 貼り出された。',
           '「見習い イオ。夜間の 防衛に つき、正騎士に 任ずる」',
           '',
           'セレン「……ずるい。首席は わたしなのに」',
           'セレン「わたしは 屋根の 上で 見ていただけ。動けなかった」',
           'イオ「見ていたのか」',
           'セレン「見ていた。だから 悔しいのよ」',
           'セレン「次は わたしも 下りる。……よろしく、同期」',
           '',
           '荷運びも 技師も、いつもどおり 働きはじめた。',
           '割れた 光珠灯は もう 取り替えられている。',
           '下層区は 何も なかった ような 顔で 朝を むかえた。',
           '',
           'ただ ひとつ。',
           '夢守りの 少年だけが、灰の 消えた 場所に しゃがみこんで、',
           'まだ 何かを 探していた。'],
      card: {title:'序章 完', sub:'見習い試験の日'},
      next: 2,
    },
  },
};

function get(no){ return CH[no] || CH[1]; }
function has(no){ return !!CH[no]; }
function list(){ return Object.keys(CH).map(Number).sort((a,b)=>a-b); }
function bossAt(chapter, map){
  const c = CH[chapter];
  return (c && c.bosses && c.bosses[map]) || null;
}
// とくべつな ますの あつかいを ひく
function specialTile(chapter, map, tile){
  const c = CH[chapter];
  if(!c || !c.specialTiles) return null;
  const hit = c.specialTiles.find(s=>s.map===map && s.tile===tile);
  return hit ? hit.handler : null;
}

return {CH, get, has, list, bossAt, specialTile};
})();
