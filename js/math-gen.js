/* ============================================================
 * 数学题生成：20 以内口算（凑十法 / 破十法）、数感、思维
 * ============================================================ */

/* --- 20 以内加减法 ---
 * 返回 {a, b, op, method, ans, explain}
 * method: 凑十法 / 破十法 / 直接算 */
function genKousuan(method) {
  const m = method || (Math.random() < 0.4 ? '凑十法' : (Math.random() < 0.5 ? '破十法' : '直接算'));
  if (m === '凑十法') {
    // 一个加数 8 或 9，另一个 2~9
    const big = Math.random() < 0.5 ? 8 : 9;
    const small = 2 + Math.floor(Math.random() * 8); // 2~9
    const a = Math.random() < 0.5 ? big : small;
    const b = a === big ? small : big;
    const ans = a + b;
    const need = 10 - b; // b 需要从 a 拆多少补 10
    const rest = a - need;
    return { a, b, op: '+', method: '凑十法', ans, explain: `把 ${a} 拆成 ${need} 和 ${rest}，${b}+${need}=10，10+${rest}=${ans}` };
  }
  if (m === '破十法') {
    // 被减数 11~18，减数大于个位，保证差 >= 1
    const a = 11 + Math.floor(Math.random() * 8); // 11~18
    const ge = a % 10;
    const b = ge + 1 + Math.floor(Math.random() * (9 - ge)); // > 个位
    const ans = a - b;
    const shi = 10 - b;
    return { a, b, op: '-', method: '破十法', ans, explain: `把 ${a} 拆成 10 和 ${ge}，10-${b}=${shi}，${shi}+${ge}=${ans}` };
  }
  // 直接算：不进位加法 / 不退位减法
  const mode = Math.random() < 0.5 ? '+' : '-';
  if (mode === '+') {
    const a = 1 + Math.floor(Math.random() * 10); // 1~10
    const b = 1 + Math.floor(Math.random() * (10 - a)); // 和 <= 10
    return { a, b, op: '+', method: '直接算', ans: a + b, explain: `${a} + ${b} = ${a + b}` };
  } else {
    const a = 2 + Math.floor(Math.random() * 9); // 2~10
    const b = 1 + Math.floor(Math.random() * (a - 1));
    return { a, b, op: '-', method: '直接算', ans: a - b, explain: `${a} - ${b} = ${a - b}` };
  }
}

/* 批量生成一页口算题 */
function genKousuanPaper(n, method) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(genKousuan(method));
  return out;
}

/* --- 数感练习 --- */
function genShugan() {
  const types = ['比大小', '数的分成', '找相邻数', '单双数'];
  const t = types[Math.floor(Math.random() * types.length)];
  if (t === '比大小') {
    const a = Math.floor(Math.random() * 20);
    let b = Math.floor(Math.random() * 20);
    while (b === a) b = Math.floor(Math.random() * 20);
    const ans = a > b ? '>' : (a < b ? '<' : '=');
    return { q: `${a} ○ ${b} 填 > < 或 =`, ans, explain: `${a} 比 ${b} ${a > b ? '大' : '小'}` };
  }
  if (t === '数的分成') {
    const n = 5 + Math.floor(Math.random() * 11); // 5~15
    const a = 1 + Math.floor(Math.random() * (n - 1));
    return { q: `${n} 可以分成 ${a} 和（  ）`, ans: n - a, explain: `${n} - ${a} = ${n - a}` };
  }
  if (t === '找相邻数') {
    const n = 2 + Math.floor(Math.random() * 17);
    return { q: `${n} 的邻居是（  ）和（  ）`, ans: `${n - 1},${n + 1}`, explain: `${n} 的前面是 ${n - 1}，后面是 ${n + 1}` };
  }
  // 单双数
  const n = 1 + Math.floor(Math.random() * 20);
  return { q: `${n} 是单数还是双数？`, ans: n % 2 === 0 ? '双数' : '单数', explain: `${n} 个位是 ${n % 2 === 0 ? '双' : '单'}，所以是${n % 2 === 0 ? '双数' : '单数'}` };
}

/* --- 思维题 --- */
function genSiwei() {
  const types = ['找规律', '比轻重', '排队问题', '多几个'];
  const t = types[Math.floor(Math.random() * types.length)];
  if (t === '找规律') {
    const step = 1 + Math.floor(Math.random() * 3); // 等差
    const start = 1 + Math.floor(Math.random() * 5);
    const seq = [start, start + step, start + 2 * step, start + 3 * step, null];
    return { q: `找规律填数：${seq[0]} ${seq[1]} ${seq[2]} ${seq[3]} （  ）`, ans: start + 4 * step, explain: `每次都加 ${step}` };
  }
  if (t === '比轻重') {
    const a = Math.floor(Math.random() * 5) + 1, b = Math.floor(Math.random() * 5) + 1;
    if (a === b) return genSiwei();
    return { q: `大象重 ${a} 吨，小狗重 ${b} 千克，谁重？`, ans: '大象', explain: `${a} 吨比 ${b} 千克重得多` };
  }
  if (t === '排队问题') {
    const front = 2 + Math.floor(Math.random() * 4);
    const back = 2 + Math.floor(Math.random() * 4);
    const ans = front + back + 1;
    return { q: `小明排队，前面有 ${front} 人，后面有 ${back} 人，队伍一共有多少人？`, ans, explain: `${front} + ${back} + 1（小明自己）= ${ans}` };
  }
  // 多几个
  const a = 3 + Math.floor(Math.random() * 6);
  const b = 1 + Math.floor(Math.random() * (a - 2));
  return { q: `小明有 ${a} 个苹果，小红有 ${b} 个，小明比小红多几个？`, ans: a - b, explain: `${a} - ${b} = ${a - b}` };
}
