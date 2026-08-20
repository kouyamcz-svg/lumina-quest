'use strict';
const NPCDATA = (function(){

// lines は 上から じゅんに 判定し、さいしょに あてはまった ものを しゃべる。
//   when: {state:'...', flag:'...', notFlag:'...', ch:章ばんごう} すべて みたす ひつようが ある
//   when を かかない ものが きほん（さいごに おく）
const NPCS = {
  // ============ 序章：イオの家（父の鍛冶場） ============
  home_forge: [
    {at:'11,6', spr:'shelfobj', name:'父の 道具棚', lines:[
      {when:{flag:'ch0_notebookRead'}, text:[
        '父の 帳面。十年 前で 止まっている。']},
      {when:{flag:'ch0_mawTold'}, text:[
        '父の 道具棚。奥に 油紙の 包みが 見える。']},
      {text:['父の 道具棚。鑢と 槌が きちんと 並んでいる。',
             '手前の 段だけ、埃が 薄い。']}]},
    {at:'3,6', spr:'elderWoman', name:'となりの おばさん', lines:[
      {when:{ch:2}, text:[
        '「正騎士さまが うちの となりから 出るとはね」',
        '「……父さんの 帳面、まだ 持ってるかい」']},
      {when:{flag:'ch0_auntTold'}, text:[
        '「読んだ なら、もう 子どもじゃ ないね」',
        '「気を つけて お行き」']},
      {when:{flag:'ch0_notebookRead'}, text:[
        '「その 顔は……棚を 開けたね」']},
      {when:{flag:'ch0_trialDone'}, text:[
        '「首席は 上層の お嬢さんだったってね」',
        '「……あんたの 父さんも、ずっと そうだったよ」']},
      {text:['「今日が 試験だろ。父さんの 鍛冶場も 見てるさ」',
             '「地上生まれでも 腕は 腕だ。行っておいで」']}]},
  ],

  // ============ 序章：下層区 ============
  lower_dist: [
    {at:'8,12', spr:'villagerA', name:'荷運びの 男', lines:[
      {when:{ch:2, flag:'ch1_enteredMid'}, text:[
        '「中層へ 行ったのか。石畳が つるつるだろう」',
        '「うちの 通りは 継ぎ当てだらけさ。転ばんように な」',
        '「灯りも あっちは 通りごとに ある」']},
      {when:{ch:2}, text:[
        '「近ごろ 荷が 減った。中層が 下層の 品を 買わなくなってな」',
        '「湧くのが 下だけだからと。……荷に 何が うつるってんだ」']},
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
      {when:{flag:'ch1_reported'}, text:[
        '技師「管の 光が 戻った。二十年で 初めてだ」',
        '技師「……お前の 父さんに 見せたかったな」']},
      {when:{flag:'ch1_oboroDown'}, text:[
        '技師「管の 光が 戻った。二十年で 初めてだ」',
        '技師「報告は 中層の 詰所だ。早く 出してこい」',
        '技師「こういうのは、熱いうちに 出さんと 通らん」']},
      {when:{flag:'ch1_pipeTold'}, text:[
        '技師「三の 管だ。気を つけろ」',
        '技師「十年 誰も 入って いない」']},
      {when:{flag:'ch0_mawTold'}, text:[
        '技師「あの 口だけの 獣、また 出たら 逃げろ」',
        '技師「……お前の 父さんは 逃げなかった。それだけだ」']},
      {when:{flag:'ch0_umbraDown'}, text:[
        '「割れた 光珠灯は もう 替えた。仕事が 早いだろ」',
        '「……ただな。取り替えた 新しい 管も、光が 濁ってる」',
        '「この十年、ずっとだ。俺の 気のせいなら いいんだが」']},
      {text:['「この 管には 炉の 光が 流れてる」',
             '「……最近、少し 濁ってる 気が するんだ」']}]},
    {at:'18,5', spr:'guardA', name:'東門の 見張り', lines:[
      {when:{ch:2}, text:[
        '「点検路が 詰まってる。技師が 手を 焼いてた」',
        '「外は 前より 湧く。日が 高いうちに 戻れよ」']},
      {when:{flag:'ch0_umbraDown'}, text:[
        '「昨夜は 助かった。門を 守るのが 俺の 役目なのに」',
        '「外の たなにも 影が 出るように なった。気をつけろ」']},
      {when:{flag:'ch0_trialDone'}, text:[
        '「東の 門から 外へ 出られる。下層の たなだ」',
        '「中層へ 昇る 道は あるが、許しが なければ 通れん」',
        '「悪夢獣が 出る。日が 落ちる 前に 戻れ」']},
      {text:['「外は 下層の たな。牧草地と 岩場ばかりだ」',
             '「今日は 試験だろう。寄り道は あとに しろ」']}]},
    {at:'12,13', spr:'elderWoman', name:'見習いの 母', lines:[
      {when:{flag:'ch1_sonThanked'}, text:[
        '「知らない 名前を、知らない 声で……」',
        '「あの子、しばらく 管には 下ろしません」']},
      {when:{flag:'ch1_sonFound'}, text:[
        '「帰って きました。ありがとう ございます」']},
      {when:{flag:'ch1_sonAsked'}, text:[
        '「西の 昇降口です。お願いします」']},
      {when:{flag:'ch1_pipeTold'}, text:[
        '「騎士さま。……お願いが あります」']},
      {text:['「息子が 管の 見習いを して います」',
             '「危ない 仕事だと 言うのに、聞かなくて」']}]},
    {at:'12,9', spr:'butler', name:'うわさずきの 男', lines:[
      {when:{ch:2}, text:[
        '「上じゃ『下層の 血』で 話が まとまってるとさ」',
        '「言い返せる 者が いないんだ。ここには」']},
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
  // ============ 第1章：中層区 ============
  mid_dist: [
    {at:'5,5', spr:'guardB', name:'任務書記', lines:[
      {when:{flag:'ch1_pipeTold'}, text:[
        '書記「旧管路か。……よく 昇降口を 開けさせたな」',
        '書記「気を つけろ。十年 誰も 入って いない」']},
      {when:{flag:'ch1_taskTaken'}, text:[
        '書記「下層区の 技師に 話を 聞け」',
        '書記「あの 男が いちばん 管を 知っている」']},
      {text:['書記「合同任務の 者か。用紙を 出す」']}]},
    {at:'14,5', spr:'butler', name:'上層の 使い', lines:[
      {when:{flag:'ch1_oboroDown'}, text:[
        '「……管だった、だと？」',
        '「まあ、そういう ことも あるだろうな」',
        '「わたしは 最初から そう 思って いたよ」']},
      {text:['「下層にだけ 湧くそうだ。理由は 分かるだろう」']}]},
    {at:'7,13', spr:'villagerB', name:'中層の 職人', lines:[
      {when:{flag:'ch1_pipeTold'}, text:[
        '「石畳かい。中層は 三年に 一度 敷き直す 決まりでね」',
        '「下層は……二十年 前が 最後だと 聞いた」',
        '「割れた ところに 板を あてて 使ってる そうだ」']},
      {when:{flag:'ch1_sawBreach'}, text:[
        '「旧管路に 入ったのか。あそこは 十年 前に 塞がれた」',
        '「塞いだ ときの 立ち会いが、下層の 鍛冶屋だった そうだ」']},
      {text:['「中層は 静かな もんだ。湧くのは 下だけ」',
             '「……なぜだと 思う？　管が 古いからさ」']}]},
    {at:'3,5', spr:'villagerA', name:'中層の 宿の 主人', lines:[
      {when:{flag:'ch1_innTalk'}, text:[
        '主人「よく 眠れたかね」',
        '主人「……壁が 薄くてね。すまない」']},
      {text:['主人「泊まりかね。合同任務の 方は 割引だよ」']}]},
    {at:'16,13', spr:'elderWoman', name:'花売りの 女', lines:[
      {text:['「上層の 庭園から 来る 花よ。中層じゃ 咲かないの」',
             '「光が 足りないんですって」',
             '',
             '「それでも 花壇は 置くの。あると ないとで 違うから」',
             '「下層？　……あちらは 灯りを 置くだけで 精一杯でしょう」']}]},
    {at:'2,11', spr:'guardA', name:'石段の 衛兵', lines:[
      {text:['「上層へは 通せん。許可証は 中層までだ」',
             '「……お嬢様の お名前でも な」']}]},
  ],

  // ============ 第1章：中層詰所 ============
  mid_post: [
    {at:'6,3', spr:'guardB', name:'詰所の 副長', lines:[
      {when:{flag:'ch1_reported'}, text:[
        '副長「書類は 上げた。返事は 期待するな」',
        '副長「……だが 綴りには 残る」']},
      {when:{flag:'ch1_foundShard'}, text:[
        '副長「討ったか。報告書を 出せ。書式は こちらで 整える」']},
      {when:{flag:'ch1_oboroDown'}, text:[
        '副長「討ったなら 報告に 来い」',
        '副長「……その 前に、現場で 拾える ものは 拾って おけ」',
        '副長「物が ないと、書類は ただの 作文だ」']},
      {text:['副長「団長は 上層だ。まだ 戻らん」']}]},
    {at:'5,6', spr:'guardA', name:'非番の 騎士', lines:[
      {when:{flag:'ch1_oboroDown'}, text:[
        '「下層で 大物を 討ったって？　正騎士が ひとりで」',
        '「……いや、二人か。上層の お嬢さんと」']},
      {text:['「合同任務なんて 何年ぶりだ」',
             '「下層と 上層で 組ませる。上の 考える ことは 分からん」']}]},
  ],

  // ============ 第1章：記録庫 ============
  mid_arch: [
    {at:'6,5', spr:'elderWoman', name:'記録係', lines:[
      {when:{flag:'ch1_foundPaper'}, text:[
        '記録係「あの 年の 綴りだけ、やけに 薄いだろう」']},
      {text:['記録係「申請の 綴りだ。年ごとに 並べてある」',
             '記録係「十年 前？　いちばん 下の 棚だよ」']}]},
    {at:'2,2', spr:'shelfobj', name:'古い 書類の 束', lines:[
      {when:{flag:'ch1_foundPaper'}, text:[
        '十年 前の 綴り。封鎖申請の 写しが 一枚。']},
      {text:['十年 前の 綴り。埃が 薄く、誰かが 最近 触れている。']}]},
  ],

  // ============ 第1章：旧管路 ============
  old_pipe: [
    {at:'19,25', spr:'villagerA', name:'たおれた 見習い', lines:[
      {when:{flag:'ch1_sonFound'}, text:[
        '見習いが いた あたり。工具袋が 落ちている。']},
      {text:['壁ぎわに 人が うずくまっている。']}]},
    {at:'13,6', spr:'pipeobj', name:'管の 底', lines:[
      {when:{flag:'ch1_foundShard'}, text:[
        '割れた 光珠の あった ところ。床に 黒い すじが 残っている。']},
      {when:{flag:'ch1_oboroDown'}, text:[
        'オボロが いた あたり。何か 落ちている。']},
      // ★倒す 前に 「いた」と 過去形で 言って いた
      {text:['床に 黒い すじが 走っている。',
             'すじは 破れた 管の ほうへ、まっすぐ 伸びていた。']}]},
    {at:'1,16', spr:'pipeobj', name:'破れた 管', lines:[
      {when:{flag:'ch1_sawBreach'}, text:[
        '裂け目は 内側から 溶けている。',
        '十年 塞がれていた 管の 中で、何が 育ったのか。']},
      {text:['管の 継ぎ目が 大きく 裂けている。']}]},
  ],

  // ============ 序章：光珠管の 点検路 ============
  pipe_path: [
    {at:'8,7', spr:'shadowmaw', name:'かげの あぎと', lines:[
      {text:['黒い 塊が 管に 貼りついている。']}]},
    {at:'9,7', spr:'pipeobj', name:'こわれた 管', lines:[
      {when:{flag:'ch0_mawFled'}, text:[
        '管の 継ぎ目が 内側から 溶けている。',
        '光は 通っているが、色が 濁っている。']},
      {text:['管の 継ぎ目に、黒い すすの ような ものが こびりついている。',
             '拭っても 指に つかない。']}]},
  ],

  // ============ 序章：裂け目の広場（夜） ============
  rift_yard: [
    {at:'12,3', spr:'captain', name:'騎士団長 グラン', lines:[
      {when:{flag:'ch0_knighted'}, text:[
        'グラン「灯りを 落とすなよ。夜は まだ 長い」',
        'グラン「下へ 戻れ。皆が 待っている」']},
      {text:['グランが 灯りを 掲げて 立っている。',
             'グラン「……話がある。こっちへ 来い」']}]},
    {at:'2,13', spr:'childA', name:'逃げ遅れた 子ども', lines:[
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
    {at:'9,4', spr:'seren', name:'セレン', lines:[
      {text:['セレン「首席は わたし。……実技は あなたが 上だった」',
             'セレン「わたしは その 顔を 忘れないと 思う」']}]},
    {at:'3,6', spr:'guardB', name:'試験官', lines:[
      {when:{ch:2}, text:[
        '試験官「団長なら 上層だ。もう 四日に なる」',
        '試験官「試験場も 当分 使わん。次の 見習いも 来ないしな」',
        '試験官「……下層から 来る 者が 減った」']},
      {text:['「順位は 実技だけでは 決まらん。血筋も 見る」',
             '「……そういう 決まりだ」']}]},
  ],
};

const QUESTS = {
  // ============ 第1章 ============
  ch1_q1_survey: {
    id:'ch1_q1_survey', chapter:2, title:'下層区の 亀裂',
    giver:'任務書記',
    desc:'下層区にだけ 悪夢獣が 湧く 原因を 特定する。',
    steps:[
      {id:'ask', desc:'下層区の 技師に 話を 聞く', flag:'ch1_pipeTold'},
    ],
    reward:{}, next:'ch1_q2_pipe',
  },
  ch1_q5_swarm: {
    id:'ch1_q5_swarm', chapter:2, title:'詰まった 点検路',
    giver:'光珠管の 技師',
    desc:'東門の 外の 点検路。奥の 間に 溜まった 群れを 散らす。',
    steps:[
      {id:'clear', desc:'かんむれを 散らす', flag:'ch1_swarmDown'},
    ],
    reward:{}, next:'ch1_q2_pipe',
  },
  ch1_q4_son: {
    id:'ch1_q4_son', chapter:2, title:'帰らない 子',
    giver:'見習いの 母',
    desc:'旧管路に 下りたきりの 見習い技師を 探す。',
    steps:[
      {id:'find',  desc:'旧管路で 見つける', flag:'ch1_sonFound'},
      {id:'tell',  desc:'母に 報せる',       flag:'ch1_sonThanked'},
    ],
    reward:{}, next:null,
  },
  ch1_q3_paper: {
    id:'ch1_q3_paper', chapter:2, title:'十年前の 綴り',
    giver:'詰所の 副長',
    desc:'中層の 記録庫で、十年前の 申請を 探す。',
    steps:[
      {id:'find', desc:'古い 書類の 束を 調べる', flag:'ch1_foundPaper'},
    ],
    reward:{}, next:null,
  },
  ch1_q2_pipe: {
    id:'ch1_q2_pipe', chapter:2, title:'旧管路の 底',
    giver:'光珠管の 技師',
    desc:'下層区の 西はずれから 旧管路へ。破れ目の もとを 断つ。',
    steps:[
      {id:'breach', desc:'破れた 管を 見る',       flag:'ch1_sawBreach'},
      {id:'boss',   desc:'オボロを 討ち取る',     flag:'ch1_oboroDown'},
      // ★討った あと 何を すれば よいか、ここにも 出す
      {id:'shard',  desc:'オボロが いた あたりを 調べる', flag:'ch1_foundShard'},
      {id:'report', desc:'中層の 詰所で 副長に 報告する', flag:'ch1_reported'},
    ],
    reward:{}, next:null,
  },

  ch0_q0_errand: {
    id:'ch0_q0_errand', chapter:1, title:'管の 影ばらい',
    giver:'光珠管の 技師',
    desc:'東門の 外の 点検路で 悪夢獣を 3体 倒す。',
    steps:[
      {id:'kill',   desc:'悪夢獣を 3体 倒す',   flag:'ch0_errandDone'},
      {id:'maw',    desc:'管に いた ものを 見る', flag:'ch0_mawFled'},
      {id:'report', desc:'技師に 報告する',     flag:'ch0_errandPaid'},
    ],
    reward:{}, next:'ch0_q1_trial',
  },
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
