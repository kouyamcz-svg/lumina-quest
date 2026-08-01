'use strict';
const NPCDATA = (function(){

// lines は 上から じゅんに 判定し、さいしょに あてはまった ものを しゃべる。
//   when: {state:'...', flag:'...', notFlag:'...'} すべて みたす ひつようが ある
//   when を かかない ものが きほん（さいごに おく）
const NPCS = {
  elde_town: [
    {at:'12,7', spr:'elder', name:'ゼフの でし', lines:[
      {when:{flag:'ch4_gotKey'}, text:[
        '「ししょうが……あんな かおを するとは」',
        '「ながい あいだ、ひとりで かかえて いたんですね」']},
      {when:{flag:'ch4_started'}, text:[
        '「さんどうを のぼれば けんきゅうとうです」',
        '「……ごぶじで、おかえりください」']},
      {text:['「ようこそ かくれざとへ。ここは けんじゃたちの すみかです」']}]},
    {at:'9,8', spr:'elderWoman', name:'さとの おんな', lines:[
      {when:{flag:'ch4_started'}, text:[
        '「ゼフさまは 30ねん、ねむらずに けんきゅうを つづけて」',
        '「なにかを つぐなおうと して おられた」',
        '「……きょうが、その ひなのですね」']},
      {text:['「れいほうの うえは さむい。したくを して いきなさい」']}]},
    {at:'17,9', spr:'butler', name:'うわさずきの けんじゃ', lines:[
      {when:{flag:'ch4_cleared'}, text:[
        '「＜アルト＞な。',
        'まえの まおうを たおした ひとりだ そうだ」',
        '「その えいゆうが、さんどうで うたって いた」',
        '「きいて いたのは ゆきうさぎ だけ だったが」']},
      {when:{flag:'ch4_started'}, text:[
        '「＜アルト＞という たびの ものが さんどうを のぼって いった」',
        '「＜たかい ところは こえが とおる＞と いってな」']},
      {text:['「さんどうで うたを うたう おとこが いた」',
             '「ジブリの こえまねが うまくてな。ゆきに よく あった」']}]},
    {at:'6,12', spr:'mage', name:'わかい けんじゃ', lines:[
      {text:['「ゆめの たいりくは ほんとうに ある。ししょうは そう いいます」']}]},
    {at:'20,12', spr:'priest', name:'しんかん', lines:[
      {text:['しんかん「めざめぬ ものに、いのりを ささげて おります」']}]},
    {at:'15,15', spr:'villagerA', name:'さとの こども', lines:[
      {text:['「ミオねえちゃんは つよいんだよ。ぼくの あこがれ！」']}]},
    {at:'4,6', spr:'maid', name:'やどの むすめ', lines:[
      {text:['「やまの よるは ひえます。ゆっくり おやすみください」']}]},
  ],
  minamo_port: [
    {at:'22,10', spr:'butler', name:'こうえきしょう', lines:[
      {text:['こうえきしょう「みなとには なんでも あつまる」',
             '「しなものの そうばは まちごとに ちがうよ」']}]},
    {at:'18,10', spr:'villagerB', name:'うわさずきの ふなのり', lines:[
      {when:{flag:'ch3_cleared'}, text:[
        '「＜アルト＞の しょうたい、わかったぜ」',
        '「まえの まおうを たおした パーティの ひとりだ そうだ」',
        '「その えいゆうが さんばしで うたって、',
        'おひねりを かぞえてた」',
        '「……せかいを すくった あとの じんせい、それで いいのか」']},
      {when:{flag:'ch3_gotShell'}, text:[
        '「ほらあなから もどってきた ＜アルト＞に あったぜ」',
        '「＜かいは よく きいてくれた。',
        'にんげんより ずっと＞だとよ」',
        '「まものと たたかいに いったんじゃ ないのか あいつ」']},
      {when:{flag:'ch3_sawDream'}, text:[
        '「＜アルト＞なら かいしょくどうの ほうへ こぶねを かりていった」',
        '「＜あそこは よく ひびく＞って いってな」',
        '「まものしか いないぞ、と おしえたんだが きかなかった」']},
      {text:['「さんばしで うたってた やつが いてな。＜アルト＞っていうんだと」',
             '「ジブリの こえまねが うまくてよ。おれは すきだったぜ」',
             '「……ただ、きいてたのは おれと かもめだけ だったがな」']}]},
    {at:'13,6', spr:'guardA', name:'みなとの みはり', lines:[
      {when:{flag:'ch3_started'}, text:[
        '「ねむったまま おきん ものが ふえてる」',
        '「ナギサの ほうが ひどいと きくぞ」']},
      {text:['「ようこそ サンゴの みなとへ。ふねの でいりは ここからだ」']}]},
    {at:'7,9', spr:'elderWoman', name:'うらないの ししょう', lines:[
      {when:{flag:'ch3_gotShell'}, text:[
        'ししょう「よく もどった。」',
        'ししょう「だが その かいは こたえを くれなんだろう」',
        '「ゆめの ぬしは、もっと おくに おる」']},
      {when:{flag:'ch3_sawDream'}, text:[
        'ししょう「ゆめを みたか、セナ。」',
        'ししょう「……それが おまえの ちからじゃ」',
        '「かいしょくどうの おくに、ゆめの ぬしが おる」']},
      {when:{flag:'ch3_started'}, text:[
        'ししょう「ナギサへ いって、」',
        'ししょう「なにが おきたか みてくるのじゃ」',
        '「ルカ、セナを たのんだよ」']},
      {text:['ししょう「セナ。おまえの ゆめみの ちからは、まだ あさい」',
             '「じゃが いまは その あさい ちからが いる」',
             '「しまじゅうの ものが、ねむったまま おきんのじゃ」']}]},
    {at:'20,9', spr:'maid', name:'やどの むすめ', lines:[
      {text:['「しおかぜが つよい ひは、はやく やすんだ ほうが いいですよ」']}]},
    {at:'11,16', spr:'villagerA', name:'あみを つくろう おんな', lines:[
      {when:{flag:'ch3_started'}, text:[
        '「うちの ひとも おきないんです。あさから ずっと」']},
      {text:['「サンゴは きれいだけど、ふねの そこを きるから きを つけて」']}]},
    {at:'23,16', spr:'priest', name:'しんかん', lines:[
      {text:['しんかん「めざめぬ ものに、いのりを ささげて おります」']}]},
    {at:'5,11', spr:'villagerB', name:'まちのこども', lines:[
      {text:['「おねえちゃん、うらないできるの？ ぼくの あした みてよ」']}]},
    {at:'12,2', spr:'sailor', name:'ふなのり', lines:[
      {when:{flag:'ch3_heardIsle'}, text:[
        '「ナギサか。こぶねを だしてやる。……きを つけろよ」']},
      {text:['「こぶねで しまづたいに いくのが この あたりの たびだ」']}]},
  ],
  minamo_isle: [
    {at:'9,4', spr:'elder', name:'むらの おさ', lines:[
      {when:{flag:'ch3_gotShell'}, text:[
        'おさ「かいを もちかえっても、みなは おきん」',
        '「やはり おくの ぬしを どうにか せねば」']},
      {when:{flag:'ch3_heardIsle'}, text:[
        'おさ「みなみの かいしょくどうじゃ。」',
        'おさ「しおが ひいた ときだけ はいれる」',
        '「そこに ＜ゆめの ぬし＞が おる」']},
      {text:['おさ「よく きた。……みての とおりじゃ」',
             '「むらの はんぶんが、ねむったまま おきん」',
             '「うらないしよ。ゆめを みて くれんか」',
             '＊ クエスト「しまの ねむり」＊']}]},
    {at:'6,6', spr:'villagerA', name:'むらの おんな', lines:[
      {text:['「こどもたちが おきないの……」']}]},
    {at:'13,7', spr:'villagerB', name:'しまの わかもの', lines:[
      {when:{flag:'ch3_heardIsle'}, text:['「かいしょくどうは くらいぞ。ひをもって いけ」']},
      {text:['「しおが ひくと、みなみに ほらあなが あらわれるんだ」']}]},
    {at:'8,11', spr:'villagerB', name:'こども', lines:[
      {text:['「おかあさん、ずっと ねてるの」']}]},
    {at:'11,10', spr:'elderWoman', name:'ものしりの おんな', lines:[
      {when:{flag:'ch3_gotShell'}, text:[
        '「＜アルト＞ね。まおうを たおした ひとりなんですって」',
        '「それが なぜ ほらあなで うたって いるのかしら」',
        '「＜きゃくが しずかなら、それは それで いい＞ですって」']},
      {when:{flag:'ch3_sawDream'}, text:[
        '「＜アルト＞なら ほらあなの ほうへ こぶねで いったわ」',
        '「＜きゃくが いないから、かいに きかせる＞ですって」',
        '「わたしが きいて あげると いったら、ことわられたの」']},
      {text:['「＜アルト＞という たびの ひとが よってったわ」',
             '「うたを うたって、なにも かわずに いったの」',
             '「こえは きれいだったわ。……ずっと ひとりで うたってた」']}]},
  ],
  zaal_town: [
    {at:'22,10', spr:'butler', name:'こうえきしょう', lines:[
      {text:['こうえきしょう「しなものの そうばは まちごとに ちがう」',
             '「やすい ところで しいれ、たかい ところで うる。それだけさ」']}]},
    {at:'18,10', spr:'villagerB', name:'うわさずきの しょうにん', lines:[
      {when:{flag:'ch2_cleared'}, text:[
        '「きたの ヴェルサにも ＜アルト＞の うわさが あるらしい」',
        '「おなじ ひとが りょうほうに いた ことに なるが……」',
        '「なんでも、',
        'まえの まおうを たおした ゆうしゃの ひとりだ そうだ」',
        '「それが なぜ ろじょうで うたって いるんだ？」']},
      {when:{flag:'ch2_gotSand'}, text:[
        '「＜アルト＞は いせきの ほうへ いったそうだ」',
        '「＜すなの なかは よく ひびく＞とか いって」',
        '「あいつ、どこでも ぶたいに してしまうな」']},
      {when:{flag:'ch2_started'}, text:[
        '「たいしょうが でる まえの ばん、',
        '＜アルト＞が この まちに いた」',
        '「そらを みながら ジブリの こえまねを して いたよ」',
        '「うまかった。……だが きゃくは 3にんだった」']},
      {text:['「この まちは いろんな うわさが あつまる」',
             '「さいきん おおいのは ＜アルト＞という なまえだ」',
             '「ひろばで うたって、ぜんぜん もうけて いないらしい」']}]},
    {at:'14,5', spr:'guardA', name:'もんばん', lines:[
      {when:{flag:'ch2_gotSand'}, text:['「すなの いせきから もどったのか。ぶじで なによりだ」']},
      {when:{flag:'ch2_started'}, text:['「たいしょうが きえた みなみの ろは、いま とめている」',
                                        '「オアシスの むらの ものなら なにか しっているかもな」']},
      {text:['「ザールへ ようこそ。ひがしの こうえきろは この まちで はじまる」']}]},
    {at:'7,8', spr:'butler', name:'しょうかいちょう', lines:[
      {when:{flag:'ch2_cleared'}, text:[
        'しょうかいちょう「めざめぬ ものが せかいじゅうに……。バルド、たのんだぞ」']},
      {when:{flag:'ch2_gotSand'}, text:[
        'しょうかいちょう「たいしょうを つれもどしたか。だが なぜ めを さまさぬ……」']},
      {when:{flag:'ch2_heardSand'}, text:[
        'しょうかいちょう「ねむりの すな とな。いせきに あるなら いくしか あるまい」']},
      {when:{flag:'ch2_started'}, text:[
        'しょうかいちょう「オアシスの むらへ いってくれ。すなの たみが なにか しっている」']},
      {text:['しょうかいちょう「バルドか。ちょうど よかった」',
             '「みなみへ でた たいしょうが、まるごと きえた」',
             '「にもつも らくだも そのままで、ひとだけが おらぬ」']}]},
    {at:'21,8', spr:'villagerB', name:'ぎょうしょうにん', lines:[
      {when:{flag:'ch2_heardSand'}, text:['「すなの いせき？ にしの すなやまの しただよ」']},
      {text:['「こうえきろが とまって あがったりさ」']}]},
    {at:'11,10', spr:'maid', name:'やどの むすめ', lines:[
      {text:['「やどは きたどおりの にしがわです」','「たびの まえに やすんでいって」']}]},
    {at:'24,16', spr:'elder', name:'ろうじん', lines:[
      {when:{flag:'ch2_started'}, text:[
        '「むかし きいた はなしじゃ。すなの いせきには ＜ねむりの すな＞が ねむると」']},
      {text:['「この まちは 400ねん、こうえきで もってきた」']}]},
    {at:'5,11', spr:'villagerA', name:'まちの おんな', lines:[
      {text:['「うちの ひとも たいしょうに いたんです……」']}]},
  ],
  zaal_oasis: [
    {at:'7,10', spr:'villagerB', name:'こうえきしょう', lines:[
      {text:['こうえきしょう「この むらは こうしんりょうと なつめが やすい」',
             '「ぬのと がらすだまは たかく つく。すなを こえて くるからな」']}]},
    {at:'11,6', spr:'elder', name:'すなの かたりべ', lines:[
      {when:{flag:'ch2_gotSand'}, text:[
        'かたりべ「＜アルト＞は すなの まえに きて、」',
        'かたりべ「すなの あとに きえた」',
        '「たすけに きたのか、きゃくを さがしに きたのか」',
        '「わしには どちらとも いえん」']},
      {when:{flag:'ch2_heardSand'}, text:[
        'かたりべ「いせきへ いくのか。」',
        'かたりべ「＜アルト＞が さきに はいっておる」',
        '「＜まものは ぜったいに とちゅうで かえらない＞と いっておった」',
        '「……たしかに そうじゃが、それは ききに きて おらんぞ」']},
      {text:['かたりべ「すなは なんでも おぼえておる」',
             '「さいきん おぼえたのは ＜アルト＞という あしあとじゃ」',
             '「きたから きて、みなみへ ぬけた。ずっと うたいながらな」']}]},
    {at:'9,3', spr:'elderWoman', name:'すなの たみの おさ', lines:[
      {when:{flag:'ch2_gotSand'}, text:[
        'おさ「すなを もちかえったか。だが ねむりは とけまい」',
        '「あれは この ちの ものでは ない。もっと ふるく、もっと とおい」']},
      {when:{flag:'ch2_heardSand'}, text:[
        'おさ「いせきは にしの すなやまの した。きを つけて いくのじゃ」']},
      {text:['おさ「たいしょうの ことじゃな」',
             '「あれは ＜ねむりの すな＞に のまれたのじゃ」',
             '「すなの いせきに、',
             'ねむりを ふらす ものが すみついておる」',
             '＊ クエスト「ねむりの すな」＊']}]},
    {at:'6,6', spr:'villagerB', name:'すなの たみ', lines:[
      {when:{flag:'ch2_heardSand'}, text:['「いせきの おくは まものだらけだ。ひとりでは いくな」']},
      {text:['「よそものが くるとは めずらしい」']}]},
    {at:'13,7', spr:'warrior', name:'すなの みはり', lines:[
      {text:['「いずみの みずは この むらの いのち。よそへは わけられん」']}]},
    {at:'8,11', spr:'villagerB', name:'こども', lines:[
      {text:['「すなの したに、ふるい たてものが うまってるんだって」']}]},
  ],
  versa_town: [
    {at:'9,11', spr:'villagerB', name:'こうえきしょう', lines:[
      {text:['こうえきしょう「ゆきぐにでは なつめが たかい」',
             '「みなみから はこべば、それだけで もうけに なるよ」']}]},
    {at:'20,11', spr:'villagerB', name:'うわさずきの おとこ', lines:[
      {when:{flag:'ch1_cleared'}, text:[
        '「なあ、あの＜アルト＞って ひとの こと きいたか」',
        '「おうじょさまが たおれる まえの ばん、',
        'しろの まえに いたって」',
        '「みはりは とめたそうだ。だが つぎの あさには きえていた」']},
      {when:{state:'DREAM_INVASION'}, text:[
        '「＜アルト＞だ。',
        'あいつが きた よるは かならず だれかが ねむる」',
        '「フードを かぶって、うたを くちずさんで いたと」']},
      {when:{state:'SLEEPING_SICKNESS'}, text:[
        '「＜アルト＞という たびの ものを みなかったか」',
        '「ねむりびょうが はじまる すこし まえに、まちを あるいていたそうだ」']},
      {text:['「＜アルト＞って なまえ、きいた ことは ないか」',
             '「きたの みちで すれちがったんだ。かおは みえなかったが」']}]},
    {at:'13,6', spr:'guardA', name:'もんばん', lines:[
      {when:{state:'DREAM_INVASION'}, text:[
        '「みなみもんは とじた！ そとは もう ゆめの なかだ！」',
        '「きみも はやく おくへ さがれ、リオン！」']},
      {when:{flag:'ch1_heardTheft'}, text:[
        '「ミルカまで いったのか。にしの もんは いつでも あけとくぜ」']},
      {when:{state:'SLEEPING_SICKNESS'}, text:[
        '「けさも 3にん たおれた。みんな ねむったままだ」',
        '「せつげんの ほうから なにか きてる きが する……」']},
      {text:[
        '「よう リオン、しんまいの わりに よく はしるな」',
        '「みなみもんの さきは せつげん。まよったら ひきかえせよ」']},
    ]},
    {at:'19,9', spr:'maid', name:'こうじょの じじょ', lines:[
      {when:{state:'DREAM_INVASION'}, text:[
        '「おうじょさま……ゆめの なかで だれかと はなして おられます」',
        '「むらさきの きりが、おしろまで のぼってきました」']},
      {when:{state:'SLEEPING_SICKNESS'}, text:[
        '「おうじょさまが おめざめに なりません。もう みっかです」',
        '「おいしゃさまも くびを かしげるばかりで……」']},
      {text:[
        '「おうじょさまは おやさしいかたです」',
        '「けさも まどから ゆきを ながめて おられました」']},
    ]},
    {at:'8,9', spr:'captain', name:'きしだんちょう', lines:[
      {when:{flag:'ch1_orderReceived'}, text:[
        '「せつげんの おくに こおりの どうくつが ある」',
        '「きを つけて いけ。おまえは まだ しんまいだ」']},
      {when:{state:'SLEEPING_SICKNESS'}, text:[
        '「リオン。おまえに めいれいだ」',
        '「おうじょの ねむりの げんいんを しらべてこい」',
        '「まずは まちの ものに はなしを きけ」']},
      {text:[
        '「きしだんの ひろばは しんけんしょうぶの ばだ」',
        '「あさの くんれんを おこたるなよ、リオン」']},
    ]},
    {at:'24,9', spr:'priest', name:'しんかん', lines:[
      {when:{state:'DREAM_INVASION'}, text:[
        '「いのりが とどきません。ゆめが かみさまの こえを かき けしている」']},
      {when:{state:'SLEEPING_SICKNESS'}, text:[
        '「ねむったまま おきぬ ものが ふえています」',
        '「きょうかいで あずかって おりますが、ひとが たりません」']},
      {text:['「ヴェルサの ゆきは しずかで うつくしい」',
             '「たびの ぶじを おいのりしましょう」']},
    ]},
    {at:'5,11', spr:'villagerB', name:'まちのこども', lines:[
      {when:{state:'DREAM_INVASION'}, text:[
        '「おそらが むらさきだよ。きれいだけど、こわい」']},
      {text:['「ゆきの うえに あしあとを つけるの、たのしいよ！」',
             '「よるに なると そらが ひかるんだ。オーロラって いうんだって」']},
    ]},
    {at:'11,13', spr:'villagerB', name:'ぎょうしょうにん', lines:[
      {text:['「ひがしの ザールから きた。にぐるまが ゆきで うごかん」',
             '「なんでも みなみの しまでも ひとが ねむって おきんそうだ」',
             '「せかいじゅうで おきてる はなし かも しれんな」']},
    ]},
    {at:'21,16', spr:'villagerB', name:'さかばの きゃく', lines:[
      {text:['「せかいじゅうを たびして ものまねげいで おおうけしてる けんしが いるらしい」',
             '「ねずみの おうこくの ものまねが てっぱん だとさ」',
             '「こだまのいしで うわさは あっというま だな」']},
    ]},
  ],
  toros: [
    {at:'6,5', spr:'elder', name:'むらの おさ', lines:[
      {when:{flag:'ch5_cleared'}, text:[
        '「ソラ。……ルミアさんに にて きたのう」',
        '「きを つけて いくのじゃぞ」']},
      {when:{flag:'ch5_started'}, text:[
        '「ひがしの ＜ゆめみの どうくつ＞じゃ」',
        '「きりが ながれて きたのは、あそこからじゃ」']},
      {text:['おさ「ソラか。……ルミアさんも おきん」']}]},
    {at:'10,5', spr:'villagerA', name:'うわさずきの むらびと', lines:[
      {when:{flag:'ch5_cleared'}, text:[
        '「＜アルト＞な。',
        'まえの まおうを たおした ひとりだ そうだ」',
        '「ソラの おやじさんだよ。しらなかったのか」',
        '「いまごろ どこかで ジブリの こえまねを して いるさ」']},
      {when:{flag:'ch5_started'}, text:[
        '「そういや ＜アルト＞が むかし いってたな」',
        '「＜ゆめは いつか あふれる＞って」',
        '「じょうだんだと おもって いたが……」']},
      {text:['「となりの いえの じいさんも おきん」',
             '「……こんな こと、はじめてだ」',
             '「そういや ＜アルト＞という うたうたいが、',
             'むかし この むらに おった」',
             '「ジブリの こえまねが うまくてな。みんな わらった」']}]},
    // ★ルミアは しょうの はじめから ねむって いる。
    //   おきる のは ゆめの ぬしを たおした あとだけ。
    {at:'7,12', spr:'lumia', name:'ルミア', lines:[
      {when:{flag:'ch5_beatLord'}, text:[
        'ルミア「ソラ。……ありがとう」',
        'ルミア「その けん、ひかって いるのね」',
        'ルミア「おとうさんも、おなじ かおを して いたわ」']},
      {when:{flag:'ch5_started'}, text:[
        '（ルミアは ねむった まま、めを あけない）',
        'ソラ「かあさん。……すぐ もどる」']},
      {text:['（ルミアは ねむって いる。いくら よんでも おきない）',
             '（いきは して いる。ただ、こころだけが どこかに ある）',
             'ソラ「……ゆうべまで、ふつうに はなして いたのに」',
             'ソラ「おさに きいて みよう」']}]},
  ],
  toros_h1: [
    {at:'5,1', spr:'villagerA', name:'いえの ひと', lines:[
      {text:['「ルミアさまの こどもが もう そんなに おおきく…」',
             '「じかんが たつのは はやい ねえ」']}]},
  ],
  toros_h2: [
    {at:'2,1', spr:'villagerA', name:'いえの ひと', lines:[
      {text:['「こだまのいしで うわさは あっというまさ。',
             'あの ものまね けんし、また ばけたらしいぜ」']}]},
  ],
  world: [
    {at:'46,16', spr:'warrior', name:'そうさくたい', lines:[
      {when:{flag:'ch1_gotHerb'}, text:[
        '「どうくつの こおりが とけはじめた！ なにを したんだ、あんた」']},
      {when:{flag:'ch1_enteredCave'}, text:[
        '「ひがしの どうくつは やめとけ。なかから うなりごえが する」']},
      {text:['「ひがしの おくに こおりの どうくつが ある」',
             '「あそこから つめたい かぜが ふいてくるんだ」']}]},
    {at:'53,10', spr:'villagerB', name:'たびびと', lines:[
      {when:{state:'DREAM_INVASION'}, text:[
        '「そらが むらさきだ……こんなの みたことない」']},
      {text:['「みなみの やまなみは こえられん。ヴェルサは しまのような ものさ」',
             '「にしへ いけば ミルカ、ひがしの おくは こおりの どうくつだ」']}]},
  ],
  versa_town2: [
    {at:'8,6', spr:'villagerA', name:'こうえきしょう', lines:[
      {text:['こうえきしょう「ちいさな むらだけど、しなものは あつまる」',
             '「ぬのが やすいのは、ここで おっているからさ」']}]},
    {at:'12,6', spr:'elderWoman', name:'ものしりの おんな', lines:[
      {when:{flag:'ch1_gotHerb'}, text:[
        '「＜アルト＞ね。まおうを たおした ひとりなんですって」',
        '「それが なぜ ゆきの なかで うたって いるのかしら」',
        '「ジブリの こえまねが とくいだ とか いって、ひとりで わらって いたわ」']},
      {when:{flag:'ch1_heardTheft'}, text:[
        '「＜アルト＞なら どうくつの ほうへ あるいていったわ」',
        '「とめたのよ。まものが でるって」',
        '「そうしたら＜きゃくが いないから、まものに きかせる＞ですって」']},
      {text:['「＜アルト＞なら みたわ。ゆきの なかで うたっていたの」',
             '「だれも きいて いないのに、さいごの いっしょうまで」',
             '「へんな ひと。でも こえは きれいだったわ」']}]},
    {at:'8,8', spr:'villagerB', name:'むらびと', lines:[
      {when:{flag:'ch1_gotHerb'}, text:['「まものから とりかえしたって？ たいした しんまいだ」']},
      {when:{flag:'ch1_heardTheft'}, text:[
        '「くすしの ばあさんは この むらの ほこりでね」',
        '「ゆきぐさを ぬすまれてから、ずっと ためいきばかりさ」']},
      {text:['「ようこそ ミルカへ。ちいさいが くすりの むらだよ」',
             '「なんでも なおす ばあさんが いるんだ」']}]},
    {at:'13,5', spr:'villagerB', name:'こども', lines:[
      {when:{flag:'ch1_heardTheft'}, text:['「みなみの どうくつには いっちゃだめだって」']},
      {text:['「ゆきぐさは あおく ひかるんだよ。みたこと ある？」']}]},
    {at:'6,9', spr:'warrior', name:'りょうし', lines:[
      {when:{flag:'ch1_heardTheft'}, text:[
        '「くろい けものを みたよ。',
        'まるで かげが かたちを もったみたいだった」',
        '「あれは ふつうの まものじゃない」']},
      {text:['「みなみに こおりの どうくつが ある。ちかごろ ようすが へんでね」']}]},
    {at:'16,8', spr:'villagerB', name:'たびのしょうにん', lines:[
      {text:['「ひがしの ザールでも ねむったまま おきん ものが でたそうだ」',
             '「ヴェルサだけの はなしじゃ なさそうだよ」']}]},
    {at:'11,11', spr:'villagerA', name:'むらのおんな', lines:[
      {when:{state:'DREAM_INVASION'}, text:['「そらが むらさきだよ……なにが おきてるの」']},
      {text:['「やどは きたの ほうさ。ゆっくり やすんでいきな」']}]},
  ],
  versa_hut: [
    {at:'5,2', spr:'elderWoman', name:'くすし', lines:[
      {when:{flag:'ch1_usedMedicine'}, text:[
        'くすし「きかなかったのかい……。それは もう くすりの はなしじゃ ないね」']},
      {when:{flag:'ch1_madeMedicine'}, text:[
        'くすし「はやく おうじょさまの ところへ おいき」']},
      {when:{flag:'ch1_gotHerb'}, text:[
        'くすし「おや、その ひかり……ゆきぐさ だね」']},
      {when:{flag:'ch1_heardTheft'}, text:[
        'くすし「みなみの こおりの どうくつ。くろい けものだよ」']},
      {text:['くすし「よく きたね、わかい きし。なにを さがしに?」']}]},
  ],
  versa_cast1: [
    {at:'10,2', spr:'king', name:'おう', lines:[
      {when:{flag:'ch1_cleared'}, text:[
        'おう「ゆきぐさでも だめだった。」',
        'おう「……たびの したくは できておるか」',
        '「せかいを みてこい、リオン。おなじ ねむりの もとを つきとめるのだ」']},
      {when:{flag:'ch1_gotHerb'}, text:[
        'おう「くすりが できたら、すぐに むすめの もとへ」']},
      {text:['おう「むすめが めを さまさぬ。いしゃも てだてが ないという」',
             '「たのむ、リオン。おまえだけが たよりだ」']},
    ]},
    {at:'8,7', spr:'butler', name:'じい', lines:[
      {when:{flag:'ch1_cleared'}, text:[
        'じい「ゆきぐさが きかぬとは……。わしの しる くすりでは もう むりじゃ」']},
      {when:{flag:'ch1_gotHerb'}, text:[
        'じい「ゆきぐさを ミルカの くすしに わたすのじゃ。くすりに して もらえる」']},
      {when:{flag:'ch1_heardTheft'}, text:[
        'じい「まものに うばわれた とな。……とりかえすしか あるまい」']},
      {when:{flag:'ch1_sawPrincess'}, text:[
        'じい「にしの ミルカへ いくのじゃ。ゆきぐささえ あれば……」']},
      {text:['じい「おうじょさまは おくの ねまに おられる」',
             '「みて さしあげなさい。なにか わかるかもしれん」']},
    ]},
    {at:'13,7', spr:'guardB', name:'えいへい', lines:[
      {text:['「おれも きしだんだ。おまえの ぶんまで まちを まもる」']},
    ]},
    {at:'6,12', spr:'maid', name:'しじょ', lines:[
      {when:{flag:'ch1_cleared'}, text:['「おうじょさまが おきられました！ ゆめのようです」']},
      {text:['「おうじょさまは、ねむる まえに こう おっしゃいました」',
             '「＜つめたい ところで、だれかが わたしを よんでいる＞と」']},
    ]},
  ],
};

// ---------------- クエスト ----------------
// state: 'inactive' → 'active' → 'clear'
const QUESTS = {
  // ============ 第5章 ひかりの こ ============
  ch5_q1_cave: {
    id:'ch5_q1_cave', chapter:5, title:'ゆめみの どうくつへ',
    giver:'むらの おさ',
    desc:'むらの ものが ねむったまま おきない。ひがしの ゆめみの どうくつへ。',
    steps:[
      {id:'enter', desc:'どうくつへ はいる',     flag:'ch5_enteredCave'},
      {id:'deep',  desc:'さいしんぶへ たどりつく', flag:'ch5_reachedDeep'},
    ],
    reward:{}, next:'ch5_q2_lord',
  },
  ch5_q2_lord: {
    id:'ch5_q2_lord', chapter:5, title:'ゆめの ぬし',
    giver:'むらの おさ',
    desc:'さいしんぶに きりの ぬしが いる。むらの ものを とりもどせ。',
    steps:[{id:'beat', desc:'ゆめの ぬしを たおす', flag:'ch5_beatLord'}],
    reward:{}, next:'ch5_q3_sail',
  },
  ch5_q3_sail: {
    id:'ch5_q3_sail', chapter:5, title:'よっつの ちほうへ',
    giver:'むらの おさ',
    desc:'きりは よそでも おきて いる。ふねを えて、せかいを めぐる。',
    steps:[{id:'sail', desc:'ふねで たびだつ', flag:'ch5_sailed'}],
    reward:{}, next:'ch5_q4_north',
  },
  ch5_q4_north: {
    id:'ch5_q4_north', chapter:5, title:'きたの かけら',
    giver:'ルミア',
    desc:'しろい かけらが よっつの ちほうに とんだ。まずは きたの ヴェルサへ。',
    steps:[
      {id:'meet', desc:'ヴェルサリアで きしだんちょうに あう', flag:'ch5_north'},
      {id:'beat', desc:'かけらの ばんけんを たおす',           flag:'ch5_shard1'},
    ],
    reward:{}, next:'ch5_q5_east',
  },
  ch5_q5_east: {
    id:'ch5_q5_east', chapter:5, title:'ひがしの かけら',
    giver:'リオン',
    desc:'ふたつめの かけらは ひがしの すなの まち、ザールに。',
    steps:[
      {id:'meet', desc:'ザールで しょうかいちょうに あう', flag:'ch5_east'},
      {id:'beat', desc:'かけらの ねむりぬしを たおす',     flag:'ch5_shard2'},
    ],
    reward:{}, next:'ch5_q6_south',
  },
  ch5_q6_south: {
    id:'ch5_q6_south', chapter:5, title:'みなみの かけら',
    giver:'バルド',
    desc:'みっつめの かけらは みなみの サンゴぐんとう、ミナモに。',
    steps:[
      {id:'meet', desc:'みなとで うらないの ししょうに あう', flag:'ch5_south'},
      {id:'beat', desc:'かけらの しまいを たおす',             flag:'ch5_shard3'},
    ],
    reward:{}, next:'ch5_q7_west',
  },
  ch5_q7_west: {
    id:'ch5_q7_west', chapter:5, title:'にしの かけら',
    giver:'セナ',
    desc:'さいごの かけらは にしの れいほう、エルデの とうに。',
    steps:[
      {id:'meet', desc:'さとで ゼフの でしに あう',   flag:'ch5_west'},
      {id:'beat', desc:'ゆめくいの つかいを たおす', flag:'ch5_shard4'},
    ],
    reward:{}, next:null,
  },

  // ============ 第4章 ろうけんじゃの しょくざい ============
  ch4_q1_key: {
    id:'ch4_q1_key', chapter:4, title:'とうの かぎを とりかえす',
    giver:'ゼフ',
    desc:'さんどうの こやが あらされ、とうの かぎが うばわれた。おくの けものを おえ。',
    steps:[
      {id:'see_hut', desc:'あらされた こやを しらべる', flag:'ch4_sawHut'},
      {id:'beat',    desc:'ゆきの ぬしがみを たおす',   flag:'ch4_gotTowerKey'},
    ],
    reward:{}, next:'ch4_q2_tower',
  },
  ch4_q2_tower: {
    id:'ch4_q2_tower', chapter:4, title:'とうの さいじょうかいへ',
    giver:'ゼフ',
    desc:'かぎを とりかえした。けんきゅうとうを のぼり、さいじょうかいへ。',
    steps:[{id:'reach_tower', desc:'けんきゅうとうへ はいる', flag:'ch4_enteredTower'}],
    reward:{}, next:'ch4_q3_regret',
  },
  ch4_q3_regret: {
    id:'ch4_q3_regret', chapter:4, title:'こうかいの かげ',
    giver:'ゼフ',
    desc:'さいじょうかいに、ゼフの こうかいが かたちを とって いる。むきあわねば ならない。',
    steps:[{id:'beat_boss', desc:'こうかいの かげを たおす', flag:'ch4_gotKey'}],
    reward:{}, next:'ch4_q4_send',
  },
  ch4_q4_send: {
    id:'ch4_q4_send', chapter:4, title:'ミオを おくりだす',
    giver:'ゼフの でし',
    desc:'ゼフは ゆめの たいりくへの かぎを といた。ミオが たびに でる。',
    steps:[{id:'depart', desc:'たびに でる', flag:'ch4_departed'}],
    reward:{}, next:null,
  },
  // ============ 第3章 みなとの しまい ============
  ch3_q0_fare: {
    id:'ch3_q0_fare', chapter:3, title:'ふなのりの いらい',
    giver:'ふなのり',
    desc:'ナギサへ わたる こぶねを だして もらうには うでを みせる ひつようが ある。いそべの ぬしを たおそう。',
    steps:[{id:'pay', desc:'ふなちんを はらう', flag:'ch3_paidFare'}],
    reward:{}, next:'ch3_q1_isle',
  },
  ch3_q1_isle: {
    id:'ch3_q1_isle', chapter:3, title:'しまの ねむり',
    giver:'うらないの ししょう',
    desc:'ナギサで ねむりが ひろがっている。こぶねで わたり、なにが おきたか みる。',
    steps:[
      {id:'reach_isle', desc:'ナギサへ わたる', flag:'ch3_reachedIsle'},
      {id:'ask_elder',  desc:'むらの おさに はなす', flag:'ch3_heardIsle'},
    ],
    reward:{}, next:'ch3_q2_dream',
  },
  ch3_q2_dream: {
    id:'ch3_q2_dream', chapter:3, title:'ゆめの かけら',
    giver:'むらの おさ',
    desc:'かいしょくどうは けっかいで はいれない。にしの あさせの ほらに、まもり手が いる。',
    steps:[
      {id:'enter_shoal', desc:'あさせの ほらへ いく',        flag:'ch3_enteredShoal'},
      {id:'beat_warlock',desc:'まどろみの しもべを たおす', flag:'ch3_sawDream'},
    ],
    reward:{}, next:'ch3_q3_shell',
  },
  ch3_q3_shell: {
    id:'ch3_q3_shell', chapter:3, title:'よびがいを さがす',
    giver:'うらないの ししょう',
    desc:'まどろみの しもべを たおし、よびがいを えた。けっかいも きえた。',
    steps:[
      {id:'get_shell', desc:'よびがいを てにいれる', flag:'ch3_gotCallShell'},
    ],
    reward:{}, next:'ch3_q4_twins',
  },
  ch3_q4_twins: {
    id:'ch3_q4_twins', chapter:3, title:'しまいの かげ',
    giver:'ゆめ',
    desc:'よびがいを もって かいしょくどうの さいしんぶへ。ふたつの かげと たたかう。',
    steps:[{id:'beat_boss', desc:'しまいの かげを たおす', flag:'ch3_gotShell'}],
    reward:{}, next:'ch3_q5_cause',
  },
  ch3_q5_cause: {
    id:'ch3_q5_cause', chapter:3, title:'ひかりの こを まつ',
    giver:'うらないの ししょう',
    desc:'かげを たおしても みなは めざめない。セナの ゆめが「むかえが くる」と つげる。',
    steps:[{id:'depart', desc:'たびに でる', flag:'ch3_departed'}],
    reward:{}, next:null,
  },

  // ============ 第2章 あきないの たび ============
  ch2_q1_caravan: {
    id:'ch2_q1_caravan', chapter:2, title:'きえた たいしょう',
    giver:'しょうかいちょう',
    desc:'みなみへ でた たいしょうが まるごと きえた。オアシスの むらで はなしを きく。',
    steps:[
      {id:'reach_oasis', desc:'オアシスの むらへ いく', flag:'ch2_reachedOasis'},
      {id:'ask_elder',   desc:'すなの たみの おさに はなす', flag:'ch2_heardSand'},
    ],
    reward:{}, next:'ch2_q2_ruin',
  },
  ch2_q2_ruin: {
    id:'ch2_q2_ruin', chapter:2, title:'ねむりの すな',
    giver:'すなの たみの おさ',
    desc:'にしの すなやまの したに ある すなの いせきへ。ねむりを ふらす ものを たおす。',
    steps:[
      {id:'enter_ruin', desc:'すなの いせきに はいる', flag:'ch2_enteredRuin'},
      {id:'beat_boss',  desc:'さいしんぶの ぬしを たおす', flag:'ch2_gotSand'},
    ],
    reward:{}, next:'ch2_q3_wake',
  },
  ch2_q3_wake: {
    id:'ch2_q3_wake', chapter:2, title:'めざめぬ たいしょう',
    giver:'しょうかいちょう',
    desc:'たいしょうを つれもどしたが、だれも めを さまさない。ザールへ もどって ほうこくする。',
    steps:[
      {id:'report', desc:'しょうかいちょうに ほうこくする', flag:'ch2_reported'},
    ],
    reward:{}, next:'ch2_q4_cause',
  },
  ch2_q4_cause: {
    id:'ch2_q4_cause', chapter:2, title:'おなじ ねむり',
    giver:'しょうかいちょう',
    desc:'ヴェルサでも おなじ ことが おきているという。ねむりの もとを つきとめる たびへ。',
    steps:[
      {id:'depart', desc:'たびに でる', flag:'ch2_departed'},
    ],
    reward:{}, next:null,
  },

  ch1_q1_wakeup: {
    id:'ch1_q1_wakeup', chapter:1, title:'めざめぬ おうじょ',
    giver:'きしだんちょう',
    desc:'おうじょが ねむりから さめない。まちの ものに はなしを きき、げんいんを しらべる。',
    steps:[
      {id:'talk_maid',  desc:'こうじょの じじょに はなす',   flag:'ch1_talkedMaid'},
      {id:'talk_guard', desc:'みなみもんの もんばんに はなす', flag:'ch1_talkedGate'},
      {id:'report',     desc:'きしだんちょうに ほうこくする', flag:'ch1_orderReceived'},
    ],
    reward:{gold:100}, next:'ch1_q2_herb',
  },
  ch1_q2_herb: {
    id:'ch1_q2_herb', chapter:1, title:'ゆきぐさを もとめて',
    giver:'じい',
    desc:'となりまち ミルカに ある くすりぐさ ＜ゆきぐさ＞ を もらいに いく。せつげんを にしへ。',
    steps:[
      {id:'see_princess', desc:'おうじょさまを みる',   flag:'ch1_sawPrincess'},
      {id:'reach_mirka',  desc:'ミルカへ たどりつく',   flag:'ch1_reachedMirka'},
      {id:'ask_kusushi',  desc:'くすしに はなしを きく', flag:'ch1_heardTheft'},
    ],
    reward:{}, next:'ch1_q3_retrieve',
  },
  ch1_q3_retrieve: {
    id:'ch1_q3_retrieve', chapter:1, title:'うばわれた ゆきぐさ',
    giver:'くすし',
    desc:'ゆきぐさは まものに うばわれた。みなみの こおりの どうくつで とりかえす。',
    steps:[
      {id:'enter_cave', desc:'こおりの どうくつに はいる',   flag:'ch1_enteredCave'},
      {id:'beat_boss',  desc:'さいしんぶの ぬしを たおす',   flag:'ch1_gotHerb'},
    ],
    reward:{}, next:'ch1_q4_medicine',
  },
  ch1_q4_medicine: {
    id:'ch1_q4_medicine', chapter:1, title:'めざめの くすり',
    giver:'くすし',
    desc:'ゆきぐさを くすしに わたして くすりに して もらい、おうじょさまに つかう。',
    steps:[
      {id:'make',  desc:'くすしに ゆきぐさを わたす', flag:'ch1_madeMedicine'},
      {id:'use',   desc:'おうじょさまに くすりを つかう', flag:'ch1_usedMedicine'},
    ],
    reward:{}, next:'ch1_q5_cause',
  },
  ch1_q5_cause: {
    id:'ch1_q5_cause', chapter:1, title:'ねむりの もとを たずねて',
    giver:'おう',
    desc:'くすりが きかなかった。この ねむりの もとを つきとめるため、せかいへ たびだつ。',
    steps:[
      {id:'depart', desc:'たびに でる', flag:'ch1_departed'},
    ],
    reward:{}, next:null,
  },
};

// じょうけんに あう だんを えらぶ
function pickLines(entry, ctx){
  for(const l of entry.lines){
    const w = l.when;
    if(!w) return l.text;
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

