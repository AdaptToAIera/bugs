"use strict";
/* =====================================================================
   Bugs! Modern Edition — entities (factories + AI)
   ===================================================================== */

// Playable field bounds (the grassy garden area)
const FIELD = { l: 44, r: VW - 44, t: 130, b: VH - 64 };

let UID = 1;

/* ---------------- Gardener (sprayer) ---------------- */
function makeGardener(x, y){
  return { id: UID++, x, y, dir: 0, anim: 0, fire: 0, vibT: 0, scale: 1,
           homeX: x, homeY: y, recoil: 0, wepIdx: 0, fireCd: 0, _shot: false };
}
function updateGardener(g, dt, input){
  let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  if (dx || dy) {
    const l = Math.hypot(dx, dy); dx /= l; dy /= l;
    g.dir = dirIndex(dx, dy);
    g.x = clamp(g.x + dx * TUNE.gardenerSpeed * dt, FIELD.l, FIELD.r);
    g.y = clamp(g.y + dy * TUNE.gardenerSpeed * dt, FIELD.t, FIELD.b);
    g.anim += dt * 9;
  }
  g.fire = input.fire ? 1 : 0;
  g.recoil = approach(g.recoil, g.fire ? 1 : 0, 12, dt);
  g.vibT = Math.max(0, g.vibT - dt);
  if (g.fire) {
    if (g.vibT <= 0) { g.vibT = 0.12; sfx.spray(); vibrate(6); }
    // emit mist particles along the aim
    emitMist(g);
  }
}

/* ---------------- Plant ---------------- */
function makePlant(x, y){
  return { id: UID++, x, y, hp: TUNE.plantStart, flash: 0, time: Math.random() * 6 };
}
function updatePlant(p, dt){
  p.time += dt;
  p.flash = Math.max(0, p.flash - dt * 3);
}

/* ---------------- Bug ---------------- */
function makeBug(type, x, y, plantIdx){
  const t = BUG_TYPES[type];
  return { id: UID++, type, x, y, dir: 0, time: Math.random() * 6,
          hp: t.hp, maxHp: t.hp, pts: t.pts, speed: t.speed, scale: t.scale,
          pl: plantIdx, flash: 0, dodgeT: 0, dodgeCd: 0, phase: Math.random() * TAU,
          dartT: 0, dartDir: 0, wob: 0 };
}
function updateBug(b, dt, plants, sprayers, level){
  b.time += dt;
  b.flash = Math.max(0, b.flash - dt * 4);
  const p = plants[b.pl];
  if (!p) return;
  const headX = p.x, headY = plantTopY(p);
  let dx = headX - b.x, dy = headY - b.y;
  const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
  b.dir = dirIndex(dx, dy);
  b.wob += dt * 3;

  const spd = b.speed * (1 + (level - 1) * 0.1);
  let mx = dx, my = dy;
  const mv = BUG_TYPES[b.type].move;

  if (mv === 'wiggle') {
    const w = Math.sin(b.wob * 3 + b.phase) * 0.6;
    mx = dx - dy * w; my = dy + dx * w;
  } else if (mv === 'slither') {
    const w = Math.sin(b.wob * 2 + b.phase) * 0.9;
    mx = dx - dy * w; my = dy + dx * w;
  } else if (mv === 'straight') {
    // steady, plodding
  } else if (mv === 'erratic') {
    // fly: jittery with quick direction changes
    if (b.dartT <= 0) { b.dartT = rand(0.4, 0.9); b.dartDir = rand(-0.9, 0.9); }
    b.dartT -= dt;
    mx = dx + Math.cos(b.dartDir) * 0.8; my = dy + Math.sin(b.dartDir) * 0.8;
  } else if (mv === 'dart') {
    // dragonfly: burst in a set direction, then reset
    if (b.dartT <= 0) { b.dartT = rand(0.5, 1.1); const a = Math.atan2(dy, dx) + rand(-0.5, 0.5); b.dartDir = a; }
    b.dartT -= dt;
    mx = Math.cos(b.dartDir); my = Math.sin(b.dartDir);
  }
  const ml = Math.hypot(mx, my) || 1; mx /= ml; my /= ml;

  // evasion: sidestep a firing gardener's cone
  // evasion: sidestep ONLY when actually inside a firing gardener's cone, and only
  // once per cooldown (so bugs can't dodge forever — keeps combat skill-based).
  if (b.dodgeCd > 0) b.dodgeCd -= dt;
  if (b.dodgeT > 0) {
    b.dodgeT -= dt;
    const pa = Math.atan2(headY - b.y, headX - b.x) + Math.PI / 2 * (b.phase < Math.PI ? 1 : -1);
    b.x += Math.cos(pa) * spd * dt * 1.5;
    b.y += Math.sin(pa) * spd * dt * 1.5;
  } else if (b.dodgeCd <= 0) {
    b.dodgeCd = 1.5;
    for (const s of sprayers) {
      if (s.fire && inCone(s, b, WEAPONS[s.wepIdx])) { b.dodgeT = 0.2; break; }
    }
  }
  if (b.dodgeT <= 0) {
    b.x += mx * spd * dt;
    b.y += my * spd * dt;
  }
  b.x = clamp(b.x, 20, VW - 20);
  b.y = clamp(b.y, 90, VH - 40);
}

// spray cone hit test (uses active weapon)
function inCone(g, b, wep){
  const d = DIRS[g.dir];
  const ox = g.x, oy = g.y - 8;
  const rx = b.x - ox, ry = b.y - oy;
  const dist = Math.hypot(rx, ry);
  if (dist > wep.range || dist < 12) return false;
  const dot = rx * d[0] + ry * d[1];
  const ang = Math.acos(clamp(dot / dist, -1, 1));
  return ang < wep.spread;
}

// emit spray mist particles for a gardener
function emitMist(g){
  const wep = WEAPONS[g.wepIdx || 0];
  const d = DIRS[g.dir];
  const ox = g.x + d[0] * 14, oy = (g.y - 8) + d[1] * 14;
  for (let i = 0; i < wep.mist; i++) {
    const a = (Math.random() * 2 - 1) * wep.spread;
    const ca = Math.cos(a), sa = Math.sin(a);
    const dirx = d[0] * ca - d[1] * sa, diry = d[0] * sa + d[1] * ca;
    const sp = 120 + Math.random() * 90;
    const life = rand(0.25, 0.45);
    const px = ox + dirx * rand(6, wep.range * 0.9);
    const py = oy + diry * rand(6, wep.range * 0.9);
    spawnPart(px, py, dirx * 40, diry * 40 - 20, life, wep.col, rand(4, 8), 0, 'dot');
  }
}
