/* Backyard Blasters - Phase 1 (core playable)
   Plain Canvas 2D, no external libraries. Original art & code. */
(() => {
'use strict';
const VH = 720;                    // virtual height; width follows aspect
const SAVE_KEY = 'bb_save_v1';
const FONT = "'Lilita', 'Arial Black', sans-serif";
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
let W = 1280, K = 1, DPR = 1;

// ---------- assets ----------
const IMG = {};
const SRC = {
  bg: 'assets/bg_backyard.webp',
  crate: 'assets/crate.png', pot: 'assets/pot.png', gnome: 'assets/gnome.png',
  head: 'assets/hero/head.png', head_blink: 'assets/hero/head_blink.png', torso: 'assets/hero/torso.png',
  arm: 'assets/hero/arm.png', legL: 'assets/hero/legL.png', legR: 'assets/hero/legR.png'
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
  const u = ['K', 'M', 'B', 'T', 'aa', 'ab', 'ac', 'ad'];
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
function silhouette(img) { // white silhouette for hit flash
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-atop';
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); return c;
}
let COIN; // pre-rendered coin
function makeCoin() {
  const s = 64, c = document.createElement('canvas'); c.width = c.height = s; const g = c.getContext('2d');
  g.fillStyle = '#7a4a05'; g.beginPath(); g.arc(32, 32, 31, 0, 7); g.fill();
  g.fillStyle = '#f6b81c'; g.beginPath(); g.arc(32, 32, 27, 0, 7); g.fill();
  g.fillStyle = '#ffd94a'; g.beginPath(); g.arc(32, 30, 22, 0, 7); g.fill();
  g.strokeStyle = '#c98a0b'; g.lineWidth = 5; g.beginPath(); g.arc(32, 32, 12, 0.7, 5.6); g.stroke();
  g.fillStyle = '#fff8'; g.beginPath(); g.ellipse(24, 20, 7, 4, -0.6, 0, 7); g.fill();
  COIN = c;
}

// ---------- save / state ----------
const S = { coins: 0, atkL: 0, spdL: 0, coinL: 0, stage: 1, sub: 1, kills: 0, tut: 0, last: Date.now(), totalKills: 0 };
function load() { try { const d = JSON.parse(localStorage.getItem(SAVE_KEY)); if (d) Object.assign(S, d); } catch (e) {} }
function save() { S.last = Date.now(); try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
setInterval(save, 3000);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
window.addEventListener('pagehide', save);

const PER_SUB = 8;
const atkVal = L => Math.round(5 * Math.pow(1.14, L) + 3 * L);
const rateVal = L => Math.min(14, 2 + 0.25 * L);
const coinMul = L => 1 + 0.2 * L;
const UPG = [
  { key: 'atkL', name: 'Attack', cost: L => Math.ceil(12 * Math.pow(1.16, L)), val: L => fmt(atkVal(L)) + ' dmg', icon: 'sword', col: '#e8524a' },
  { key: 'spdL', name: 'Speed', cost: L => Math.ceil(18 * Math.pow(1.2, L)), val: L => rateVal(L).toFixed(2).replace(/0$/, '') + '/s', icon: 'bolt', col: '#3e8ef0', max: 48 },
  { key: 'coinL', name: 'Coins', cost: L => Math.ceil(25 * Math.pow(1.22, L)), val: L => 'x' + coinMul(L).toFixed(1), icon: 'coin', col: '#f3b322' }
];
const gIdx = () => (S.stage - 1) * 5 + (S.sub - 1);
const TYPES = {
  crate: { hpM: 1.0, h: 150, waddle: 0, debris: ['#a8672e', '#7a4518', '#d99a55'] },
  pot: { hpM: 0.75, h: 140, waddle: 0, debris: ['#c9643a', '#8f3f1e', '#5aa83c', '#4c8be0'] },
  gnome: { hpM: 1.35, h: 172, waddle: 1, debris: ['#d8322d', '#3a72c9', '#fff', '#6b4423'] }
};

// ---------- world ----------
let groundY = 576, heroX = 220;
let scene = 'title';
let time = 0, last = performance.now();
let targets = [], bullets = [], parts = [], coins = [], floats = [], shells = [];
let spawnQueue = 0, spawnTimer = 0;
let phase = 'fight', phaseT = 0; // fight | victory | walk
let bgX = 0, bgCanvas = null, bgTileW = 0;
let autoT = 0, manualT = 0;
let hold = null; // {x,y}
let coinShown = 0, coinPulse = 0;
let btnPop = [0, 0, 0];
let tutT = 0;

function layout() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  if (innerWidth * innerHeight * DPR * DPR > 2600000) DPR = Math.sqrt(2600000 / (innerWidth * innerHeight));
  cv.width = Math.round(innerWidth * DPR); cv.height = Math.round(innerHeight * DPR);
  K = cv.height / VH; W = cv.width / K;
  groundY = VH * 0.80; heroX = Math.max(170, W * 0.15);
  buildBg();
  targets.forEach((t, i) => t.slotX = slotX(i));
}
function buildBg() {
  const img = IMG.bg; if (!img) return;
  const s = VH / img.height; const tw = Math.ceil(img.width * s);
  bgTileW = tw;
  const c = document.createElement('canvas'); c.width = Math.ceil(tw * 2 * K); c.height = Math.ceil(VH * K);
  const g = c.getContext('2d'); g.scale(K, K);
  g.drawImage(img, 0, 0, tw, VH);
  g.save(); g.translate(tw * 2, 0); g.scale(-1, 1); g.drawImage(img, 0, 0, tw, VH); g.restore();
  bgCanvas = c;
}
function drawBg() {
  if (!bgCanvas) { ctx.fillStyle = '#7cc8f2'; ctx.fillRect(0, 0, W, VH); return; }
  const period = bgTileW * 2; let x = -(bgX % period);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (; x < W; x += period) ctx.drawImage(bgCanvas, Math.floor(x * K), 0);
  ctx.restore();
}

// ---------- hero rig ----------
// parts share a 330x480 canvas. pivots in that space.
const RIG = { foot: [130, 478], neck: [150, 226], shoulder: [118, 298], muzzle: [327, 250], eject: [248, 226], hipL: [85, 400], hipR: [172, 400] };
const hero = { h: 240, recoil: 0, aim: 0, aimTarget: 0, blinkT: 2, blink: 0, flash: 0, walkT: 0, jump: 0, raise: 0 };
function heroScale() { return hero.h / 480; }
function heroPose() {
  const t = time;
  const walking = phase === 'walk' && scene === 'game';
  const breath = Math.sin(t * 2.4);
  let bob = 0, legA = 0, legB = 0;
  if (walking) { const w = hero.walkT * 11; bob = -Math.abs(Math.sin(w)) * 7; legA = Math.sin(w) * 0.42; legB = -legA; }
  const r = hero.recoil;
  return {
    sx: 1 - breath * 0.006 + r * 0.02, sy: 1 + breath * 0.012 - r * 0.02,
    bodyDx: -r * 4, bodyDy: bob - hero.jump,
    headDy: breath * 1.6 + (walking ? Math.sin(hero.walkT * 22) * 1.2 : 0), headRot: walking ? Math.sin(hero.walkT * 11) * 0.03 : breath * 0.012 - r * 0.02,
    armRot: hero.aim - r * 0.13 - hero.raise * 0.75 + (walking ? Math.sin(hero.walkT * 11) * 0.04 : 0), armDx: -r * 12, armDy: r * 2,
    legA, legB
  };
}
// transform a rig-space point (through arm) to world
function rigToWorld(px, py, viaArm) {
  const p = heroPose(), s = heroScale();
  let x = px, y = py;
  if (viaArm) {
    const [ox, oy] = RIG.shoulder; const c = Math.cos(p.armRot), sn = Math.sin(p.armRot);
    const dx = x - ox, dy = y - oy; x = ox + dx * c - dy * sn + p.armDx; y = oy + dx * sn + dy * c + p.armDy;
  }
  x += p.bodyDx; y += p.bodyDy;
  return [heroX + (x - RIG.foot[0]) * s * p.sx, groundY + (y - RIG.foot[1]) * s * p.sy];
}
function part(img, pv, rot, dx, dy) {
  if (!img) return;
  ctx.save(); ctx.translate(pv[0] + dx, pv[1] + dy); if (rot) ctx.rotate(rot); ctx.drawImage(img, -pv[0], -pv[1]); ctx.restore();
}
function drawHero(x, y, h, poseOverride) {
  const s = h / 480, p = heroPose();
  // shadow
  ctx.fillStyle = 'rgba(40,30,10,0.28)'; ctx.beginPath(); ctx.ellipse(x, y + 2, h * 0.27 * (1 - hero.jump / 200), h * 0.05, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(x, y); ctx.scale(s * p.sx, s * p.sy); ctx.translate(-RIG.foot[0], -RIG.foot[1]);
  ctx.translate(p.bodyDx, p.bodyDy);
  part(IMG.legL, RIG.hipL, p.legA, 0, -p.bodyDy * (p.legA ? 0 : 0));
  part(IMG.legR, RIG.hipR, p.legB, 0, 0);
  part(IMG.torso, RIG.neck, 0, 0, 0);
  part(hero.blink > 0 ? IMG.head_blink : IMG.head, RIG.neck, p.headRot, 0, p.headDy);
  part(IMG.arm, RIG.shoulder, p.armRot, p.armDx, p.armDy);
  ctx.restore();
}
function drawMuzzle() {
  if (hero.flash <= 0) return;
  const [mx, my] = rigToWorld(RIG.muzzle[0], RIG.muzzle[1], true);
  const a = heroPose().armRot, sz = 26 + hero.flash * 30;
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
  const g = gIdx();
  const pool = S.stage === 1 && S.sub === 1 ? ['crate', 'pot', 'crate'] : ['crate', 'pot', 'gnome', 'gnome', 'crate'];
  const type = pool[Math.floor(Math.random() * pool.length)];
  const T = TYPES[type], img = IMG[type];
  const hp = Math.ceil(18 * Math.pow(1.3, g) * T.hpM);
  const h = T.h, w = img ? img.width / img.height * h : h * 0.8;
  const t = { type, img, hp, maxHp: hp, h, w, x: W + w, slotX: slotX(targets.length), flash: 0, squash: 0, t: Math.random() * 6, moving: true, hpShown: hp,
    reward: Math.ceil(5 * Math.pow(1.26, g) * T.hpM) };
  targets.push(t);
}
function startSub() {
  spawnQueue = PER_SUB - S.kills; spawnTimer = 0.2; phase = 'fight';
}
function damage(t, dmg, crit, hx, hy) {
  t.hp -= dmg; t.flash = 1; t.squash = crit ? 1 : 0.6;
  floats.push({ x: hx + rand(-14, 14), y: hy - 10, vy: -120, life: 0.8, txt: fmt(dmg), crit, max: 0.8 });
  if (crit) floats.push({ x: hx, y: hy - 50, vy: -70, life: 0.9, txt: 'CRIT!', crit: 2, max: 0.9 });
  if (t.hp <= 0) kill(t);
}
function kill(t) {
  const i = targets.indexOf(t); if (i < 0) return;
  targets.splice(i, 1); targets.forEach((o, j) => { o.slotX = slotX(j); o.moving = true; });
  // break into real sprite pieces
  const cols = 3, rows = 3, img = t.img;
  if (img) for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const pw = t.w / cols, ph = t.h / rows;
    parts.push({ img, sx: img.width / cols * c, sy: img.height / rows * r, sw: img.width / cols, sh: img.height / rows, w: pw, h: ph,
      x: t.x - t.w / 2 + pw * (c + 0.5), y: groundY - t.h + ph * (r + 0.5), vx: (c - 1) * rand(80, 260) + rand(60, 200), vy: -rand(250, 620) + r * 60,
      rot: 0, vr: rand(-9, 9), life: 1.4, bounced: 0 });
  }
  const dc = TYPES[t.type].debris;
  for (let k = 0; k < 14; k++) parts.push({ col: dc[k % dc.length], w: rand(6, 16), h: rand(4, 10), x: t.x + rand(-t.w / 3, t.w / 3), y: groundY - t.h * rand(0.2, 0.8),
    vx: rand(-200, 420), vy: -rand(200, 600), rot: rand(0, 6), vr: rand(-14, 14), life: rand(0.7, 1.2), bounced: 0 });
  parts.push({ puff: 1, x: t.x, y: groundY - t.h * 0.45, r: t.h * 0.35, life: 0.35, max: 0.35 });
  // coins
  const total = Math.ceil(t.reward * coinMul(S.coinL)); const n = clamp(Math.round(3 + Math.log10(total + 1) * 2), 3, 9);
  for (let k = 0; k < n; k++) coins.push({ x: t.x + rand(-20, 20), y: groundY - t.h * 0.5, vx: rand(-160, 260), vy: -rand(380, 620), t: 0, val: total / n, spin: rand(0, 6), fly: false });
  S.kills++; S.totalKills++;
  if (S.kills >= PER_SUB && targets.length === 0 && spawnQueue <= 0) subCleared();
}
function subCleared() {
  phase = 'victory'; phaseT = 0;
  floats.push({ x: W / 2, y: VH * 0.36, vy: -20, life: 1.4, max: 1.4, txt: S.sub === 5 ? 'STAGE CLEAR!' : 'CLEARED!', banner: 1 });
}
function nextSub() {
  S.kills = 0; S.sub++;
  if (S.sub > 5) { S.sub = 1; S.stage++; }
  save(); startSub();
}

// ---------- shooting ----------
function fire(tx, ty, manual) {
  const [mx, my] = rigToWorld(RIG.muzzle[0], RIG.muzzle[1], true);
  const a = Math.atan2(ty - my, tx - mx); const sp = 1500;
  const crit = Math.random() < 0.1;
  const base = atkVal(S.atkL) * (manual ? 0.8 : 1);
  bullets.push({ x: mx, y: my, px: mx, py: my, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg: Math.max(1, Math.round(base * (crit ? 3 : 1))), crit, life: 1.2, manual });
  hero.recoil = 1; hero.flash = 1;
  const [ex, ey] = rigToWorld(RIG.eject[0], RIG.eject[1], true);
  shells.push({ x: ex, y: ey, vx: rand(-160, -60), vy: -rand(220, 360), rot: rand(0, 6), vr: rand(-20, 20), life: 1.0, b: 0 });
}
function nearestTarget() {
  let best = null; for (const t of targets) if (t.x < W - t.w * 0.45 && t.hp > 0 && (!best || t.x < best.x)) best = t; return best;
}
function aimAt(x, y) {
  const s = heroScale(); const sx = heroX + (RIG.shoulder[0] - RIG.foot[0]) * s, sy = groundY + (RIG.shoulder[1] - RIG.foot[1]) * s;
  const mY = groundY + (RIG.muzzle[1] - RIG.foot[1]) * s; // muzzle height when level
  hero.aimTarget = clamp(Math.atan2(y - mY, Math.max(60, x - sx)), -0.5, 0.35);
}

// ---------- update ----------
function update(dt) {
  time += dt;
  hero.recoil = Math.max(0, hero.recoil - dt * 9);
  hero.flash = Math.max(0, hero.flash - dt * 14);
  hero.aim = lerp(hero.aim, hero.aimTarget, Math.min(1, dt * 18));
  hero.blinkT -= dt; if (hero.blinkT <= 0) { hero.blink = 0.13; hero.blinkT = rand(2.2, 4.8); }
  hero.blink -= dt;
  coinPulse = Math.max(0, coinPulse - dt * 4);
  for (let i = 0; i < 3; i++) btnPop[i] = Math.max(0, btnPop[i] - dt * 5);
  coinShown = lerp(coinShown, S.coins, Math.min(1, dt * 8)); if (Math.abs(coinShown - S.coins) < 1) coinShown = S.coins;
  if (scene === 'title') { bgX += dt * 30; return; }
  tutT += dt;

  // phases
  hero.jump = 0; hero.raise = Math.max(0, hero.raise - dt * 3);
  if (phase === 'victory') {
    phaseT += dt; const k = clamp(phaseT / 0.9, 0, 1);
    hero.jump = Math.sin(Math.min(1, phaseT / 0.5) * Math.PI) * 38; hero.raise = Math.sin(k * Math.PI);
    hero.aimTarget = 0;
    if (phaseT > 1.0) { phase = 'walk'; phaseT = 0; }
  } else if (phase === 'walk') {
    phaseT += dt; hero.walkT += dt; const spd = 330; bgX += spd * dt;
    parts.forEach(p => p.x -= spd * dt); coins.forEach(c => { if (!c.fly) c.x -= spd * dt; }); shells.forEach(s => s.x -= spd * dt);
    if (phaseT > 1.5) nextSub();
  } else {
    // spawning
    spawnTimer -= dt;
    if (spawnQueue > 0 && targets.length < 3 && spawnTimer <= 0) { spawnTarget(); spawnQueue--; spawnTimer = 0.45; }
    // auto fire
    const tgt = nearestTarget();
    if (!hold) { if (tgt) aimAt(tgt.x, groundY - tgt.h * 0.5); else hero.aimTarget = 0; }
    autoT -= dt;
    if (tgt && autoT <= 0) { fire(tgt.x, groundY - tgt.h * 0.5, false); autoT = 1 / rateVal(S.spdL); }
    manualT -= dt;
    if (hold && manualT <= 0) { aimAt(hold.x, hold.y); fire(hold.x, hold.y, true); manualT = 1 / (rateVal(S.spdL) * 1.5 + 3); }
  }

  // targets
  for (const t of targets) {
    t.t += dt; t.flash = Math.max(0, t.flash - dt * 8); t.squash = Math.max(0, t.squash - dt * 6);
    if (t.x > t.slotX) { t.x = Math.max(t.slotX, t.x - dt * (TYPES[t.type].waddle ? 260 : 420)); t.moving = true; } else t.moving = false;
    t.hpShown = lerp(t.hpShown, t.hp, Math.min(1, dt * 10));
  }
  // bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i]; b.px = b.x; b.py = b.y; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    let hit = null;
    for (const t of targets) {
      if (b.x > t.x - t.w * 0.42 && b.x < t.x + t.w * 0.42 && b.y > groundY - t.h && b.y < groundY) { hit = t; break; }
    }
    if (hit) {
      damage(hit, b.dmg, b.crit, b.x, b.y);
      for (let k = 0; k < 5; k++) parts.push({ spark: 1, x: b.x, y: b.y, vx: rand(-320, 80), vy: rand(-260, 200), life: rand(0.15, 0.3), col: b.crit ? '#ff9a2e' : '#ffe766' });
      bullets.splice(i, 1); continue;
    }
    if (b.life <= 0 || b.x > W + 50 || b.y < -50 || b.y > VH + 50) bullets.splice(i, 1);
  }
  // particles
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.life -= dt;
    if (p.puff) { if (p.life <= 0) parts.splice(i, 1); continue; }
    p.vy += (p.spark ? 600 : 1500) * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.vr) p.rot += p.vr * dt;
    if (!p.spark && p.y > groundY + 10 && p.vy > 0) { p.y = groundY + 10; p.vy *= -0.35; p.vx *= 0.6; p.vr *= 0.5; p.bounced++; }
    if (p.life <= 0) parts.splice(i, 1);
  }
  for (let i = shells.length - 1; i >= 0; i--) {
    const s = shells[i]; s.life -= dt; s.vy += 1400 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.rot += s.vr * dt;
    if (s.y > groundY + 4 && s.vy > 0) { s.y = groundY + 4; s.vy *= -0.4; s.vx *= 0.5; s.vr *= 0.5; }
    if (s.life <= 0) shells.splice(i, 1);
  }
  // coins: arc, bounce, then fly to HUD
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
      if (c.ft >= 1) { S.coins += c.val; coinPulse = 1; coins.splice(i, 1); }
    }
  }
  for (let i = floats.length - 1; i >= 0; i--) { const f = floats[i]; f.life -= dt; f.y += f.vy * dt; f.vy *= 0.96; if (f.life <= 0) floats.splice(i, 1); }
}

// ---------- draw ----------
function drawTarget(t) {
  const img = t.img; if (!img) return;
  const T = TYPES[t.type];
  let rot = 0, bob = 0;
  if (T.waddle) { const w = t.moving ? 1 : 0.25; rot = Math.sin(t.t * 9) * 0.09 * w; bob = -Math.abs(Math.sin(t.t * 9)) * 6 * w; }
  else if (t.moving) { rot = Math.sin(t.t * 14) * 0.03; }
  const sq = t.squash;
  ctx.fillStyle = 'rgba(40,30,10,0.28)'; ctx.beginPath(); ctx.ellipse(t.x, groundY + 2, t.w * 0.45, 12, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(t.x, groundY + bob); ctx.rotate(rot); ctx.scale(1 + sq * 0.12, 1 - sq * 0.12);
  ctx.drawImage(img, -t.w / 2, -t.h, t.w, t.h);
  if (t.flash > 0) { if (!SIL[t.type]) SIL[t.type] = silhouette(img); ctx.globalAlpha = t.flash * 0.75; ctx.drawImage(SIL[t.type], -t.w / 2, -t.h, t.w, t.h); ctx.globalAlpha = 1; }
  ctx.restore();
  // hp bar
  const bw = Math.max(90, t.w * 0.8), bx = t.x - bw / 2, by = groundY - t.h - 30;
  rrect(bx - 3, by - 3, bw + 6, 20, 9); ctx.fillStyle = '#2b2018'; ctx.fill();
  rrect(bx, by, bw, 14, 7); ctx.fillStyle = '#5a3a2a'; ctx.fill();
  const f1 = clamp(t.hpShown / t.maxHp, 0, 1), f2 = clamp(t.hp / t.maxHp, 0, 1);
  if (f1 > 0) { rrect(bx, by, bw * f1, 14, 7); ctx.fillStyle = '#fff3b0'; ctx.fill(); }
  if (f2 > 0) { rrect(bx, by, Math.max(14, bw * f2), 14, 7); ctx.fillStyle = f2 > 0.5 ? '#6ad13c' : f2 > 0.25 ? '#f0b52b' : '#ef4b3b'; ctx.fill(); }
  text(fmt(Math.max(0, t.hp)), t.x, by + 7, 15, '#fff', 'center', '#2b2018', 4);
}
function drawBullets() {
  ctx.lineCap = 'round';
  for (const b of bullets) {
    const len = 0.03; const tx = b.x - b.vx * len, ty = b.y - b.vy * len;
    ctx.strokeStyle = b.crit ? 'rgba(255,140,40,0.55)' : 'rgba(255,230,120,0.5)'; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(Math.atan2(b.vy, b.vx));
    ctx.scale(1.3, 1.3); ctx.fillStyle = '#5a3a10'; rrect(-13, -5.5, 24, 11, 5.5); ctx.fill();
    ctx.fillStyle = b.manual ? '#7fe0ff' : '#ffd23c'; rrect(-11, -3.5, 20, 7, 3.5); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(2, -2, 5, 2);
    ctx.restore();
  }
}
function drawParts() {
  for (const p of parts) {
    if (p.puff) { const k = 1 - p.life / p.max; ctx.globalAlpha = (1 - k) * 0.8; ctx.fillStyle = '#fff6d8'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.5 + k), 0, 7); ctx.fill(); ctx.globalAlpha = 1; continue; }
    if (p.spark) { ctx.fillStyle = p.col; ctx.globalAlpha = clamp(p.life * 5, 0, 1); ctx.fillRect(p.x - 3, p.y - 3, 6, 6); ctx.globalAlpha = 1; continue; }
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
    if (f.banner) { const k = 1 - f.life / f.max; const sc = k < 0.15 ? k / 0.15 * 1.2 : 1.2 - Math.min(0.2, (k - 0.15) * 2); text(f.txt, f.x, f.y, 64 * sc, '#ffe14a', 'center', '#3a2412', 10); }
    else if (f.crit === 2) text(f.txt, f.x, f.y, 40, '#ff8a1e', 'center', '#3a1a08', 8);
    else text(f.txt, f.x, f.y, f.crit ? 34 : 26, f.crit ? '#ffcf3a' : '#fff', 'center', '#3a2412', 6);
    ctx.globalAlpha = 1;
  }
}
// UI rects
function uiRects() {
  const bw = 168, bh = 92, gap = 14, total = bw * 3 + gap * 2, x0 = W / 2 - total / 2, y0 = VH - bh - 10;
  return { upg: [0, 1, 2].map(i => ({ x: x0 + i * (bw + gap), y: y0, w: bw, h: bh })), fs: { x: W - 72, y: 14, w: 58, h: 58 }, top: 96, bottom: y0 - 6 };
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
  }
  ctx.restore();
}
function drawHUD() {
  const R = uiRects();
  // coins pill
  const cs = 1 + coinPulse * 0.15;
  rrect(16, 16, 210, 50, 25); ctx.fillStyle = 'rgba(30,40,60,0.55)'; ctx.fill();
  ctx.save(); ctx.translate(41, 41); ctx.scale(cs, cs); drawCoin(0, 0, 24); ctx.restore();
  text(fmt(coinShown), 74, 42, 30, '#fff', 'left', '#1d2433', 6);
  // stage bar
  const bw = Math.min(380, W * 0.3), bx = W / 2 - bw / 2;
  text(`Stage ${S.stage}-${S.sub}`, W / 2, 30, 32, '#fff', 'center', '#1d2433', 7);
  rrect(bx - 4, 52, bw + 8, 26, 13); ctx.fillStyle = '#1d2433'; ctx.fill();
  rrect(bx, 56, bw, 18, 9); ctx.fillStyle = '#3d4a63'; ctx.fill();
  const prog = phase === 'fight' ? S.kills / PER_SUB : 1;
  if (prog > 0) { rrect(bx, 56, Math.max(18, bw * prog), 18, 9); ctx.fillStyle = '#ffc928'; ctx.fill(); rrect(bx + 4, 58, Math.max(10, bw * prog - 8), 5, 3); ctx.fillStyle = '#fff3'; ctx.fill(); }
  for (let i = 1; i <= 5; i++) {
    const dx = bx + bw + 22 + (i - 1) * 20; ctx.beginPath(); ctx.arc(dx, 65, i === 5 ? 9 : 7, 0, 7);
    ctx.fillStyle = i < S.sub ? '#6ad13c' : i === S.sub ? '#ffc928' : '#3d4a63'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#1d2433'; ctx.stroke();
  }
  // fullscreen
  const f = R.fs; rrect(f.x, f.y, f.w, f.h, 14); ctx.fillStyle = '#5a7fa8'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#1d2433'; ctx.stroke();
  icon('fs', f.x + f.w / 2, f.y + f.h / 2, 18);
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
  // tutorial hints (first ~30s of first session)
  if (S.tut < 1 && tutT < 30 && phase === 'fight') {
    const t = nearestTarget();
    if (t && tutT < 18) {
      const px = t.x + 10, py = groundY - t.h * 0.5 + 40 + Math.sin(time * 6) * 8;
      ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(px - 10, py - 40, 22 + Math.sin(time * 6) * 6, 0, 7); ctx.lineWidth = 5; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.globalAlpha = 1;
      text('Tap & hold to blast!', W * 0.62, VH * 0.24, 34, '#fff', 'center', '#1d2433', 7);
    } else if (UPG.some(u => S.coins >= u.cost(S[u.key]))) {
      text('Spend coins on upgrades!', W / 2, R.bottom - 30 + Math.sin(time * 6) * 5, 30, '#ffe14a', 'center', '#1d2433', 7);
    }
  } else if (S.tut < 1 && tutT >= 30) { S.tut = 1; save(); }
}
function drawTitle() {
  drawBg();
  const g = ctx.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, 'rgba(20,40,80,0.35)'); g.addColorStop(0.6, 'rgba(20,40,80,0.05)'); g.addColorStop(1, 'rgba(20,30,10,0.35)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, VH);
  // hero on title
  const hx = heroX, hy = groundY; const save = heroX; heroX = W * 0.27;
  drawHero(heroX, groundY, 300); drawMuzzle();
  heroX = save;
  // logo
  ctx.save(); ctx.translate(W * 0.62, VH * 0.26); ctx.rotate(-0.05); const sc = 1 + Math.sin(time * 2) * 0.02; ctx.scale(sc, sc);
  text('BACKYARD', 0, -10, 96, '#ffd23c', 'center', '#3a2412', 18);
  text('BLASTERS', 0, 82, 104, '#ff7a2e', 'center', '#3a2412', 18);
  ctx.restore();
  // play button
  const b = playBtn(), p = 1 + Math.sin(time * 4) * 0.04;
  ctx.save(); ctx.translate(b.x + b.w / 2, b.y + b.h / 2); ctx.scale(p, p);
  rrect(-b.w / 2, -b.h / 2 + 7, b.w, b.h, 30); ctx.fillStyle = '#2a6a1c'; ctx.fill();
  rrect(-b.w / 2, -b.h / 2, b.w, b.h, 30); ctx.fillStyle = '#5fd03c'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#1d3a12'; ctx.stroke();
  rrect(-b.w / 2 + 12, -b.h / 2 + 8, b.w - 24, 16, 8); ctx.fillStyle = '#ffffff40'; ctx.fill();
  text(S.totalKills > 0 ? 'CONTINUE' : 'PLAY', 0, 2, 50, '#fff', 'center', '#1d3a12', 9);
  ctx.restore();
  text('Phase 1 preview', W - 14, VH - 18, 18, '#fff', 'right', '#1d2433', 4);
}
function playBtn() { return { x: W * 0.62 - 150, y: VH * 0.55, w: 300, h: 96 }; }
function draw() {
  ctx.setTransform(K, 0, 0, K, 0, 0);
  if (scene === 'title') { drawTitle(); return; }
  drawBg();
  for (const t of targets) drawTarget(t);
  drawHero(heroX, groundY, hero.h);
  drawParts();
  drawBullets();
  drawMuzzle();
  for (const c of coins) drawCoin(c.x, c.y, c.fly ? 15 : 17, c.spin);
  drawFloats();
  drawHUD();
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
cv.addEventListener('pointerdown', e => {
  e.preventDefault();
  const p = vpos(e);
  if (scene === 'title') {
    if (inR(p, playBtn())) {
      scene = 'game';
      if (matchMedia('(pointer:coarse)').matches) goFullscreen();
      startSub();
    }
    return;
  }
  const R = uiRects();
  if (inR(p, R.fs)) { goFullscreen(); return; }
  for (let i = 0; i < 3; i++) if (inR(p, R.upg[i])) { buy(i); return; }
  if (p.y > R.top && p.y < R.bottom + 4 && p.x > heroX + 40) {
    holdId = e.pointerId; hold = p; manualT = 0;
    try { cv.setPointerCapture(e.pointerId); } catch (er) {}
  }
}, { passive: false });
cv.addEventListener('pointermove', e => { if (hold && e.pointerId === holdId) { const p = vpos(e); hold.x = Math.max(heroX + 60, p.x); hold.y = p.y; } });
const endHold = e => { if (e.pointerId === holdId) { hold = null; holdId = null; } };
cv.addEventListener('pointerup', endHold); cv.addEventListener('pointercancel', endHold);
cv.addEventListener('contextmenu', e => e.preventDefault());
function buy(i) {
  const u = UPG[i], L = S[u.key], c = u.cost(L);
  if (u.max && L >= u.max) return;
  if (S.coins >= c) { S.coins -= c; S[u.key]++; btnPop[i] = 1; save(); }
  else btnPop[i] = 0.4;
}
window.addEventListener('keydown', e => { if (e.key === '1') buy(0); if (e.key === '2') buy(1); if (e.key === '3') buy(2); });
window.addEventListener('resize', layout);

// ---------- loop ----------
function frame(now) {
  let dt = (now - last) / 1000; last = now; if (dt > 0.1) dt = 0.1;
  update(dt); draw();
  requestAnimationFrame(frame);
}
load(); coinShown = S.coins;
loadAll().then(() => {
  makeCoin(); layout();
  document.getElementById('loading').remove();
  window.__bb = { S, get scene() { return scene; }, start() { if (scene === 'title') { scene = 'game'; startSub(); } } };
  requestAnimationFrame(t => { last = t; frame(t); });
});
})();
