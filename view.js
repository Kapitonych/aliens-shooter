'use strict';
/* ================= ORBITAL DRIFT :: VIEW + UI ================= */

const UI = {
  el: {},
  settingsReturn: 'screen-menu',
  toastT: 0,
  cache: {},

  init() {
    const $ = id => document.getElementById(id);
    this.el = {
      hud: $('hud'), hpFill: $('hpFill'), xpFill: $('xpFill'), hpText: $('hpText'),
      lvlText: $('lvlText'), coinText: $('coinText'), killText: $('killText'),
      roomTag: $('roomTag'), pauseBtn: $('pauseBtn'),
      menu: $('screen-menu'), settings: $('screen-settings'), pause: $('screen-pause'),
      perk: $('screen-perk'), over: $('screen-over'), overStats: $('overStats'),
      cards: $('perkCards'), toast: $('toast'),
      btnNew: $('btnNew'), btnContinue: $('btnContinue'), contHint: $('contHint'),
      btnSettings: $('btnSettings'), tgSound: $('tgSound'), tgRun: $('tgRun'),
      tgShake: $('tgShake'), tgJoy: $('tgJoy'), tgVibe: $('tgVibe'), btnReset: $('btnReset'), btnBack: $('btnBack'),
      btnResume: $('btnResume'), btnPauseSettings: $('btnPauseSettings'), btnToMenu: $('btnToMenu'),
      shopCards: $('shopCards'), shopCoins: $('shopCoins'), btnPauseShop: $('btnPauseShop'), pauseWeapon: $('pauseWeapon'),
      btnShopClose: $('btnShopClose'), btnShopReroll: $('btnShopReroll'),
      btnUpgrades: $('btnUpgrades'), btnUpBack: $('btnUpBack'), upCards: $('upCards'),
      btnDaily: $('btnDaily'), dailyHint: $('dailyHint'), classCards: $('classCards'), btnClassBack: $('btnClassBack'),
      weaponBar: $('weaponBar'), contractCards: $('contractCards'),
      btnRecords: $('btnRecords'), recHint: $('recHint'), recCards: $('recCards'), btnRecBack: $('btnRecBack'),
      mCoins: $('mCoins'), mBest: $('mBest'), mRuns: $('mRuns'), mWins: $('mWins'),
      tgQuality: $('tgQuality'), tgCloud: $('tgCloud'), tgBoss3D: $('tgBoss3D'),
      btnTest3D: $('btnTest3D'), btnOverUp: $('btnOverUp'), overMeta: $('overMeta'),
      boss3dOverlay: $('boss3dOverlay'), boss3dFrame: $('boss3dFrame'), boss3dExit: $('boss3dExit'),
      btnShare: $('btnShare'), btnShareWin: $('btnShareWin'), tutText: $('tutText'), btnTutOk: $('btnTutOk'),
      upCoins: $('upCoins'), metaHint: $('metaHint'), footStats: $('footStats'), weapText: $('weapText'), objText: $('objText'),
      btnRetry: $('btnRetry'), btnOverMenu: $('btnOverMenu'),
      over: $('screen-over'), win: $('screen-win'), winStats: $('winStats'), btnWinMenu: $('btnWinMenu'),
    };

    this.el.btnNew.onclick = () => {
      Sfx.init();
      Sfx.tone(520, 0.12, 'triangle', 0.05);
      this.showClasses();
    };
    this.el.btnClassBack.onclick = () => this.showScreen('screen-menu');
    this.el.btnDaily.onclick = () => {
      Sfx.init();
      Game.newDaily();
      this.showScreen(null);
      this.showHud(true);
    };
    this.el.btnContinue.onclick = () => {
      const s = loadSave();
      if (!s) return;
      Sfx.init();
      Game.restore(s);
      this.showScreen(null);
      this.showHud(true);
    };
    this.el.btnSettings.onclick = () => { this.settingsReturn = 'screen-menu'; this.showScreen('screen-settings'); };
    this.el.btnPauseSettings.onclick = () => { this.settingsReturn = 'screen-pause'; this.showScreen('screen-settings'); };
    this.el.btnBack.onclick = () => this.showScreen(this.settingsReturn);
    this.el.btnResume.onclick = () => Game.resume();
    this.el.btnUpgrades.onclick = () => this.showUpgrades();
    this.el.btnUpBack.onclick = () => this.showScreen('screen-menu');
    this.el.btnPauseShop.onclick = () => Game.openShop();
    this.el.btnShopClose.onclick = () => Game.closeShop();
    this.el.btnShopReroll.onclick = () => Game.rerollShop();
    this.el.btnToMenu.onclick = () => Game.toMenu();
    this.el.btnRetry.onclick = () => { this.showClasses(); };
    this.el.btnOverMenu.onclick = () => { Game.toMenu(); };
    this.el.btnWinMenu.onclick = () => { Game.toMenu(); };
    this.el.pauseBtn.onclick = () => Game.pause();
    this.buildWeaponBar();
    if (this.el.btnRecords) this.el.btnRecords.onclick = () => this.showRecords();
    if (this.el.btnRecBack) this.el.btnRecBack.onclick = () => { this.showScreen('screen-menu'); this.refreshMenu(); };
    if (this.el.btnShare) this.el.btnShare.onclick = () => this.shareResult(false);
    if (this.el.btnShareWin) this.el.btnShareWin.onclick = () => this.shareResult(true);
    if (this.el.btnTutOk) this.el.btnTutOk.onclick = () => Game.endTutorial();

    this.el.tgSound.onclick = () => { Settings.sound = !Settings.sound; Sfx.on = Settings.sound; saveSettings(); Sfx.init(); this.syncSettings(); };
    this.el.tgRun.onclick = () => { Settings.runGun = !Settings.runGun; saveSettings(); this.syncSettings(); };
    this.el.tgShake.onclick = () => { Settings.shake = !Settings.shake; saveSettings(); this.syncSettings(); };
    this.el.tgVibe.onclick = () => {
      Settings.vibe = !Settings.vibe; saveSettings(); this.syncSettings(); vibrate(40, 'medium');
      this.toast(Settings.vibe ? 'ВИБРО · ' + vibroDiag() : 'ВИБРО ВЫКЛ');
    };
    this.el.tgQuality.onclick = () => { Settings.quality = Settings.quality ? 0 : 1; saveSettings(); this.syncSettings(); applyQuality(); };
    this.el.tgBoss3D.onclick = () => {
      Settings.boss3d = Settings.boss3d ? 0 : 1;
      saveSettings();
      this.syncSettings();
    };
    this.el.boss3dExit.onclick = () => {
      if (this.preview3d) { this.preview3d = false; this.closeBoss3D(); this.showScreen('screen-settings'); return; }
      Game.quitBoss3D();
    };
    if (this.el.btnTest3D) this.el.btnTest3D.onclick = () => this.previewBoss3D();
    if (this.el.btnOverUp) this.el.btnOverUp.onclick = () => this.showUpgrades();
    this.el.tgJoy.onclick = () => {
      const order = [56, 68, 84];
      const i = order.indexOf(Settings.joy);
      Settings.joy = order[(i + 1) % order.length];
      saveSettings(); this.syncSettings();
    };
    this.el.btnReset.onclick = () => {
      if (!confirm('Стереть сохранение и банк монет?')) return;
      clearSave();
      saveMeta({ coins: 0, best: 0, runs: 0 });
      this.toast('ПРОГРЕСС СТЁРТ');
      this.refreshMenu();
    };

    this.syncSettings();
    this.refreshMenu();
  },

  syncSettings() {
    const e = this.el;
    if (e.tgVibe) e.tgVibe.textContent = 'Вибрация: ' + (Settings.vibe ? 'ВКЛ' : 'ВЫКЛ');
    if (e.tgQuality) e.tgQuality.textContent = 'Графика: ' + (Settings.quality ? 'ВЫСОКАЯ' : 'НИЗКАЯ');
    if (e.tgBoss3D) e.tgBoss3D.textContent = 'Боссы в 3D: ' + (Settings.boss3d ? 'ВКЛ' : 'ВЫКЛ');
    if (e.tgCloud) e.tgCloud.textContent = 'Облачное сохранение: ' + (Cloud.ready ? Cloud.status : 'нет');
    e.tgSound.textContent = 'Звук: ' + (Settings.sound ? 'ВКЛ' : 'ВЫКЛ');
    e.tgRun.textContent = 'Стрельба на ходу: ' + (Settings.runGun ? 'ВКЛ' : 'ВЫКЛ');
    e.tgShake.textContent = 'Тряска камеры: ' + (Settings.shake ? 'ВКЛ' : 'ВЫКЛ');
    const names = { 56: 'МАЛЕНЬКИЙ', 68: 'СРЕДНИЙ', 84: 'БОЛЬШОЙ' };
    e.tgJoy.textContent = 'Размер стика: ' + (names[Settings.joy] || 'СРЕДНИЙ');
  },

  showClasses() {
    const e = this.el;
    e.classCards.innerHTML = '';
    const meta = getMeta();
    CLASSES.forEach(c => {
      const locked = (c.req === 'boss' && !meta.bosses) || (c.req === 'win' && !meta.wins);
      const d = document.createElement('div');
      d.className = 'card' + (locked ? ' off' : '');
      d.innerHTML = '<div class="ic">' + (locked ? '🔒' : c.ic) + '</div><div class="nm">' + c.nm + '</div>' +
        '<div class="ds">' + c.ds + '</div>' +
        (locked ? '<div class="lv">' + (c.req === 'boss' ? 'УБЕЙ ПЕРВОГО БОССА' : 'ЗАЧИСТИ СТАНЦИЮ') + '</div>' : '');
      if (!locked) d.onclick = () => {
        Game.newRun(c.id);
        if (Game.state !== 'tutorial') { this.showScreen(null); this.showHud(true); }
        Sfx.init();
      };
      e.classCards.appendChild(d);
    });
    this.showScreen('screen-classes');
  },

  showUpgrades() {
    const e = this.el, meta = getMeta();
    e.upCards.innerHTML = '';
    const dlvl = meta.drone || 0;
    const dmax = 5;
    const dprice = 180 * Math.max(1, dlvl);
    const dc = document.createElement('div');
    dc.className = 'card' + (dlvl >= dmax ? ' max' : (dlvl > 0 && meta.coins < dprice ? ' off' : ''));
    dc.innerHTML = '<div class="ic">✦</div><div class="nm">ДРОН-СПУТНИК</div><div class="ds">Летает рядом, стреляет сам' +
      (dlvl >= 3 ? ' · −8% урона по тебе' : '') + (dlvl >= 5 ? ' · двойной выстрел' : '') + '</div>' +
      '<div class="lv">' + (dlvl >= dmax ? 'МАКСИМУМ' : (dlvl === 0 ? 'УБЕЙ ПЕРВОГО БОССА' : dprice + ' ⛁')) + '</div>' +
      '<div class="lv">уровень ' + dlvl + ' / ' + dmax + '</div>';
    if (dlvl > 0 && dlvl < dmax) dc.onclick = () => Game.buyDrone();
    e.upCards.appendChild(dc);
    UPGRADES.forEach(def => {
      const lvl = (meta.up && meta.up[def.id]) || 0;
      const maxed = lvl >= def.max;
      const price = maxed ? 0 : def.cost(lvl);
      const d = document.createElement('div');
      d.className = 'card' + (maxed ? ' max' : (meta.coins < price ? ' off' : ''));
      d.innerHTML = '<div class="ic">' + def.ic + '</div><div class="nm">' + def.nm + '</div><div class="ds">' +
        def.ds + '</div><div class="lv">' + (maxed ? 'МАКСИМУМ' : price + ' ⛁') +
        '</div><div class="lv">уровень ' + lvl + ' / ' + def.max + '</div>';
      if (!maxed) d.onclick = () => Game.buyUpgrade(def.id);
      e.upCards.appendChild(d);
    });
    e.upCoins.textContent = meta.coins;
    this.showScreen('screen-upgrades');
  },

  refreshMenu() {
    const meta = getMeta();
    if (this.el.metaHint) this.el.metaHint.textContent = meta.coins + ' ⛁';
    if (this.el.mCoins) this.el.mCoins.textContent = meta.coins;
    if (this.el.mBest) this.el.mBest.textContent = meta.best || 0;
    if (this.el.mRuns) this.el.mRuns.textContent = meta.runs || 0;
    if (this.el.mWins) this.el.mWins.textContent = meta.wins || 0;
    const dly = meta.daily;
    if (this.el.dailyHint) {
      this.el.dailyHint.textContent = (dly && dly.best) ? 'сегодня: сектор ' + dly.best : 'сегодня ещё не играл';
    }
    if (this.el.recHint) {
      const log = meta.log || [];
      this.el.recHint.textContent = log.length ? 'лучший: сектор ' + log[0].s : 'пока пусто';
    }
    if (this.el.footStats) {
      this.el.footStats.textContent = 'рекорд: сектор ' + (meta.best || 0) + ' · забегов ' + (meta.runs || 0) +
        (meta.wins ? ' · побед ' + meta.wins : '') + ' · путь: ' + MAX_SECTOR + ' секторов';
    }
    const s = loadSave();
    const b = this.el.btnContinue, h = this.el.contHint;
    if (s) {
      b.disabled = false;
      h.textContent = 'сектор ' + s.room + ' · ур. ' + (s.level || 1) + ' · ⛁ ' + (s.coins || 0);
    } else {
      b.disabled = true;
      h.textContent = 'нет сохранения';
    }
  },

  showScreen(id) {
    // поверх арены: экран паузы/меню, иначе кнопки не нажать
    const ov = this.el && this.el.boss3dOverlay;
    if (ov) {
      ov.style.zIndex = id ? '80' : '60';
      // когда открыт экран, саму арену убираем из кадра — она перехватывает касания
      if (id) ov.classList.add('menu'); else ov.classList.remove('menu');
    }
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    if (id) {
      const el = document.getElementById(id);
      if (el) el.classList.add('active');
    }
    if (id === 'screen-menu') this.refreshMenu();
    if (id) this.showHud(false);
  },

  showHud(on) {
    this.el.hud.classList.toggle('on', !!on);
  },

  updateHud(force) {
    const p = Game.player, e = this.el;
    if (!p) return;
    const hpPct = Math.round((p.hp / p.maxHp) * 100);
    if (force || this.cache.hp !== hpPct) {
      e.hpFill.style.width = clamp(hpPct, 0, 100) + '%';
      e.hpText.textContent = Math.ceil(p.hp) + ' / ' + Math.round(p.maxHp);
      this.cache.hp = hpPct;
    }
    const xpPct = Math.round((Game.xp / Game.xpNext) * 100);
    if (force || this.cache.xp !== xpPct) {
      e.xpFill.style.width = clamp(xpPct, 0, 100) + '%';
      this.cache.xp = xpPct;
    }
    if (force || this.cache.lvl !== Game.level) { e.lvlText.textContent = Game.level; this.cache.lvl = Game.level; }
    if (force || this.cache.coins !== Game.coins) { e.coinText.textContent = Game.coins; this.cache.coins = Game.coins; }
    if (force || this.cache.kills !== Game.kills) { e.killText.textContent = Game.kills; this.cache.kills = Game.kills; }
    const obj = Game.room && Game.room.obj;
    let objStr = '';
    if (obj && obj.type === 'reactors') objStr = 'РЕАКТОРЫ · ОСТАЛОСЬ ' + obj.left;
    else if (obj && obj.type === 'survive') objStr = 'ДЕРЖАТЬСЯ ' + Math.max(0, Math.ceil(obj.time)) + 'с';
    else if (obj && obj.type === 'hives') objStr = 'ГНЁЗДА · ОСТАЛОСЬ ' + obj.left;
    if (Game.room && Game.room.mod) objStr = (objStr ? objStr + ' · ' : '') + Game.room.mod.nm;
    if (force || this.cache.obj !== objStr) {
      if (e.objText) e.objText.textContent = objStr;
      this.cache.obj = objStr;
    }
    const nx = nextWeaponSector(Game.roomIndex);
    const ammoNow = p.ammo ? p.ammo[p.weapon] : undefined;
    const ammoStr = ammoNow === undefined ? '' : (isFinite(ammoNow) ? ' ' + Math.max(0, ammoNow) : ' ∞');
    const wname = (WEAPONS[p.weapon] || WEAPONS.rifle).nm + ammoStr + (nx ? ' · след. ' + nx : '');
    if (force || this.cache.weap !== wname) { e.weapText.textContent = wname; this.cache.weap = wname; }
    this.syncWeaponBar(p);
    if (force || this.cache.room !== Game.roomIndex) {
      e.roomTag.textContent = 'СЕКТОР ' + Game.roomIndex + ' / ' + MAX_SECTOR +
        (Game.room && Game.room.boss ? ' · БОСС' : '') + (Game.room && Game.room.elite ? ' · ЭЛИТА' : '');
      this.cache.room = Game.roomIndex;
    }
  },

  buildWeaponBar() {
    const bar = this.el.weaponBar;
    if (!bar) return;
    bar.innerHTML = '';
    this.wbtns = {};
    ['rifle', 'shotgun', 'smg', 'laser', 'rocket', 'plasma'].forEach(id => {
      const b = document.createElement('div');
      b.className = 'wbtn';
      const cv = document.createElement('canvas');
      cv.width = 56; cv.height = 56;
      cv.style.width = '28px'; cv.style.height = '28px';
      const c = cv.getContext('2d');
      c.scale(2, 2);
      drawWeaponGlyph(c, id, 28);
      const am = document.createElement('span');
      am.className = 'amm';
      b.appendChild(cv); b.appendChild(am);
      b.addEventListener('click', ev => { ev.stopPropagation(); Game.selectWeapon(id); });
      bar.appendChild(b);
      this.wbtns[id] = { el: b, am: am };
    });
  },

  syncWeaponBar(p) {
    if (!this.wbtns || !p) return;
    this._seen = this._seen || {};
    for (const id in this.wbtns) {
      const n = this.wbtns[id];
      const unlocked = !!p.unlocked[id];
      const a = p.ammo ? p.ammo[id] : 0;
      const inf = !isFinite(a);
      n.el.style.display = unlocked ? '' : 'none';
      if (unlocked && !this._seen[id]) {
        this._seen[id] = true;
        if (id !== 'rifle') {
          n.el.classList.add('fresh');
          setTimeout(() => n.el.classList.remove('fresh'), 700);
        }
      }
      n.el.classList.toggle('active', p.weapon === id);
      if (unlocked) n.el.classList.toggle('empty', !inf && (!a || a <= 0));
      n.am.textContent = inf ? '∞' : Math.max(0, a);
      n.am.className = 'amm' + (inf ? ' inf' : '');
    }
  },

  updatePauseInfo() {
    const p = Game.player;
    if (this.el.pauseWeapon && p) {
      this.el.pauseWeapon.textContent = 'оружие: ' + ((WEAPONS[p.weapon] || WEAPONS.rifle).nm || '—') +
        ' · урон ' + (p.dmg * 1).toFixed(1) + ' за выстрел';
    }
  },

  showShop() {
    const e = this.el;
    e.toast.style.opacity = '0';
    e.shopCards.innerHTML = '';
    if (!Game.shopOffers.length) {
      const d = document.createElement('div');
      d.className = 'card';
      d.innerHTML = '<div class="ic">✓</div><div class="nm">Всё куплено</div><div class="ds">Жми «Обновить» или иди дальше</div>';
      e.shopCards.appendChild(d);
    }
    Game.shopOffers.forEach((it, idx) => {
      const d = document.createElement('div');
      d.className = 'card' + (Game.coins < it.price ? ' off' : '');
      d.innerHTML = '<div class="ic">⛁</div><div class="nm">' + it.nm + '</div><div class="ds">' + it.ds +
        '</div><div class="lv">' + it.price + ' ⛁</div>';
      d.onclick = () => Game.buyShopItem(idx);
      e.shopCards.appendChild(d);
    });
    e.shopCoins.textContent = Game.coins;
    this.showScreen('screen-shop');
    this.showHud(true);
  },

  showPerks(list) {
    const e = this.el;
    e.toast.style.opacity = '0';
    if (!list || !list.length) { this.showScreen(null); return; }
    e.cards.innerHTML = '';
    list.forEach(perk => {
      const d = document.createElement('div');
      d.className = 'card';
      d.innerHTML = '<div class="ic">' + perk.ic + '</div><div class="nm">' + perk.nm +
        '</div><div class="ds">' + perk.ds + '</div><div class="lv">уровень ' +
        ((Game.perkLog[perk.id] || 0) + 1) + ' / ' + perk.max + '</div>';
      d.onclick = () => Game.takePerk(perk);
      e.cards.appendChild(d);
    });
    this.showScreen('screen-perk');
    this.showHud(true);
  },

  showVictory() {
    const meta = getMeta();
    this.el.winStats.textContent = 'сектор ' + Game.roomIndex + ' из ' + MAX_SECTOR +
      ' · класс: ' + (Game.player && Game.player.weapon ? (WEAPONS[Game.player.weapon] || {}).nm : '—') +
      ' · убито ' + Game.kills + ' · ⛁ ' + Game.coins + ' (+500 бонус) · побед всего: ' + (meta.wins || 1);
    this.showScreen('screen-win');
    this.showHud(false);
    if (window.__haptics) window.__haptics.boom();
  },

  showTutorial() {
    const el = this.el.tutText;
    if (!el) return;
    el.innerHTML =
      '• Двигайся пальцем по экрану — стик появляется там, где нажал.<br>' +
      '• Стрельба сама: герой бьёт по ближайшему врагу.<br>' +
      '• Патроны кончаются. Ящики с патронами падают с врагов и лежат в комнатах.<br>' +
      '• Каждые 3 сектора — босс. Секторы 3, 6, 9, 12 и 15 проходят в 3D от первого лица.<br>' +
      '• Перед боссом выбираешь контракт: риск за награду.<br>' +
      '• Монеты тратятся в магазине на паузе, а остаток уходит в банк — «Улучшения» в меню качают героя навсегда.';
    this.showHud(false);
    this.showScreen('screen-tutorial');
  },

  showRecords() {
    const el = this.el.recCards;
    if (!el) return;
    const meta = getMeta();
    const log = (meta.log || []).slice(0, 10);
    el.innerHTML = '';
    if (!log.length) {
      const empty = document.createElement('div');
      empty.className = 'row';
      empty.textContent = 'Пока ни одного забега';
      el.appendChild(empty);
    } else {
      log.forEach((r, i) => {
        const d = new Date(r.d || Date.now());
        const row = document.createElement('div');
        row.className = 'row';
        row.innerHTML = '<span>' + (i + 1) + '. сектор <b>' + r.s + '</b>' + (r.w ? ' 🏆' : '') + '</span>' +
          '<span class="d">' + (r.k || 0) + ' убийств · ' + d.toLocaleDateString('ru-RU') + '</span>';
        el.appendChild(row);
      });
    }
    this.showScreen('screen-records');
  },

  shareResult(isWin) {
    const p = Game.player || {};
    const wname = (WEAPONS[p.weapon] || {}).nm || 'винтовка';
    const txt = isWin
      ? 'Зачистил станцию в «Секторе 15»: все ' + MAX_SECTOR + ' секторов, ' + wname + ', ' + Game.kills + ' убийств.'
      : 'Дошёл до ' + Game.roomIndex + '-го сектора в «Секторе 15». Убил ' + Game.kills + '. Слабо?';
    const url = 'https://t.me/AliansShooting_bot';
    const link = 'https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(txt);
    try {
      const tg = window.Telegram && window.Telegram.WebApp;
      if (tg && tg.openTelegramLink) tg.openTelegramLink(link);
      else window.open(link, '_blank');
    } catch (e) {}
  },

  showContract() {
    const el = this.el.contractCards;
    if (!el) return;
    el.innerHTML = '';
    const opts = [
      { id: 'hunt',  ic: '☠', nm: 'ОХОТА',      ds: 'враги бьют на +35% сильнее', lv: '+60% монет в секторе' },
      { id: 'trial', ic: '✦', nm: 'ИСПЫТАНИЕ',  ds: '−22% максимального HP',      lv: '+1 перк на выбор' }
    ];
    opts.forEach(o => {
      const d = document.createElement('div');
      d.className = 'card';
      d.innerHTML = '<div class="ic">' + o.ic + '</div><div class="nm">' + o.nm + '</div>' +
        '<div class="ds">' + o.ds + '</div><div class="lv">' + o.lv + '</div>';
      d.onclick = () => Game.takeContract(o.id);
      el.appendChild(d);
    });
    const skip = document.createElement('button');
    skip.className = 'btn';
    skip.textContent = 'БЕЗ КОНТРАКТА';
    skip.style.marginTop = '10px';
    skip.onclick = () => Game.takeContract('skip');
    el.appendChild(skip);
    this.showHud(false);
    this.showScreen('screen-contract');
  },

  showGameOver() {
    const meta = getMeta();
    this.el.overStats.textContent = 'сектор ' + Game.roomIndex + ' · уровень ' + Game.level +
      ' · убито ' + Game.kills + ' · ⛁ ' + Game.coins + ' (банк ' + meta.coins + ')';
    if (this.el.overMeta) this.el.overMeta.textContent = meta.coins || 0;
    if (this.el.btnOverUp) this.el.btnOverUp.style.display = (meta.coins || 0) > 0 ? '' : 'none';
    this.showScreen('screen-over');
    this.showHud(false);
  },

  /* пробный запуск арены из настроек: без влияния на забег */
  previewBoss3D() {
    this.preview3d = true;
    const p = Game.player;
    this.openBoss3D(Game.roomIndex || 6, 'boss', 900, {
      w: 'rifle,shotgun,smg,laser,rocket',
      a: '-1,40,90,55,14',
      cur: 'rifle',
      php: p ? Math.round(p.hp) : 100,
      pmax: p ? Math.round(p.maxHp) : 100
    });
  },

  openBoss3D(sector, bossType, hp, load) {
    const el = this.el;
    if (!el.boss3dOverlay) return false;
    const L = load || {};
    const url = 'boss3d3.html?embedded=1&sector=' + encodeURIComponent(sector) +
                '&boss=' + encodeURIComponent(bossType) +
                '&hp=' + encodeURIComponent(hp || 700) +
                '&w=' + encodeURIComponent(L.w || 'rifle') +
                '&a=' + encodeURIComponent(L.a || '-1') +
                '&cur=' + encodeURIComponent(L.cur || 'rifle') +
                '&php=' + encodeURIComponent(L.php || 100) +
                '&pmax=' + encodeURIComponent(L.pmax || 100) + '&v=4';
    el.boss3dFrame.src = url;
    el.boss3dOverlay.classList.add('on');
    // некоторые webview игнорируют inset/100% у position:fixed — задаём размеры руками
    const vw = window.innerWidth || document.documentElement.clientWidth || 390;
    const vh = window.innerHeight || document.documentElement.clientHeight || 800;
    el.boss3dOverlay.style.width = vw + 'px';
    el.boss3dOverlay.style.height = vh + 'px';
    el.boss3dFrame.style.width = vw + 'px';
    el.boss3dFrame.style.height = vh + 'px';
    this.showHud(false);
    return true;
  },

  closeBoss3D() {
    const el = this.el;
    if (!el.boss3dOverlay) return;
    // гасим цикл внутри iframe, иначе он продолжает жечь кадры в фоне
    try { el.boss3dFrame.contentWindow.postMessage({ type: 'boss3d:stop' }, '*'); } catch (e) {}
    el.boss3dOverlay.classList.remove('on');
    el.boss3dOverlay.style.width = '';
    el.boss3dOverlay.style.height = '';
    el.boss3dFrame.style.width = '';
    el.boss3dFrame.style.height = '';
    el.boss3dFrame.src = 'about:blank';
    // фокус остаётся в скрытом iframe — WebView шлёт касания туда, и герой «стоит»
    try { el.boss3dFrame.blur(); } catch (e) {}
    if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
      document.activeElement.blur();
    }
    const cv = document.getElementById('game');
    if (cv && cv.focus) { try { cv.focus({ preventScroll: true }); } catch (e) { cv.focus(); } }
    window.focus();
    Input.reset();
    this.showHud(true);
  },

  toast(text) {
    const t = this.el.toast;
    t.textContent = text;
    t.style.opacity = '1';
    clearTimeout(this.toastT);
    this.toastT = setTimeout(() => { t.style.opacity = '0'; }, 1700);
  }
};

/* ---------------- связь с 3D-сценой босса ---------------- */
window.addEventListener('message', ev => {
  const data = ev.data || {};
  if (UI.preview3d) {
    if (data.type === 'boss3d:win' || data.type === 'boss3d:lose' || data.type === 'boss3d:quit') {
      UI.preview3d = false;
      UI.closeBoss3D();
      UI.showScreen('screen-settings');
    }
    return;
  }
  if (data.type === 'boss3d:error') { UI.toast('3D: ' + String(data.msg || 'ошибка').slice(0, 90)); return; }
  if (data.type === 'boss3d:win') Game.finishBoss3D(true, data);
  else if (data.type === 'boss3d:lose') Game.finishBoss3D(false, data);
  else if (data.type === 'boss3d:quit') Game.quitBoss3D();
});

/* ---------------- качество графики ---------------- */
function applyQuality() {
  document.body.classList.toggle('lowq', !Settings.quality);
  FLOOR_KEY = -1;
  if (typeof _darkLayer !== 'undefined') _darkLayer = null;
}

/* ---------------- haptics ---------------- */
let lastVibe = 0;
function tgHaptics() {
  const tg = window.Telegram && window.Telegram.WebApp;
  return (tg && tg.HapticFeedback) ? tg.HapticFeedback : null;
}
/* вибро в Telegram требует, чтобы версия Bot API была 6.1+, а Mini App был
   открыт как web_app. Если HapticFeedback молча не срабатывает — пробуем все пути. */
function vibrate(pattern, style) {
  if (!Settings.vibe) return;
  const h = tgHaptics();
  if (h) {
    try {
      const map = { light: 'light', medium: 'medium', heavy: 'heavy', error: 'rigid', soft: 'soft' };
      if (style === 'error' && h.notificationOccurred) { h.notificationOccurred('error'); }
      else if (h.impactOccurred) { h.impactOccurred(map[style] || 'light'); }
      else if (h.notificationOccurred) { h.notificationOccurred('success'); }
    } catch (e) {}
  }
  // на Android navigator.vibrate часто живой, на iOS — нет; это не мешает
  if (navigator.vibrate) { try { navigator.vibrate(pattern); } catch (e) {} }
  if (window.TelegramWebviewProxy) {
    try {
      window.TelegramWebviewProxy.postEvent('web_app_trigger_haptic_feedback',
        JSON.stringify({ type: 'impact', impact_style: style || 'light' }));
    } catch (e) {}
  }
}

/* диагностика: пункт «Вибрация» показывает, видит ли игра Telegram-объект */
function vibroDiag() {
  const tg = window.Telegram && window.Telegram.WebApp;
  if (!tg) return 'нет Telegram.WebApp (открыто в браузере)';
  if (!tg.HapticFeedback) return 'WebApp есть, HapticFeedback нет (старый клиент)';
  const v = (tg.version || '?');
  return 'HapticFeedback есть · версия клиента ' + v;
}

window.__haptics = {
  shot() {
    const t = performance.now();
    if (t - lastVibe < 90) return;    // не долбим мотор на каждый выстрел
    lastVibe = t;
    vibrate(8, 'light');
  },
  hurt() {
    lastVibe = performance.now();
    vibrate([30, 25, 55], 'error');
  },
  boom() {
    lastVibe = performance.now();
    vibrate([45, 30, 70], 'heavy');
  }
};

/* ---------------- rendering ---------------- */
function drawPoly(x, y, r, n, rot) {
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * TAU;
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function glow(col, blur) {
  ctx.shadowColor = col;
  ctx.shadowBlur = blur;
}
function noGlow() {
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
}

let FLOOR_IMG = null, FLOOR_KEY = -1;

/* Пол станции в духе System Shock: плиты, заклёпки, кабели, вентиляция,
   аварийные полосы, лампы и иллюминаторы в стенах. Рисуется один раз
   на сектор в offscreen-canvas — дальше один drawImage за кадр. */
function drawVent(g, x, y, w, h) {
  g.fillStyle = '#0a1017';
  rr(g, x, y, w, h, 4); g.fill();
  g.strokeStyle = 'rgba(120,160,190,0.18)'; g.lineWidth = 1.5;
  rr(g, x, y, w, h, 4); g.stroke();
  g.strokeStyle = 'rgba(140,180,210,0.13)'; g.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const yy = y + 7 + i * (h - 14) / 4;
    g.beginPath(); g.moveTo(x + 6, yy); g.lineTo(x + w - 6, yy); g.stroke();
  }
}

function makeFloor(r, seed) {
  const c = document.createElement('canvas');
  c.width = Math.round(r.w);
  c.height = Math.round(r.h);
  const g = c.getContext('2d');
  let s = (seed * 2654435761) >>> 0;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);

  const base = g.createLinearGradient(0, 0, r.w * 0.55, r.h);
  base.addColorStop(0, '#141d28');
  base.addColorStop(0.45, '#0b121a');
  base.addColorStop(1, '#0f1721');
  g.fillStyle = base;
  g.fillRect(0, 0, r.w, r.h);

  const TS = 160;
  for (let y = 26; y < r.h - 26; y += TS) {
    for (let x = 26; x < r.w - 26; x += TS) {
      g.fillStyle = 'rgba(120,160,190,' + (0.04 + rnd() * 0.06).toFixed(3) + ')';
      g.fillRect(x + 3, y + 3, TS - 6, TS - 6);
      g.strokeStyle = 'rgba(3,6,10,0.85)';
      g.lineWidth = 3;
      g.strokeRect(x + 1.5, y + 1.5, TS - 3, TS - 3);
      g.strokeStyle = 'rgba(150,200,230,0.06)';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(x + 4, y + TS - 6); g.lineTo(x + 4, y + 4); g.lineTo(x + TS - 6, y + 4);
      g.stroke();
      g.fillStyle = 'rgba(170,200,225,0.15)';
      const corners = [[10, 10], [TS - 12, 10], [10, TS - 12], [TS - 12, TS - 12]];
      for (const cn of corners) {
        g.beginPath(); g.arc(x + cn[0], y + cn[1], 2.1, 0, TAU); g.fill();
      }
      if (rnd() < 0.13) drawVent(g, x + 42, y + 52, 74, 46);
      if (rnd() < 0.10) {
        g.fillStyle = 'rgba(6,10,14,0.5)';
        g.beginPath();
        g.ellipse(x + 30 + rnd() * 100, y + 30 + rnd() * 100, 12 + rnd() * 22, 6 + rnd() * 12, rnd() * TAU, 0, TAU);
        g.fill();
      }
    }
  }

  // схема-плата: бесшовная CC0-текстура (OpenGameArt, "2 Tiling Circuit Textures")
  if (Settings.quality && FLOOR_TEX.complete && FLOOR_TEX.naturalWidth) {
    const pat = g.createPattern(FLOOR_TEX, 'repeat');
    if (pat) {
      g.save();
      g.globalAlpha = 0.12;
      g.fillStyle = pat;
      g.fillRect(26, 26, r.w - 52, r.h - 52);
      g.restore();
    }
  }

  // несущие балки
  g.strokeStyle = 'rgba(2,5,8,0.55)';
  g.lineWidth = 14;
  for (let x = 640; x < r.w - 26; x += 640) {
    g.beginPath(); g.moveTo(x, 26); g.lineTo(x, r.h - 26); g.stroke();
  }
  for (let y = 640; y < r.h - 26; y += 640) {
    g.beginPath(); g.moveTo(26, y); g.lineTo(r.w - 26, y); g.stroke();
  }
  g.strokeStyle = 'rgba(140,190,220,0.08)';
  g.lineWidth = 2;
  for (let x = 640; x < r.w - 26; x += 640) {
    g.beginPath(); g.moveTo(x + 8, 26); g.lineTo(x + 8, r.h - 26); g.stroke();
  }

  // кабельные трассы вдоль стен
  for (let side = 0; side < 2; side++) {
    const horiz = side === 0;
    const lanes = 2 + Math.floor(rnd() * 2);
    for (let i = 0; i < lanes; i++) {
      const off = 40 + rnd() * 46;
      g.strokeStyle = 'rgba(4,8,12,0.95)';
      g.lineWidth = 7 + rnd() * 3;
      g.beginPath();
      if (horiz) {
        const y = i % 2 ? off : r.h - off;
        g.moveTo(30, y); g.lineTo(r.w - 30, y);
      } else {
        const x = i % 2 ? off : r.w - off;
        g.moveTo(x, 30); g.lineTo(x, r.h - 30);
      }
      g.stroke();
      const col = ['rgba(90,220,180,0.22)', 'rgba(255,180,80,0.18)', 'rgba(90,200,255,0.18)'][Math.floor(rnd() * 3)];
      g.strokeStyle = col;
      g.lineWidth = 2;
      g.stroke();
      // стяжки
      g.strokeStyle = 'rgba(160,190,215,0.16)';
      g.lineWidth = 3;
      for (let k = 80; k < (horiz ? r.w : r.h) - 60; k += 150 + rnd() * 90) {
        if (horiz) {
          const y = i % 2 ? off : r.h - off;
          g.beginPath(); g.moveTo(k, y - 7); g.lineTo(k, y + 7); g.stroke();
        } else {
          const x = i % 2 ? off : r.w - off;
          g.beginPath(); g.moveTo(x - 7, k); g.lineTo(x + 7, k); g.stroke();
        }
      }
    }
  }

  // аварийные лампы по полу
  const lamps = 4 + Math.floor(rnd() * 4);
  for (let i = 0; i < lamps; i++) {
    const lx = 120 + rnd() * (r.w - 240);
    const ly = 120 + rnd() * (r.h - 240);
    g.fillStyle = '#231a10';
    rr(g, lx - 16, ly - 5, 32, 10, 3); g.fill();
    g.fillStyle = 'rgba(255,186,92,0.9)';
    rr(g, lx - 13, ly - 2.5, 26, 5, 2); g.fill();
    const glow = g.createRadialGradient(lx, ly, 1, lx, ly, 54);
    glow.addColorStop(0, 'rgba(255,180,90,0.30)');
    glow.addColorStop(1, 'rgba(255,180,90,0)');
    g.fillStyle = glow;
    g.beginPath(); g.arc(lx, ly, 54, 0, TAU); g.fill();
  }

  // стены-булькхеды
  const B = 26;
  g.fillStyle = '#070b11';
  g.fillRect(0, 0, r.w, B);
  g.fillRect(0, r.h - B, r.w, B);
  g.fillRect(0, 0, B, r.h);
  g.fillRect(r.w - B, 0, B, r.h);
  g.strokeStyle = 'rgba(80,190,240,0.16)';
  g.lineWidth = 2;
  g.strokeRect(B + 1, B + 1, r.w - 2 * B - 2, r.h - 2 * B - 2);
  // трубы в стене
  g.strokeStyle = 'rgba(120,160,190,0.16)';
  g.lineWidth = 4;
  g.beginPath(); g.moveTo(B, 14); g.lineTo(r.w - B, 14); g.stroke();
  g.beginPath(); g.moveTo(B, r.h - 14); g.lineTo(r.w - B, r.h - 14); g.stroke();
  g.strokeStyle = 'rgba(160,190,215,0.22)';
  g.lineWidth = 2;
  for (let x = B + 60; x < r.w - B; x += 120) {
    g.beginPath(); g.moveTo(x, 9); g.lineTo(x, 19); g.stroke();
    g.beginPath(); g.moveTo(x, r.h - 19); g.lineTo(x, r.h - 9); g.stroke();
  }
  // аварийные полосы по внутреннему краю
  g.save();
  g.beginPath();
  g.rect(B, B, r.w - 2 * B, 10);
  g.rect(B, r.h - B - 10, r.w - 2 * B, 10);
  g.clip();
  g.fillStyle = 'rgba(255,190,70,0.20)';
  for (let x = -40; x < r.w + 40; x += 26) {
    g.beginPath();
    g.moveTo(x, B); g.lineTo(x + 10, B); g.lineTo(x + 20, B + 10); g.lineTo(x + 10, B + 10);
    g.closePath(); g.fill();
    g.beginPath();
    g.moveTo(x, r.h - B - 10); g.lineTo(x + 10, r.h - B - 10); g.lineTo(x + 20, r.h - B); g.lineTo(x + 10, r.h - B);
    g.closePath(); g.fill();
  }
  g.restore();

  // иллюминаторы
  const ports = 3 + Math.floor(rnd() * 3);
  for (let i = 0; i < ports; i++) {
    const t = rnd();
    let px, py;
    if (rnd() < 0.5) { px = 120 + t * (r.w - 240); py = rnd() < 0.5 ? B : r.h - B; }
    else { px = rnd() < 0.5 ? B : r.w - B; py = 120 + t * (r.h - 240); }
    g.fillStyle = '#02060c';
    g.beginPath(); g.arc(px, py, 17, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(120,190,230,0.35)';
    g.lineWidth = 3; g.stroke();
    g.fillStyle = 'rgba(120,200,255,0.08)';
    g.beginPath(); g.arc(px, py, 13, 0, TAU); g.fill();
    g.fillStyle = 'rgba(220,240,255,0.7)';
    for (let k = 0; k < 5; k++) {
      g.fillRect(px + (rnd() - 0.5) * 20, py + (rnd() - 0.5) * 20, 1.4, 1.4);
    }
  }

  // затемнение у стен
  const vg = g.createRadialGradient(r.w / 2, r.h / 2, Math.min(r.w, r.h) * 0.32,
                                    r.w / 2, r.h / 2, Math.max(r.w, r.h) * 0.7);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.5)');
  g.fillStyle = vg;
  g.fillRect(0, 0, r.w, r.h);

  return c;
}

const FLOOR_TEX = new Image();
FLOOR_TEX.src = 'assets_circuit.png';
FLOOR_TEX.onload = () => { FLOOR_KEY = -1; };

function drawMenuScene(now) {
  const t = (now || 0) / 1000;
  const W = VW, H = VH;

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#04060e');
  bg.addColorStop(0.42, '#081326');
  bg.addColorStop(1, '#04070d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const nb = ctx.createRadialGradient(W * 0.2, H * 0.24, 8, W * 0.2, H * 0.24, H * 0.55);
  nb.addColorStop(0, 'rgba(60,120,220,0.18)');
  nb.addColorStop(1, 'rgba(60,120,220,0)');
  ctx.fillStyle = nb;
  ctx.fillRect(0, 0, W, H);
  const nm = ctx.createRadialGradient(W * 0.86, H * 0.30, 8, W * 0.86, H * 0.30, H * 0.45);
  nm.addColorStop(0, 'rgba(160,70,220,0.14)');
  nm.addColorStop(1, 'rgba(160,70,220,0)');
  ctx.fillStyle = nm;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 74; i++) {
    const sx = (i * 137.5) % W;
    const sy = ((i * 91.3) + t * (5 + (i % 5) * 5)) % (H * 0.58);
    const tw = 0.65 + 0.35 * Math.sin(t * 1.6 + i * 1.7);
    ctx.globalAlpha = (0.12 + 0.5 * ((i % 7) / 7)) * tw;
    ctx.fillStyle = i % 13 === 0 ? '#9fe4ff' : '#cfe9ff';
    const s = i % 11 === 0 ? 2 : 1.3;
    ctx.fillRect(sx, sy, s, s);
  }
  ctx.globalAlpha = 1;

  const compact = H < 720;
  const horizon = H * (compact ? 0.30 : 0.40);
  ctx.fillStyle = 'rgba(9,17,30,0.92)';
  ctx.fillRect(0, horizon - 96, W, 96);
  ctx.strokeStyle = 'rgba(80,150,210,0.13)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 58) {
    ctx.beginPath(); ctx.moveTo(x, horizon - 96); ctx.lineTo(x, horizon); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(0, horizon - 96); ctx.lineTo(W, horizon - 96); ctx.stroke();

  // люк в стене
  const hw = W * 0.24, hh = 58, hx0 = W / 2 - hw / 2, hy0 = horizon - hh - 10;
  ctx.fillStyle = 'rgba(6,12,22,0.95)';
  ctx.fillRect(hx0, hy0, hw, hh);
  ctx.strokeStyle = 'rgba(120,200,255,0.22)';
  ctx.lineWidth = 2;
  ctx.strokeRect(hx0, hy0, hw, hh);
  const lampA = 0.35 + 0.25 * Math.sin(t * 2.2);
  ctx.fillStyle = 'rgba(255,120,80,' + lampA.toFixed(2) + ')';
  ctx.fillRect(hx0 + hw / 2 - 10, hy0 - 4, 20, 3);

  const fy = H * (compact ? 0.32 : 0.42);
  const fg = ctx.createLinearGradient(0, fy, 0, H);
  fg.addColorStop(0, '#0c1727');
  fg.addColorStop(1, '#050a12');
  ctx.fillStyle = fg;
  ctx.fillRect(0, fy, W, H - fy);

  ctx.strokeStyle = 'rgba(90,170,230,0.10)';
  const vpx = W / 2, vpy = fy - 90;
  for (let i = -7; i <= 7; i++) {
    ctx.beginPath();
    ctx.moveTo(vpx + i * 7, vpy);
    ctx.lineTo(vpx + i * 175, H);
    ctx.stroke();
  }
  for (let k = 1; k <= 9; k++) {
    const p = k / 9;
    const y = fy + Math.pow(p, 2.3) * (H - fy);
    ctx.globalAlpha = 0.45 - p * 0.28;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // свет из люка падает на пол
  const beam = ctx.createLinearGradient(hx0 + hw / 2, hy0 + hh, hx0 + hw / 2, fy + 210);
  beam.addColorStop(0, 'rgba(120,200,255,0.16)');
  beam.addColorStop(1, 'rgba(120,200,255,0)');
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(hx0 + hw * 0.1, hy0 + hh);
  ctx.lineTo(hx0 + hw * 0.9, hy0 + hh);
  ctx.lineTo(hx0 + hw * 1.55, fy + 210);
  ctx.lineTo(hx0 - hw * 0.55, fy + 210);
  ctx.closePath();
  ctx.fill();

  const hxp = W / 2, hyp = H * (compact ? 0.345 : 0.455) + Math.sin(t * 1.5) * 3;
  const halo = ctx.createRadialGradient(hxp, hyp - 10, 6, hxp, hyp - 10, 150);
  halo.addColorStop(0, 'rgba(120,240,255,0.34)');
  halo.addColorStop(0.55, 'rgba(79,180,255,0.13)');
  halo.addColorStop(1, 'rgba(79,240,255,0)');
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(hxp, hyp - 10, 150, 0, TAU); ctx.fill();

  const pool = ctx.createRadialGradient(hxp, hyp + 46, 4, hxp, hyp + 46, 130);
  pool.addColorStop(0, 'rgba(80,200,255,0.20)');
  pool.addColorStop(1, 'rgba(80,200,255,0)');
  ctx.fillStyle = pool;
  ctx.beginPath(); ctx.ellipse(hxp, hyp + 46, 130, 42, 0, 0, TAU); ctx.fill();

  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath(); ctx.ellipse(hxp, hyp + 52, 46, 12, 0, 0, TAU); ctx.fill();

  // дрейфующие силуэты за стеклом
  if (typeof SPR !== 'undefined' && SPR.grunt) {
    for (let i = 0; i < 3; i++) {
      const dxp = ((t * (10 + i * 6) + i * 220) % (W + 160)) - 80;
      const dyp = H * ((compact ? 0.20 : 0.305) + i * 0.028) + Math.sin(t * 0.8 + i) * 5;
      ctx.save();
      ctx.globalAlpha = 0.06 + i * 0.015;
      drawRotatedSprite(SPR.grunt, dxp, dyp, 46 + i * 10, Math.PI / 2, 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  if (typeof SPR !== 'undefined' && SPR.marine) {
    ctx.save();
    ctx.shadowColor = 'rgba(120,220,255,0.85)';
    ctx.shadowBlur = 30;
    drawRotatedSprite(SPR.marine, hxp, hyp, compact ? 118 : 158, -Math.PI / 2, 0, 0);
    ctx.restore();
  }

  for (let i = 0; i < 16; i++) {
    const px = ((i * 211.7) + t * 12) % W;
    const py = (H * 0.35 + ((i * 97.3) + t * 18) % (H * 0.6));
    ctx.globalAlpha = 0.10 + 0.12 * ((i % 4) / 4);
    ctx.fillStyle = '#9fe4ff';
    ctx.beginPath(); ctx.arc(px, py, 1 + (i % 3) * 0.6, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawBackground() {
  const r = Game.room;
  ctx.fillStyle = '#04060c';
  ctx.fillRect(0, 0, r.w, r.h);

  if (FLOOR_KEY !== Game.roomIndex || !FLOOR_IMG) {
    FLOOR_IMG = makeFloor(r, Game.roomIndex);
    FLOOR_KEY = Game.roomIndex;
  }
  ctx.drawImage(FLOOR_IMG, 0, 0);

  // пыль в воздухе
  for (let i = 0; i < 30; i++) {
    const sp = 5 + (i % 4) * 4;
    const x = (i * 197.3 + Game.time * sp) % r.w;
    const y = (i * 313.7 + Game.time * sp * 0.5) % r.h;
    ctx.globalAlpha = 0.04 + 0.06 * ((i % 5) / 5);
    ctx.fillStyle = '#a7d8ff';
    ctx.beginPath();
    ctx.arc(x, y, 1.2 + (i % 3) * 0.8, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = 'rgba(79,240,255,0.22)';
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, r.w - 4, r.h - 4);
}

function drawDoor() {
  const r = Game.room;
  if (!r.doors) return;
  for (const d of r.doors) {
    const t = d.pulse || 0;
    const elite = d.type === 'elite';
    const col = elite ? '255,79,216' : '79,240,255';
    glow(elite ? '#ff4fd8' : '#4ff0ff', elite ? 30 : 24);
    const rings = elite
      ? ['rgba(255,79,216,0.95)', 'rgba(255,120,80,0.75)', 'rgba(255,60,60,0.6)']
      : ['rgba(79,240,255,0.9)', 'rgba(139,92,255,0.7)', 'rgba(255,79,216,0.6)'];
    for (let i = 0; i < 3; i++) {
      const rad = 42 - i * 11 + Math.sin(t * 3 + i) * 3;
      ctx.beginPath();
      ctx.arc(d.x, d.y, rad, 0, TAU);
      ctx.strokeStyle = rings[i];
      ctx.lineWidth = elite ? 4 : 3;
      ctx.stroke();
    }
    const g = ctx.createRadialGradient(d.x, d.y, 2, d.x, d.y, 42);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.5, 'rgba(' + col + ',0.36)');
    g.addColorStop(1, 'rgba(' + col + ',0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(d.x, d.y, 42, 0, TAU);
    ctx.fill();
    noGlow();

    ctx.font = '700 10px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = elite ? 'rgba(255,130,210,0.95)' : 'rgba(150,240,255,0.9)';
    ctx.fillText(elite ? 'ЭЛИТА · РИСК' : 'ДАЛЬШЕ', d.x, d.y + 64);
    if (elite) {
      ctx.fillStyle = 'rgba(255,130,210,0.6)';
      ctx.fillText('больше врагов и монет', d.x, d.y + 78);
    }
    ctx.textAlign = 'left';
  }
}

function drawWeaponGlyph(c, id, S) {
  const col = 'rgb(' + ((WEAPONS[id] || {}).col || '200,220,255') + ')';
  const dark = '#080d16';
  c.save();
  c.scale(S / 28, S / 28);
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.fillStyle = col;
  c.strokeStyle = dark;
  c.lineWidth = 1.2;

  const P = (pts) => { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); c.fill(); c.stroke(); };
  const R = (x, y, w, h) => { c.beginPath(); c.rect(x, y, w, h); c.fill(); c.stroke(); };

  if (id === 'rifle') {
    R(7, 11.6, 12, 4.4);          // ствольная коробка
    R(17, 12.6, 8, 2.2);          // ствол
    R(24, 12.1, 1.8, 3.2);        // дульный тормоз
    P([7, 11.9, 7, 16.2, 3.2, 18.2, 2.6, 14.4]); // приклад
    P([10.4, 15.8, 13.6, 15.8, 13.1, 21, 10.6, 21]); // магазин
    R(11, 8.4, 6.4, 2.2);         // оптика
    R(12.8, 10.4, 2.6, 1.4);
  } else if (id === 'shotgun') {
    R(8.4, 10.4, 14, 2.2);        // верхний ствол
    R(8.4, 13, 14, 2.2);          // нижний ствол
    R(7, 10, 5, 6.4);             // колодка
    P([7, 11.4, 7, 16, 3, 18, 2.4, 14]); // приклад
    R(15.6, 15.6, 5.6, 2.4);      // цевьё
    c.beginPath(); c.arc(11.6, 18.2, 2.2, 0, Math.PI); c.stroke(); // скоба
  } else if (id === 'smg') {
    R(7.6, 10.8, 9.6, 4.6);       // корпус
    R(16.6, 12.2, 6.2, 1.9);      // ствол
    R(21.8, 11.2, 2, 3.8);        // дуло
    P([11, 15.2, 14.6, 15.2, 14, 22, 11.4, 22]); // длинный магазин
    R(3, 11.4, 4.8, 1.7);         // складной приклад
    R(16.2, 15.2, 2.6, 4);        // рукоять
  } else if (id === 'laser') {
    R(6, 11.4, 10, 4.6);          // корпус
    P([16, 10.2, 24, 11.4, 24, 12.6, 16, 12.4]); // верхний излучатель
    P([16, 16.0, 24, 14.8, 24, 16.2, 16, 14.2]); // нижний излучатель
    c.fillStyle = '#ffffff';
    c.beginPath(); c.arc(20.2, 13.6, 2.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = col;
    R(8, 8.6, 5, 2.2);            // катушка
    R(8, 16.4, 3.4, 4.2);         // рукоять
  } else if (id === 'rocket') {
    R(6.4, 10.6, 12.6, 5.8);      // труба
    P([19, 9.8, 26, 13.5, 19, 17.2]); // боеголовка
    R(4, 9.4, 2.6, 8.2);          // срез трубы
    P([4, 9.6, 1.6, 7, 6.2, 9.6]);
    P([4, 17.4, 1.6, 20, 6.2, 17.4]);
    R(10.6, 16.4, 3.4, 4);        // рукоять
  } else {
    P([6.6, 18.4, 8.6, 10.4, 19.4, 10.4, 21.4, 18.4]); // корпус
    c.fillStyle = '#ffffff';
    c.beginPath(); c.arc(14, 9.4, 2.4, 0, Math.PI * 2); c.fill();
    c.fillStyle = col;
    R(9.6, 12.6, 9.6, 1.8);       // катушки
    R(9.2, 15.4, 10.4, 1.8);
    R(12.4, 18.2, 3.2, 4.4);      // рукоять
  }
  c.restore();
}

function drawPickups() {
  for (const k of Game.pickups) {
    const bob = Math.sin(Game.time * 4 + k.x * 0.1) * 2;
    if (k.type === 'coin') {
      glow('#ffcf4f', 10);
      ctx.fillStyle = '#ffcf4f';
      drawPoly(k.x, k.y + bob, k.r, 8, Game.time * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      drawPoly(k.x, k.y + bob, k.r * 0.45, 8, -Game.time * 2);
      ctx.fill();
    } else if (k.type === 'ammo') {
      const wc = (WEAPONS[k.w] || {}).col || '255,207,79';
      glow('rgba(' + wc + ',0.8)', 12);
      ctx.fillStyle = 'rgba(20,26,34,0.95)';
      rr(ctx, k.x - 8, k.y - 7 + bob * 0.5, 16, 14, 3);
      ctx.fill();
      ctx.strokeStyle = 'rgba(' + wc + ',0.95)';
      ctx.lineWidth = 2;
      rr(ctx, k.x - 8, k.y - 7 + bob * 0.5, 16, 14, 3);
      ctx.stroke();
      ctx.fillStyle = 'rgba(' + wc + ',0.9)';
      ctx.fillRect(k.x - 5, k.y - 2 + bob * 0.5, 10, 3);
      noGlow();
    } else if (k.type === 'xp') {
      glow('#4ff0ff', 12);
      ctx.fillStyle = '#4ff0ff';
      drawPoly(k.x, k.y + bob, k.r, 4, Math.PI / 4);
      ctx.fill();
    } else {
      glow('#ff4fd8', 20);
      ctx.fillStyle = 'rgba(255,79,216,0.25)';
      drawPoly(k.x, k.y + bob, k.r + 8, 6, Game.time);
      ctx.fill();
      ctx.strokeStyle = '#ff4fd8';
      ctx.lineWidth = 2;
      drawPoly(k.x, k.y + bob, k.r + 8, 6, Game.time);
      ctx.stroke();
      ctx.fillStyle = '#ffe8fa';
      ctx.fillRect(k.x - 8, k.y + bob - 2, 16, 4);
      ctx.fillRect(k.x - 2, k.y + bob - 8, 4, 16);
    }
    noGlow();
  }
}

function drawEnemy(e) {
  const p = Game.player;
  let face = Math.atan2(p.y - e.y, p.x - e.x) + Math.PI / 2;
  while (face > Math.PI) face -= TAU;
  while (face < -Math.PI) face += TAU;
  face = clamp(face, -0.55, 0.55);  // наклон к игроку, но корпус смотрит в камеру
  const size = e.r * (e.type === 'boss' ? 2.9 : 3.2);

  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.beginPath();
  ctx.ellipse(e.x, e.y + e.r * 0.72, e.r * 0.95, e.r * 0.38, 0, 0, TAU);
  ctx.fill();

  const gg = ctx.createRadialGradient(e.x, e.y + e.r * 0.5, 2, e.x, e.y + e.r * 0.5, e.r * 1.6);
  gg.addColorStop(0, e.type === 'boss' ? 'rgba(201,255,90,0.30)' : 'rgba(120,255,120,0.15)');
  gg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gg;
  ctx.beginPath();
  ctx.arc(e.x, e.y + e.r * 0.5, e.r * 1.6, 0, TAU);
  ctx.fill();

  drawRotatedSprite(SPR[e.type] || SPR.grunt, e.x, e.y, size, face, e.hitFlash, e.anim * 0.16);

  if (e.boss || e.type === 'boss') {
    const frac = e.hp / e.maxHp;
    const ph = frac > 0.66 ? 1 : (frac > 0.33 ? 2 : 3);
    const pulse = 0.6 + 0.4 * Math.sin(Game.time * (4 + ph * 2));
    const coreCol = ph === 1 ? '160,255,150' : (ph === 2 ? '255,200,90' : '255,90,110');
    const cg = ctx.createRadialGradient(e.x, e.y, 2, e.x, e.y, e.r * 0.62);
    cg.addColorStop(0, 'rgba(255,255,255,' + (0.75 * pulse).toFixed(2) + ')');
    cg.addColorStop(0.45, 'rgba(' + coreCol + ',' + (0.6 * pulse).toFixed(2) + ')');
    cg.addColorStop(1, 'rgba(' + coreCol + ',0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r * 0.62, 0, TAU);
    ctx.fill();
  }

  if (e.elite) {
    ctx.strokeStyle = 'rgba(255,79,216,0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(e.x, e.y + 2, e.r * 1.45 + Math.sin(Game.time * 4) * 1.5, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,79,216,0.16)';
    ctx.beginPath();
    ctx.arc(e.x, e.y + 2, e.r * 1.45, 0, TAU);
    ctx.fill();
  }

  const top = e.y - size * 0.5 - 8;

  if (e.boss || e.type === 'boss') {
    ctx.font = '700 11px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(201,255,90,0.92)';
    ctx.fillText(e.bossName || 'СТРАЖ СЕКТОРА', e.x, top - 14);
    ctx.textAlign = 'left';
  }

  if (e.hp < e.maxHp) {
    const w = Math.max(e.r * 1.8, 34), h = 4;
    const x = e.x - w / 2, y = top;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = (e.boss || e.type === 'boss') ? '#c9ff5a' : '#8dff72';
    ctx.fillRect(x, y, w * clamp(e.hp / e.maxHp, 0, 1), h);
  }
}

function drawDrone() {
  const d = Game.drone;
  if (!d) return;
  const lv = d.level || 1;
  ctx.save();
  ctx.translate(d.x, d.y);

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 34, 16, 5, 0, 0, TAU); ctx.fill();

  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
  glow.addColorStop(0, 'rgba(150,255,220,0.45)');
  glow.addColorStop(1, 'rgba(150,255,220,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(0, 0, 26, 0, TAU); ctx.fill();

  // корпус
  const g = ctx.createLinearGradient(0, -10, 0, 10);
  g.addColorStop(0, '#9fb6c6');
  g.addColorStop(0.5, '#4d6474');
  g.addColorStop(1, '#22303c');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-11, 0); ctx.lineTo(-6, -8); ctx.lineTo(6, -8); ctx.lineTo(11, 0);
  ctx.lineTo(6, 8); ctx.lineTo(-6, 8); ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#0a1118'; ctx.lineWidth = 2; ctx.stroke();

  // кольцо
  ctx.strokeStyle = 'rgba(150,255,220,0.75)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, 17, 7, Math.sin(Game.time * 1.6) * 0.5, 0, TAU);
  ctx.stroke();

  // ядро
  ctx.fillStyle = d.fireFlash > 0 ? '#ffffff' : '#96ffdc';
  ctx.beginPath(); ctx.arc(0, 0, 3.4 + d.fireFlash * 1.6, 0, TAU); ctx.fill();

  // ствол к цели
  const tgt = Game.nearestEnemy(d.x, d.y, 460);
  if (tgt) {
    const a = Math.atan2(tgt.y - d.y, tgt.x - d.x);
    ctx.save(); ctx.rotate(a);
    ctx.fillStyle = '#7e94a4';
    ctx.fillRect(6, -2, 10, 4);
    if (d.fireFlash > 0) {
      ctx.fillStyle = 'rgba(200,255,240,' + d.fireFlash.toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(17, 0, 4 * d.fireFlash, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  // уровень щитом
  if (lv >= 3) {
    ctx.strokeStyle = 'rgba(150,220,255,' + (0.25 + 0.15 * Math.sin(Game.time * 3)).toFixed(2) + ')';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(0, 0, 23, 0, TAU); ctx.stroke();
  }
  ctx.restore();
}

function drawPlayer() {
  const p = Game.player;
  const t = Game.time;

  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 16, 17, 7, 0, 0, TAU);
  ctx.fill();

  if (p.moving) {
    const back = p.aim + Math.PI;
    const fx = p.x + Math.cos(back) * 15, fy = p.y + Math.sin(back) * 15;
    glow('#4ff0ff', 18);
    ctx.fillStyle = 'rgba(79,240,255,0.9)';
    drawPoly(fx, fy, 7 + Math.sin(t * 30) * 2.5, 4, back);
    ctx.fill();
    noGlow();
  }

  const blink = p.invuln > 0 ? 0.5 + 0.5 * Math.abs(Math.sin(t * 22)) : 1;
  ctx.globalAlpha = blink;

  const pg = ctx.createRadialGradient(p.x, p.y + 8, 2, p.x, p.y + 8, 34);
  pg.addColorStop(0, 'rgba(120,255,220,0.16)');
  pg.addColorStop(1, 'rgba(120,255,220,0)');
  ctx.fillStyle = pg;
  ctx.beginPath();
  ctx.arc(p.x, p.y + 8, 34, 0, TAU);
  ctx.fill();

  const lean = p.moving ? clamp((p.moveX || 0) * 0.16, -0.14, 0.14) : 0;
  drawRotatedSprite(SPR.marine, p.x, p.y, 68, -Math.PI / 2 + lean, p.flash, p.anim * 0.14);
  drawPlayerRifle(p);

  if (p.muzzle > 0) {
    const mx = p.x + Math.cos(p.aim) * 40, my = p.y + Math.sin(p.aim) * 40;
    ctx.globalCompositeOperation = 'lighter';
    glow('#9ffcff', 22);
    ctx.fillStyle = 'rgba(230,255,255,' + p.muzzle + ')';
    drawPoly(mx, my, 8 * p.muzzle + 3, 4, p.aim);
    ctx.fill();
    noGlow();
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.globalAlpha = 1;
}

function drawPlayerRifle(p) {
  ctx.save();
  ctx.translate(p.x + Math.cos(p.aim) * 9, p.y + Math.sin(p.aim) * 9 + 2);
  ctx.rotate(p.aim);
  // цевьё
  ctx.fillStyle = '#1a1f24';
  ctx.strokeStyle = '#05080a';
  ctx.lineWidth = 2;
  rr(ctx, 2, -5, 34, 10, 3); ctx.fill(); ctx.stroke();
  // ствол
  ctx.fillStyle = '#39424a';
  rr(ctx, 20, -3, 20, 6, 2); ctx.fill(); ctx.stroke();
  // дуло
  ctx.fillStyle = '#8b99a3';
  rr(ctx, 38, -4.5, 7, 9, 2); ctx.fill(); ctx.stroke();
  // магазин
  ctx.fillStyle = '#2a3136';
  rr(ctx, 10, 4, 9, 11, 2); ctx.fill(); ctx.stroke();
  // энергоячейка
  ctx.fillStyle = 'rgba(140,255,190,0.9)';
  rr(ctx, 6, -2.5, 5, 6, 2); ctx.fill();
  // рукавица
  ctx.fillStyle = '#26331a';
  ctx.strokeStyle = '#05080a';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(6, 2, 6, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.restore();
}

function drawBullets() {
  ctx.globalCompositeOperation = 'lighter';
  for (const b of Game.bullets) {
    const ang = Math.atan2(b.vy, b.vx);
    const len = (Math.min(22, Math.hypot(b.vx, b.vy) * 0.026) + b.r) * (b.tracer || 1);
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(ang);
    const col = b.crit ? '255,210,79' : (b.col || '120,245,255');
    const g = ctx.createLinearGradient(-len, 0, b.r * 0.6, 0);
    g.addColorStop(0, 'rgba(' + col + ',0)');
    g.addColorStop(0.5, 'rgba(' + col + ',0.5)');
    g.addColorStop(1, 'rgba(' + col + ',1)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(-len / 2 + b.r * 0.3, 0, len / 2 + b.r * 0.5, b.r * 0.95, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(b.r * 0.2, 0, b.r * 0.32, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over';
  for (const b of Game.ebullets) {
    glow('#ff3b6b', 12);
    ctx.fillStyle = '#ff7d9c';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r * 0.4, 0, TAU);
    ctx.fill();
    noGlow();
  }
  ctx.lineCap = 'butt';
}

function drawParticles() {
  for (const p of Game.parts) {
    ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
    ctx.fillStyle = p.col;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawTexts() {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const t of Game.texts) {
    const a = clamp(t.life / t.max, 0, 1);
    const size = t.crit ? 17 : 12;
    ctx.globalAlpha = a;
    ctx.font = '700 ' + size + 'px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(2,6,16,0.75)';
    ctx.fillText(t.v, t.x + 1, t.y + 1);
    ctx.fillStyle = t.col;
    ctx.fillText(t.v, t.x, t.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function drawSplats() {
  for (const s of Game.splats) {
    const a = clamp(s.life / s.max, 0, 1);
    ctx.globalAlpha = a * 0.8;
    for (const b of s.blobs) {
      const x = s.x + b.dx, y = s.y + b.dy;
      ctx.fillStyle = 'rgba(8,26,12,0.85)';
      ctx.beginPath(); ctx.ellipse(x, y, b.r + 3, (b.r + 3) * 0.72, 0, 0, TAU); ctx.fill();
      const g = ctx.createRadialGradient(x - 1, y - 1, 0.5, x, y, b.r);
      g.addColorStop(0, 'rgba(150,230,110,0.85)');
      g.addColorStop(0.55, 'rgba(74,180,72,0.8)');
      g.addColorStop(1, 'rgba(24,86,34,0.7)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(x, y, b.r * 0.9, b.r * 0.66, 0, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

function rayRect(px, py, dx, dy, r, maxT) {
  const x0 = r.x, y0 = r.y, x1 = r.x + r.w, y1 = r.y + r.h;
  let tmin = 0, tmax = maxT;
  let t1 = (x0 - px) / (dx || 1e-6), t2 = (x1 - px) / (dx || 1e-6);
  if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
  tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
  if (tmin > tmax) return Infinity;
  let u1 = (y0 - py) / (dy || 1e-6), u2 = (y1 - py) / (dy || 1e-6);
  if (u1 > u2) { const t = u1; u1 = u2; u2 = t; }
  tmin = Math.max(tmin, u1); tmax = Math.min(tmax, u2);
  if (tmin > tmax) return Infinity;
  return tmin > 0 ? tmin : 0;
}

/* Полигон видимости: 160 лучей, упираются в ящики/трубы/турели */
/* конус фонаря: лучи только в секторе обзора, с обрезкой о стены */
function flashlightPoly(cx, cy, ang, half, reach, rays) {
  const pts = [];
  for (let i = 0; i <= rays; i++) {
    const a = ang - half + (2 * half) * (i / rays);
    const dx = Math.cos(a), dy = Math.sin(a);
    let best = reach;
    for (const pr of Game.props) {
      if (pr.dead) continue;
      const t = rayRect(cx, cy, dx, dy, pr, reach);
      if (t < best) best = t;
    }
    pts.push([cx + dx * best, cy + dy * best]);
  }
  return pts;
}

function visibilityPolygon(cx, cy, maxR) {
  const RAYS = Settings.quality ? 150 : 80;
  const pts = [];
  for (let i = 0; i < RAYS; i++) {
    const a = (i / RAYS) * TAU;
    const dx = Math.cos(a), dy = Math.sin(a);
    let best = maxR;
    for (const pr of Game.props) {
      if (pr.dead) continue;
      const t = rayRect(cx, cy, dx, dy, pr, maxR);
      if (t < best) best = t;
    }
    pts.push([cx + dx * best, cy + dy * best]);
  }
  return pts;
}

let _darkLayer = null;
function getDarkLayer() {
  if (_darkLayer && _darkLayer.w === VW && _darkLayer.h === VH) return _darkLayer;
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.round(VW * DPR));
  cv.height = Math.max(1, Math.round(VH * DPR));
  _darkLayer = { cv: cv, ctx: cv.getContext('2d'), dpr: DPR, w: VW, h: VH };
  return _darkLayer;
}

function drawAcid() {
  if (!Game.acid) return;
  for (const a of Game.acid) {
    const pulse = 0.7 + 0.3 * Math.sin(a.t * 2.2);
    const g = ctx.createRadialGradient(a.x, a.y, 4, a.x, a.y, a.r);
    g.addColorStop(0, 'rgba(180,255,90,0.42)');
    g.addColorStop(0.65, 'rgba(120,220,40,0.3)');
    g.addColorStop(1, 'rgba(60,140,20,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(a.x, a.y, a.r, a.r * 0.7, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(200,255,120,' + (0.35 * pulse).toFixed(2) + ')';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(a.x, a.y, a.r * 0.9, a.r * 0.62, 0, 0, TAU); ctx.stroke();
  }
}

function drawIceFloor() {
  if (!Game.room || !Game.room.mod || Game.room.mod.id !== 'ice') return;
  const r = Game.room;
  const g = ctx.createLinearGradient(0, 0, 0, r.h);
  g.addColorStop(0, 'rgba(140,220,255,0.10)');
  g.addColorStop(0.5, 'rgba(120,200,255,0.16)');
  g.addColorStop(1, 'rgba(90,170,240,0.10)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, r.w, r.h);
  ctx.strokeStyle = 'rgba(200,245,255,0.16)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 14; i++) {
    const x = (i * 173.7) % r.w, y = (i * 259.3) % r.h;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 40, y + 14);
    ctx.lineTo(x + 26, y + 40);
    ctx.stroke();
  }
}

function drawProps() {
  for (const p of Game.props) {
    const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
    const hurt = 1 - p.hp / p.maxHp;

    // стены не «висят» над полом — им эллипс-тень не нужна
    if (p.type !== 'wall') {
      const sr = Math.min(p.w, p.h) * 0.55;
      ctx.fillStyle = 'rgba(0,0,0,0.34)';
      ctx.beginPath();
      ctx.ellipse(cx, p.y + p.h + 4, sr, Math.min(7, sr * 0.28), 0, 0, TAU);
      ctx.fill();
    }

    if (p.type === 'wall') {
      const g = ctx.createLinearGradient(p.x, p.y, p.x + p.w * 0.7, p.y + p.h);
      g.addColorStop(0, '#57657a');
      g.addColorStop(0.45, '#354150');
      g.addColorStop(1, '#1e2731');
      ctx.fillStyle = g;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = 'rgba(150,190,220,0.20)';
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x + 1, p.y + 1, p.w - 2, p.h - 2);
      // нижняя тень
      const sh2 = ctx.createLinearGradient(p.x, p.y + p.h - 16, p.x, p.y + p.h);
      sh2.addColorStop(0, 'rgba(0,0,0,0)');
      sh2.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = sh2;
      ctx.fillRect(p.x, p.y + p.h - 16, p.w, 16);
      // заклёпки
      ctx.fillStyle = 'rgba(175,205,230,0.35)';
      const step = 34;
      for (let x = p.x + 10; x < p.x + p.w - 6; x += step) {
        ctx.beginPath(); ctx.arc(x, p.y + 8, 1.8, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(x, p.y + p.h - 8, 1.8, 0, TAU); ctx.fill();
      }
      for (let y = p.y + 10; y < p.y + p.h - 6; y += step) {
        ctx.beginPath(); ctx.arc(p.x + 8, y, 1.8, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(p.x + p.w - 8, y, 1.8, 0, TAU); ctx.fill();
      }
      // жёлтая полоса-предупреждение
      ctx.fillStyle = 'rgba(255,196,80,0.13)';
      ctx.fillRect(p.x + 3, p.y + p.h - 5, p.w - 6, 3);
      if (p.flash > 0) {
        ctx.fillStyle = 'rgba(255,255,255,' + (0.35 * p.flash).toFixed(2) + ')';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        p.flash = Math.max(0, p.flash - 0.09);
      }
    } else if (p.type === 'turret') {
      const ang = Math.atan2(Game.player.y - cy, Game.player.x - cx);
      ctx.fillStyle = 'rgba(46,58,72,0.98)';
      ctx.beginPath(); ctx.ellipse(cx, cy + 10, p.w * 0.52, p.h * 0.34, 0, 0, TAU); ctx.fill();
      const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 26);
      g.addColorStop(0, '#7f8f9f');
      g.addColorStop(1, '#232c36');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, 17, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#0a0f14'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ang);
      ctx.fillStyle = '#39424e';
      ctx.fillRect(-4, -5, 26, 10);
      ctx.strokeStyle = '#0a0f14'; ctx.lineWidth = 2; ctx.strokeRect(-4, -5, 26, 10);
      ctx.fillStyle = 'rgba(255,170,80,' + (0.55 + 0.45 * Math.sin(Game.time * 6)).toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, TAU); ctx.fill();
      ctx.restore();
      if (p.flash > 0) {
        ctx.fillStyle = 'rgba(255,255,255,' + (0.5 * p.flash).toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(cx, cy, 20, 0, TAU); ctx.fill();
        p.flash = Math.max(0, p.flash - 0.08);
      }
    } else if (p.type === 'hive') {
      const pulse = 0.72 + 0.28 * Math.sin(Game.time * 2.6 + p.x);
      const g = ctx.createRadialGradient(cx, cy - 6, 4, cx, cy, p.w * 0.62);
      g.addColorStop(0, 'rgba(230,170,255,0.95)');
      g.addColorStop(0.45, 'rgba(150,80,200,0.85)');
      g.addColorStop(1, 'rgba(48,20,74,0.95)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(cx, cy, p.w * 0.46 * pulse, p.h * 0.5 * pulse, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(20,8,30,0.9)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,190,255,0.35)'; ctx.lineWidth = 1.4;
      for (let k = 0; k < 5; k++) {
        const a = k * 1.256 + Game.time * 0.5;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6);
        ctx.quadraticCurveTo(cx + Math.cos(a) * 18, cy + Math.sin(a) * 18, cx + Math.cos(a) * (p.w * 0.4), cy + Math.sin(a) * (p.h * 0.42));
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(10,4,16,0.9)';
      ctx.beginPath(); ctx.ellipse(cx, cy + 4, 9 * pulse, 6 * pulse, 0, 0, TAU); ctx.fill();
      if (p.flash > 0) {
        ctx.fillStyle = 'rgba(255,255,255,' + (0.45 * p.flash).toFixed(2) + ')';
        ctx.beginPath(); ctx.ellipse(cx, cy, p.w * 0.5, p.h * 0.5, 0, 0, TAU); ctx.fill();
        p.flash = Math.max(0, p.flash - 0.08);
      }
    } else if (p.type === 'crate') {
      const g = ctx.createLinearGradient(p.x, p.y, p.x + p.w * 0.4, p.y + p.h);
      g.addColorStop(0, '#4a5a6d');
      g.addColorStop(0.5, '#2b3644');
      g.addColorStop(1, '#141c24');
      ctx.fillStyle = g;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = '#0a0f14'; ctx.lineWidth = 2.5;
      ctx.strokeRect(p.x + 1, p.y + 1, p.w - 2, p.h - 2);
      ctx.fillStyle = 'rgba(150,180,205,0.16)';
      ctx.fillRect(p.x + 5, p.y + 5, p.w - 10, 7);
      ctx.strokeStyle = 'rgba(8,12,16,0.75)'; ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(p.x + 6, p.y + p.h * 0.46); ctx.lineTo(p.x + p.w - 6, p.y + p.h * 0.46);
      ctx.moveTo(p.x + p.w * 0.5, p.y + 6); ctx.lineTo(p.x + p.w * 0.5, p.y + p.h - 6);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,196,80,0.75)';
      ctx.fillRect(p.x + 8, p.y + p.h - 13, Math.min(24, p.w - 16), 3);
      ctx.fillStyle = 'rgba(190,210,230,0.35)';
      const rivets = [[8, 8], [p.w - 10, 8], [8, p.h - 10], [p.w - 10, p.h - 10]];
      for (const r of rivets) {
        ctx.beginPath(); ctx.arc(p.x + r[0], p.y + r[1], 1.8, 0, TAU); ctx.fill();
      }
    } else if (p.type === 'pipe') {
      const horiz = p.w > p.h;
      const g = horiz
        ? ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h)
        : ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y);
      g.addColorStop(0, '#3c4a56');
      g.addColorStop(0.35, '#8598a8');
      g.addColorStop(1, '#232c35');
      ctx.fillStyle = g;
      rr(ctx, p.x, p.y, p.w, p.h, Math.min(p.h, p.w) / 2);
      ctx.fill();
      ctx.strokeStyle = '#0a0e12'; ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = 'rgba(10,14,18,0.65)'; ctx.lineWidth = 2;
      if (horiz) {
        for (let x = p.x + 24; x < p.x + p.w - 12; x += 30) {
          ctx.beginPath(); ctx.moveTo(x, p.y + 1); ctx.lineTo(x, p.y + p.h - 1); ctx.stroke();
        }
      } else {
        for (let y = p.y + 24; y < p.y + p.h - 12; y += 30) {
          ctx.beginPath(); ctx.moveTo(p.x + 1, y); ctx.lineTo(p.x + p.w - 1, y); ctx.stroke();
        }
      }
    } else if (p.type === 'reactor') {
      const pulse = 0.65 + 0.35 * Math.sin(Game.time * 5);
      const g = ctx.createRadialGradient(cx, cy, 3, cx, cy, p.w * 0.9);
      g.addColorStop(0, 'rgba(180,235,255,0.95)');
      g.addColorStop(0.5, 'rgba(60,150,255,0.6)');
      g.addColorStop(1, 'rgba(10,20,40,0.9)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, p.w / 2, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#0a1018'; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = 'rgba(150,210,255,' + (0.35 + 0.4 * pulse).toFixed(2) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, p.w / 2 - 6, 0, TAU); ctx.stroke();
      ctx.fillStyle = 'rgba(230,250,255,' + pulse.toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(cx, cy, 5 * pulse + 3, 0, TAU); ctx.fill();
      const halo = ctx.createRadialGradient(cx, cy, 2, cx, cy, p.w);
      halo.addColorStop(0, 'rgba(120,200,255,' + (0.22 * pulse).toFixed(2) + ')');
      halo.addColorStop(1, 'rgba(120,200,255,0)');
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(cx, cy, p.w, 0, TAU); ctx.fill();
    } else {
      const g = ctx.createRadialGradient(cx - 7, cy - 9, 3, cx, cy, p.w * 0.85);
      g.addColorStop(0, '#8d6240');
      g.addColorStop(0.6, '#4a3320');
      g.addColorStop(1, '#211710');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, p.w / 2, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#120c08'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, p.w / 2 - 3, 0, TAU); ctx.clip();
      ctx.fillStyle = 'rgba(255,185,60,0.8)';
      for (let i = -2; i <= 2; i++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(0.6);
        ctx.fillRect(-p.w, i * 9, p.w * 2, 3);
        ctx.restore();
      }
      ctx.restore();
      const blink = 0.55 + 0.45 * Math.sin(Game.time * 6);
      ctx.globalAlpha = blink;
      ctx.fillStyle = '#ff9a3c';
      ctx.beginPath(); ctx.arc(cx, cy, 3.4, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (hurt > 0.25) {
      ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(p.x + p.w * 0.3, p.y + 4);
      ctx.lineTo(p.x + p.w * 0.46, p.y + p.h * 0.5);
      ctx.lineTo(p.x + p.w * 0.32, p.y + p.h - 4);
      ctx.stroke();
    }
    if (p.flash > 0.02) {
      ctx.globalAlpha = p.flash * 0.5;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.globalAlpha = 1;
    }
  }
}

function drawMines() {
  for (const m of Game.mines) {
    const arming = m.arm > 0;
    const pulse = arming ? 0.4 : (0.55 + 0.45 * Math.sin(m.blink));
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(m.x, m.y + 6, 14, 6, 0, 0, TAU);
    ctx.fill();

    const g = ctx.createRadialGradient(m.x - 3, m.y - 3, 1, m.x, m.y, 14);
    g.addColorStop(0, '#59636e');
    g.addColorStop(1, '#1b2128');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(m.x, m.y, 12, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#0a0e12';
    ctx.lineWidth = 2;
    ctx.stroke();

    const lc = arming ? '120,200,255' : '255,80,80';
    ctx.fillStyle = 'rgba(' + lc + ',' + pulse.toFixed(2) + ')';
    ctx.beginPath();
    ctx.arc(m.x, m.y, 4, 0, TAU);
    ctx.fill();
    const halo = ctx.createRadialGradient(m.x, m.y, 1, m.x, m.y, 26);
    halo.addColorStop(0, 'rgba(' + lc + ',' + (0.35 * pulse).toFixed(2) + ')');
    halo.addColorStop(1, 'rgba(' + lc + ',0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(m.x, m.y, 26, 0, TAU);
    ctx.fill();

    if (arming) {
      ctx.strokeStyle = 'rgba(120,200,255,0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(m.x, m.y, 12 + (1.1 - m.arm) * 22, 0, TAU);
      ctx.stroke();
    } else if (m.life < 3) {
      ctx.strokeStyle = 'rgba(255,80,80,' + (0.4 + 0.4 * Math.sin(m.blink * 2)).toFixed(2) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(m.x, m.y, 44, 0, TAU);
      ctx.stroke();
    }
  }
}

function drawGibs() {
  for (const g of Game.gibs) {
    const a = clamp(g.life / g.max, 0, 1);
    ctx.globalAlpha = a;
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(g.rot);
    const w = g.sw * g.scale, h = g.sh * g.scale;
    ctx.drawImage(g.spr.img, g.sx, g.sy, g.sw, g.sh, -w / 2, -h / 2, w, h);
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

function lightBlob(x, y, r, col, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, 'rgba(' + col + ',' + a.toFixed(3) + ')');
  g.addColorStop(0.45, 'rgba(' + col + ',' + (a * 0.38).toFixed(3) + ')');
  g.addColorStop(1, 'rgba(' + col + ',0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

function drawLights() {
  if (!Settings.quality) return;
  ctx.globalCompositeOperation = 'lighter';
  const p = Game.player;
  if (p) lightBlob(p.x, p.y, 92, '80,220,255', 0.16);
  for (const l of Game.lights) {
    lightBlob(l.x, l.y, l.r, l.col, (l.a || 0.35) * clamp(l.life / l.max, 0, 1));
  }
  ctx.globalCompositeOperation = 'source-over';
}

function drawJoystick() {
  const j = Input.joy;
  if (!j.active) return;
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = '#4ff0ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(j.ox, j.oy, Settings.joy, 0, TAU);
  ctx.stroke();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = 'rgba(79,240,255,0.55)';
  ctx.beginPath();
  ctx.arc(j.ox + j.dx * j.mag * Settings.joy, j.oy + j.dy * j.mag * Settings.joy, Settings.joy * 0.38, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
}

Game.draw = function () {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, VW, VH);
  if (!this.room || !this.player || this.state === 'menu') {
    drawMenuScene(performance.now());
    return;
  }
  const sh = this.cam.shake;
  const sx = sh ? rand(-sh, sh) : 0, sy = sh ? rand(-sh, sh) : 0;
  ctx.save();
  ctx.translate(-Math.round(this.cam.x + sx), -Math.round(this.cam.y + sy));
  drawBackground();
  drawIceFloor();
  drawSplats();
  drawAcid();
  drawDoor();
  drawProps();
  drawMines();
  drawPickups();
  const vx0 = this.cam.x - 90, vx1 = this.cam.x + VW + 90;
  const vy0 = this.cam.y - 120, vy1 = this.cam.y + VH + 120;
  for (const e of this.enemies) {
    if (e.x < vx0 || e.x > vx1 || e.y < vy0 || e.y > vy1) continue;
    drawEnemy(e);
  }
  drawBullets();
  if (this.player) drawPlayer();
  drawDrone();
  drawGibs();
  drawParticles();
  drawTexts();
  drawLights();
  ctx.restore();

  if (this.hurtFlash > 0.01) {
    const hg = ctx.createRadialGradient(VW / 2, VH / 2, Math.min(VW, VH) * 0.22, VW / 2, VH / 2, Math.max(VW, VH) * 0.72);
    hg.addColorStop(0, 'rgba(255,40,80,0)');
    hg.addColorStop(1, 'rgba(255,40,80,' + (0.34 * this.hurtFlash).toFixed(3) + ')');
    ctx.fillStyle = hg;
    ctx.fillRect(0, 0, VW, VH);
  }

  if (this.room.mod && this.room.mod.id === 'dark' && this.player) {
    const pl = this.player;
    const px = pl.x - this.cam.x, py = pl.y - this.cam.y;
    const reach = 460;
    // затемнение рисуем на отдельном слое, чтобы не стирать саму сцену
    const mask = getDarkLayer();
    const mc = mask.ctx;
    mc.setTransform(1, 0, 0, 1, 0, 0);
    mc.clearRect(0, 0, mask.cv.width, mask.cv.height);
    mc.setTransform(mask.dpr, 0, 0, mask.dpr, 0, 0);
    // не «наступившая темнота», а фонарь по направлению ствола: видно, что впереди,
    // и без провала в абсолютный чёрный по краям
    mc.fillStyle = 'rgba(3,6,14,0.72)';
    mc.fillRect(0, 0, VW, VH);
    mc.globalCompositeOperation = 'destination-out';

    // конус по направлению прицела
    const half = 0.62, rays = Settings.quality ? 110 : 70;
    const poly = flashlightPoly(pl.x, pl.y, pl.aim, half, reach, rays);
    mc.beginPath();
    mc.moveTo(px, py);
    for (let i = 0; i < poly.length; i++) {
      mc.lineTo(poly[i][0] - this.cam.x, poly[i][1] - this.cam.y);
    }
    mc.closePath();
    const lg = mc.createRadialGradient(px, py, 30, px, py, reach);
    lg.addColorStop(0, 'rgba(0,0,0,1)');
    lg.addColorStop(0.74, 'rgba(0,0,0,1)');
    lg.addColorStop(0.92, 'rgba(0,0,0,0.5)');
    lg.addColorStop(1, 'rgba(0,0,0,0)');
    mc.fillStyle = lg;
    mc.fill();

    // мягкий круг вокруг героя, чтобы он сам не тонул
    const rg2 = mc.createRadialGradient(px, py, 0, px, py, 150);
    rg2.addColorStop(0, 'rgba(0,0,0,0.92)');
    rg2.addColorStop(0.55, 'rgba(0,0,0,0.55)');
    rg2.addColorStop(1, 'rgba(0,0,0,0)');
    mc.fillStyle = rg2;
    mc.beginPath();
    mc.arc(px, py, 150, 0, TAU);
    mc.fill();
    mc.globalCompositeOperation = 'source-over';
    ctx.drawImage(mask.cv, 0, 0, VW, VH);
    // тёплый отблеск от шлема
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const warm = ctx.createRadialGradient(px, py, 10, px, py, 190);
    warm.addColorStop(0, 'rgba(90,190,220,0.16)');
    warm.addColorStop(1, 'rgba(90,190,220,0)');
    ctx.fillStyle = warm;
    ctx.beginPath(); ctx.arc(px, py, 190, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // vignette
  const vg = ctx.createRadialGradient(VW / 2, VH / 2, Math.min(VW, VH) * 0.35, VW / 2, VH / 2, Math.max(VW, VH) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, VW, VH);
  drawJoystick();
};

/* ---------------- input wiring ---------------- */
function ptr(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

canvas.addEventListener('pointerdown', e => {
  Input.lastTouch = performance.now();
  if (Game.state !== 'playing') return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const p = ptr(e);
  const j = Input.joy;
  j.active = true; j.id = e.pointerId; j.ox = p.x; j.oy = p.y; j.dx = 0; j.dy = 0; j.mag = 0;
  try { canvas.setPointerCapture(e.pointerId); } catch (err) {}   // в WebView бывает нет активного указателя
  e.preventDefault();
});

canvas.addEventListener('pointermove', e => {
  Input.lastTouch = performance.now();
  const j = Input.joy;
  if (!j.active || e.pointerId !== j.id) return;
  const p = ptr(e);
  let dx = p.x - j.ox, dy = p.y - j.oy;
  const d = Math.hypot(dx, dy);
  const R = Settings.joy * 1.35;
  if (d > 0.001) { dx /= d; dy /= d; }
  j.dx = dx; j.dy = dy;
  j.mag = clamp(d / R, 0, 1);
  e.preventDefault();
});

function endPtr(e) {
  const j = Input.joy;
  if (j.id === null || e.pointerId === j.id) {
    j.active = false; j.id = null; j.mag = 0; j.dx = 0; j.dy = 0;
  }
}
window.addEventListener('pointerup', endPtr);
window.addEventListener('pointercancel', endPtr);
canvas.addEventListener('pointerup', endPtr);
canvas.addEventListener('pointercancel', endPtr);

// iOS/Telegram: контекст надо разблокировать живым жестом, и не один раз
function unlockAudio() {
  try {
    Sfx.init();
    const c = Sfx.ctx;
    if (!c) return;
    if (c.state !== 'running' && c.resume) c.resume();
    if (c.state === 'running' && !Sfx._unlocked) {
      Sfx._unlocked = true;
      const b = c.createBuffer(1, 1, 22050);
      const s = c.createBufferSource();
      s.buffer = b; s.connect(c.destination); s.start(0);
      Sfx.load();
    }
  } catch (e) {}
}
['pointerdown', 'pointerup', 'touchend', 'keydown'].forEach(ev =>
  window.addEventListener(ev, unlockAudio, { passive: true }));

window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  Input.keys[k] = true;
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].indexOf(k) >= 0) e.preventDefault();
  if (e.key === 'q' || e.key === 'tab') {
    if (Game.state === 'playing') Game.switchWeapon(1);
    e.preventDefault();
  }
  if (e.key === 'escape' || e.key === 'p') {
    if (Game.state === 'playing') Game.pause();
    else if (Game.state === 'pause') Game.resume();
  }
});
window.addEventListener('keyup', e => { Input.keys[e.key.toLowerCase()] = false; });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { Input.reset(); if (Game.state === 'playing') Game.pause(); }
  else Input.reset();              // вернулись в WebView — старый палец уже не наш
});
window.addEventListener('blur', () => Input.reset());
window.addEventListener('pageshow', () => Input.reset());

// Любой драг вне прокручиваемых экранов не должен тянуть страницу/окно.
document.addEventListener('touchmove', e => {
  const sc = e.target && e.target.closest ? e.target.closest('.screen') : null;
  if (!sc) { e.preventDefault(); return; }
  if (sc.scrollHeight <= sc.clientHeight + 2) e.preventDefault();
}, { passive: false });

document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });

function lockViewport() {
  if (window.scrollX || window.scrollY) window.scrollTo(0, 0);
}
window.addEventListener('scroll', lockViewport, { passive: true });
window.addEventListener('resize', () => { resize(); lockViewport(); });
window.addEventListener('orientationchange', () => setTimeout(resize, 120));

/* ---------------- boot ---------------- */
let errHideT = null;
window.addEventListener('error', ev => {
  window.__errs = window.__errs || [];
  window.__errs.push(String(ev.message || 'script'));
  if (window.__errs.length > 20) window.__errs.shift();
  // «Script error.» — кросс-доменный шум (SDK/вебвью), не наш баг и не должен висеть на экране
  if (!ev.message || /^script error\.?$/i.test(ev.message)) return;
  const t = document.getElementById('toast');
  if (!t) return;
  t.style.opacity = '1';
  t.textContent = 'ОШИБКА: ' + ev.message;
  if (errHideT) clearTimeout(errHideT);
  errHideT = setTimeout(() => { t.style.opacity = '0'; }, 4000);
});

let lastT = performance.now();
let fpsT = 0, fpsN = 0;
Game.fps = 0;

function loop(now) {
  const dt = Math.min(0.045, Math.max(0, (now - lastT) / 1000));
  lastT = now;
  Game.time += (Game.state === 'playing' ? 0 : dt);
  Input.touchTick();
  Game.update(dt);
  Game.draw();
  UI.updateHud(false);
  fpsT += dt; fpsN++;
  if (fpsT > 0.5) { Game.fps = Math.round(fpsN / fpsT); fpsT = 0; fpsN = 0; }
  requestAnimationFrame(loop);
}

function tgInit() {
  const tg = window.Telegram && window.Telegram.WebApp;
  if (!tg) return;
  try {
    if (tg.setHeaderColor) tg.setHeaderColor('#05060f');
    if (tg.setBackgroundColor) tg.setBackgroundColor('#05060f');
    tg.ready();
    tg.expand();
    if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();
    if (tg.enableClosingConfirmation) tg.enableClosingConfirmation();
  } catch (e) {}
}

tgInit();
Sprites.init();
resize();
loadSettings();
applyQuality();
UI.init();
UI.showScreen('screen-menu');
UI.showHud(false);
try { Cloud.init(() => { UI.refreshMenu(); UI.syncSettings(); }); } catch (e) {}
requestAnimationFrame(loop);
