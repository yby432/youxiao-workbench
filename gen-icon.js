/* ============================================================
 * 生成 PWA 图标（纯 Node，无依赖）：彩虹渐变 + 五角星
 * 用法：node gen-icon.js
 * ============================================================ */
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

/* ---------- PNG 编码 ---------- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePNG(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filter none
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

/* ---------- 绘制 ---------- */
function lerp(a, b, t) { return Math.round(a + (b - a) * t); }
function inRoundedRect(x, y, s, r) {
  if (x < r && y < r) return (x - r) ** 2 + (y - r) ** 2 <= r * r;
  if (x > s - r && y < r) return (x - (s - r)) ** 2 + (y - r) ** 2 <= r * r;
  if (x < r && y > s - r) return (x - r) ** 2 + (y - (s - r)) ** 2 <= r * r;
  if (x > s - r && y > s - r) return (x - (s - r)) ** 2 + (y - (s - r)) ** 2 <= r * r;
  return x >= 0 && x < s && y >= 0 && y < s;
}
function starPoints(cx, cy, R, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const rad = (i % 2 === 0) ? R : r;
    const ang = -Math.PI / 2 + i * Math.PI / 5;
    pts.push([cx + rad * Math.cos(ang), cy + rad * Math.sin(ang)]);
  }
  return pts;
}
function inPolygon(pts, x, y) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

function drawIcon(size) {
  const s = size, r = s * 0.2;
  const rgba = Buffer.alloc(s * s * 4);
  // 彩虹渐变圆角底
  const c1 = [255, 143, 171], c2 = [197, 108, 240], c3 = [109, 150, 255];
  // 主星
  const main = starPoints(s * 0.5, s * 0.47, s * 0.27, s * 0.115);
  // 小星
  const stars = [
    [starPoints(s * 0.80, s * 0.24, s * 0.06, s * 0.026), [255, 240, 150]],
    [starPoints(s * 0.70, s * 0.13, s * 0.045, s * 0.02), [255, 255, 255]],
    [starPoints(s * 0.90, s * 0.36, s * 0.035, s * 0.015), [255, 214, 61]]
  ];
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const i = (y * s + x) * 4;
      let cr = 0, cg = 0, cb = 0, ca = 0;
      if (inRoundedRect(x, y, s, r)) {
        const t = (x + y) / (2 * s);
        // 对角双色渐变（粉 -> 紫），右侧叠一点蓝
        let R = lerp(c1[0], c2[0], t), G = lerp(c1[1], c2[1], t), B = lerp(c1[2], c2[2], t);
        const blueMix = Math.max(0, (x - s * 0.75) / (s * 0.3));
        R = lerp(R, c3[0], blueMix * 0.45); G = lerp(G, c3[1], blueMix * 0.45); B = lerp(B, c3[2], blueMix * 0.45);
        // 顶部高光
        const hl = Math.max(0, 1 - y / (s * 0.45));
        R = lerp(R, 255, hl * 0.18); G = lerp(G, 255, hl * 0.18); B = lerp(B, 255, hl * 0.18);
        cr = R; cg = G; cb = B; ca = 255;
        // 星形
        if (inPolygon(main, x, y)) { cr = 255; cg = 247; cb = 222; }
        else for (const [pts, col] of stars) {
          if (inPolygon(pts, x, y)) { cr = col[0]; cg = col[1]; cb = col[2]; break; }
        }
      }
      rgba[i] = cr; rgba[i + 1] = cg; rgba[i + 2] = cb; rgba[i + 3] = ca;
    }
  }
  return encodePNG(s, s, rgba);
}

const outDir = path.join(__dirname, 'assets');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'icon-512.png'), drawIcon(512));
fs.writeFileSync(path.join(outDir, 'icon-192.png'), drawIcon(192));
console.log('✅ 图标已生成: assets/icon-512.png, assets/icon-192.png');
