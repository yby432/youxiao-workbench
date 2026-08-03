/* ============================================================
 * 核心 v2：存储 / 状态 / 学习豆打卡体系 / 识字状态机 / 导航
 * ============================================================ */

const Store = {
  get(k, def) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};

/* ---------- 内置任务（学习豆来源） ---------- */
const BUILTIN_TASKS = [
  { id: 't-shizi',   name: '识字学习', icon: '🀄', group: '识字', builtin: true, minutes: 15, beans: 5 },
  { id: 't-pinyin',  name: '拼音学习', icon: '🔤', group: '拼音', builtin: true, minutes: 15, beans: 4 },
  { id: 't-gushi',   name: '古诗背诵', icon: '🏮', group: '古诗', builtin: true, minutes: 10, beans: 3 },
  { id: 't-yingyu',  name: '英语学习', icon: '🗣️', group: '英语', builtin: true, minutes: 10, beans: 4 },
  { id: 't-shuxue',  name: '数学闯关', icon: '🔢', group: '数学', builtin: true, minutes: 15, beans: 5 },
  { id: 't-kepu',    name: '科普阅读', icon: '🪐', group: '科普', builtin: true, minutes: 5,  beans: 2 }
];
/* 连续打卡里程碑奖励 */
const STREAK_REWARDS = { 3: 10, 7: 30, 30: 150 };
/* 补打卡费用 */
const MAKEUP_COST = 3;
/* 默认商城奖品（低/中/高三层） */
const DEFAULT_REWARDS = [
  { id: 'r1', name: '卡通田字本', icon: '📒', cost: 10,  tier: '低' },
  { id: 'r2', name: '生字卡片', icon: '🃏', cost: 12,  tier: '低' },
  { id: 'r3', name: '铅笔橡皮套装', icon: '✏️', cost: 8,   tier: '低' },
  { id: 'r4', name: '可爱贴纸', icon: '🌟', cost: 6,   tier: '低' },
  { id: 'r5', name: '拼音本', icon: '📖', cost: 15,  tier: '中' },
  { id: 'r6', name: '练字钢笔套装', icon: '🖊️', cost: 30,  tier: '中' },
  { id: 'r7', name: '口算题卡', icon: '🎯', cost: 25,  tier: '中' },
  { id: 'r8', name: '有声挂图', icon: '🗺️', cost: 40,  tier: '中' },
  { id: 'r9', name: '绘本礼盒', icon: '📚', cost: 60,  tier: '高' },
  { id: 'r10', name: '早教拼图', icon: '🧩', cost: 50,  tier: '高' },
  { id: 'r11', name: '护眼台灯', icon: '💡', cost: 80,  tier: '高' },
  { id: 'r12', name: '积木玩具', icon: '🧱', cost: 70,  tier: '高' }
];

const _savedTasks = Store.get('yx_tasks', null);
const _tasksOK = Array.isArray(_savedTasks) && _savedTasks.some(t => ['t-shizi', 't-pinyin', 't-gushi', 't-yingyu', 't-shuxue', 't-kepu'].includes(t.id));

const state = {
  tasks: _tasksOK ? _savedTasks : BUILTIN_TASKS.map(t => ({ ...t })),
  beans: Store.get('yx_beans', 0),                    // 学习豆
  rewards: Store.get('yx_rewards', null) || DEFAULT_REWARDS.map(r => ({ ...r })),
  history: Store.get('yx_history', []),               // 兑换记录 [{name,icon,cost,date,addr}]
  mistakes: Store.get('yx_mistakes', []),             // 错题本
  log: Store.get('yx_log', {}),                       // {date:{taskId:true, minutes:n}}
  dayOffset: Store.get('yx_dayOffset', 0),
  kousuanCfg: Store.get('yx_kousuanCfg', { count: 20, method: '随机' }),
  hanziStatus: Store.get('yx_hanziStatus', {}),       // {字:'new'|'learned'|'mastered'}
  weakHanzi: Store.get('yx_weakHanzi', []),           // 薄弱字
  hanziDaily: Store.get('yx_hanziDaily', {}),         // {date: {learned, mastered}}
  favGushi: Store.get('yx_favGushi', []),             // 收藏古诗标题
  madeup: Store.get('yx_madeup', []),                 // 补卡日期列表 ['2026-08-01']
  shopName: Store.get('yx_shopName', ''),              // 收货人
  shopPhone: Store.get('yx_shopPhone', ''),            // 联系电话
  shopAddr: Store.get('yx_shopAddr', ''),             // 收货地址备注
  settings: Store.get('yx_settings', { maxMin: 0, showStreak: true })
};
function saveState() {
  Store.set('yx_tasks', state.tasks); Store.set('yx_beans', state.beans);
  Store.set('yx_rewards', state.rewards); Store.set('yx_history', state.history);
  Store.set('yx_mistakes', state.mistakes); Store.set('yx_log', state.log);
  Store.set('yx_dayOffset', state.dayOffset); Store.set('yx_kousuanCfg', state.kousuanCfg);
  Store.set('yx_hanziStatus', state.hanziStatus); Store.set('yx_weakHanzi', state.weakHanzi);
  Store.set('yx_hanziDaily', state.hanziDaily); Store.set('yx_favGushi', state.favGushi);
  Store.set('yx_madeup', state.madeup); Store.set('yx_shopAddr', state.shopAddr);
  Store.set('yx_shopName', state.shopName); Store.set('yx_shopPhone', state.shopPhone);
  Store.set('yx_settings', state.settings);
}

/* ---------- 日期 / 每日轮换 ---------- */
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function dateStr(d) {
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
function pickByDay(arr, n, seed) {
  const shuffled = shuffleArr(arr, seed * 7919 + 13);
  const out = [];
  for (let i = 0; i < n; i++) out.push(shuffled[i % shuffled.length]);
  return out;
}
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

/* ---------- 撒花 / 特效 ---------- */
function confetti() {
  const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff9f45', '#c56cf0'];
  const wrap = document.getElementById('fx-layer');
  if (!wrap) return;
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

/* ============================================================
 * 打卡 / 学习豆体系
 * ============================================================ */
function allTasks() { return state.tasks.filter(t => t.visible !== false); }
function dayLog(date) { if (!state.log[date]) state.log[date] = { minutes: 0 }; return state.log[date]; }
function taskDone(id, date) { date = date || todayStr(); return !!dayLog(date)[id]; }
function doneCount(date) { date = date || todayStr(); return allTasks().filter(t => taskDone(t.id, date)).length; }
function todayMinutes() {
  let m = 0;
  const log = dayLog(todayStr());
  allTasks().forEach(t => { if (log[t.id]) m += (t.minutes || 0); });
  return m;
}
function dayStatus(date) {
  const total = allTasks().length;
  if (!total) return 'none';
  const done = allTasks().filter(t => taskDone(t.id, date)).length;
  if (state.madeup.includes(date) && done === 0) return 'madeup';
  if (done === total) return 'full';
  if (done > 0) return 'part';
  return 'none';
}
function allDone(date) { date = date || todayStr(); return allTasks().length > 0 && allTasks().every(t => taskDone(t.id, date)); }

/* 切换任务打卡：完成 +豆，取消 -豆 */
function toggleTask(id) {
  const log = dayLog(todayStr());
  const t = state.tasks.find(x => x.id === id);
  if (!t) return;
  if (log[id]) { delete log[id]; state.beans = Math.max(0, state.beans - (t.beans || 0)); }
  else {
    log[id] = true;
    log.minutes = (log.minutes || 0) + (t.minutes || 0);
    state.beans += (t.beans || 0);
    confetti();
    pop(document.querySelector('.task-item[data-id="' + id + '"]'));
    if (allDone()) checkStreak();
  }
  saveState();
  renderHeader(); renderPage(currentPage);
  if (log[id]) beanToast('+' + (t.beans || 0) + ' 🪙 ' + t.name);
}
function beanToast(msg) {
  const box = document.getElementById('bean-toast');
  if (!box) return;
  box.textContent = msg;
  box.classList.remove('show'); void box.offsetWidth; box.classList.add('show');
  setTimeout(() => box.classList.remove('show'), 1600);
}

/* 连续打卡：从今天往回数连续完成的天数（补卡也算） */
function dayCompleteForStreak(date) {
  const st = dayStatus(date);
  return st === 'full' || st === 'madeup';
}
function streakNow() {
  let n = 0;
  const d = new Date();
  // 今天如果还没完成，从昨天开始算
  let start = dayCompleteForStreak(dateStr(d)) ? 0 : 1;
  for (let i = start; ; i++) {
    const dd = new Date(d); dd.setDate(d.getDate() - i);
    if (dayCompleteForStreak(dateStr(dd))) n++; else break;
  }
  return n;
}
function checkStreak() {
  const s = streakNow();
  if (STREAK_REWARDS[s]) {
    state.beans += STREAK_REWARDS[s];
    saveState();
    confetti();
    setTimeout(() => {
      alert(`🔥 连续打卡 ${s} 天！奖励 ${STREAK_REWARDS[s]} 学习豆 🪙`);
      renderHeader(); renderPage(currentPage);
    }, 500);
  }
}
/* 补打卡：消耗豆子把某天记为完成（保连续打卡） */
function makeupDay(date) {
  if (state.madeup.includes(date)) return;
  if (state.beans < MAKEUP_COST) { alert(`🪙 学习豆不足（需要 ${MAKEUP_COST} 颗）`); return; }
  if (!confirm(`补打卡 ${date} 需要消耗 ${MAKEUP_COST} 颗学习豆，确定吗？`)) return;
  state.beans -= MAKEUP_COST;
  state.madeup.push(date);
  saveState();
  confetti();
  renderPage('daka'); renderHeader();
}

/* ---------- 识字状态机 ---------- */
function hzStatus(c) { return state.hanziStatus[c] || 'new'; }
function markHanzi(c, st) {
  state.hanziStatus[c] = st;
  // 记录每日掌握
  if (st === 'mastered') {
    const t = todayStr();
    if (!state.hanziDaily[t]) state.hanziDaily[t] = { learned: 0, mastered: 0 };
    state.hanziDaily[t].mastered++;
  }
  if (st === 'learned') {
    const t = todayStr();
    if (!state.hanziDaily[t]) state.hanziDaily[t] = { learned: 0, mastered: 0 };
    state.hanziDaily[t].learned++;
  }
  saveState(); renderPage(currentPage); renderHeader();
}
function addWeakHanzi(c) {
  if (!state.weakHanzi.includes(c)) { state.weakHanzi.push(c); saveState(); }
}
function removeWeakHanzi(c) {
  state.weakHanzi = state.weakHanzi.filter(x => x !== c); saveState();
}
/* 识字统计 */
function hanziStats() {
  let learned = 0, mastered = 0;
  HANZI.forEach(h => { const s = hzStatus(h.c); if (s === 'mastered') mastered++; if (s === 'learned' || s === 'mastered') learned++; });
  return { total: HANZI.length, learned, mastered, weak: state.weakHanzi.length };
}

/* ---------- 导航（底部 6 Tab + 12 页面） ---------- */
const NAV_TABS = [
  { id: 'home', icon: '🏠', label: '首页' },
  { id: 'renwu', icon: '📋', label: '任务' },
  { id: 'shuju', icon: '📊', label: '数据' },
  { id: 'daka', icon: '📅', label: '打卡' },
  { id: 'shangcheng', icon: '🛍️', label: '商城' },
  { id: 'jiazhang', icon: '👨‍👩‍👧', label: '家长' }
];
const ALL_PAGES = ['home','shizi','pinyin','gushi','yingyu','shuxue','kepu','yundong','renwu','daka','shuju','shangcheng','jiazhang','youxi'];
let currentPage = 'home';
function nav(id) {
  currentPage = id;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById('page-' + id);
  if (page) page.classList.add('active');
  document.querySelectorAll('.tab-item').forEach(n => n.classList.toggle('active', n.dataset.page === id));
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
  const st = dayStatus(todayStr());
  const stTxt = st === 'full' ? '✅ 已完成' : (st === 'part' ? '🟡 部分' : '⬜ 未开始');
  h.innerHTML = `
    <div class="hd-left">
      <div class="hd-date">${d.getMonth() + 1}月${d.getDate()}日 星期${week}</div>
      <div class="hd-title">✨ 幼小衔接学习工作台</div>
    </div>
    <div class="hd-right">
      <div class="hd-beans" onclick="nav('shangcheng')" title="学习豆商城">
        <span class="bean-coin">🪙</span><b id="beans-num">${state.beans}</b>
      </div>
      <div class="hd-status" onclick="nav('daka')">${stTxt}</div>
    </div>`;
}
