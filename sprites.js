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
function drawAlien(g, o, ph) {
  const bw = o.bw, bh = o.bh, headL = o.headL, headW = o.headW;
  const accent = o.accent || '#8dff72';
  const dark = o.dark || '#070d0c';
  const chitin = o.bodyHi || '#2c4150';
  const limb = o.limb || '#101a1f';
  const sw = Math.sin((ph || 0) * TAU);
  const lw = o.limbW || 5.5;

  g.lineCap = 'round';
  g.lineJoin = 'round';

  /* ---------- хвост: сегментированный, с клинком ---------- */
  const segs = 7;
  for (let s = segs; s >= 0; s--) {
    const t = s / segs;
    const x = Math.sin(t * 2.2 + sw * 0.12) * bw * 0.55 + bw * (0.25 + t * 0.55);
    const y = bh * (0.55 + t * 1.05);
    const w = (o.tail || 6) * (1 - t * 0.72);
    g.strokeStyle = t > 0.75 ? '#141f27' : '#16222b';
    g.lineWidth = Math.max(1.2, w);
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.sin(t * 3.1) * 4, y + bh * 0.16);
    g.stroke();
  }
  // клинок на конце
  g.fillStyle = '#0d151a';
  g.beginPath();
  g.moveTo(bw * 0.92, bh * 1.56);
  g.lineTo(bw * 1.22, bh * 1.78);
  g.lineTo(bw * 1.02, bh * 1.86);
  g.closePath();
  g.fill();
  g.strokeStyle = accent; g.globalAlpha = 0.5; g.lineWidth = 1.2; g.stroke(); g.globalAlpha = 1;

  /* ---------- ноги: дигитиграйд ---------- */
  for (const s of [-1, 1]) {
    const swing = sw * s * 3.4;
    g.fillStyle = '#101a21';
    g.beginPath(); g.arc(s * bw * 0.42, bh * 0.30, lw * 0.95, 0, TAU); g.fill();
    g.strokeStyle = limb;
    g.lineWidth = lw;
    g.beginPath();
    g.moveTo(s * bw * 0.42, bh * 0.30);
    g.lineTo(s * bw * 0.88, bh * 0.56 + swing);
    g.lineTo(s * bw * 0.62, bh * 0.86 + swing);
    g.lineTo(s * bw * 0.70, bh * 1.02 + swing);
    g.stroke();
    // когти
    g.strokeStyle = '#8fa2ac'; g.globalAlpha = 0.36; g.lineWidth = 1.1;
    for (let k = -1; k <= 1; k++) {
      g.beginPath();
      g.moveTo(s * bw * 0.70, bh * 1.00 + swing);
      g.lineTo(s * bw * (0.62 + k * 0.12), bh * 1.20 + swing);
      g.stroke();
    }
    g.globalAlpha = 1;
  }

  /* ---------- торс: узкая талия, широкие плечи ---------- */
  const bg = g.createLinearGradient(-bw * 0.6, -bh * 0.5, bw * 0.5, bh * 0.5);
  bg.addColorStop(0, chitin);
  bg.addColorStop(0.45, '#152129');
  bg.addColorStop(1, '#060b0e');
  g.fillStyle = bg;
  g.beginPath();
  g.moveTo(0, -bh * 0.62);
  g.bezierCurveTo(bw * 0.72, -bh * 0.5, bw * 0.62, -bh * 0.05, bw * 0.42, bh * 0.34);
  g.bezierCurveTo(bw * 0.30, bh * 0.60, -bw * 0.30, bh * 0.60, -bw * 0.42, bh * 0.34);
  g.bezierCurveTo(-bw * 0.62, -bh * 0.05, -bw * 0.72, -bh * 0.5, 0, -bh * 0.62);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(130,185,215,0.18)';
  g.lineWidth = 1.6;
  g.stroke();

  /* рёбра-шевроны */
  g.strokeStyle = 'rgba(150,200,215,0.12)';
  g.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const y = -bh * 0.30 + i * bh * 0.19;
    const w = bw * (0.52 - i * 0.07);
    g.beginPath();
    g.moveTo(-w, y);
    g.quadraticCurveTo(0, y + bh * 0.11, w, y);
    g.stroke();
  }

  /* блик по панцирю */
  g.strokeStyle = 'rgba(190,235,255,0.30)';
  g.lineWidth = 2.4;
  g.beginPath();
  g.moveTo(-bw * 0.16, -bh * 0.55);
  g.quadraticCurveTo(-bw * 0.55, -bh * 0.22, -bw * 0.34, bh * 0.26);
  g.stroke();

  /* дорсальные трубки за спиной */
  if (o.spike) {
    for (let i = 0; i < o.spike; i++) {
      const px = (i - (o.spike - 1) / 2) * bw * 0.34;
      const py = -bh * 0.52;
      const len = headL * (0.34 + (i % 2) * 0.12);
      g.strokeStyle = '#0a1116';
      g.lineWidth = 6.5;
      g.beginPath();
      g.moveTo(px, py);
      g.quadraticCurveTo(px * 1.35, py - len * 0.75, px * 1.15, py - len);
      g.stroke();
      g.strokeStyle = 'rgba(160,210,225,0.28)';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(px, py);
      g.quadraticCurveTo(px * 1.35, py - len * 0.75, px * 1.15, py - len);
      g.stroke();
    }
  }

  /* ---------- руки: длинные, с когтями ---------- */
  for (const s of [-1, 1]) {
    const swing = -sw * s * 2.4;
    g.strokeStyle = limb;
    g.lineWidth = lw * 0.85;
    g.beginPath();
    g.moveTo(s * bw * 0.52, -bh * 0.42);
    g.lineTo(s * bw * 1.02, -bh * 0.34 + swing);
    g.lineTo(s * bw * 1.22, bh * 0.06 + swing);
    g.stroke();
    g.strokeStyle = '#8fa2ac'; g.globalAlpha = 0.34; g.lineWidth = 1.1;
    for (let k = -1; k <= 1; k++) {
      g.beginPath();
      g.moveTo(s * bw * 1.22, bh * 0.05 + swing);
      g.lineTo(s * bw * (1.34 + k * 0.06), bh * (0.20 + k * 0.05) + swing);
      g.stroke();
    }
    g.globalAlpha = 1;
  }

  /* ---------- шея ---------- */
  g.strokeStyle = '#0b1318';
  g.lineWidth = lw * 1.5;
  g.beginPath();
  g.moveTo(0, -bh * 0.58);
  g.lineTo(0, -bh * 0.82);
  g.stroke();

  /* ---------- череп: вытянутый купол без глаз ---------- */
  const hy = -bh * 0.78;
  const hg = g.createLinearGradient(-headW * 0.6, hy - headL * 0.4, headW * 0.7, hy + headL * 0.2);
  hg.addColorStop(0, '#2a3d49');
  hg.addColorStop(0.45, '#0b141a');
  hg.addColorStop(1, '#020609');
  g.fillStyle = hg;
  g.beginPath();
  g.moveTo(0, hy - headL);
  g.bezierCurveTo(headW * 1.05, hy - headL * 0.55, headW * 0.86, hy + headL * 0.12, headW * 0.34, hy + headL * 0.30);
  g.lineTo(headW * 0.30, hy + headL * 0.46);
  g.lineTo(0, hy + headL * 0.34);
  g.lineTo(-headW * 0.30, hy + headL * 0.46);
  g.lineTo(-headW * 0.34, hy + headL * 0.30);
  g.bezierCurveTo(-headW * 0.86, hy + headL * 0.12, -headW * 1.05, hy - headL * 0.55, 0, hy - headL);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(140,195,225,0.20)';
  g.lineWidth = 1.6;
  g.stroke();

  /* глянцевый блик по куполу */
  const sheen = g.createLinearGradient(-headW * 0.5, hy - headL * 0.9, -headW * 0.1, hy - headL * 0.2);
  sheen.addColorStop(0, 'rgba(190,230,250,0.16)');
  sheen.addColorStop(1, 'rgba(190,230,250,0)');
  g.fillStyle = sheen;
  g.beginPath();
  g.moveTo(-headW * 0.12, hy - headL * 0.96);
  g.bezierCurveTo(-headW * 0.72, hy - headL * 0.62, -headW * 0.62, hy - headL * 0.1, -headW * 0.26, hy + headL * 0.2);
  g.bezierCurveTo(-headW * 0.44, hy - headL * 0.15, -headW * 0.42, hy - headL * 0.55, -headW * 0.06, hy - headL * 0.9);
  g.closePath();
  g.fill();

  /* пасть с внутренними зубами */
  g.fillStyle = '#04090b';
  g.beginPath();
  g.ellipse(0, hy + headL * 0.34, headW * 0.30, headL * 0.15, 0, 0, TAU);
  g.fill();
  g.fillStyle = '#dfe9ee';
  for (let k = -2; k <= 2; k++) {
    g.beginPath();
    g.moveTo(k * headW * 0.10, hy + headL * 0.30);
    g.lineTo(k * headW * 0.10 + 1.6, hy + headL * 0.38);
    g.lineTo(k * headW * 0.10 - 1.6, hy + headL * 0.38);
    g.closePath();
    g.fill();
  }

  /* гребень по куполу */
  g.strokeStyle = 'rgba(120,175,205,0.22)';
  g.lineWidth = 1.6;
  for (let i = 0; i < 5; i++) {
    const t = 0.16 + i * 0.16;
    const yy = hy - headL * (0.92 - t * 0.9);
    const hw = headW * (0.24 + t * 0.30);
    g.beginPath();
    g.moveTo(-hw * 0.55, yy);
    g.quadraticCurveTo(0, yy - headL * 0.05, hw * 0.55, yy);
    g.stroke();
  }
}


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
      accent: '#8dff72', tail: 5, bodyHi: '#3a6a4e'
    });
    SPR.swarm = alienPair(88, {
      bw: 12, bh: 15, headL: 20, headW: 11,
      accent: '#d4ff5c', tail: 4, limbW: 4, dark: '#0e1a10', bodyHi: '#3a5c2c'
    });
    SPR.shooter = alienPair(112, {
      bw: 17, bh: 23, headL: 29, headW: 13, spike: 3,
      accent: '#5effb0', tail: 5, bodyHi: '#356b52'
    });
    SPR.tank = alienPair(140, {
      bw: 26, bh: 32, headL: 28, headW: 17, spike: 5,
      accent: '#3dff9a', tail: 7, limbW: 7, bodyHi: '#43745a'
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
