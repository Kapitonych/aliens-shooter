/* front_sprites.js — ксеноморфы в фронтальном виде, для 3D-режима.
   Спрайты основной игры нарисованы видом сверху: в первом лице они
   читаются как «купола», поэтому для 3D нужен отдельный набор. */
(function () {
  const FRONT = {};

  function scene(g, W, H, o) {
    const cx = W / 2;
    const groundY = H - 12;
    const s = o.scale || 1;
    const hipY = groundY - 74 * s;
    const chestY = groundY - 142 * s;
    const neckY = groundY - 166 * s;
    const headY = groundY - 198 * s;
    const shoulderW = 37 * s;
    const waistW = 19 * s;
    const limbW = 12.5 * s;
    const base = o.base || '#0b1218';
    const mid = o.mid || '#18262f';
    const hi = o.hi || '#33495a';
    const accent = o.accent || '120,220,255';
    const rim = 'rgba(150,205,235,0.28)';
    const swing = o.swing || 0;

    g.lineCap = 'round';
    g.lineJoin = 'round';

    /* ---------- хвост ---------- */
    g.strokeStyle = '#101a22';
    g.lineWidth = 8 * s;
    g.beginPath();
    g.moveTo(cx + 4 * s, hipY + 8 * s);
    g.bezierCurveTo(cx + 52 * s, hipY + 26 * s, cx + 58 * s, hipY + 66 * s, cx + 30 * s, groundY - 2 * s);
    g.stroke();
    g.strokeStyle = rim;
    g.lineWidth = 1.4 * s;
    g.beginPath();
    g.moveTo(cx + 6 * s, hipY + 10 * s);
    g.bezierCurveTo(cx + 50 * s, hipY + 28 * s, cx + 55 * s, hipY + 64 * s, cx + 29 * s, groundY - 3 * s);
    g.stroke();
    // клинок
    g.fillStyle = '#18262e';
    g.beginPath();
    g.moveTo(cx + 30 * s, groundY - 2 * s);
    g.lineTo(cx + 14 * s, groundY + 12 * s);
    g.lineTo(cx + 33 * s, groundY + 14 * s);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(' + accent + ',0.5)';
    g.lineWidth = 1.2 * s;
    g.stroke();

    /* ---------- ноги ---------- */
    for (const side of [-1, 1]) {
      const ph = side > 0 ? swing : -swing;
      const hipX = cx + side * 15 * s;
      const kneeX = cx + side * 30 * s;
      const kneeY = groundY - 42 * s + ph * 4 * s;
      const ankleX = cx + side * 18 * s;
      const ankleY = groundY - 13 * s - ph * 3 * s;
      // бедро толще голени
      g.strokeStyle = base;
      g.lineWidth = limbW * 1.35;
      g.beginPath();
      g.moveTo(hipX, hipY);
      g.lineTo(kneeX, kneeY + 6 * s);
      g.stroke();
      g.lineWidth = limbW * 0.95;
      g.beginPath();
      g.moveTo(kneeX, kneeY + 6 * s);
      g.lineTo(ankleX, ankleY);
      g.stroke();
      // свет по передней кромке
      g.strokeStyle = rim;
      g.lineWidth = 1.5 * s;
      g.beginPath();
      g.moveTo(hipX, hipY);
      g.lineTo(kneeX, kneeY + 4 * s);
      g.stroke();
      // ступня
      g.strokeStyle = '#0d171d';
      g.lineWidth = 6 * s;
      g.beginPath();
      g.moveTo(ankleX, ankleY);
      g.lineTo(ankleX + side * 5 * s, groundY - 2 * s);
      g.stroke();
      g.strokeStyle = 'rgba(190,215,225,0.32)';
      g.lineWidth = 1.2 * s;
      for (let k = -1; k <= 1; k += 2) {
        g.beginPath();
        g.moveTo(ankleX + side * 5 * s, groundY - 4 * s);
        g.lineTo(ankleX + side * 5 * s + k * 3 * s, groundY + 2 * s);
        g.stroke();
      }
    }

    /* ---------- торс ---------- */
    const tg = g.createLinearGradient(cx - shoulderW, chestY, cx + shoulderW, hipY);
    tg.addColorStop(0, hi);
    tg.addColorStop(0.42, mid);
    tg.addColorStop(1, '#05090c');
    g.fillStyle = tg;
    g.beginPath();
    g.moveTo(cx - shoulderW, chestY);
    g.bezierCurveTo(cx - shoulderW - 2 * s, chestY + 30 * s, cx - waistW - 5 * s, chestY + 58 * s, cx - waistW, hipY - 8 * s);
    g.lineTo(cx + waistW, hipY - 8 * s);
    g.bezierCurveTo(cx + waistW + 5 * s, chestY + 58 * s, cx + shoulderW + 2 * s, chestY + 30 * s, cx + shoulderW, chestY);
    g.bezierCurveTo(cx + 16 * s, chestY - 10 * s, cx - 16 * s, chestY - 10 * s, cx - shoulderW, chestY);
    g.closePath();
    g.fill();
    g.strokeStyle = rim;
    g.lineWidth = 1.4 * s;
    g.stroke();

    /* скульптурные рёбра: тёмная канавка + светлая кромка сверху */
    for (let i = 0; i < 5; i++) {
      const y = chestY + 12 * s + i * 13 * s;
      const w = (shoulderW - 4 - i * 2.4) * s;
      g.strokeStyle = 'rgba(2,5,8,0.78)';
      g.lineWidth = 3.4 * s;
      g.beginPath();
      g.moveTo(cx - w, y);
      g.quadraticCurveTo(cx, y + 11 * s, cx + w, y);
      g.stroke();
      g.strokeStyle = 'rgba(175,215,235,0.16)';
      g.lineWidth = 1.4 * s;
      g.beginPath();
      g.moveTo(cx - w, y - 2 * s);
      g.quadraticCurveTo(cx, y + 5.5 * s, cx + w, y - 2 * s);
      g.stroke();
    }
    /* грудина */
    g.strokeStyle = 'rgba(2,5,8,0.6)';
    g.lineWidth = 2.4 * s;
    g.beginPath();
    g.moveTo(cx, chestY + 8 * s);
    g.lineTo(cx, hipY - 12 * s);
    g.stroke();

    /* ---------- плечевые пластины ---------- */
    for (const side of [-1, 1]) {
      const px = cx + side * (shoulderW - 2 * s);
      g.fillStyle = mid;
      g.beginPath();
      g.moveTo(px - side * 4 * s, chestY - 8 * s);
      g.lineTo(px + side * 16 * s, chestY - 2 * s);
      g.lineTo(px + side * 13 * s, chestY + 16 * s);
      g.lineTo(px - side * 6 * s, chestY + 10 * s);
      g.closePath();
      g.fill();
      g.strokeStyle = rim;
      g.lineWidth = 1.3 * s;
      g.stroke();
      // шип на плече
      g.fillStyle = '#0b1419';
      g.beginPath();
      g.moveTo(px + side * 12 * s, chestY - 4 * s);
      g.lineTo(px + side * 22 * s, chestY - 16 * s);
      g.lineTo(px + side * 15 * s, chestY + 3 * s);
      g.closePath();
      g.fill();
    }

    /* ---------- дорсальные трубки (за плечами) ---------- */
    for (const side of [-1, 1]) {
      for (let k = 0; k < 2; k++) {
        const bx = cx + side * (12 + k * 8) * s;
        const by = chestY - 6 * s;
        g.strokeStyle = '#0a1218';
        g.lineWidth = 7 * s;
        g.beginPath();
        g.moveTo(bx, by);
        g.quadraticCurveTo(bx + side * 14 * s, by - 22 * s, bx + side * 20 * s, by - 36 * s + k * 7 * s);
        g.stroke();
        g.strokeStyle = 'rgba(150,200,230,0.22)';
        g.lineWidth = 1.4 * s;
        g.beginPath();
        g.moveTo(bx, by - 1 * s);
        g.quadraticCurveTo(bx + side * 14 * s, by - 23 * s, bx + side * 20 * s, by - 37 * s + k * 7 * s);
        g.stroke();
      }
    }

    /* ---------- руки ---------- */
    for (const side of [-1, 1]) {
      const ph = side > 0 ? -swing : swing;
      const sx = cx + side * (shoulderW - 4 * s);
      g.strokeStyle = base;
      g.lineWidth = limbW * 0.95;
      g.beginPath();
      g.moveTo(sx, chestY + 6 * s);
      g.lineTo(cx + side * (shoulderW + 9 * s), chestY + 34 * s + ph * 3 * s);
      g.stroke();
      g.lineWidth = limbW * 0.8;
      g.beginPath();
      g.moveTo(cx + side * (shoulderW + 9 * s), chestY + 34 * s + ph * 3 * s);
      g.lineTo(cx + side * (shoulderW + 3 * s), chestY + 62 * s + ph * 5 * s);
      g.stroke();
      g.strokeStyle = 'rgba(190,215,225,0.30)';
      g.lineWidth = 1.3 * s;
      for (let k = -1; k <= 1; k++) {
        g.beginPath();
        g.moveTo(cx + side * (shoulderW + 3 * s), chestY + 62 * s + ph * 5 * s);
        g.lineTo(cx + side * (shoulderW + 3 * s) + k * 3 * s, chestY + 72 * s + ph * 5 * s);
        g.stroke();
      }
    }

    /* ---------- шея ---------- */
    g.strokeStyle = '#0a1116';
    g.lineWidth = 9 * s;
    g.beginPath();
    g.moveTo(cx, chestY - 2 * s);
    g.lineTo(cx + 1 * s, neckY);
    g.stroke();

    /* ---------- череп ---------- */
    const hw = 19 * s, hh = 28 * s;
    const hg = g.createLinearGradient(cx - hw, headY - hh, cx + hw, headY + hh);
    hg.addColorStop(0, '#3a5162');
    hg.addColorStop(0.42, '#101b23');
    hg.addColorStop(1, '#02060a');
    g.fillStyle = hg;
    g.beginPath();
    g.moveTo(cx + 2 * s, headY - hh * 1.06);
    g.bezierCurveTo(cx + hw * 0.9, headY - hh * 0.45, cx + hw * 1.02, headY + hh * 0.30, cx + hw * 0.52, headY + hh * 0.78);
    g.lineTo(cx + hw * 0.40, headY + hh * 1.12);
    g.lineTo(cx - hw * 0.40, headY + hh * 1.12);
    g.lineTo(cx - hw * 0.52, headY + hh * 0.78);
    g.bezierCurveTo(cx - hw * 1.02, headY + hh * 0.30, cx - hw * 0.9, headY - hh * 0.45, cx + 2 * s, headY - hh * 1.06);
    g.closePath();
    g.fill();
    g.strokeStyle = rim;
    g.lineWidth = 1.5 * s;
    g.stroke();

    /* гребень по куполу */
    g.strokeStyle = 'rgba(6,12,16,0.8)';
    g.lineWidth = 3.4 * s;
    g.beginPath();
    g.moveTo(cx + 2 * s, headY - hh * 1.02);
    g.quadraticCurveTo(cx - 8 * s, headY - hh * 0.2, cx - 2 * s, headY + hh * 0.6);
    g.stroke();
    g.strokeStyle = 'rgba(180,220,240,0.20)';
    g.lineWidth = 1.6 * s;
    g.beginPath();
    g.moveTo(cx + 5 * s, headY - hh * 1.0);
    g.quadraticCurveTo(cx - 5 * s, headY - hh * 0.2, cx + 1 * s, headY + hh * 0.6);
    g.stroke();

    /* глянец узкой полосой по левой скуле */
    const sg = g.createLinearGradient(cx - hw * 0.7, headY - hh * 0.9, cx - hw * 0.2, headY + hh * 0.5);
    sg.addColorStop(0, 'rgba(205,240,255,0.28)');
    sg.addColorStop(1, 'rgba(205,240,255,0)');
    g.fillStyle = sg;
    g.beginPath();
    g.moveTo(cx - hw * 0.10, headY - hh * 0.96);
    g.bezierCurveTo(cx - hw * 0.68, headY - hh * 0.5, cx - hw * 0.72, headY + hh * 0.2, cx - hw * 0.44, headY + hh * 0.66);
    g.bezierCurveTo(cx - hw * 0.52, headY + hh * 0.1, cx - hw * 0.48, headY - hh * 0.5, cx - hw * 0.06, headY - hh * 0.9);
    g.closePath();
    g.fill();

    /* пасть: тёмная щель с редкими зубами */
    g.fillStyle = '#04080b';
    g.beginPath();
    g.ellipse(cx, headY + hh * 0.82, hw * 0.46, hh * 0.20, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(150,190,210,0.18)';
    g.lineWidth = 1.2 * s;
    g.stroke();
    g.fillStyle = 'rgba(215,228,235,0.62)';
    for (let k = -1; k <= 1; k++) {
      g.beginPath();
      g.moveTo(cx + k * hw * 0.20, headY + hh * 0.72);
      g.lineTo(cx + k * hw * 0.20 + 1.6 * s, headY + hh * 0.90);
      g.lineTo(cx + k * hw * 0.20 - 1.6 * s, headY + hh * 0.90);
      g.closePath();
      g.fill();
    }

    /* акцент: полоска над пастью — цвет типа */
    g.strokeStyle = 'rgba(' + accent + ',0.75)';
    g.lineWidth = 2 * s;
    g.beginPath();
    g.moveTo(cx - hw * 0.5, headY + hh * 0.62);
    g.quadraticCurveTo(cx, headY + hh * 0.70, cx + hw * 0.5, headY + hh * 0.62);
    g.stroke();

    /* акцент: ядро в груди */
    const core = g.createRadialGradient(cx, chestY + 34 * s, 0, cx, chestY + 34 * s, 12 * s);
    core.addColorStop(0, 'rgba(' + accent + ',0.45)');
    core.addColorStop(1, 'rgba(' + accent + ',0)');
    g.fillStyle = core;
    g.beginPath();
    g.arc(cx, chestY + 34 * s, 12 * s, 0, Math.PI * 2);
    g.fill();
  }

  /* ---------- босс: крупный ксеноморф с короной ---------- */
  function bossScene(g, W, H, o) {
    const cx = W / 2;
    const groundY = H - 10;
    const s = o.scale || 1.3;
    const hipY = groundY - 96 * s;
    const chestY = groundY - 168 * s;
    const neckY = groundY - 196 * s;
    const headY = groundY - 236 * s;
    const shoulderW = 52 * s;
    const waistW = 26 * s;
    const limbW = 15 * s;
    const base = o.base || '#090e12';
    const mid = o.mid || '#151d24';
    const hi = o.hi || '#33495a';
    const accent = o.accent || '200,255,120';
    const rim = 'rgba(160,210,240,0.26)';

    g.lineCap = 'round';
    g.lineJoin = 'round';

    /* хвост с шипами */
    g.strokeStyle = '#0d151b';
    g.lineWidth = 11 * s;
    g.beginPath();
    g.moveTo(cx + 6 * s, hipY + 10 * s);
    g.bezierCurveTo(cx + 66 * s, hipY + 30 * s, cx + 74 * s, hipY + 84 * s, cx + 34 * s, groundY + 2 * s);
    g.stroke();
    g.strokeStyle = rim;
    g.lineWidth = 1.6 * s;
    g.beginPath();
    g.moveTo(cx + 8 * s, hipY + 12 * s);
    g.bezierCurveTo(cx + 64 * s, hipY + 32 * s, cx + 70 * s, hipY + 82 * s, cx + 33 * s, groundY);
    g.stroke();
    g.fillStyle = '#1a2831';
    g.beginPath();
    g.moveTo(cx + 34 * s, groundY);
    g.lineTo(cx + 12 * s, groundY + 18 * s);
    g.lineTo(cx + 38 * s, groundY + 20 * s);
    g.closePath();
    g.fill();

    /* ноги */
    for (const side of [-1, 1]) {
      const hipX = cx + side * 22 * s;
      const kneeX = cx + side * 44 * s;
      const kneeY = groundY - 56 * s;
      const ankleX = cx + side * 26 * s;
      const ankleY = groundY - 14 * s;
      g.strokeStyle = base;
      g.lineWidth = limbW * 1.5;
      g.beginPath();
      g.moveTo(hipX, hipY);
      g.lineTo(kneeX, kneeY + 8 * s);
      g.stroke();
      g.lineWidth = limbW;
      g.beginPath();
      g.moveTo(kneeX, kneeY + 8 * s);
      g.lineTo(ankleX, ankleY);
      g.stroke();
      g.strokeStyle = rim;
      g.lineWidth = 1.6 * s;
      g.beginPath();
      g.moveTo(hipX, hipY);
      g.lineTo(kneeX, kneeY + 5 * s);
      g.stroke();
      g.strokeStyle = 'rgba(200,220,230,0.34)';
      g.lineWidth = 1.4 * s;
      for (let k = -1; k <= 1; k += 2) {
        g.beginPath();
        g.moveTo(ankleX, groundY - 5 * s);
        g.lineTo(ankleX + k * 5 * s, groundY + 3 * s);
        g.stroke();
      }
    }

    /* торс */
    const tg = g.createLinearGradient(cx - shoulderW, chestY, cx + shoulderW, hipY);
    tg.addColorStop(0, hi);
    tg.addColorStop(0.4, mid);
    tg.addColorStop(1, '#04080b');
    g.fillStyle = tg;
    g.beginPath();
    g.moveTo(cx - shoulderW, chestY);
    g.bezierCurveTo(cx - shoulderW - 4 * s, chestY + 40 * s, cx - waistW - 8 * s, chestY + 76 * s, cx - waistW, hipY - 10 * s);
    g.lineTo(cx + waistW, hipY - 10 * s);
    g.bezierCurveTo(cx + waistW + 8 * s, chestY + 76 * s, cx + shoulderW + 4 * s, chestY + 40 * s, cx + shoulderW, chestY);
    g.bezierCurveTo(cx + 22 * s, chestY - 14 * s, cx - 22 * s, chestY - 14 * s, cx - shoulderW, chestY);
    g.closePath();
    g.fill();
    g.strokeStyle = rim;
    g.lineWidth = 1.6 * s;
    g.stroke();

    /* рёбра */
    for (let i = 0; i < 6; i++) {
      const y = chestY + 14 * s + i * 16 * s;
      const w = (shoulderW - 6 - i * 2.6) * s;
      g.strokeStyle = 'rgba(2,5,8,0.8)';
      g.lineWidth = 4 * s;
      g.beginPath();
      g.moveTo(cx - w, y);
      g.quadraticCurveTo(cx, y + 14 * s, cx + w, y);
      g.stroke();
      g.strokeStyle = 'rgba(175,215,235,0.15)';
      g.lineWidth = 1.6 * s;
      g.beginPath();
      g.moveTo(cx - w, y - 3 * s);
      g.quadraticCurveTo(cx, y + 9 * s, cx + w, y - 3 * s);
      g.stroke();
    }

    /* плечевые пластины с шипами */
    for (const side of [-1, 1]) {
      const px = cx + side * (shoulderW - 4 * s);
      g.fillStyle = mid;
      g.beginPath();
      g.moveTo(px - side * 6 * s, chestY - 12 * s);
      g.lineTo(px + side * 14 * s, chestY - 4 * s);
      g.lineTo(px + side * 12 * s, chestY + 18 * s);
      g.lineTo(px - side * 8 * s, chestY + 12 * s);
      g.closePath();
      g.fill();
      g.strokeStyle = rim;
      g.lineWidth = 1.4 * s;
      g.stroke();
      g.fillStyle = '#0a1318';
      g.beginPath();
      g.moveTo(px + side * 16 * s, chestY - 6 * s);
      g.lineTo(px + side * 32 * s, chestY - 26 * s);
      g.lineTo(px + side * 21 * s, chestY + 4 * s);
      g.closePath();
      g.fill();
    }

    /* четыре руки */
    for (const side of [-1, 1]) {
      for (let pair = 0; pair < 2; pair++) {
        const sx = cx + side * (shoulderW + (pair ? 6 : 2) * s);
        const sy = chestY + (pair ? 34 * s : 6 * s);
        const ex = cx + side * (shoulderW + (pair ? 34 : 26) * s);
        const ey = sy + (pair ? 26 : 30) * s;
        const wx = cx + side * (shoulderW + (pair ? 26 : 16) * s);
        const wy = ey + (pair ? 40 : 36) * s;
        g.strokeStyle = base;
        g.lineWidth = limbW * (pair ? 1.25 : 1.45);
        g.beginPath();
        g.moveTo(sx, sy);
        g.lineTo(ex, ey);
        g.stroke();
        g.fillStyle = '#111b22';
        g.beginPath(); g.arc(ex, ey, limbW * 0.62, 0, Math.PI * 2); g.fill();
        g.lineWidth = limbW * (pair ? 1.05 : 1.2);
        g.beginPath();
        g.moveTo(ex, ey);
        g.lineTo(wx, wy);
        g.stroke();
        g.strokeStyle = 'rgba(200,220,230,0.28)';
        g.lineWidth = 1.5 * s;
        g.beginPath();
        g.moveTo(sx, sy);
        g.lineTo(ex, ey);
        g.stroke();
        for (let k = -1; k <= 1; k++) {
          g.beginPath();
          g.moveTo(wx, wy);
          g.lineTo(wx + k * 5 * s, wy + 13 * s);
          g.stroke();
        }
      }
    }

    /* дорсальные трубки */
    for (const side of [-1, 1]) {
      for (let k = 0; k < 3; k++) {
        const bx = cx + side * (16 + k * 9) * s;
        const by = chestY - 8 * s;
        g.strokeStyle = '#0a1218';
        g.lineWidth = 8 * s;
        g.beginPath();
        g.moveTo(bx, by);
        g.quadraticCurveTo(bx + side * 18 * s, by - 28 * s, bx + side * 26 * s, by - 46 * s + k * 8 * s);
        g.stroke();
        g.strokeStyle = 'rgba(150,200,230,0.22)';
        g.lineWidth = 1.5 * s;
        g.beginPath();
        g.moveTo(bx, by - 1 * s);
        g.quadraticCurveTo(bx + side * 18 * s, by - 29 * s, bx + side * 26 * s, by - 47 * s + k * 8 * s);
        g.stroke();
      }
    }

    /* шея */
    g.strokeStyle = '#091014';
    g.lineWidth = 13 * s;
    g.beginPath();
    g.moveTo(cx, chestY - 4 * s);
    g.lineTo(cx + 2 * s, neckY);
    g.stroke();

    /* череп */
    const hw = 30 * s, hh = 36 * s;
    const hg = g.createLinearGradient(cx - hw, headY - hh, cx + hw, headY + hh);
    hg.addColorStop(0, '#3d5464');
    hg.addColorStop(0.42, '#0f1a21');
    hg.addColorStop(1, '#02060a');
    g.fillStyle = hg;
    g.beginPath();
    g.moveTo(cx + 3 * s, headY - hh * 0.92);
    g.bezierCurveTo(cx + hw * 0.96, headY - hh * 0.66, cx + hw * 1.04, headY + hh * 0.12, cx + hw * 0.58, headY + hh * 0.8);
    g.lineTo(cx + hw * 0.42, headY + hh * 1.16);
    g.lineTo(cx - hw * 0.42, headY + hh * 1.16);
    g.lineTo(cx - hw * 0.54, headY + hh * 0.8);
    g.bezierCurveTo(cx - hw * 1.04, headY + hh * 0.12, cx - hw * 0.96, headY - hh * 0.66, cx + 3 * s, headY - hh * 0.92);
    g.closePath();
    g.fill();
    g.strokeStyle = rim;
    g.lineWidth = 1.7 * s;
    g.stroke();

    /* гребень и корона */
    g.strokeStyle = 'rgba(6,12,16,0.85)';
    g.lineWidth = 4 * s;
    g.beginPath();
    g.moveTo(cx + 3 * s, headY - hh * 1.05);
    g.quadraticCurveTo(cx - 10 * s, headY - hh * 0.2, cx - 3 * s, headY + hh * 0.6);
    g.stroke();
    for (let i = -2; i <= 2 && (o.crown !== 0); i++) {
      const a = i * 0.34;
      const bx = cx + Math.sin(a) * hw * 0.75;
      const by = headY - hh * 0.86 - Math.cos(a) * hh * 0.2;
      const len = (18 - Math.abs(i) * 3) * s;
      g.strokeStyle = '#101c24';
      g.lineWidth = 4.5 * s;
      g.beginPath();
      g.moveTo(bx, by);
      g.lineTo(bx + Math.sin(a) * len, by - Math.cos(a) * len);
      g.stroke();
      g.strokeStyle = 'rgba(' + accent + ',0.55)';
      g.lineWidth = 1.4 * s;
      g.beginPath();
      g.moveTo(bx, by);
      g.lineTo(bx + Math.sin(a) * len, by - Math.cos(a) * len);
      g.stroke();
    }

    /* блик по куполу */
    const sg = g.createLinearGradient(cx - hw * 0.7, headY - hh * 0.9, cx - hw * 0.2, headY + hh * 0.5);
    sg.addColorStop(0, 'rgba(205,240,255,0.24)');
    sg.addColorStop(1, 'rgba(205,240,255,0)');
    g.fillStyle = sg;
    g.beginPath();
    g.moveTo(cx - hw * 0.12, headY - hh * 0.98);
    g.bezierCurveTo(cx - hw * 0.7, headY - hh * 0.5, cx - hw * 0.74, headY + hh * 0.2, cx - hw * 0.46, headY + hh * 0.68);
    g.bezierCurveTo(cx - hw * 0.54, headY + hh * 0.12, cx - hw * 0.5, headY - hh * 0.5, cx - hw * 0.08, headY - hh * 0.92);
    g.closePath();
    g.fill();

    /* пасть с зубами */
    g.fillStyle = '#04080b';
    g.beginPath();
    g.ellipse(cx, headY + hh * 0.84, hw * 0.48, hh * 0.22, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(210,225,235,0.34)';
    for (let k = -1; k <= 1; k++) {
      g.beginPath();
      g.moveTo(cx + k * hw * 0.22, headY + hh * 0.80);
      g.lineTo(cx + k * hw * 0.22 + 1.4 * s, headY + hh * 0.97);
      g.lineTo(cx + k * hw * 0.22 - 1.4 * s, headY + hh * 0.97);
      g.closePath();
      g.fill();
    }

    /* ядро в груди */
    const core = g.createRadialGradient(cx, chestY + 44 * s, 0, cx, chestY + 44 * s, 13 * s);
    core.addColorStop(0, 'rgba(' + accent + ',0.26)');
    core.addColorStop(1, 'rgba(' + accent + ',0)');
    g.fillStyle = core;
    g.beginPath();
    g.arc(cx, chestY + 44 * s, 13 * s, 0, Math.PI * 2);
    g.fill();
  }

  function bake(o, isBoss) {
    const S = 2, W = isBoss ? 260 : 180, H = isBoss ? 400 : 300;
    const c = document.createElement('canvas');
    c.width = W * S; c.height = H * S;
    const g = c.getContext('2d');
    g.scale(S, S);
    if (isBoss) bossScene(g, W, H, o); else scene(g, W, H, o);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        if (d[(y * c.width + x) * 4 + 3] > 8) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    if (x1 <= x0) return null;
    return { img: c, sx: x0, sy: y0, sw: x1 - x0 + 1, sh: y1 - y0 + 1 };
  }

  const TYPES = {
    grunt:   { scale: 1.00, base: '#0b1218', mid: '#18262f', hi: '#33495a', accent: '120,220,255' },
    swarm:   { scale: 0.76, base: '#0a1014', mid: '#15222a', hi: '#2a3d4a', accent: '150,255,130' },
    shooter: { scale: 1.04, base: '#0c1418', mid: '#1b2b2c', hi: '#37544f', accent: '255,190,90' },
    tank:    { scale: 1.26, base: '#0d1114', mid: '#212830', hi: '#44525e', accent: '255,110,110' }
  };

  const BOSSES = {
    boss:      { scale: 1.30, base: '#0a1015', mid: '#16202a', hi: '#37505f', accent: '200,255,120', crown: 0 },
    matka:     { scale: 1.38, base: '#100c0a', mid: '#241a14', hi: '#5a3a24', accent: '255,180,90' },
    matriarch: { scale: 1.46, base: '#0d0a12', mid: '#1e1626', hi: '#4a3a63', accent: '220,170,255' }
  };

  window.FrontSprites = {
    init() {
      for (const k in TYPES) {
        const o = TYPES[k];
        const f0 = bake(Object.assign({}, o, { swing: 0 }));
        const f1 = bake(Object.assign({}, o, { swing: 1 }));
        FRONT[k] = [f0, f1 || f0];
      }
      for (const k in BOSSES) {
        const o = BOSSES[k];
        const f0 = bake(Object.assign({}, o, { swing: 0 }), true);
        const f1 = bake(Object.assign({}, o, { swing: 1 }), true);
        FRONT[k] = [f0, f1 || f0];
      }
      window.FRONT = FRONT;
      return FRONT;
    },
    get: k => FRONT[k] || FRONT.grunt
  };
})();
