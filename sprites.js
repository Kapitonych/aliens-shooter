"use strict";
/* ============ ORBITAL DRIFT :: ПРЕДРЕНДЕРЕННЫЕ СПРАЙТЫ ============
   Каждый спрайт рисуется один раз в offscreen-canvas при загрузке.
   У персонажа и монстров — кадры анимации (массив), чтобы не "скользить
   животом", а переступать конечностями. Спрайты смотрят вверх (-Y).
*/

const SPR = { marine: null, grunt: null, swarm: null, shooter: null, tank: null, boss: null };

function mkSprite(size, fn) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.translate(size / 2, size / 2);
  fn(g, size);

  let sx = 0, sy = 0, sw = size, sh = size;
  try {
    const d = g.getImageData(0, 0, size, size).data;
    let minX = size, minY = size, maxX = -1, maxY = -1;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (d[(y * size + x) * 4 + 3] > 10) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX > minX && maxY > minY) {
      sx = minX; sy = minY; sw = maxX - minX + 1; sh = maxY - minY + 1;
    }
  } catch (e) {}

  const sil = document.createElement('canvas');
  sil.width = size; sil.height = size;
  const sg = sil.getContext('2d');
  sg.drawImage(c, 0, 0);
  sg.globalCompositeOperation = 'source-in';
  sg.fillStyle = '#02060a';
  sg.fillRect(0, 0, size, size);

  return { img: c, sil: sil, sx: sx, sy: sy, sw: sw, sh: sh };
}

function rr(g, x, y, w, h, r) {
  g.beginPath();
  if (g.roundRect) { g.roundRect(x, y, w, h, r); return; }
  g.moveTo(x + r, y);
  g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
  g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
  g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y);
  g.closePath();
}

/* ------------------------- ДЕСАНТНИК -------------------------
   Кадр задаётся фазой шага: ноги переставляются, корпус приседает,
   оружие покачивается. 4 кадра = читаемый цикл бега.
*/
function drawMarine(g, ph) {
  const s1 = Math.sin(ph * TAU);        // фаза левой ноги
  const s2 = Math.sin(ph * TAU + Math.PI);
  const lift = Math.abs(s1) * 1.6;      // корпус приподнимается на шаге

  // ранец
  g.fillStyle = '#151d10';
  rr(g, -20, 8, 40, 24, 9); g.fill();
  g.strokeStyle = '#060a04'; g.lineWidth = 2.5; g.stroke();
  g.fillStyle = '#2b3a22';
  rr(g, -12, 12, 10, 12, 3); g.fill();
  rr(g, 2, 12, 10, 12, 3); g.fill();

  // ноги: две, с фазовым смещением
  for (const side of [-1, 1]) {
    const ph2 = side < 0 ? s1 : s2;
    const ly = 12 - ph2 * 5;
    const lx = side * 11 + ph2 * 3;
    g.fillStyle = '#2b3a20';
    rr(g, lx - 7.5, ly, 15, 26, 7); g.fill();
    g.strokeStyle = '#050804'; g.lineWidth = 2.2; g.stroke();
    // наколенник
    g.fillStyle = '#4a6130';
    rr(g, lx - 6, ly + 11, 12, 6, 2.5); g.fill();
    g.strokeStyle = '#050804'; g.lineWidth = 1.2; g.stroke();
    // ботинок выступает за силуэт
    g.fillStyle = '#0b1008';
    rr(g, lx - 9.5, ly + 21, 19, 12, 4.5); g.fill();
    g.strokeStyle = '#050804'; g.lineWidth = 1.6; g.stroke();
    g.fillStyle = 'rgba(160,210,180,0.22)';
    rr(g, lx - 8, ly + 22.5, 16, 3, 1.5); g.fill();
  }

  g.save();
  g.translate(0, -lift);

  // корпус (сужается к поясу — пропадает эффект "блина")
  const tg = g.createLinearGradient(-22, -28, 18, 24);
  tg.addColorStop(0, '#8aa35e');
  tg.addColorStop(0.42, '#4d6331');
  tg.addColorStop(1, '#1b2612');
  g.beginPath();
  g.moveTo(-21, -20);
  g.quadraticCurveTo(-24, 0, -15, 16);
  g.lineTo(15, 16);
  g.quadraticCurveTo(24, 0, 21, -20);
  g.quadraticCurveTo(12, -28, 0, -28);
  g.quadraticCurveTo(-12, -28, -21, -20);
  g.closePath();
  g.fillStyle = tg; g.fill();
  g.strokeStyle = '#060a04'; g.lineWidth = 3; g.stroke();

  // нагрудные пластины
  for (const side of [-1, 1]) {
    const pg = g.createLinearGradient(side * 18, -22, side * 4, -2);
    pg.addColorStop(0, '#c2dd8b');
    pg.addColorStop(0.55, '#8aa75b');
    pg.addColorStop(1, '#42562b');
    g.fillStyle = pg;
    rr(g, side > 0 ? 1.5 : -17.5, -21, 16, 15, 5); g.fill();
    g.strokeStyle = 'rgba(5,9,3,0.85)'; g.lineWidth = 1.8; g.stroke();
  }
  // ремень и реактор
  g.fillStyle = '#101a0c';
  rr(g, -13, -4, 26, 7, 3); g.fill();
  g.fillStyle = '#0d150a';
  rr(g, -7, 1, 14, 11, 4); g.fill();
  g.fillStyle = 'rgba(140,255,225,0.95)';
  g.beginPath(); g.arc(0, 6, 3.2, 0, TAU); g.fill();
  g.globalAlpha = 0.45;
  g.fillStyle = '#8cffe1';
  g.beginPath(); g.arc(0, 6, 7, 0, TAU); g.fill();
  g.globalAlpha = 1;

  // руки, прижатые к оружию
  g.strokeStyle = '#3a4c22';
  g.lineWidth = 8;
  g.lineCap = 'round';
  g.beginPath(); g.moveTo(-19, -8); g.lineTo(-10, 4 + s1 * 1.2); g.stroke();
  g.beginPath(); g.moveTo(19, -8); g.lineTo(11, 4 + s2 * 1.2); g.stroke();
  g.lineCap = 'butt';
  g.fillStyle = '#26331a';
  g.strokeStyle = '#05080a';
  g.lineWidth = 1.8;
  for (const side of [-1, 1]) {
    g.beginPath(); g.arc(side * 8, 5, 5.5, 0, TAU); g.fill(); g.stroke();
  }

  // воротник
  g.fillStyle = '#0f170b';
  g.beginPath(); g.ellipse(0, -23, 11, 6, 0, 0, TAU); g.fill();

  // наплечники со смещением от шага
  for (const side of [-1, 1]) {
    const sy = -11 + (side < 0 ? s1 : s2) * 1.2;
    const sg = g.createRadialGradient(side * 21, sy - 6, 2, side * 24, sy, 15);
    sg.addColorStop(0, '#7d9a52');
    sg.addColorStop(0.5, '#3a4c26');
    sg.addColorStop(1, '#151d0f');
    g.fillStyle = sg;
    g.beginPath(); g.ellipse(side * 24, sy, 11, 13.5, side * 0.22, 0, TAU); g.fill();
    g.strokeStyle = '#060a04'; g.lineWidth = 2.4; g.stroke();
    g.strokeStyle = 'rgba(205,235,180,0.3)'; g.lineWidth = 1.6;
    g.beginPath(); g.ellipse(side * 24, sy, 8.5, 11, side * 0.22, Math.PI * 0.95, Math.PI * 1.42); g.stroke();
    g.fillStyle = '#2c3d1e';
    g.beginPath();
    g.moveTo(side * 24 - 5, sy - 11); g.lineTo(side * 24, sy - 19); g.lineTo(side * 24 + 5, sy - 11);
    g.closePath(); g.fill();
    g.strokeStyle = '#060a04'; g.lineWidth = 1.4; g.stroke();
  }

  // шлем
  const hg = g.createRadialGradient(-5, -36, 2, 0, -31, 18);
  hg.addColorStop(0, '#b6d189');
  hg.addColorStop(0.55, '#5d7c3b');
  hg.addColorStop(1, '#1c2712');
  g.fillStyle = hg;
  g.beginPath(); g.arc(0, -31, 14.5, 0, TAU); g.fill();
  g.strokeStyle = '#060a04'; g.lineWidth = 2.4; g.stroke();

  // визор
  g.fillStyle = '#170e00';
  rr(g, -11.5, -39.5, 23, 11, 5); g.fill();
  const vg = g.createLinearGradient(0, -39, 0, -28);
  vg.addColorStop(0, '#ffd873');
  vg.addColorStop(0.45, '#ff9f1c');
  vg.addColorStop(1, '#c25a06');
  g.fillStyle = vg;
  rr(g, -9.5, -38, 19, 8.5, 4); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.42)';
  rr(g, -7.5, -37, 5.5, 2, 1); g.fill();

  // подбородок и гребень
  g.fillStyle = '#33441f';
  rr(g, -3.5, -47, 7, 9, 2.5); g.fill();
  g.strokeStyle = '#060a04'; g.lineWidth = 1.4; g.stroke();
  g.fillStyle = '#1b2612';
  rr(g, -6, -25, 12, 4, 2); g.fill();

  // контровой свет
  g.globalAlpha = 0.45;
  g.strokeStyle = '#d8ffe9'; g.lineWidth = 2.2;
  g.beginPath(); g.arc(-7, -32, 14.5, Math.PI * 0.95, Math.PI * 1.45); g.stroke();
  g.beginPath(); g.arc(-9, -6, 21, Math.PI * 0.92, Math.PI * 1.5); g.stroke();
  g.globalAlpha = 1;

  g.restore();
}


/* Оружие с руками — отдельный слой, вращается по направлению на цель.
   Корпус при этом остаётся ориентированным "в камеру", как в Archero. */
function drawMarineGun(g, ph) {
  const s1 = Math.sin(ph * TAU);
  const s2 = Math.sin(ph * TAU + Math.PI);
  g.strokeStyle = '#3a4c22'; g.lineWidth = 7; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-20, -6); g.lineTo(-9, -20 + s1 * 1.5); g.stroke();
  g.beginPath(); g.moveTo(20, -4); g.lineTo(13, -18 + s2 * 1.5); g.stroke();
  g.lineCap = 'butt';

  // оружие
  g.save();
  g.translate(11, -4 + s2 * 0.8);
  g.fillStyle = '#1b2025';
  rr(g, -7.5, -70, 14, 58, 3); g.fill();
  g.strokeStyle = '#040708'; g.lineWidth = 2; g.stroke();
  g.fillStyle = '#333c43';
  rr(g, -4, -66, 7, 26, 2); g.fill();
  g.fillStyle = '#5c686f';
  rr(g, 4.6, -64, 2.6, 34, 1); g.fill();
  g.fillStyle = '#2a3136';
  rr(g, -3.5, -52, 15, 9, 2); g.fill();   // прицел
  g.fillStyle = '#9aa8b2';
  rr(g, -5.5, -77, 11, 9, 2); g.fill();
  g.strokeStyle = '#040708'; g.lineWidth = 1.2; g.stroke();
  g.fillStyle = 'rgba(140,255,190,0.95)';
  rr(g, -2, -40, 4, 13, 2); g.fill();
  g.fillStyle = '#20262a';
  rr(g, 5, -28, 8, 12, 2); g.fill();
  g.fillStyle = '#28341c';
  g.beginPath(); g.arc(2, -17, 5.5, 0, TAU); g.fill();
  g.strokeStyle = '#060a04'; g.lineWidth = 1.5; g.stroke();
  g.restore();

}

/* ------------------------- КСЕНОМОРФЫ -------------------------
   Злее: огромный вытянутый череп с пастью, острые когти, шипы,
   рёбра панциря, светящаяся слюна. Фаза анимирует лапы.
*/
/* Ксеноморф, вид 3/4 сверху: вытянутый череп, биомеханические рёбра,
   сегментированный хвост с клинком. Свет сверху-слева, холодный контровой. */
/* --- органика: полигон по осевой линии с переменной толщиной --- */
function chain(g, pts, widths, fill, rim) {
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[Math.min(pts.length - 1, i + 1)];
    const r = pts[Math.max(0, i - 1)];
    let dx = q[0] - r[0], dy = q[1] - r[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    const nx = -dy, ny = dx;
    const w = widths[i] * 0.5;
    L.push([p[0] + nx * w, p[1] + ny * w]);
    R.push([p[0] - nx * w, p[1] - ny * w]);
  }
  g.beginPath();
  g.moveTo(L[0][0], L[0][1]);
  for (let i = 1; i < L.length; i++) {
    const mx = (L[i - 1][0] + L[i][0]) / 2, my = (L[i - 1][1] + L[i][1]) / 2;
    g.quadraticCurveTo(L[i - 1][0], L[i - 1][1], mx, my);
  }
  const lastL = L[L.length - 1];
  g.lineTo(lastL[0], lastL[1]);
  // закруглённый кончик
  const pEnd = pts[pts.length - 1], pPrev = pts[pts.length - 2];
  const ang = Math.atan2(pEnd[1] - pPrev[1], pEnd[0] - pPrev[0]);
  const wEnd = widths[widths.length - 1] * 0.5;
  g.quadraticCurveTo(pEnd[0] + Math.cos(ang) * wEnd, pEnd[1] + Math.sin(ang) * wEnd,
                     R[R.length - 1][0], R[R.length - 1][1]);
  for (let i = R.length - 2; i >= 0; i--) {
    const mx = (R[i + 1][0] + R[i][0]) / 2, my = (R[i + 1][1] + R[i][1]) / 2;
    g.quadraticCurveTo(R[i + 1][0], R[i + 1][1], mx, my);
  }
  g.lineTo(R[0][0], R[0][1]);
  g.closePath();
  g.fillStyle = fill; g.fill();
  if (rim) {
    g.strokeStyle = rim; g.lineWidth = 1.1; g.stroke();
  }
}

/* Ксеноморф, вид 3/4 сверху. Анатомия: длинный череп вперёд, узкая талия,
   четыре конечности, хвост с клинком. Свет сверху-слева, холодный контровой. */
function drawAlien(g, o, ph) {
  const bw = o.bw || 30, bh = o.bh || 40;
  const accent = o.accent || '#8dff72';
  const hi = o.bodyHi || '#4a6a80';
  const mid = o.bodyMid || '#243642';
  const low = o.bodyLow || '#0a1116';
  const sw = Math.sin((ph || 0) * TAU);

  g.save();
  g.lineCap = 'round';
  g.lineJoin = 'round';

  /* контактная тень */
  const sh = g.createRadialGradient(bw * 0.1, bh * 0.5, 2, bw * 0.1, bh * 0.5, bw * 1.25);
  sh.addColorStop(0, 'rgba(0,0,0,0.55)');
  sh.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = sh;
  g.beginPath(); g.ellipse(bw * 0.1, bh * 0.5, bw * 1.25, bh * 0.45, 0, 0, TAU); g.fill();

  /* ---------- хвост: длинная дуга вправо-вверх, сужается к клинку ---------- */
  const tPts = [], tW = [];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    const x = bw * (0.15 + t * 1.05) + Math.sin(t * 2.4 + sw * 0.15) * bw * 0.25;
    const y = bh * (0.55 - t * 0.62);
    tPts.push([x, y]); tW.push((o.tail || 13) * (1 - t * 0.62));
  }
  chain(g, tPts, tW, low, 'rgba(120,175,205,0.18)');
  // клинок: широкий, с блеском по кромке
  const e = tPts[tPts.length - 1], pv = tPts[tPts.length - 2];
  const a2 = Math.atan2(e[1] - pv[1], e[0] - pv[0]);
  g.save();
  g.translate(e[0], e[1]); g.rotate(a2);
  const bl = g.createLinearGradient(0, 0, bw * 0.75, 0);
  bl.addColorStop(0, '#31434f'); bl.addColorStop(1, '#0a0f13');
  g.fillStyle = bl;
  g.beginPath();
  g.moveTo(-2, -tW[tW.length - 1] * 0.5);
  g.quadraticCurveTo(bw * 0.45, -tW[tW.length - 1] * 0.9, bw * 0.72, 6);
  g.quadraticCurveTo(bw * 0.34, tW[tW.length - 1] * 0.9, -2, tW[tW.length - 1] * 0.5);
  g.closePath(); g.fill();
  g.strokeStyle = accent; g.globalAlpha = 0.5; g.lineWidth = 1; g.stroke(); g.globalAlpha = 1;
  g.restore();

  /* ---------- задние лапы: бедро-колено-стопа, три сегмента ---------- */
  for (const side of [-1, 1]) {
    const hip = [side * bw * 0.26, bh * 0.30];
    const knee = [side * bw * 0.58, bh * 0.48 + sw * side * 2];
    const foot = [side * bw * 0.42, bh * 0.86 + sw * side * 3];
    chain(g, [hip, knee, foot], [bw * 0.58, bw * 0.38, bw * 0.22], mid, 'rgba(150,200,230,0.22)');
    // когти
    g.strokeStyle = 'rgba(180,210,230,0.55)'; g.lineWidth = 1.3;
    for (let k = -1; k <= 1; k++) {
      g.beginPath(); g.moveTo(foot[0] + k * 2.5, foot[1]);
      g.lineTo(foot[0] + k * 4.5 + side * 2, foot[1] + 8); g.stroke();
    }
  }

  /* ---------- туловище: узкая талия, рёбра, плечевые пластины ---------- */
  const spine = [
    [0, bh * 0.40], [0, bh * 0.20], [side0(0), -bh * 0.02],
    [0, -bh * 0.24], [0, -bh * 0.40]
  ];
  const wSpine = [bw * 0.44, bw * 0.50, bw * 0.60, bw * 0.58, bw * 0.40];
  const bodyGrad = g.createLinearGradient(-bw * 0.5, -bh * 0.3, bw * 0.45, bh * 0.4);
  bodyGrad.addColorStop(0, hi);
  bodyGrad.addColorStop(0.45, mid);
  bodyGrad.addColorStop(1, low);
  chain(g, spine, wSpine, bodyGrad, 'rgba(160,210,240,0.22)');

  /* рёбра */
  for (let i = 0; i < 4; i++) {
    const t = i / 3;
    const yy = -bh * 0.24 + t * bh * 0.50;
    const rw = bw * (0.10 + t * 0.42);
    g.strokeStyle = 'rgba(3,7,10,0.8)'; g.lineWidth = 2.2;
    g.beginPath(); g.moveTo(-rw, yy + 2.5); g.quadraticCurveTo(0, yy + 8, rw, yy + 2.5); g.stroke();
    g.strokeStyle = 'rgba(160,215,245,' + (0.34 - t * 0.14).toFixed(2) + ')'; g.lineWidth = 1.7;
    g.beginPath(); g.moveTo(-rw, yy); g.quadraticCurveTo(0, yy + 5.5, rw, yy); g.stroke();
  }
  /* позвоночный гребень */
  g.strokeStyle = 'rgba(185,230,255,0.28)'; g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(0, -bh * 0.34); g.lineTo(0, bh * 0.30); g.stroke();

  /* ---------- плечевые пластины ---------- */
  for (const side of [-1, 1]) {
    const sg = g.createLinearGradient(side * bw * 0.2, -bh * 0.42, side * bw * 0.6, -bh * 0.12);
    sg.addColorStop(0, hi); sg.addColorStop(1, low);
    g.fillStyle = sg;
    g.beginPath();
    g.moveTo(side * bw * 0.14, -bh * 0.40);
    g.quadraticCurveTo(side * bw * 0.56, -bh * 0.40, side * bw * 0.66, -bh * 0.16);
    g.quadraticCurveTo(side * bw * 0.44, -bh * 0.10, side * bw * 0.16, -bh * 0.22);
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(180,225,250,0.26)'; g.lineWidth = 1.1; g.stroke();
  }

  /* ---------- передние лапы: длинные, с локтем ---------- */
  for (const side of [-1, 1]) {
    const sh = [side * bw * 0.40, -bh * 0.26];
    const elb = [side * bw * 0.92, bh * 0.02 + sw * side * 2];
    const claw = [side * bw * 0.52, bh * 0.40 + sw * side * 3];
    chain(g, [sh, elb, claw], [bw * 0.34, bw * 0.24, bw * 0.14], mid, 'rgba(155,205,235,0.26)');
    g.strokeStyle = 'rgba(190,220,240,0.5)'; g.lineWidth = 1.2;
    for (let k = -1; k <= 1; k++) {
      g.beginPath(); g.moveTo(claw[0] + k * 2, claw[1]);
      g.lineTo(claw[0] + k * 3.5 + side * 2, claw[1] + 7.5); g.stroke();
    }
  }

  /* ---------- шея ---------- */
  const neckGrad = g.createLinearGradient(-bw * 0.2, -bh * 0.6, bw * 0.2, -bh * 0.3);
  neckGrad.addColorStop(0, hi); neckGrad.addColorStop(1, low);
  chain(g, [[0, -bh * 0.26], [0, -bh * 0.32]], [bw * 0.34, bw * 0.26], neckGrad, 'rgba(170,215,245,0.22)');

  /* горб за головой: силуэт перестаёт быть симметричным овалом */
  const hump = g.createLinearGradient(-bw * 0.3, -bh * 0.6, bw * 0.3, -bh * 0.2);
  hump.addColorStop(0, hi); hump.addColorStop(1, low);
  g.fillStyle = hump;
  g.beginPath();
  g.moveTo(-bw * 0.34, -bh * 0.30);
  g.quadraticCurveTo(0, -bh * 0.66, bw * 0.34, -bh * 0.30);
  g.quadraticCurveTo(0, -bh * 0.18, -bw * 0.34, -bh * 0.30);
  g.closePath(); g.fill();
  g.strokeStyle = 'rgba(185,228,250,0.25)'; g.lineWidth = 1; g.stroke();

  /* ---------- череп: длинный, наклонён вперёд ---------- */
  const tilt = -0.20;                       // наклон к цели
  const hx = 8, hy = -bh * 0.34;            // основание черепа
  g.save();
  g.translate(hx, hy);
  g.rotate(tilt);

  const HW = o.headW || 30, HL = o.headL || 64;
  const hg = g.createLinearGradient(-HW * 0.7, 0, HW * 0.5, -HL);
  hg.addColorStop(0, o.headHi || '#6f90a8');
  hg.addColorStop(0.4, o.headMid || '#31485a');
  hg.addColorStop(1, o.headLow || '#0a1015');

  // купол: от широкой затылочной части к узкому рылу
  g.beginPath();
  g.moveTo(0, -HL);
  g.bezierCurveTo(HW * 0.72, -HL * 0.78, HW * 0.66, -HL * 0.28, HW * 0.26, -HL * 0.06);
  g.quadraticCurveTo(0, 0, -HW * 0.26, -HL * 0.06);
  g.bezierCurveTo(-HW * 0.66, -HL * 0.28, -HW * 0.72, -HL * 0.78, 0, -HL);
  g.closePath();
  g.fillStyle = hg; g.fill();
  g.strokeStyle = 'rgba(180,225,250,0.30)'; g.lineWidth = 1.2; g.stroke();

  // глянцевый блик вдоль купола
  const gl = g.createLinearGradient(-HW * 0.3, -HL * 0.9, HW * 0.05, -HL * 0.2);
  gl.addColorStop(0, 'rgba(220,245,255,0.42)');
  gl.addColorStop(1, 'rgba(220,245,255,0)');
  g.fillStyle = gl;
  g.beginPath();
  g.ellipse(-HW * 0.12, -HL * 0.58, HW * 0.13, HL * 0.30, -0.12, 0, TAU);
  g.fill();

  // поперечные пластины
  for (let i = 1; i <= 3; i++) {
    const t = i / 4.4;
    const yy = -HL * (0.30 + t * 0.42);
    const wQ = HW * (0.52 - t * 0.20);
    g.strokeStyle = 'rgba(6,12,17,0.55)'; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(-wQ, yy + 2); g.quadraticCurveTo(0, yy + 4.5, wQ, yy + 2); g.stroke();
  }

  // два шипа назад
  g.fillStyle = low;
  for (const side of [-1, 1]) {
    g.beginPath();
    g.moveTo(side * HW * 0.30, -HL * 0.10);
    g.lineTo(side * HW * 0.62, HL * 0.10);
    g.lineTo(side * HW * 0.34, -HL * 0.02);
    g.closePath(); g.fill();
  }

  /* пасть и зубы */
  g.fillStyle = '#04080b';
  g.beginPath();
  g.moveTo(-HW * 0.20, -HL * 0.02);
  g.quadraticCurveTo(0, HL * 0.10, HW * 0.20, -HL * 0.02);
  g.quadraticCurveTo(0, -HL * 0.10, -HW * 0.20, -HL * 0.02);
  g.closePath(); g.fill();
  g.fillStyle = 'rgba(230,245,255,0.9)';
  for (let k = -2; k <= 2; k++) {
    const tx = k * HW * 0.072;
    g.beginPath();
    g.moveTo(tx - 1.1, -HL * 0.03);
    g.lineTo(tx, HL * 0.03);
    g.lineTo(tx + 1.1, -HL * 0.03);
    g.closePath(); g.fill();
  }
  const mg = g.createRadialGradient(0, 0, 1, 0, 0, HW * 0.4);
  mg.addColorStop(0, accent); mg.addColorStop(1, 'rgba(0,0,0,0)');
  g.globalAlpha = 0.20; g.fillStyle = mg;
  g.beginPath(); g.arc(0, 0, HW * 0.4, 0, TAU); g.fill(); g.globalAlpha = 1;

  /* глаза-щели */
  for (const side of [-1, 1]) {
    g.strokeStyle = 'rgba(2,6,9,0.9)'; g.lineWidth = 3;
    g.beginPath();
    g.moveTo(side * HW * 0.40, -HL * 0.44);
    g.lineTo(side * HW * 0.18, -HL * 0.40);
    g.stroke();
    g.strokeStyle = accent; g.globalAlpha = 0.8; g.lineWidth = 1.1;
    g.beginPath();
    g.moveTo(side * HW * 0.38, -HL * 0.435);
    g.lineTo(side * HW * 0.20, -HL * 0.405);
    g.stroke(); g.globalAlpha = 1;
  }
  g.restore();

  g.restore();
}
function side0(v) { return v; }

function drawQueen(g, opts) {
  const o = opts || {};
  g.fillStyle = o.crown || '#1d2f21';
  for (let i = -2; i <= 2; i++) {
    g.beginPath();
    g.moveTo(i * 9 - 4, -52);
    g.lineTo(i * 9, -52 - 22 + Math.abs(i) * 7);
    g.lineTo(i * 9 + 4, -52);
    g.closePath();
    g.fill();
  }
  drawAlien(g, {
    bw: o.bw || 30, bh: o.bh || 40, headL: o.headL || 42, headW: o.headW || 22, spike: 4,
    accent: o.accent || '#c9ff5a', dark: o.dark || '#0c1810', bodyHi: o.bodyHi || '#38583c',
    tail: 9, limbW: 7
  }, 0.25);

  g.strokeStyle = 'rgba(160,255,140,0.3)';
  g.lineWidth = 2.4;
  for (let i = -1; i <= 2; i++) {
    g.beginPath();
    g.ellipse(0, i * 11, 24, 7, 0, 0.15 * Math.PI, 0.85 * Math.PI);
    g.stroke();
  }
  const core = o.core || '200,255,120';
  const cg = g.createRadialGradient(0, 4, 1, 0, 4, 22);
  cg.addColorStop(0, 'rgba(' + core + ',0.6)');
  cg.addColorStop(1, 'rgba(' + core + ',0)');
  g.fillStyle = cg;
  g.beginPath(); g.arc(0, 4, 22, 0, TAU); g.fill();
}

/* ------------------------- СБОРКА ------------------------- */
const Sprites = {
  ready: false,
  init() {
    if (this.ready) return;

    // 4 кадра шага у десантника + отдельный слой оружия
    SPR.marine = [0, 0.25, 0.5, 0.75].map(ph => mkSprite(140, g => drawMarine(g, ph)));
    SPR.marineGun = [0, 0.5].map(ph => mkSprite(140, g => drawMarineGun(g, ph)));

    // у монстров по 2 кадра — перебирают лапами
    const alienPair = (size, opts) => [0, 0.5].map(ph => mkSprite(size, g => drawAlien(g, opts, ph)));

    SPR.grunt = alienPair(112, {
      bw: 18, bh: 24, headL: 30, headW: 13,
      accent: '#a6ff86', tail: 6, bodyHi: '#5d9a74', bodyMid: '#2f4d3f', bodyLow: '#0d1a16'
    });
    SPR.swarm = alienPair(88, {
      bw: 12, bh: 15, headL: 20, headW: 11,
      accent: '#dcff78', tail: 5, limbW: 4, dark: '#12210f', bodyHi: '#5c873f', bodyMid: '#31452a', bodyLow: '#0f1a0c'
    });
    SPR.shooter = alienPair(112, {
      bw: 17, bh: 23, headL: 29, headW: 13, spike: 3,
      accent: '#7dffc4', tail: 6, bodyHi: '#55997a', bodyMid: '#2a4a3f', bodyLow: '#0c1a18'
    });
    SPR.tank = alienPair(140, {
      bw: 26, bh: 32, headL: 28, headW: 17, spike: 5,
      accent: '#63ffb4', tail: 9, limbW: 7, bodyHi: '#63a385', bodyMid: '#325045', bodyLow: '#0e1b19'
    });
    SPR.boss = [mkSprite(196, drawQueen)];
    SPR.matka = [mkSprite(200, g => drawQueen(g, {
      accent: '#ffb35c', dark: '#1a1208', bodyHi: '#5c4326', crown: '#3a2a12', core: '255,190,90',
      bw: 34, bh: 44, headL: 38, headW: 26
    }))];
    SPR.matriarch = [mkSprite(220, g => drawQueen(g, {
      accent: '#e6b3ff', dark: '#140a1c', bodyHi: '#4a3562', crown: '#2a1636', core: '220,170,255',
      bw: 38, bh: 50, headL: 46, headW: 28
    }))];

    this.ready = true;
  }
};

/* Рисует кадр спрайта с поворотом по направлению (спрайт смотрит вверх). */
function drawRotatedSprite(frames, x, y, size, angle, flash, phase) {
  if (!frames) return;
  let spr = frames;
  if (Array.isArray(frames)) {
    const i = Math.floor((phase || 0) * frames.length) % frames.length;
    spr = frames[(i + frames.length) % frames.length];
  }
  if (!spr) return;
  const h = size;
  const w = size * (spr.sw / spr.sh);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + Math.PI / 2);

  const off = Math.max(1, size * 0.022);
  if (spr.sil) {
    const pts = [[-off, 0], [off, 0], [0, -off], [0, off]];
    for (let i = 0; i < pts.length; i++) {
      ctx.drawImage(spr.sil, spr.sx, spr.sy, spr.sw, spr.sh,
        -w / 2 + pts[i][0], -h / 2 + pts[i][1], w, h);
    }
  }
  if (flash && flash > 0.03) ctx.filter = 'brightness(' + (1 + flash * 1.7).toFixed(2) + ')';
  ctx.drawImage(spr.img, spr.sx, spr.sy, spr.sw, spr.sh, -w / 2, -h / 2, w, h);
  ctx.restore();
}
