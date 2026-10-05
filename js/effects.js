"use strict";
/* =====================================================================
   Bugs! Modern Edition — effects (particles, shake, slow-mo, popups)
   Pooled to avoid per-frame garbage collection (keeps 60-120fps smooth).
   ===================================================================== */

// Particle pool
const MAXP = 600;
const parts = [];
for (let i = 0; i < MAXP; i++) parts.push({ on:false });
let pCursor = 0;
function spawnPart(x, y, vx, vy, life, col, size, grav, shape){
  const p = parts[pCursor]; pCursor = (pCursor + 1) % MAXP;
  p.on = true; p.x = x; p.y = y; p.vx = vx; p.vy = vy;
  p.life = life; p.maxLife = life; p.col = col; p.size = size;
  p.grav = grav || 0; p.shape = shape || 'dot';
  p.rot = Math.random() * TAU; p.spin = rand(-6, 6);
}
function burst(x, y, col, n, spd, size, grav){
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, s = rand(0.3, 1) * (spd || 140);
    spawnPart(x, y, Math.cos(a) * s, Math.sin(a) * s - 40, rand(0.3, 0.6), col, rand(0.6, 1) * (size || 5), grav || 220, Math.random() < .5 ? 'dot' : 'spark');
  }
}
function updateEffects(dt){
  for (let i = 0; i < MAXP; i++) {
    const p = parts[i]; if (!p.on) continue;
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.grav) p.vy += p.grav * dt;
    p.vx *= (1 - 1.5 * dt); p.vy *= (1 - 1.5 * dt); // drag
    p.rot += p.spin * dt;
    p.life -= dt;
    if (p.life <= 0) p.on = false;
  }
}
function drawEffects(ctx){
  for (let i = 0; i < MAXP; i++) {
    const p = parts[i]; if (!p.on) continue;
    const a = clamp(p.life / p.maxLife, 0, 1);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.col;
    const s = p.size * (0.5 + a * 0.5);
    if (p.shape === 'spark') {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillRect(-s, -s * 0.3, s * 2, s * 0.6);
      ctx.restore();
    } else {
      ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, TAU); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

// Screen shake
let shakeT = 0, shakeMag = 0, shakeX = 0, shakeY = 0;
function addShake(mag, dur){ if (mag > shakeMag) { shakeMag = mag; shakeT = Math.max(shakeT, dur || 0.3); } }
function updateShake(dt){
  if (shakeT > 0) {
    shakeT -= dt;
    const k = shakeT > 0 ? shakeMag * (shakeT / 0.3) : 0;
    shakeX = rand(-k, k); shakeY = rand(-k, k);
    if (shakeT <= 0) { shakeMag = 0; shakeX = 0; shakeY = 0; }
  }
}
function drawShakeOffset(){ return { x: shakeX, y: shakeY }; }

// Slow-mo / hitstop (throttled + floored so late game never sits at ~50% speed)
let timeScale = 1, tsTarget = 1, slowmoTimer = 0, slowmoCd = 0;
function slowmo(scale, dur){
  if (slowmoCd > 0) return;                 // throttle: max one dip per window
  tsTarget = Math.max(scale, 0.55);         // floor: never below 55%
  slowmoTimer = dur;
  slowmoCd = Math.max(dur, 0.22);          // cooldown window
}
function updateTimescale(dt){
  if (slowmoCd > 0) slowmoCd -= dt;
  if (slowmoTimer > 0) { slowmoTimer -= dt; if (slowmoTimer <= 0) tsTarget = 1; }
  timeScale = approach(timeScale, tsTarget, 10, dt);
}

// Floating score / text popups
const pops = [];
for (let i = 0; i < 40; i++) pops.push({ on:false });
let popCursor = 0;
function popup(x, y, text, col, size){
  const p = pops[popCursor]; popCursor = (popCursor + 1) % pops.length;
  p.on = true; p.x = x; p.y = y; p.text = text; p.col = col || '#fff';
  p.life = 0.9; p.maxLife = 0.9; p.size = size || 22;
}
function updatePops(dt){
  for (const p of pops) if (p.on) { p.y -= 40 * dt; p.life -= dt; if (p.life <= 0) p.on = false; }
}
function drawPops(ctx, font){
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const p of pops) {
    if (!p.on) continue;
    const a = clamp(p.life / p.maxLife, 0, 1);
    const s = p.size * (1 + (1 - a) * 0.4);
    ctx.globalAlpha = a;
    ctx.font = '900 ' + s + 'px "Segoe UI", system-ui, sans-serif';
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.5)';
    ctx.strokeText(p.text, p.x, p.y);
    ctx.fillStyle = p.col;
    ctx.fillText(p.text, p.x, p.y);
  }
  ctx.globalAlpha = 1; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}
function clearEffects(){
  for (const p of parts) p.on = false;
  for (const p of pops) p.on = false;
  shakeT = 0; shakeMag = 0; shakeX = 0; shakeY = 0;
  timeScale = 1; tsTarget = 1; slowmoTimer = 0;
}
