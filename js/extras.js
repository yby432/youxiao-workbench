/* ============================================================
 * 奖励柜 / 设置 / 初始化
 * ============================================================ */

/* ---------- 奖励柜 ---------- */
RENDERERS.jiangli = function () {
  const page = document.getElementById('page-jiangli');
  const next = state.rewards.filter(r => state.points < r.cost).sort((a, b) => a.cost - b.cost)[0];
  page.innerHTML = `
    <div class="page-title">⭐ 奖励柜</div>
    <div class="card point-card">
      <div class="point-num"><b>${state.points}</b><span>积分</span></div>
      <div class="point-tip">${next ? `再攒 <b>${next.cost - state.points}</b> 分就能兑换「${next.icon} ${esc(next.name)}」啦！` : '所有奖励都可以兑换啦，快去看看吧！🎉'}</div>
    </div>
    <div class="reward-list">${state.rewards.map(r => {
      const ok = state.points >= r.cost;
      return `
      <div class="reward-item ${ok ? 'can' : ''}">
        <span class="rw-icon">${r.icon}</span>
        <div class="rw-mid">
          <div class="rw-name">${esc(r.name)}</div>
          <div class="rw-bar"><i style="width:${Math.min(100, state.points / r.cost * 100)}%"></i></div>
          <div class="rw-need">${state.points} / ${r.cost} 积分</div>
        </div>
        <button class="mini-btn ${ok ? 'primary' : ''}" ${ok ? '' : 'disabled' } onclick="redeem('${r.id}')">${ok ? '🎁 兑换' : '🔒'}</button>
      </div>`;
    }).join('')}
    </div>
    <div class="card">
      <div class="card-head">📜 兑换记录</div>
      <div id="history-area">${renderHistory()}</div>
      <div class="card-foot">奖励可以自己在「设置」里新增、修改、删除 ✏️</div>
    </div>`;
};
function renderHistory() {
  if (!state.history.length) return '<div class="empty-tip">还没有兑换记录，加油攒积分！</div>';
  return state.history.map(h => `<div class="his-item">${h.icon} ${esc(h.name)} <span>${h.date}</span></div>`).join('');
}
function redeem(id) {
  const r = state.rewards.find(x => x.id === id);
  if (!r || state.points < r.cost) return;
  if (confirm(`确定用 ${r.cost} 积分兑换「${r.icon} ${r.name}」吗？`)) {
    state.points -= r.cost;
    state.history.unshift({ name: r.name, icon: r.icon, cost: r.cost, date: todayStr() });
    saveState(); confetti();
    renderPage('jiangli'); renderHeader();
    setTimeout(() => alert(`🎉 兑换成功！${r.icon} ${r.name} 属于你啦！\n（家长记得兑现承诺哦～）`), 400);
  }
}

/* ---------- 设置 ---------- */
RENDERERS.shezhi = function () {
  const page = document.getElementById('page-shezhi');
  page.innerHTML = `
    <div class="page-title">⚙️ 设置</div>
    <div class="card">
      <div class="card-head">📋 任务管理 <span class="sub">新增 / 删除 / 开关</span></div>
      <div class="add-row">
        <input id="new-task-name" placeholder="任务名称，如：练琴 30 分钟">
        <input id="new-task-icon" placeholder="图标" maxlength="4" style="width:64px">
        <input id="new-task-min" type="number" placeholder="分钟" style="width:72px">
        <button class="mini-btn primary" onclick="addTask()">➕ 新增</button>
      </div>
      <div class="task-mgmt">${state.tasks.map((t, i) => `
        <div class="mgmt-item">
          <span class="mgmt-icon">${t.icon}</span>
          <span class="mgmt-name">${esc(t.name)}${t.builtin ? '<em class="builtin-tag">内置</em>' : ''}</span>
          <span class="mgmt-min">${t.minutes || ''}分</span>
          <button class="mini-btn" onclick="toggleTaskVisible(${i})">${t.visible === false ? '🙈 显示' : '👁️ 隐藏'}</button>
          ${t.builtin ? '' : `<button class="mini-btn danger" onclick="delTask(${i})">🗑️</button>`}
        </div>`).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-head">🎁 奖励档位管理</div>
      <div class="add-row">
        <input id="new-rw-name" placeholder="奖励名称，如：看动画片">
        <input id="new-rw-icon" placeholder="图标" maxlength="4" style="width:64px">
        <input id="new-rw-cost" type="number" placeholder="积分" style="width:72px">
        <button class="mini-btn primary" onclick="addReward()">➕ 新增</button>
      </div>
      <div class="task-mgmt">${state.rewards.map((r, i) => `
        <div class="mgmt-item">
          <span class="mgmt-icon">${r.icon}</span>
          <span class="mgmt-name">${esc(r.name)}</span>
          <span class="mgmt-min">${r.cost}分</span>
          <button class="mini-btn" onclick="editReward(${i})">✏️</button>
          <button class="mini-btn danger" onclick="delReward(${i})">🗑️</button>
        </div>`).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-head">🎬 控笔跟练视频</div>
      <div class="add-row">
        <input id="kongbi-url" placeholder="粘贴抖音/视频链接" value="${esc(Store.get('yx_kongbi_url', ''))}">
        <button class="mini-btn primary" onclick="saveKongbiUrl()">💾 保存</button>
      </div>
      <div class="card-foot">粘贴后，语文页的「打开跟练视频」按钮就会生效</div>
    </div>
    <div class="card">
      <div class="card-head">💾 数据</div>
      <div class="btn-row">
        <button class="mini-btn" onclick="exportData()">📤 导出备份</button>
        <button class="mini-btn danger" onclick="resetAll()">🗑️ 清空所有数据</button>
      </div>
    </div>
    <div class="about">幼小衔接工作台 v1.0 · 纯本地运行，数据保存在这台设备上 💕</div>`;
};
function addTask() {
  const name = document.getElementById('new-task-name').value.trim();
  if (!name) { alert('请输入任务名称'); return; }
  const icon = document.getElementById('new-task-icon').value.trim() || '⭐';
  const min = parseInt(document.getElementById('new-task-min').value, 10) || 0;
  state.tasks.push({ id: 'c' + Date.now(), name, icon, group: '自定义', builtin: false, minutes: min });
  saveState(); renderPage('shezhi'); renderHeader();
  alert('✅ 任务已添加！今天就能打卡啦');
}
function delTask(i) {
  const t = state.tasks[i];
  if (confirm(`确定删除任务「${t.name}」吗？`)) { state.tasks.splice(i, 1); saveState(); renderPage('shezhi'); renderHeader(); }
}
function toggleTaskVisible(i) {
  const t = state.tasks[i];
  if (t.visible === false) delete t.visible; else t.visible = false;
  saveState(); renderPage('shezhi'); renderHeader();
}
function addReward() {
  const name = document.getElementById('new-rw-name').value.trim();
  if (!name) { alert('请输入奖励名称'); return; }
  const icon = document.getElementById('new-rw-icon').value.trim() || '🎁';
  const cost = parseInt(document.getElementById('new-rw-cost').value, 10);
  if (!cost || cost < 1) { alert('积分要大于 0'); return; }
  state.rewards.push({ id: 'r' + Date.now(), name, icon, cost });
  state.rewards.sort((a, b) => a.cost - b.cost);
  saveState(); renderPage('shezhi');
}
function editReward(i) {
  const r = state.rewards[i];
  const name = prompt('奖励名称：', r.name);
  if (name === null) return;
  const cost = prompt('需要积分：', r.cost);
  const icon = prompt('图标（emoji）：', r.icon);
  if (name.trim()) r.name = name.trim();
  if (cost && parseInt(cost, 10) > 0) r.cost = parseInt(cost, 10);
  if (icon && icon.trim()) r.icon = icon.trim();
  state.rewards.sort((a, b) => a.cost - b.cost);
  saveState(); renderPage('shezhi');
}
function delReward(i) { if (confirm('确定删除这个奖励吗？')) { state.rewards.splice(i, 1); saveState(); renderPage('shezhi'); } }
function saveKongbiUrl() { const v = document.getElementById('kongbi-url').value.trim(); Store.set('yx_kongbi_url', v); saveState(); alert('✅ 已保存'); }
function exportData() {
  const data = { tasks: state.tasks, points: state.points, rewards: state.rewards, history: state.history, mistakes: state.mistakes, log: state.log };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = '幼小衔接工作台备份-' + todayStr() + '.json';
  a.click();
}
function resetAll() {
  if (confirm('确定清空所有打卡、积分、错题数据吗？此操作不可恢复！')) {
    localStorage.clear(); location.reload();
  }
}

/* ---------- 初始化 ---------- */
function init() {
  const navBar = document.getElementById('side-nav');
  navBar.innerHTML = PAGES.map(p => `<div class="nav-item ${p.id === 'home' ? 'active' : ''}" data-page="${p.id}" onclick="nav('${p.id}')">
    <span class="nav-icon">${p.icon}</span><span class="nav-label">${p.label}</span></div>`).join('');
  renderHeader();
  nav('home');
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  window.speechSynthesis && speechSynthesis.getVoices();
}
document.addEventListener('DOMContentLoaded', init);
