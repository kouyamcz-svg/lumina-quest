'use strict';
const NPCDATA = (function(){

// lines は 上から じゅんに 判定し、さいしょに あてはまった ものを しゃべる。
//   when: {state:'...', flag:'...', notFlag:'...', ch:章ばんごう} すべて みたす ひつようが ある
//   when を かかない ものが きほん（さいごに おく）
const NPCS = {
  // ============ 序章：イオの家（父の鍛冶場） ============
  home_forge: [
    {at:'3,6', spr:'elderWoman', name:'となりの おばさん', lines:[
      {when:{flag:'ch0_trialDone'}, text:[
        '「首席は 上層の お嬢さんだったってね」',
        '「……あんたの 父さんも、ずっと そうだったよ」']},
      {text:['「今日が 試験だろ。父さんの 鍛冶場も 見てるさ」',
             '「地上生まれでも 腕は 腕だ。行っておいで」']}]},
  ],

  // ============ 序章：下層区 ============
  lower_dist: [
    {at:'8,12', spr:'villagerA', name:'荷運びの 男', lines:[
      {when:{flag:'ch0_knighted'}, text:[
        '「布告、見たぞ。下層区から 正騎士だ」',
        '「うちの 親父が 生きてたら 泣いてたな」']},
      {when:{flag:'ch0_umbraDown'}, text:[
        '「終わったのか……ありがとう、ほんとに」',
        '「団長さまが まだ 上に いる。呼んでたぞ」']},
      {when:{flag:'ch0_riftOpen'}, text:[
        '「空が 裂けてる……あんなの 見たこと ない」',
        '「北の 広場だ。人が まだ 残ってる！」']},
      {when:{flag:'ch0_trialDone'}, text:[
        '「試験は 終わったのか。……おい、北を 見ろ」',
        '「日が 落ちたのに 空が 光ってる。北の 門の 先だ」']},
      {text:['「下層区は 地上生まれの 街だ」',
             '「上の 連中は おれたちを 重い者と 呼ぶ」']}]},
    {at:'5,5', spr:'villagerB', name:'光珠管の 技師', lines:[
      {when:{flag:'ch0_umbraDown'}, text:[
        '「割れた 光珠灯は もう 替えた。仕事が 早いだろ」',
        '「……ただな。取り替えた 新しい 管も、光が 濁ってる」',
        '「この十年、ずっとだ。俺の 気のせいなら いいんだが」']},
      {text:['「この 管には 炉の 光が 流れてる」',
             '「……最近、少し 濁ってる 気が するんだ」']}]},
    {at:'18,5', spr:'guardA', name:'東門の 見張り', lines:[
      {when:{flag:'ch0_umbraDown'}, text:[
        '「昨夜は 助かった。門を 守るのが 俺の 役目なのに」',
        '「外の たなにも 影が 出るように なった。気をつけろ」']},
      {when:{flag:'ch0_trialDone'}, text:[
        '「東の 門から 外へ 出られる。下層の たなだ」',
        '「中層へ 昇る 道は あるが、許しが なければ 通れん」',
        '「悪夢獣が 出る。日が 落ちる 前に 戻れ」']},
      {text:['「外は 下層の たな。牧草地と 岩場ばかりだ」',
             '「今日は 試験だろう。寄り道は あとに しろ」']}]},
    {at:'12,9', spr:'butler', name:'うわさずきの 男', lines:[
      {when:{flag:'ch0_knighted'}, text:[
        '「上層じゃ もう 別の 話に なってる」',
        '「『地上の 血が 悪夢を 呼び込んだ』とさ」',
        '「守った 当人に 言う 台詞じゃ ないよな」']},
      {when:{flag:'ch0_umbraDown'}, text:[
        '「空が 裂けるなんて、記録にも ないぞ」',
        '「神殿の 巫女さまが 一晩中 祈ってたそうだ」']},
      {when:{flag:'ch0_trialDone'}, text:[
        '「騎士団長の グランさまは 地上生まれにも 公平だ」',
        '「あの 人だけは、腕を 腕として 見る」']},
      {text:['「今日は 見習い試験だ。南の 試験場だよ」']}]},
  ],

  // ============ 序章：下層区（東門の 見張り）============
  // ※ フィールドへ 出る 前に、どこへ 行けるかを 教える
  // ============ 序章：裂け目の広場（夜） ============
  rift_yard: [
    {at:'12,3', spr:'captain', name:'騎士団長 グラン', lines:[
      {when:{flag:'ch0_knighted'}, text:[
        'グラン「灯りを 落とすなよ。夜は まだ 長い」',
        'グラン「下へ 戻れ。皆が 待っている」']},
      {text:['グランが 灯りを 掲げて 立っている。',
             'グラン「……話がある。こっちへ 来い」']}]},
    {at:'2,13', spr:'villagerA', name:'逃げ遅れた 子ども', lines:[
      {when:{flag:'ch0_umbraDown'}, text:[
        '「……お母さん、見つかった？」',
        'イオ「ああ。下で 待ってる」']},
      {text:['「……こわい。お母さんが 上に いるの」',
             '「奥の 広い ところ。黒いのが たくさん いた」',
             'イオ「ここで 待ってろ。すぐ 戻る」']}]},
  ],

  // ============ 序章：見習い試験場 ============
  trial_yard: [
    {at:'3,2', spr:'captain', name:'騎士団長 グラン', lines:[
      {when:{flag:'ch0_trialDone'}, text:[
        'グラン「実技は お前が 一番だった。それは 記録に 残る」',
        'グラン「順位が すべてでは ない。……剣を 置くな」']},
      {when:{flag:'ch0_started'}, text:[
        'グラン「木人を 打て。まっすぐで いい」',
        'グラン「守る 順番を 間違えるな。それだけだ」']},
      {text:['グラン「イオか。時間どおりだな」',
             'グラン「試験を 始める。真ん中の 木人を 打て」']}]},
    {at:'9,2', spr:'guardA', name:'セレン', lines:[
      {when:{flag:'ch0_trialDone'}, text:[
        'セレン「首席は わたし。……実技は あなたが 上だった」',
        'セレン「わたしは その 顔を 忘れないと 思う」']},
      {text:['セレン「あなた、下層の。地上の 血で 剣が 振れるの？」']}]},
    {at:'3,6', spr:'guardB', name:'試験官', lines:[
      {text:['「順位は 実技だけでは 決まらん。血筋も 見る」',
             '「……そういう 決まりだ」']}]},
  ],
};

const QUESTS = {
  ch0_q1_trial: {
    id:'ch0_q1_trial', chapter:1, title:'見習い試験',
    giver:'騎士団長 グラン',
    desc:'試験場の 木人を 打つ。実技の 記録は 残る。',
    steps:[
      {id:'start', desc:'グランに 話す',   flag:'ch0_started'},
      {id:'clear', desc:'木人を 打つ',     flag:'ch0_trialDone'},
    ],
    reward:{}, next:'ch0_q2_umbra',
  },
  ch0_q3_report: {
    id:'ch0_q3_report', chapter:1, title:'団長への 報告',
    giver:'騎士団長 グラン',
    desc:'裂け目の 広場に 団長が 来ている。話を 聞こう。',
    steps:[
      {id:'talk', desc:'グランに 話す', flag:'ch0_knighted'},
    ],
    reward:{}, next:null,
  },
  ch0_q2_umbra: {
    id:'ch0_q2_umbra', chapter:1, title:'裂け目の 影',
    giver:'下層区の 人々',
    desc:'夜、北の 広場に 黒い 裂け目が 開いた。住民を 守る。',
    steps:[
      {id:'go',    desc:'広場へ 向かう',       flag:'ch0_riftOpen'},
      {id:'umbra', desc:'ウンブラを 討ち取る', flag:'ch0_umbraDown'},
    ],
    reward:{}, next:null,
  },
};

function pickLines(entry, ctx){
  for(const l of entry.lines){
    const w = l.when;
    if(!w) return l.text;
    if(w.ch && ctx.chapter !== w.ch) continue;         // ★しょうごとの せりふ
    if(w.state && ctx.townState !== w.state) continue;
    if(w.flag && !ctx.flags[w.flag]) continue;
    if(w.notFlag && ctx.flags[w.notFlag]) continue;
    return l.text;
  }
  return ['「……」'];
}
function npcAt(mapId, x, y){
  const list = NPCS[mapId];
  if(!list) return null;
  return list.find(n=>n.at === (x+','+y)) || null;
}
return {NPCS, QUESTS, pickLines, npcAt};
})();
