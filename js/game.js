"use strict";
/* =====================================================================
   Bugs! Modern Edition — game (state, progression, render orchestration)
   ===================================================================== */

const game = {
  state: 'title',       // title | play | bloom | gameover
  mode: 1, level: 1, wepIdx: 0, plantType: 0,
  score: 0, hi: 0, combo: 0, comboT: 0,
  growT: 0, bloomT: 0, bloomIdx: 0,
  time: 0, paused: false,
};
let sprayers = [], plants = [], bugs = [];
let bgCanvas = null, bgDirty = true;
try { game.hi = +localStorage.getItem('bugs_hiv2') || 0; } catch (e) {}

function saveHi(){ try { localStorage.setItem('bugs_hiv2', game.hi); } catch (e) {} }

// ---- collected cards (one per plant species, persisted) ----
function loadCards(){ try { return JSON.parse(localStorage.getItem('bugs_cards') || '[]'); } catch (e) { return []; } }
function saveCards(){ try { localStorage.setItem('bugs_cards', JSON.stringify(collected)); } catch (e) {} }
let collected = loadCards();
function collectCard(idx){ if (collected.indexOf(idx) >= 0) return false; collected.push(idx); saveCards(); return true; }

/* ---------------- layout ---------------- */
function plantLayout(mode){
  if (mode === 1) return [{ x: VW / 2, y: VH - 92 }];
  return [{ x: VW * 0.30, y: VH - 92 }, { x: VW * 0.70, y: VH - 92 }];
}
function setupPlay(mode){
  game.mode = mode; game.level = 1; game.wepIdx = 0; game.plantType = 0;
  game.score = 0; game.combo = 0; game.comboT = 0; game.growT = 0;
  sprayers = []; plants = []; bugs = [];
  clearEffects();
  const pos = plantLayout(mode);
  pos.forEach((p, i) => {
    plants.push(makePlant(p.x, p.y));
    sprayers.push(makeGardener(p.x, p.y - 70));
  });
  sprayers.forEach(g => g.wepIdx = 0);
  game.state = 'play';
  hideOverlay();
  sfx.start();
  showBanner('LEVEL 1', WEAPONS[0].name + ' ready');
}
function retry(){ setupPlay(game.mode); }

/* ---------------- progression ---------------- */
function startBloom(player){
  game.state = 'bloom'; game.bloomT = 0;
  game.bloomIdx = (player - 1) % plants.length;
  sfx.bloom(); vibrate(40);
  showBanner('LEVEL ' + game.level + ' COMPLETE!', 'Beautiful!');
}
function nextLevel(){
  const bloomed = game.plantType;                 // species that just bloomed
  game.level++;
  game.wepIdx = Math.min(WEAPONS.length - 1, game.level - 1);
  game.plantType = (game.level - 1) % PLANT_TYPES.length;   // new plant this level
  for (const p of plants) { p.hp = TUNE.plantStart; p.flash = 0; }
  sprayers.forEach(g => g.wepIdx = game.wepIdx);
  bugs = []; clearEffects();
  game.combo = 0; game.comboT = 0; game.growT = 0;
  game.state = 'play';
  sfx.level(); vibrate(30);
  showBanner('LEVEL ' + game.level, WEAPONS[game.wepIdx].name + ' unlocked!');
  if (collectCard(bloomed)) { sfx.card(); setTimeout(() => showCardPopup(bloomed), 500); }
}
function gameOver(player){
  game.state = 'gameover';
  sfx.over(); vibrate(60);
  if (game.score > game.hi) { game.hi = game.score; saveHi(); }
  let dead = 1;
  if (game.mode === 2) for (let i = 0; i < plants.length; i++) if (plants[i].hp <= 0) { dead = i + 1; break; }
  const newHi = game.score >= game.hi && game.score > 0;
  showGameOver(dead, newHi);
}
// 2P: a match ends when a plant blooms (that player wins) or dies (the other wins).
function matchWon(winner){
  game.state = 'gameover';
  sfx.win(); vibrate(60);
  if (game.score > game.hi) { game.hi = game.score; saveHi(); }
  const newHi = game.score >= game.hi && game.score > 0;
  showWin(winner, newHi);
}

/* ---------------- per-frame update (play) ---------------- */
function updatePlay(dt){
  // spawning
  const pool = BUG_POOL[Math.min(BUG_POOL.length - 1, game.level - 1)];
  const maxBugs = TUNE.maxBugsBase + game.level * TUNE.levelBugs;
  const spawnInt = Math.max(TUNE.minSpawn, TUNE.baseSpawn - game.level * 0.1);
  if (bugs.length < maxBugs && Math.random() < dt / spawnInt) {
    const type = pick(pool);
    const side = Math.random() * 4;
    let x, y;
    if (side === 0) { x = 10; y = rand(120, VH - 80); }
    else if (side === 1) { x = VW - 10; y = rand(120, VH - 80); }
    else if (side === 2) { x = rand(40, VW - 40); y = 100; }
    else { x = rand(40, VW - 40); y = VH - 60; }
    // target nearest plant
    let best = 0, bd = 1e9;
    plants.forEach((p, i) => { const d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < bd) { bd = d; best = i; } });
    bugs.push(makeBug(type, x, y, best));
  }

  // plants
  for (const p of plants) updatePlant(p, dt);
  // regrowth
  game.growT += dt;
  if (game.growT >= TUNE.growInt) {
    game.growT = 0;
    for (const p of plants) {
      if (p.hp > 0 && p.hp < TUNE.plantMax) {
        p.hp++;
        sfx.grow();
        const hy = plantTopY(p);
        for (let i = 0; i < 5; i++) spawnPart(p.x + rand(-10, 10), hy + rand(-10, 10), rand(-20, 20), rand(-40, -10), 0.5, '#8ef06a', rand(3, 6), -30, 'dot');
        popup(p.x, hy - 20, '+1', '#8ef06a', 18);
      }
    }
  }

  // gardener
  for (let i = 0; i < sprayers.length; i++) updateGardener(sprayers[i], dt, i === 0 ? input1 : input2);

  // bugs
  const wep = WEAPONS[game.wepIdx];
  // weapon fire-rate: a shot only lands on the frame the weapon fires (hp = shots to kill)
  for (const g of sprayers) {
    if (g.fire) { g.fireCd -= dt; g._shot = g.fireCd <= 0; if (g._shot) g.fireCd = wep.rate; }
    else { g.fireCd = 0; g._shot = false; }
  }
  for (let i = bugs.length - 1; i >= 0; i--) {
    const b = bugs[i];
    updateBug(b, dt, plants, sprayers, game.level);
    // spray hit (only when the weapon actually fires this frame)
    let killer = -1;
    for (let si = 0; si < sprayers.length; si++) { const g = sprayers[si]; if (g.fire && g._shot && inCone(g, b, wep)) { killer = si; break; } }
    if (killer >= 0) {
      b.hp--; b.flash = 0.3;
      if (b.hp <= 0) {
        const mult = comboMult();
        const gain = b.pts * mult;
        game.score += gain;
        if (game.score > game.hi) game.hi = game.score;   // in-memory only; persisted on state change
        game.combo++; game.comboT = 2;
        burst(b.x, b.y, typeColor(b.type), 14, 170, 6, 260);
        burst(b.x, b.y, '#fff', 6, 90, 4, 120);
        popup(b.x, b.y - 16, '+' + gain, mult > 1 ? '#ffe14d' : '#fff', 22);
        sfx.kill(); vibrate(18);
        slowmo(0.45, 0.12);
        addShake(4, 0.25);
        bugs.splice(i, 1);
        continue;
      } else {
        sfx.hit(); addShake(2, 0.15);
        slowmo(0.6, 0.06);
      }
    }
    // eat plant
    const p = plants[b.pl];
    const headY = plantTopY(p);
    if (dist(b.x, b.y, p.x, headY) < TUNE.plantR) {
      p.hp--; p.flash = 1;
      burst(p.x, headY, '#57d13e', 10, 120, 5, 220);
      sfx.eat(); vibrate(40);
      addShake(8, 0.4);
      slowmo(0.5, 0.18);
      bugs.splice(i, 1);
    }
  }

  // combo decay
  if (game.comboT > 0) { game.comboT -= dt; if (game.comboT <= 0) game.combo = 0; }

  // bloom / lose
  for (let i = 0; i < plants.length; i++) if (plants[i].hp <= 0) {
    if (game.mode === 2) matchWon(i === 0 ? 2 : 1);  // the survivor's plant is still alive -> they win
    else gameOver(i + 1);
    return;
  }
  for (let i = 0; i < plants.length; i++) if (plants[i].hp >= TUNE.plantMax) { startBloom(i + 1); return; }
}
function comboMult(){ return 1 + Math.min(3, Math.floor(game.combo / 5)); }
const TYPE_COLORS = { caterpillar:'#57d13e', ladybug:'#ff5a5a', beetle:'#9ad157', earthworm:'#ff8ab0', fly:'#9aa8bd', dragonfly:'#5ae0d0' };
function typeColor(t){ return TYPE_COLORS[t] || '#fff'; }

/* ---------------- bloom state update ---------------- */
function updateBloom(dt){
  game.bloomT += dt;
  // celebratory particles around the blooming plant
  if (Math.random() < dt * 8) {
    const p = plants[game.bloomIdx];
    const hy = p.y - 74;
    spawnPart(p.x + rand(-30, 30), hy + rand(-30, 30), rand(-30, 30), rand(-50, -10), rand(0.5, 1), pick(['#fff08a', '#ff8ad0', '#57c8ff', '#ffe14d']), rand(3, 6), -20, 'spark');
  }
  if (game.bloomT >= TUNE.bloomDur) { if (game.mode === 2) matchWon(game.bloomIdx + 1); else nextLevel(); }
}

/* ================= RENDER ================= */
function ensureBackground(){
  if (bgCanvas && !bgDirty) return bgCanvas;
  bgCanvas = document.createElement('canvas');
  bgCanvas.width = VW; bgCanvas.height = VH;
  const c = bgCanvas.getContext('2d');
  // sky
  const sky = c.createLinearGradient(0, 0, 0, VH);
  sky.addColorStop(0, COL.skyTop); sky.addColorStop(0.6, COL.skyBot); sky.addColorStop(1, COL.grassTop);
  c.fillStyle = sky; c.fillRect(0, 0, VW, VH);
  // sun
  const sun = c.createRadialGradient(VW - 150, 110, 10, VW - 150, 110, 90);
  sun.addColorStop(0, 'rgba(255,240,138,.95)'); sun.addColorStop(1, 'rgba(255,240,138,0)');
  c.fillStyle = sun; c.beginPath(); c.arc(VW - 150, 110, 90, 0, TAU); c.fill();
  c.fillStyle = COL.sun; c.beginPath(); c.arc(VW - 150, 110, 42, 0, TAU); c.fill();
  // clouds
  drawCloud(c, 150, 120, 1); drawCloud(c, 430, 80, 0.8); drawCloud(c, 700, 170, 1.2);
  // rolling hills
  c.fillStyle = '#8fd97a';
  c.beginPath(); c.moveTo(0, 400);
  c.bezierCurveTo(200, 340, 400, 400, 600, 370);
  c.bezierCurveTo(800, 340, 900, 400, VW, 380);
  c.lineTo(VW, VH); c.lineTo(0, VH); c.closePath(); c.fill();
  c.fillStyle = COL.hill;
  c.beginPath(); c.moveTo(0, 440);
  c.bezierCurveTo(250, 390, 500, 450, 750, 420);
  c.bezierCurveTo(900, 400, VW, 440, VW, 430);
  c.lineTo(VW, VH); c.lineTo(0, VH); c.closePath(); c.fill();
  // ground grass
  c.fillStyle = COL.grassTop;
  c.fillRect(0, 470, VW, VH - 470);
  const gg = c.createLinearGradient(0, 470, 0, VH);
  gg.addColorStop(0, COL.grassTop); gg.addColorStop(1, COL.grassBot);
  c.fillStyle = gg; c.fillRect(0, 470, VW, VH - 470);
  // grass blades
  c.strokeStyle = 'rgba(60,150,40,.5)'; c.lineWidth = 2;
  for (let x = 0; x < VW; x += 14) {
    const h = 10 + (x * 7 % 12);
    c.beginPath(); c.moveTo(x, 540); c.quadraticCurveTo(x + 4, 540 - h * 0.6, x + 8, 540 - h); c.stroke();
  }
  // flower bed (soil) where plants sit
  c.fillStyle = COL.soil;
  c.beginPath();
  c.moveTo(0, 486); c.quadraticCurveTo(VW / 2, 470, VW, 486);
  c.lineTo(VW, VH); c.lineTo(0, VH); c.closePath(); c.fill();
  // decorative flowers
  for (let i = 0; i < 10; i++) {
    const fx = 30 + i * 95, fy = 505 + (i % 2) * 20;
    decoFlower(c, fx, fy, pick(['#ff8ad0', '#ffe14d', '#ff8a5a', '#8a7bff']), 5 + (i % 3) * 2);
  }
  // little fence
  c.fillStyle = '#c98a4a';
  for (let x = 20; x < VW; x += 60) {
    c.fillRect(x, 452, 8, 34);
    c.beginPath(); c.moveTo(x, 452); c.lineTo(x + 4, 446); c.lineTo(x + 8, 452); c.closePath(); c.fill();
  }
  c.fillStyle = '#b5763a'; c.fillRect(0, 462, VW, 6); c.fillRect(0, 474, VW, 6);
  bgDirty = false;
  return bgCanvas;
}
function drawCloud(c, x, y, s){
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = COL.cloud;
  c.beginPath();
  c.arc(0, 0, 22, 0, TAU); c.arc(24, -8, 26, 0, TAU); c.arc(50, 0, 20, 0, TAU); c.arc(24, 8, 24, 0, TAU);
  c.fill(); c.restore();
}
function decoFlower(c, x, y, col, r){
  c.save(); c.translate(x, y);
  c.strokeStyle = '#3fae4f'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(0, 8); c.lineTo(0, 24); c.stroke();
  c.fillStyle = col;
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6; c.beginPath(); c.ellipse(Math.cos(a) * r, Math.sin(a) * r, r * 0.7, r * 0.4, a, 0, TAU); c.fill(); }
  c.fillStyle = '#ffe14d'; c.beginPath(); c.arc(0, 0, r * 0.5, 0, TAU); c.fill();
  c.restore();
}

function render(){
  const c = ctx;
  const off = drawShakeOffset();
  c.save();
  c.translate(off.x, off.y);
  c.drawImage(ensureBackground(), 0, 0);

  if (game.state === 'play' || game.state === 'bloom') {
    // plants (the blooming one swells during the bloom; there is always ONE flower)
    const celebrate = game.state === 'bloom' ? easeOut(clamp(game.bloomT / 1.3, 0, 1)) : 0;
    for (let i = 0; i < plants.length; i++) {
      const p = plants[i];
      const cel = (game.state === 'bloom' && i === game.bloomIdx) ? celebrate : 0;
      drawPlant(c, p.x, p.y, p.hp, TUNE.plantMax, p.flash, game.time, PLANT_TYPES[game.plantType], cel);
    }
    // bugs
    for (const b of bugs) drawBug(c, b);
    // gardener
    for (const g of sprayers) {
      const wep = WEAPONS[g.wepIdx || 0];
      drawGardener(c, g.x, g.y, g.dir, g.anim, g.fire, g.scale);
      // faint aim guide
      if (g.fire) drawAimGuide(c, g, wep);
    }
  }
  // bloom animation (big flower + rays)
  if (game.state === 'bloom') drawBloomScene(c);

  // particles + pops on top
  drawEffects(c);
  drawPops(c);
  c.restore();
}
function drawAimGuide(c, g, wep){
  const d = DIRS[g.dir];
  c.save();
  c.globalAlpha = 0.12;
  c.fillStyle = wep.col;
  c.beginPath();
  const ox = g.x, oy = g.y - 8;
  c.moveTo(ox, oy);
  c.arc(ox, oy, wep.range, -wep.spread + Math.atan2(d[1], d[0]), wep.spread + Math.atan2(d[1], d[0]));
  c.closePath(); c.fill();
  c.restore();
}
function drawBloomScene(c){
  const p = plants[game.bloomIdx];
  const t = game.bloomT;
  // white flash at the start
  if (t < 0.4) { c.globalAlpha = (0.4 - t) * 1.5; c.fillStyle = '#fff'; c.fillRect(0, 0, VW, VH); c.globalAlpha = 1; }
  const open = easeOut(clamp(t / 1.3, 0, 1));
  const cx = p.x, cy = plantTopY(p);   // the plant's OWN flower (the one that swells) — no second flower
  // soft glow around the flower
  c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.2 * open;
  c.fillStyle = PLANT_TYPES[game.plantType].petal[0];
  c.beginPath(); c.arc(cx, cy, 30 + 60 * open, 0, TAU); c.fill();
  c.restore();
  // light rays emanating from the flower
  c.save(); c.globalAlpha = 0.28 * open;
  for (let i = 0; i < 12; i++) {
    const a = i * TAU / 12 + t * 0.3;
    c.strokeStyle = i % 2 ? '#fff08a' : '#ffffff'; c.lineWidth = 3;
    c.beginPath();
    c.moveTo(cx + Math.cos(a) * 24, cy + Math.sin(a) * 24);
    c.lineTo(cx + Math.cos(a) * (90 + 20 * Math.sin(t * 2 + i)), cy + Math.sin(a) * (90 + 20 * Math.sin(t * 2 + i)));
    c.stroke();
  }
  c.restore();
  // sparkles around the flower
  for (let i = 0; i < 14; i++) {
    const a = i * 0.45 + t * 1.5, r = 40 + (i * 17) % 30;
    const sx = cx + Math.cos(a) * r, sy = cy + Math.sin(a) * r;
    if ((Math.floor(t * 8) + i) % 3 === 0) { c.fillStyle = i % 2 ? '#fff' : '#ffe14d'; c.fillRect(sx - 2, sy - 2, 4, 4); }
  }
}

/* ================= HUD / banner / overlay (DOM) ================= */
const hud = {
  score: document.getElementById('score'),
  level: document.getElementById('level'),
  weapon: document.getElementById('weapon'),
  wepBar: document.getElementById('wepBar'),
  cardBar: document.getElementById('cardBar'),
  combo: document.getElementById('combo'),
  plantHp: document.getElementById('plantHp'),
  hint: document.getElementById('hint'),
};
let hudCache = {};
function updateHUD(){
  const s = 'SCORE ' + String(game.score).padStart(3, '0');
  if (hudCache.s !== s) { hud.score.textContent = s; hudCache.s = s; }
  const l = 'LEVEL ' + game.level;
  if (hudCache.l !== l) { hud.level.textContent = l; hudCache.l = l; }
  const w = WEAPONS[game.wepIdx].name;
  if (hudCache.w !== w) { hud.weapon.textContent = w; hudCache.w = w; }
  const cm = comboMult();
  hud.combo.textContent = 'x' + cm;
  hud.combo.classList.toggle('on', cm > 1);
  let hpTxt;
  if (plants.length >= 1) {
    if (game.mode === 2 && plants.length >= 2) {
      hpTxt = 'P1 ' + Math.max(0, plants[0].hp) + '/' + TUNE.plantMax + '  ·  P2 ' + Math.max(0, plants[1].hp) + '/' + TUNE.plantMax;
    } else {
      hpTxt = '🌱 ' + Math.max(0, plants[0].hp) + '/' + TUNE.plantMax;
    }
  } else {
    hpTxt = '';   // no game started yet (title screen) — don't read an empty plants array
  }
  if (hudCache.hp !== hpTxt) { hud.plantHp.textContent = hpTxt; hudCache.hp = hpTxt; }
  const hint = game.state === 'play' ? (game.mode === 2 ? 'FIRST TO 10 WINS' : 'GROW TO 10') : '';
  if (hudCache.h !== hint) { hud.hint.textContent = hint; hudCache.h = hint; }
  // weapon progression bar (unlocked slots; current highlighted)
  if (hudCache.wk !== game.wepIdx) {
    let html = '';
    for (let i = 0; i < WEAPONS.length; i++) {
      const cls = i === game.wepIdx ? 'cur' : (i <= game.wepIdx ? 'open' : '');
      html += '<div class="wslot ' + cls + '">' + WEAPONS[i].name[0] + '</div>';
    }
    hud.wepBar.innerHTML = html;
    hudCache.wk = game.wepIdx;
  }
  // collected-cards row (filled with the species petal color)
  const ck = collected.join(',');
  if (hudCache.ck !== ck) {
    let html = '';
    for (let i = 0; i < PLANT_TYPES.length; i++) {
      const got = collected.indexOf(i) >= 0;
      const st = got ? 'background:' + PLANT_TYPES[i].petal[0] + 'bb;border-color:' + PLANT_TYPES[i].petal[1] : '';
      html += '<div class="cslot' + (got ? ' got' : '') + '" style="' + st + '">' + (got ? '✿' : '?') + '</div>';
    }
    hud.cardBar.innerHTML = html;
    hudCache.ck = ck;
  }
}

const bannerEl = document.getElementById('banner');
let bannerTimer = null;
function showBanner(t1, t2, dur){
  bannerEl.innerHTML = '<div class="t1"></div><div class="t2"></div>';
  bannerEl.children[0].textContent = t1;
  bannerEl.children[1].textContent = t2;
  bannerEl.style.transition = 'none'; bannerEl.style.opacity = 1; bannerEl.style.transform = 'scale(1.15)';
  requestAnimationFrame(() => { bannerEl.style.transition = 'transform .3s'; bannerEl.style.transform = 'scale(1)'; });
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => { bannerEl.style.transition = 'opacity .4s'; bannerEl.style.opacity = 0; }, (dur || 2.2) * 1000);
}

const overlayEl = document.getElementById('overlay');
function overlayCard(html){ overlayEl.innerHTML = '<div class="card">' + html + '</div>'; overlayEl.classList.add('show'); }
function hideOverlay(){ overlayEl.classList.remove('show'); overlayEl.innerHTML = ''; }

function showStart(){
  const ladder = WEAPONS.map(w => w.name).join(' → ');
  overlayCard(
    '<h1 style="color:#ff8a5a">🐞 BUGS!</h1>' +
    '<h2>GARDEN DEFENDER · modern edition</h2>' +
    '<p style="color:var(--textDim);font-weight:700;font-size:14px;margin-bottom:6px">Spray the bugs. Grow your plant to full bloom.</p>' +
    '<p class="stat" style="font-size:15px">HIGH SCORE&nbsp; ' + game.hi + '</p>' +
    '<p class="stat" style="font-size:13px;color:#cfe6ff">CARDS&nbsp; ' + collected.length + ' / ' + PLANT_TYPES.length + '</p>' +
    '<p style="color:var(--textDim);font-weight:700;font-size:12px;margin:8px 0 2px">WEAPON LADDER (one per level):</p>' +
    '<p style="color:#ffe14d;font-weight:800;font-size:13px;margin-bottom:10px">' + ladder + '</p>' +
    '<div class="btns">' +
    '<button id="o1p">1 PLAYER</button>' +
    '<button id="o2p" class="secondary">2 PLAYER</button></div>' +
    '<p class="tip" style="margin-top:10px">' + (isTouch() ? 'Touch: D-pad + SPRAY · 2P uses both hands' : 'P1: WASD + Space · P2: Arrows + Enter · P Pause · M Mute') + '</div>' +
    '<p style="color:var(--textDim);font-weight:700;font-size:12px;margin-top:8px;line-height:1.5">🐛 Bugs <span style="color:#ff8a5a">EAT your plant</span> — each bite is −1 HP. It regrows +1 HP / 5 s. Reach <span style="color:#8ef06a">10/10</span> to bloom (2P: first to bloom wins); at 0 HP it\u2019s game over.</p>'
  );
  document.getElementById('o1p').onclick = () => { initAudio(); setupPlay(1); };
  document.getElementById('o2p').onclick = () => { initAudio(); setupPlay(2); };
}
function showPause(){
  overlayCard(
    '<h1>PAUSED</h1>' +
    '<div class="btns">' +
    '<button id="oResume">RESUME</button>' +
    '<button id="oQuit" class="secondary">QUIT TO MENU</button></div>' +
    '<div class="tip">P to resume · M to ' + (muted ? 'unmute' : 'mute') + '</div>'
  );
  document.getElementById('oResume').onclick = togglePause;
  document.getElementById('oQuit').onclick = () => { game.paused = false; showStart(); };
}
function showGameOver(dead, newHi){
  overlayCard(
    '<h1 style="color:#ff8a5a">GAME OVER</h1>' +
    '<h2>PLAYER ' + dead + "'s plant was eaten</h2>" +
    '<div class="stat">SCORE&nbsp; ' + game.score + '</div>' +
    '<div class="stat" style="color:#8ef06a">LEVEL REACHED&nbsp; ' + game.level + '</div>' +
    (newHi ? '<div class="stat" style="color:#ff8ad0">★ NEW HIGH SCORE ★</div>' : '') +
    '<div class="btns"><button id="oRetry">PLAY AGAIN</button><button id="oMenu" class="secondary">MENU</button></div>' +
    '<div class="tip">R to retry</div>'
  );
  document.getElementById('oRetry').onclick = () => { initAudio(); retry(); };
  document.getElementById('oMenu').onclick = showStart;
}
function showWin(winner, newHi){
  overlayCard(
    '<h1 style="color:#ffe14d">🏆 PLAYER ' + winner + ' WINS!</h1>' +
    '<h2>First to full bloom takes the crown</h2>' +
    '<div class="stat">SCORE&nbsp; ' + game.score + '</div>' +
    '<div class="stat" style="color:#8ef06a">LEVEL&nbsp; ' + game.level + '</div>' +
    (newHi ? '<div class="stat" style="color:#ff8ad0">★ NEW HIGH SCORE ★</div>' : '') +
    '<div class="btns"><button id="oRetry">REMATCH</button><button id="oMenu" class="secondary">MENU</button></div>' +
    '<div class="tip">R to rematch</div>'
  );
  document.getElementById('oRetry').onclick = () => { initAudio(); retry(); };
  document.getElementById('oMenu').onclick = showStart;
}
function togglePause(){
  if (game.state !== 'play') return;
  game.paused = !game.paused;
  if (game.paused) showPause(); else hideOverlay();
}

// Non-blocking "new card" celebration (draws the species' flower on a mini canvas).
function showCardPopup(idx){
  const t = PLANT_TYPES[idx];
  let el = document.getElementById('cardPop');
  if (!el) {
    el = document.createElement('div'); el.id = 'cardPop';
    el.style.cssText = 'position:fixed;top:32%;left:50%;transform:translate(-50%,-50%);z-index:500;pointer-events:none;text-align:center;opacity:0;transition:opacity .35s, transform .35s';
    if (document.body) document.body.appendChild(el);
  }
  el.innerHTML =
    '<div style="background:linear-gradient(180deg,#1a2a4a,#0e1830);border:1px solid rgba(255,255,255,.25);border-radius:18px;padding:16px 26px;box-shadow:0 24px 70px rgba(0,0,0,.55)">' +
    '<div style="color:#ffe14d;font-weight:900;font-size:13px;letter-spacing:2px">★ NEW CARD ★</div>' +
    '<canvas width="96" height="96" style="margin:6px 0"></canvas>' +
    '<div style="color:#fff;font-weight:800;font-size:19px">' + t.name + '</div>' +
    '<div style="color:rgba(255,255,255,.6);font-size:12px;margin-top:4px">COLLECTED ' + collected.length + ' / ' + PLANT_TYPES.length + '</div>' +
    '</div>';
  const cv = el.querySelector('canvas');
  if (cv) { const c2 = cv.getContext('2d'); c2.clearRect(0, 0, 96, 96); c2.save(); c2.translate(48, 48); drawFlower(c2, 0, 0, t, 1, 0, 0.5); c2.restore(); }
  el.style.opacity = 1; el.style.transform = 'translate(-50%,-50%) scale(1)';
  clearTimeout(el._t); el._t = setTimeout(() => { el.style.opacity = 0; el.style.transform = 'translate(-50%,-58%) scale(.9)'; }, 2600);
}
