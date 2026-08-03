/* ============================================================
 * 游戏：拼音文字对对碰闯关 + 英语水果抓大鹅
 * ============================================================ */

/* ---------- 游戏大厅 ---------- */
RENDERERS.youxi = function () {
  const page = document.getElementById('page-youxi');
  const pyLevel = Store.get('yx_py_level', 1);
  const pyStars = Store.get('yx_py_stars', 0);
  const goLevel = Store.get('yx_go_level', 1);
  page.innerHTML = `
    <div class="page-title">🎮 闯关游戏</div>
    <div class="game-grid">
      <div class="game-card gc-py" onclick="startPinyinGame()">
        <span class="gc-emoji">🔤</span>
        <b>拼音文字对对碰</b>
        <small>汉字认拼音 · 闯关赢星星</small>
        <div class="gc-progress">⭐ ${pyStars} 颗星 · 当前第 ${pyLevel} 关</div>
      </div>
      <div class="game-card gc-go" onclick="startGooseGame()">
        <span class="gc-emoji">🦢</span>
        <b>抓大鹅 · 水果单词</b>
        <small>水果 emoji 配对英文单词</small>
        <div class="gc-progress">🐣 当前第 ${goLevel} 关</div>
      </div>
    </div>
    <div class="card">
      <div class="card-head">💡 玩中学</div>
      <div class="card-foot">玩完闯关，记得去首页完成今日「拼音」或「英语」打卡，还能赚学习豆 🪙</div>
    </div>`;
};

/* ================= 拼音对对碰 ================= */
let pyGame = null;
function startPinyinGame() {
  const level = Store.get('yx_py_level', 1);
  pyGame = { level, quiz: genPinyinQuiz(5, seedNow() + level * 31), idx: 0, right: 0, combo: 0, maxCombo: 0, stars: 0 };
  showPinyinGame();
}
function showPinyinGame() {
  const page = document.getElementById('page-youxi');
  page.innerHTML = `
    <div class="game-top">
      <button class="mini-btn" onclick="RENDERERS.youxi()">🏠 返回大厅</button>
      <div class="game-title">🔤 拼音对对碰 · 第 ${pyGame.level} 关</div>
      <button class="mini-btn" onclick="startPinyinGame()">🔄 重来</button>
    </div>
    <div id="py-area"></div>`;
  renderPinyinQ();
}
function renderPinyinQ() {
  const area = document.getElementById('py-area');
  if (pyGame.idx >= pyGame.quiz.length) {
    const pass = pyGame.right >= 4;
    let stars = 0;
    if (pyGame.right >= 5) stars = 3; else if (pyGame.right === 4) stars = 2; else if (pyGame.right === 3) stars = 1;
    pyGame.stars = stars;
    if (stars) { Store.set('yx_py_stars', (Store.get('yx_py_stars', 0) || 0) + stars); }
    area.innerHTML = `
      <div class="py-result ${pass ? 'win' : ''}">
        <div class="py-score">${pass ? '🎉 过关啦！' : '💪 差一点点'}</div>
        <div class="py-stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
        <div class="py-detail">答对 ${pyGame.right} / ${pyGame.quiz.length} 题 · 最高连击 ${pyGame.maxCombo} 次</div>
        <div class="py-btns">
          <button class="mini-btn primary" onclick="pyGame.level++; startPinyinGame()">${pass ? '🚀 下一关' : '🔁 再试一次'}</button>
          <button class="mini-btn" onclick="RENDERERS.youxi()">🏠 返回大厅</button>
        </div>
      </div>`;
    if (pass) { confetti(); Store.set('yx_py_level', pyGame.level + 1); }
    return;
  }
  const q = pyGame.quiz[pyGame.idx];
  const isChar = q.mode === 'char2pinyin';
  area.innerHTML = `
    <div class="py-progress">第 ${pyGame.idx + 1} / ${pyGame.quiz.length} 题 · 连击 <b id="py-combo">${pyGame.combo}</b> 🔥</div>
    <div class="py-question">
      <div class="py-big">${isChar ? q.char : q.answer}</div>
      <div class="py-hint">${isChar ? `读读这个字（${esc(q.word)}），选正确的拼音` : '看看这个拼音，选出正确的汉字'}</div>
    </div>
    <div class="py-options">${q.options.map(o => `
      <button class="py-opt" onclick="pyAnswer('${esc(o)}', this)">${isChar ? esc(o) : esc(o)}</button>`).join('')}
    </div>
    <div id="py-fb"></div>`;
}
function pyAnswer(opt, btn) {
  const q = pyGame.quiz[pyGame.idx];
  const fb = document.getElementById('py-fb');
  if (opt === q.answer) {
    pyGame.right++; pyGame.combo++; pyGame.maxCombo = Math.max(pyGame.maxCombo, pyGame.combo);
    btn.classList.add('ok'); pop(btn);
    fb.innerHTML = `<div class="fb right">✅ 答对啦！${q.mode === 'char2pinyin' ? q.char + ' 读 ' + q.answer : q.answer + ' 是「' + q.char + '」'}</div>`;
  } else {
    pyGame.combo = 0;
    btn.classList.add('bad');
    document.querySelectorAll('.py-opt').forEach(b => { if (b.textContent === q.answer) b.classList.add('ok'); });
    fb.innerHTML = `<div class="fb wrong">❌ 正确答案：${q.answer}（${q.char}）</div>`;
  }
  document.querySelectorAll('.py-opt').forEach(b => b.disabled = true);
  document.getElementById('py-combo').textContent = pyGame.combo;
  pyGame.idx++;
  setTimeout(renderPinyinQ, 1100);
}

/* ================= 抓大鹅（水果单词配对） ================= */
let goGame = null, goTimer = null;
function startGooseGame() {
  const level = Store.get('yx_go_level', 1);
  const pairs = level === 1 ? 6 : (level === 2 ? 8 : 10);
  const fruits = shuffleArr(FRUITS, seedNow() + level * 17).slice(0, pairs);
  const cells = [];
  fruits.forEach(f => { cells.push({ kind: 'e', fruit: f }); cells.push({ kind: 'w', fruit: f }); });
  // 打乱格子
  for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
  goGame = { level, pairs, cells, matched: 0, time: 90, score: 0, sel: null, wrong: 0 };
  clearInterval(goTimer);
  showGooseGame();
  goTimer = setInterval(() => {
    goGame.time--;
    const t = document.getElementById('go-time');
    if (t) t.textContent = goGame.time;
    if (goGame.time <= 0) {
      clearInterval(goTimer);
      alert('⏰ 时间到啦！再试一次吧！');
      startGooseGame();
    }
  }, 1000);
}
function showGooseGame() {
  const page = document.getElementById('page-youxi');
  page.innerHTML = `
    <div class="game-top">
      <button class="mini-btn" onclick="clearInterval(goTimer); RENDERERS.youxi()">🏠 返回大厅</button>
      <div class="game-title">🦢 抓大鹅 · 第 ${goGame.level} 关</div>
      <button class="mini-btn" onclick="clearInterval(goTimer); startGooseGame()">🔄 重来</button>
    </div>
    <div class="go-hud">
      <span>⏰ <b id="go-time">${goGame.time}</b>秒</span>
      <span>🧩 <b id="go-matched">${goGame.matched}</b>/${goGame.pairs}</span>
      <span>⭐ <b id="go-score">${goGame.score}</b></span>
    </div>
    <div id="go-area">
      <div class="go-grid cols-${goGame.level === 1 ? 4 : (goGame.level === 2 ? 4 : 5)}">
        ${goGame.cells.map((c, i) => `
          <div class="go-cell ${c.kind}" data-i="${i}" onclick="goPick(${i}, this)">
            ${c.kind === 'e' ? c.fruit.emoji : `<span class="go-word">${c.fruit.e}</span>`}
          </div>`).join('')}
      </div>
      <div class="go-tip">先点一个水果 emoji，再点它的英文单词，配对消除！点错会扣时间哦 ⚠️</div>
    </div>`;
}
function goPick(i, cellEl) {
  if (!goGame) return;
  const c = goGame.cells[i];
  if (!c || c.matched) return;
  const sel = goGame.sel;
  if (sel === null) {
    goGame.sel = i;
    cellEl.classList.add('picked');
    return;
  }
  if (sel === i) { goGame.sel = null; cellEl.classList.remove('picked'); return; }
  const first = goGame.cells[sel];
  const firstEl = document.querySelector(`.go-cell[data-i="${sel}"]`);
  if ((first.kind !== c.kind) && first.fruit.e === c.fruit.e) {
    // 配对成功
    first.matched = true; c.matched = true;
    goGame.matched++; goGame.score += 10;
    firstEl.classList.add('gone'); cellEl.classList.add('gone');
    firstEl.classList.remove('picked');
    document.getElementById('go-matched').textContent = goGame.matched;
    document.getElementById('go-score').textContent = goGame.score;
    playTone(660, 0.15);
    if (goGame.matched === goGame.pairs) {
      clearInterval(goTimer);
      confetti(); playTone(880, 0.3);
      const level = goGame.level;
      setTimeout(() => {
        const area = document.getElementById('go-area');
        area.innerHTML = `<div class="py-result win"><div class="py-score">🎉 全抓到了！</div>
          <div class="py-detail">第 ${level} 关通过 · 得分 ${goGame.score}</div>
          <div class="py-btns"><button class="mini-btn primary" onclick="Store.set('yx_go_level', ${level + 1}); clearInterval(goTimer); startGooseGame()">🚀 下一关</button>
          <button class="mini-btn" onclick="RENDERERS.youxi()">🏠 返回</button></div></div>`;
      }, 400);
    }
  } else {
    // 配错
    goGame.wrong++; goGame.score = Math.max(0, goGame.score - 2);
    goGame.time = Math.max(5, goGame.time - 5);
    firstEl.classList.add('shake'); cellEl.classList.add('shake');
    firstEl.classList.remove('picked');
    playTone(220, 0.2);
    setTimeout(() => { firstEl.classList.remove('shake'); cellEl.classList.remove('shake'); }, 400);
  }
  goGame.sel = null;
}
function playTone(freq, dur) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = freq; o.type = 'triangle';
    g.gain.setValueAtTime(0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.start(); o.stop(ctx.currentTime + dur);
  } catch (e) {}
}
