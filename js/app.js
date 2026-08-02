/* ============================================================
 * 页面渲染：首页 / 语文 / 数学 / 英语 / 运动
 * ============================================================ */

function nextDay() { state.dayOffset++; saveState(); renderPage(currentPage); renderHeader(); pop(document.querySelector('.nav-item.active')); }
function dayHint() { return `<div class="day-hint">📅 今日内容 · 每日自动更新 <button class="mini-btn" onclick="nextDay()">🔄 换一组</button></div>`; }

/* ---------- 首页 ---------- */
RENDERERS.home = function () {
  const page = document.getElementById('page-home');
  const hour = new Date().getHours();
  const greet = hour < 6 ? '夜深啦 🌙' : hour < 9 ? '早上好 ☀️' : hour < 12 ? '上午好 🌈' : hour < 14 ? '中午好 🍚' : hour < 18 ? '下午好 🍃' : '晚上好 🌙';
  const t = allTasks();
  const done = t.filter(x => taskDone(x.id));
  page.innerHTML = `
    <div class="page-title">${greet}，小小学习家！</div>
    ${Store.get('yx_install_hidden', false) ? '' : `
    <div class="card install-card">
      <div class="install-head">📱 把它放到手机桌面，像 App 一样用</div>
      <div class="install-steps">
        <span>① 点浏览器菜单</span><span>② 选「添加到主屏幕」</span><span>③ 桌面出现小图标，点开即用</span>
      </div>
      <button class="mini-btn" onclick="Store.set('yx_install_hidden', true); renderPage('home')">我知道了，收起来</button>
    </div>`}
    <div class="today-card">
      <div class="today-card-head">
        <span>📋 今日任务打卡</span>
        <span class="today-progress">完成 ${done.length}/${t.length}</span>
      </div>
      <div class="task-list">${t.map(x => `
        <div class="task-item ${taskDone(x.id) ? 'done' : ''}" onclick="toggleTask('${x.id}')">
          <span class="task-check">${taskDone(x.id) ? '✅' : '⬜'}</span>
          <span class="task-icon">${x.icon}</span>
          <span class="task-name">${esc(x.name)}${x.minutes ? `<em>${x.minutes}分钟</em>` : ''}</span>
          <span class="task-group">${esc(x.group || '')}</span>
        </div>`).join('')}
      </div>
      <div class="today-tip">${allDone() ? '🎉 全部完成！积分 +1 ⭐' : '💡 完成全部任务可得 1 积分，攒积分换奖励哦！'}</div>
    </div>
    <div class="quick-grid">
      <div class="quick-card qc-yuwen" onclick="nav('yuwen')"><span class="qc-icon">📖</span><b>语文</b><small>古诗·成语·识字</small></div>
      <div class="quick-card qc-shuxue" onclick="nav('shuxue')"><span class="qc-icon">🔢</span><b>数学</b><small>口算·数感·思维</small></div>
      <div class="quick-card qc-yingyu" onclick="nav('yingyu')"><span class="qc-icon">🗣️</span><b>英语</b><small>跟读·单词</small></div>
      <div class="quick-card qc-yundong" onclick="nav('yundong')"><span class="qc-icon">🏃</span><b>运动</b><small>跳绳·前庭训练</small></div>
    </div>
    <div class="quick-grid">
      <div class="quick-card qc-youxi" onclick="nav('youxi')"><span class="qc-icon">🎮</span><b>闯关游戏</b><small>拼音·抓大鹅</small></div>
      <div class="quick-card qc-jiangli" onclick="nav('jiangli')"><span class="qc-icon">⭐</span><b>奖励柜</b><small>积分 ${state.points}</small></div>
    </div>`;
};

/* ---------- 语文 ---------- */
RENDERERS.yuwen = function () {
  const page = document.getElementById('page-yuwen');
  const seed = seedNow();
  const g = GUSHI[Math.floor(seed) % GUSHI.length];
  const cy = CHENGYU[Math.floor(seed * 7 + 3) % CHENGYU.length];
  const hanzis = blockByDay(HANZI, 5, seed);
  const hb = HUIBEN[Math.floor(seed * 13 + 5) % HUIBEN.length];
  const practice = genPinyinPractice(seed + 100);
  page.innerHTML = `
    <div class="page-title">📖 语文学习 <span class="sub">每天 30 分钟</span></div>
    ${dayHint()}
    <div class="card gushi-card">
      <div class="card-head">🏮 每日背诵一首古诗 <button class="mini-btn" onclick="speak('${esc(g.l.join('，'))}', 'zh-CN')">🔊 朗读</button></div>
      <div class="gushi-title">《${g.t}》 <span class="gushi-author">${g.d} · ${g.a}</span></div>
      <div class="gushi-lines">${g.l.map(x => `<div>${x}</div>`).join('')}</div>
      <div class="card-foot">背给爸爸妈妈听，会背了就点任务打卡 ✅</div>
    </div>
    <div class="card">
      <div class="card-head">🦁 成语故事 <button class="mini-btn" onclick="speak('${esc(cy.c)}', 'zh-CN')">🔊 朗读</button></div>
      <div class="cy-name">${cy.c} <span class="cy-py">${cy.py}</span></div>
      <div class="cy-meaning">💬 ${cy.m}</div>
      <div class="cy-story">📖 ${cy.s}</div>
    </div>
    <div class="card">
      <div class="card-head">✏️ 今日认识 5 个新字</div>
      <div class="hanzi-grid">${hanzis.map(h => `
        <div class="hanzi-cell" onclick="speak('${h.c}', 'zh-CN')">
          <div class="hz-char">${h.c}</div>
          <div class="hz-py">${h.py}</div>
          <div class="hz-word">${esc(h.w)}</div>
        </div>`).join('')}
      </div>
      <div class="card-foot">点每个字听发音，跟着读 3 遍，再写 3 遍 ✍️</div>
    </div>
    <div class="card">
      <div class="card-head">🖍️ 控笔训练 <span class="sub">描一描 + 写一写</span></div>
      <div class="kongbi-tools">
        <a class="mini-btn" href="${esc(Store.get('yx_kongbi_url', '')) || 'javascript:void(0)'}" target="_blank" ${Store.get('yx_kongbi_url', '') ? '' : 'onclick="kongbiSetUrl()"'}>🎬 打开跟练视频</a>
        <button class="mini-btn" onclick="window.print()">🖨️ 打印练习纸</button>
      </div>
      <div id="print-area" class="kongbi-sheet">
        ${kongbiSVG()}
      </div>
      <div class="kongbi-write">
        <div class="card-foot">📝 写字本：把这 5 个新字写在田字格里</div>
        <div class="tianzi">${hanzis.map(h => `<div class="tz-cell"><b>${h.c}</b></div>`).join('')}</div>
      </div>
    </div>
    <div class="card">
      <div class="card-head">🔤 拼音拼读练习 <button class="mini-btn" onclick="nav('youxi')">🎮 去闯关</button></div>
      <div class="pinyin-today">${practice.map(p => `
        <div class="py-item"><b>${p.syllable}</b><small>声母 ${p.sm}（${p.smName}）· 韵母 ${p.ym}（${p.ymName}）· ${p.tone}声</small></div>`).join('')}
      </div>
      <div class="card-foot">大声拼读：${practice[0].sm} + ${practice[0].ym} = ${practice[0].syllable}${practice[0].char ? `（${practice[0].char}）` : '…'}</div>
    </div>
    <div class="card">
      <div class="card-head">📚 今日绘本推荐</div>
      <div class="huiben-row">
        <span class="hb-icon">📖</span>
        <div><b>《${hb.t}》</b><span class="hb-author">${esc(hb.a)}</span>
        <div class="hb-tag">${esc(hb.tag)}</div></div>
      </div>
      <div class="card-foot">和爸爸妈妈一起读 20 分钟，读完说一说最喜欢哪一页 💕</div>
    </div>`;
};

function kongbiSVG() {
  const boxes = [
    ['横线', '<line x1="10" y1="30" x2="190" y2="30"/><line x1="10" y1="50" x2="190" y2="50"/><line x1="10" y1="70" x2="190" y2="70"/><line x1="10" y1="90" x2="190" y2="90"/>'],
    ['竖线', '<line x1="40" y1="10" x2="40" y2="110"/><line x1="70" y1="10" x2="70" y2="110"/><line x1="100" y1="10" x2="100" y2="110"/><line x1="130" y1="10" x2="130" y2="110"/><line x1="160" y1="10" x2="160" y2="110"/>'],
    ['斜线', '<line x1="10" y1="110" x2="110" y2="10"/><line x1="60" y1="110" x2="160" y2="10"/><line x1="110" y1="110" x2="190" y2="30"/>'],
    ['波浪', '<path d="M10 60 Q 35 20 60 60 T 110 60 T 160 60 T 190 60" fill="none"/><path d="M10 85 Q 35 45 60 85 T 110 85 T 160 85 T 190 85" fill="none"/>'],
    ['螺旋', '<path d="M100 60 m0 0 a10 10 0 1 1 -10 10 a20 20 0 1 1 20 -20 a30 30 0 1 1 -30 30 a40 40 0 1 1 40 -40" fill="none"/>'],
    ['圆圈', '<circle cx="100" cy="60" r="45" fill="none"/><circle cx="100" cy="60" r="25" fill="none"/>'],
    ['三角', '<path d="M100 15 L150 105 L50 105 Z" fill="none"/><path d="M100 40 L130 95 L70 95 Z" fill="none"/>'],
    ['方框', '<rect x="55" y="15" width="90" height="90" fill="none"/><rect x="75" y="35" width="50" height="50" fill="none"/>']
  ];
  return `<div class="kb-grid">${boxes.map(([t, shapes]) => `
    <div class="kb-box"><div class="kb-title">${t}</div>
      <svg viewBox="0 0 200 120" preserveAspectRatio="none">${shapes}</svg>
    </div>`).join('')}</div>`;
}
function kongbiSetUrl() {
  const v = prompt('粘贴抖音控笔跟练视频链接（也可以粘贴任意教学视频链接）：');
  if (v) { Store.set('yx_kongbi_url', v); alert('已保存 ✅ 重新打开页面即可跟练'); }
}

/* ---------- 数学 ---------- */
let ks = null; // 口算会话
RENDERERS.shuxue = function () {
  const page = document.getElementById('page-shuxue');
  const cfg = state.kousuanCfg;
  page.innerHTML = `
    <div class="page-title">🔢 数学乐园 <span class="sub">每天 30 分钟</span></div>
    <div class="card">
      <div class="card-head">🧮 口算练习 <span class="sub">20 以内 · 含凑十破十</span></div>
      <div class="cfg-row">
        <label>题数：<select id="ks-count">
          ${[10, 20, 30, 50].map(n => `<option value="${n}" ${cfg.count === n ? 'selected' : ''}>${n}题</option>`).join('')}
        </select></label>
        <label>题型：<select id="ks-method">
          ${['随机', '凑十法', '破十法', '直接算'].map(m => `<option ${cfg.method === m ? 'selected' : ''}>${m}</option>`).join('')}
        </select></label>
        <button class="mini-btn primary" onclick="startKousuan()">🚀 开始</button>
      </div>
      <div id="ks-area" class="ks-area">
        <div class="empty-tip">点「开始」出题，做完自动判分，错题会进错题复习本 📒</div>
      </div>
    </div>
    <div class="card">
      <div class="card-head">🌌 数感星球 <button class="mini-btn" onclick="genShuganQ()">🎲 出新题</button></div>
      <div id="sg-area"><div class="empty-tip">点「出新题」开始数感小练习（比大小·分成·相邻数·单双数）</div></div>
    </div>
    <div class="card">
      <div class="card-head">🧠 思维训练 <button class="mini-btn" onclick="genSiweiQ()">🎲 出新题</button></div>
      <div id="sw-area"><div class="empty-tip">找规律·比轻重·排队问题…动动小脑筋！</div></div>
    </div>
    <div class="card">
      <div class="card-head">📒 错题复习本 <span class="badge">${state.mistakes.length}</span> <button class="mini-btn" onclick="mistakeReview()">🔁 错题重练</button></div>
      <div id="mistake-area">${renderMistakes()}</div>
    </div>`;
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
      <div class="ks-result">
        <div class="ks-score">${ks.wrong.length === 0 ? '🏆' : '💪'} 完成！答对 ${ks.right}/${ks.list.length}</div>
        ${ks.wrong.length ? `<div class="ks-wrong">错题已存入复习本：${ks.wrong.map(w => `${w.a} ${w.op} ${w.b}`).join('，')}</div>` : '<div class="ks-wrong ok">全部正确，太厉害啦！</div>'}
        <button class="mini-btn primary" onclick="startKousuan()">🔄 再来一组</button>
      </div>`;
    return;
  }
  const q = ks.list[ks.idx];
  area.innerHTML = `
    <div class="ks-qbar"><span>第 ${ks.idx + 1} 题 / 共 ${ks.list.length} 题</span><span class="ks-method-tag">${q.method}</span></div>
    <div class="ks-question">${q.a} ${q.op} ${q.b} = <input id="ks-ans" type="number" inputmode="numeric" autofocus></div>
    <button class="mini-btn primary" onclick="submitKousuan()">✓ 提交</button>
    <button class="mini-btn" onclick="showKousuanTip()">💡 看方法提示</button>
    <div id="ks-feedback"></div>`;
  const inp = document.getElementById('ks-ans');
  inp.focus();
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') submitKousuan(); });
}
function submitKousuan() {
  const q = ks.list[ks.idx];
  const inp = document.getElementById('ks-ans');
  const v = parseInt(inp.value, 10);
  const fb = document.getElementById('ks-feedback');
  if (isNaN(v)) { fb.innerHTML = '<div class="fb wrong">先填上答案哦～</div>'; return; }
  if (v === q.ans) {
    ks.right++; fb.innerHTML = `<div class="fb right">✅ 答对啦！${q.explain}</div>`;
  } else {
    ks.wrong.push(q);
    state.mistakes.unshift({ date: todayStr(), subject: '口算', q: `${q.a} ${q.op} ${q.b}`, your: v, right: q.ans, method: q.method });
    saveState();
    fb.innerHTML = `<div class="fb wrong">❌ 答错啦～ 正确答案是 ${q.ans}。<br>💡 ${q.explain}</div>`;
    renderMistakes();
  }
  ks.idx++;
  setTimeout(renderKousuan, 1200);
}
function showKousuanTip() {
  const q = ks.list[ks.idx];
  document.getElementById('ks-feedback').innerHTML = `<div class="fb tip">💡 ${q.explain}</div>`;
}

function genShuganQ() {
  const area = document.getElementById('sg-area');
  const q = genShugan();
  window._sgQ = q;
  area.innerHTML = `
    <div class="quiz-q">${q.q}</div>
    <input id="sg-ans" placeholder="填写答案" autofocus>
    <button class="mini-btn primary" onclick="submitShugan(this)">✓ 提交</button>
    <div id="sg-fb"></div>`;
}
function submitShugan(btn) {
  const v = document.getElementById('sg-ans').value.trim();
  const fb = document.getElementById('sg-fb');
  // 找当前题：从按钮 DOM 找。简单起见用全局变量
  if (window._sgQ && (v === String(window._sgQ.ans))) {
    fb.innerHTML = `<div class="fb right">✅ 答对啦！</div>`;
  } else {
    fb.innerHTML = `<div class="fb wrong">❌ 正确答案：${window._sgQ.ans}。💡 ${window._sgQ.explain}</div>`;
  }
}
function genSiweiQ() {
  const area = document.getElementById('sw-area');
  const q = genSiwei();
  window._swQ = q;
  area.innerHTML = `
    <div class="quiz-q">${q.q}</div>
    <input id="sw-ans" placeholder="填写答案" autofocus>
    <button class="mini-btn primary" onclick="submitSiwei()">✓ 提交</button>
    <div id="sw-fb"></div>`;
}
function submitSiwei() {
  const v = document.getElementById('sw-ans').value.trim();
  const fb = document.getElementById('sw-fb');
  const q = window._swQ;
  if (String(v) === String(q.ans)) fb.innerHTML = `<div class="fb right">✅ 答对啦！${q.explain}</div>`;
  else {
    state.mistakes.unshift({ date: todayStr(), subject: '思维', q: q.q, your: v || '未作答', right: q.ans, method: '' });
    saveState(); renderMistakes();
    fb.innerHTML = `<div class="fb wrong">❌ 正确答案：${q.ans}。💡 ${q.explain}</div>`;
  }
}
function renderMistakes() {
  const area = document.getElementById('mistake-area');
  if (!area) return '';
  if (!state.mistakes.length) { area.innerHTML = '<div class="empty-tip">还没有错题，继续保持！🎉</div>'; return; }
  area.innerHTML = state.mistakes.slice(0, 20).map((m, i) => `
    <div class="mistake-item">
      <div><b>${esc(m.q)}</b> <span class="ms-tag">${esc(m.subject)}</span><small>${m.date}</small></div>
      <div class="ms-line">你答：<span class="ms-wrong">${esc(String(m.your))}</span> → 正确：<span class="ms-right">${esc(String(m.right))}</span></div>
      <button class="mini-btn" onclick="mistakeRetry(${i})">🔁 再练一遍</button>
      <button class="mini-btn danger" onclick="mistakeDel(${i})">🗑️ 删除</button>
    </div>`).join('') + `<button class="mini-btn danger" onclick="mistakeClear()">🗑️ 清空错题本</button>`;
}
function mistakeRetry(i) {
  const m = state.mistakes[i];
  const v = prompt(`再做一遍：${m.q} = ?`);
  if (v === null) return;
  if (String(parseInt(v, 10)) === String(m.right)) {
    state.mistakes.splice(i, 1); saveState(); renderMistakes();
    confetti();
    alert('✅ 答对啦！这道题从错题本毕业了！');
  } else {
    alert(`❌ 正确答案是 ${m.right}，明天再练一次哦～`);
  }
}
function mistakeDel(i) { state.mistakes.splice(i, 1); saveState(); renderMistakes(); }
function mistakeClear() { if (confirm('确定清空所有错题吗？')) { state.mistakes = []; saveState(); renderMistakes(); } }

/* ---------- 英语 ---------- */
RENDERERS.yingyu = function () {
  const page = document.getElementById('page-yingyu');
  const seed = seedNow();
  const sents = blockByDay(ENG_SENTENCES, 5, seed);
  const themeIdx = seed % ENG_WORDS.length;
  const theme = ENG_WORDS[themeIdx];
  page.innerHTML = `
    <div class="page-title">🗣️ 每日英语 <span class="sub">可读 · 可跟读</span></div>
    ${dayHint()}
    <div class="card">
      <div class="card-head">💬 今日日常短句 <span class="sub">5 句</span></div>
      <div class="sent-list">${sents.map(s => `
        <div class="sent-item">
          <div class="sent-en"><b>${esc(s.e)}</b> <button class="mini-btn" onclick="speak('${esc(s.e.replace(/'/g, "\\'"))}', 'en-US')">🔊</button></div>
          <div class="sent-cn">${esc(s.c)}</div>
        </div>`).join('')}
      </div>
      <div class="card-foot"><button class="mini-btn primary" onclick="playSentences()">🎧 连读一遍（跟读模式）</button></div>
    </div>
    <div class="card">
      <div class="card-head">🍎 今日单词 <span class="sub">主题：${theme.t} ${theme.emoji}</span></div>
      <div class="word-grid">${theme.words.map(w => `
        <div class="word-cell" onclick="speak('${esc(w.e)}', 'en-US')">
          <span class="word-emoji">${w.emoji}</span>
          <b class="word-en">${w.e}</b>
          <span class="word-py">${w.py}</span>
          <span class="word-cn">${w.c}</span>
        </div>`).join('')}
      </div>
      <div class="card-foot">点卡片听发音，跟着读 3 遍 🗣️</div>
    </div>`;
};
function playSentences() {
  const seed = seedNow();
  const sents = blockByDay(ENG_SENTENCES, 5, seed);
  let i = 0;
  function next() {
    if (i >= sents.length) return;
    speak(sents[i].e, 'en-US');
    i++;
    setTimeout(next, 2800);
  }
  next();
}

/* ---------- 运动 ---------- */
let jumpTimer = null, jumpSec = 0, jumpCount = 0, jumpRunning = false;
RENDERERS.yundong = function () {
  const page = document.getElementById('page-yundong');
  const seed = seedNow();
  const vests = shuffleArr(VESTIBULAR, seed + 999).slice(0, 3);
  page.innerHTML = `
    <div class="page-title">🏃 运动时间 <span class="sub">每天 20 分钟</span></div>
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
      <div class="card-foot">目标 10 分钟！每跳一下点「➕ 数一下」，家长也可以帮忙数哦</div>
    </div>
    <div class="card">
      <div class="card-head">🌀 前庭训练小活动 <span class="sub">10 分钟</span> <button class="mini-btn" onclick="vestRefresh()">🔄 刷新换一个</button></div>
      <div id="vest-area">${vests.map(v => `
        <div class="vest-item">
          <div class="vest-title">${v.t} <span class="vest-min">约 ${v.min} 分钟</span></div>
          <div class="vest-how">👉 ${v.how}</div>
          <div class="vest-safe">⚠️ ${v.safe}</div>
        </div>`).join('')}
      </div>
    </div>`;
};
function fmtTime(s) { return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }
function jumpToggle() {
  const btn = document.getElementById('jump-btn');
  if (jumpRunning) { clearInterval(jumpTimer); jumpRunning = false; btn.textContent = '▶️ 继续'; }
  else {
    jumpRunning = true; btn.textContent = '⏸️ 暂停';
    jumpTimer = setInterval(() => { jumpSec++; document.getElementById('jump-time').textContent = fmtTime(jumpSec); if (jumpSec === 600) { clearInterval(jumpTimer); jumpRunning = false; confetti(); alert('🎉 10 分钟到啦！坚持就是胜利！'); } }, 1000);
  }
}
function jumpPlus() { jumpCount++; document.getElementById('jump-count').textContent = jumpCount; pop(document.getElementById('jump-count')); }
function jumpReset() { clearInterval(jumpTimer); jumpRunning = false; jumpSec = 0; jumpCount = 0; const t = document.getElementById('jump-time'); if (t) t.textContent = '00:00'; const c = document.getElementById('jump-count'); if (c) c.textContent = '0'; const b = document.getElementById('jump-btn'); if (b) b.textContent = '▶️ 开始'; }
function vestRefresh() { state.dayOffset++; saveState(); renderPage('yundong'); }
