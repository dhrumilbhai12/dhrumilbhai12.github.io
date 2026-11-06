/* Backyard Blasters - Phase 2
   Plain Canvas 2D, no external libraries. Original art & code.
   P2: rebalanced economy, 3 maps x 5 rounds with bosses, weapon merge, power shot, shop (characters + guns), WebAudio SFX. */
(() => {
'use strict';
const VH = 720;
const SAVE_KEY = 'bb_save_v2', OLD_KEY = 'bb_save_v1', SAVE_VER = 2;
const FONT = "'Lilita', 'Arial Black', sans-serif";
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
let W = 1280, K = 1, DPR = 1;

// ---------- assets ----------
const IMG = {};
const SRC = {
  bg: 'assets/bg_backyard.webp', bg_kitchen: 'assets/p2/bg_kitchen.webp', bg_toyroom: 'assets/p2/bg_toyroom.webp',
  crate: 'assets/crate.png', pot: 'assets/pot.png', gnome: 'assets/gnome.png', barrel: 'assets/p2/barrel.webp',
  robot: 'assets/p2/robot.webp', robot_body: 'assets/p2/robot_body.webp', robot_legF: 'assets/p2/robot_legF.webp', robot_legB: 'assets/p2/robot_legB.webp',
  boss_gnome: 'assets/p2/boss_gnome.webp', boss_blender: 'assets/p2/boss_blender.webp', boss_mech: 'assets/p2/boss_mech.webp',
  buddy: 'assets/p2/buddy.webp',
  char_zip: 'assets/p2/char_zip.webp', char_bruno: 'assets/p2/char_bruno.webp', char_luma: 'assets/p2/char_luma.webp', char_penny: 'assets/p2/char_penny.webp', char_kip: 'assets/p2/char_kip.webp',
  gun1: 'assets/p2/gun1.webp', gun2: 'assets/p2/gun2.webp', gun3: 'assets/p2/gun3.webp', gun4: 'assets/p2/gun4.webp', gun5: 'assets/p2/gun5.webp',
  head: 'assets/hero/head.png', head_blink: 'assets/hero/head_blink.png', torso: 'assets/hero/torso.png',
  arm: 'assets/hero/arm.png', legL: 'assets/hero/legL.png', legR: 'assets/hero/legR.png', hero: 'assets/hero.png'
};
function loadAll() {
  const ps = Object.entries(SRC).map(([k, s]) => new Promise(res => {
    const i = new Image(); i.onload = () => { IMG[k] = i; res(); }; i.onerror = () => { console.warn('missing', s); res(); }; i.src = s;
  }));
  if (document.fonts && document.fonts.load) ps.push(document.fonts.load('40px Lilita').catch(() => {}));
  return Promise.all(ps);
}

// ---------- helpers ----------
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
function fmt(n) {
  n = Math.floor(n);
  if (n < 1000) return '' + n;
  const u = ['K', 'M', 'B', 'T', 'aa', 'ab', 'ac', 'ad', 'ae', 'af'];
  let i = -1; let v = n;
  while (v >= 1000 && i < u.length - 1) { v /= 1000; i++; }
  return (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)).replace(/\.0+$|(\.\d*?)0+$/, '$1') + u[i];
}
function rrect(x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function text(s, x, y, size, fill = '#fff', align = 'center', stroke = '#2b2018', sw = 0) {
  ctx.font = `${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = sw || Math.max(3, size * 0.16); ctx.strokeStyle = stroke;
  ctx.strokeText(s, x, y); ctx.fillStyle = fill; ctx.fillText(s, x, y);
}
function silhouette(img, col = '#fff') {
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-atop';
  g.fillStyle = col; g.fillRect(0, 0, c.width, c.height); return c;
}
let COIN, GEM;
function makeCoin() {
  const s = 64, c = document.createElement('canvas'); c.width = c.height = s; const g = c.getContext('2d');
  g.fillStyle = '#7a4a05'; g.beginPath(); g.arc(32, 32, 31, 0, 7); g.fill();
  g.fillStyle = '#f6b81c'; g.beginPath(); g.arc(32, 32, 27, 0, 7); g.fill();
  g.fillStyle = '#ffd94a'; g.beginPath(); g.arc(32, 30, 22, 0, 7); g.fill();
  g.strokeStyle = '#c98a0b'; g.lineWidth = 5; g.beginPath(); g.arc(32, 32, 12, 0.7, 5.6); g.stroke();
  g.fillStyle = '#fff8'; g.beginPath(); g.ellipse(24, 20, 7, 4, -0.6, 0, 7); g.fill();
  COIN = c;
  const d = document.createElement('canvas'); d.width = d.height = s; const h = d.getContext('2d');
  h.lineJoin = 'round';
  const P = [[32, 4], [58, 24], [32, 60], [6, 24]];
  h.fillStyle = '#1d2433'; h.beginPath(); P.forEach(([x, y]) => h.lineTo(x, y)); h.closePath(); h.fill();
  h.fillStyle = '#3fd0e8'; h.beginPath(); [[32, 9], [52, 24], [32, 53], [12, 24]].forEach(([x, y]) => h.lineTo(x, y)); h.closePath(); h.fill();
  h.fillStyle = '#9ff0ff'; h.beginPath(); [[32, 9], [52, 24], [32, 24], [12, 24]].forEach(([x, y]) => h.lineTo(x, y)); h.closePath(); h.fill();
  h.fillStyle = '#fff'; h.beginPath(); h.ellipse(24, 18, 5, 3, -0.5, 0, 7); h.fill();
  GEM = d;
}

// ---------- audio (tiny WebAudio synth, original) ----------
let AC = null, lastShootSfx = 0;
function audioUnlock() { if (AC) { if (AC.state === 'suspended') AC.resume(); return; } try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
function tone(f0, f1, dur, type = 'square', vol = 0.08, noise = false) {
  if (!AC || S.mute) return;
  const t = AC.currentTime, g = AC.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur); g.connect(AC.destination);
  if (noise) {
    const n = Math.floor(AC.sampleRate * dur), b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = AC.createBufferSource(); s.buffer = b; const fl = AC.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
    s.connect(fl); fl.connect(g); s.start(t); s.stop(t + dur);
  } else {
    const o = AC.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); o.connect(g); o.start(t); o.stop(t + dur);
  }
}
const SFX = {
  shoot() { const n = performance.now(); if (n - lastShootSfx < 90) return; lastShootSfx = n; tone(900, 300, 0.06, 'square', 0.025); },
  hit() { tone(2400, 600, 0.05, 'noise', 0.04, true); },
  brk() { tone(1800, 120, 0.22, 'noise', 0.09, true); },
  coin() { tone(1300, 1900, 0.07, 'triangle', 0.04); },
  buy() { tone(600, 1200, 0.12, 'triangle', 0.07); },
  merge() { tone(500, 1500, 0.25, 'triangle', 0.09); setTimeout(() => tone(900, 2200, 0.2, 'triangle', 0.07), 90); },
  boom() { tone(900, 40, 0.6, 'noise', 0.2, true); tone(120, 30, 0.5, 'sine', 0.2); },
  hurt() { tone(300, 90, 0.25, 'sawtooth', 0.08); },
  win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, f, 0.18, 'triangle', 0.08), i * 110)); },
  fail() { [392, 330, 262].forEach((f, i) => setTimeout(() => tone(f, f * 0.98, 0.25, 'triangle', 0.08), i * 160)); }
};

// ---------- data ----------
const MAPS = [
  { name: 'Backyard', bg: 'bg', pool: ['crate', 'pot', 'gnome', 'barrel', 'crate'], boss: 'boss_gnome', bossName: 'Gnome King', fg: 'grass' },
  { name: 'Kitchen', bg: 'bg_kitchen', pool: ['barrel', 'crate', 'pot', 'robot', 'barrel'], boss: 'boss_blender', bossName: 'Blender Bot', fg: 'crumbs' },
  { name: 'Toy Room', bg: 'bg_toyroom', pool: ['robot', 'barrel', 'crate', 'robot', 'pot'], boss: 'boss_mech', bossName: 'Toy Mech X', fg: 'blocks' }
];
const BLASTERS = [ // merge levels 1..12: name, main, accent
  ['Pop Blaster', '#f07a1e', '#ffd23c'], ['Splat Shot', '#4cbf34', '#d8f56a'], ['Bubble Gun', '#3a9af0', '#9fe3ff'],
  ['Grape Zapper', '#8e5ae8', '#e0b6ff'], ['Tomato Cannon', '#e53b3b', '#ffb03a'], ['Bubblegum Blaster', '#ff5fae', '#ffe0f0'],
  ['Mint Repeater', '#1fb8a6', '#b6fff0'], ['Golden Popper', '#e0a00c', '#fff1a0'], ['Chrome Blaster', '#8f9bb0', '#f2f6fa'],
  ['Night Striker', '#3b4a8a', '#ff8a3a'], ['Lava Launcher', '#b8261a', '#ffcf3a'], ['Prism Blaster', '#2ec4f0', '#ff7ad9']
];
const MAXW = BLASTERS.length;
// shop: characters & guns (original names). stat mods: dmg, rate, crit (abs chance), critX, coin, power (charge time mul), hp
const CHARS = [
  { id: 'specs', name: 'Specs', desc: 'The original backyard hero', img: null, price: 0, cur: 'c', mods: {}, stat: 'Balanced' },
  { id: 'zip', name: 'Zip Quickstep', desc: 'Lightning trigger finger', img: 'char_zip', price: 6000, cur: 'c', mods: { rate: 1.35, dmg: 0.9 }, stat: '+35% fire rate', muz: [0.97, 0.43] },
  { id: 'bruno', name: 'Bruno Brickfist', desc: 'Big kid, bigger hits', img: 'char_bruno', price: 30000, cur: 'c', mods: { dmg: 1.45, rate: 0.85 }, stat: '+45% damage', muz: [0.99, 0.49] },
  { id: 'luma', name: 'Luma Lucky', desc: 'Never misses a lucky shot', img: 'char_luma', price: 40, cur: 'g', mods: { crit: 0.25, critX: 3.5 }, stat: '25% crit, x3.5', muz: [0.98, 0.44] },
  { id: 'penny', name: 'Penny Goldpocket', desc: 'Finds coins everywhere', img: 'char_penny', price: 70, cur: 'g', mods: { coin: 1.6 }, stat: '+60% coins', muz: [0.98, 0.41] },
  { id: 'kip', name: 'Sir Kip Potshield', desc: 'Cardboard knight of the yard', img: 'char_kip', price: 130, cur: 'g', mods: { dmg: 1.2, rate: 1.2, coin: 1.2, hp: 1.5 }, stat: '+20% all, +50% HP', muz: [0.98, 0.48] }
];
const GUNS = [
  { id: 'none', name: 'Starter Grip', img: null, price: 0, cur: 'c', mods: {}, stat: 'No bonus', col: '#ffd23c' },
  { id: 'fizz', name: 'Fizzbang Repeater', img: 'gun1', price: 9000, cur: 'c', mods: { rate: 1.4 }, stat: '+40% fire rate', col: '#56b4ff' },
  { id: 'thunder', name: 'Thunderpop Cannon', img: 'gun2', price: 45000, cur: 'c', mods: { dmg: 1.6, rate: 0.8 }, stat: '+60% dmg, -20% rate', col: '#ff5a4a' },
  { id: 'clover', name: 'Clover Zapper', img: 'gun3', price: 50, cur: 'g', mods: { crit: 0.15 }, stat: '+15% crit chance', col: '#8df05a' },
  { id: 'goldrush', name: 'Goldrush Popper', img: 'gun4', price: 90, cur: 'g', mods: { coin: 1.4, dmg: 1.1 }, stat: '+40% coins, +10% dmg', col: '#ffe14a' },
  { id: 'comet', name: 'Comet Crusher', img: 'gun5', price: 160, cur: 'g', mods: { dmg: 1.5, power: 0.7 }, stat: '+50% dmg, faster Power', col: '#ff9a3a' }
];

// ---------- save / state ----------
const S = { v: SAVE_VER, coins: 0, gems: 0, atkL: 0, spdL: 0, coinL: 0, g: 0, kills: 0, farm: false, tut: 0, last: Date.now(), totalKills: 0,
  wbuys: 0, inv: [1, 0, 0, 0, 0, 0, 0, 0], mute: false, ch: 'specs', gun: 'none', ownCh: ['specs'], ownGun: ['none'], bossWins: 0 };
let toastMsg = '', toastT = 0;
function toast(m, t = 3.5) { toastMsg = m; toastT = t; }
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (d) { Object.assign(S, d); return; }
    const o = JSON.parse(localStorage.getItem(OLD_KEY));
    if (o) { // migrate + rebalance Phase 1 save
      const oldG = ((o.stage || 1) - 1) * 5 + ((o.sub || 1) - 1);
      S.g = oldG >= 5 ? 5 : Math.min(oldG, 3);
      S.atkL = Math.min(o.atkL || 0, 8); S.spdL = Math.min(o.spdL || 0, 4); S.coinL = Math.min(o.coinL || 0, 2);
      S.coins = Math.min(o.coins || 0, 800); S.tut = 1; S.totalKills = o.totalKills || 0;
      if (oldG >= 5) S.inv[1] = 2;
      localStorage.removeItem(OLD_KEY);
      toast('Game updated - progress rebalanced', 5);
    }
  } catch (e) {}
  // sanity clamp for any corrupted / old-economy values
  if (!isFinite(S.coins) || S.coins > 1e15) { S.coins = 800; toast('Game updated - progress rebalanced', 5); }
  if (!Array.isArray(S.inv) || S.inv.length !== 8) S.inv = [1, 0, 0, 0, 0, 0, 0, 0];
}
let NOSAVE = false;
function save() { if (NOSAVE) return; S.last = Date.now(); try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
setInterval(save, 3000);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
window.addEventListener('pagehide', save);

// ---------- economy (see PHASES.md "Balance") ----------
const PER_SUB = 10, BOSS_HP = 33, BOSS_TIME = 35;
const disc = L => 0.1 + 0.9 * Math.min(1, L / 10);
const atkVal = L => Math.round(5 * Math.pow(1.12, L) + L);
const rateVal = L => Math.min(10, 2 + 0.12 * L);
const coinMul = L => 1 + 0.3 * Math.pow(L, 0.75);
const wMul = lv => Math.pow(1.35, lv - 1);
const hpAt = g => 14 * Math.pow(1.174, g) * Math.pow(1.397, Math.floor(g / 5));
const rwAt = g => Math.pow(1.225, g);
const UPG = [
  { key: 'atkL', name: 'Attack', cost: L => Math.ceil(340 * Math.pow(1.165, L) * disc(L)), val: L => fmt(atkVal(L)) + ' dmg', icon: 'sword', col: '#e8524a' },
  { key: 'spdL', name: 'Speed', cost: L => Math.ceil(680 * Math.pow(1.22, L) * disc(L)), val: L => rateVal(L).toFixed(2).replace(/0$/, '') + '/s', icon: 'bolt', col: '#3e8ef0', max: 67 },
  { key: 'coinL', name: 'Coins', cost: L => Math.ceil(1360 * Math.pow(1.3, L) * disc(L)), val: L => 'x' + coinMul(L).toFixed(2), icon: 'coin', col: '#f3b322' }
];
const wBuyCost = () => Math.ceil(400 * Math.pow(1.18, S.wbuys) * disc(S.wbuys));
const bestW = () => Math.max(1, ...S.inv);
const curChar = () => CHARS.find(c => c.id === S.ch) || CHARS[0];
const curGun = () => GUNS.find(c => c.id === S.gun) || GUNS[0];
function mod(k, def = 1) { const a = curChar().mods[k], b = curGun().mods[k]; if (k === 'crit') return (a || 0) + (b || 0); return (a === undefined ? def : a) * (b === undefined ? def : b); }
const shotDmg = () => atkVal(S.atkL) * wMul(bestW()) * mod('dmg');
const fireRate = () => rateVal(S.spdL) * mod('rate');
const critChance = () => 0.1 + mod('crit');
const critX = () => curChar().mods.critX || 3;
const coinBonus = () => coinMul(S.coinL) * mod('coin');
const POWER_T = () => 18 * mod('power');

const mapIdx = () => Math.floor(S.g / 5) % 3;
const world = () => Math.floor(S.g / 15) + 1;
const round = () => S.g % 5 + 1;
const isBossRound = () => S.g % 5 === 4;
const playG = () => S.farm ? S.g - 1 : S.g;
const TYPES = {
  crate: { hpM: 1.0, h: 150, waddle: 0, debris: ['#a8672e', '#7a4518', '#d99a55'] },
  pot: { hpM: 0.75, h: 140, waddle: 0, debris: ['#c9643a', '#8f3f1e', '#5aa83c', '#4c8be0'] },
  gnome: { hpM: 1.35, h: 172, waddle: 1, debris: ['#d8322d', '#3a72c9', '#fff', '#6b4423'] },
  barrel: { hpM: 1.15, h: 158, waddle: 0, debris: ['#b36a2c', '#7a4518', '#9aa6b8'] },
  robot: { hpM: 1.5, h: 185, waddle: 0, robot: 1, debris: ['#d8402e', '#c2c9d4', '#e8b74a', '#5a6270'] }
};

// ---------- world ----------
let groundY = 576, heroX = 220;
let scene = 'title';
let time = 0, last = performance.now();
let targets = [], bullets = [], parts = [], coins = [], floats = [], shells = [], projs = [];
let spawnQueue = 0, spawnTimer = 0;
let phase = 'fight', phaseT = 0;
let bgX = 0, bgCanvas = null, bgTileW = 0, bgKey = '';
let autoT = 0, manualT = 0, buddyT = 0;
let hold = null;
let coinShown = 0, coinPulse = 0, gemPulse = 0;
let btnPop = [0, 0, 0, 0, 0, 0];
let tutT = 0, shake = 0, hitStop = 0, fade = 0, fadeDir = 0;
let boss = null, power = 0, skipInc = false;
let popup = null; // 'weapons' | 'shop'
let shopTab = 'ch', drag = null, selSlot = -1;

function layout() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  if (innerWidth * innerHeight * DPR * DPR > 2600000) DPR = Math.sqrt(2600000 / (innerWidth * innerHeight));
  cv.width = Math.round(innerWidth * DPR); cv.height = Math.round(innerHeight * DPR);
  K = cv.height / VH; W = cv.width / K;
  groundY = VH * 0.80; heroX = Math.max(170, W * 0.15);
  bgKey = ''; buildBg();
  targets.forEach((t, i) => { if (!t.boss) t.slotX = slotX(i); });
}
function buildBg() {
  const key = MAPS[mapIdx()].bg; if (key === bgKey && bgCanvas) return;
  const img = IMG[key] || IMG.bg; if (!img) return;
  bgKey = key;
  const s = VH / img.height; const tw = Math.ceil(img.width * s);
  bgTileW = tw;
  const c = bgCanvas && bgCanvas.width === Math.ceil(tw * 2 * K) ? bgCanvas : document.createElement('canvas');
  c.width = Math.ceil(tw * 2 * K); c.height = Math.ceil(VH * K);
  const g = c.getContext('2d'); g.setTransform(K, 0, 0, K, 0, 0);
  g.drawImage(img, 0, 0, tw, VH);
  g.save(); g.translate(tw * 2, 0); g.scale(-1, 1); g.drawImage(img, 0, 0, tw, VH); g.restore();
  bgCanvas = c;
}
function drawBg() {
  if (!bgCanvas) { ctx.fillStyle = '#7cc8f2'; ctx.fillRect(0, 0, W, VH); return; }
  const period = bgTileW * 2; let x = -(bgX % period);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (; x < W; x += period) ctx.drawImage(bgCanvas, Math.floor(x * K + shakeX() * K), Math.floor(shakeY() * K));
  ctx.restore();
  drawFar();
}
// parallax layer 0: drifting clouds / dust motes (slow); layer 2: foreground props (fast)
function drawFar() {
  const m = MAPS[mapIdx()].fg;
  if (m === 'grass') {
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 4; i++) { const x = ((i * 420 - bgX * 0.15 - time * 8) % (W + 300) + W + 300) % (W + 300) - 150, y = 70 + i % 2 * 60;
      ctx.beginPath(); ctx.ellipse(x, y, 60, 18, 0, 0, 7); ctx.ellipse(x + 30, y - 12, 34, 20, 0, 0, 7); ctx.ellipse(x - 28, y - 6, 28, 16, 0, 0, 7); ctx.fill(); }
  } else {
    ctx.fillStyle = 'rgba(255,248,220,0.5)';
    for (let i = 0; i < 14; i++) { const x = ((i * 137 - bgX * 0.25) % W + W) % W, y = 120 + (i * 53) % 300 + Math.sin(time + i) * 10; ctx.beginPath(); ctx.arc(x, y, 2 + i % 3, 0, 7); ctx.fill(); }
  }
}
function drawFg() {
  const m = MAPS[mapIdx()].fg, sp = 1.35, per = 260, off = (bgX * sp) % per;
  ctx.lineWidth = 3; ctx.strokeStyle = '#2b2018'; ctx.lineJoin = 'round';
  for (let i = -1; i < W / per + 2; i++) {
    const x = i * per - off, k = (i + Math.floor(bgX * sp / per)) & 7, y = VH - 8;
    if (m === 'grass') {
      ctx.fillStyle = k % 2 ? '#4fae3a' : '#62c446';
      ctx.beginPath(); ctx.moveTo(x, y); for (let j = 0; j < 5; j++) { ctx.lineTo(x + j * 12 + 6, y - 26 - (j * 7 + k * 3) % 18); ctx.lineTo(x + j * 12 + 12, y); } ctx.closePath(); ctx.fill(); ctx.stroke();
      if (k % 3 === 0) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + 90, y - 30, 9, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffcf3a'; ctx.beginPath(); ctx.arc(x + 90, y - 30, 4, 0, 7); ctx.fill(); }
    } else if (m === 'crumbs') {
      ctx.fillStyle = k % 2 ? '#e8b46a' : '#d99a4a';
      ctx.beginPath(); ctx.ellipse(x + 40, y - 6, 14 + k, 8, 0.3, 0, 7); ctx.fill(); ctx.stroke();
      if (k % 3 === 0) { ctx.fillStyle = '#c9ced8'; rrect(x + 100, y - 14, 70, 12, 6); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(x + 180, y - 8, 18, 12, 0, 0, 7); ctx.fill(); ctx.stroke(); }
    } else {
      const cols = ['#e8524a', '#3e8ef0', '#ffc928', '#5fd03c'];
      ctx.fillStyle = cols[k % 4]; rrect(x + 30, y - 34, 34, 34, 5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff8'; ctx.fillRect(x + 36, y - 30, 10, 6);
      if (k % 2) { ctx.fillStyle = cols[(k + 1) % 4]; ctx.beginPath(); ctx.arc(x + 140, y - 10, 10, 0, 7); ctx.fill(); ctx.stroke(); }
    }
  }
}
const shakeX = () => shake > 0 ? Math.sin(time * 90) * shake * 14 : 0;
const shakeY = () => shake > 0 ? Math.cos(time * 77) * shake * 10 : 0;

// ---------- hero rig ----------
const RIG = { foot: [130, 478], neck: [150, 226], shoulder: [118, 298], muzzle: [327, 250], eject: [248, 226], hipL: [85, 400], hipR: [172, 400] };
const hero = { h: 240, recoil: 0, aim: 0, aimTarget: 0, blinkT: 2, blink: 0, flash: 0, walkT: 0, jump: 0, raise: 0, hurt: 0, hp: 100, maxHp: 100 };
function heroScale() { return hero.h / 480; }
function heroPose() {
  const t = time;
  const walking = phase === 'walk' && scene === 'game';
  const breath = Math.sin(t * 2.4);
  let bob = 0, legA = 0, legB = 0;
  if (walking) { const w = hero.walkT * 11; bob = -Math.abs(Math.sin(w)) * 7; legA = Math.sin(w) * 0.42; legB = -legA; }
  const r = hero.recoil, hu = hero.hurt;
  return {
    sx: 1 - breath * 0.006 + r * 0.02, sy: 1 + breath * 0.012 - r * 0.02,
    bodyDx: -r * 4 - hu * 16, bodyDy: bob - hero.jump,
    headDy: breath * 1.6 + (walking ? Math.sin(hero.walkT * 22) * 1.2 : 0), headRot: (walking ? Math.sin(hero.walkT * 11) * 0.03 : breath * 0.012 - r * 0.02) - hu * 0.22,
    armRot: hero.aim - r * 0.13 - hero.raise * 0.75 + (walking ? Math.sin(hero.walkT * 11) * 0.04 : 0) - hu * 0.3, armDx: -r * 12, armDy: r * 2,
    legA: legA + hu * 0.12, legB: legB - hu * 0.1
  };
}
function rigToWorld(px, py, viaArm) {
  const p = heroPose(), s = heroScale();
  if (curChar().img) { // single-sprite characters: muzzle from sprite metadata
    const c = curChar(), img = IMG[c.img], h = hero.h * 1.02, w = img ? img.width / img.height * h : h * 0.7;
    return [heroX - w * 0.45 + w * c.muz[0] + p.bodyDx * 0.5, groundY - h + h * c.muz[1] + p.bodyDy * 0.5 - hero.recoil * 2];
  }
  let x = px, y = py;
  if (viaArm) {
    const [ox, oy] = RIG.shoulder; const c = Math.cos(p.armRot), sn = Math.sin(p.armRot);
    const dx = x - ox, dy = y - oy; x = ox + dx * c - dy * sn + p.armDx; y = oy + dx * sn + dy * c + p.armDy;
  }
  x += p.bodyDx; y += p.bodyDy;
  return [heroX + (x - RIG.foot[0]) * s * p.sx, groundY + (y - RIG.foot[1]) * s * p.sy];
}
const RED = {};
function redOf(key, img) { if (!RED[key]) RED[key] = silhouette(img, '#ff3b2e'); return RED[key]; }
function part(img, pv, rot, dx, dy, key) {
  if (!img) return;
  ctx.save(); ctx.translate(pv[0] + dx, pv[1] + dy); if (rot) ctx.rotate(rot); ctx.drawImage(img, -pv[0], -pv[1]);
  if (hero.hurt > 0.05 && key) { ctx.globalAlpha = hero.hurt * 0.55; ctx.drawImage(redOf(key, img), -pv[0], -pv[1]); }
  ctx.restore();
}
// recoloured gun arm per merge level (keeps the rig; only the blaster pixels change colour)
const ARMS = {};
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function armFor(lv) {
  if (lv <= 1 || !IMG.arm) return IMG.arm;
  if (ARMS[lv]) return ARMS[lv];
  const src = IMG.arm, c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
  const g = c.getContext('2d'); g.drawImage(src, 0, 0);
  try {
    const d = g.getImageData(0, 0, c.width, c.height), p = d.data, main = hexRgb(BLASTERS[lv - 1][1]), acc = hexRgb(BLASTERS[lv - 1][2]);
    for (let y = 210; y < Math.min(c.height, 345); y++) for (let x = 170; x < c.width; x++) {
      const i = (y * c.width + x) * 4; if (p[i + 3] < 10) continue;
      const r = p[i], gg = p[i + 1], b = p[i + 2], mx = Math.max(r, gg, b), mn = Math.min(r, gg, b);
      if (mx < 90) continue; const sat = (mx - mn) / mx; if (sat < 0.6) continue;
      let hue = 0; if (mx === r) hue = 60 * (((gg - b) / (mx - mn)) % 6); else if (mx === gg) hue = 60 * ((b - r) / (mx - mn) + 2); else hue = 60 * ((r - gg) / (mx - mn) + 4);
      if (hue < 0) hue += 360; if (hue < 5 || hue > 65) continue;
      const col = hue > 38 ? acc : main, k = Math.min(1.15, mx / 235);
      p[i] = Math.min(255, col[0] * k); p[i + 1] = Math.min(255, col[1] * k); p[i + 2] = Math.min(255, col[2] * k);
    }
    g.putImageData(d, 0, 0);
  } catch (e) {}
  ARMS[lv] = c; return c;
}
function drawHero(x, y, h) {
  const p = heroPose();
  ctx.fillStyle = 'rgba(40,30,10,0.28)'; ctx.beginPath(); ctx.ellipse(x, y + 2, h * 0.27 * (1 - hero.jump / 200), h * 0.05, 0, 0, 7); ctx.fill();
  const c = curChar();
  if (c.img && IMG[c.img]) { // premium single-sprite characters: squash/stretch, recoil, bob, lean
    const img = IMG[c.img], hh = h * 1.02, w = img.width / img.height * hh;
    ctx.save(); ctx.translate(x + p.bodyDx * 0.5, y + p.bodyDy * 0.5); ctx.rotate((phase === 'walk' ? Math.sin(hero.walkT * 11) * 0.04 : 0) - hero.hurt * 0.12 - hero.recoil * 0.02);
    ctx.scale(p.sx, p.sy); ctx.drawImage(img, -w * 0.45, -hh, w, hh);
    if (hero.hurt > 0.05) { ctx.globalAlpha = hero.hurt * 0.55; ctx.drawImage(redOf(c.img, img), -w * 0.45, -hh, w, hh); }
    ctx.restore(); return;
  }
  const s = h / 480;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * p.sx, s * p.sy); ctx.translate(-RIG.foot[0], -RIG.foot[1]);
  ctx.translate(p.bodyDx, p.bodyDy);
  part(IMG.legL, RIG.hipL, p.legA, 0, 0, 'legL');
  part(IMG.legR, RIG.hipR, p.legB, 0, 0, 'legR');
  part(IMG.torso, RIG.neck, 0, 0, 0, 'torso');
  part(hero.blink > 0 ? IMG.head_blink : IMG.head, RIG.neck, p.headRot, 0, p.headDy, hero.blink > 0 ? 'hb' : 'head');
  const lv = bestW(); part(armFor(lv), RIG.shoulder, p.armRot, p.armDx, p.armDy, 'arm' + lv);
  ctx.restore();
}
function drawMuzzle() {
  if (hero.flash <= 0) return;
  const [mx, my] = rigToWorld(RIG.muzzle[0], RIG.muzzle[1], true);
  const a = curChar().img ? 0 : heroPose().armRot, sz = 26 + hero.flash * 30;
  ctx.save(); ctx.translate(mx + 6, my); ctx.rotate(a); ctx.globalAlpha = clamp(hero.flash * 1.6, 0, 1);
  ctx.fillStyle = '#ffe14a'; star(0, 0, sz, sz * 0.35, 7); ctx.fill();
  ctx.fillStyle = '#fff6c2'; star(0, 0, sz * 0.55, sz * 0.2, 7); ctx.fill();
  ctx.restore();
}
function star(x, y, R, r, n) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = i * Math.PI / n, rr = i % 2 ? r : R * (i === 0 ? 1.4 : 1); ctx.lineTo(x + Math.cos(a) * rr * (Math.abs(Math.cos(a)) * 0.6 + 0.4) * (Math.cos(a) > 0 ? 1.3 : 0.7), y + Math.sin(a) * rr * 0.8); }
  ctx.closePath();
}

// ---------- targets ----------
function slotX(i) { return W * 0.56 + i * Math.min(175, W * 0.135); }
const SIL = {};
function spawnTarget() {
  const g = playG(), M = MAPS[mapIdx()];
  const pool = S.g === 0 ? ['crate', 'pot', 'crate'] : M.pool;
  const type = pool[Math.floor(Math.random() * pool.length)];
  const T = TYPES[type], img = IMG[type];
  const hp = Math.ceil(hpAt(g) * T.hpM);
  const h = T.h, w = img ? img.width / img.height * h : h * 0.8;
  targets.push({ type, img, hp, maxHp: hp, h, w, x: W + w, slotX: slotX(targets.length), flash: 0, squash: 0, t: Math.random() * 6, moving: true, hpShown: hp,
    reward: rwAt(g) * T.hpM });
}
function spawnBoss() {
  const M = MAPS[mapIdx()], img = IMG[M.boss], h = M.boss === 'boss_mech' ? 380 : 350;
  const hp = Math.ceil(hpAt(S.g) * BOSS_HP);
  boss = { boss: 1, type: M.boss, img, name: M.bossName, hp, maxHp: hp, hpShown: hp, h, w: img ? img.width / img.height * h : h * 0.8, x: W + 300, slotX: W * 0.75,
    flash: 0, squash: 0, t: 0, moving: true, reward: rwAt(S.g) * 10, timer: BOSS_TIME, atkT: 2.2, wind: 0, n: 0 };
  targets.push(boss);
  hero.maxHp = Math.round(100 * (curChar().mods.hp || 1)); hero.hp = hero.maxHp;
  floats.push({ x: W / 2, y: VH * 0.36, vy: -10, life: 1.6, max: 1.6, txt: 'BOSS: ' + M.bossName.toUpperCase() + '!', banner: 1 });
  SFX.hurt();
}
function startSub() {
  targets = []; projs = []; boss = null;
  if (isBossRound() && !S.farm) { S.kills = 0; spawnQueue = 0; spawnBoss(); }
  else { spawnQueue = PER_SUB - S.kills; spawnTimer = 0.2; }
  phase = 'fight';
}
function damage(t, dmg, crit, hx, hy) {
  t.hp -= dmg; t.flash = 1; t.squash = crit ? 1 : 0.6;
  if (floats.length < 40) floats.push({ x: hx + rand(-14, 14), y: hy - 10, vy: -120, life: 0.8, txt: fmt(dmg), crit, max: 0.8 });
  if (crit) floats.push({ x: hx, y: hy - 50, vy: -70, life: 0.9, txt: 'CRIT!', crit: 2, max: 0.9 });
  if (t.hp <= 0) kill(t);
}
function burstCoins(x, y, total, n) {
  for (let k = 0; k < n; k++) coins.push({ x: x + rand(-20, 20), y, vx: rand(-160, 260), vy: -rand(380, 620), t: 0, val: total / n, spin: rand(0, 6), fly: false });
}
function kill(t) {
  const i = targets.indexOf(t); if (i < 0) return;
  targets.splice(i, 1);
  let j = 0; targets.forEach(o => { if (!o.boss) { o.slotX = slotX(j++); o.moving = true; } });
  const cols = t.boss ? 4 : 3, rows = t.boss ? 4 : 3, img = t.img;
  if (img) for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const pw = t.w / cols, ph = t.h / rows;
    parts.push({ img, sx: img.width / cols * c, sy: img.height / rows * r, sw: img.width / cols, sh: img.height / rows, w: pw, h: ph,
      x: t.x - t.w / 2 + pw * (c + 0.5), y: groundY - t.h + ph * (r + 0.5), vx: (c - 1) * rand(80, 260) + rand(60, 200), vy: -rand(250, 620) + r * 60,
      rot: 0, vr: rand(-9, 9), life: 1.4, bounced: 0 });
  }
  const dc = t.boss ? ['#ffe14a', '#ff8a3a', '#fff', '#8f9bb0'] : TYPES[t.type].debris;
  for (let k = 0; k < (t.boss ? 30 : 12); k++) parts.push({ col: dc[k % dc.length], w: rand(6, 16), h: rand(4, 10), x: t.x + rand(-t.w / 3, t.w / 3), y: groundY - t.h * rand(0.2, 0.8),
    vx: rand(-200, 420), vy: -rand(200, 600), rot: rand(0, 6), vr: rand(-14, 14), life: rand(0.7, 1.2), bounced: 0 });
  parts.push({ puff: 1, x: t.x, y: groundY - t.h * 0.45, r: t.h * 0.35, life: 0.35, max: 0.35 });
  SFX.brk();
  const total = Math.ceil(t.reward * coinBonus());
  burstCoins(t.x, groundY - t.h * 0.5, total, t.boss ? 16 : clamp(Math.round(3 + Math.log10(total + 1) * 1.5), 3, 8));
  S.totalKills++;
  if (t.boss) {
    boss = null; projs = []; shake = 1; hitStop = 0.15;
    const gems = 10 + (world() - 1) * 5; S.gems += gems; gemPulse = 1; S.bossWins++;
    floats.push({ x: W / 2, y: VH * 0.48, vy: -30, life: 1.8, max: 1.8, txt: '+' + gems + ' GEMS', crit: 2 });
    S.g++; S.kills = 0; skipInc = true; SFX.win();
    phase = 'victory'; phaseT = 0;
    floats.push({ x: W / 2, y: VH * 0.36, vy: -20, life: 1.6, max: 1.6, txt: 'BOSS DEFEATED!', banner: 1 });
    save(); return;
  }
  if (Math.random() < 0.035) { S.gems++; gemPulse = 1; floats.push({ x: t.x, y: groundY - t.h - 40, vy: -60, life: 1, max: 1, txt: '+1 gem', crit: 0 }); }
  S.kills++;
  if (S.kills >= PER_SUB && targets.length === 0 && spawnQueue <= 0) subCleared();
}
function subCleared() {
  phase = 'victory'; phaseT = 0;
  floats.push({ x: W / 2, y: VH * 0.36, vy: -20, life: 1.4, max: 1.4, txt: S.farm ? 'FARMED!' : 'CLEARED!', banner: 1 });
}
function nextSub() {
  S.kills = 0;
  const newMap = skipInc;
  if (!S.farm && !skipInc) S.g++;
  skipInc = false;
  if (newMap) floats.push({ x: W / 2, y: VH * 0.36, vy: -10, life: 1.8, max: 1.8, txt: MAPS[mapIdx()].name.toUpperCase() + (world() > 1 ? ' W' + world() : '') + '!', banner: 1 });
  save(); startSub();
}
function bossFail(why) {
  if (!boss) return;
  const i = targets.indexOf(boss); if (i >= 0) targets.splice(i, 1);
  boss = null; projs = []; S.farm = true; S.kills = 0; SFX.fail();
  floats.push({ x: W / 2, y: VH * 0.36, vy: -10, life: 2.2, max: 2.2, txt: why, banner: 1 });
  toast('Upgrade your blaster, then tap FIGHT BOSS', 4);
  phase = 'victory'; phaseT = -0.6; save();
}

// ---------- boss attacks ----------
function bossAttack() {
  const b = boss, kind = b.type, hx = heroX + 10, hy = groundY - hero.h * 0.55;
  const ox = b.x - b.w * 0.3, oy = groundY - b.h * 0.6, dmg = 10;
  const arc = (T, r, col, sp) => { const vx = (hx - ox) / T, g = 900, vy = (hy - oy - 0.5 * g * T * T) / T; projs.push({ x: ox, y: oy, vx, vy, g, r, col, kind: sp, dmg, rot: 0, life: 4 }); };
  if (kind === 'boss_gnome') arc(rand(1.2, 1.5), 22, '#8a5a2b', 'acorn');
  else if (kind === 'boss_blender') { arc(1.15, 18, '#ff9a2e', 'fruit'); arc(1.45, 18, '#7fd34a', 'fruit'); if (b.n % 2) arc(1.75, 18, '#e8403a', 'fruit'); }
  else { const a = Math.atan2(hy - oy, hx - ox), sp = 430; projs.push({ x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0, r: 20, col: '#e8403a', kind: 'missile', dmg, rot: a, life: 4 }); }
  b.n++;
}
function hurtHero(d) {
  hero.hp = Math.max(0, hero.hp - d); hero.hurt = 1; shake = Math.max(shake, 0.45); SFX.hurt();
  floats.push({ x: heroX, y: groundY - hero.h - 20, vy: -90, life: 0.9, max: 0.9, txt: '-' + d, hurt: 1 });
  if (hero.hp <= 0) bossFail('OUCH! BOSS WON');
}

// ---------- shooting ----------
function fire(tx, ty, manual) {
  const [mx, my] = rigToWorld(RIG.muzzle[0], RIG.muzzle[1], true);
  const a = Math.atan2(ty - my, tx - mx); const sp = 1500;
  const crit = Math.random() < critChance();
  const base = shotDmg() * (manual ? 0.8 : 1);
  bullets.push({ x: mx, y: my, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg: Math.max(1, Math.round(base * (crit ? critX() : 1))), crit, life: 1.2, manual });
  hero.recoil = 1; hero.flash = 1; SFX.shoot();
  if (!curChar().img) { const [ex, ey] = rigToWorld(RIG.eject[0], RIG.eject[1], true); if (shells.length < 25) shells.push({ x: ex, y: ey, vx: rand(-160, -60), vy: -rand(220, 360), rot: rand(0, 6), vr: rand(-20, 20), life: 1.0 }); }
}
function firePower() {
  if (power < 1 || phase !== 'fight') return false;
  const t = nearestTarget(); if (!t) return false;
  power = 0;
  const [mx, my] = rigToWorld(RIG.muzzle[0], RIG.muzzle[1], true), ty = groundY - t.h * 0.5;
  const a = Math.atan2(ty - my, t.x - mx);
  bullets.push({ x: mx, y: my, vx: Math.cos(a) * 1300, vy: Math.sin(a) * 1300, dmg: Math.round(shotDmg() * 20), crit: true, life: 1.5, power: 1 });
  hero.recoil = 1.6; hero.flash = 1.4; shake = Math.max(shake, 0.3); tone(200, 60, 0.3, 'sawtooth', 0.12);
  return true;
}
function explode(x, y) {
  const R = 230, dmg = Math.round(shotDmg() * 20);
  shake = 1; hitStop = 0.09; SFX.boom();
  parts.push({ ring: 1, x, y, r: R, life: 0.45, max: 0.45 });
  parts.push({ puff: 1, x, y, r: 120, life: 0.5, max: 0.5, col: '#ffd23c' });
  for (let k = 0; k < 26; k++) { const a = rand(0, 6.28), s = rand(200, 700); parts.push({ spark: 1, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 200, life: rand(0.3, 0.7), col: k % 2 ? '#ff8a1e' : '#ffe14a', big: 1 }); }
  for (const p of projs) if (Math.hypot(p.x - x, p.y - y) < R) p.dead = 1;
  for (const t of targets.slice()) if (Math.abs(t.x - x) < R + t.w * 0.4) damage(t, dmg, true, t.x, groundY - t.h * 0.6);
  floats.push({ x, y: y - 70, vy: -60, life: 1, max: 1, txt: 'BOOM!', crit: 2 });
}
function nearestTarget() {
  let best = null; for (const t of targets) if (t.x < W - t.w * 0.45 && t.hp > 0 && (!best || t.x < best.x)) best = t; return best;
}
function aimAt(x, y) {
  const s = heroScale(); const sx = heroX + (RIG.shoulder[0] - RIG.foot[0]) * s;
  const mY = groundY + (RIG.muzzle[1] - RIG.foot[1]) * s;
  hero.aimTarget = clamp(Math.atan2(y - mY, Math.max(60, x - sx)), -0.5, 0.35);
}

// ---------- update ----------
function update(dt) {
  time += dt;
  shake = Math.max(0, shake - dt * 2.5);
  toastT = Math.max(0, toastT - dt);
  if (fadeDir) { fade = clamp(fade + fadeDir * dt * 3, 0, 1); if (fade >= 1 && fadeDir > 0) { fadeDir = -1; buildBg(); } if (fade <= 0 && fadeDir < 0) fadeDir = 0; }
  hero.recoil = Math.max(0, hero.recoil - dt * 9);
  hero.flash = Math.max(0, hero.flash - dt * 14);
  hero.hurt = Math.max(0, hero.hurt - dt * 3);
  hero.aim = lerp(hero.aim, hero.aimTarget, Math.min(1, dt * 18));
  hero.blinkT -= dt; if (hero.blinkT <= 0) { hero.blink = 0.13; hero.blinkT = rand(2.2, 4.8); }
  hero.blink -= dt;
  coinPulse = Math.max(0, coinPulse - dt * 4); gemPulse = Math.max(0, gemPulse - dt * 3);
  for (let i = 0; i < btnPop.length; i++) btnPop[i] = Math.max(0, btnPop[i] - dt * 5);
  coinShown = lerp(coinShown, S.coins, Math.min(1, dt * 8)); if (Math.abs(coinShown - S.coins) < 1) coinShown = S.coins;
  if (scene === 'title') { bgX += dt * 30; return; }
  tutT += dt;
  if (phase === 'fight') power = Math.min(1, power + dt / POWER_T());

  hero.jump = 0; hero.raise = Math.max(0, hero.raise - dt * 3);
  if (phase === 'victory') {
    phaseT += dt; const k = clamp(phaseT / 0.9, 0, 1);
    if (phaseT > 0) { hero.jump = Math.sin(Math.min(1, phaseT / 0.5) * Math.PI) * 38; hero.raise = Math.sin(k * Math.PI); }
    hero.aimTarget = 0;
    if (phaseT > 1.0) { phase = 'walk'; phaseT = 0; if (bgKey !== MAPS[mapIdx()].bg) { fadeDir = 1; } }
  } else if (phase === 'walk') {
    phaseT += dt; hero.walkT += dt; const spd = 330; bgX += spd * dt;
    parts.forEach(p => p.x -= spd * dt); coins.forEach(c => { if (!c.fly) c.x -= spd * dt; }); shells.forEach(s => s.x -= spd * dt);
    if (phaseT > 1.5 && !fadeDir) nextSub();
  } else {
    spawnTimer -= dt;
    if (spawnQueue > 0 && targets.length < 3 && spawnTimer <= 0) { spawnTarget(); spawnQueue--; spawnTimer = 0.45; }
    const tgt = nearestTarget();
    if (!hold) { if (tgt) aimAt(tgt.x, groundY - tgt.h * 0.5); else hero.aimTarget = 0; }
    autoT -= dt;
    if (tgt && autoT <= 0) { fire(tgt.x, groundY - tgt.h * 0.5, false); autoT = 1 / fireRate(); }
    manualT -= dt;
    if (hold && manualT <= 0) { aimAt(hold.x, hold.y); fire(hold.x, hold.y, true); manualT = 1 / (fireRate() * 1.5 + 3); }
    // buddy helper (after first boss win): small extra shots
    if (S.bossWins > 0 && tgt) { buddyT -= dt; if (buddyT <= 0) { buddyT = 0.8; const bx = heroX - 135, by = groundY - hero.h * 0.8 - 20; const a = Math.atan2(groundY - tgt.h * 0.5 - by, tgt.x - bx);
      bullets.push({ x: bx + 40, y: by + 20, vx: Math.cos(a) * 1300, vy: Math.sin(a) * 1300, dmg: Math.max(1, Math.round(shotDmg() * 0.3)), crit: false, life: 1.2, buddy: 1 }); } }
    if (boss && !boss.moving) {
      boss.timer -= dt; boss.atkT -= dt;
      if (boss.atkT < 0.5 && boss.atkT + dt >= 0.5) boss.wind = 0.5;
      if (boss.atkT <= 0) { bossAttack(); boss.atkT = boss.type === 'boss_mech' ? 2.6 : boss.type === 'boss_blender' ? 4.2 : 3.0; }
      if (boss.timer <= 0) bossFail("TIME'S UP!");
    }
  }
  if (boss) boss.wind = Math.max(0, boss.wind - dt);

  for (const t of targets) {
    t.t += dt; t.flash = Math.max(0, t.flash - dt * 8); t.squash = Math.max(0, t.squash - dt * 6);
    if (t.x > t.slotX) { t.x = Math.max(t.slotX, t.x - dt * (t.boss ? 200 : TYPES[t.type].waddle || TYPES[t.type].robot ? 260 : 420)); t.moving = true; } else t.moving = false;
    t.hpShown = lerp(t.hpShown, t.hp, Math.min(1, dt * 10));
  }
  // boss projectiles
  for (let i = projs.length - 1; i >= 0; i--) {
    const p = projs[i]; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.rot += p.kind === 'missile' ? 0 : dt * 8;
    if (p.kind === 'missile' && Math.random() < 0.5) parts.push({ puff: 1, x: p.x + 20, y: p.y, r: 10, life: 0.3, max: 0.3 });
    if (p.dead) { for (let k = 0; k < 8; k++) parts.push({ spark: 1, x: p.x, y: p.y, vx: rand(-250, 250), vy: rand(-300, 100), life: 0.3, col: p.col }); projs.splice(i, 1); continue; }
    if (p.x < heroX + 40 && p.y > groundY - hero.h) { hurtHero(p.dmg); projs.splice(i, 1); continue; }
    if (p.life <= 0 || p.y > VH + 40) projs.splice(i, 1);
  }
  // bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i]; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.manual) { let hp = null; for (const p of projs) if (!p.dead && Math.hypot(p.x - b.x, p.y - b.y) < p.r + 22) { hp = p; break; }
      if (hp) { hp.dead = 1; SFX.hit(); floats.push({ x: hp.x, y: hp.y - 30, vy: -80, life: 0.6, max: 0.6, txt: 'BLOCKED!', crit: 0 }); bullets.splice(i, 1); continue; } }
    let hit = null;
    for (const t of targets) {
      if (b.x > t.x - t.w * 0.42 && b.x < t.x + t.w * 0.42 && b.y > groundY - t.h && b.y < groundY) { hit = t; break; }
    }
    if (hit) {
      if (b.power) explode(b.x, b.y);
      else { damage(hit, b.dmg, b.crit, b.x, b.y); if (Math.random() < 0.3) SFX.hit();
        if (parts.length < 220) for (let k = 0; k < 4; k++) parts.push({ spark: 1, x: b.x, y: b.y, vx: rand(-320, 80), vy: rand(-260, 200), life: rand(0.15, 0.3), col: b.crit ? '#ff9a2e' : '#ffe766' }); }
      bullets.splice(i, 1); continue;
    }
    if (b.life <= 0 || b.x > W + 50 || b.y < -50 || b.y > VH + 50) bullets.splice(i, 1);
  }
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.life -= dt;
    if (p.puff || p.ring) { if (p.life <= 0) parts.splice(i, 1); continue; }
    p.vy += (p.spark ? 600 : 1500) * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.vr) p.rot += p.vr * dt;
    if (!p.spark && p.y > groundY + 10 && p.vy > 0) { p.y = groundY + 10; p.vy *= -0.35; p.vx *= 0.6; p.vr *= 0.5; p.bounced++; }
    if (p.life <= 0) parts.splice(i, 1);
  }
  for (let i = shells.length - 1; i >= 0; i--) {
    const s = shells[i]; s.life -= dt; s.vy += 1400 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.rot += s.vr * dt;
    if (s.y > groundY + 4 && s.vy > 0) { s.y = groundY + 4; s.vy *= -0.4; s.vx *= 0.5; s.vr *= 0.5; }
    if (s.life <= 0) shells.splice(i, 1);
  }
  const hx = 52, hy = 40;
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i]; c.t += dt; c.spin += dt * 9;
    if (!c.fly) {
      c.vy += 1500 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vx *= 0.99;
      if (c.y > groundY + 8 && c.vy > 0) { c.y = groundY + 8; c.vy *= -0.45; c.vx *= 0.6; }
      if (c.t > 0.55 + i % 4 * 0.05) { c.fly = true; c.ft = 0; c.sx = c.x; c.sy = c.y; }
    } else {
      c.ft += dt * 1.8; const k = c.ft * c.ft;
      const cx = (c.sx + hx) / 2 - 80, cy = Math.min(c.sy, hy) - 120;
      c.x = (1 - k) * (1 - k) * c.sx + 2 * (1 - k) * k * cx + k * k * hx;
      c.y = (1 - k) * (1 - k) * c.sy + 2 * (1 - k) * k * cy + k * k * hy;
      if (c.ft >= 1) { S.coins += c.val; coinPulse = 1; coins.splice(i, 1); if (Math.random() < 0.3) SFX.coin(); }
    }
  }
  for (let i = floats.length - 1; i >= 0; i--) { const f = floats[i]; f.life -= dt; f.y += f.vy * dt; f.vy *= 0.96; if (f.life <= 0) floats.splice(i, 1); }
}

// ---------- draw ----------
function drawTarget(t) {
  const img = t.img; if (!img) return;
  const T = TYPES[t.type] || {};
  let rot = 0, bob = 0, sx = 1, sy = 1;
  if (t.boss) { bob = t.moving ? -Math.abs(Math.sin(t.t * 6)) * 10 : Math.sin(t.t * 2.5) * 4; rot = t.moving ? Math.sin(t.t * 6) * 0.05 : 0; if (t.wind > 0) { sx = 1.08; sy = 0.92; rot = -0.08; } }
  else if (T.waddle) { const w = t.moving ? 1 : 0.25; rot = Math.sin(t.t * 9) * 0.09 * w; bob = -Math.abs(Math.sin(t.t * 9)) * 6 * w; }
  else if (T.robot) { bob = -Math.abs(Math.sin(t.t * 8)) * 4; rot = Math.sin(t.t * 8) * 0.03; }
  else if (t.moving) { rot = Math.sin(t.t * 14) * 0.03; }
  const sq = t.squash;
  ctx.fillStyle = 'rgba(40,30,10,0.28)'; ctx.beginPath(); ctx.ellipse(t.x, groundY + 2, t.w * 0.45, t.boss ? 20 : 12, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(t.x, groundY + bob); ctx.rotate(rot); ctx.scale(sx * (1 + sq * 0.12), sy * (1 - sq * 0.12));
  if (T.robot && IMG.robot_body) { // cutout walk cycle: legs swing around hips
    const s = t.h / IMG.robot.height, sw = Math.sin(t.t * 8) * 0.35;
    ctx.translate(-t.w / 2, -t.h); ctx.scale(s, s);
    const leg = (im, px, a) => { ctx.save(); ctx.translate(px, 238); ctx.rotate(a); ctx.drawImage(im, -px, -238); ctx.restore(); };
    leg(IMG.robot_legB, 115, -sw); leg(IMG.robot_legF, 68, sw);
    ctx.drawImage(IMG.robot_body, 0, Math.abs(Math.sin(t.t * 8)) * -3);
    if (t.flash > 0) { if (!SIL.robot) SIL.robot = silhouette(IMG.robot); ctx.globalAlpha = t.flash * 0.75; ctx.drawImage(SIL.robot, 0, 0); ctx.globalAlpha = 1; }
  } else {
    ctx.drawImage(img, -t.w / 2, -t.h, t.w, t.h);
    if (t.flash > 0) { if (!SIL[t.type]) SIL[t.type] = silhouette(img); ctx.globalAlpha = t.flash * 0.75; ctx.drawImage(SIL[t.type], -t.w / 2, -t.h, t.w, t.h); ctx.globalAlpha = 1; }
  }
  ctx.restore();
  if (t.boss) { if (t.wind > 0) text('!', t.x - t.w * 0.2, groundY - t.h - 30, 60, '#ff5a3a', 'center', '#2b2018', 8); return; }
  const bw = Math.max(90, t.w * 0.8), bx = t.x - bw / 2, by = groundY - t.h - 30;
  rrect(bx - 3, by - 3, bw + 6, 20, 9); ctx.fillStyle = '#2b2018'; ctx.fill();
  rrect(bx, by, bw, 14, 7); ctx.fillStyle = '#5a3a2a'; ctx.fill();
  const f1 = clamp(t.hpShown / t.maxHp, 0, 1), f2 = clamp(t.hp / t.maxHp, 0, 1);
  if (f1 > 0) { rrect(bx, by, bw * f1, 14, 7); ctx.fillStyle = '#fff3b0'; ctx.fill(); }
  if (f2 > 0) { rrect(bx, by, Math.max(14, bw * f2), 14, 7); ctx.fillStyle = f2 > 0.5 ? '#6ad13c' : f2 > 0.25 ? '#f0b52b' : '#ef4b3b'; ctx.fill(); }
  text(fmt(Math.max(0, t.hp)), t.x, by + 7, 15, '#fff', 'center', '#2b2018', 4);
}
function drawProjs() {
  for (const p of projs) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.lineWidth = 4; ctx.strokeStyle = '#2b2018';
    if (p.kind === 'missile') {
      ctx.fillStyle = '#e8eef5'; rrect(-26, -9, 40, 18, 9); ctx.fill(); ctx.stroke();
      ctx.fillStyle = p.col; ctx.beginPath(); ctx.moveTo(14, -9); ctx.lineTo(30, 0); ctx.lineTo(14, 9); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffb03a'; ctx.beginPath(); ctx.moveTo(-26, -6); ctx.lineTo(-40 - Math.random() * 10, 0); ctx.lineTo(-26, 6); ctx.fill();
    } else if (p.kind === 'acorn') {
      ctx.fillStyle = '#b8783a'; ctx.beginPath(); ctx.ellipse(0, 4, 16, 19, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#6b4423'; ctx.beginPath(); ctx.ellipse(0, -10, 19, 10, 0, 0, 7); ctx.fill(); ctx.stroke();
    } else { ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff8'; ctx.beginPath(); ctx.arc(-5, -5, 6, 0, 7); ctx.fill(); }
    ctx.restore();
    // target ring hint: these can be shot down
    ctx.globalAlpha = 0.5 + Math.sin(time * 12) * 0.3; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 12, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
  }
}
function drawBullets() {
  ctx.lineCap = 'round';
  const accent = curGun().id !== 'none' ? curGun().col : BLASTERS[bestW() - 1][2];
  for (const b of bullets) {
    if (b.power) {
      ctx.fillStyle = '#ff8a1e'; ctx.beginPath(); ctx.arc(b.x, b.y, 24, 0, 7); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#3a1a08'; ctx.stroke();
      ctx.fillStyle = '#ffe14a'; ctx.beginPath(); ctx.arc(b.x - 5, b.y - 5, 12, 0, 7); ctx.fill();
      parts.length < 240 && parts.push({ puff: 1, x: b.x - 10, y: b.y, r: 16, life: 0.25, max: 0.25 });
      continue;
    }
    const len = 0.03; const tx = b.x - b.vx * len, ty = b.y - b.vy * len;
    ctx.strokeStyle = b.crit ? 'rgba(255,140,40,0.55)' : 'rgba(255,230,120,0.5)'; ctx.lineWidth = b.buddy ? 5 : 9;
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(Math.atan2(b.vy, b.vx));
    const sc = b.buddy ? 0.8 : 1.3; ctx.scale(sc, sc); ctx.fillStyle = '#3a2410'; rrect(-13, -5.5, 24, 11, 5.5); ctx.fill();
    ctx.fillStyle = b.manual ? '#7fe0ff' : accent; rrect(-11, -3.5, 20, 7, 3.5); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(2, -2, 5, 2);
    ctx.restore();
  }
}
function drawParts() {
  for (const p of parts) {
    if (p.ring) { const k = 1 - p.life / p.max; ctx.globalAlpha = 1 - k; ctx.lineWidth = 14 * (1 - k) + 2; ctx.strokeStyle = '#fff3c0'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.2 + k), 0, 7); ctx.stroke(); ctx.globalAlpha = 1; continue; }
    if (p.puff) { const k = 1 - p.life / p.max; ctx.globalAlpha = (1 - k) * 0.8; ctx.fillStyle = p.col || '#fff6d8'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.5 + k), 0, 7); ctx.fill(); ctx.globalAlpha = 1; continue; }
    if (p.spark) { ctx.fillStyle = p.col; ctx.globalAlpha = clamp(p.life * 5, 0, 1); const s = p.big ? 10 : 6; ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s); ctx.globalAlpha = 1; continue; }
    ctx.globalAlpha = clamp(p.life * 2.5, 0, 1);
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    if (p.img) ctx.drawImage(p.img, p.sx, p.sy, p.sw, p.sh, -p.w / 2, -p.h / 2, p.w, p.h);
    else { ctx.fillStyle = '#2b2018'; ctx.fillRect(-p.w / 2 - 2, -p.h / 2 - 2, p.w + 4, p.h + 4); ctx.fillStyle = p.col; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  for (const s of shells) {
    ctx.globalAlpha = clamp(s.life * 3, 0, 1); ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot);
    ctx.fillStyle = '#5a3a10'; ctx.fillRect(-6, -3.5, 12, 7); ctx.fillStyle = '#f2b636'; ctx.fillRect(-5, -2.5, 10, 5); ctx.restore(); ctx.globalAlpha = 1;
  }
}
function drawCoin(x, y, r, spin) {
  const sx = spin === undefined ? 1 : Math.max(0.15, Math.abs(Math.cos(spin)));
  ctx.drawImage(COIN, x - r * sx, y - r, r * 2 * sx, r * 2);
}
function drawFloats() {
  for (const f of floats) {
    const a = clamp(f.life / f.max * 2, 0, 1); ctx.globalAlpha = a;
    if (f.banner) { const k = 1 - f.life / f.max; const sc = k < 0.15 ? k / 0.15 * 1.2 : 1.2 - Math.min(0.2, (k - 0.15) * 2); text(f.txt, f.x, f.y, 60 * sc, '#ffe14a', 'center', '#3a2412', 10); }
    else if (f.hurt) text(f.txt, f.x, f.y, 34, '#ff4a3a', 'center', '#3a1a08', 7);
    else if (f.crit === 2) text(f.txt, f.x, f.y, 40, '#ff8a1e', 'center', '#3a1a08', 8);
    else text(f.txt, f.x, f.y, f.crit ? 34 : 26, f.crit ? '#ffcf3a' : '#fff', 'center', '#3a2412', 6);
    ctx.globalAlpha = 1;
  }
}
// blaster icon (procedural, 12 distinct looks)
function drawBlaster(lv, x, y, s) {
  const [, main, acc] = BLASTERS[lv - 1];
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineWidth = 3.5; ctx.strokeStyle = '#1d2433';
  const bl = 16 + lv * 2.2;
  ctx.fillStyle = main; rrect(-8, 2, 14, 22, 4); ctx.fill(); ctx.stroke();                       // grip
  ctx.fillStyle = acc; rrect(6, -8, bl, 9, 4); ctx.fill(); ctx.stroke();                         // barrel
  if (lv >= 8) { ctx.fillStyle = acc; rrect(6, 2, bl - 6, 7, 3); ctx.fill(); ctx.stroke(); }     // double barrel
  ctx.fillStyle = main; rrect(-22, -12, 34, 18, 7); ctx.fill(); ctx.stroke();                    // body
  if (lv >= 4) { ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(-8, -16, 7, 0, 7); ctx.fill(); ctx.stroke(); } // tank
  if (lv >= 6) { ctx.fillStyle = '#1d2433'; rrect(-4, -22, 16, 6, 3); ctx.fill(); }              // scope
  if (lv >= 10) { ctx.fillStyle = acc; ctx.beginPath(); ctx.moveTo(-22, -4); ctx.lineTo(-34, -14); ctx.lineTo(-30, 4); ctx.closePath(); ctx.fill(); ctx.stroke(); } // fin
  if (lv >= 12) { ctx.fillStyle = '#fff'; star(-6, -3, 7, 3, 5); ctx.fill(); }
  ctx.fillStyle = '#ffffff70'; rrect(-18, -9, 22, 4, 2); ctx.fill();
  ctx.restore();
}
// UI rects
function uiRects() {
  const bw = 168, bh = 92, gap = 14, total = bw * 3 + gap * 2, x0 = W / 2 - total / 2, y0 = VH - bh - 10;
  return { upg: [0, 1, 2].map(i => ({ x: x0 + i * (bw + gap), y: y0, w: bw, h: bh })), fs: { x: W - 72, y: 14, w: 58, h: 58 }, mute: { x: W - 140, y: 14, w: 58, h: 58 },
    shop: { x: W - 208, y: 14, w: 58, h: 58 },
    wpn: { x: 14, y: VH - 112, w: 112, h: 98 }, pow: { x: W - 124, y: VH - 120, w: 108, h: 108 }, boss: { x: W / 2 - 110, y: 92, w: 220, h: 56 }, top: 96, bottom: y0 - 6 };
}
function icon(kind, x, y, r) {
  ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (kind === 'sword') {
    ctx.rotate(-0.785); ctx.fillStyle = '#e9eef5'; ctx.strokeStyle = '#2b2018'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-4, 6); ctx.lineTo(-4, -r * 0.9); ctx.lineTo(0, -r * 1.1); ctx.lineTo(4, -r * 0.9); ctx.lineTo(4, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f2b636'; ctx.fillRect(-11, 5, 22, 6); ctx.strokeRect(-11, 5, 22, 6);
    ctx.fillStyle = '#7a4518'; ctx.fillRect(-3, 11, 6, r * 0.5); ctx.strokeRect(-3, 11, 6, r * 0.5);
  } else if (kind === 'bolt') {
    ctx.fillStyle = '#ffe14a'; ctx.strokeStyle = '#2b2018'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(4, -r); ctx.lineTo(-r * 0.6, 3); ctx.lineTo(-1, 3); ctx.lineTo(-5, r); ctx.lineTo(r * 0.6, -4); ctx.lineTo(1, -4); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (kind === 'coin') { drawCoin(0, 0, r * 0.85); }
  else if (kind === 'fs') {
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; const a = r * 0.7, b = r * 0.3;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { ctx.beginPath(); ctx.moveTo(sx * a, sy * b); ctx.lineTo(sx * a, sy * a); ctx.lineTo(sx * b, sy * a); ctx.stroke(); }
  } else if (kind === 'snd') {
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-14, -6); ctx.lineTo(-6, -6); ctx.lineTo(4, -14); ctx.lineTo(4, 14); ctx.lineTo(-6, 6); ctx.lineTo(-14, 6); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
    if (S.mute) { ctx.strokeStyle = '#ff6a5a'; ctx.beginPath(); ctx.moveTo(9, -8); ctx.lineTo(19, 8); ctx.moveTo(19, -8); ctx.lineTo(9, 8); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(6, 0, 8, -0.9, 0.9); ctx.stroke(); ctx.beginPath(); ctx.arc(6, 0, 15, -0.9, 0.9); ctx.stroke(); }
  } else if (kind === 'cart') {
    ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-17, -12); ctx.lineTo(-11, -12); ctx.lineTo(-6, 6); ctx.lineTo(13, 6); ctx.lineTo(17, -7); ctx.lineTo(-9, -7); ctx.stroke();
    ctx.beginPath(); ctx.arc(-4, 13, 3.5, 0, 7); ctx.arc(11, 13, 3.5, 0, 7); ctx.fill();
  }
  ctx.restore();
}
function sqBtn(r, col, ic) { rrect(r.x, r.y, r.w, r.h, 14); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#1d2433'; ctx.stroke(); icon(ic, r.x + r.w / 2, r.y + r.h / 2, 18); }
function canMerge() { const c = {}; for (const v of S.inv) if (v && v < MAXW) { if (c[v]) return true; c[v] = 1; } return false; }
function drawHUD() {
  const R = uiRects();
  const cs = 1 + coinPulse * 0.15;
  rrect(16, 16, 210, 50, 25); ctx.fillStyle = 'rgba(30,40,60,0.55)'; ctx.fill();
  ctx.save(); ctx.translate(41, 41); ctx.scale(cs, cs); drawCoin(0, 0, 24); ctx.restore();
  text(fmt(coinShown), 74, 42, 30, '#fff', 'left', '#1d2433', 6);
  rrect(16, 72, 140, 40, 20); ctx.fillStyle = 'rgba(30,40,60,0.55)'; ctx.fill();
  const gs = 1 + gemPulse * 0.25; ctx.drawImage(GEM, 22 - 2 * gs, 74 - 2 * gs, 36 * gs, 36 * gs);
  text(fmt(S.gems), 64, 93, 24, '#cff6ff', 'left', '#1d2433', 5);
  // stage bar
  const M = MAPS[mapIdx()], bw = Math.min(360, W * 0.27), bx = W / 2 - bw / 2;
  text(`${M.name}${world() > 1 ? ' W' + world() : ''}  ${S.farm ? round() - 1 : round()}/5`, W / 2, 30, 30, '#fff', 'center', '#1d2433', 7);
  rrect(bx - 4, 52, bw + 8, 26, 13); ctx.fillStyle = '#1d2433'; ctx.fill();
  rrect(bx, 56, bw, 18, 9); ctx.fillStyle = '#3d4a63'; ctx.fill();
  let prog = phase === 'fight' ? S.kills / PER_SUB : 1;
  if (boss) prog = clamp(boss.hpShown / boss.maxHp, 0, 1);
  if (prog > 0) { rrect(bx, 56, Math.max(18, bw * prog), 18, 9); ctx.fillStyle = boss ? '#ef4b3b' : '#ffc928'; ctx.fill(); rrect(bx + 4, 58, Math.max(10, bw * prog - 8), 5, 3); ctx.fillStyle = '#fff3'; ctx.fill(); }
  for (let i = 1; i <= 5; i++) {
    const dx = bx + bw + 22 + (i - 1) * 20; ctx.beginPath(); ctx.arc(dx, 65, i === 5 ? 9 : 7, 0, 7);
    ctx.fillStyle = i < round() ? '#6ad13c' : i === round() ? (i === 5 ? '#ef4b3b' : '#ffc928') : '#3d4a63'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#1d2433'; ctx.stroke();
  }
  if (boss) { // big boss bar
    const w2 = Math.min(620, W * 0.48), x2 = W / 2 - w2 / 2, y2 = 92;
    text(boss.name, x2, y2 + 4, 24, '#ffd0c0', 'left', '#1d2433', 5);
    text(Math.ceil(boss.timer) + 's', x2 + w2, y2 + 4, 26, boss.timer < 8 ? '#ff6a5a' : '#fff', 'right', '#1d2433', 5);
    rrect(x2 - 4, y2 + 18, w2 + 8, 32, 16); ctx.fillStyle = '#1d2433'; ctx.fill();
    const f = clamp(boss.hpShown / boss.maxHp, 0, 1);
    rrect(x2, y2 + 22, w2, 24, 12); ctx.fillStyle = '#5a2a2a'; ctx.fill();
    if (f > 0) { rrect(x2, y2 + 22, Math.max(24, w2 * f), 24, 12); ctx.fillStyle = '#ef4b3b'; ctx.fill(); rrect(x2 + 6, y2 + 25, Math.max(12, w2 * f - 12), 6, 3); ctx.fillStyle = '#fff4'; ctx.fill(); }
    text(fmt(Math.max(0, boss.hp)), W / 2, y2 + 34, 18, '#fff', 'center', '#1d2433', 4);
    // hero hp
    const hw = 120, hxp = heroX - hw / 2, hyp = groundY - hero.h - 34;
    rrect(hxp - 3, hyp - 3, hw + 6, 20, 9); ctx.fillStyle = '#1d2433'; ctx.fill();
    const hf = hero.hp / hero.maxHp; if (hf > 0) { rrect(hxp, hyp, Math.max(14, hw * hf), 14, 7); ctx.fillStyle = hf > 0.5 ? '#4fd0ff' : hf > 0.25 ? '#f0b52b' : '#ef4b3b'; ctx.fill(); }
    text('HP', hxp - 18, hyp + 7, 16, '#fff', 'center', '#1d2433', 4);
  }
  if (S.farm && phase === 'fight' && !boss) {
    const b = R.boss, p = 1 + Math.sin(time * 5) * 0.05;
    ctx.save(); ctx.translate(b.x + b.w / 2, b.y + b.h / 2); ctx.scale(p, p);
    rrect(-b.w / 2, -b.h / 2 + 5, b.w, b.h, 22); ctx.fillStyle = '#7a1a12'; ctx.fill();
    rrect(-b.w / 2, -b.h / 2, b.w, b.h, 22); ctx.fillStyle = '#ef4b3b'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#3a0e08'; ctx.stroke();
    text('FIGHT BOSS', 0, 2, 30, '#fff', 'center', '#3a0e08', 7); ctx.restore();
  }
  sqBtn(R.fs, '#5a7fa8', 'fs'); sqBtn(R.mute, '#5a7fa8', 'snd'); sqBtn(R.shop, '#d88a1e', 'cart');
  // upgrades
  UPG.forEach((u, i) => {
    const r = R.upg[i], L = S[u.key], cost = u.cost(L), maxed = u.max && L >= u.max, can = !maxed && S.coins >= cost;
    const pop = btnPop[i];
    ctx.save(); ctx.translate(r.x + r.w / 2, r.y + r.h / 2); ctx.scale(1 + pop * 0.08, 1 - pop * 0.05); ctx.translate(-r.w / 2, -r.h / 2);
    rrect(0, 4, r.w, r.h, 18); ctx.fillStyle = '#1d2433'; ctx.fill();
    rrect(0, 0, r.w, r.h, 18); ctx.fillStyle = can ? 'rgba(40,52,78,0.92)' : 'rgba(40,46,58,0.82)'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = can ? '#ffd23c' : '#59627a'; ctx.stroke();
    ctx.beginPath(); ctx.arc(34, 36, 25, 0, 7); ctx.fillStyle = u.col; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#1d2433'; ctx.stroke();
    icon(u.icon, 34, 36, 15);
    text(u.name, 66, 22, 22, '#fff', 'left', '#1d2433', 5);
    text('Lv ' + L + '  ' + u.val(L), 66, 46, 15, '#cfe3ff', 'left', '#1d2433', 4);
    rrect(10, 64, r.w - 20, 22, 11); ctx.fillStyle = can ? '#4fbf3a' : '#5d6475'; ctx.fill();
    if (maxed) text('MAX', r.w / 2, 75, 18, '#fff', 'center', '#1d2433', 4);
    else { drawCoin(r.w / 2 - 34, 75, 9); text(fmt(cost), r.w / 2 - 20, 76, 18, can ? '#fff' : '#c9ccd4', 'left', '#1d2433', 4); }
    ctx.restore();
  });
  // weapons button (bottom-left)
  { const r = R.wpn, pop = btnPop[3]; ctx.save(); ctx.translate(r.x + r.w / 2, r.y + r.h / 2); ctx.scale(1 + pop * 0.08, 1 + pop * 0.08); ctx.translate(-r.w / 2, -r.h / 2);
    rrect(0, 5, r.w, r.h, 20); ctx.fillStyle = '#1d2433'; ctx.fill(); rrect(0, 0, r.w, r.h, 20); ctx.fillStyle = '#3a6fd0'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#1d2433'; ctx.stroke();
    drawBlaster(bestW(), r.w / 2, 36, 1.3); text('Weapons', r.w / 2, 78, 20, '#fff', 'center', '#1d2433', 5);
    if (canMerge() || S.coins >= wBuyCost()) { ctx.beginPath(); ctx.arc(r.w - 6, 6, 13, 0, 7); ctx.fillStyle = '#ef4b3b'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke(); text('!', r.w - 6, 7, 18, '#fff', 'center', '#1d2433', 3); }
    ctx.restore(); }
  // power shot (bottom-right) with cooldown ring
  { const r = R.pow, cx = r.x + r.w / 2, cy = r.y + r.h / 2, rad = r.w / 2, ready = power >= 1, pop = btnPop[4];
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1 + pop * 0.1 + (ready ? Math.sin(time * 6) * 0.04 : 0), 1 + pop * 0.1 + (ready ? Math.sin(time * 6) * 0.04 : 0));
    ctx.beginPath(); ctx.arc(0, 4, rad, 0, 7); ctx.fillStyle = '#1d2433'; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, rad, 0, 7); ctx.fillStyle = ready ? '#ff7a2e' : '#59627a'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#1d2433'; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, rad - 9, -Math.PI / 2, -Math.PI / 2 + power * Math.PI * 2); ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.strokeStyle = ready ? '#ffe14a' : '#9fd0ff'; ctx.stroke();
    ctx.fillStyle = ready ? '#ffe14a' : '#c9ccd4'; star(-4, -8, 22, 9, 6); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#1d2433'; ctx.stroke();
    text(ready ? 'POWER!' : Math.ceil((1 - power) * POWER_T()) + 's', 0, 30, 19, '#fff', 'center', '#1d2433', 5);
    ctx.restore(); }
  if (S.tut < 1 && tutT < 30 && phase === 'fight') {
    const t = nearestTarget();
    if (t && tutT < 18) {
      const px = t.x + 10, py = groundY - t.h * 0.5 + 40 + Math.sin(time * 6) * 8;
      ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(px - 10, py - 40, 22 + Math.sin(time * 6) * 6, 0, 7); ctx.lineWidth = 5; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.globalAlpha = 1;
      text('Tap & hold to blast!', W * 0.62, VH * 0.26, 34, '#fff', 'center', '#1d2433', 7);
    } else if (UPG.some(u => S.coins >= u.cost(S[u.key]))) {
      text('Spend coins on upgrades!', W / 2, R.bottom - 30 + Math.sin(time * 6) * 5, 30, '#ffe14a', 'center', '#1d2433', 7);
    }
  } else if (S.tut < 1 && tutT >= 30) { S.tut = 1; save(); }
  if (boss && boss.n < 2 && !boss.moving) text('Tap the flying attacks to block them!', W * 0.55, VH * 0.30, 28, '#fff', 'center', '#1d2433', 6);
}
function drawBuddy() {
  if (!S.bossWins || !IMG.buddy) return;
  const img = IMG.buddy, h = 78, w = img.width / img.height * h, x = heroX - 105, y = groundY - hero.h * 0.8 + Math.sin(time * 3) * 8;
  ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
}
function drawToast() {
  if (toastT <= 0) return;
  ctx.globalAlpha = clamp(toastT * 2, 0, 1);
  ctx.font = `24px ${FONT}`; const w = ctx.measureText(toastMsg).width + 50;
  rrect(W / 2 - w / 2, VH * 0.6, w, 50, 25); ctx.fillStyle = 'rgba(29,36,51,0.88)'; ctx.fill();
  text(toastMsg, W / 2, VH * 0.6 + 26, 24, '#fff', 'center', '#1d2433', 4);
  ctx.globalAlpha = 1;
}

// ---------- popups: weapons merge + shop ----------
function panel() { const w = Math.min(860, W - 80), h = 560; return { x: W / 2 - w / 2, y: VH / 2 - h / 2 + 10, w, h }; }
function wpnRects() {
  const P = panel(), cs = 132, gap = 18, gx = P.x + P.w / 2 - (cs * 4 + gap * 3) / 2, gy = P.y + 100;
  return { P, slots: S.inv.map((_, i) => ({ x: gx + (i % 4) * (cs + gap), y: gy + Math.floor(i / 4) * (cs + gap), w: cs, h: cs })),
    buy: { x: P.x + P.w / 2 - 150, y: P.y + P.h - 104, w: 300, h: 80 }, close: { x: P.x + P.w - 66, y: P.y + 12, w: 54, h: 54 } };
}
function drawPanelFrame(P, title) {
  ctx.fillStyle = 'rgba(15,20,35,0.55)'; ctx.fillRect(0, 0, W, VH);
  rrect(P.x, P.y + 8, P.w, P.h, 30); ctx.fillStyle = '#1d2433'; ctx.fill();
  rrect(P.x, P.y, P.w, P.h, 30); ctx.fillStyle = '#f6ecd6'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#1d2433'; ctx.stroke();
  rrect(P.x + 8, P.y + 8, P.w - 16, 64, 22); ctx.fillStyle = '#3a6fd0'; ctx.fill();
  text(title, P.x + P.w / 2, P.y + 41, 40, '#fff', 'center', '#1d2433', 8);
}
function closeBtn(r) { rrect(r.x, r.y, r.w, r.h, 14); ctx.fillStyle = '#ef4b3b'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#1d2433'; ctx.stroke(); text('X', r.x + r.w / 2, r.y + r.h / 2 + 2, 30, '#fff', 'center', '#1d2433', 5); }
function drawWeapons() {
  const R = wpnRects(), best = bestW(); let eqDone = false;
  drawPanelFrame(R.P, 'Blaster Merge');
  closeBtn(R.close);
  R.slots.forEach((r, i) => {
    const lv = S.inv[i];
    const dragging = drag && drag.i === i && drag.moved;
    rrect(r.x, r.y + 5, r.w, r.h, 20); ctx.fillStyle = '#c9b48a'; ctx.fill();
    rrect(r.x, r.y, r.w, r.h, 20); ctx.fillStyle = lv ? '#fffaf0' : '#e8dcc0'; ctx.fill(); ctx.lineWidth = 4;
    ctx.strokeStyle = selSlot === i ? '#ffb020' : '#8a7a5a'; ctx.stroke();
    if (lv && !dragging) {
      drawBlaster(lv, r.x + r.w / 2, r.y + r.h / 2 - 6, 1.65);
      text('Lv ' + lv, r.x + 14, r.y + 18, 20, BLASTERS[lv - 1][1], 'left', '#1d2433', 5);
      if (lv === best && !eqDone) { eqDone = true; rrect(r.x + 10, r.y + r.h - 30, r.w - 20, 22, 11); ctx.fillStyle = '#4fbf3a'; ctx.fill(); text('EQUIPPED', r.x + r.w / 2, r.y + r.h - 18, 15, '#fff', 'center', '#1d2433', 4); }
    }
  });
  if (drag && drag.moved && S.inv[drag.i]) drawBlaster(S.inv[drag.i], drag.x, drag.y, 1.9);
  const info = BLASTERS[best - 1];
  text(`${info[0]}  -  x${wMul(best).toFixed(2)} damage`, R.P.x + R.P.w / 2, R.P.y + 90 + 2 * 150 + 14, 24, '#3a2412', 'center', '#f6ecd6', 2);
  const b = R.buy, cost = wBuyCost(), full = !S.inv.includes(0), can = !full && S.coins >= cost;
  rrect(b.x, b.y + 6, b.w, b.h, 24); ctx.fillStyle = '#1d3a12'; ctx.fill();
  rrect(b.x, b.y, b.w, b.h, 24); ctx.fillStyle = can ? '#5fd03c' : '#8a8f9c'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#1d2433'; ctx.stroke();
  text(full ? 'MERGE TO FREE A SLOT' : 'BUY BLASTER', b.x + b.w / 2, b.y + 26, full ? 22 : 28, '#fff', 'center', '#1d2433', 6);
  if (!full) { drawCoin(b.x + b.w / 2 - 40, b.y + 58, 12); text(fmt(cost), b.x + b.w / 2 - 22, b.y + 59, 24, '#fff', 'left', '#1d2433', 5); }
  text('Drag (or tap) two same-level blasters to merge', R.P.x + R.P.w / 2, R.P.y + 84, 18, '#6a5a3a', 'center', '#f6ecd6', 1);
}
function shopRects() {
  const P = panel(), list = shopTab === 'ch' ? CHARS : GUNS, cw = (P.w - 60 - 5 * 12) / 6;
  return { P, list, close: { x: P.x + P.w - 66, y: P.y + 12, w: 54, h: 54 },
    tabs: [{ x: P.x + 30, y: P.y + 84, w: 200, h: 48 }, { x: P.x + 242, y: P.y + 84, w: 200, h: 48 }],
    cards: list.map((_, i) => ({ x: P.x + 30 + i * (cw + 12), y: P.y + 148, w: cw, h: 384 })) };
}
function owned(it) { return (shopTab === 'ch' ? S.ownCh : S.ownGun).includes(it.id); }
function drawShop() {
  const R = shopRects();
  drawPanelFrame(R.P, 'Shop'); closeBtn(R.close);
  ['Characters', 'Guns'].forEach((n, i) => { const r = R.tabs[i], on = (i === 0) === (shopTab === 'ch');
    rrect(r.x, r.y, r.w, r.h, 16); ctx.fillStyle = on ? '#ffc928' : '#d8ccb0'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#1d2433'; ctx.stroke(); text(n, r.x + r.w / 2, r.y + r.h / 2 + 2, 24, '#fff', 'center', '#1d2433', 5); });
  text('Coins & gems only - earn gems from bosses', R.P.x + R.P.w - 30, R.P.y + 108, 17, '#6a5a3a', 'right', '#f6ecd6', 1);
  R.list.forEach((it, i) => {
    const r = R.cards[i], own = owned(it), eq = shopTab === 'ch' ? S.ch === it.id : S.gun === it.id;
    rrect(r.x, r.y + 5, r.w, r.h, 18); ctx.fillStyle = '#c9b48a'; ctx.fill();
    rrect(r.x, r.y, r.w, r.h, 18); ctx.fillStyle = eq ? '#fff4c8' : '#fffaf0'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = eq ? '#ffb020' : '#8a7a5a'; ctx.stroke();
    const im = it.img ? IMG[it.img] : (shopTab === 'ch' ? IMG.hero : null);
    if (shopTab === 'ch' && im) { const h = 200, w = Math.min(r.w - 10, im.width / im.height * h), hh = w / (im.width / im.height); ctx.drawImage(im, r.x + r.w / 2 - w / 2, r.y + 12 + (h - hh), w, hh); }
    else if (im) { const w = r.w - 16, h = w / (im.width / im.height); ctx.drawImage(im, r.x + 8, r.y + 110 - h / 2, w, h); }
    else drawBlaster(bestW(), r.x + r.w / 2, r.y + 110, 1.6);
    const words = it.name.split(' ');
    text(words[0], r.x + r.w / 2, r.y + 232, 20, '#3a2412', 'center', '#fffaf0', 2);
    if (words[1]) text(words.slice(1).join(' '), r.x + r.w / 2, r.y + 256, 17, '#3a2412', 'center', '#fffaf0', 2);
    text(it.stat, r.x + r.w / 2, r.y + 290, 14, '#2a7a1c', 'center', '#fffaf0', 1);
    const b = { x: r.x + 8, y: r.y + r.h - 58, w: r.w - 16, h: 48 };
    const afford = it.cur === 'g' ? S.gems >= it.price : S.coins >= it.price;
    rrect(b.x, b.y, b.w, b.h, 14); ctx.fillStyle = eq ? '#4fbf3a' : own ? '#3a6fd0' : afford ? '#ff9a2e' : '#8a8f9c'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#1d2433'; ctx.stroke();
    if (eq) text('EQUIPPED', b.x + b.w / 2, b.y + 25, 17, '#fff', 'center', '#1d2433', 4);
    else if (own) text('EQUIP', b.x + b.w / 2, b.y + 25, 20, '#fff', 'center', '#1d2433', 4);
    else { if (it.cur === 'g') ctx.drawImage(GEM, b.x + 8, b.y + 10, 28, 28); else drawCoin(b.x + 22, b.y + 24, 12); text(fmt(it.price), b.x + 42, b.y + 26, 20, '#fff', 'left', '#1d2433', 4); }
  });
}
function popupDown(p) {
  if (popup === 'weapons') {
    const R = wpnRects();
    if (inR(p, R.close) || !inR(p, R.P)) { popup = null; selSlot = -1; return; }
    if (inR(p, R.buy)) { buyBlaster(); return; }
    R.slots.forEach((r, i) => { if (inR(p, r) && S.inv[i]) drag = { i, x: p.x, y: p.y, sx: p.x, sy: p.y, moved: false }; });
  } else if (popup === 'shop') {
    const R = shopRects();
    if (inR(p, R.close) || !inR(p, R.P)) { popup = null; return; }
    if (inR(p, R.tabs[0])) shopTab = 'ch'; if (inR(p, R.tabs[1])) shopTab = 'gun';
    R.cards.forEach((r, i) => { if (inR(p, r)) shopAct(R.list[i]); });
  }
}
function shopAct(it) {
  const isCh = shopTab === 'ch', own = isCh ? S.ownCh : S.ownGun;
  if (!own.includes(it.id)) {
    const have = it.cur === 'g' ? S.gems : S.coins;
    if (have < it.price) { toast(it.cur === 'g' ? 'Not enough gems - beat bosses to earn more' : 'Not enough coins', 2); return; }
    if (it.cur === 'g') S.gems -= it.price; else S.coins -= it.price;
    own.push(it.id); SFX.buy(); toast('Unlocked ' + it.name + '!', 2);
  }
  if (isCh) S.ch = it.id; else S.gun = it.id;
  save();
}
function popupMove(p) { if (drag) { drag.x = p.x; drag.y = p.y; if (Math.hypot(p.x - drag.sx, p.y - drag.sy) > 12) drag.moved = true; } }
function popupUp(p) {
  if (!drag) return;
  const R = wpnRects(), from = drag.i; let to = -1;
  R.slots.forEach((r, i) => { if (inR(p, r)) to = i; });
  if (!drag.moved) { // tap-to-merge
    if (selSlot >= 0 && selSlot !== from) { tryMerge(selSlot, from); selSlot = -1; } else selSlot = selSlot === from ? -1 : from;
  } else if (to >= 0 && to !== from) { tryMerge(from, to); selSlot = -1; }
  drag = null;
}
function tryMerge(a, b) {
  const la = S.inv[a], lb = S.inv[b];
  if (la && la === lb && la < MAXW) { S.inv[b] = la + 1; S.inv[a] = 0; SFX.merge(); hero.flash = 1; toast('Merged! ' + BLASTERS[la][0] + ' (Lv ' + (la + 1) + ')', 2); save(); }
  else if (!lb) { S.inv[b] = la; S.inv[a] = 0; save(); }
  else if (la !== lb) { S.inv[a] = lb; S.inv[b] = la; save(); }
}
function buyBlaster() {
  const i = S.inv.indexOf(0), c = wBuyCost();
  if (i < 0) { toast('Grid full - merge first', 2); return; }
  if (S.coins < c) { toast('Not enough coins', 1.5); return; }
  S.coins -= c; S.wbuys++;
  const r = Math.random(), base = 1 + Math.floor(S.bossWins / 3);
  S.inv[i] = Math.min(MAXW, base + (r < 0.12 ? 1 : 0)); SFX.buy(); save();
}

function drawTitle() {
  drawBg();
  const g = ctx.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, 'rgba(20,40,80,0.35)'); g.addColorStop(0.6, 'rgba(20,40,80,0.05)'); g.addColorStop(1, 'rgba(20,30,10,0.35)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, VH);
  const save_ = heroX; heroX = W * 0.27;
  drawHero(heroX, groundY, 300); drawMuzzle();
  heroX = save_;
  ctx.save(); ctx.translate(W * 0.62, VH * 0.26); ctx.rotate(-0.05); const sc = 1 + Math.sin(time * 2) * 0.02; ctx.scale(sc, sc);
  text('BACKYARD', 0, -10, 96, '#ffd23c', 'center', '#3a2412', 18);
  text('BLASTERS', 0, 82, 104, '#ff7a2e', 'center', '#3a2412', 18);
  ctx.restore();
  const b = playBtn(), p = 1 + Math.sin(time * 4) * 0.04;
  ctx.save(); ctx.translate(b.x + b.w / 2, b.y + b.h / 2); ctx.scale(p, p);
  rrect(-b.w / 2, -b.h / 2 + 7, b.w, b.h, 30); ctx.fillStyle = '#2a6a1c'; ctx.fill();
  rrect(-b.w / 2, -b.h / 2, b.w, b.h, 30); ctx.fillStyle = '#5fd03c'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#1d3a12'; ctx.stroke();
  rrect(-b.w / 2 + 12, -b.h / 2 + 8, b.w - 24, 16, 8); ctx.fillStyle = '#ffffff40'; ctx.fill();
  text(S.totalKills > 0 ? 'CONTINUE' : 'PLAY', 0, 2, 50, '#fff', 'center', '#1d3a12', 9);
  ctx.restore();
  text('Phase 2 - 3 maps, bosses, merge, shop', W - 14, VH - 18, 18, '#fff', 'right', '#1d2433', 4);
  drawToast();
}
function playBtn() { return { x: W * 0.62 - 150, y: VH * 0.55, w: 300, h: 96 }; }
function draw() {
  ctx.setTransform(K, 0, 0, K, 0, 0);
  if (scene === 'title') { drawTitle(); return; }
  drawBg();
  ctx.save(); ctx.translate(shakeX(), shakeY());
  for (const t of targets) drawTarget(t);
  drawHero(heroX, groundY, hero.h);
  drawBuddy();
  drawParts();
  drawProjs();
  drawBullets();
  drawMuzzle();
  for (const c of coins) drawCoin(c.x, c.y, c.fly ? 15 : 17, c.spin);
  drawFg();
  drawFloats();
  ctx.restore();
  drawHUD();
  if (popup === 'weapons') drawWeapons(); else if (popup === 'shop') drawShop();
  drawToast();
  if (fade > 0) { ctx.fillStyle = `rgba(255,250,235,${fade})`; ctx.fillRect(0, 0, W, VH); }
}

// ---------- input ----------
function vpos(e) { return { x: e.clientX * DPR / K, y: e.clientY * DPR / K }; }
const inR = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
let holdId = null;
function goFullscreen() {
  const el = document.documentElement;
  const rq = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!document.fullscreenElement && !document.webkitFullscreenElement && rq) {
    try { const pr = rq.call(el); if (pr && pr.then) pr.then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} }).catch(() => {}); } catch (e) {}
  } else if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
}
function startGame() { scene = 'game'; startSub(); }
cv.addEventListener('pointerdown', e => {
  e.preventDefault(); audioUnlock();
  const p = vpos(e);
  if (scene === 'title') {
    if (inR(p, playBtn())) { if (matchMedia('(pointer:coarse)').matches) goFullscreen(); startGame(); }
    return;
  }
  if (popup) { popupDown(p); try { cv.setPointerCapture(e.pointerId); } catch (er) {} return; }
  const R = uiRects();
  if (inR(p, R.fs)) { goFullscreen(); return; }
  if (inR(p, R.mute)) { S.mute = !S.mute; save(); return; }
  if (inR(p, R.shop)) { popup = 'shop'; return; }
  if (inR(p, R.wpn)) { popup = 'weapons'; btnPop[3] = 1; return; }
  if (Math.hypot(p.x - (R.pow.x + R.pow.w / 2), p.y - (R.pow.y + R.pow.h / 2)) < R.pow.w / 2 + 6) { if (firePower()) btnPop[4] = 1; return; }
  if (S.farm && phase === 'fight' && !boss && inR(p, R.boss)) { S.farm = false; S.kills = 0; startSub(); return; }
  for (let i = 0; i < 3; i++) if (inR(p, R.upg[i])) { buy(i); return; }
  if (p.y > R.top && p.y < R.bottom + 4 && p.x > heroX + 40) {
    holdId = e.pointerId; hold = p; manualT = 0;
    try { cv.setPointerCapture(e.pointerId); } catch (er) {}
  }
}, { passive: false });
cv.addEventListener('pointermove', e => { const p = vpos(e); if (popup) { popupMove(p); return; } if (hold && e.pointerId === holdId) { hold.x = Math.max(heroX + 60, p.x); hold.y = p.y; } });
const endHold = e => { if (popup) popupUp(vpos(e)); if (e.pointerId === holdId) { hold = null; holdId = null; } };
cv.addEventListener('pointerup', endHold); cv.addEventListener('pointercancel', e => { drag = null; if (e.pointerId === holdId) { hold = null; holdId = null; } });
cv.addEventListener('contextmenu', e => e.preventDefault());
function buy(i) {
  const u = UPG[i], L = S[u.key], c = u.cost(L);
  if (u.max && L >= u.max) return;
  if (S.coins >= c) { S.coins -= c; S[u.key]++; btnPop[i] = 1; SFX.buy(); save(); }
  else btnPop[i] = 0.4;
}
window.addEventListener('keydown', e => {
  if (e.key === '1') buy(0); if (e.key === '2') buy(1); if (e.key === '3') buy(2);
  if (e.key === ' ' || e.key === 'q') firePower(); if (e.key === 'w') popup = popup ? null : 'weapons'; if (e.key === 'Escape') popup = null;
});
window.addEventListener('resize', layout);

// ---------- loop ----------
function frame(now) {
  let dt = (now - last) / 1000; last = now; if (dt > 0.1) dt = 0.1;
  if (hitStop > 0) { hitStop -= dt; dt = 0; }
  update(dt); draw();
  requestAnimationFrame(frame);
}
load(); coinShown = S.coins;
loadAll().then(() => {
  makeCoin(); layout();
  document.getElementById('loading').remove();
  window.__bb = { S, get scene() { return scene; }, start: () => { if (scene === 'title') startGame(); }, startSub, save,
    set popup(v) { popup = v; }, set shopTab(v) { shopTab = v; }, setPower(v) { power = v; }, firePower, get boss() { return boss; }, buildBg: () => { bgKey = ''; buildBg(); } };
  const dbg = new URLSearchParams(location.search).get('dbg');
  if (dbg) { // preview/test states (never saved)
    NOSAVE = true; S.tut = 1; S.coins = 48000; S.gems = 85; S.atkL = 14; S.spdL = 6; S.coinL = 4; S.wbuys = 14; S.bossWins = 1; S.inv = [5, 4, 4, 3, 2, 2, 1, 0];
    S.ownCh = ['specs', 'zip']; S.ownGun = ['none', 'fizz'];
    if (dbg === 'kitchen') S.g = 6; else if (dbg === 'toy') S.g = 11; else if (dbg === 'boss') S.g = 4; else S.g = 7;
    bgKey = ''; buildBg(); startGame();
    if (dbg === 'merge') popup = 'weapons'; if (dbg === 'shop') popup = 'shop'; if (dbg === 'shopguns') { popup = 'shop'; shopTab = 'gun'; }
  }
  requestAnimationFrame(t => { last = t; frame(t); });
});
})();
