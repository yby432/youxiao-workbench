/* ============================================================
 * 六大学习模块：识字 / 拼音 / 古诗 / 英语 / 数学 / 科普
 * ============================================================ */

function nextDay() { state.dayOffset++; saveState(); renderPage(currentPage); renderHeader(); pop(document.querySelector('.tab-item.active')); }
function dayHint() { return `<div class="day-hint">📅 今日内容 · 每日自动更新 <button class="mini-btn" onclick="nextDay()">🔄 换一组</button></div>`; }
/* 模块页通用的"完成打卡"按钮 */
function punchBtn(id, label) {
  const done = taskDone(id);
  return `<button class="punch-btn ${done ? 'done' : ''}" onclick="toggleTask('${id}')">${done ? '✅ 已完成' : '🏁 ' + label}</button>`;
}
function goHomeBtn() { return `<button class="mini-btn" onclick="nav('home')">🏠 返回首页</button>`; }
function moduleTop(icon, title, sub) {
  return `<div class="page-title">${icon} ${title} <span class="sub">${sub}</span></div><div class="module-top">${goHomeBtn()}</div>`;
}

/* ============================================================
 * 模块一：识字（人教版字表 · 状态机 · 练习 · 听写 · 闪卡）
 * ============================================================ */
const UNIT_SIZE = 25; // 虚拟单元分组
RENDERERS.shizi = function () {
  const page = document.getElementById('page-shizi');
  const st = hanziStats();
  const today = blockByDay(HANZI, 5, seedNow());
  page.innerHTML = `
    ${moduleTop('🀄', '识字乐园', '人教版字表 · 同步学习')}
    <div class="stat-strip">
      <div class="stat-cell"><b>${st.total}</b><span>总字库</span></div>
      <div class="stat-cell"><b>${st.learned}</b><span>已学</span></div>
      <div class="stat-cell"><b>${st.mastered}</b><span>已掌握</span></div>
      <div class="stat-cell warn"><b>${st.weak}</b><span>薄弱</span></div>
    </div>
    <div class="card">
      <div class="card-head">✏️ 今日新字 <span class="sub">点字卡学习</span></div>
      <div class="hz-learn-grid">${today.map(h => {
        const s = hzStatus(h.c);
        const badge = s === 'mastered' ? '<em class="hz-badge ok">✅ 掌握</em>' : (s === 'learned' ? '<em class="hz-badge mid">🟡 已学</em>' : '<em class="hz-badge">⚪ 未学</em>');
        return `
        <div class="hz-learn-cell">
          <div class="hz-char-big" onclick="speak('${h.c}','zh-CN')">${h.c}</div>
          <div class="hz-py">${h.py}</div>
          <div class="hz-word">${esc(h.w)}</div>
          ${badge}
          <div class="hz-btns">
            <button class="mini-btn ${s === 'learned' || s === 'mastered' ? '' : 'primary'}" onclick="markHanzi('${h.c}','learned')">${s === 'learned' || s === 'mastered' ? '✓ 已学' : '📖 学习'}</button>
            <button class="mini-btn ${s === 'mastered' ? 'ok-b' : ''}" onclick="markHanzi('${h.c}','mastered')">${s === 'mastered' ? '🌟 已掌握' : '🌟 掌握了'}</button>
          </div>
        </div>`;}).join('')}
      </div>
      <div class="card-foot">点「学习」记为已学，完成练习后点「掌握了」变绿色 ✅</div>
      <div style="margin-top:10px">${punchBtn('t-shizi', '完成今日识字打卡 +5🪙')}</div>
    </div>
    <div class="card">
      <div class="card-head">🎯 随堂练习 <button class="mini-btn" onclick="shiziQuiz()">🎲 出题</button></div>
      <div id="sz-quiz"><div class="empty-tip">把今天的字和薄弱字出成选择题，答对自动进步</div></div>
    </div>
    <div class="card">
      <div class="card-head">📝 生字听写 <button class="mini-btn" onclick="shiziTingxie()">🔊 开始听写</button></div>
      <div id="sz-ting"><div class="empty-tip">点开始后播放读音，孩子写/说，家长判断会不会</div></div>
    </div>
    <div class="card">
      <div class="card-head">🃏 生字闪卡 <button class="mini-btn" onclick="shiziFlash()">▶️ 开始</button></div>
      <div id="sz-flash"><div class="empty-tip">快速认字小游戏，看看谁认得又快又准</div></div>
    </div>
    <div class="card">
      <div class="card-head">📚 生字表 <span class="sub">人教版一年级 · 按单元</span></div>
      <div id="sz-table">${renderHanziTable()}</div>
    </div>`;
};
function renderHanziTable() {
  const units = [];
  for (let i = 0; i < HANZI.length; i += UNIT_SIZE) units.push(HANZI.slice(i, i + UNIT_SIZE));
  return units.map((u, ui) => `
    <div class="unit-block">
      <div class="unit-title">📖 单元 ${ui + 1} <span class="unit-count">${u.length} 字</span></div>
      <div class="unit-chars">${u.map(h => {
        const s = hzStatus(h.c);
        const cls = s === 'mastered' ? 'mc-ok' : (s === 'learned' ? 'mc-mid' : 'mc-new');
        return `<span class="unit-char ${cls}" onclick="speak('${h.c}','zh-CN')" title="${h.py} ${esc(h.w)}">${h.c}</span>`;
      }).join('')}</div>
    </div>`).join('');
}
/* 随堂练习 */
function shiziQuiz() {
  const seed = seedNow();
  const today = blockByDay(HANZI, 5, seed);
  const pool = [...today, ...state.weakHanzi.map(w => HANZI.find(h => h.c === w)).filter(Boolean)];
  const uniq = [...new Map(pool.map(h => [h.c, h])).values()];
  const quiz = genPinyinQuiz(Math.min(5, uniq.length), seed + 55);
  const area = document.getElementById('sz-quiz');
  let idx = 0, right = 0, wrongChars = [];
  function renderQ() {
    if (idx >= quiz.length) {
      wrongChars.forEach(addWeakHanzi);
      area.innerHTML = `<div class="quiz-done">🎉 完成！答对 ${right}/${quiz.length}
        ${wrongChars.length ? `<div class="ks-wrong">薄弱字已记入薄弱字本：${wrongChars.join('、')}</div>` : '<div class="ks-wrong ok">全部答对，太棒啦！</div>'}
        <button class="mini-btn primary" onclick="shiziQuiz()">🔄 再来一组</button></div>`;
      return;
    }
    const q = quiz[idx];
    area.innerHTML = `
      <div class="quiz-q">${q.mode === 'char2pinyin' ? `「${q.char}」读什么？` : `拼音 ${q.answer} 是哪个字？`}</div>
      <div class="py-options">${q.options.map(o => `<button class="py-opt" onclick="szQuizAns('${esc(o)}', this, '${q.char}')">${esc(o)}</button>`).join('')}</div>
      <div id="sz-fb"></div>`;
  }
  window._szQuiz = { next: renderQ, judge(char, opt, btn) {
    const q = quiz[idx];
    const fb = document.getElementById('sz-fb');
    if (opt === q.answer) { right++; btn.classList.add('ok'); fb.innerHTML = '<div class="fb right">✅ 答对啦！</div>'; }
    else { btn.classList.add('bad'); wrongChars.push(char); fb.innerHTML = `<div class="fb wrong">❌ 正确答案：${q.answer}（${q.char}）</div>`; }
    document.querySelectorAll('#sz-quiz .py-opt').forEach(b => b.disabled = true);
    idx++; setTimeout(renderQ, 1000);
  } };
  renderQ();
}
function szQuizAns(opt, btn, char) { window._szQuiz.judge(char, opt, btn); }
/* 听写 */
function shiziTingxie() {
  const today = blockByDay(HANZI, 5, seedNow());
  const area = document.getElementById('sz-ting');
  let idx = 0; const notOK = [];
  function next() {
    if (idx >= today.length) {
      notOK.forEach(addWeakHanzi);
      area.innerHTML = `<div class="quiz-done">📝 听写完成！${notOK.length ? `不会的字：${notOK.join('、')}（已加入薄弱字本）` : '全部都会，太厉害啦！'}
        <button class="mini-btn primary" onclick="shiziTingxie()">🔄 再听写一遍</button></div>`;
      return;
    }
    const h = today[idx];
    area.innerHTML = `
      <div class="ting-tip">听第 ${idx + 1} 个字，孩子写/说，然后判断：</div>
      <div class="ting-big" id="ting-char">🔊 ${h.c}</div>
      <button class="mini-btn primary" onclick="speak('${h.c}','zh-CN')">🔊 再读一遍</button>
      <button class="mini-btn ok-b" onclick="tingOK()">✅ 会了</button>
      <button class="mini-btn danger" onclick="tingNO()">❌ 不会</button>`;
    window._ting = {
      ok() { idx++; next(); },
      no() { notOK.push(today[idx].c); idx++; next(); }
    };
  }
  window._tingNext = next;
  next();
}
function tingOK() { window._ting.ok(); }
function tingNO() { window._ting.no(); }
/* 闪卡 */
function shiziFlash() {
  const today = blockByDay(HANZI, 5, seedNow());
  const area = document.getElementById('sz-flash');
  let idx = 0, showPy = false, ok = 0;
  function render() {
    if (idx >= today.length) {
      area.innerHTML = `<div class="quiz-done">🃏 闪卡完成！认得 ${ok}/${today.length} 个
        <button class="mini-btn primary" onclick="shiziFlash()">🔄 再来一轮</button></div>`;
      return;
    }
    const h = today[idx];
    area.innerHTML = `
      <div class="flash-card" onclick="flashFlip()">
        <div class="flash-char">${showPy ? h.py : h.c}</div>
        <div class="flash-sub">${showPy ? esc(h.w) : '点一下看拼音'}</div>
      </div>
      <div class="flash-btns">
        <button class="mini-btn ok-b" onclick="flashJudge(true)">✅ 认识</button>
        <button class="mini-btn danger" onclick="flashJudge(false)">❌ 不认识</button>
      </div>`;
  }
  window._flash = {
    flip() { showPy = !showPy; render(); },
    judge(know) { if (know) ok++; if (!know) addWeakHanzi(today[idx].c); idx++; showPy = false; render(); }
  };
  render();
}
function flashFlip() { window._flash.flip(); }
function flashJudge(k) { window._flash.judge(k); }

/* ============================================================
 * 模块二：拼音
 * ============================================================ */
RENDERERS.pinyin = function () {
  const page = document.getElementById('page-pinyin');
  const practice = genPinyinPractice(seedNow() + 100);
  const sanpin = shuffleArr(SANPIN_POOL, seedNow() + 7).slice(0, 6);
  page.innerHTML = `
    ${moduleTop('🔤', '拼音乐园', '声母 · 韵母 · 拼读')}
    ${dayHint()}
    <div class="card">
      <div class="card-head">📖 拼音字母表 <span class="sub">点任意一个发音</span> <button class="mini-btn" onclick="speak('${SHENGMU.map(s=>s.c).join('，')}','zh-CN')">🔊 连读声母</button></div>
      <div class="py-table">
        <div class="py-row"><span class="py-label">声母</span><span class="py-chips">${SHENGMU.map(s=>`<b class="pt" onclick="speak('${s.c}','zh-CN')">${s.s}</b>`).join('')}</span></div>
        <div class="py-row"><span class="py-label">韵母</span><span class="py-chips">${YUNMU.map(y=>`<b class="pt" onclick="speak('${y.c}','zh-CN')">${y.y}</b>`).join('')}</span></div>
        <div class="py-row"><span class="py-label">整体认读</span><span class="py-chips">${ZHENGTI.map(z=>`<b class="pt" onclick="speak('${z}','zh-CN')">${z}</b>`).join('')}</span></div>
      </div>
      <div class="card-foot">声母读"呼读音"：b 读"玻"、p 读"坡"、m 读"摸"…点字母听发音 👆</div>
    </div>
    <div class="card">
      <div class="card-head">🔊 今日两拼练习 <span class="sub">点音节听读音</span></div>
      <div class="pinyin-today">${practice.map(p => `
        <div class="py-item" onclick="speak('${p.char || p.syllable}','zh-CN')"><b>${p.syllable}</b><small>声母 ${p.sm || '—'} · 韵母 ${p.ym} · ${p.tone}声${p.char ? `（${p.char}）` : ''}</small></div>`).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-head">🧩 三拼练习 <span class="sub">声母+介母+韵母 · 点读音节</span></div>
      <div class="pinyin-today">${sanpin.map(p => `
        <div class="py-item three" onclick="speak('${p[4] || p[0]}','zh-CN')"><b>${addTone(p[0], 1 + Math.floor(Math.random()*4))}</b><small>${p[1]} + ${p[2]} + ${p[3]}（三拼）${p[4] ? `· ${p[4]}` : ''}</small></div>`).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-head">🎮 拼音闯关 <span class="sub">汉字拼音对对碰</span></div>
      <div class="empty-tip">去游戏区挑战拼音闯关，赢星星 ⭐</div>
      <button class="mini-btn primary" onclick="nav('youxi')">🎮 开始闯关</button>
    </div>
    <div style="margin-top:4px">${punchBtn('t-pinyin', '完成今日拼音打卡 +4🪙')}</div>`;
};

/* ============================================================
 * 模块三：古诗（部编版必背 · 收藏 · 背诵打卡）
 * ============================================================ */
RENDERERS.gushi = function () {
  const page = document.getElementById('page-gushi');
  const seed = seedNow();
  const g = GUSHI[Math.floor(seed) % GUSHI.length];
  const fav = state.favGushi.includes(g.t);
  page.innerHTML = `
    ${moduleTop('🏮', '古诗小课堂', '部编版必背 · 每日一首')}
    ${dayHint()}
    <div class="card gushi-card">
      <div class="card-head">🏮 今日必背
        <button class="mini-btn" onclick="speak('${esc(g.l.join('，'))}','zh-CN')">🔊 朗读</button>
        <button class="mini-btn ${fav ? 'fav-on' : ''}" onclick="toggleFav('${esc(g.t)}')">${fav ? '♥ 已收藏' : '♡ 收藏'}</button>
      </div>
      <div class="gushi-title">《${g.t}》 <span class="gushi-author">${g.d} · ${g.a}</span></div>
      <div class="gushi-lines">${g.l.map(x => `<div>${x}</div>`).join('')}</div>
      <div class="card-foot">跟着朗读读 3 遍，然后自己背一遍，会背了就去打卡 ✅</div>
      <div style="margin-top:10px">${punchBtn('t-gushi', '我会背了，打卡 +3🪙')}</div>
    </div>
    <div class="card">
      <div class="card-head">📚 全部古诗 ${state.favGushi.length ? `<button class="mini-btn" onclick="showFavOnly()">♥ 只看收藏(${state.favGushi.length})</button>` : ''}</div>
      <div class="gushi-list">${GUSHI.map((x, i) => `
        <div class="gushi-list-item" onclick="gushiDetail(${i})">
          <span class="gli-title">《${x.t}》</span>
          <span class="gli-author">${x.a}</span>
          <span class="gli-fav">${state.favGushi.includes(x.t) ? '♥' : ''}</span>
        </div>`).join('')}
      </div>
    </div>`;
};
function toggleFav(title) {
  const i = state.favGushi.indexOf(title);
  if (i >= 0) state.favGushi.splice(i, 1); else state.favGushi.push(title);
  saveState(); renderPage('gushi');
}
function showFavOnly() {
  const list = document.querySelector('.gushi-list');
  list.innerHTML = GUSHI.filter(x => state.favGushi.includes(x.t)).map((x, i) => `
    <div class="gushi-list-item" onclick="gushiDetail(${GUSHI.indexOf(x)})">
      <span class="gli-title">《${x.t}》</span><span class="gli-author">${x.a}</span><span class="gli-fav">♥</span>
    </div>`).join('') || '<div class="empty-tip">还没有收藏，点古诗卡片的 ♡ 收藏吧</div>';
}
function gushiDetail(i) {
  const g = GUSHI[i];
  const fav = state.favGushi.includes(g.t);
  document.querySelector('.gushi-card').innerHTML = `
    <div class="card-head">🏮 古诗详情
      <button class="mini-btn" onclick="speak('${esc(g.l.join('，'))}','zh-CN')">🔊 朗读</button>
      <button class="mini-btn ${fav ? 'fav-on' : ''}" onclick="toggleFav('${esc(g.t)}')">${fav ? '♥ 已收藏' : '♡ 收藏'}</button>
      <button class="mini-btn" onclick="renderPage('gushi')">↩ 返回</button>
    </div>
    <div class="gushi-title">《${g.t}》 <span class="gushi-author">${g.d} · ${g.a}</span></div>
    <div class="gushi-lines">${g.l.map(x => `<div>${x}</div>`).join('')}</div>
    <div class="gushi-chant">🎤 和爸爸妈妈一起朗诵这首诗，说说你最喜欢哪一句</div>`;
}

/* ============================================================
 * 模块四：英语（26字母 · 单词 · 短句 · 儿歌 · 分级）
 * ============================================================ */
const ENG_SONGS = [
  { t: '小星星', en: ['Twinkle, twinkle, little star,', 'How I wonder what you are!', 'Up above the world so high,', 'Like a diamond in the sky.'] },
  { t: '老麦克唐纳的农场', en: ['Old MacDonald had a farm, E-I-E-I-O!', 'And on his farm he had a cow, E-I-E-I-O!', 'With a moo-moo here and a moo-moo there,', 'Here a moo, there a moo, everywhere a moo-moo.'] },
  { t: '公共汽车轮子', en: ['The wheels on the bus go round and round,', 'Round and round, round and round.', 'The wheels on the bus go round and round,', 'All day long!'] },
  { t: '头肩膝盖脚趾', en: ['Head, shoulders, knees and toes, knees and toes,', 'Head, shoulders, knees and toes, knees and toes,', 'And eyes and ears and mouth and nose,', 'Head, shoulders, knees and toes, knees and toes!'] }
];
RENDERERS.yingyu = function () {
  const page = document.getElementById('page-yingyu');
  const seed = seedNow();
  const sents = blockByDay(ENG_SENTENCES, 5, seed);
  const theme = ENG_WORDS[seed % ENG_WORDS.length];
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const alphaWord = ['Apple','Ball','Cat','Dog','Egg','Fish','Grape','Hat','Ice','Juice','Kite','Lion','Moon','Nose','Orange','Pig','Queen','Rabbit','Sun','Tiger','Umbrella','Violin','Water','Box','Yoyo','Zebra'];
  page.innerHTML = `
    ${moduleTop('🗣️', '英语启蒙', '入门单词 · 基础短句')}
    ${dayHint()}
    <div class="card">
      <div class="card-head">🔠 26 个字母 <span class="sub">入门级</span></div>
      <div class="alpha-grid">${alpha.map((a, i) => `
        <div class="alpha-cell" onclick="speak('${a}','en-US')"><b>${a}</b><small>${alphaWord[i]}</small></div>`).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-head">🍎 今日单词 <span class="sub">主题：${theme.t} ${theme.emoji}</span></div>
      <div class="word-grid">${theme.words.map(w => `
        <div class="word-cell" onclick="speak('${esc(w.e)}','en-US')">
          <span class="word-emoji">${w.emoji}</span><b class="word-en">${w.e}</b>
          <span class="word-py">${w.py}</span><span class="word-cn">${w.c}</span>
        </div>`).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-head">💬 今日短句 <span class="sub">基础级 · 可跟读</span> <button class="mini-btn" onclick="playSentences()">🎧 连读</button></div>
      <div class="sent-list">${sents.map(s => `
        <div class="sent-item"><div class="sent-en"><b>${esc(s.e)}</b> <button class="mini-btn" onclick="speak('${esc(s.e.replace(/'/g, "\\'"))}','en-US')">🔊</button></div>
        <div class="sent-cn">${esc(s.c)}</div></div>`).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-head">🎵 英文儿歌 <span class="sub">磨耳朵</span></div>
      ${ENG_SONGS.map((s, i) => `
        <div class="song-item">
          <b>${i + 1}. ${s.t}</b>
          <button class="mini-btn" onclick="speak('${esc(s.en.join(' ').replace(/'/g, "\\'"))}','en-US')">🔊 播放</button>
          <div class="song-lyrics">${s.en.map(l => `<div>${esc(l)}</div>`).join('')}</div>
        </div>`).join('')}
    </div>
    <div style="margin-top:4px">${punchBtn('t-yingyu', '完成今日英语打卡 +4🪙')}</div>`;
};
function playSentences() {
  const sents = blockByDay(ENG_SENTENCES, 5, seedNow());
  let i = 0;
  function next() { if (i >= sents.length) return; speak(sents[i].e, 'en-US'); i++; setTimeout(next, 2800); }
  next();
}

/* ============================================================
 * 模块五：数学（口算 · 数感 · 思维 · 钟表 · 图形）
 * ============================================================ */
let ks = null;
RENDERERS.shuxue = function () {
  const page = document.getElementById('page-shuxue');
  const cfg = state.kousuanCfg;
  page.innerHTML = `
    ${moduleTop('🔢', '数学乐园', '20以内 · 口算闯关')}
    <div class="card">
      <div class="card-head">🧮 口算闯关 <span class="sub">凑十/破十</span></div>
      <div class="cfg-row">
        <label>题数：<select id="ks-count">${[10, 20, 30, 50].map(n => `<option value="${n}" ${cfg.count === n ? 'selected' : ''}>${n}题</option>`).join('')}</select></label>
        <label>题型：<select id="ks-method">${['随机', '凑十法', '破十法', '直接算'].map(m => `<option ${cfg.method === m ? 'selected' : ''}>${m}</option>`).join('')}</select></label>
        <button class="mini-btn primary" onclick="startKousuan()">🚀 开始</button>
      </div>
      <div id="ks-area" class="ks-area"><div class="empty-tip">点「开始」出题，做完自动判分，错题进错题复习本 📒</div></div>
    </div>
    <div class="card">
      <div class="card-head">🌌 数感星球 <button class="mini-btn" onclick="genShuganQ()">🎲 出新题</button></div>
      <div id="sg-area"><div class="empty-tip">比大小 · 数的分成 · 相邻数 · 单双数</div></div>
    </div>
    <div class="card">
      <div class="card-head">🧠 思维训练 <button class="mini-btn" onclick="genSiweiQ()">🎲 出新题</button></div>
      <div id="sw-area"><div class="empty-tip">找规律 · 比轻重 · 排队问题</div></div>
    </div>
    <div class="card">
      <div class="card-head">🕐 认识钟表 <button class="mini-btn" onclick="genClockQ()">🎲 出新题</button></div>
      <div id="clock-area"><div class="empty-tip">看看钟面，读出时间（整点、半点、一刻）</div></div>
    </div>
    <div class="card">
      <div class="card-head">🔷 图形认知 <button class="mini-btn" onclick="genShapeQ()">🎲 出新题</button></div>
      <div id="shape-area"><div class="empty-tip">数一数图形，认识圆形、三角形、方形</div></div>
    </div>
    <div class="card">
      <div class="card-head">📒 错题复习本 <span class="badge">${state.mistakes.length}</span> <button class="mini-btn" onclick="mistakeReview()">🔁 错题重练</button></div>
      <div id="mistake-area">${renderMistakes()}</div>
    </div>
    <div style="margin-top:4px">${punchBtn('t-shuxue', '完成今日数学打卡 +5🪙')}</div>`;
};
function startKousuan() {
  const cfg = state.kousuanCfg;
  cfg.count = parseInt(document.getElementById('ks-count').value, 10);
  cfg.method = document.getElementById('ks-method').value;
  saveState();
  ks = { list: genKousuanPaper(cfg.count, cfg.method === '随机' ? null : cfg.method), idx: 0, right: 0, wrong: [] };
  renderKousuan();
}
function renderKousuan() {
  const area = document.getElementById('ks-area');
  if (!ks) return;
  if (ks.idx >= ks.list.length) {
    area.innerHTML = `
      <div class="ks-result"><div class="ks-score">${ks.wrong.length === 0 ? '🏆' : '💪'} 完成！答对 ${ks.right}/${ks.list.length}</div>
      ${ks.wrong.length ? `<div class="ks-wrong">错题已存入复习本</div>` : '<div class="ks-wrong ok">全部正确，太厉害啦！</div>'}
      <button class="mini-btn primary" onclick="startKousuan()">🔄 再来一组</button></div>`;
    return;
  }
  const q = ks.list[ks.idx];
  area.innerHTML = `
    <div class="ks-qbar"><span>第 ${ks.idx + 1} 题 / ${ks.list.length}</span><span class="ks-method-tag">${q.method}</span></div>
    <div class="ks-question">${q.a} ${q.op} ${q.b} = <input id="ks-ans" type="number" inputmode="numeric" autofocus></div>
    <button class="mini-btn primary" onclick="submitKousuan()">✓ 提交</button>
    <button class="mini-btn" onclick="showKousuanTip()">💡 方法提示</button>
    <div id="ks-feedback"></div>`;
  const inp = document.getElementById('ks-ans');
  if (inp) { inp.focus(); inp.addEventListener('keydown', e => { if (e.key === 'Enter') submitKousuan(); }); }
}
function submitKousuan() {
  const q = ks.list[ks.idx];
  const inp = document.getElementById('ks-ans');
  const v = parseInt(inp && inp.value, 10);
  const fb = document.getElementById('ks-feedback');
  if (isNaN(v)) { fb.innerHTML = '<div class="fb wrong">先填上答案哦～</div>'; return; }
  if (v === q.ans) { ks.right++; fb.innerHTML = `<div class="fb right">✅ 答对啦！${q.explain}</div>`; }
  else {
    ks.wrong.push(q);
    state.mistakes.unshift({ date: todayStr(), subject: '口算', q: `${q.a} ${q.op} ${q.b}`, your: v, right: q.ans });
    saveState(); renderMistakes();
    fb.innerHTML = `<div class="fb wrong">❌ 正确答案：${q.ans}<br>💡 ${q.explain}</div>`;
  }
  ks.idx++;
  setTimeout(renderKousuan, 1200);
}
function showKousuanTip() { const q = ks.list[ks.idx]; document.getElementById('ks-feedback').innerHTML = `<div class="fb tip">💡 ${q.explain}</div>`; }
function genShuganQ() {
  const q = genShugan(); window._sgQ = q;
  document.getElementById('sg-area').innerHTML = `
    <div class="quiz-q">${q.q}</div><input id="sg-ans" placeholder="填答案" autofocus>
    <button class="mini-btn primary" onclick="submitShugan()">✓ 提交</button><div id="sg-fb"></div>`;
}
function submitShugan() {
  const v = document.getElementById('sg-ans').value.trim();
  const fb = document.getElementById('sg-fb');
  if (String(v) === String(window._sgQ.ans)) fb.innerHTML = '<div class="fb right">✅ 答对啦！</div>';
  else fb.innerHTML = `<div class="fb wrong">❌ 正确答案：${window._sgQ.ans}。💡 ${window._sgQ.explain}</div>`;
}
function genSiweiQ() {
  const q = genSiwei(); window._swQ = q;
  document.getElementById('sw-area').innerHTML = `
    <div class="quiz-q">${q.q}</div><input id="sw-ans" placeholder="填答案" autofocus>
    <button class="mini-btn primary" onclick="submitSiwei()">✓ 提交</button><div id="sw-fb"></div>`;
}
function submitSiwei() {
  const v = document.getElementById('sw-ans').value.trim();
  const fb = document.getElementById('sw-fb');
  const q = window._swQ;
  if (String(v) === String(q.ans)) fb.innerHTML = `<div class="fb right">✅ 答对啦！${q.explain}</div>`;
  else {
    state.mistakes.unshift({ date: todayStr(), subject: '思维', q: q.q, your: v || '未作答', right: q.ans });
    saveState(); renderMistakes();
    fb.innerHTML = `<div class="fb wrong">❌ 正确答案：${q.ans}。💡 ${q.explain}</div>`;
  }
}
/* 钟表认识 */
function genClockQ() {
  const hour = 1 + Math.floor(Math.random() * 12);
  const mins = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
  const ans = `${hour}点${mins === 0 ? '整' : (mins === 15 ? '一刻' : (mins === 45 ? '三刻' : '半'))}`;
  const opts = new Set([ans]);
  const all = [];
  for (let h = 1; h <= 12; h++) for (const m of [0, 15, 30, 45]) all.push(`${h}点${m === 0 ? '整' : (m === 15 ? '一刻' : (m === 45 ? '三刻' : '半'))}`);
  while (opts.size < 4) opts.add(all[Math.floor(Math.random() * all.length)]);
  const options = [...opts].sort(() => Math.random() - 0.5);
  window._clockQ = { ans, options };
  const area = document.getElementById('clock-area');
  area.innerHTML = `
    <canvas id="clock-canvas" width="220" height="220" style="display:block;margin:0 auto"></canvas>
    <div class="quiz-q" style="text-align:center;margin-top:8px">钟面上是几点？</div>
    <div class="py-options">${options.map(o => `<button class="py-opt" onclick="clockAns('${esc(o)}', this)">${o}</button>`).join('')}</div>
    <div id="clock-fb"></div>`;
  drawClock(document.getElementById('clock-canvas'), hour, mins);
}
function drawClock(cv, hour, minute) {
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const s = cv.width / 2;
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.beginPath(); ctx.arc(s, s, s - 4, 0, Math.PI * 2); ctx.fillStyle = '#fffbea'; ctx.fill(); ctx.strokeStyle = '#ff9f45'; ctx.lineWidth = 4; ctx.stroke();
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; ctx.beginPath(); ctx.moveTo(s + (s - 14) * Math.cos(a), s + (s - 14) * Math.sin(a)); ctx.lineTo(s + (s - 5) * Math.cos(a), s + (s - 5) * Math.sin(a)); ctx.strokeStyle = '#c9a7ff'; ctx.lineWidth = 3; ctx.stroke(); }
  ctx.fillStyle = '#4a4a5a'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 1; i <= 12; i++) { const a = i * Math.PI / 6; ctx.fillText(String(i), s + (s - 26) * Math.sin(a), s - (s - 26) * Math.cos(a)); }
  const ha = ((hour % 12) + minute / 60) * Math.PI / 6;
  ctx.beginPath(); ctx.moveTo(s, s); ctx.lineTo(s + (s - 16) * Math.sin(ha), s - (s - 16) * Math.cos(ha)); ctx.lineWidth = 6; ctx.strokeStyle = '#4d96ff'; ctx.stroke();
  const ma = minute * Math.PI / 30;
  ctx.beginPath(); ctx.moveTo(s, s); ctx.lineTo(s + (s - 8) * Math.sin(ma), s - (s - 8) * Math.cos(ma)); ctx.lineWidth = 4; ctx.strokeStyle = '#ff6b6b'; ctx.stroke();
  ctx.beginPath(); ctx.arc(s, s, 5, 0, Math.PI * 2); ctx.fillStyle = '#4a4a5a'; ctx.fill();
}
function clockAns(opt, btn) {
  const fb = document.getElementById('clock-fb');
  if (opt === window._clockQ.ans) { btn.classList.add('ok'); fb.innerHTML = '<div class="fb right">✅ 看得真准！</div>'; }
  else { btn.classList.add('bad'); fb.innerHTML = `<div class="fb wrong">❌ 正确答案：${window._clockQ.ans}</div>`; }
  document.querySelectorAll('#clock-area .py-opt').forEach(b => b.disabled = true);
}
/* 图形认知 */
function genShapeQ() {
  const types = [['🔺', '三角形', '🔵'], ['🟠', '圆形', '🔷'], ['🟦', '方形', '🔴']];
  const [sym, name, other] = types[Math.floor(Math.random() * 3)];
  const n = 3 + Math.floor(Math.random() * 5);
  const m = 2 + Math.floor(Math.random() * 3);
  const row = sym.repeat(n) + other.repeat(m);
  const cells = [...sym.repeat(n), ...other.repeat(m)]; // 按码点展开，emoji 不会被拆散
  const opts = new Set([n, n + 1, n - 1, m, n + 2]);
  const options = [...opts].sort(() => Math.random() - 0.5).slice(0, 4);
  window._shapeQ = { ans: n, options };
  document.getElementById('shape-area').innerHTML = `
    <div class="shape-row">${cells.map(c => `<span class="shape-cell">${c}</span>`).join('')}</div>
    <div class="quiz-q">数一数：图里有几个${name}？</div>
    <div class="py-options">${options.map(o => `<button class="py-opt" onclick="shapeAns(${o}, this)">${o}</button>`).join('')}</div>
    <div id="shape-fb"></div>`;
}
function shapeAns(n, btn) {
  const fb = document.getElementById('shape-fb');
  if (n === window._shapeQ.ans) { btn.classList.add('ok'); fb.innerHTML = '<div class="fb right">✅ 数得又快又准！</div>'; }
  else { btn.classList.add('bad'); fb.innerHTML = `<div class="fb wrong">❌ 正确答案：${window._shapeQ.ans}</div>`; }
  document.querySelectorAll('#shape-area .py-opt').forEach(b => b.disabled = true);
}
function renderMistakes() {
  const area = document.getElementById('mistake-area');
  if (!area) return '';
  if (!state.mistakes.length) { area.innerHTML = '<div class="empty-tip">还没有错题，继续保持！🎉</div>'; return; }
  area.innerHTML = state.mistakes.slice(0, 20).map((m, i) => `
    <div class="mistake-item"><div><b>${esc(m.q)}</b> <span class="ms-tag">${esc(m.subject)}</span><small>${m.date}</small></div>
    <div class="ms-line">你答：<span class="ms-wrong">${esc(String(m.your))}</span> → 正确：<span class="ms-right">${esc(String(m.right))}</span></div>
    <button class="mini-btn" onclick="mistakeRetry(${i})">🔁 再练</button>
    <button class="mini-btn danger" onclick="mistakeDel(${i})">🗑️</button></div>`).join('') + `<button class="mini-btn danger" onclick="mistakeClear()">🗑️ 清空</button>`;
}
function mistakeRetry(i) {
  const m = state.mistakes[i];
  const v = prompt(`再做一遍：${m.q} = ?`);
  if (v === null) return;
  if (String(parseInt(v, 10)) === String(m.right)) { state.mistakes.splice(i, 1); saveState(); renderMistakes(); confetti(); alert('✅ 答对啦！这道题毕业了！'); }
  else alert(`❌ 正确答案是 ${m.right}，明天再练哦～`);
}
function mistakeDel(i) { state.mistakes.splice(i, 1); saveState(); renderMistakes(); }
function mistakeClear() { if (confirm('确定清空所有错题吗？')) { state.mistakes = []; saveState(); renderMistakes(); } }
function mistakeReview() { renderPage('shuxue'); document.getElementById('mistake-area').scrollIntoView({ behavior: 'smooth' }); }

/* ============================================================
 * 模块六：科普（图文问答 · 兴趣启蒙）
 * ============================================================ */
let kepuIdx = null;
RENDERERS.kepu = function () {
  const page = document.getElementById('page-kepu');
  const cats = [...new Set(KEPU.map(k => k.cat))];
  const cat = cats[seedNow() % cats.length];
  const items = KEPU.filter(k => k.cat === cat);
  const item = items[Math.floor(seedNow() / cats.length) % items.length];
  kepuIdx = KEPU.indexOf(item);
  page.innerHTML = `
    ${moduleTop('🪐', '科普乐园', '天文 · 动物 · 生活 · 安全')}
    ${dayHint()}
    <div class="card">
      <div class="card-head">${item.emoji} 今日科普 <span class="sub">${item.cat}</span></div>
      <div class="kepu-q">${item.q}</div>
      <div class="py-options">${item.opts.map((o, i) => `<button class="py-opt" onclick="kepuAns(${i}, this)">${esc(o)}</button>`).join('')}</div>
      <div id="kepu-fb"></div>
      <div class="kepu-info" id="kepu-info" style="display:none">💡 ${esc(item.info)}</div>
      <div class="card-foot">答对了记得去打卡 +2🪙</div>
      <div style="margin-top:10px">${punchBtn('t-kepu', '完成今日科普打卡 +2🪙')}</div>
    </div>
    <div class="card">
      <div class="card-head">🗂️ 全部科普 <span class="sub">按分类</span></div>
      ${cats.map(c => `
        <div class="kepu-cat"><b>${catEmoji(c)} ${c}</b>
          <div class="kepu-list">${KEPU.filter(k => k.cat === c).map(k => `<span onclick="kepuShow('${esc(k.q)}')">${k.emoji} ${esc(k.q)}</span>`).join('')}</div>
        </div>`).join('')}
    </div>`;
};
function catEmoji(c) { return ({ 天文: '🪐', 动物: '🐾', 植物: '🌿', 生活: '🏠', 安全: '⚠️', 自然: '🌦️' })[c] || '📚'; }
function kepuAns(i, btn) {
  const item = KEPU[kepuIdx];
  const fb = document.getElementById('kepu-fb');
  const info = document.getElementById('kepu-info');
  if (i === item.ans) { btn.classList.add('ok'); fb.innerHTML = '<div class="fb right">✅ 答对啦，你真棒！</div>'; confetti(); }
  else { btn.classList.add('bad'); document.querySelectorAll('.kepu-q + .py-options .py-opt').forEach((b, bi) => { if (bi === item.ans) b.classList.add('ok'); }); fb.innerHTML = '<div class="fb wrong">再想一想～看下面的小知识 👇</div>'; }
  if (info) info.style.display = 'block';
  document.querySelectorAll('#page-kepu .py-opt').forEach(b => b.disabled = true);
}
function kepuShow(q) {
  const item = KEPU.find(k => k.q === q);
  if (!item) return;
  kepuIdx = KEPU.indexOf(item);
  renderPage('kepu');
  document.querySelector('.kepu-info').style.display = 'block';
  document.querySelector('.kepu-q').textContent = item.q;
}

/* ============================================================
 * 休闲模块：运动（跳绳计时 + 前庭训练，不计任务不计豆）
 * ============================================================ */
let jumpTimer = null, jumpSec = 0, jumpCount = 0, jumpRunning = false;
RENDERERS.yundong = function () {
  const page = document.getElementById('page-yundong');
  const vests = shuffleArr(VESTIBULAR, seedNow() + 999).slice(0, 3);
  page.innerHTML = `
    ${moduleTop('🏃', '运动时间', '跳绳 · 前庭训练（自由活动）')}
    <div class="card">
      <div class="card-head">🪢 跳绳 10 分钟</div>
      <div class="jump-box">
        <div class="jump-time" id="jump-time">${fmtTime(jumpSec)}</div>
        <div class="jump-num">跳了 <b id="jump-count">${jumpCount}</b> 下</div>
        <div class="jump-btns">
          <button class="mini-btn primary" onclick="jumpToggle()" id="jump-btn">${jumpRunning ? '⏸️ 暂停' : '▶️ 开始'}</button>
          <button class="mini-btn" onclick="jumpPlus()">➕ 数一下</button>
          <button class="mini-btn" onclick="jumpReset()">🔄 重置</button>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-head">🌀 前庭训练 <span class="sub">10 分钟</span> <button class="mini-btn" onclick="vestRefresh()">🔄 换一组</button></div>
      ${vests.map(v => `
        <div class="vest-item">
          <div class="vest-title">${v.t} <span class="vest-min">约 ${v.min} 分钟</span></div>
          <div class="vest-how">👉 ${v.how}</div>
          <div class="vest-safe">⚠️ ${v.safe}</div>
        </div>`).join('')}
    </div>`;
};
function fmtTime(s) { return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }
function jumpToggle() {
  const btn = document.getElementById('jump-btn');
  if (jumpRunning) { clearInterval(jumpTimer); jumpRunning = false; if (btn) btn.textContent = '▶️ 继续'; }
  else {
    jumpRunning = true; if (btn) btn.textContent = '⏸️ 暂停';
    jumpTimer = setInterval(() => {
      jumpSec++;
      const t = document.getElementById('jump-time');
      if (t) t.textContent = fmtTime(jumpSec);
      if (jumpSec === 600) { clearInterval(jumpTimer); jumpRunning = false; confetti(); alert('🎉 10 分钟到啦！坚持就是胜利！'); }
    }, 1000);
  }
}
function jumpPlus() { jumpCount++; const c = document.getElementById('jump-count'); if (c) { c.textContent = jumpCount; pop(c); } }
function jumpReset() { clearInterval(jumpTimer); jumpRunning = false; jumpSec = 0; jumpCount = 0; const t = document.getElementById('jump-time'); if (t) t.textContent = '00:00'; const c = document.getElementById('jump-count'); if (c) c.textContent = '0'; const b = document.getElementById('jump-btn'); if (b) b.textContent = '▶️ 开始'; }
function vestRefresh() { state.dayOffset++; saveState(); renderPage('yundong'); }
