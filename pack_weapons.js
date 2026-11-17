/* pack_weapons.js — оружие от первого лица из CC0-пака FPS Weapon Sprites.
   Кадры 320×180 нарисованы как полноэкранный оверлей: ствол в правом нижнем углу.
   Белый фон вырезается, для разных стволов делаем цветовые варианты. */
(function () {
  const BASE = 'assets/weapons/fps/FPS%20Weapon%20Sprites/frames/';
  const SRC = {
    pistol:  [1, 2, 3, 4, 5].map(i => BASE + 'pistol' + i + '.png'),
    shotgun: [1, 2, 3, 4, 5].map(i => BASE + 'shotgun' + i + '.png')
  };

  /* какой ствол игры каким кадром показываем и с каким сдвигом цвета */
  const MAP = {
    rifle:   { set: 'pistol',  tint: 'brightness(1.55) contrast(1.06)', scale: 1.00 },
    shotgun: { set: 'pistol',  tint: 'brightness(1.62) contrast(1.06)', scale: 1.12, glow: '255,200,120' },
    smg:     { set: 'pistol',  tint: 'brightness(1.32) contrast(1.06)', scale: 0.92, glow: '120,255,180' },
    laser:   { set: 'pistol',  tint: 'brightness(1.20) contrast(1.04)', scale: 1.00, glow: '255,110,220' },
    rocket:  { set: 'shotgun', tint: 'brightness(1.10) contrast(1.05)', scale: 1.12, glow: '255,190,90' },
    plasma:  { set: 'pistol',  tint: 'brightness(1.18) contrast(1.04)', scale: 1.04, glow: '160,140,255' }
  };

  const RAW = {};      // исходные картинки
  const COOKED = {};   // вырезанные кадры по вариантам
  let ready = false;
  let pending = 0;

  /* вырезаем белый фон */
  function keyWhite(img) {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height);
    const a = d.data;
    for (let i = 0; i < a.length; i += 4) {
      const min = Math.min(a[i], a[i + 1], a[i + 2]);
      if (min > 234) a[i + 3] = 0;
      else if (min > 196) a[i + 3] = Math.round(255 * (234 - min) / 38);
    }
    g.putImageData(d, 0, 0);
    return c;
  }

  /* цветной вариант */
  function tintCanvas(src, filter) {
    if (!filter) return src;
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const g = c.getContext('2d');
    g.filter = filter;
    g.drawImage(src, 0, 0);
    return c;
  }

  function load(src) {
    pending++;
    const im = new Image();
    im.onload = () => {
      RAW[src] = keyWhite(im);
      pending--;
      if (pending === 0) bakeAll();
    };
    im.onerror = () => { pending--; if (pending === 0) bakeAll(); };
    im.src = src;
  }

  /* общая рамка кадра для набора: чтобы ствол не прыгал между кадрами */
  function unionBox(list) {
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (const c of list) {
      const g = c.getContext('2d');
      const d = g.getImageData(0, 0, c.width, c.height).data;
      for (let y = 0; y < c.height; y++) {
        for (let x = 0; x < c.width; x++) {
          if (d[(y * c.width + x) * 4 + 3] > 12) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
        }
      }
    }
    if (x1 < 0) return null;
    return { sx: x0, sy: y0, sw: x1 - x0 + 1, sh: y1 - y0 + 1 };
  }

  const BOX = {};

  function bakeAll() {
    for (const key in MAP) {
      const m = MAP[key];
      const list = SRC[m.set] || [];
      COOKED[key] = list.map(src => RAW[src] ? tintCanvas(RAW[src], m.tint) : null).filter(Boolean);
    }
    for (const set in SRC) {
      const list = SRC[set].map(src => RAW[src]).filter(Boolean);
      const b = unionBox(list);
      if (b) BOX[set] = b;
    }
    ready = true;
    window.PACKW_READY = true;
  }

  for (const set in SRC) for (const s of SRC[set]) load(s);

  window.PackWeapon = {
    get ready() { return ready; },
    has(kind) { return !!(COOKED[kind] && COOKED[kind].length); },
    frames(kind) { return COOKED[kind] || null; },
    scale(kind) { return (MAP[kind] && MAP[kind].scale) || 1; },
    glow(kind) { return (MAP[kind] && MAP[kind].glow) || null; },
    /* кадр с рамкой обрезки: 0 — покой, 1 — выстрел, 2 — выстрел сильнее */
    frame(kind, idx) {
      const f = COOKED[kind];
      const m = MAP[kind];
      if (!f || !f.length || !m) return null;
      const b = BOX[m.set];
      if (!b) return null;
      const i = idx === 0 ? 0 : Math.min(f.length - 1, idx);
      return { img: f[i], sx: b.sx, sy: b.sy, sw: b.sw, sh: b.sh };
    }
  };
})();
