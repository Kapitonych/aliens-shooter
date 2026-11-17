/* wolf_weapons.js — CC0-лист в стиле Wolfenstein 3D: оружие от первого лица.
   Спрайты 64×64 в сетке 5×4, у стрелка зелёные рукава — совпадает с нашим десантником. */
(function () {
  const SRC = 'assets/weapons/overlay/a.png';
  const CW = 64, CH = 64;

  /* какие кадры брать: [покой, выстрел] — индексы колонок в строке */
  const MAP = {
    /* кадр 1:3 проверен: это чистый ствол в руках. Остальные ячейки листа —
       кадры вспышек, они и давали «жёлтый фонтан» вместо оружия. */
    rifle:   { row: 1, idle: 3, fire: 3, scale: 1.00, glow: null },
    shotgun: { row: 1, idle: 3, fire: 3, scale: 1.16, glow: '255,200,120' },
    smg:     { row: 1, idle: 3, fire: 3, scale: 0.92, glow: '140,255,180' },
    laser:   { row: 1, idle: 3, fire: 3, scale: 1.02, glow: '255,120,225' },
    rocket:  { row: 1, idle: 3, fire: 3, scale: 1.20, glow: '255,170,80' },
    plasma:  { row: 1, idle: 3, fire: 3, scale: 1.06, glow: '175,150,255' }
  };

  let sheet = null, ready = false;

  const img = new Image();
  img.onload = () => { sheet = img; ready = true; window.WOLF_READY = true; };
  img.src = SRC;

  const CACHE = {};

  /* кадр + обрезка по непрозрачным пикселям, чтобы ствол был крупнее */
  function frameInfo(col, row) {
    const key = col + '_' + row;
    if (CACHE[key]) return CACHE[key];
    const c = document.createElement('canvas');
    c.width = CW; c.height = CH;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(sheet, col * CW, row * CH, CW, CH, 0, 0, CW, CH);
    const d = g.getImageData(0, 0, CW, CH).data;
    let x0 = CW, y0 = CH, x1 = 0, y1 = 0;
    for (let y = 0; y < CH; y++) {
      for (let x = 0; x < CW; x++) {
        if (d[(y * CW + x) * 4 + 3] > 8) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    if (x1 <= x0) return (CACHE[key] = { img: c, sx: 0, sy: 0, sw: CW, sh: CH });
    return (CACHE[key] = { img: c, sx: x0, sy: y0, sw: x1 - x0 + 1, sh: y1 - y0 + 1 });
  }

  window.WolfWeapon = {
    get ready() { return ready; },
    has(kind) { return ready && !!MAP[kind]; },
    scale(kind) { return (MAP[kind] && MAP[kind].scale) || 1; },
    glow(kind) { return (MAP[kind] && MAP[kind].glow) || null; },
    frame(kind, firing) {
      const m = MAP[kind];
      if (!m || !sheet) return null;
      return frameInfo(firing ? m.fire : m.idle, m.row);
    }
  };
})();
