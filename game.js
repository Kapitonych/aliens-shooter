'use strict';
/* ================= ORBITAL DRIFT :: CORE ================= */

const TAU = Math.PI * 2;

/* Детерминированный ГПСЧ: при сиде забег воспроизводим (ежедневный режим). */
let _seed = null;
function setSeed(s) { _seed = (s === null || s === undefined) ? null : ((s >>> 0) || 1); }
function RNG() {
  if (_seed === null) return Math.random();
  _seed = (_seed * 1664525 + 1013904223) >>> 0;
  return _seed / 4294967296;
}

const rand = (a, b) => a + RNG() * (b - a);
const randInt = (a, b) => Math.floor(a + RNG() * (b - a + 1));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const pick = a => a[Math.floor(RNG() * a.length)];
const dst = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let VW = 800, VH = 600, DPR = 1;

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  VW = window.innerWidth;
  VH = window.innerHeight;
  canvas.width = Math.round(VW * DPR);
  canvas.height = Math.round(VH * DPR);
  canvas.style.width = VW + 'px';
  canvas.style.height = VH + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (Game && Game.room) Game.clampCam();
}

/* ---------------- settings / save ---------------- */
const SAVE_KEY = 'odrift_run_v1';
const META_KEY = 'odrift_meta_v1';
const SET_KEY = 'odrift_settings_v1';
const MAX_SECTOR = 15;
const BOSS_EVERY = 3;   // боссы: 3, 6, 9, 12, 15 — пять штук, по стволу за каждого

const Settings = { sound: true, runGun: false, shake: true, vibe: true, joy: 68, quality: 1, boss3d: 0 };

const SET_VER = 3;
function loadSettings() {
  try { Object.assign(Settings, JSON.parse(localStorage.getItem(SET_KEY) || '{}')); } catch (e) {}
  // одноразовая миграция: 3D-боссы включаем всем, у кого старые настройки
  if (!Settings.setVer || Settings.setVer < SET_VER) {
    Settings.boss3d = 1;
    Settings.setVer = SET_VER;
    saveSettings();
  }
  Sfx.on = !!Settings.sound;
}
function saveSettings() {
  try { localStorage.setItem(SET_KEY, JSON.stringify(Settings)); } catch (e) {}
}
function loadSave() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { return null; }
}
function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
}
function getMeta() {
  let m;
  try { m = Object.assign({ coins: 0, best: 0, runs: 0, up: {} }, JSON.parse(localStorage.getItem(META_KEY) || '{}')); }
  catch (e) { m = { coins: 0, best: 0, runs: 0, up: {} }; }
  if (!m.up || typeof m.up !== 'object') m.up = {};
  return m;
}
function pushRecord(rec) {
  const meta = getMeta();
  meta.log = meta.log || [];
  meta.log.push(rec);
  meta.log.sort((a, b) => (b.s - a.s) || (b.k - a.k) || (b.d - a.d));
  meta.log = meta.log.slice(0, 10);
  saveMeta(meta);
}

function saveMeta(m) {
  m.ts = Date.now();
  try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch (e) {}
  Cloud.push('meta', m);
}

/* ---- облачное сохранение через Telegram CloudStorage ---- */
const Cloud = {
  ready: false, timer: null, status: 'нет',
  tg() {
    const t = window.Telegram && window.Telegram.WebApp;
    return (t && t.CloudStorage) ? t : null;
  },
  init(onLoaded) {
    const tg = this.tg();
    if (!tg) { this.status = 'недоступно'; return; }
    this.status = 'проверка';
    let pending = 2;
    const done = () => { if (--pending === 0 && onLoaded) onLoaded(); };
    const markReady = (err) => {
      if (!err && !this.ready) { this.ready = true; this.status = 'подключено'; }
      else if (err && !this.ready) { this.status = 'недоступно'; }
    };
    try {
      tg.CloudStorage.getItem('as_meta', (err, val) => {
        markReady(err);
        if (!err && val) {
          try {
            const cloud = JSON.parse(val);
            const local = getMeta();
            if ((cloud.ts || 0) > (local.ts || 0)) {
              localStorage.setItem(META_KEY, JSON.stringify(cloud));
              this.status = 'загружено';
            }
          } catch (e) {}
        }
        done();
      });
    } catch (e) { done(); }
    try {
      tg.CloudStorage.getItem('as_run', (err, val) => {
        markReady(err);
        if (!err && val) {
          try {
            const cloud = JSON.parse(val);
            const local = localStorage.getItem(SAVE_KEY);
            const localTs = local ? (JSON.parse(local).ts || 0) : 0;
            if ((cloud.ts || 0) > localTs && cloud.room) localStorage.setItem(SAVE_KEY, JSON.stringify(cloud));
          } catch (e) {}
        }
        done();
      });
    } catch (e) { done(); }
    setTimeout(() => { if (this.status === 'проверка') { this.status = 'недоступно'; if (onLoaded) onLoaded(); } }, 3500);
  },
  push(kind, data) {
    if (!this.ready) return;
    const tg = this.tg();
    if (!tg) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      try {
        let val = JSON.stringify(data);
        if (val.length > 3800) {
          // режем тяжёлое: журнал забегов — до 5 записей
          if (data.log && data.log.length > 5) data.log = data.log.slice(0, 5);
          val = JSON.stringify(data);
        }
        if (val.length > 4000) return;
        const key = kind === 'meta' ? 'as_meta' : 'as_run';
        tg.CloudStorage.setItem(key, val, () => {});
      } catch (e) {}
    }, kind === 'meta' ? 900 : 2500);
  }
};

const STAT_FIELDS = ['maxHp', 'speed', 'baseDmg', 'dmgMult', 'atkRate', 'projCount', 'pierce',
  'ricochet', 'critChance', 'critMult', 'leech', 'freeze', 'projSpeed', 'projSize', 'projRange'];

function saveGame() {
  if (!Game.player || Game.daily) return;  // ежедневный забег не сохраняем: сид живёт только в сессии
  const p = Game.player, o = { v: 1, room: Game.roomIndex, coins: Game.coins, level: Game.level,
    xp: Game.xp, xpNext: Game.xpNext, kills: Game.kills, perks: Game.perkLog, stats: {} };
  STAT_FIELDS.forEach(k => { o.stats[k] = p[k]; });
  o.stats.hp = p.hp;
  o.weapon = p.weapon;
  o.ammo = {};
  for (const k in p.ammo) o.ammo[k] = isFinite(p.ammo[k]) ? p.ammo[k] : -1;
  o.unlocked = p.unlocked;
  o.ts = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(o)); } catch (e) {}
  Cloud.push('run', o);
}

/* ---------------- audio ---------------- */
const Sfx = {
  ctx: null, on: true, master: null, amb: null, bossInt: null,
  init() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.9;
        this.master.connect(this.ctx.destination);
      } catch (e) { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    if (this.ctx) this.load();
  },
  samples: {}, loading: false,
  load() {
    if (this.loading || !this.ctx) return;
    this.loading = true;
    const files = {
      shoot: 'audio/laser3.mp3', heavy: 'audio/laser7.mp3', zap: 'audio/zap2.mp3',
      hit: 'audio/knifeSlice.mp3', hurt: 'audio/lowDown.mp3', boom: 'audio/spaceTrash1.mp3',
      pickup: 'audio/handleCoins.mp3', level: 'audio/powerUp5.mp3', door: 'audio/doorOpen_2.mp3',
      step: 'audio/footstep03.mp3', power: 'audio/powerUp3.mp3'
    };
    Object.keys(files).forEach(k => {
      fetch(files[k]).then(r => r.arrayBuffer()).then(b => this.ctx.decodeAudioData(b))
        .then(buf => { this.samples[k] = buf; })
        .catch(() => {});
    });
  },
  play(key, vol, rate) {
    if (!this.on || !this.ctx || !this.samples[key]) return false;
    try {
      const src = this.ctx.createBufferSource();
      src.buffer = this.samples[key];
      src.playbackRate.value = rate || 1;
      const g = this.ctx.createGain();
      g.gain.value = vol === undefined ? 0.5 : vol;
      src.connect(g); g.connect(this.master || this.ctx.destination);
      src.start();
      return true;
    } catch (e) { return false; }
  },
  tone(f, dur, type, vol, to) {
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master || this.ctx.destination);
    o.start(t); o.stop(t + dur + 0.03);
  },
  noise(dur, vol, freq, q) {
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const srcNode = this.ctx.createBufferSource(); srcNode.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = freq || 800; f.Q.value = q || 1;
    const g = this.ctx.createGain(); g.gain.value = vol;
    srcNode.connect(f); f.connect(g); g.connect(this.master || this.ctx.destination);
    srcNode.start(t);
  },
  shoot() {
    if (this.play('shoot', 0.34, rand(0.92, 1.08))) return;
    this.tone(rand(680, 820), 0.05, 'square', 0.026, 420); this.noise(0.05, 0.018, 1900, 2);
  },
  heavyShot() {
    if (this.play('heavy', 0.42, rand(0.9, 1.0))) return;
    this.tone(240, 0.12, 'sawtooth', 0.05, 90); this.noise(0.12, 0.03, 700, 1);
  },
  zapShot() {
    if (this.play('zap', 0.3, rand(0.95, 1.1))) return;
    this.tone(1100, 0.09, 'sawtooth', 0.03, 300);
  },
  hit() {
    if (this.play('hit', 0.22, rand(0.9, 1.15))) return;
    this.tone(rand(180, 260), 0.05, 'sawtooth', 0.028); this.noise(0.04, 0.014, 900, 1.4);
  },
  hurt() {
    if (this.play('hurt', 0.55, rand(0.85, 1.0))) return;
    this.tone(110, 0.18, 'sawtooth', 0.07, 55); this.noise(0.12, 0.03, 320, 1);
  },
  pickup() {
    if (this.play('pickup', 0.2, rand(0.96, 1.1))) return;
    this.tone(rand(1000, 1400), 0.04, 'square', 0.02);
  },
  level() {
    if (this.play('level', 0.4, 1)) return;
    this.tone(660, 0.1, 'triangle', 0.05); setTimeout(() => this.tone(990, 0.14, 'triangle', 0.05), 90);
  },
  door() {
    if (this.play('door', 0.4, rand(0.9, 1.05))) return;
    this.tone(420, 0.2, 'triangle', 0.045); setTimeout(() => this.tone(620, 0.22, 'triangle', 0.04), 110);
  },
  boom() {
    if (this.play('boom', 0.5, rand(0.85, 1.05))) return;
    this.tone(80, 0.35, 'sawtooth', 0.08, 35); this.noise(0.3, 0.05, 220, 0.8);
  },
  boss() {
    if (this.play('boom', 0.6, 0.65)) { this.tone(90, 0.6, 'sawtooth', 0.05, 40); return; }
    this.tone(90, 0.6, 'sawtooth', 0.08, 40); this.noise(0.5, 0.05, 160, 0.7);
  },
  growl() {
    if (this.play('zap', 0.16, rand(0.45, 0.62))) return;
    this.tone(rand(70, 120), rand(0.24, 0.42), 'sawtooth', 0.03, rand(38, 58)); this.noise(0.2, 0.018, rand(300, 620), 1.2);
  },
  step() {
    if (this.play('step', 0.09, rand(0.9, 1.1))) return;
    this.noise(0.07, 0.01, 240, 1.6);
  },
  ambient(on) {
    if (!this.ctx) return;
    if (!on) {
      if (this.amb) {
        const a = this.amb; this.amb = null;
        try {
          a.g.gain.cancelScheduledValues(this.ctx.currentTime);
          a.g.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
          setTimeout(() => { try { a.oscs.forEach(o => o.stop()); a.noise.stop(); } catch (e) {} }, 600);
        } catch (e) {}
      }
      return;
    }
    if (this.amb) return;
    const t = this.ctx.currentTime;
    const g = this.ctx.createGain();
    g.gain.value = 0.0001;
    g.gain.linearRampToValueAtTime(0.032, t + 2.5);
    g.connect(this.master || this.ctx.destination);
    const oscs = [];
    [41.2, 55, 82.4].forEach((f, i) => {
      const o = this.ctx.createOscillator();
      o.type = i === 2 ? 'triangle' : 'sine';
      o.frequency.value = f;
      const og = this.ctx.createGain();
      og.gain.value = i === 2 ? 0.22 : 0.45;
      o.connect(og); og.connect(g); o.start(t); oscs.push(o);
    });
    const len = Math.floor(this.ctx.sampleRate * 2);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.22;
    const noise = this.ctx.createBufferSource(); noise.buffer = buf; noise.loop = true;
    const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
    const ng = this.ctx.createGain(); ng.gain.value = 0.55;
    noise.connect(lp); lp.connect(ng); ng.connect(g); noise.start(t);
    this.amb = { g: g, oscs: oscs, noise: noise };
  },
  bossTheme(on) {
    if (!on) { if (this.bossInt) { clearInterval(this.bossInt); this.bossInt = null; } return; }
    if (this.bossInt || !this.ctx || !this.on) return;
    const scale = [0, 3, 5, 7, 10, 7, 5, 3];
    let step = 0;
    this.bossInt = setInterval(() => {
      if (!this.on || !this.ctx) return;
      const n = scale[step % scale.length];
      this.tone(55 * Math.pow(2, n / 12), 0.22, 'sawtooth', 0.028);
      if (step % 4 === 0) this.noise(0.13, 0.045, 90, 0.8);
      step++;
    }, 265);
  }
};

/* ---------------- input ---------------- */
const Input = {
  keys: Object.create(null),
  joy: { active: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0, mag: 0 },
  vec() {
    let x = 0, y = 0;
    const k = this.keys;
    if (k['a'] || k['ф'] || k['arrowleft']) x -= 1;
    if (k['d'] || k['в'] || k['arrowright']) x += 1;
    if (k['w'] || k['ц'] || k['arrowup']) y -= 1;
    if (k['s'] || k['ы'] || k['arrowdown']) y += 1;
    if (x || y) { const m = Math.hypot(x, y); return { x: x / m, y: y / m, mag: 1 }; }
    const j = this.joy;
    if (j.active && j.mag > 0.14) return { x: j.dx, y: j.dy, mag: clamp(j.mag, 0, 1) };
    return { x: 0, y: 0, mag: 0 };
  },
  reset() { this.keys = Object.create(null); this.joy.active = false; this.joy.id = null; this.joy.mag = 0; },
  /* страховка: если палец не отпустил стик (iframe, сворачивание WebView,
     переключение приложения) — сбрасываем после долгой паузы без событий */
  lastTouch: 0,
  touchTick() {
    const j = this.joy;
    if (j.active && this.lastTouch && performance.now() - this.lastTouch > 4000) {
      j.active = false; j.id = null; j.mag = 0; j.dx = 0; j.dy = 0;
    }
  }
};

/* ---------------- entities ---------------- */
function newPlayer() {
  return {
    x: 0, y: 0, r: 16, hp: 100, maxHp: 100, speed: 215,
    baseDmg: 11, dmgMult: 1, atkRate: 1.75, atkCd: 0,
    projCount: 1, pierce: 0, ricochet: 0, critChance: 0.05, critMult: 2,
    leech: 0, freeze: 0, projSpeed: 660, projSize: 1, projRange: 560,
    aim: -Math.PI / 2, idle: 0, moving: false, invuln: 0, flash: 0, anim: 0, muzzle: 0,
    ammo: { rifle: Infinity, shotgun: 0, smg: 0, laser: 0, rocket: 0, plasma: 0 },
    unlocked: { rifle: true },
    get dmg() { return this.baseDmg * this.dmgMult; }
  };
}

const ETYPES = {
  grunt:   { hp: 26,  speed: 80,  r: 15, dmg: 9,  xp: 2,  coins: 1,  col: '#8dff72', ai: 'chase' },
  swarm:   { hp: 13,  speed: 142, r: 10, dmg: 5,  xp: 1,  coins: 1,  col: '#d4ff5c', ai: 'chase' },
  shooter: { hp: 24,  speed: 64,  r: 15, dmg: 6,  xp: 3,  coins: 2,  col: '#5effb0', ai: 'shooter' },
  tank:    { hp: 82,  speed: 48,  r: 23, dmg: 15, xp: 5,  coins: 3,  col: '#3dff9a', ai: 'chase' },
  boss:    { hp: 430, speed: 60,  r: 42, dmg: 20, xp: 34, coins: 18, col: '#c9ff5a', ai: 'boss', bossName: 'СТРАЖ СЕКТОРА' },
  matka:   { hp: 560, speed: 46,  r: 44, dmg: 22, xp: 40, coins: 22, col: '#ffb35c', ai: 'matka', bossName: 'МАТКА УЛЬЯ' },
  matriarch: { hp: 470, speed: 52, r: 50, dmg: 26, xp: 60, coins: 40, col: '#e6b3ff', ai: 'boss', bossName: 'МАТЬ УЛЬЯ' }
};

/* ---------------- оружие ---------------- */
const WEAPONS = {
  rifle: {
    nm: 'ВИНТОВКА', col: '120,245,255', rate: 1, dmg: 1, spread: 0.13, pellets: 0,
    projSpeed: 1, range: 1, size: 1, pierce: 0, jitter: 0, tracer: 1
  },
  shotgun: {
    nm: 'ДРОБОВИК', col: '255,185,90', rate: 0.62, dmg: 0.60, spread: 0.3, pellets: 4,
    projSpeed: 0.85, range: 0.58, size: 1.0, pierce: 0, jitter: 0.05, tracer: 1.1
  },
  smg: {
    nm: 'АВТОМАТ', col: '210,255,120', rate: 1.9, dmg: 0.80, spread: 0.18, pellets: 0,
    projSpeed: 1.05, range: 0.85, size: 0.85, pierce: 0, jitter: 0.03, tracer: 0.8
  },
  laser: {
    nm: 'ИМПУЛЬСНЫЙ ЛУЧ', col: '190,140,255', rate: 0.72, dmg: 2.0, spread: 0.0, pellets: 0,
    projSpeed: 1.6, range: 1.45, size: 0.8, pierce: 2, jitter: 0, tracer: 2.2
  },
  rocket: {
    nm: 'РАКЕТНИЦА', col: '255,110,80', rate: 0.5, dmg: 3.2, spread: 0.02, pellets: 0,
    projSpeed: 0.7, range: 1.15, size: 1.7, pierce: 0, jitter: 0, tracer: 1.8,
    aoe: 92
  },
  plasma: {
    nm: 'ПЛАЗМЕННЫЙ РЕЗАК', col: '255,120,235', rate: 0.58, dmg: 1.5, spread: 0.16, pellets: 2,
    projSpeed: 1.3, range: 1.3, size: 1.1, pierce: 1, jitter: 0.02, tracer: 1.6
  }
};

const SECTOR_MODS = [
  { id: 'ice',    nm: 'ЛЁД',        ds: 'пол скользит',              bonus: 1.35, col: '#8fe3ff' },
  { id: 'turrets', nm: 'ТУРЕЛИ',    ds: 'автотурели на стенах',      bonus: 1.45, col: '#ffb35c' },
  { id: 'hive',   nm: 'УЛЕЙ',       ds: 'гнёзда плодят врагов',      bonus: 1.6,  col: '#c98bff' },
  { id: 'dark',   nm: 'ТЕМНОТА',    ds: 'видно только рядом',        bonus: 1.5,  col: '#7f9bd6' },
  { id: 'acid',   nm: 'КИСЛОТА',    ds: 'лужи кислоты на полу',      bonus: 1.4,  col: '#9dff5c' }
];

const NAV_CELL = 36;

const AMMO_START = { rifle: Infinity, shotgun: 40, smg: 90, laser: 55, rocket: 14, plasma: 60 };
const AMMO_DROP = { rifle: 0, shotgun: 6, smg: 16, laser: 10, rocket: 3, plasma: 9 };

/* Расписание: какой ствол выдаётся с какого сектора (после босса). */
const WEAPON_SCHEDULE = [
  { from: 1, w: 'rifle' },    // со старта
  { from: 4, w: 'smg' },      // после босса сектора 3
  { from: 7, w: 'laser' },    // после босса сектора 6
  { from: 10, w: 'rocket' },  // после босса сектора 9
  { from: 13, w: 'plasma' }   // после босса сектора 12
];

/* Стартовый набор: два ствола, чтобы к первому боссу было чем переключаться. */
const STARTER_WEAPONS = ['rifle', 'shotgun'];

function weaponForSector(i) {
  let w = 'rifle';
  for (const step of WEAPON_SCHEDULE) if (i >= step.from) w = step.w;
  return w;
}

function nextWeaponSector(i) {
  for (const step of WEAPON_SCHEDULE) if (step.from > i) return step.from;
  return null;
}

/* ---------------- стартовые классы ---------------- */
const CLASSES = [
  { id: 'assault', ic: '✷', nm: 'ШТУРМОВИК', ds: '+10% урона · +8% скор. атаки', apply: p => { p.dmgMult *= 1.1; p.atkRate *= 1.08; } },
  { id: 'breaker', ic: '⬢', nm: 'ТЯЖЁЛЫЙ',   ds: '+35 макс. HP',                  req: 'boss', apply: p => { p.maxHp += 35; p.hp = p.maxHp; } },
  { id: 'sniper',  ic: '✦', nm: 'СНАЙПЕР',   ds: '+15% крит · +15% дальность',    req: 'win',  apply: p => { p.critChance = Math.min(0.85, p.critChance + 0.15); p.projRange *= 1.15; } }
];

/* ---------------- постоянные улучшения ---------------- */
const UPGRADES = [
  { id: 'dmg',   ic: '⚡', nm: 'Усилитель оружия', ds: '+6% урона навсегда',       max: 5, cost: l => 150 * (l + 1) },
  { id: 'hp',    ic: '❤', nm: 'Броня',             ds: '+20 макс. HP навсегда',     max: 5, cost: l => 120 * (l + 1) },
  { id: 'speed', ic: '➤', nm: 'Маневровые',        ds: '+5% скорость бега навсегда', max: 5, cost: l => 100 * (l + 1) },
  { id: 'luck',  ic: '✦', nm: 'Удача',             ds: '+40 стартовых ⛁, лучше дроп', max: 3, cost: l => 200 * (l + 1) }
];

/* ---------------- perks ---------------- */

const PERKS = [
  { id: 'dmg',   ic: '⚡', nm: 'Плазменный усилитель', ds: '+20% урона',              max: 10, apply: p => { p.dmgMult *= 1.2; } },
  { id: 'rate',  ic: '⏱', nm: 'Ускоритель',           ds: '+18% скорость атаки',      max: 8,  apply: p => { p.atkRate *= 1.18; } },
  { id: 'multi', ic: '✷', nm: 'Раскол луча',          ds: '+1 снаряд в залпе',        max: 4,  apply: p => { p.projCount += 1; } },
  { id: 'pierce',ic: '➤', nm: 'Бронебой',             ds: 'Снаряд пробивает +1 цель', max: 3,  apply: p => { p.pierce += 1; } },
  { id: 'crit',  ic: '✦', nm: 'Слабые точки',         ds: '+10% шанс крита',          max: 5,  apply: p => { p.critChance = Math.min(0.85, p.critChance + 0.1); } },
  { id: 'hp',    ic: '❤', nm: 'Биоконтур',            ds: '+25 макс. HP и лечение',   max: 6,  apply: p => { p.maxHp += 25; p.hp = Math.min(p.maxHp, p.hp + 25); } },
  { id: 'speed', ic: '➤', nm: 'Маневровые',           ds: '+10% скорость бега',       max: 5,  apply: p => { p.speed *= 1.1; } },
  { id: 'ric',   ic: '↺', nm: 'Рикошет',              ds: '+1 отскок снаряда',        max: 3,  apply: p => { p.ricochet += 1; } },
  { id: 'leech', ic: '✚', nm: 'Нанорепликация',       ds: '+6% урона в HP',           max: 4,  apply: p => { p.leech = Math.min(0.4, p.leech + 0.06); } },
  { id: 'freeze',ic: '❄', nm: 'Криозаряд',            ds: 'Попадания замедляют врага',max: 3,  apply: p => { p.freeze = Math.min(0.6, p.freeze + 0.22); } },
  { id: 'range', ic: '◎', nm: 'Дальнобойность',       ds: '+25% дальность стрельбы',  max: 4,  apply: p => { p.projRange *= 1.25; } },
  { id: 'size',  ic: '●', nm: 'Тяжёлый заряд',        ds: '+25% размер снаряда',      max: 3,  apply: p => { p.projSize *= 1.25; } }
];

/* ---------------- game ---------------- */
const Game = {
  state: 'menu',
  player: null, room: null,
  cam: { x: 0, y: 0, shake: 0 },
  bullets: [], ebullets: [], enemies: [], parts: [], pickups: [], stars: [], texts: [],
  props: [], gibs: [], splats: [], lights: [], mines: [],
  hurtFlash: 0,
  roomIndex: 1, coins: 0, level: 1, xp: 0, xpNext: 12, kills: 0, perkLog: {}, pendingPerks: 0,
  time: 0, doorMsg: false,

  /* --- lifecycle --- */
  newRun(clsId, daily) {
    Input.reset();                  // новый забег всегда с чистым вводом
    if (daily) {
      this.daily = true;
      this.dailyKey = daily.key;
      setSeed(daily.seed);
    } else {
      this.daily = false;
      this.dailyKey = null;
      setSeed(null);
    }
    this.player = newPlayer();
    const meta = getMeta(), up = meta.up || {};
    const p0 = this.player;
    p0.weapon = weaponForSector(1);
    for (const w of STARTER_WEAPONS) {
      p0.unlocked[w] = true;
      p0.ammo[w] = AMMO_START[w];
    }
    p0.weapon = 'rifle';
    const cls = CLASSES.find(c => c.id === clsId);
    if (cls) cls.apply(p0);
    if (up.dmg) p0.dmgMult *= 1 + 0.06 * up.dmg;
    if (up.hp) { p0.maxHp += 20 * up.hp; p0.hp = p0.maxHp; }
    if (up.speed) p0.speed *= 1 + 0.05 * up.speed;
    this.luck = (up.luck || 0) * 0.04;
    this.roomIndex = 1; this.coins = up.luck ? up.luck * 40 : 0; this.level = 1; this.xp = 0; this.xpNext = 12;
    this.kills = 0; this.perkLog = {}; this.pendingPerks = 0; this.time = 0;
    this.drone = meta.drone ? { x: p0.x, y: p0.y - 58, cd: 0.6, level: meta.drone, bob: 0, fireFlash: 0 } : null;
    Sfx.init();
    Sfx.ambient(true);
    this.enterRoom(1);
    this.state = 'playing';
    const mt = getMeta();
    if (!mt.tutorial) {
      this.state = 'tutorial';
      UI.showTutorial();
    }
  },

  endTutorial() {
    const meta = getMeta();
    meta.tutorial = 1;
    saveMeta(meta);
    this.state = 'playing';
    UI.showScreen(null);
    UI.showHud(true);
    UI.updateHud(true);
  },

  newDaily() {
    const d = new Date();
    const key = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    this.newRun('assault', { key: key, seed: (key * 2654435761) % 4294967296 });
    // забег дня — для тех, кто уже играл: обучение не показываем и заставляем играть
    if (this.state === 'tutorial') {
      this.state = 'playing';
      UI.showScreen(null);
      UI.showHud(true);
      UI.updateHud(true);
    }
    UI.toast('ЕЖЕДНЕВНЫЙ ЗАБЕГ · ' + d.toLocaleDateString('ru-RU'));
  },

  restore(data) {
    Input.reset();                  // продолжение с залипшим стиком = стоящий герой
    this.daily = false;
    setSeed(null);
    this.player = newPlayer();
    const s = data.stats || {};
    STAT_FIELDS.forEach(k => { if (typeof s[k] === 'number') this.player[k] = s[k]; });
    this.player.hp = Math.max(1, Math.min(this.player.maxHp, s.hp || this.player.maxHp));
    this.player.weapon = data.weapon || 'rifle';
    if (data.ammo) {
      for (const k in data.ammo) {
        const v = data.ammo[k];
        if (k === 'rifle' || v === -1 || v === null || v === undefined) this.player.ammo[k] = Infinity;
        else this.player.ammo[k] = Math.max(0, Math.floor(v) || 0);
      }
    }
    if (data.unlocked) Object.assign(this.player.unlocked, data.unlocked);
    this.roomIndex = Math.min(MAX_SECTOR, Math.max(1, data.room || 1)); this.coins = data.coins || 0;
    this.level = data.level || 1; this.xp = data.xp || 0; this.xpNext = data.xpNext || 12;
    this.kills = data.kills || 0; this.perkLog = data.perks || {}; this.pendingPerks = 0; this.time = 0;
    const m2 = getMeta();
    this.drone = m2.drone ? { x: this.player.x, y: this.player.y - 58, cd: 0.6, level: m2.drone, bob: 0, fireFlash: 0 } : null;
    Sfx.init();
    Sfx.ambient(true);
    this.enterRoom(this.roomIndex, { noContract: true });
    this.state = 'playing';
  },

  enterRoom(i, opts) {
    opts = opts || {};
    UI.showPerks(false);
    this.roomIndex = i;
    const W = clamp(VW * 1.7, 900, 1500), H = clamp(VH * 1.7, 760, 1500);
    this.room = { w: W, h: H, boss: i % BOSS_EVERY === 0, elite: !!opts.elite, cleared: false, doors: null, t: 0, mod: null };
    if (i > 1 && !this.room.boss && !opts.noMod && RNG() < 0.6) this.room.mod = pick(SECTOR_MODS);
    this.bullets.length = 0; this.ebullets.length = 0;
    this.enemies.length = 0; this.parts.length = 0; this.pickups.length = 0;
    this.texts.length = 0; this.hurtFlash = 0;
    this.props.length = 0; this.gibs.length = 0; this.splats.length = 0; this.lights.length = 0;
    this.mines.length = 0;
    this.acid = [];
    this.nav = null;
    this.doorMsg = false;
    const p = this.player;
    p.x = W / 2; p.y = H - 150; p.invuln = 1.2; p.atkCd = 0;
    this.cam.x = clamp(p.x - VW / 2, 0, Math.max(0, W - VW));
    this.cam.y = clamp(p.y - VH / 2, 0, Math.max(0, H - VH));
    const scheduled = weaponForSector(i);
    if (this.player && scheduled && !this.player.unlocked[scheduled]) {
      this.player.unlocked[scheduled] = true;
      this.player.ammo[scheduled] = (this.player.ammo[scheduled] || 0) + AMMO_START[scheduled];
      this.player.weapon = scheduled;
      if (i > 1) {
        setTimeout(() => {
          UI.toast('НОВОЕ ОРУЖИЕ: ' + WEAPONS[scheduled].nm);
          Sfx.level();
        }, 400);
      }
    }
    this.keepWeapon = false;
    this.makeStars();
    this.setupLayout();
    this.spawnProps();
    this.setupObjective();
    this.setupMod();
    saveGame();
    UI.updateHud(true);
    if (this.room.boss && i > 1 && !opts.noContract) {
      this.contract = null;
      this.state = 'contract';
      UI.showContract();
      return;
    }
    if (this.startBossRoom(i)) return;
    this.spawnWave();
    UI.toast('СЕКТОР ' + i + (this.room.boss ? ' · БОСС' : '') + (this.room.elite ? ' · ЭЛИТА' : '') +
      (this.room.mod ? ' · ' + this.room.mod.nm : ''));
    if (this.room.boss || this.room.elite) Sfx.boss();
    Sfx.bossTheme(!!this.room.boss);
  },

  makeStars() {
    this.stars.length = 0;
    const n = Math.round((this.room.w * this.room.h) / 16000);
    for (let k = 0; k < n; k++) {
      this.stars.push({ x: rand(0, this.room.w), y: rand(0, this.room.h), z: rand(0.25, 1), s: rand(0.6, 2.1) });
    }
  },

  spawnWave() {
    const i = this.roomIndex;
    if (this.room.boss) {
      const bossType = i >= MAX_SECTOR ? 'matriarch' : (i === 9 ? 'matka' : 'boss');
      this.addEnemy(bossType);
      const adds = Math.min(4, 1 + Math.floor(i / BOSS_EVERY));
      for (let k = 0; k < adds; k++) this.addEnemy(k % 2 ? 'swarm' : 'grunt');
      return;
    }
    let budget = Math.min(20, Math.round(6 + i * 1.4));
    if (this.room.elite) budget = Math.min(24, Math.round(budget * 1.5));
    const pool = [['grunt', 1], ['swarm', 0.9]];
    if (i >= 2) pool.push(['shooter', 1.3]);
    if (i >= 3) pool.push(['tank', 1.8]);
    let guard = 0;
    while (budget > 0.6 && guard++ < 60) {
      const [type, cost] = pick(pool);
      if (cost > budget + 0.4) { this.addEnemy('grunt'); budget -= 1; }
      else { this.addEnemy(type); budget -= cost; }
    }
  },

  addEnemy(type) {
    if (this.enemies.length > 34) return;
    const t = ETYPES[type] || ETYPES.grunt;
    const p = this.player, W = this.room.w, H = this.room.h;
    let x = 0, y = 0, tries = 0;
    do {
      x = rand(80, W - 80); y = rand(80, H - 80); tries++;
    } while (Math.hypot(x - p.x, y - p.y) < 300 && tries < 40);
    const scale = (1 + (this.roomIndex - 1) * 0.12) * (this.room.elite ? 1.15 : 1);
    this.enemies.push({
      type: type, x: x, y: y, r: t.r, speed: t.speed * (type === 'boss' ? 1 : 1),
      hp: Math.round(t.hp * scale), maxHp: Math.round(t.hp * scale),
      dmg: t.dmg * ((this.contract && this.contract.dmgMul) || 1),
      ai: t.ai, col: t.col, xp: t.xp,
      coins: Math.round(t.coins * ((this.contract && this.contract.coinMul) || 1)),
      touchCd: 0, fireCd: rand(0.6, 2), hitFlash: 0, slow: 0, anim: rand(0, 10),
      phase: 0, chargeCd: rand(3, 6),
      boss: !!t.bossName, bossName: t.bossName || null
    });
    this.makeElite(this.enemies[this.enemies.length - 1]);
  },

  makeElite(e) {
    if (!e || e.type === 'boss') return;
    const chance = this.room && this.room.elite ? 0.38 : 0.07;
    if (RNG() >= chance) return;
    e.elite = true;
    e.maxHp = Math.round(e.maxHp * 2.2);
    e.hp = e.maxHp;
    e.dmg = Math.round(e.dmg * 1.35);
    e.r = e.r * 1.25;
    e.coins = e.coins * 3 + 2;
    e.xp = Math.round(e.xp * 2);
    e.speed *= 0.92;
  },

  /* --- update --- */
  update(dt) {
    if (this.state !== 'playing') return;
    this.time += dt;
    this.updatePlayer(dt);
    this.updateEnemies(dt);
    this.updateBullets(dt);
    this.updatePickups(dt);
    this.updateParticles(dt);
    this.updateTexts(dt);
    this.updateEffects(dt);
    this.updateMines(dt);
    this.updateModProps(dt);
    this.updateDrone(dt);
    this.checkClear(dt);
    this.updateCamera(dt);
  },

  updatePlayer(dt) {
    const p = this.player, r = this.room;
    const v = Input.vec();
    p.moving = v.mag > 0.05;
    p.moveX = v.x * v.mag;
    p.moveY = v.y * v.mag;
    const ice = this.room.mod && this.room.mod.id === 'ice';
    if (p.moving) {
      p.stepT = (p.stepT || 0) - dt;
      if (p.stepT <= 0) {
        p.stepT = 0.22;
        Sfx.step();
        this.parts.push({
          x: p.x - v.x * 8 + rand(-5, 5), y: p.y + 12 - v.y * 4 + rand(-3, 3),
          vx: -v.x * 26 + rand(-16, 16), vy: -v.y * 20 + rand(-10, 10),
          life: 0.42, max: 0.42, col: ice ? 'rgba(170,240,255,0.6)' : 'rgba(150,196,220,0.5)', r: rand(1.6, 3)
        });
      }
      p.anim += dt * 9 * v.mag;
      p.idle = 0;
    } else {
      p.idle += dt;
    }
    if (ice) {
      const sp = p.speed * (0.35 + 0.65 * v.mag);
      p.vx = lerp(p.vx || 0, v.x * sp, Math.min(1, dt * 2.4));
      p.vy = lerp(p.vy || 0, v.y * sp, Math.min(1, dt * 2.4));
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    } else {
      p.vx = 0; p.vy = 0;
      if (p.moving) {
        const sp = p.speed * (0.35 + 0.65 * v.mag);
        p.x += v.x * sp * dt;
        p.y += v.y * sp * dt;
      }
    }
    this.resolveCircleProps(p);
    p.x = clamp(p.x, p.r + 8, r.w - p.r - 8);
    p.y = clamp(p.y, p.r + 8, r.h - p.r - 8);

    p.invuln = Math.max(0, p.invuln - dt);
    p.flash = Math.max(0, p.flash - dt * 4);
    p.muzzle = Math.max(0, p.muzzle - dt * 8);
    p.atkCd -= dt;

    // aim & auto fire
    let target = this.nearestEnemy(p.x, p.y, p.projRange * 1.5);
    // турели — тоже цель: иначе персонаж стоит под обстрелом и не отвечает
    if (!target) target = this.nearestPropOfType(p.x, p.y, p.projRange * 1.4, ['turret', 'sentry']);
    if (!target && r.obj && (r.obj.type === 'reactors' || r.obj.type === 'hives')) {
      target = this.nearestObjProp(p.x, p.y, p.projRange * 1.3);
    }
    if (target) {
      const want = Math.atan2(target.y - p.y, target.x - p.x);
      let d = want - p.aim;
      while (d > Math.PI) d -= TAU;
      while (d < -Math.PI) d += TAU;
      p.aim += d * Math.min(1, dt * 14);
      const canFire = (p.idle > 0.06 || Settings.runGun) && p.atkCd <= 0;
      if (canFire && dst(p, target) < p.projRange) this.fire(p);
    } else if (p.moving) {
      p.aim = Math.atan2(v.y, v.x);
    }

    // portal
    if (r.cleared && r.doors) {
      for (const d of r.doors) {
        if (dst(p, d) < 54) { this.nextRoom(d.type); return; }
      }
    }
  },

  fire(p) {
    const w = WEAPONS[p.weapon] || WEAPONS.rifle;
    if (p.ammo && p.ammo[p.weapon] !== undefined && p.ammo[p.weapon] <= 0) {
      this.switchWeapon(1);
      if (p.weapon === 'rifle') UI.toast('ПАТРОНЫ КОНЧИЛИСЬ · ВИНТОВКА');
      return;
    }
    if (p.ammo && isFinite(p.ammo[p.weapon])) p.ammo[p.weapon] -= 1;
    p.atkCd = 1 / (p.atkRate * w.rate);
    p.muzzle = 1;
    const n = Math.max(1, p.projCount + (w.pellets || 0));
    const spread = w.spread;
    const base = p.aim - spread * (n - 1) / 2;
    const speed = p.projSpeed * w.projSpeed;
    for (let i = 0; i < n; i++) {
      const a = base + spread * i + (w.jitter ? rand(-w.jitter, w.jitter) : 0);
      const crit = RNG() < p.critChance;
      this.bullets.push({
        x: p.x + Math.cos(a) * 20, y: p.y + Math.sin(a) * 20,
        vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
        r: 4.2 * p.projSize * w.size,
        dmg: p.dmg * w.dmg * (crit ? p.critMult : 1),
        crit: crit, pierce: p.pierce + (w.pierce || 0), ric: p.ricochet,
        hits: [], life: (p.projRange * w.range) / speed,
        freeze: p.freeze, leech: p.leech,
        col: w.col, tracer: w.tracer || 1, aoe: w.aoe || 0
      });
    }
    this.addLight(
      p.x + Math.cos(p.aim) * 34,
      p.y + Math.sin(p.aim) * 34,
      44, '150,240,255', 0.09, 0.22
    );
    if (window.__haptics) window.__haptics.shot();
    if (p.weapon === 'shotgun' || p.weapon === 'rocket') Sfx.heavyShot();
    else if (p.weapon === 'laser' || p.weapon === 'plasma') Sfx.zapShot();
    else Sfx.shoot();
  },

  selectWeapon(id) {
    const p = this.player;
    if (!p || !WEAPONS[id]) return false;
    if (!p.unlocked[id]) return false;
    if (id !== 'rifle' && (!p.ammo[id] || p.ammo[id] <= 0)) return false;
    if (p.weapon === id) return true;
    p.weapon = id;
    UI.updateHud(true);
    Sfx.pickup();
    return true;
  },

  switchWeapon(dir) {
    const p = this.player;
    if (!p) return;
    const order = ['rifle', 'shotgun', 'smg', 'laser', 'rocket', 'plasma'];
    let idx = order.indexOf(p.weapon);
    for (let k = 1; k <= order.length; k++) {
      const cand = order[(idx + dir * k + order.length * 2) % order.length];
      if (!p.unlocked[cand]) continue;
      if (cand !== 'rifle' && (!p.ammo[cand] || p.ammo[cand] <= 0)) continue;
      p.weapon = cand;
      UI.updateHud(true);
      Sfx.pickup();
      return;
    }
  },

  buildNav(cols, rows, cell) {
    const blocked = new Uint8Array(cols * rows);
    for (const pr of this.props) {
      if (pr.dead) continue;
      const pad = 8;
      const x0 = Math.max(0, Math.floor((pr.x - pad) / cell));
      const x1 = Math.min(cols - 1, Math.floor((pr.x + pr.w + pad) / cell));
      const y0 = Math.max(0, Math.floor((pr.y - pad) / cell));
      const y1 = Math.min(rows - 1, Math.floor((pr.y + pr.h + pad) / cell));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) blocked[y * cols + x] = 1;
    }
    this.nav = { cols: cols, rows: rows, cell: cell, blocked: blocked };
  },

  ensureNav() {
    if (!this.room) return null;
    const cell = NAV_CELL;
    const cols = Math.max(1, Math.ceil(this.room.w / cell));
    const rows = Math.max(1, Math.ceil(this.room.h / cell));
    if (!this.nav || this.nav.cols !== cols || this.nav.rows !== rows) this.buildNav(cols, rows, cell);
    return this.nav;
  },

  /* A* по сетке: возвращает массив точек-центров клеток до цели */
  findPath(sx, sy, tx, ty) {
    const nav = this.ensureNav();
    if (!nav) return null;
    const cols = nav.cols, rows = nav.rows, cell = nav.cell, blocked = nav.blocked;
    const cx = x => Math.max(0, Math.min(cols - 1, Math.floor(x / cell)));
    const cy = y => Math.max(0, Math.min(rows - 1, Math.floor(y / cell)));
    const si = cy(sy) * cols + cx(sx), ti = cy(ty) * cols + cx(tx);
    if (si === ti) return null;
    if (blocked[si]) return null;

    const gScore = new Float32Array(cols * rows).fill(Infinity);
    const came = new Int32Array(cols * rows).fill(-1);
    const closed = new Uint8Array(cols * rows);
    const heap = [];
    const push = (i, f) => {
      heap.push([f, i]);
      let k = heap.length - 1;
      while (k > 0 && heap[(k - 1) >> 1][0] > heap[k][0]) {
        const tmp = heap[k]; heap[k] = heap[(k - 1) >> 1]; heap[(k - 1) >> 1] = tmp; k = (k - 1) >> 1;
      }
    };
    const pop = () => {
      const top = heap[0], last = heap.pop();
      if (heap.length) {
        heap[0] = last;
        let k = 0;
        for (;;) {
          const l = 2 * k + 1, r = l + 1;
          let m = k;
          if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
          if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
          if (m === k) break;
          const tmp = heap[k]; heap[k] = heap[m]; heap[m] = tmp; k = m;
        }
      }
      return top;
    };

    const tcx = ti % cols, tcy = Math.floor(ti / cols);
    const h = (i) => {
      const x = i % cols, y = Math.floor(i / cols);
      const dx2 = Math.abs(x - tcx), dy2 = Math.abs(y - tcy);
      return (dx2 + dy2) + (1.4142 - 2) * Math.min(dx2, dy2);
    };

    gScore[si] = 0;
    push(si, h(si));
    let guard = 0, found = false;
    while (heap.length && guard++ < 2200) {
      const cur = pop()[1];
      if (cur === ti) { found = true; break; }
      if (closed[cur]) continue;
      closed[cur] = 1;
      const x = cur % cols, y = Math.floor(cur / cols);
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          if (!ox && !oy) continue;
          const nx = x + ox, ny = y + oy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          const ni = ny * cols + nx;
          if (blocked[ni] || closed[ni]) continue;
          if (ox && oy && (blocked[y * cols + nx] || blocked[ny * cols + x])) continue; // без срезания углов
          const step = (ox && oy) ? 1.4142 : 1;
          const g2 = gScore[cur] + step;
          if (g2 < gScore[ni]) {
            gScore[ni] = g2;
            came[ni] = cur;
            push(ni, g2 + h(ni));
          }
        }
      }
    }
    if (!found) return null;

    const out = [];
    let node = ti;
    while (node !== si && node >= 0) {
      out.push([(node % cols + 0.5) * cell, (Math.floor(node / cols) + 0.5) * cell]);
      node = came[node];
    }
    out.reverse();
    return out;
  },

  /* направление к следующей точке пути (или null — идти напрямую) */
  navDir(e, dt) {
    const p = this.player;
    if (!p) return null;
    if (Math.hypot(p.x - e.x, p.y - e.y) < 90) { e.navPath = null; return null; }
    e.navT = (e.navT === undefined ? Math.random() * 0.4 : e.navT) - dt;
    if (e.navT <= 0) {
      e.navT = 0.5 + Math.random() * 0.3;
      e.navPath = this.findPath(e.x, e.y, p.x, p.y);
    }
    const path = e.navPath;
    if (!path || !path.length) return null;
    while (path.length && Math.hypot(path[0][0] - e.x, path[0][1] - e.y) < 26) path.shift();
    if (!path.length) return null;
    const t = path[0];
    const dx = t[0] - e.x, dy = t[1] - e.y;
    const len = Math.max(1, Math.hypot(dx, dy));
    return { x: dx / len, y: dy / len };
  },

  nearestEnemy(x, y, maxD) {
    let best = null, bd = maxD * maxD;
    for (const e of this.enemies) {
      const d = (e.x - x) * (e.x - x) + (e.y - y) * (e.y - y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  },

  updateEnemies(dt) {
    const p = this.player;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.hitFlash = Math.max(0, e.hitFlash - dt * 5);
      e.touchCd = Math.max(0, e.touchCd - dt);
      e.slow = Math.max(0, e.slow - dt);
      e.anim += dt * 5;
      const d = Math.max(1, dst(e, p));
      let dx = (p.x - e.x) / d, dy = (p.y - e.y) / d;
      if (e.ai !== 'boss') {
        const nav = this.navDir(e, dt);
        if (nav) { dx = nav.x; dy = nav.y; }
      }
      const spd = e.speed * (e.slow > 0 ? 0.45 : 1);
      e.chargeCd -= dt;

      if (e.ai === 'chase') {
        e.x += dx * spd * dt;
        e.y += dy * spd * dt;
      } else if (e.ai === 'shooter') {
        const want = 240;
        const k = d < want - 40 ? -1 : (d > want + 60 ? 1 : 0);
        e.x += dx * spd * dt * k;
        e.y += dy * spd * dt * k;
        e.x += -dy * spd * 0.45 * dt;
        e.y += dx * spd * 0.45 * dt;
        e.fireCd -= dt;
        if (e.fireCd <= 0 && d < 620) {
          e.fireCd = rand(1.5, 2.3);
          const a = Math.atan2(p.y - e.y, p.x - e.x);
          this.enemyShot(e, a, 260, 7);
        }
      } else if (e.ai === 'matka') {
        e.x += dx * spd * dt;
        e.y += dy * spd * dt;
        e.fireCd -= dt;
        if (e.fireCd <= 0 && d < 620) {
          e.fireCd = 2.6;
          const base = Math.atan2(p.y - e.y, p.x - e.x);
          for (let k = 0; k < 6; k++) this.enemyShot(e, base + (k - 2.5) * 0.28, 190, 8);
        }
        e.summonCd = (e.summonCd === undefined ? 4 : e.summonCd) - dt;
        if (e.summonCd <= 0 && this.enemies.length < 12) {
          e.summonCd = 6;
          for (let k = 0; k < 2; k++) {
            const a = rand(0, TAU);
            this.spawnAt('swarm', e.x + Math.cos(a) * 70, e.y + Math.sin(a) * 70);
          }
          this.addLight(e.x, e.y, 120, '255,180,90', 0.3, 0.4);
        }
      } else if (e.ai === 'boss') {
        const frac = e.hp / e.maxHp;
        e.phase = frac > 0.66 ? 1 : (frac > 0.33 ? 2 : 3);
        const speedMul = [1, 1, 1.25, 1.5][e.phase];
        if (e.dashT > 0) {
          e.dashT -= dt;
          e.x += e.dashDir.x * 540 * dt;
          e.y += e.dashDir.y * 540 * dt;
        } else {
          e.x += dx * spd * speedMul * dt;
          e.y += dy * spd * speedMul * dt;
        }
        e.fireCd -= dt;
        if (e.fireCd <= 0) {
          e.fireCd = [0, 2.1, 1.6, 1.15][e.phase];
          const n = 8 + e.phase * 3;
          const base = Math.atan2(p.y - e.y, p.x - e.x);
          for (let k = 0; k < n; k++) this.enemyShot(e, base + (k / n) * TAU, 200 + e.phase * 25, 6 + e.phase * 2);
        }
        if (e.phase >= 2 && e.chargeCd <= 0) {
          e.chargeCd = e.phase === 2 ? 6 : 4;
          e.dashT = 0.34;
          e.dashDir = { x: dx, y: dy };
          this.addLight(e.x, e.y, 120, '255,80,120', 0.3, 0.4);
        }
        if (e.phase >= 2) {
          e.mineCd = (e.mineCd === undefined ? 2.4 : e.mineCd) - dt;
          if (e.mineCd <= 0 && this.mines.length < 8) {
            e.mineCd = e.phase === 2 ? 3.2 : 2.0;
            this.dropMine();
          }
        }
        e.summonCd = (e.summonCd === undefined ? 6 : e.summonCd) - dt;
        if (e.summonCd <= 0 && this.enemies.length < 14) {
          e.summonCd = 7;
          for (let k = 0; k < 3; k++) {
            const a = rand(0, TAU), rr = rand(90, 160);
            const ax = clamp(e.x + Math.cos(a) * rr, 60, this.room.w - 60);
            const ay = clamp(e.y + Math.sin(a) * rr, 60, this.room.h - 60);
            this.spawnAt('swarm', ax, ay);
          }
        }
      }
      // separation
      for (let j = i - 1; j >= 0; j--) {
        const o = this.enemies[j];
        const dd = dst(e, o), minD = e.r + o.r;
        if (dd > 0.01 && dd < minD) {
          const push = (minD - dd) * 0.5;
          const ux = (e.x - o.x) / dd, uy = (e.y - o.y) / dd;
          e.x += ux * push; e.y += uy * push;
          o.x -= ux * push; o.y -= uy * push;
        }
      }
      this.resolveCircleProps(e);
      e.x = clamp(e.x, e.r + 6, this.room.w - e.r - 6);
      e.y = clamp(e.y, e.r + 6, this.room.h - e.r - 6);

      // contact damage
      if (d < e.r + p.r && e.touchCd <= 0) {
        e.touchCd = 0.85;
        this.hurtPlayer(e.dmg);
        const kb = 26;
        p.x += dx * kb; p.y += dy * kb;
      }
    }
  },

  spawnAt(type, x, y) {
    const t = ETYPES[type] || ETYPES.grunt;
    const scale = 1 + (this.roomIndex - 1) * 0.16;
    this.enemies.push({
      type: type, x: x, y: y, r: t.r, speed: t.speed, hp: Math.round(t.hp * scale),
      maxHp: Math.round(t.hp * scale), dmg: t.dmg, ai: t.ai, col: t.col, xp: t.xp, coins: t.coins,
      touchCd: 0.6, fireCd: rand(1, 2.4), hitFlash: 0, slow: 0, anim: 0, phase: 0, chargeCd: rand(3, 6)
    });
  },

  enemyShot(e, a, spd, dmg, src) {
    this.ebullets.push({
      x: e.x + Math.cos(a) * ((e.r || 10) + 4), y: e.y + Math.sin(a) * ((e.r || 10) + 4),
      vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, r: 5, dmg: dmg, life: 3.2,
      src: src || null
    });
  },

  updateBullets(dt) {
    const r = this.room;
    if (this.bullets.length > 320) this.bullets.splice(0, this.bullets.length - 320);
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      let dead = b.life <= 0 || b.x < -20 || b.y < -20 || b.x > r.w + 20 || b.y > r.h + 20;
      if (!dead) {
        for (const pr of this.props) {
          if (b.x > pr.x - b.r && b.x < pr.x + pr.w + b.r && b.y > pr.y - b.r && b.y < pr.y + pr.h + b.r) {
            this.damageProp(pr, b.dmg);
            if (b.aoe) this.explodeAt(b.x, b.y, b.aoe, b.dmg * 0.9);
            dead = true;
            break;
          }
        }
      }
      if (!dead) {
        for (const e of this.enemies) {
          if (b.hits.indexOf(e) >= 0) continue;
          if (dst(b, e) < e.r + b.r) {
            let dmg = b.dmg;
            if (e.type === 'boss' && Math.hypot(b.x - e.x, b.y - e.y) < e.r * 0.5) {
              dmg *= 1.8;
              this.addLight(b.x, b.y, 70, '255,235,140', 0.16, 0.45);
            }
            this.damageEnemy(e, dmg, b.crit);
            if (b.aoe) { this.explodeAt(b.x, b.y, b.aoe, dmg * 0.9); }
            b.hits.push(e);
            if (b.freeze > 0) e.slow = Math.max(e.slow, 0.9);
            if (b.leech > 0) {
              const heal = b.dmg * b.leech;
              this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
            }
            if (b.ric > 0) {
              const nxt = this.nearestEnemyExcluding(b.x, b.y, 380, b.hits);
              if (nxt) {
                b.ric--;
                const a = Math.atan2(nxt.y - b.y, nxt.x - b.x);
                const sp = Math.hypot(b.vx, b.vy);
                b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp;
                b.life = Math.max(b.life, 0.45);
              } else dead = true;
            } else if (b.pierce > 0) {
              b.pierce--;
            } else {
              dead = true;
            }
            break;
          }
        }
      }
      if (dead) { this.bullets.splice(i, 1); }
    }

    const p = this.player;
    for (let i = this.ebullets.length - 1; i >= 0; i--) {
      const b = this.ebullets[i];
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.life <= 0 || b.x < -30 || b.y < -30 || b.x > r.w + 30 || b.y > r.h + 30) {
        this.ebullets.splice(i, 1); continue;
      }
      let blocked = false;
      for (const pr of this.props) {
        if (b.src === pr) continue;
        if (b.x > pr.x - b.r && b.x < pr.x + pr.w + b.r && b.y > pr.y - b.r && b.y < pr.y + pr.h + b.r) {
          this.damageProp(pr, b.dmg);
          blocked = true;
          break;
        }
      }
      if (blocked) { this.ebullets.splice(i, 1); continue; }
      if (dst(b, p) < p.r + b.r) {
        this.hurtPlayer(b.dmg);
        this.burst(b.x, b.y, '#ff8fb0', 6);
        this.ebullets.splice(i, 1);
      }
    }
  },

  nearestPropOfType(x, y, range, types) {
    let best = null, bd = range;
    for (const pr of this.props) {
      if (pr.dead || pr.hp <= 0) continue;
      if (types.indexOf(pr.type) < 0) continue;
      const cx = pr.x + pr.w / 2, cy = pr.y + pr.h / 2;
      const dd = Math.hypot(cx - x, cy - y);
      if (dd < bd) { bd = dd; best = { x: cx, y: cy, prop: pr, d: dd }; }
    }
    return best;
  },

  nearestObjProp(x, y, maxD) {
    let best = null, bd = maxD;
    for (const pr of this.props) {
      if (pr.dead) continue;
      if (pr.type !== 'reactor' && pr.type !== 'hive') continue;
      const cx = pr.x + pr.w / 2, cy = pr.y + pr.h / 2;
      const d = Math.hypot(cx - x, cy - y);
      if (d < bd) { bd = d; best = { x: cx, y: cy, prop: pr, r: pr.w * 0.5 }; }
    }
    return best;
  },

  nearestEnemyExcluding(x, y, maxD, excl) {
    let best = null, bd = maxD * maxD;
    for (const e of this.enemies) {
      if (excl.indexOf(e) >= 0) continue;
      const d = (e.x - x) * (e.x - x) + (e.y - y) * (e.y - y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  },

  damageEnemy(e, dmg, crit) {
    e.hp -= dmg;
    e.hitFlash = 1;
    if (this.texts.length < 40) {
      this.texts.push({
        x: e.x + rand(-8, 8), y: e.y - e.r - 8,
        v: (crit ? '✷' : '') + Math.round(dmg),
        col: crit ? '#ffd24f' : '#dff6ff',
        life: 0.7, max: 0.7, crit: !!crit,
        vy: crit ? -58 : -44
      });
    }
    this.burst(e.x, e.y, crit ? '#ffd24f' : e.col, crit ? 8 : 4);
    Sfx.hit();
    if (e.hp <= 0) this.killEnemy(e);
  },

  killEnemy(e) {
    if (RNG() < 0.5) Sfx.growl();
    const idx = this.enemies.indexOf(e);
    if (idx < 0) return;
    this.enemies.splice(idx, 1);
    this.kills++;
    this.burst(e.x, e.y, e.col, e.type === 'boss' ? 40 : 12);
    this.spawnGibs(e);
    this.spawnSplat(e);
    this.addLight(e.x, e.y, e.type === 'boss' ? 170 : 64, '120,255,140', 0.28, 0.3);
    if (RNG() < 0.20) {
      const pool = ['shotgun', 'smg', 'laser', 'rocket', 'plasma'].filter(w => this.player.unlocked[w]);
      if (pool.length) {
        const w = pick(pool);
        this.pickups.push({ type: 'ammo', w: w, x: e.x + rand(-10, 10), y: e.y + rand(-10, 10), r: 11, v: AMMO_DROP[w], vx: rand(-30, 30), vy: rand(-30, 30), t: 0 });
      }
    }
    const nCoins = e.coins;
    for (let k = 0; k < nCoins; k++) {
      this.pickups.push({ type: 'coin', x: e.x + rand(-14, 14), y: e.y + rand(-14, 14), r: 9, v: 1, vx: rand(-40, 40), vy: rand(-40, 40), t: 0 });
    }
    const nXp = Math.max(1, Math.round(e.xp / 2));
    for (let k = 0; k < nXp; k++) {
      this.pickups.push({ type: 'xp', x: e.x + rand(-16, 16), y: e.y + rand(-16, 16), r: 8, v: Math.ceil(e.xp / nXp), vx: rand(-30, 30), vy: rand(-30, 30), t: 0 });
    }
    if (e.boss) {
      const meta = getMeta();
      meta.bosses = (meta.bosses || 0) + 1;
      saveMeta(meta);
      if (!meta.drone) {
        meta.drone = 1; saveMeta(meta);
        this.drone = { x: this.player.x, y: this.player.y - 58, cd: 0.4, level: 1, bob: 0, fireFlash: 0 };
        UI.toast('ДРОН-СПУТНИК РАЗБЛОКИРОВАН');
      }
      this.mines.length = 0;
      if (this.roomIndex >= MAX_SECTOR) { UI.updateHud(true); this.win(); return; }
    }
    if (e.type === 'boss' || e.boss) {
      this.mines.length = 0;   // с гибелью босса его мины обезвреживаются
      this.cam.shake = 12;
      this.pickups.push({ type: 'chest', x: e.x, y: e.y, r: 20, v: 1, vx: 0, vy: 0, t: 0 });
      UI.toast((e.bossName || 'СТРАЖ') + ' УНИЧТОЖЕН');
    }
  },

  hurtPlayer(dmg) {
    if (this.drone && (this.drone.level || 0) >= 3) dmg *= 0.92;
    const p = this.player;
    if (p.invuln > 0) return;
    p.hp -= dmg;
    this.hurtFlash = 1;
    p.invuln = 0.45;
    p.flash = 1;
    this.cam.shake = Math.max(this.cam.shake, 7);
    Sfx.hurt();
    if (window.__haptics) window.__haptics.hurt();
    if (p.hp <= 0) { p.hp = 0; this.die(); }
  },

  /* боссовая комната в 3D, если включено в настройках */
  startBossRoom(i) {
    if (!this.room || !this.room.boss || !Settings.boss3d) return false;
    const bt = i >= MAX_SECTOR ? 'matriarch' : (i === 9 ? 'matka' : 'boss');
    const base = (ETYPES[bt] && ETYPES[bt].hp) || 430;
    const hp = Math.round(base * (1 + 0.12 * (i - 1)));
    const p = this.player;
    const ws = Object.keys(p.unlocked).filter(k => p.unlocked[k]);
    const load = {
      w: ws.join(','),
      a: ws.map(k => p.ammo[k] === Infinity ? -1 : Math.round(p.ammo[k] || 0)).join(','),
      cur: p.weapon,
      php: Math.round(p.hp),
      pmax: Math.round(p.maxHp)
    };
    if (!UI.openBoss3D || !UI.openBoss3D(i, bt, hp, load)) return false;
    this.boss3dType = bt;
    this.state = 'boss3d';
    UI.toast('СЕКТОР ' + i + ' · БОСС · 3D');
    return true;
  },

  finishBoss3D(win, data) {
    UI.closeBoss3D();
    Input.reset();                  // после iframe события пальца терялись
    const r = this.room;
    const p = this.player;
    if (data && typeof data.hp === 'number' && p) {
      if (win) p.hp = Math.max(1, Math.min(p.maxHp, data.hp));
      if (data.ammo) {
        for (const k in data.ammo) {
          if (!p.unlocked[k]) continue;
          const v = data.ammo[k];
          p.ammo[k] = v < 0 ? Infinity : Math.max(0, v);
        }
      }
    }
    if (!r) { this.state = 'playing'; return; }
    if (!win) { this.state = 'playing'; if (p) p.hp = 0; UI.showHud(true); this.die(); return; }
    this.enemies.length = 0;
    this.kills++;
    const coins = 40 + this.roomIndex * 10;
    this.coins += coins;
    this.pickups.push({ type: 'chest', x: r.w / 2, y: r.h / 2 - 40, r: 20, v: 1, vx: 0, vy: 0, t: 0 });
    r.cleared = true;
    r.doors = [
      { x: r.w / 2 - 150, y: 60, r: 44, type: 'normal', pulse: 0 },
      { x: r.w / 2 + 150, y: 60, r: 44, type: 'elite', pulse: 0 }
    ];
    this.state = 'playing';
    UI.showHud(true);
    UI.updateHud(true);
    UI.toast('БОСС УНИЧТОЖЕН · +' + coins + ' ⛁');
    Sfx.level();
    saveGame();
  },

  quitBoss3D() {
    UI.closeBoss3D();
    Input.reset();                  // иначе стик остаётся зажатым после iframe
    this.state = 'playing';
    UI.showHud(true);
    this.spawnWave();
    UI.updateHud(true);
    UI.toast('3D ОТКЛЮЧЁН ДЛЯ ЭТОГО БОЯ');
  },

  takeContract(kind) {
    const p = this.player;
    this.contract = null;
    if (kind === 'hunt') this.contract = { id: 'hunt', dmgMul: 1.35, coinMul: 1.6 };
    else if (kind === 'trial') {
      this.contract = { id: 'trial', extraPerk: 1 };
      p.maxHp = Math.max(30, Math.round(p.maxHp * 0.78));
      p.hp = Math.min(p.hp, p.maxHp);
    }
    UI.showScreen(null);
    UI.showHud(true);
    this.state = 'playing';
    if (this.startBossRoom(this.roomIndex)) {
      UI.updateHud(true);
      Sfx.boss();
      return;
    }
    this.spawnWave();
    UI.updateHud(true);
    Sfx.boss();
    Sfx.bossTheme(true);
    UI.toast(kind === 'hunt' ? 'ОХОТА · ВРАГИ БЬЮТ СИЛЬНЕЕ, ДОБЫЧА ЖИРНЕЕ' :
      kind === 'trial' ? 'ИСПЫТАНИЕ · МИНУС HP, ПЛЮС ПЕРК' : 'БОСС · БЕЗ УСЛОВИЙ');
    if (kind === 'trial') setTimeout(() => { this.pendingPerks = (this.pendingPerks || 0) + 1; this.openPerk(); }, 500);
  },

  buyDrone() {
    const meta = getMeta();
    const lvl = meta.drone || 0;
    if (lvl >= 5) return;
    const price = 180 * Math.max(1, lvl);
    if (meta.coins < price) return;
    meta.coins -= price;
    meta.drone = lvl + 1;
    saveMeta(meta);
    Sfx.level();
    UI.showUpgrades();
    UI.toast('ДРОН · УРОВЕНЬ ' + meta.drone);
  },

  win() {
    this.state = 'win';
    Sfx.bossTheme(false);
    pushRecord({ s: MAX_SECTOR, k: this.kills, c: this.coins, d: Date.now(), w: 1 });
    const meta = getMeta();
    meta.coins += this.coins + 500;
    meta.wins = (meta.wins || 0) + 1;
    meta.best = Math.max(meta.best, this.roomIndex);
    meta.runs++;
    if (this.daily && this.dailyKey) {
      meta.daily = meta.daily || {};
      if (meta.daily.date !== this.dailyKey) meta.daily = { date: this.dailyKey, best: 0 };
      meta.daily.best = Math.max(meta.daily.best || 0, this.roomIndex);
    }
    saveMeta(meta);
    clearSave();
    UI.showVictory();
  },

  die() {
    this.state = 'dead';
    Sfx.bossTheme(false);
    pushRecord({ s: this.roomIndex, k: this.kills, c: this.coins, d: Date.now(), w: 0 });
    const meta = getMeta();
    meta.coins += this.coins;
    meta.best = Math.max(meta.best, this.roomIndex);
    meta.runs++;
    if (this.daily && this.dailyKey) {
      meta.daily = meta.daily || {};
      if (meta.daily.date !== this.dailyKey) meta.daily = { date: this.dailyKey, best: 0 };
      meta.daily.best = Math.max(meta.daily.best || 0, this.roomIndex);
    }
    saveMeta(meta);
    clearSave();
    UI.showGameOver();
  },

  updatePickups(dt) {
    const p = this.player;
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const k = this.pickups[i];
      k.t += dt;
      k.x += (k.vx || 0) * dt; k.y += (k.vy || 0) * dt;
      k.vx *= 0.92; k.vy *= 0.92;
      const d = dst(k, p);
      const magnet = k.type === 'chest' ? 0 : (this.room.cleared ? 3000 : 110);
      if (d < magnet) {
        const pull = (1 - d / magnet) * 420;
        const ux = (p.x - k.x) / (d || 1), uy = (p.y - k.y) / (d || 1);
        k.x += ux * pull * dt; k.y += uy * pull * dt;
      }
      if (d < p.r + k.r + 4) {
        if (k.type === 'coin') { this.coins += k.v; Sfx.pickup(); }
        else if (k.type === 'xp') { this.gainXp(k.v); Sfx.pickup(); }
        else if (k.type === 'ammo') {
          this.player.ammo[k.w] = (this.player.ammo[k.w] || 0) + k.v;
          UI.toast('+' + k.v + ' · ' + WEAPONS[k.w].nm);
        }
        else if (k.type === 'chest') { this.openChest(); }
        this.burst(k.x, k.y, k.type === 'coin' ? '#ffcf4f' : (k.type === 'xp' ? '#4ff0ff' : '#ff4fd8'), 5);
        this.pickups.splice(i, 1);
      }
    }
  },

  openChest() {
    const p = this.player;
    const roll = RNG() + (this.luck || 0);
    if (roll < 0.4) { p.dmgMult *= 1.25; UI.toast('МОДУЛЬ: +25% УРОНА'); }
    else if (roll < 0.7) { p.maxHp += 30; p.hp = Math.min(p.maxHp, p.hp + 30); UI.toast('МОДУЛЬ: +30 HP'); }
    else if (roll < 0.9) { p.atkRate *= 1.2; UI.toast('МОДУЛЬ: +20% СКОРОСТИ АТАКИ'); }
    else { p.critChance = Math.min(0.85, p.critChance + 0.12); UI.toast('МОДУЛЬ: +12% КРИТ'); }
    this.coins += 20;
    Sfx.level();
    UI.updateHud(true);
  },

  gainXp(v) {
    // рост урона с уровнем идёт отдельно от перков
    this.xp += v;
    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.level++;
      if (this.player) this.player.dmgMult *= 1.04;
      this.xpNext = Math.round(this.xpNext * 1.35 + 5);
      this.pendingPerks++;
    }
    if (this.pendingPerks > 0) this.openPerk();
  },

  openPerk() {
    if (this.state !== 'playing') return;
    this.state = 'perk';
    Sfx.level();
    const avail = PERKS.filter(p => (this.perkLog[p.id] || 0) < p.max);
    const choose = [];
    const pool = avail.slice();
    while (choose.length < 3 && pool.length) choose.push(pool.splice(Math.floor(RNG() * pool.length), 1)[0]);
    UI.showPerks(choose);
  },

  takePerk(perk) {
    perk.apply(this.player);
    this.perkLog[perk.id] = (this.perkLog[perk.id] || 0) + 1;
    this.pendingPerks = Math.max(0, this.pendingPerks - 1);
    this.state = 'playing';
    UI.showPerks(false);
    UI.updateHud(true);
    saveGame();
    if (this.pendingPerks > 0) setTimeout(() => this.openPerk(), 120);
  },

  /* ---------- окружение, кровь, свет ---------- */
  setupObjective() {
    const r = this.room;
    r.obj = { type: 'kill' };
    if (r.boss) return;
    const roll = RNG();
    if (roll < 0.28) {
      r.obj = { type: 'reactors', left: 3, total: 3 };
      for (let i = 0; i < 3; i++) {
        let x = 0, y = 0, tries = 0;
        do {
          x = rand(110, r.w - 110); y = rand(150, r.h - 260); tries++;
        } while ((Math.hypot(x - this.player.x, y - this.player.y) < 220 || !this.freeSpot(x, y, 40)) && tries < 60);
        this.props.push({ type: 'reactor', x: x - 22, y: y - 22, w: 44, h: 44, hp: 95, maxHp: 95, flash: 0, dead: false, objective: true });
      }
    } else if (roll < 0.5) {
      r.obj = { type: 'survive', time: 40, total: 40, nextSpawn: 0 };
    }
  },

  setupMod() {
    const m = this.room.mod;
    if (!m) return;
    const W = this.room.w, H = this.room.h;
    if (m.id === 'turrets') {
      const n = this.roomIndex > 12 ? 3 : 2;
      for (let k = 0; k < n; k++) {
        this.props.push({ type: 'turret', x: rand(90, W - 150), y: rand(150, H - 280), w: 48, h: 48, hp: 110, maxHp: 110, flash: 0, dead: false, fireCd: rand(1.2, 3) });
      }
    } else if (m.id === 'hive') {
      const n = this.roomIndex >= 15 ? 3 : 2;
      for (let k = 0; k < n; k++) {
        this.props.push({ type: 'hive', x: rand(90, W - 170), y: rand(150, H - 280), w: 72, h: 72, hp: 240, maxHp: 240, flash: 0, dead: false, spawnCd: rand(2.5, 5) });
      }
      const left = this.props.filter(p => p.type === 'hive').length;
      this.room.obj = { type: 'hives', left: left, total: left };
    } else if (m.id === 'acid') {
      this.acid = [];
      const n = 5 + Math.floor(this.roomIndex / 6);
      for (let k = 0; k < n; k++) {
        this.acid.push({ x: rand(140, W - 140), y: rand(160, H - 240), r: rand(44, 78), t: rand(0, 6), cd: 0 });
      }
    }
  },

  updateDrone(dt) {
    const d = this.drone, p = this.player;
    if (!d || !p) return;
    d.bob += dt;
    const side = Math.cos(d.bob * 0.9) * 34;
    const tx = p.x + side, ty = p.y - 62 + Math.sin(d.bob * 1.7) * 6;
    d.x = lerp(d.x, tx, Math.min(1, dt * 4.2));
    d.y = lerp(d.y, ty, Math.min(1, dt * 4.2));
    d.cd -= dt;
    d.fireFlash = Math.max(0, d.fireFlash - dt * 6);
    if (d.cd > 0) return;
    const tgt = this.nearestEnemy(d.x, d.y, 430);
    if (!tgt) return;
    const lv = d.level || 1;
    d.cd = Math.max(0.35, 1.15 - lv * 0.08);
    d.fireFlash = 1;
    const dmg = p.dmg * (0.3 + 0.1 * lv);
    const a0 = Math.atan2(tgt.y - d.y, tgt.x - d.x);
    const shots = lv >= 5 ? 2 : 1;
    for (let i = 0; i < shots; i++) {
      const a = a0 + (shots > 1 ? (i - 0.5) * 0.08 : 0);
      const sp = 720;
      this.bullets.push({
        x: d.x, y: d.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 3.4,
        dmg: dmg, crit: false, pierce: 0, ric: 0, hits: [], life: 500 / sp,
        freeze: 0, leech: 0, col: '150,255,220', tracer: 1.1, aoe: 0
      });
    }
    this.addLight(d.x, d.y, 46, '150,255,220', 0.1, 0.3);
    Sfx.shoot();
  },

  updateModProps(dt) {
    const m = this.room.mod, p = this.player;
    if (!m || !p) return;
    for (const pr of this.props) {
      if (pr.dead) continue;
      if (pr.type === 'turret') {
        pr.fireCd -= dt;
        if (pr.fireCd <= 0) {
          pr.fireCd = 2.4;
          const cx = pr.x + pr.w / 2, cy = pr.y + pr.h / 2;
          if (Math.hypot(p.x - cx, p.y - cy) < 640) {
            this.enemyShot({ x: cx, y: cy }, Math.atan2(p.y - cy, p.x - cx), 235, 7, pr);
            this.addLight(cx, cy, 70, '255,180,90', 0.14, 0.5);
          }
        }
      } else if (pr.type === 'hive' && !this.room.cleared) {
        pr.spawnCd -= dt;
        if (pr.spawnCd <= 0 && this.enemies.length < 11) {
          pr.spawnCd = 5.5;
          const cx = pr.x + pr.w / 2, cy = pr.y + pr.h / 2;
          this.spawnAt(pick(['swarm', 'grunt']), cx + rand(-40, 40), cy + rand(-40, 40));
          this.burst(cx, cy, '#c98bff', 6);
        }
      }
    }
    if (m.id === 'acid' && this.acid) {
      for (const a of this.acid) {
        a.t += dt;
        if (a.cd > 0) a.cd -= dt;
        if (Math.hypot(p.x - a.x, p.y - a.y) < a.r && a.cd <= 0) {
          a.cd = 0.9;
          this.hurtPlayer(7);
          this.burst(p.x, p.y + 8, '#9dff5c', 4);
        }
      }
    }
  },

  /* свободная ли точка (не внутри стены/ящика) */
  freeSpot(x, y, pad) {
    const r = pad || 16;
    for (const pr of this.props) {
      if (pr.dead) continue;
      if (x > pr.x - r && x < pr.x + pr.w + r && y > pr.y - r && y < pr.y + pr.h + r) return false;
    }
    return true;
  },

  /* планировка комнаты: открытая, колонны, крест, лабиринт, арена босса */
  setupLayout() {
    const r = this.room, W = r.w, H = r.h;
    let kind;
    if (r.boss) kind = 'arena';
    else if (r.elite) kind = 'pillars';
    else if (this.roomIndex <= 2) kind = 'open';
    else kind = pick(['open', 'pillars', 'cross', 'maze', 'maze']);
    r.layout = kind;
    if (kind === 'open') return;

    const safe = [
      { x: W / 2, y: H - 150, r: 200 },   // спавн игрока
      { x: W / 2, y: 92, r: 230 }         // порталы
    ];
    const walls = [];
    const addWall = (x, y, w, h) => {
      if (w < 26 || h < 26) return;
      if (x < 30 || y < 30 || x + w > W - 30 || y + h > H - 30) return;
      for (const s of safe) {
        const nx = clamp(s.x, x, x + w), ny = clamp(s.y, y, y + h);
        if (Math.hypot(s.x - nx, s.y - ny) < s.r) return;
      }
      if (walls.length >= 16) return;
      walls.push({ type: 'wall', x: x, y: y, w: w, h: h, hp: 1, maxHp: 1, flash: 0, dead: false, solid: true });
    };

    if (kind === 'pillars') {
      const stepX = W / 4, stepY = H / 3.2;
      for (let i = 1; i <= 3; i++) {
        for (let j = 1; j <= 2; j++) {
          if (RNG() < 0.25) continue;
          const bw = rand(58, 86), bh = rand(58, 86);
          addWall(i * stepX - bw / 2 + rand(-20, 20), j * stepY - bh / 2 + rand(-20, 20), bw, bh);
        }
      }
    } else if (kind === 'cross') {
      const t = 46;
      addWall(W * 0.16, H * 0.20, W * 0.26, t);
      addWall(W * 0.58, H * 0.20, W * 0.26, t);
      addWall(W * 0.16, H * 0.62, W * 0.26, t);
      addWall(W * 0.58, H * 0.62, W * 0.26, t);
      addWall(W * 0.20, H * 0.20, t, H * 0.22);
      addWall(W * 0.76, H * 0.58, t, H * 0.24);
    } else if (kind === 'maze') {
      const M = 46;
      const rec = (x, y, w, h, depth) => {
        if (w < 320 || h < 320 || depth > 3) return;
        const th = 34;
        if (w >= h) {
          const sx = x + rand(w * 0.34, w * 0.66);
          const gy = y + rand(h * 0.28, h * 0.72);
          addWall(sx, y, th, Math.max(0, gy - y - 70));
          addWall(sx, gy + 70, th, Math.max(0, y + h - gy - 70));
          rec(x, y, sx - x, h, depth + 1);
          rec(sx + th, y, x + w - sx - th, h, depth + 1);
        } else {
          const sy = y + rand(h * 0.34, h * 0.66);
          const gx = x + rand(w * 0.28, w * 0.72);
          addWall(x, sy, Math.max(0, gx - x - 70), th);
          addWall(gx + 70, sy, Math.max(0, x + w - gx - 70), th);
          rec(x, y, w, sy - y, depth + 1);
          rec(x, sy + th, w, y + h - sy - th, depth + 1);
        }
      };
      rec(M, M + 70, W - 2 * M, H - 2 * M - 150, 0);
    } else if (kind === 'arena') {
      addWall(W * 0.18, H * 0.30, 76, 76);
      addWall(W * 0.78, H * 0.30, 76, 76);
      addWall(W * 0.48, H * 0.55, 96, 60);
    }

    for (const w of walls) this.props.push(w);
    this.nav = null;
  },

  spawnProps() {
    const W = this.room.w, H = this.room.h, p = this.player;
    const n = randInt(2, 4) + (this.room.boss ? 1 : 0);
    let tries = 0;
    while (this.props.length < n && tries++ < 80) {
      const type = pick(['crate', 'crate', 'pipe', 'barrel']);
      let w, h;
      if (type === 'crate') { w = rand(52, 82); h = rand(46, 66); }
      else if (type === 'pipe') {
        if (RNG() < 0.5) { w = rand(96, 160); h = 20; } else { w = 20; h = rand(96, 160); }
      } else { w = 34; h = 34; }
      const x = rand(80, W - 80 - w), y = rand(120, H - 230 - h);
      const cx = x + w / 2, cy = y + h / 2;
      if (Math.hypot(cx - p.x, cy - p.y) < 210) continue;
      if (Math.hypot(cx - W / 2, cy - 60) < 150) continue;
      let clash = false;
      for (const o of this.props) {
        if (Math.hypot(o.x + o.w / 2 - cx, o.y + o.h / 2 - cy) < 110) { clash = true; break; }
      }
      if (clash) continue;
      const hp = type === 'barrel' ? 26 : (type === 'crate' ? 70 : 52);
      this.props.push({ type: type, x: x, y: y, w: w, h: h, hp: hp, maxHp: hp, flash: 0, dead: false });
    }
  },

  resolveCircleProps(o) {
    for (const pr of this.props) {
      if (pr.dead) continue;
      const nx = clamp(o.x, pr.x, pr.x + pr.w);
      const ny = clamp(o.y, pr.y, pr.y + pr.h);
      const dx = o.x - nx, dy = o.y - ny;
      const d2 = dx * dx + dy * dy;
      if (d2 >= o.r * o.r) continue;
      const d = Math.sqrt(d2);
      if (d < 0.001) {
        const l = o.x - pr.x, rr = pr.x + pr.w - o.x;
        const t = o.y - pr.y, b = pr.y + pr.h - o.y;
        const m = Math.min(l, rr, t, b);
        if (m === l) o.x = pr.x - o.r;
        else if (m === rr) o.x = pr.x + pr.w + o.r;
        else if (m === t) o.y = pr.y - o.r;
        else o.y = pr.y + pr.h + o.r;
        continue;
      }
      const push = o.r - d;
      o.x += (dx / d) * push;
      o.y += (dy / d) * push;
    }
  },

  damageProp(pr, dmg) {
    if (pr.dead) return;
    if (pr.type === 'wall') {
      pr.flash = 1;
      this.burst(pr.x + pr.w / 2, pr.y + pr.h / 2, '#8fa4b8', 2);
      return;
    }
    pr.hp -= dmg;
    pr.flash = 1;
    this.burst(pr.x + pr.w / 2, pr.y + pr.h / 2, '#cfd8e2', 3);
    if (pr.hp <= 0) this.breakProp(pr);
    else Sfx.hit();
  },

  breakProp(pr) {
    pr.dead = true;
    this.nav = null;
    const cx = pr.x + pr.w / 2, cy = pr.y + pr.h / 2;
    if (pr.objective && this.room.obj && this.room.obj.type === 'reactors') {
      this.room.obj.left = Math.max(0, this.room.obj.left - 1);
      this.addLight(cx, cy, 240, '120,200,255', 0.6, 0.6);
      this.cam.shake = Math.max(this.cam.shake, 10);
      if (window.__haptics) window.__haptics.boom();
      UI.toast('РЕАКТОР УНИЧТОЖЕН · ОСТАЛОСЬ ' + this.room.obj.left);
    }
    this.burst(cx, cy, pr.type === 'pipe' ? '#9fb3c4' : '#7d8a99', 12);
    for (let i = 0; i < 6; i++) {
      this.parts.push({
        x: cx + rand(-pr.w / 3, pr.w / 3), y: cy + rand(-pr.h / 3, pr.h / 3),
        vx: rand(-140, 140), vy: rand(-140, 140),
        life: rand(0.4, 0.9), max: 0.9, col: '#6d7a88', r: rand(2, 4.5)
      });
    }
    if (pr.type === 'turret' || pr.type === 'hive') {
      const isHive = pr.type === 'hive';
      this.addLight(cx, cy, isHive ? 240 : 190, isHive ? '200,140,255' : '255,170,90', 0.5, 0.6);
      this.cam.shake = Math.max(this.cam.shake, isHive ? 9 : 7);
      this.burst(cx, cy, isHive ? '#c98bff' : '#ffb347', 22);
      Sfx.hurt();
      if (isHive && this.room.obj && this.room.obj.type === 'hives') {
        this.room.obj.left = Math.max(0, this.room.obj.left - 1);
        UI.toast('ГНЕЗДО УНИЧТОЖЕНО · ОСТАЛОСЬ ' + this.room.obj.left);
      }
      for (let k = 0; k < 4; k++) {
        this.pickups.push({ type: 'coin', x: cx + rand(-20, 20), y: cy + rand(-20, 20), r: 9, v: 1, vx: rand(-50, 50), vy: rand(-50, 50), t: 0 });
      }
    } else if (pr.type === 'barrel') {
      this.addLight(cx, cy, 200, '255,170,80', 0.55, 0.55);
      this.cam.shake = Math.max(this.cam.shake, 9);
      if (window.__haptics) window.__haptics.boom();
      this.burst(cx, cy, '#ffb347', 28);
      Sfx.boom();
      for (const e of this.enemies.slice()) {
        if (Math.hypot(e.x - cx, e.y - cy) < 150) this.damageEnemy(e, 34, false);
      }
      if (Math.hypot(this.player.x - cx, this.player.y - cy) < 90) this.hurtPlayer(8);
    } else {
      this.addLight(cx, cy, 110, '200,220,255', 0.3);
    }
  },

  addLight(x, y, r, col, life, a) {
    if (this.lights.length > 14) this.lights.shift();
    this.lights.push({ x: x, y: y, r: r, col: col, life: life, max: life, a: a === undefined ? 0.35 : a });
  },

  spawnGibs(e) {
    const frames = SPR[e.type] || SPR.grunt;
    const spr = Array.isArray(frames) ? frames[0] : frames;
    const n = e.type === 'boss' ? 16 : (e.type === 'tank' ? 10 : 7);
    const scale = (e.r * 5.6) / spr.sh;
    for (let i = 0; i < n; i++) {
      const sw = spr.sw * rand(0.16, 0.34), sh = spr.sh * rand(0.16, 0.34);
      this.gibs.push({
        spr: spr,
        sx: spr.sx + rand(0, Math.max(1, spr.sw - sw)),
        sy: spr.sy + rand(0, Math.max(1, spr.sh - sh)),
        sw: sw, sh: sh, scale: scale,
        x: e.x + rand(-e.r / 2, e.r / 2), y: e.y + rand(-e.r / 2, e.r / 2),
        vx: rand(-190, 190), vy: rand(-190, 190),
        rot: rand(0, TAU), vrot: rand(-7, 7),
        life: rand(0.7, 1.2), max: 1.2
      });
    }
    if (this.gibs.length > 90) this.gibs.splice(0, this.gibs.length - 90);
  },

  spawnSplat(e) {
    const n = e.type === 'boss' ? 5 : 2;
    for (let i = 0; i < n; i++) {
      const blobs = [];
      const k = randInt(4, 7);
      for (let j = 0; j < k; j++) {
        blobs.push({ dx: rand(-26, 26), dy: rand(-26, 26), r: rand(3, 9) });
      }
      this.splats.push({
        x: e.x + rand(-18, 18), y: e.y + rand(-18, 18),
        blobs: blobs, life: 7, max: 7
      });
    }
    if (this.splats.length > 46) this.splats.splice(0, this.splats.length - 46);
  },

  updateEffects(dt) {
    for (let i = this.props.length - 1; i >= 0; i--) {
      const pr = this.props[i];
      if (pr.dead) { this.props.splice(i, 1); continue; }
      pr.flash = Math.max(0, pr.flash - dt * 5);
    }
    for (let i = this.gibs.length - 1; i >= 0; i--) {
      const g = this.gibs[i];
      g.x += g.vx * dt; g.y += g.vy * dt;
      g.vx *= 0.93; g.vy *= 0.93;
      g.rot += g.vrot * dt;
      g.vrot *= 0.96;
      g.life -= dt;
      if (g.life <= 0) this.gibs.splice(i, 1);
    }
    for (let i = this.splats.length - 1; i >= 0; i--) {
      this.splats[i].life -= dt;
      if (this.splats[i].life <= 0) this.splats.splice(i, 1);
    }
    for (let i = this.lights.length - 1; i >= 0; i--) {
      this.lights[i].life -= dt;
      if (this.lights[i].life <= 0) this.lights.splice(i, 1);
    }
  },

  dropMine() {
    const r = this.room, p = this.player;
    const x = clamp(p.x + rand(-110, 110), 60, r.w - 60);
    const y = clamp(p.y + rand(-110, 110), 60, r.h - 60);
    this.mines.push({ x: x, y: y, r: 12, arm: 1.5, life: 14, blink: rand(0, 6) });
    this.addLight(x, y, 70, '255,90,90', 0.25, 0.3);
  },

  explodeAt(x, y, r, dmg) {
    this.addLight(x, y, r * 1.7, '255,140,90', 0.4, 0.55);
    this.burst(x, y, '#ff9a4a', 20);
    Sfx.boom();
    this.cam.shake = Math.max(this.cam.shake, 6);
    if (window.__haptics) window.__haptics.boom();
    for (const e of this.enemies.slice()) {
      if (Math.hypot(e.x - x, e.y - y) < r) this.damageEnemy(e, dmg, false);
    }
  },

  updateMines(dt) {
    const p = this.player;
    for (let i = this.mines.length - 1; i >= 0; i--) {
      const m = this.mines[i];
      m.blink += dt * 6;
      if (m.arm > 0) { m.arm -= dt; continue; }
      m.life -= dt;
      const d = Math.hypot(p.x - m.x, p.y - m.y);
      if (d < 46 || m.life <= 0) {
        this.mines.splice(i, 1);
        this.explodeMine(m);
      }
    }
  },

  explodeMine(m) {
    this.addLight(m.x, m.y, 190, '255,120,80', 0.45, 0.55);
    this.burst(m.x, m.y, '#ff9a4a', 22);
    this.cam.shake = Math.max(this.cam.shake, 8);
    if (window.__haptics) window.__haptics.boom();
    Sfx.hurt();
    if (Math.hypot(this.player.x - m.x, this.player.y - m.y) < 64) this.hurtPlayer(14);
    for (const e of this.enemies.slice()) {
      if (Math.hypot(e.x - m.x, e.y - m.y) < 80) this.damageEnemy(e, 32, false);
    }
  },

  updateTexts(dt) {
    this.hurtFlash = Math.max(0, this.hurtFlash - dt * 4);
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.y += t.vy * dt;
      t.vy *= 0.92;
      t.life -= dt;
      if (t.life <= 0) this.texts.splice(i, 1);
    }
  },

  updateParticles(dt) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.94; p.vy *= 0.94;
      p.life -= dt;
      if (p.life <= 0) this.parts.splice(i, 1);
    }
  },

  burst(x, y, col, n) {
    if (!Settings.quality) n = Math.max(2, Math.round(n * 0.45));
    if (this.parts.length > 260) n = Math.min(n, 2);
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), sp = rand(40, 240);
      this.parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.2, 0.55), max: 0.55, col: col, r: rand(1.5, 3.4) });
    }
  },

  checkClear(dt) {
    const r = this.room;
    const obj = r.obj || { type: 'kill' };
    if (obj.type === 'survive' && !r.cleared) {
      obj.time -= dt;
      obj.nextSpawn -= dt;
      if (obj.nextSpawn <= 0 && obj.time > 0) {
        obj.nextSpawn = Math.max(4.5, 11 - this.roomIndex * 0.25);
        const wave = 2 + Math.floor(this.roomIndex / 2);
        for (let i = 0; i < wave; i++) {
          if (this.enemies.length > 26) break;
          this.addEnemy(pick(this.roomIndex > 6 ? ['grunt', 'swarm', 'shooter', 'tank'] : ['grunt', 'swarm']));
        }
        if (this.roomIndex > 8 && this.enemies.length > 14) {
          UI.toast('ВОЛНА · ВРАГОВ ' + this.enemies.length);
        }
      }
    }
    let ready = false;
    if (obj.type === 'kill') ready = this.enemies.length === 0;
    else if (obj.type === 'reactors') ready = obj.left <= 0;
    else if (obj.type === 'hives') ready = this.props.every(pr => pr.dead || pr.type !== 'hive');
    else ready = obj.time <= 0;
    if (!r.cleared && ready) {
      r.cleared = true;
      r.doors = [
        { x: r.w / 2 - 150, y: 60, r: 44, type: 'normal', pulse: 0 },
        { x: r.w / 2 + 150, y: 60, r: 44, type: 'elite', pulse: 0 }
      ];
      this.coins += Math.round((8 + this.roomIndex * 4) * (this.room.elite ? 2.2 : 1) * (this.room.mod ? this.room.mod.bonus : 1));
      Sfx.door();
      Sfx.bossTheme(false);
      UI.toast(obj.type === 'kill' ? 'СЕКТОР ЗАЧИЩЕН · ПОРТАЛ ОТКРЫТ' : 'ЗАДАЧА ВЫПОЛНЕНА · ПОРТАЛ ОТКРЫТ');
      if ((this.room.elite || RNG() < 0.55) && !r.boss) {
        this.pickups.push({ type: 'chest', x: rand(r.w * 0.25, r.w * 0.75), y: rand(r.h * 0.2, r.h * 0.5), r: 20, v: 1, vx: 0, vy: 0, t: 0 });
      }
      saveGame();
      UI.updateHud(true);
    }
    if (r.cleared && r.doors) {
      r.t += dt;
      for (const d of r.doors) d.pulse += dt;
    }
  },

  nextRoom(kind) {
    Sfx.door();
    this.enterRoom(this.roomIndex + 1, { elite: kind === 'elite' });
  },

  updateCamera(dt) {
    const p = this.player;
    const tx = clamp(p.x - VW / 2, 0, Math.max(0, this.room.w - VW));
    const ty = clamp(p.y - VH / 2, 0, Math.max(0, this.room.h - VH));
    this.cam.x = lerp(this.cam.x, tx, Math.min(1, dt * 7));
    this.cam.y = lerp(this.cam.y, ty, Math.min(1, dt * 7));
    if (this.cam.shake > 0 && Settings.shake) this.cam.shake = Math.max(0, this.cam.shake - dt * 26);
    else this.cam.shake = 0;
  },

  clampCam() {
    this.cam.x = clamp(this.cam.x, 0, Math.max(0, this.room.w - VW));
    this.cam.y = clamp(this.cam.y, 0, Math.max(0, this.room.h - VH));
  },

  pause() { if (this.state === 'playing') { this.state = 'pause'; UI.updatePauseInfo(); UI.showScreen('screen-pause'); } },
  resume() { if (this.state === 'pause') { this.state = 'playing'; UI.showScreen(null); } },
  toMenu() { this.state = 'menu'; Sfx.bossTheme(false); Sfx.ambient(false); saveGame(); UI.showScreen('screen-menu'); UI.refreshMenu(); UI.showHud(false); }
};

/* ---------------- магазин между секторами ---------------- */
const SHOP_POOL = [
  { id: 'dmg',   nm: '+15% урона',         ds: 'Плазменный усилитель', price: 45,  apply: p => { p.dmgMult *= 1.15; } },
  { id: 'rate',  nm: '+12% скор. атаки',   ds: 'Ускоритель',           price: 45,  apply: p => { p.atkRate *= 1.12; } },
  { id: 'hp',    nm: '+30 макс. HP',       ds: 'Биоконтур',            price: 35,  apply: p => { p.maxHp += 30; p.hp += 30; } },
  { id: 'heal',  nm: 'Лечение 45 HP',      ds: 'Ремкомплект',          price: 25,  apply: p => { p.hp = Math.min(p.maxHp, p.hp + 45); } },
  { id: 'multi', nm: '+1 снаряд',          ds: 'Раскол луча',          price: 130, apply: p => { p.projCount += 1; } },
  { id: 'pierce',nm: '+1 пробитие',        ds: 'Бронебой',             price: 75,  apply: p => { p.pierce += 1; } },
  { id: 'crit',  nm: '+8% крит',           ds: 'Слабые точки',         price: 65,  apply: p => { p.critChance = Math.min(0.85, p.critChance + 0.08); } },
  { id: 'speed', nm: '+8% скорость бега',  ds: 'Маневровые',           price: 50,  apply: p => { p.speed *= 1.08; } },
  { id: 'size',  nm: '+20% размер заряда', ds: 'Тяжёлый заряд',        price: 55,  apply: p => { p.projSize *= 1.2; } },
  { id: 'ammo',  nm: 'Боезапас +10',       ds: 'К текущему оружию',    price: 40,  apply: p => { if (isFinite(p.ammo[p.weapon])) p.ammo[p.weapon] += 10; } }
];

Game.shopOffers = [];

Game.openShop = function () {
  if (this.state !== 'playing' && this.state !== 'pause' && this.state !== 'shop') return;
  const pool = SHOP_POOL.slice();
  this.shopOffers = [];
  for (let i = 0; i < 3 && pool.length; i++) {
    this.shopOffers.push(pool.splice(Math.floor(RNG() * pool.length), 1)[0]);
  }
  this.state = 'shop';
  UI.showShop();
};

Game.buyShopItem = function (idx) {
  const it = this.shopOffers[idx];
  if (!it || this.coins < it.price) return;
  this.coins -= it.price;
  it.apply(this.player);
  this.shopOffers.splice(idx, 1);
  Sfx.level();
  UI.updateHud(true);
  saveGame();
  UI.showShop();
};

Game.rerollShop = function () {
  if (this.coins < 15) return;
  this.coins -= 15;
  const pool = SHOP_POOL.slice();
  this.shopOffers = [];
  for (let i = 0; i < 3 && pool.length; i++) {
    this.shopOffers.push(pool.splice(Math.floor(RNG() * pool.length), 1)[0]);
  }
  UI.updateHud(true);
  UI.showShop();
};

Game.closeShop = function () {
  this.state = 'playing';
  UI.showScreen(null);
  UI.showHud(true);
};

Game.buyUpgrade = function (id) {
  const def = UPGRADES.find(u => u.id === id);
  if (!def) return false;
  const meta = getMeta();
  meta.up = meta.up || {};
  const lvl = meta.up[id] || 0;
  if (lvl >= def.max) return false;
  const price = def.cost(lvl);
  if (meta.coins < price) return false;
  meta.coins -= price;
  meta.up[id] = lvl + 1;
  saveMeta(meta);
  Sfx.level();
  UI.showUpgrades();
  return true;
};
