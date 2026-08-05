'use strict';
const NPCDATA = (function(){

// lines は 上から じゅんに 判定し、さいしょに あてはまった ものを しゃべる。
//   when: {state:'...', flag:'...', notFlag:'...', ch:章ばんごう} すべて みたす ひつようが ある
//   when を かかない ものが きほん（さいごに おく）
const NPCS = {
  // ============ 序章：イオの家（父の鍛冶場） ============
  home_forge: [
    {at:'2,2', spr:'elderWoman', name:'となりの おばさん', lines:[
      {when:{flag:'ch0_trialDone'}, text:[
        '「首席は 上層の お嬢さんだったってね」',
        '「……あんたの 父さんも、ずっと そうだったよ」']},
      {text:['「今日が 試験だろ。父さんの 鍛冶場も 見てるさ」',
             '「地上生まれでも 腕は 腕だ。行っておいで」']}]},
  ],

  // ============ 序章：下層区 ============
  lower_dist: [
    {at:'3,4', spr:'villagerA', name:'荷運びの 男', lines:[
      {when:{flag:'ch0_riftOpen'}, text:[
        '「空が 裂けてる……あんなの 見たこと ない」',
        '「北の 広場だ。人が まだ 残ってる！」']},
      {when:{flag:'ch0_trialDone'}, text:[
        '「試験は 終わったのか。……おい、北を 見ろ」',
        '「日が 落ちたのに 空が 光ってる。北の 門の 先だ」']},
      {text:['「下層区は 地上生まれの 街だ」',
             '「上の 連中は おれたちを 重い者と 呼ぶ」']}]},
    {at:'12,4', spr:'villagerB', name:'光珠管の 技師', lines:[
      {text:['「この 管には 炉の 光が 流れてる」',
             '「……最近、少し 濁ってる 気が するんだ」']}]},
    {at:'12,7', spr:'butler', name:'うわさずきの 男', lines:[
      {when:{flag:'ch0_trialDone'}, text:[
        '「騎士団長の グランさまは 地上生まれにも 公平だ」',
        '「あの 人だけは、腕を 腕として 見る」']},
      {text:['「今日は 見習い試験だ。南の 試験場だよ」']}]},
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
