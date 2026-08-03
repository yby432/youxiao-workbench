/* ============================================================
 * 首页 / 任务 / 打卡日历 / 数据中心 / 积分商城 / 家长中心
 * ============================================================ */

/* ---------- 首页 ---------- */
RENDERERS.home = function () {
  const page = document.getElementById('page-home');
  const hour = new Date().getHours();
  const greet = hour < 9 ? '早上好 ☀️' : hour < 12 ? '上午好 🌈' : hour < 14 ? '中午好 🍚' : hour < 18 ? '下午好 🍃' : '晚上好 🌙';
  const t = allTasks();
  const done = t.filter(x => taskDone(x.id));
  const todo = t.filter(x => !taskDone(x.id));
  const streak = streakNow();
  const over = state.settings.maxMin > 0 && todayMinutes() >= state.settings.maxMin;
  const mods = [
    { id: 'shizi', icon: '🀄', name: '识字', sub: '生字·听写·闪卡', done: taskDone('t-shizi') },
    { id: 'pinyin', icon: '🔤', name: '拼音', sub: '声母·韵母·拼读', done: taskDone('t-pinyin') },
    { id: 'gushi', icon: '🏮', name: '古诗', sub: '每日必背·收藏', done: taskDone('t-gushi') },
    { id: 'yingyu', icon: '🗣️', name: '英语', sub: '字母·单词·儿歌', done: taskDone('t-yingyu') },
    { id: 'shuxue', icon: '🔢', name: '数学', sub: '口算·钟表·图形', done: taskDone('t-shuxue') },
    { id: 'kepu', icon: '🪐', name: '科普', sub: '天文·安全·常识', done: taskDone('t-kepu') }
  ];
  const pct = t.length ? Math.round(done.length / t.length * 100) : 0;
  page.innerHTML = `
    <div class="home-head">
      <div class="avatar">🐻</div>
      <div class="home-greet">
        <div class="page-title" style="margin:0">${greet}，小小学习家！</div>
        <div class="home-sub">连续打卡 <b class="streak-num">${streak}</b> 天 ${streak >= 3 ? '🔥' : '💪'}</div>
      </div>
      <div class="beans-pill" onclick="nav('shangcheng')">🪙 <b>${state.beans}</b></div>
    </div>
    ${over ? `<div class="limit-tip">⏰ 已到家长设置的学习时长上限，休息一下吧！（家长可在「家长中心」调整）</div>` : ''}
    <div class="today-ring-card">
      <div class="ring-wrap"><div class="ring" style="background:conic-gradient(#6bcb77 ${pct * 3.6}deg, #ffe3ee 0deg)"><div class="ring-in"><b>${pct}%</b><span>今日进度</span></div></div></div>
      <div class="ring-right">
        <div class="ring-txt">已完成 ${done.length}/${t.length} 个任务</div>
        <div class="ring-tip">${todo.length ? `还有 ${todo.length} 个任务，加油！` : '🎉 全部完成啦！'}</div>
        <button class="mini-btn primary" onclick="nav('renwu')">📋 去打卡</button>
      </div>
    </div>
    <div class="mod-grid">${mods.map(m => `
      <div class="mod-card mod-${m.id} ${m.done ? 'mod-done' : ''}" onclick="nav('${m.id}')">
        <span class="mod-icon">${m.icon}</span>
        <b>${m.name}</b><small>${m.sub}</small>
        <span class="mod-flag">${m.done ? '✅' : ''}</span>
      </div>`).join('')}
      <div class="mod-card mod-game" onclick="nav('youxi')">
        <span class="mod-icon">🎮</span><b>趣味游戏</b><small>拼音闯关·抓大鹅</small><span class="mod-flag"></span>
      </div>
      <div class="mod-card mod-game" onclick="nav('yundong')">
        <span class="mod-icon">🏃</span><b>运动</b><small>跳绳·前庭训练</small><span class="mod-flag"></span>
      </div>
    </div>
    <div class="card">
      <div class="card-head">📋 今日待学 <button class="mini-btn" onclick="nav('renwu')">全部任务</button></div>
      ${todo.length ? todo.slice(0, 5).map(x => `
        <div class="task-item" data-id="${x.id}" onclick="toggleTask('${x.id}')">
          <span class="task-check">⬜</span><span class="task-icon">${x.icon}</span>
          <span class="task-name">${esc(x.name)}<em>${x.minutes}分钟</em></span>
          <span class="task-beans">+${x.beans}🪙</span>
        </div>`).join('') : '<div class="empty-tip">今日任务全部完成，太棒啦！🎉</div>'}
    </div>`;
};

/* ---------- 任务页 ---------- */
RENDERERS.renwu = function () {
  const page = document.getElementById('page-renwu');
  const t = allTasks();
  const done = t.filter(x => taskDone(x.id));
  const streak = streakNow();
  page.innerHTML = `
    <div class="page-title">📋 学习任务 <span class="sub">完成得学习豆</span></div>
    <div class="card">
      <div class="card-head">🪙 今日学习豆 <b class="beans-big">${state.beans}</b> <span class="sub">（今日已得 ${beansToday()}）</span></div>
      <div class="streak-line">🔥 连续打卡 <b>${streak}</b> 天
        ${[3, 7, 30].map(d => `<span class="streak-milestone ${streak >= d ? 'got' : ''}">${d}天${streak >= d ? '✓' : ''}</span>`).join('')}
      </div>
      <div class="card-foot">连续打卡 3/7/30 天有额外学习豆奖励；家长可在「家长中心」调整任务</div>
    </div>
    <div class="card">
      <div class="card-head">今日任务 <span class="today-progress">${done.length}/${t.length}</span></div>
      <div class="task-list">${t.map(x => `
        <div class="task-item ${taskDone(x.id) ? 'done' : ''}" data-id="${x.id}" onclick="toggleTask('${x.id}')">
          <span class="task-check">${taskDone(x.id) ? '✅' : '⬜'}</span>
          <span class="task-icon">${x.icon}</span>
          <span class="task-name">${esc(x.name)}<em>${x.minutes}分钟</em></span>
          <span class="task-beans">+${x.beans}🪙</span>
        </div>`).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-head">🎮 闯关得豆 <span class="sub">额外成就</span></div>
      <div class="empty-tip">玩拼音闯关和抓大鹅，闯过新关卡获得成就感！</div>
      <button class="mini-btn primary" onclick="nav('youxi')">🎮 去玩游戏</button>
    </div>`;
};
function beansToday() {
  const log = dayLog(todayStr());
  return allTasks().reduce((s, x) => s + (log[x.id] ? (x.beans || 0) : 0), 0);
}

/* ---------- 打卡日历 ---------- */
let calOffset = 0;
RENDERERS.daka = function () {
  const page = document.getElementById('page-daka');
  const streak = streakNow();
  page.innerHTML = `
    <div class="page-title">📅 打卡日历 <span class="sub">连续 ${streak} 天 🔥</span></div>
    <div class="card">
      <div class="cal-head">
        <button class="mini-btn" onclick="calShift(-1)">◀</button>
        <b>${calMonthTitle()}</b>
        <button class="mini-btn" onclick="calShift(1)">▶</button>
      </div>
      <div class="cal-grid">${renderCalendar()}</div>
      <div class="cal-legend">
        <span><i class="lg full"></i>完成</span><span><i class="lg part"></i>部分</span>
        <span><i class="lg madeup"></i>补卡</span><span><i class="lg none"></i>未打卡</span>
      </div>
    </div>
    <div class="card">
      <div class="card-head">🔁 补打卡 <span class="sub">消耗 ${MAKEUP_COST}🪙 / 天</span></div>
      <div id="makeup-area">${renderMakeup()}</div>
    </div>`;
};
function calMonthTitle() {
  const now = new Date(); const d = new Date(now.getFullYear(), now.getMonth() + calOffset, 1);
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}
function calShift(n) { calOffset += n; renderPage('daka'); }
function renderCalendar() {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth() + calOffset;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const startWeek = new Date(y, m, 1).getDay();
  let html = '<div class="cal-week"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div>';
  for (let i = 0; i < startWeek; i++) html += '<span class="cal-cell empty"></span>';
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = dateStr(new Date(y, m, d));
    const st = dayStatus(ds);
    const cls = st === 'full' ? 'full' : st === 'part' ? 'part' : st === 'madeup' ? 'madeup' : 'none';
    html += `<span class="cal-cell ${cls} ${ds === todayStr() ? 'today' : ''}" title="${ds}">${d}${st === 'madeup' ? '<i>补</i>' : ''}</span>`;
  }
  return html;
}
function renderMakeup() {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth() + calOffset;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const list = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = dateStr(new Date(y, m, d));
    if (ds < todayStr() && dayStatus(ds) === 'none') list.push(ds);
  }
  if (!list.length) return '<div class="empty-tip">这个月没有需要补的卡 🎉</div>';
  return list.slice(-10).map(ds => `
    <div class="makeup-item"><span>📆 ${ds}</span>
      <button class="mini-btn" onclick="makeupDay('${ds}')">补卡 (-${MAKEUP_COST}🪙)</button></div>`).join('');
}

/* ---------- 数据中心 ---------- */
RENDERERS.shuju = function () {
  const page = document.getElementById('page-shuju');
  const st = hanziStats();
  const trend = weekTrend();
  const streak = streakNow();
  const weakItems = state.weakHanzi.map(w => HANZI.find(h => h.c === w)).filter(Boolean);
  // 薄弱项提示（从错题本统计）
  const subjCount = {};
  state.mistakes.slice(0, 30).forEach(m => { subjCount[m.subject] = (subjCount[m.subject] || 0) + 1; });
  const weakSubj = Object.entries(subjCount).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k, v]) => k);
  page.innerHTML = `
    <div class="page-title">📊 学习数据中心 <span class="sub">家长查看</span></div>
    <div class="card">
      <div class="card-head">🀄 识字量看板</div>
      <div class="stat-strip">
        <div class="stat-cell"><b>${st.total}</b><span>总字库</span></div>
        <div class="stat-cell"><b>${st.learned}</b><span>已学</span></div>
        <div class="stat-cell ok"><b>${st.mastered}</b><span>已掌握</span></div>
        <div class="stat-cell warn"><b>${st.weak}</b><span>薄弱</span></div>
      </div>
      <div class="chart-title">近 7 天每日掌握生字</div>
      <div class="bar-chart">${trend.map(d => `
        <div class="bar-col"><div class="bar-val">${d.mastered || ''}</div>
          <div class="bar" style="height:${Math.max(6, Math.min(100, (d.mastered || 0) * 22))}px"></div>
          <div class="bar-day">${d.day}</div></div>`).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-head">📅 近 7 天打卡</div>
      <div class="bar-chart">${trend.map(d => `
        <div class="bar-col"><div class="bar-dot ${d.status}"></div><div class="bar-day">${d.day}</div></div>`).join('')}
      </div>
      <div class="card-foot">连续打卡 <b>${streak}</b> 天 · 今日学习 <b>${todayMinutes()}</b> 分钟</div>
    </div>
    ${weakSubj.length ? `<div class="card"><div class="card-head">💡 薄弱项提示</div>
      <div class="weak-tip">最近错题集中在：<b>${weakSubj.join('、')}</b>，建议重点复习这些模块！</div></div>` : ''}
    <div class="card">
      <div class="card-head">📒 薄弱字本 <span class="badge">${st.weak}</span></div>
      ${weakItems.length ? `<div class="weak-chars">${weakItems.map(h => `<span class="unit-char mc-warn" onclick="speak('${h.c}','zh-CN')" title="点我标记掌握">${h.c}</span>`).join('')}</div>
      <div class="card-foot">点字复习；掌握后点下方按钮移除</div>
      <button class="mini-btn" onclick="weakAllMastered()">🌟 全部标记为已掌握</button>` : '<div class="empty-tip">没有薄弱字，继续保持！🎉</div>'}
    </div>
    <div class="card">
      <div class="card-head">🛍️ 历史兑换 <span class="badge">${state.history.length}</span></div>
      ${state.history.length ? state.history.slice(0, 10).map(h => `<div class="his-item">${h.icon} ${esc(h.name)}<span>${h.date}</span></div>`).join('') : '<div class="empty-tip">还没有兑换记录</div>'}
    </div>`;
};
function weakAllMastered() {
  if (!confirm('把薄弱字本里的字全部标记为已掌握？')) return;
  state.weakHanzi.slice().forEach(w => { markHanzi(w, 'mastered'); removeWeakHanzi(w); });
  renderPage('shuju');
}
function weekTrend() {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = dateStr(d);
    const hd = state.hanziDaily[ds] || { mastered: 0 };
    out.push({ day: `${d.getMonth() + 1}/${d.getDate()}`, mastered: hd.mastered || 0, status: dayStatus(ds) });
  }
  return out;
}

/* ---------- 积分商城 ---------- */
const TIERS = [['低', '低价小件'], ['中', '中端文具'], ['高', '高阶实物']];
RENDERERS.shangcheng = function () {
  const page = document.getElementById('page-shangcheng');
  page.innerHTML = `
    <div class="page-title">🛍️ 学习豆商城 <span class="sub">完成学习任务赚豆子</span></div>
    <div class="card point-card"><div class="point-num"><b>${state.beans}</b><span>学习豆 🪙</span></div>
      <div class="point-tip">每天打卡得豆：识字+5 拼音+4 古诗+3 英语+4 数学+5 科普+2；连续打卡还有大礼包！</div></div>
    ${TIERS.map(([tier, tname]) => `
      <div class="card"><div class="card-head">${tier === '低' ? '🎈' : tier === '中' ? '✏️' : '🎁'} ${tname} <span class="sub">${tier}档</span></div>
      <div class="shop-grid">${state.rewards.filter(r => r.tier === tier).map(r => {
        const ok = state.beans >= r.cost;
        return `<div class="shop-item ${ok ? 'can' : ''}">
          <span class="shop-icon">${r.icon}</span>
          <b class="shop-name">${esc(r.name)}</b>
          <span class="shop-cost">🪙 ${r.cost}</span>
          <button class="mini-btn ${ok ? 'primary' : ''}" ${ok ? '' : 'disabled'} onclick="redeem('${r.id}')">${ok ? '🎁 兑换' : '🔒'}</button>
        </div>`;}).join('')}
      </div></div>`).join('')}
    <div class="card">
      <div class="card-head">📜 兑换记录</div>
      ${state.history.length ? state.history.map(h => `<div class="his-item">${h.icon} ${esc(h.name)} <span>${h.date}${h.addr ? ' · 地址已填' : ''}</span></div>`).join('') : '<div class="empty-tip">还没有兑换记录，加油攒豆子！</div>'}
      <div class="card-foot">奖品与价格可在「家长中心」调整；兑换后由家长负责兑现实物 💕</div>
    </div>`;
};
function redeem(id) {
  const r = state.rewards.find(x => x.id === id);
  if (!r || state.beans < r.cost) return;
  showExchangeModal(r);
}
/* 兑换表单弹窗（收货人/电话/地址） */
function showExchangeModal(r) {
  closeModal();
  const mask = el(`
    <div class="modal-mask" id="ex-modal" onclick="if(event.target===this)closeModal()">
      <div class="modal">
        <div class="modal-title">${r.icon} 兑换 ${esc(r.name)}</div>
        <div class="modal-sub">将消耗 <b style="color:var(--orange)">${r.cost} 🪙</b>，学习豆余额 ${state.beans}</div>
        <div class="modal-field"><label>收货人姓名</label><input id="ex-name" placeholder="小朋友或家长姓名" value="${esc(state.shopName || '')}"></div>
        <div class="modal-field"><label>联系电话</label><input id="ex-phone" type="tel" placeholder="手机号" value="${esc(state.shopPhone || '')}"></div>
        <div class="modal-field"><label>收货地址</label><input id="ex-addr" placeholder="省市区 + 详细地址" value="${esc(state.shopAddr || '')}"></div>
        <div class="modal-btns">
          <button class="mini-btn" onclick="closeModal()">取消</button>
          <button class="mini-btn primary" onclick="confirmExchange('${r.id}')">🎁 确认兑换</button>
        </div>
      </div>
    </div>`);
  document.body.appendChild(mask);
  const name = document.getElementById('ex-name');
  if (name) setTimeout(() => name.focus(), 100);
}
function closeModal() {
  const m = document.getElementById('ex-modal');
  if (m) m.remove();
}
function confirmExchange(id) {
  const r = state.rewards.find(x => x.id === id);
  if (!r || state.beans < r.cost) return;
  const name = (document.getElementById('ex-name') || {}).value || '';
  const phone = (document.getElementById('ex-phone') || {}).value || '';
  const addr = (document.getElementById('ex-addr') || {}).value || '';
  if (!name.trim()) { alert('请填写收货人姓名'); return; }
  if (!phone.trim() || phone.trim().length < 7) { alert('请填写正确的联系电话'); return; }
  if (!addr.trim()) { alert('请填写收货地址'); return; }
  state.shopName = name.trim();
  state.shopPhone = phone.trim();
  state.shopAddr = addr.trim();
  state.beans -= r.cost;
  state.history.unshift({ name: r.name, icon: r.icon, cost: r.cost, date: todayStr(), addr: addr.trim(), receiver: name.trim(), phone: phone.trim() });
  saveState(); confetti();
  closeModal();
  renderPage('shangcheng'); renderHeader();
  setTimeout(() => alert(`🎉 兑换成功！${r.icon} ${r.name}\n收货人：${name.trim()}\n家长记得安排发货哦～`), 300);
}

/* ---------- 家长中心 ---------- */
RENDERERS.jiazhang = function () {
  const page = document.getElementById('page-jiazhang');
  page.innerHTML = `
    <div class="page-title">👨‍👩‍👧 家长中心</div>
    <div class="card">
      <div class="card-head">⏰ 防沉迷设置</div>
      <div class="cfg-row">
        <label>每日最大学习分钟：
          <select id="max-min" onchange="saveMaxMin()">
            <option value="0" ${state.settings.maxMin === 0 ? 'selected' : ''}>不限</option>
            ${[30, 45, 60, 90, 120].map(m => `<option value="${m}" ${state.settings.maxMin === m ? 'selected' : ''}>${m}分钟</option>`).join('')}
          </select>
        </label>
      </div>
      <div class="card-foot">超过时长后，首页会显示休息提示（不强制锁定）</div>
    </div>
    <div class="card">
      <div class="card-head">📋 任务管理 <span class="sub">改豆值 / 增删</span></div>
      <div class="add-row">
        <input id="new-task-name" placeholder="任务名"><input id="new-task-icon" placeholder="图标" maxlength="4" style="width:56px">
        <input id="new-task-min" type="number" placeholder="分钟" style="width:64px">
        <input id="new-task-beans" type="number" placeholder="豆" style="width:56px">
        <button class="mini-btn primary" onclick="addTask()">➕</button>
      </div>
      <div class="task-mgmt">${state.tasks.map((t, i) => `
        <div class="mgmt-item">
          <span class="mgmt-icon">${t.icon}</span>
          <span class="mgmt-name">${esc(t.name)}${t.builtin ? '<em>内置</em>' : ''}</span>
          <button class="mini-btn" onclick="editTask(${i})">${t.minutes}分 ${t.beans}豆 ✏️</button>
          <button class="mini-btn" onclick="toggleTaskVisible(${i})">${t.visible === false ? '🙈' : '👁️'}</button>
          ${t.builtin ? '' : `<button class="mini-btn danger" onclick="delTask(${i})">🗑️</button>`}
        </div>`).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-head">🎁 奖品管理</div>
      <div class="add-row">
        <input id="new-rw-name" placeholder="奖品名"><input id="new-rw-icon" placeholder="图标" maxlength="4" style="width:56px">
        <input id="new-rw-cost" type="number" placeholder="豆" style="width:64px">
        <select id="new-rw-tier" style="width:70px"><option>低</option><option>中</option><option>高</option></select>
        <button class="mini-btn primary" onclick="addReward()">➕</button>
      </div>
      <div class="task-mgmt">${state.rewards.map((r, i) => `
        <div class="mgmt-item"><span class="mgmt-icon">${r.icon}</span>
          <span class="mgmt-name">${esc(r.name)}<em>${r.tier}</em></span>
          <button class="mini-btn" onclick="editReward(${i})">${r.cost}豆 ✏️</button>
          <button class="mini-btn danger" onclick="delReward(${i})">🗑️</button>
        </div>`).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-head">🏠 收货信息（兑换表单默认值）</div>
      <div class="add-row"><input id="shop-name" placeholder="收货人姓名" value="${esc(state.shopName)}">
        <input id="shop-phone" placeholder="联系电话" value="${esc(state.shopPhone)}"></div>
      <div class="add-row"><input id="shop-addr" placeholder="收货地址（省市区+详细）" value="${esc(state.shopAddr)}">
        <button class="mini-btn primary" onclick="saveAddr()">💾 保存</button></div>
    </div>
    <div class="card">
      <div class="card-head">💾 数据备份</div>
      <div class="btn-row">
        <button class="mini-btn" onclick="exportData()">📤 导出</button>
        <button class="mini-btn primary" onclick="document.getElementById('import-file').click()">📥 导入</button>
        <button class="mini-btn danger" onclick="resetAll()">🗑️ 清空</button>
      </div>
      <input type="file" id="import-file" accept=".json,application/json" style="display:none" onchange="importData(this)">
      <div class="card-foot">导出的 JSON 文件可传到手机，在手机版「家长中心 → 导入」恢复</div>
    </div>
    <div class="about">幼小衔接学习工作台 v2.0 · 学习豆体系 · 纯本地存储 💕</div>`;
};
function saveMaxMin() {
  state.settings.maxMin = parseInt(document.getElementById('max-min').value, 10);
  saveState(); renderPage('home');
}
function addTask() {
  const name = document.getElementById('new-task-name').value.trim();
  if (!name) { alert('请输入任务名称'); return; }
  state.tasks.push({
    id: 'c' + Date.now(), name,
    icon: document.getElementById('new-task-icon').value.trim() || '⭐',
    minutes: parseInt(document.getElementById('new-task-min').value, 10) || 10,
    beans: parseInt(document.getElementById('new-task-beans').value, 10) || 1,
    group: '自定义', builtin: false
  });
  saveState(); renderPage('jiazhang'); renderHeader(); alert('✅ 任务已添加');
}
function editTask(i) {
  const t = state.tasks[i];
  const min = prompt('时长（分钟）：', t.minutes);
  if (min === null) return;
  const beans = prompt('学习豆：', t.beans);
  if (beans === null) return;
  t.minutes = parseInt(min, 10) || 0;
  t.beans = parseInt(beans, 10) || 0;
  saveState(); renderPage('jiazhang');
}
function delTask(i) {
  if (confirm(`删除任务「${state.tasks[i].name}」？`)) { state.tasks.splice(i, 1); saveState(); renderPage('jiazhang'); renderHeader(); }
}
function toggleTaskVisible(i) {
  const t = state.tasks[i];
  if (t.visible === false) delete t.visible; else t.visible = false;
  saveState(); renderPage('jiazhang'); renderHeader();
}
function addReward() {
  const name = document.getElementById('new-rw-name').value.trim();
  if (!name) { alert('请输入奖品名'); return; }
  const cost = parseInt(document.getElementById('new-rw-cost').value, 10);
  if (!cost || cost < 1) { alert('价格要大于 0'); return; }
  state.rewards.push({ id: 'r' + Date.now(), name, icon: document.getElementById('new-rw-icon').value.trim() || '🎁', cost, tier: document.getElementById('new-rw-tier').value });
  saveState(); renderPage('jiazhang');
}
function editReward(i) {
  const r = state.rewards[i];
  const name = prompt('奖品名：', r.name);
  if (name === null) return;
  const cost = prompt('学习豆：', r.cost);
  const icon = prompt('图标：', r.icon);
  const tier = prompt('档位（低/中/高）：', r.tier);
  if (name.trim()) r.name = name.trim();
  if (cost && parseInt(cost, 10) > 0) r.cost = parseInt(cost, 10);
  if (icon && icon.trim()) r.icon = icon.trim();
  if (tier && ['低', '中', '高'].includes(tier.trim())) r.tier = tier.trim();
  saveState(); renderPage('jiazhang');
}
function delReward(i) { if (confirm('删除这个奖品？')) { state.rewards.splice(i, 1); saveState(); renderPage('jiazhang'); } }
function saveAddr() {
  state.shopName = (document.getElementById('shop-name') || {}).value || '';
  state.shopPhone = (document.getElementById('shop-phone') || {}).value || '';
  state.shopAddr = (document.getElementById('shop-addr') || {}).value || '';
  saveState(); alert('✅ 已保存');
}

/* ---------- 备份导出 / 导入 ---------- */
function exportData() {
  const data = { tasks: state.tasks, beans: state.beans, rewards: state.rewards, history: state.history, mistakes: state.mistakes, log: state.log, hanziStatus: state.hanziStatus, weakHanzi: state.weakHanzi, hanziDaily: state.hanziDaily, favGushi: state.favGushi, madeup: state.madeup, settings: state.settings, shopName: state.shopName, shopPhone: state.shopPhone, shopAddr: state.shopAddr };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = '幼小衔接工作台备份-' + todayStr() + '.json';
  a.click();
  alert('📤 备份已下载！\n恢复：把文件传到手机 → 手机版「家长中心 → 导入」');
}
function importData(input) {
  const file = input.files && input.files[0];
  if (!file) { input.value = ''; return; }
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const d = JSON.parse(e.target.result);
      if (!d || typeof d !== 'object' || !Array.isArray(d.tasks)) throw new Error('不是有效的工作台备份文件');
      const msg = `将导入：任务 ${d.tasks.length} 个、学习豆 ${d.beans || 0}、已掌握字 ${Object.values(d.hanziStatus || {}).filter(s => s === 'mastered').length} 个。\n当前数据会被覆盖，确定恢复吗？`;
      if (!confirm(msg)) { input.value = ''; return; }
      state.tasks = d.tasks;
      state.beans = typeof d.beans === 'number' ? d.beans : 0;
      state.rewards = Array.isArray(d.rewards) && d.rewards.length ? d.rewards : DEFAULT_REWARDS.map(r => ({ ...r }));
      state.history = d.history || [];
      state.mistakes = d.mistakes || [];
      state.log = d.log || {};
      state.hanziStatus = d.hanziStatus || {};
      state.weakHanzi = d.weakHanzi || [];
      state.hanziDaily = d.hanziDaily || {};
      state.favGushi = d.favGushi || [];
      state.madeup = d.madeup || [];
      state.settings = d.settings || { maxMin: 0, showStreak: true };
      state.shopName = d.shopName || '';
      state.shopPhone = d.shopPhone || '';
      state.shopAddr = d.shopAddr || '';
      saveState(); confetti();
      alert('✅ 备份恢复成功！页面即将刷新');
      setTimeout(() => location.reload(), 600);
    } catch (err) { alert('❌ 导入失败：' + err.message); }
    input.value = '';
  };
  reader.readAsText(file);
}
function resetAll() {
  if (confirm('确定清空所有数据（打卡、学习豆、识字状态、错题）吗？此操作不可恢复！')) {
    localStorage.clear(); location.reload();
  }
}

/* ---------- 初始化 ---------- */
function init() {
  const navBar = document.getElementById('bottom-nav');
  navBar.innerHTML = NAV_TABS.map(p => `<div class="tab-item ${p.id === 'home' ? 'active' : ''}" data-page="${p.id}" onclick="nav('${p.id}')">
    <span class="tab-icon">${p.icon}</span><span class="tab-label">${p.label}</span></div>`).join('');
  renderHeader();
  nav('home');
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  window.speechSynthesis && speechSynthesis.getVoices();
}
document.addEventListener('DOMContentLoaded', init);
