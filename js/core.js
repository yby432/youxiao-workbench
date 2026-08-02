/* ============================================================
 * 核心：存储 / 状态 / 工具 / 打卡积分 / 导航框架
 * ============================================================ */

const Store = {
  get(k, def) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};

/* ---------- 状态 ---------- */
const BUILTIN_TASKS = [
  { id: 't-yuwen',  name: '语文学习', icon: '📖', group: '语文', builtin: true,  minutes: 30 },
  { id: 't-shuxue', name: '数学练习', icon: '🔢', group: '数学', builtin: true,  minutes: 30 },
  { id: 't-yingyu', name: '英语跟读', icon: '🗣️', group: '英语', builtin: true,  minutes: 15 },
  { id: 't-yundong', name: '运动锻炼', icon: '🏃', group: '运动', builtin: true, minutes: 20 },
  { id: 't-youxi',  name: '益智游戏', icon: '🎮', group: '游戏', builtin: true,  minutes: 15 }
];
const DEFAULT_REWARDS = [
  { id: 'r1', name: '小零食', icon: '🍪', cost: 10 },
  { id: 'r2', name: '小玩具', icon: '🧸', cost: 20 },
  { id: 'r3', name: '儿童乐园一次', icon: '🎡', cost: 30 }
];

const state = {
  tasks: Store.get('yx_tasks', null) || BUILTIN_TASKS.map(t => ({ ...t })),
  points: Store.get('yx_points', 0),
  rewards: Store.get('yx_rewards', null) || DEFAULT_REWARDS.map(r => ({ ...r })),
  history: Store.get('yx_history', []),           // 兑换记录
  mistakes: Store.get('yx_mistakes', []),         // 错题本 [{date,subject,q,your,right}]
  log: Store.get('yx_log', {}),                   // { '2026-06-18': { 't-yuwen': true, claimed: true } }
  dayOffset: Store.get('yx_dayOffset', 0),
  kousuanCfg: Store.get('yx_kousuanCfg', { count: 20, method: '随机' })
};
function saveState() {
  Store.set('yx_tasks', state.tasks); Store.set('yx_points', state.points);
  Store.set('yx_rewards', state.rewards); Store.set('yx_history', state.history);
  Store.set('yx_mistakes', state.mistakes); Store.set('yx_log', state.log);
  Store.set('yx_dayOffset', state.dayOffset); Store.set('yx_kousuanCfg', state.kousuanCfg);
}

/* ---------- 日期 / 每日轮换 ---------- */
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function dayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000);
}
function seedNow() { return dayOfYear() + state.dayOffset; }
function rng(seed) { let s = seed || 1; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
function shuffleArr(arr, seed) {
  const a = arr.slice(); const r = rng(seed);
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
/* 按天取 n 个（环绕，保证每天不同） */
function pickByDay(arr, n, seed) {
  const shuffled = shuffleArr(arr, seed * 7919 + 13);
  const out = [];
  for (let i = 0; i < n; i++) out.push(shuffled[i % shuffled.length]);
  return out;
}
/* 每天取连续块（如汉字每天 5 个，按天平移） */
function blockByDay(arr, n, seed) {
  const start = (seed * n) % arr.length;
  const out = [];
  for (let i = 0; i < n; i++) out.push(arr[(start + i) % arr.length]);
  return out;
}

/* ---------- 朗读 ---------- */
function speak(text, lang) {
  if (!('speechSynthesis' in window)) { alert('当前浏览器不支持朗读'); return; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang || 'zh-CN';
  u.rate = 0.85; u.pitch = 1.15;
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find(v => v.lang === lang);
  if (match) u.voice = match;
  window.speechSynthesis.speak(u);
}

/* ---------- 撒花 ---------- */
function confetti() {
  const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff9f45', '#c56cf0'];
  const wrap = document.getElementById('fx-layer');
  for (let i = 0; i < 50; i++) {
    const s = document.createElement('i');
    s.className = 'confetti';
    s.style.left = Math.random() * 100 + 'vw';
    s.style.background = colors[Math.floor(Math.random() * colors.length)];
    s.style.animationDelay = (Math.random() * 0.6) + 's';
    s.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
    s.style.transform = `rotate(${Math.random() * 360}deg)`;
    wrap.appendChild(s);
    setTimeout(() => s.remove(), 3200);
  }
}
function pop(el) { if (el) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); } }

/* ---------- DOM 工具 ---------- */
function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

/* ---------- 打卡 / 积分 ---------- */
function todayLog() { if (!state.log[todayStr()]) state.log[todayStr()] = {}; return state.log[todayStr()]; }
function taskDone(id) { return !!todayLog()[id]; }
function toggleTask(id) {
  const log = todayLog();
  if (log[id]) delete log[id]; else log[id] = true;
  saveState();
  checkAllDone();
}
function allTasks() { return state.tasks.filter(t => t.visible !== false); }
function allDone() { return allTasks().length > 0 && allTasks().every(t => taskDone(t.id)); }
function doneCount() { return allTasks().filter(t => taskDone(t.id)).length; }
function checkAllDone() {
  const log = todayLog();
  if (allDone() && !log.claimed && state.tasks.length > 0) {
    log.claimed = true;
    state.points += 1;
    saveState();
    confetti();
    setTimeout(() => {
      const ok = confirm('🎉 太棒啦！今天的任务全部完成！\n奖励 1 积分 ⭐ 已经到账！\n\n点击「确定」去看看奖励柜吧～');
      if (ok) nav('jiangli');
    }, 600);
    renderHeader();
    renderHome();
  }
}

/* ---------- 导航 ---------- */
const PAGES = [
  { id: 'home', icon: '🏠', label: '今日' },
  { id: 'yuwen', icon: '📖', label: '语文' },
  { id: 'shuxue', icon: '🔢', label: '数学' },
  { id: 'yingyu', icon: '🗣️', label: '英语' },
  { id: 'yundong', icon: '🏃', label: '运动' },
  { id: 'youxi', icon: '🎮', label: '游戏' },
  { id: 'jiangli', icon: '⭐', label: '奖励' },
  { id: 'shezhi', icon: '⚙️', label: '设置' }
];
let currentPage = 'home';
function nav(id) {
  currentPage = id;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById('page-' + id);
  if (page) page.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === id));
  window.scrollTo(0, 0);
  renderPage(id);
}
const RENDERERS = {};
function renderPage(id) { if (RENDERERS[id]) RENDERERS[id](); }

/* ---------- 头部 ---------- */
function renderHeader() {
  const h = document.getElementById('header-info');
  if (!h) return;
  const d = new Date();
  const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  h.innerHTML = `
    <div class="hd-left">
      <div class="hd-date">${d.getMonth() + 1}月${d.getDate()}日 星期${week}</div>
      <div class="hd-title">✨ 幼小衔接工作台</div>
    </div>
    <div class="hd-right">
      <div class="hd-star" onclick="nav('jiangli')" title="积分奖励">
        <span class="star-icon">⭐</span><b id="points-num">${state.points}</b>
      </div>
      <div class="hd-progress" onclick="nav('home')" title="今日进度">
        <div class="hp-bar"><i style="width:${allTasks().length ? (doneCount() / allTasks().length * 100) : 0}%"></i></div>
        <span>${doneCount()}/${allTasks().length}</span>
      </div>
    </div>`;
}
