/* weapon_fp2.js — шесть стволов от первого лица.
   Каждый рисуется процедурно по своему профилю и запекается лениво:
   пока ствол не выбран, кадры не занимают память.
   Кадры: 0 — покой, 1 — отдача, 2 — выстрел. */
(function () {
  const TAU = Math.PI * 2;
  const SPECS = {
    rifle: {
      nm: 'ВИНТОВКА', len: 104, girth: 1.00, accent: '110,240,255',
      coils: 3, scope: 1, mag: 1, vents: 5, stock: 1
    },
    shotgun: {
      nm: 'ДРОБОВИК', len: 66, girth: 1.45, accent: '255,180,92',
      coils: 0, scope: 0, mag: 0, twin: 1, pump: 1, stock: 1
    },
    smg: {
      nm: 'АВТОМАТ', len: 62, girth: 1.20, accent: '141,255,114',
      coils: 1, scope: 1, mag: 2, vents: 3, stock: 1
    },
    laser: {
      nm: 'ЛАЗЕР', len: 122, girth: 0.78, accent: '255,111,208',
      coils: 0, scope: 1, mag: 0, fins: 5, lens: 1, stock: 1
    },
    rocket: {
      nm: 'РАКЕТНИЦА', len: 86, girth: 1.55, accent: '255,209,102',
      coils: 0, scope: 0, mag: 0, tube: 1, rocket: 1, stock: 1
    },
    plasma: {
      nm: 'РЕЗАК', len: 74, girth: 1.30, accent: '185,140,255',
      coils: 0, scope: 0, mag: 0, rings: 3, blade: 1, stock: 1
    }
  };

  const CACHE = {};
  /* ---------- мини-иконка ствола для панели ---------- */
  function drawIcon(g, sp) {
    const W = 72, H = 44;
    const s = sp.girth;
    const bodyH = 7 * s;
    const accent = sp.accent;

    // приклад
    const st = g.createLinearGradient(0, H / 2 - bodyH, 0, H / 2 + bodyH);
    st.addColorStop(0, '#4a5f6e');
    st.addColorStop(0.5, '#26343f');
    st.addColorStop(1, '#0d151b');
    g.fillStyle = st;
    g.beginPath();
    g.roundRect(6, H / 2 - bodyH * 0.8, 14, bodyH * 1.6, 2);
    g.fill();

    // корпус
    g.fillStyle = '#1d2a34';
    g.beginPath();
    g.roundRect(18, H / 2 - bodyH, 30, bodyH * 2, 2.5);
    g.fill();
    g.strokeStyle = 'rgba(150,200,230,0.30)';
    g.lineWidth = 1;
    g.stroke();

    // ствол
    const barrelW = sp.twin ? 20 : 18;
    if (sp.twin) {
      for (const dy of [-3.5, 2.5]) {
        g.fillStyle = '#141d25';
        g.fillRect(48, H / 2 + dy, barrelW, 3);
      }
    } else {
      g.fillStyle = '#141d25';
      g.fillRect(48, H / 2 - (sp.tube ? 4 : 2.2), barrelW, sp.tube ? 8 : 4.4);
    }

    // акценты
    if (sp.coils) {
      g.strokeStyle = 'rgba(' + accent + ',0.95)';
      g.lineWidth = 2;
      for (let i = 0; i < sp.coils; i++) {
        g.beginPath();
        g.arc(50 + i * 6, H / 2, 2.4, 0, Math.PI * 2);
        g.stroke();
      }
    }
    if (sp.fins) {
      g.strokeStyle = 'rgba(150,205,235,0.55)';
      g.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.moveTo(50 + i * 4, H / 2 - 5);
        g.lineTo(50 + i * 4, H / 2 + 5);
        g.stroke();
      }
      g.fillStyle = 'rgba(' + accent + ',0.95)';
      g.beginPath();
      g.arc(68, H / 2, 2, 0, Math.PI * 2);
      g.fill();
    }
    if (sp.rings) {
      g.strokeStyle = 'rgba(' + accent + ',0.95)';
      g.lineWidth = 1.6;
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.ellipse(50 + i * 5, H / 2, 2, 5 - i, 0, 0, Math.PI * 2);
        g.stroke();
      }
    }
    if (sp.rocket) {
      g.fillStyle = 'rgba(' + accent + ',0.9)';
      g.beginPath();
      g.moveTo(66, H / 2 - 3.4);
      g.lineTo(71, H / 2);
      g.lineTo(66, H / 2 + 3.4);
      g.closePath();
      g.fill();
    }
    if (sp.blade) {
      g.fillStyle = 'rgba(' + accent + ',0.9)';
      g.beginPath();
      g.moveTo(66, H / 2 - 2);
      g.lineTo(71, H / 2);
      g.lineTo(66, H / 2 + 2);
      g.closePath();
      g.fill();
    }
    // магазин
    if (sp.mag) {
      g.fillStyle = '#22303a';
      g.beginPath();
      g.roundRect(28, H / 2 + bodyH * 0.8, 9, 8, 1.5);
      g.fill();
    }
    // прицел
    if (sp.scope) {
      g.fillStyle = '#101a22';
      g.fillRect(30, H / 2 - bodyH - 4, 12, 3);
      g.fillStyle = 'rgba(' + accent + ',0.85)';
      g.fillRect(36, H / 2 - bodyH - 3, 2, 1.6);
    }
    // помпа
    if (sp.pump) {
      g.fillStyle = '#1c262f';
      g.beginPath();
      g.roundRect(50, H / 2 + 3, 12, 4, 1.5);
      g.fill();
    }
  }

  const ICONS = {};


  /* ---------- рука в перчатке ---------- */
  function hand(g, x, y, s, rot) {
    g.save();
    g.translate(x, y);
    if (rot) g.rotate(rot);

    /* предплечье уходит вправо-вниз за край экрана */
    g.save();
    g.rotate(0.62);
    const armG = g.createLinearGradient(0, -16 * s, 0, 16 * s);
    armG.addColorStop(0, '#33454f');
    armG.addColorStop(0.45, '#1d2a33');
    armG.addColorStop(1, '#0c1319');
    g.fillStyle = armG;
    g.beginPath();
    g.roundRect(-10 * s, -16 * s, 96 * s, 32 * s, 13 * s);
    g.fill();
    // броневые кольца на рукаве
    g.strokeStyle = 'rgba(12,19,25,0.85)';
    g.lineWidth = 4 * s;
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.moveTo((16 + i * 22) * s, -15 * s);
      g.lineTo((13 + i * 22) * s, 15 * s);
      g.stroke();
    }
    g.strokeStyle = 'rgba(175,215,240,0.22)';
    g.lineWidth = 1.6 * s;
    g.beginPath();
    g.moveTo(-6 * s, -13 * s);
    g.lineTo(84 * s, -13 * s);
    g.stroke();
    // жёлтая метка на рукаве
    g.fillStyle = 'rgba(255,190,80,0.55)';
    g.fillRect(62 * s, -6 * s, 10 * s, 12 * s);
    g.restore();

    /* манжета */
    const cuff = g.createLinearGradient(-14 * s, -16 * s, 16 * s, 18 * s);
    cuff.addColorStop(0, '#465c6b');
    cuff.addColorStop(1, '#16212a');
    g.fillStyle = cuff;
    g.beginPath();
    g.ellipse(6 * s, 4 * s, 20 * s, 18 * s, 0.4, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(110,240,255,0.85)';
    g.fillRect(1 * s, -3 * s, 8 * s, 3 * s);

    /* ладонь */
    const palm = g.createLinearGradient(-18 * s, -20 * s, 14 * s, 22 * s);
    palm.addColorStop(0, '#3d5261');
    palm.addColorStop(0.55, '#22303a');
    palm.addColorStop(1, '#101820');
    g.fillStyle = palm;
    g.beginPath();
    g.moveTo(-16 * s, -14 * s);
    g.quadraticCurveTo(-24 * s, 2 * s, -14 * s, 16 * s);
    g.quadraticCurveTo(0 * s, 24 * s, 12 * s, 12 * s);
    g.quadraticCurveTo(18 * s, -4 * s, 8 * s, -16 * s);
    g.quadraticCurveTo(-4 * s, -22 * s, -16 * s, -14 * s);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.55)';
    g.lineWidth = 1.6 * s;
    g.stroke();

    /* пальцы, охватывающие рукоять */
    for (let i = 0; i < 4; i++) {
      const fy = -12 * s + i * 8 * s;
      const fg = g.createLinearGradient(-26 * s, fy, -6 * s, fy + 6 * s);
      fg.addColorStop(0, '#33454f');
      fg.addColorStop(1, '#141d24');
      g.strokeStyle = fg;
      g.lineWidth = 6.4 * s;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(-6 * s, fy);
      g.quadraticCurveTo(-22 * s, fy - 1 * s, -26 * s, fy + 5 * s);
      g.stroke();
      // блик на сгибе
      g.strokeStyle = 'rgba(190,225,245,0.20)';
      g.lineWidth = 1.5 * s;
      g.beginPath();
      g.moveTo(-9 * s, fy - 2 * s);
      g.quadraticCurveTo(-22 * s, fy - 3 * s, -25 * s, fy + 3 * s);
      g.stroke();
    }

    /* большой палец поверх рукояти */
    g.strokeStyle = '#2b3b46';
    g.lineWidth = 7 * s;
    g.beginPath();
    g.moveTo(6 * s, -14 * s);
    g.quadraticCurveTo(-6 * s, -24 * s, -18 * s, -18 * s);
    g.stroke();
    g.strokeStyle = 'rgba(190,225,245,0.22)';
    g.lineWidth = 1.6 * s;
    g.beginPath();
    g.moveTo(5 * s, -17 * s);
    g.quadraticCurveTo(-6 * s, -26 * s, -17 * s, -20 * s);
    g.stroke();

    /* тыльная накладка с индикатором */
    g.fillStyle = 'rgba(20,30,38,0.9)';
    g.beginPath();
    g.roundRect(-4 * s, -6 * s, 12 * s, 7 * s, 2 * s);
    g.fill();
    g.fillStyle = 'rgba(110,240,255,0.9)';
    g.beginPath();
    g.arc(2 * s, -2.5 * s, 1.4 * s, 0, Math.PI * 2);
    g.fill();

    g.restore();
  }

  /* ---------- левая рука (зеркалим правую) ---------- */
  function handLeft(g, x, y, s, rot) {
    g.save();
    g.translate(x, y);
    g.rotate(rot || 0);
    g.scale(-1, 1);
    hand(g, 0, 0, s);
    g.restore();
  }

  /* ---------- вспышка ---------- */
  function muzzle(g, x, y, r, accent, flash) {
    if (flash <= 0) return;
    g.globalCompositeOperation = 'lighter';
    const fr = r * flash;
    const fg = g.createRadialGradient(x, y, 0, x, y, fr);
    fg.addColorStop(0, 'rgba(240,255,255,0.92)');
    fg.addColorStop(0.4, 'rgba(' + accent + ',0.5)');
    fg.addColorStop(1, 'rgba(' + accent + ',0)');
    g.fillStyle = fg;
    g.beginPath();
    g.arc(x, y, fr, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(230,255,255,' + (0.75 * flash).toFixed(2) + ')';
    g.beginPath();
    g.moveTo(x - fr * 1.15, y);
    g.lineTo(x, y - fr * 0.24);
    g.lineTo(x + fr * 0.28, y);
    g.lineTo(x, y + fr * 0.24);
    g.closePath();
    g.fill();
    g.globalCompositeOperation = 'source-over';
  }


  /* ---------- кисть, охватывающая оружие ---------- */
  function gripHand(g, x, y, angle, size, flip) {
    g.save();
    g.translate(x, y);
    g.rotate(angle);
    g.scale(flip ? -size : size, size);

    /* ладонь */
    const pg = g.createLinearGradient(-12, -10, 12, 14);
    pg.addColorStop(0, '#3a4f5e');
    pg.addColorStop(0.55, '#1b2730');
    pg.addColorStop(1, '#0b1318');
    g.fillStyle = pg;
    g.beginPath();
    g.roundRect(-13, -12, 26, 26, 8);
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.55)';
    g.lineWidth = 1.3;
    g.stroke();

    /* пальцы поперёк ствола */
    for (let i = 0; i < 4; i++) {
      const fy = -9 + i * 6.2;
      const fg = g.createLinearGradient(-12, fy, 12, fy + 5);
      fg.addColorStop(0, '#33475a');
      fg.addColorStop(1, '#0d151b');
      g.fillStyle = fg;
      g.beginPath();
      g.roundRect(-12, fy, 24, 5, 2.4);
      g.fill();
      g.fillStyle = 'rgba(190,225,245,0.16)';
      g.fillRect(-11, fy + 0.6, 22, 1.2);
    }

    /* большой палец */
    g.fillStyle = '#2b3d4b';
    g.beginPath();
    g.roundRect(-14, -14, 9, 16, 4);
    g.fill();

    /* индикатор */
    g.fillStyle = 'rgba(110,240,255,0.9)';
    g.beginPath();
    g.arc(6, 9, 1.4, 0, Math.PI * 2);
    g.fill();

    g.restore();
  }

  /* ---------- ствол с перспективой: сходится к центру экрана ---------- */
  function seg(g, ax, ay, bx, by, wa, wb, top, mid, bot) {
    const dx = bx - ax, dy = by - ay;
    const len = Math.max(0.001, Math.hypot(dx, dy));
    const nx = -dy / len, ny = dx / len;
    const p1x = ax + nx * wa, p1y = ay + ny * wa;
    const p2x = bx + nx * wb, p2y = by + ny * wb;
    const p3x = bx - nx * wb, p3y = by - ny * wb;
    const p4x = ax - nx * wa, p4y = ay - ny * wa;

    const grd = g.createLinearGradient(p1x, p1y, p4x, p4y);
    grd.addColorStop(0, bot);
    grd.addColorStop(0.32, top);
    grd.addColorStop(0.55, mid);
    grd.addColorStop(1, bot);

    g.fillStyle = grd;
    g.beginPath();
    g.moveTo(p1x, p1y);
    g.lineTo(p2x, p2y);
    g.lineTo(p3x, p3y);
    g.lineTo(p4x, p4y);
    g.closePath();
    g.fill();

    /* светлая кромка сверху и тёмная снизу */
    g.strokeStyle = 'rgba(210,238,255,0.30)';
    g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(p1x, p1y); g.lineTo(p2x, p2y); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,0.55)';
    g.beginPath(); g.moveTo(p4x, p4y); g.lineTo(p3x, p3y); g.stroke();
  }

  function draw(g, sp, recoil, flash) {
    g.save();
    const acc = sp.accent;
    const s = sp.girth;
    const K = sp.bodyLen || 1;

    /* ось ствола: из правого нижнего угла к центру экрана */
    const near = { x: CW * 0.72 + recoil * 5, y: CH + 20 + recoil * 12 };
    const mid  = { x: CW * 0.60 + recoil * 4, y: CH * 0.66 + recoil * 8 };
    const fore = { x: CW * 0.53 + recoil * 3, y: CH * 0.50 + recoil * 6 };
    const far  = { x: CW * 0.46 + recoil * 2, y: CH * 0.24 + recoil * 3 };

    const w0 = 34 * s;          // рукоять
    const w1 = 28 * s;          // коробка
    const w2 = 20 * s * K;      // цевьё
    const w3 = 10 * s;          // дуло

    /* приклад вниз за экран */
    seg(g, near.x - 10, near.y + 60, near.x, near.y - 10, 46 * s, w0, '#5c7382', '#2a3841', '#0a1116');

    /* рукоять */
    seg(g, near.x, near.y - 10, mid.x, mid.y, w0, w1, '#6a8394', '#31424e', '#0b1319');

    /* цевьё */
    seg(g, mid.x, mid.y, fore.x, fore.y, w1, w2, '#5d7585', '#2b3a45', '#0a1218');

    /* ствол */
    seg(g, fore.x, fore.y, far.x, far.y, w2 * 0.6, w3, '#4e6473', '#243039', '#080e13');

    /* дульный тормоз */
    seg(g, far.x, far.y, far.x - 2, far.y - 22, w3 * 1.3, w3, '#41525f', '#1d272f', '#060b0f');

    /* ---- декоративные панели по коробке ---- */
    const pan = g.createLinearGradient(mid.x - 30, mid.y, mid.x + 30, mid.y - 40);
    pan.addColorStop(0, 'rgba(0,0,0,0.35)');
    pan.addColorStop(0.5, 'rgba(190,225,245,0.10)');
    pan.addColorStop(1, 'rgba(0,0,0,0.30)');
    g.fillStyle = pan;
    g.beginPath();
    g.moveTo(near.x - 16, near.y - 46);
    g.lineTo(mid.x + 10, mid.y + 6);
    g.lineTo(mid.x - 12, mid.y + 16);
    g.lineTo(near.x - 26, near.y - 34);
    g.closePath();
    g.fill();

    /* ---- катушки на стволе ---- */
    const coils = sp.coils || sp.rings || 0;
    for (let i = 0; i < coils; i++) {
      const t = 0.18 + i * 0.22;
      const px = fore.x + (far.x - fore.x) * t;
      const py = fore.y + (far.y - fore.y) * t;
      const rr = (w2 * 0.62) * (1 - t * 0.45);
      g.save();
      g.translate(px, py);
      g.rotate(Math.atan2(far.y - fore.y, far.x - fore.x) + Math.PI / 2);
      g.globalCompositeOperation = 'lighter';
      const halo = g.createRadialGradient(0, 0, 0, 0, 0, rr * 2.2);
      halo.addColorStop(0, 'rgba(' + acc + ',' + (0.16 + flash * 0.35).toFixed(2) + ')');
      halo.addColorStop(1, 'rgba(' + acc + ',0)');
      g.fillStyle = halo;
      g.beginPath(); g.arc(0, 0, rr * 2.2, 0, TAU); g.fill();
      g.globalCompositeOperation = 'source-over';
      g.strokeStyle = 'rgba(' + acc + ',' + (0.8 + flash * 0.2).toFixed(2) + ')';
      g.lineWidth = 3;
      g.beginPath();
      g.ellipse(0, 0, rr * 1.15, rr * 0.42, 0, 0, TAU);
      g.stroke();
      g.restore();
    }

    /* ---- магазин ---- */
    if (sp.mag) {
      g.save();
      g.translate(mid.x + 12, mid.y + 6);
      g.rotate(0.35);
      g.fillStyle = '#1b2730';
      g.beginPath();
      g.roundRect(-11, 0, 22, 46 * s, 3);
      g.fill();
      g.strokeStyle = 'rgba(150,200,230,0.25)';
      g.lineWidth = 1.4;
      g.stroke();
      g.restore();
    }

    /* ---- руки ---- */
    const axis = Math.atan2(far.y - near.y, far.x - near.x);
    if (!sp._noHand) {
      /* левая на цевье */
      gripHand(g, fore.x + 4, fore.y + 10, axis + Math.PI / 2, 0.95 * s, true);
      /* правая на рукояти — ближе к камере, крупнее */
      gripHand(g, near.x - 30, near.y - 6, axis + Math.PI / 2, 1.3 * s, false);
    }

    /* ---- вспышка ---- */
    if (flash > 0) {
      const mx = far.x - 6, my = far.y - 30;
      const fr = 54 * flash;
      g.globalCompositeOperation = 'lighter';
      const fg = g.createRadialGradient(mx, my, 0, mx, my, fr);
      fg.addColorStop(0, 'rgba(245,255,255,0.95)');
      fg.addColorStop(0.38, 'rgba(' + acc + ',0.5)');
      fg.addColorStop(1, 'rgba(' + acc + ',0)');
      g.fillStyle = fg;
      g.beginPath(); g.arc(mx, my, fr, 0, TAU); g.fill();
      g.fillStyle = 'rgba(240,255,255,' + (0.8 * flash).toFixed(2) + ')';
      g.beginPath();
      g.moveTo(mx - fr * 0.9, my + fr * 0.1);
      g.lineTo(mx + fr * 0.15, my - fr * 0.35);
      g.lineTo(mx + fr * 0.15, my + fr * 0.35);
      g.closePath();
      g.fill();
      g.globalCompositeOperation = 'source-over';
    }

    g.restore();
  }

  /* ---------- левая рука (зеркалим правую) ---------- */
  function handLeft(g, x, y, s, rot) {
    g.save();
    g.translate(x, y);
    g.rotate(rot || 0);
    g.scale(-1, 1);
    hand(g, 0, 0, s);
    g.restore();
  }

  /* ---------- вспышка ---------- */
  function muzzle(g, x, y, r, accent, flash) {
    if (flash <= 0) return;
    g.globalCompositeOperation = 'lighter';
    const fr = r * flash;
    const fg = g.createRadialGradient(x, y, 0, x, y, fr);
    fg.addColorStop(0, 'rgba(240,255,255,0.92)');
    fg.addColorStop(0.4, 'rgba(' + accent + ',0.5)');
    fg.addColorStop(1, 'rgba(' + accent + ',0)');
    g.fillStyle = fg;
    g.beginPath();
    g.arc(x, y, fr, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(230,255,255,' + (0.75 * flash).toFixed(2) + ')';
    g.beginPath();
    g.moveTo(x - fr * 1.15, y);
    g.lineTo(x, y - fr * 0.24);
    g.lineTo(x + fr * 0.28, y);
    g.lineTo(x, y + fr * 0.24);
    g.closePath();
    g.fill();
    g.globalCompositeOperation = 'source-over';
  }

  function bakeGun(kind, idx) {
    const sp = Object.assign({}, SPECS[kind] || SPECS.rifle, { _noHand: 1 });
    return bakeWith(sp, idx);
  }

  const CW = 420, CH = 620;          // вертикальный кадр: ствол смотрит вверх
  const TILT = Math.PI / 2 - 0.10;    // лёгкий наклон влево, как в думе

  function bakeWith(sp, idx) {
    const S = 2, W = CW, H = CH;
    const c = document.createElement('canvas');
    c.width = W * S; c.height = H * S;
    const g = c.getContext('2d');
    g.scale(S, S);
    draw(g, sp, idx === 0 ? 0 : 1, idx === 0 ? 0 : (idx === 1 ? 0.3 : 1));
    // обрезаем по альфе, чтобы кадр знал свои реальные границы
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
    if (x1 <= x0) return { img: c, sx: 0, sy: 0, sw: c.width, sh: c.height };

    /* тень: чёрный силуэт кадра, размытый заранее */
    const sh = document.createElement('canvas');
    sh.width = c.width; sh.height = c.height;
    const sg = sh.getContext('2d');
    sg.drawImage(c, 0, 0);
    sg.globalCompositeOperation = 'source-in';
    sg.fillStyle = 'rgba(0,0,0,1)';
    sg.fillRect(0, 0, sh.width, sh.height);
    const blur = document.createElement('canvas');
    blur.width = c.width; blur.height = c.height;
    const bg2 = blur.getContext('2d');
    bg2.filter = 'blur(14px)';
    bg2.drawImage(sh, 0, 0);

    return { img: c, sx: x0, sy: y0, sw: x1 - x0 + 1, sh: y1 - y0 + 1,
             shadow: blur, ssx: x0, ssy: y0, ssw: x1 - x0 + 1, ssh: y1 - y0 + 1 };
  }

  function bake(kind, idx) {
    return bakeWith(SPECS[kind] || SPECS.rifle, idx);
  }

  window.WeaponFP2 = {
    W: CW, H: CH,
    specs: SPECS,
    names: Object.keys(SPECS),
    gunFrames(kind) {
      const k = SPECS[kind] ? kind : 'rifle';
      if (!CACHE[k + '_noh']) CACHE[k + '_noh'] = [bakeGun(k, 0), bakeGun(k, 1), bakeGun(k, 2)];
      return CACHE[k + '_noh'];
    },
    icon(kind) {
      const k = SPECS[kind] ? kind : 'rifle';
      if (!ICONS[k]) {
        const c = document.createElement('canvas');
        c.width = 144; c.height = 88;
        const g = c.getContext('2d');
        g.scale(2, 2);
        drawIcon(g, SPECS[k]);
        ICONS[k] = c.toDataURL('image/png');
      }
      return ICONS[k];
    },
    frames(kind) {
      const k = SPECS[kind] ? kind : 'rifle';
      if (!CACHE[k]) {
        CACHE[k] = [bake(k, 0), bake(k, 1), bake(k, 2)];
        // держим в памяти только два последних ствола: на телефоне каждый
        // кадр — это canvas 860x680, шесть стволов съедают ~40 МБ
        const keys = Object.keys(CACHE).filter(x => !x.endsWith('_noh'));
        for (let i = 0; i < keys.length - 2; i++) {
          for (const fr of CACHE[keys[i]]) { fr.img.width = 0; fr.img.height = 0; }
          delete CACHE[keys[i]];
        }
      }
      return CACHE[k];
    }
  };
})();
