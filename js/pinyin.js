/* ============================================================
 * 拼音数据与拼读题目生成
 * ============================================================ */

const SHENGMU = [
  {s:'b', c:'玻'}, {s:'p', c:'坡'}, {s:'m', c:'摸'}, {s:'f', c:'佛'},
  {s:'d', c:'得'}, {s:'t', c:'特'}, {s:'n', c:'讷'}, {s:'l', c:'勒'},
  {s:'g', c:'哥'}, {s:'k', c:'科'}, {s:'h', c:'喝'},
  {s:'j', c:'基'}, {s:'q', c:'欺'}, {s:'x', c:'希'},
  {s:'zh', c:'知'}, {s:'ch', c:'吃'}, {s:'sh', c:'诗'}, {s:'r', c:'日'},
  {s:'z', c:'资'}, {s:'c', c:'雌'}, {s:'s', c:'思'},
  {s:'y', c:'衣'}, {s:'w', c:'乌'}
];

const YUNMU = [
  {y:'a', c:'啊'}, {y:'o', c:'喔'}, {y:'e', c:'鹅'}, {y:'i', c:'衣'},
  {y:'u', c:'乌'}, {y:'ü', c:'迂'},
  {y:'ai', c:'爱'}, {y:'ei', c:'诶'}, {y:'ui', c:'威'},
  {y:'ao', c:'熬'}, {y:'ou', c:'欧'}, {y:'iu', c:'优'},
  {y:'ie', c:'耶'}, {y:'üe', c:'约'}, {y:'er', c:'儿'},
  {y:'an', c:'安'}, {y:'en', c:'恩'}, {y:'in', c:'因'},
  {y:'un', c:'温'}, {y:'ün', c:'晕'},
  {y:'ang', c:'昂'}, {y:'eng', c:'亨'}, {y:'ing', c:'英'}, {y:'ong', c:'轰'}
];

const ZHENGTI = ['zhi','chi','shi','ri','zi','ci','si','yi','wu','yu','ye','yue','yuan','yin','yun','ying'];

/* 声调符号（a o e i u ü 上标） */
const TONES = {
  'a':['ā','á','ǎ','à'], 'o':['ō','ó','ǒ','ò'], 'e':['ē','é','ě','è'],
  'i':['ī','í','ǐ','ì'], 'u':['ū','ú','ǔ','ù'], 'ü':['ǖ','ǘ','ǚ','ǜ']
};

/* 给拼音加声调：标注在主元音上（a>o>e>i>u>ü 优先顺序，iu/ui 标在后一个） */
function addTone(pinyin, tone) {
  if (tone === 0 || !pinyin) return pinyin;
  const order = ['a','o','e','i','u','ü'];
  let idx = -1, ch = '';
  if (pinyin.endsWith('iu') || pinyin.endsWith('ui')) {
    const target = pinyin[pinyin.length - 1];
    idx = pinyin.length - 1; ch = target;
  } else {
    for (let i = 0; i < pinyin.length; i++) {
      const c = pinyin[i];
      const o = order.indexOf(c);
      if (o >= 0 && o > idx) { idx = i; ch = c; }
    }
  }
  if (idx < 0) return pinyin;
  return pinyin.slice(0, idx) + TONES[ch][tone - 1] + pinyin.slice(idx + 1);
}

/* 真实常用音节池：[音节, 声母, 韵母, 代表字] —— 保证拼读练习全部是合法音节 */
const SYLLABLE_POOL = [
  ['ba','b','a','八'], ['bo','b','o','波'], ['bi','b','i','笔'], ['bu','b','u','不'],
  ['pa','p','a','爬'], ['po','p','o','坡'], ['pi','p','i','皮'], ['pu','p','u','扑'],
  ['ma','m','a','妈'], ['mo','m','o','摸'], ['mi','m','i','米'], ['mu','m','u','木'],
  ['fa','f','a','发'], ['fo','f','o','佛'], ['fu','f','u','福'],
  ['da','d','a','大'], ['de','d','e','的'], ['di','d','i','地'], ['du','d','u','读'],
  ['ta','t','a','他'], ['te','t','e','特'], ['ti','t','i','踢'], ['tu','t','u','兔'],
  ['na','n','a','那'], ['ne','n','e','呢'], ['ni','n','i','你'], ['nu','n','u','怒'], ['nü','n','ü','女'],
  ['la','l','a','拉'], ['le','l','e','乐'], ['li','l','i','里'], ['lu','l','u','路'], ['lü','l','ü','绿'],
  ['ga','g','a','嘎'], ['ge','g','e','歌'], ['gu','g','u','鼓'],
  ['ka','k','a','卡'], ['ke','k','e','课'], ['ku','k','u','哭'],
  ['ha','h','a','哈'], ['he','h','e','喝'], ['hu','h','u','虎'],
  ['ji','j','i','鸡'], ['jia','j','ia','家'], ['jie','j','ie','姐'], ['jin','j','in','今'], ['jing','j','ing','京'], ['jiu','j','iu','九'], ['jue','j','üe','觉'], ['jun','j','ün','军'],
  ['qi','q','i','七'], ['qia','q','ia','恰'], ['qie','q','ie','切'], ['qin','q','in','亲'], ['qing','q','ing','请'], ['qiu','q','iu','球'], ['que','q','üe','雀'], ['qun','q','ün','群'],
  ['xi','x','i','西'], ['xia','x','ia','下'], ['xie','x','ie','写'], ['xin','x','in','新'], ['xing','x','ing','星'], ['xiu','x','iu','休'], ['xue','x','üe','学'], ['xun','x','ün','寻'],
  ['zha','zh','a','炸'], ['zhe','zh','e','这'], ['zhi','zh','i','知'], ['zhu','zh','u','猪'],
  ['cha','ch','a','茶'], ['che','ch','e','车'], ['chi','ch','i','吃'], ['chu','ch','u','出'],
  ['sha','sh','a','沙'], ['she','sh','e','蛇'], ['shi','sh','i','十'], ['shu','sh','u','书'],
  ['re','r','e','热'], ['ri','r','i','日'], ['ru','r','u','入'],
  ['za','z','a','杂'], ['ze','z','e','则'], ['zi','z','i','字'], ['zu','z','u','足'],
  ['ca','c','a','擦'], ['ce','c','e','册'], ['ci','c','i','词'], ['cu','c','u','粗'],
  ['sa','s','a','撒'], ['se','s','e','色'], ['si','s','i','四'], ['su','s','u','苏'],
  ['ya','y','a','呀'], ['ye','y','e','叶'], ['yi','y','i','一'], ['yu','y','ü','雨'],
  ['wa','w','a','蛙'], ['wo','w','o','我'], ['wu','w','u','五'],
  ['ai','','ai','爱'], ['ei','','ei','诶'], ['ao','','ao','奥'], ['ou','','ou','藕'],
  ['an','','an','安'], ['en','','en','恩'], ['ang','','ang','昂'], ['eng','','eng','灯'], ['er','','er','耳'],
  ['ao','','ao','袄'], ['ou','','ou','欧'], ['en','','en','嗯'], ['ang','','ang','航']
];

/* 每日拼读练习：从真实音节池取 6 个，加声调 */
function genPinyinPractice(seed) {
  let s = seed || 1;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const pool = SYLLABLE_POOL.slice();
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const picked = pool.slice(0, 6);
  return picked.map(([syl, sm, ym, ch]) => {
    const tone = 1 + Math.floor(rnd() * 4);
    const smInfo = sm ? SHENGMU.find(x => x.s === sm) : null;
    const ymInfo = YUNMU.find(x => x.y === ym);
    return {
      sm, ym,
      smName: smInfo ? smInfo.c : '—',
      ymName: ymInfo ? ymInfo.c : ym,
      tone, syllable: addTone(syl, tone), char: ch || ''
    };
  });
}

/* 从汉字池中生成"拼音对对碰"关卡数据（每关 5 题）
 * 题目：给汉字选拼音 或 给拼音选汉字 */
function genPinyinQuiz(count, seed) {
  const pool = HANZI.slice();
  let s = seed || 1;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picked = pool.slice(0, count);
  return picked.map((h, i) => {
    const mode = (i % 2 === 0) ? 'char2pinyin' : 'pinyin2char';
    const wrongs = new Set();
    while (wrongs.size < 3) {
      const r = pool[Math.floor(rnd() * pool.length)];
      if (r.py !== h.py) wrongs.add(r.py);
    }
    const options = [h.py, ...wrongs].sort(() => rnd() - 0.5);
    return { mode, char: h.c, word: h.w, answer: h.py, options };
  });
}
