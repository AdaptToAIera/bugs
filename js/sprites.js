"use strict";
/* =====================================================================
   Bugs! Modern Edition — sprites
   Detailed, Disney-style cartoon vector art (gradients, outlines,
   big expressive eyes). Each bug is a distinct, recognizable creature.
   All drawn with the 2D canvas API only — no images, no packages.
   ===================================================================== */

function setOutline(ctx, w){ ctx.lineJoin='round'; ctx.lineCap='round'; ctx.lineWidth = w || 3; ctx.strokeStyle = COL.outline; }

function vGrad(ctx, x, y, h, c0, c1){
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, c0); g.addColorStop(1, c1); return g;
}
function rGrad(ctx, x, y, r, c0, c1){
  const g = ctx.createRadialGradient(x - r*0.35, y - r*0.4, r*0.15, x, y, r);
  g.addColorStop(0, c0); g.addColorStop(1, c1); return g;
}
function eye(ctx, x, y, r, lx, ly, iris){
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x, y, r, r*1.18, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = iris || '#3a2a1a'; ctx.beginPath(); ctx.ellipse(x+lx, y+ly, r*0.56, r*0.62, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#0a0a0a'; ctx.beginPath(); ctx.arc(x+lx, y+ly, r*0.3, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x+lx - r*0.2, y+ly - r*0.28, r*0.24, 0, TAU); ctx.fill();
}
function rr(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ============================ GARDENER ============================ */
// x,y = feet center. dir = 8-way aim index. anim = walk phase. firing = bool.
function drawGardener(ctx, x, y, dir, anim, firing, scale){
  scale = scale || 1;
  const d = DIRS[dir];
  const faceX = d[0] >= 0 ? 1 : -1;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(scale, scale);

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.beginPath(); ctx.ellipse(0, 30, 20, 7, 0, 0, TAU); ctx.fill();

  ctx.scale(faceX, 1);

  const bob = Math.sin(anim) * 2;
  const step = Math.sin(anim) * 6;

  // legs + boots
  ctx.fillStyle = COL.overallsShade;
  ctx.save(); setOutline(ctx, 2.5);
  rr(ctx, -11, 8 + step*0.4, 8, 20 - step*0.4, 4); ctx.fill(); ctx.stroke();
  rr(ctx, 3, 8 - step*0.4, 8, 20 + step*0.4, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = COL.boot;
  rr(ctx, -13, 24 + step*0.4, 12, 8, 4); ctx.fill(); ctx.stroke();
  rr(ctx, 1, 24 - step*0.4, 13, 8, 4); ctx.fill(); ctx.stroke();
  ctx.restore();

  // body (overalls)
  ctx.save(); setOutline(ctx, 3);
  ctx.fillStyle = vGrad(ctx, 0, -18, 30, COL.overalls, COL.overallsShade);
  rr(ctx, -12, -16 + bob, 24, 26, 9); ctx.fill(); ctx.stroke();
  // shirt
  ctx.fillStyle = vGrad(ctx, 0, -30, 16, COL.shirt, COL.shirtShade);
  rr(ctx, -11, -30 + bob, 22, 16, 7); ctx.fill(); ctx.stroke();
  // overall straps + button
  ctx.fillStyle = COL.overalls;
  ctx.fillRect(-9, -26 + bob, 4, 12); ctx.fillRect(5, -26 + bob, 4, 12);
  ctx.fillStyle = '#ffe14d';
  ctx.beginPath(); ctx.arc(-7, -14 + bob, 2.4, 0, TAU); ctx.arc(7, -14 + bob, 2.4, 0, TAU); ctx.fill();
  // pocket
  ctx.fillStyle = 'rgba(255,255,255,.25)';
  rr(ctx, -6, -6 + bob, 12, 8, 3); ctx.fill();
  ctx.restore();

  // back arm
  ctx.save(); setOutline(ctx, 2.5);
  ctx.strokeStyle = COL.shirt; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(-10, -12 + bob); ctx.lineTo(-15, 4 + bob); ctx.stroke();
  ctx.fillStyle = COL.skin; ctx.beginPath(); ctx.arc(-15, 5 + bob, 4, 0, TAU); ctx.fill();
  ctx.restore();

  // front arm (holds can, points toward aim)
  const aim = firing ? Math.atan2(d[1], d[0]*faceX) : 0.5;
  ctx.save();
  ctx.translate(10, -14 + bob);
  ctx.rotate(aim * 0.6);
  ctx.strokeStyle = COL.shirt; ctx.lineWidth = 7; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(12, 4); ctx.stroke();
  // hand
  ctx.fillStyle = COL.skin; ctx.beginPath(); ctx.arc(13, 4, 4.5, 0, TAU); ctx.fill();
  // spray can
  drawCan(ctx, 16, 0, firing);
  ctx.restore();

  // head
  const hx = 0, hy = -34 + bob;
  ctx.save(); setOutline(ctx, 3);
  ctx.fillStyle = rGrad(ctx, hx, hy, 13, '#ffe6c4', COL.skin);
  ctx.beginPath(); ctx.arc(hx, hy, 13, 0, TAU); ctx.fill(); ctx.stroke();
  // cheeks
  ctx.fillStyle = 'rgba(255,120,120,.5)';
  ctx.beginPath(); ctx.arc(hx-6, hy+5, 3, 0, TAU); ctx.arc(hx+8, hy+5, 3, 0, TAU); ctx.fill();
  // eyes (look toward aim)
  const look = clamp(d[0]*faceX, -1, 1);
  eye(ctx, hx - 4, hy - 1, 3.4, look*1.4, clamp(d[1],-1,1)*1.2, '#2f6b4f');
  eye(ctx, hx + 4, hy - 1, 3.4, look*1.4, clamp(d[1],-1,1)*1.2, '#2f6b4f');
  // smile
  ctx.strokeStyle = COL.outline; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(hx, hy + 5, 4, 0.15*Math.PI, 0.85*Math.PI); ctx.stroke();
  ctx.restore();

  // sun hat
  ctx.save(); setOutline(ctx, 3);
  ctx.fillStyle = vGrad(ctx, 0, hy-16, 12, COL.hat, COL.hatShade);
  ctx.beginPath(); ctx.ellipse(hx, hy - 6, 15, 6, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = vGrad(ctx, 0, hy-16, 10, COL.hat, COL.hatShade);
  ctx.beginPath(); ctx.arc(hx, hy - 6, 10, Math.PI, 0); ctx.fill(); ctx.stroke();
  // hat band + flower
  ctx.fillStyle = '#e0557a'; ctx.fillRect(hx-10, hy-8, 20, 3);
  ctx.fillStyle = '#ff8ab0';
  for (let i=0;i<5;i++){ const a=i*TAU/5; ctx.beginPath(); ctx.arc(hx+9+Math.cos(a)*3, hy-7+Math.sin(a)*3, 2.4,0,TAU); ctx.fill(); }
  ctx.fillStyle = '#ffe14d'; ctx.beginPath(); ctx.arc(hx+9, hy-7, 2,0,TAU); ctx.fill();
  ctx.restore();

  ctx.restore();
}
function drawCan(ctx, x, y, firing){
  ctx.save();
  setOutline(ctx, 2.5);
  // can body
  ctx.fillStyle = vGrad(ctx, 0, y-10, 20, COL.can, COL.canShade);
  rr(ctx, x-4, y-9, 9, 18, 3); ctx.fill(); ctx.stroke();
  // label
  ctx.fillStyle = '#57d13e'; ctx.fillRect(x-4, y-3, 9, 6);
  // nozzle
  ctx.fillStyle = COL.nozzle; rr(ctx, x-1, y-14, 4, 6, 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}

/* ============================ PLANT ============================ */
// x,y = pot base center. hp drives size/vigor. flash = damage flash (0..1).
function quad(t, p0, p1, p2){
  const u = 1 - t;
  return [ u*u*p0[0] + 2*u*t*p1[0] + t*t*p2[0], u*u*p0[1] + 2*u*t*p1[1] + t*t*p2[1] ];
}
function fcol(c, f){ // lerp a #rrggbb color toward white by f (0..1) — damage flash
  if (f <= 0.02) return c;
  const r = parseInt(c.slice(1,3),16), g = parseInt(c.slice(3,5),16), b = parseInt(c.slice(5,7),16);
  const m = (v) => Math.round(v + (255 - v) * Math.min(1, f));
  return 'rgb(' + m(r) + ',' + m(g) + ',' + m(b) + ')';
}
function shade(c, f){ // darken a #rrggbb color by f (0..1)
  const r = parseInt(c.slice(1,3),16), g = parseInt(c.slice(3,5),16), b = parseInt(c.slice(5,7),16);
  const m = (v) => Math.round(v * (1 - (f || 0.3)));
  return 'rgb(' + m(r) + ',' + m(g) + ',' + m(b) + ')';
}
function drawPot(ctx, flash){
  ctx.save(); setOutline(ctx, 3);
  ctx.fillStyle = fcol(COL.pot, flash);
  ctx.beginPath();
  ctx.moveTo(-24, -4); ctx.lineTo(24, -4); ctx.lineTo(16, 28); ctx.lineTo(-16, 28); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = fcol(COL.potRim, flash);
  rr(ctx, -26, -10, 52, 13, 6); ctx.fill(); ctx.stroke();
  ctx.restore();
}
// x,y = pot base center. hp drives gradual growth; species = flower/leaf type;
// celebrate (0..1) = bloom progress, makes the single flower swell & glow.
function drawPlant(ctx, x, y, hp, maxHp, flash, time, species, celebrate){
  species = species || PLANT_TYPES[0];
  celebrate = celebrate || 0;
  const k = clamp(hp / maxHp, 0.15, 1);        // growth 0.15..1
  const H = 55 + 125 * k;                    // stem height grows with health
  const sway = Math.sin(time * 1.4 + x * 0.02) * 0.05;
  const nLeaves = 2 + Math.round(k * 6);      // 2..8 leaves
  const leafSize = 12 + 17 * k;              // 12..29
  ctx.save();
  ctx.translate(x, y);
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,.22)';
  ctx.beginPath(); ctx.ellipse(0, 10, 24 * k + 14, 9, 0, 0, TAU); ctx.fill();
  // stem: starts at the pot's RIM and rises from the pot (the pot is drawn last,
  // on top of the stem's base, so the stem appears to grow OUT of the pot).
  const p0 = [0, -4];
  const p2 = [26 * Math.sin(sway), -H];
  const p1 = [18 * Math.sin(sway) * (0.4 + 0.6 * k), -H * 0.5];
  ctx.strokeStyle = fcol(species.stem, flash);
  ctx.lineWidth = 3 + 5 * k; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(p0[0], p0[1]);
  ctx.quadraticCurveTo(p1[0], p1[1], p2[0], p2[1]);
  ctx.stroke();
  // leaves (full, along the stem, alternating sides)
  for (let i = 0; i < nLeaves; i++){
    const t = 0.22 + 0.74 * (i / (nLeaves - 1 || 1));
    const pt = quad(t, p0, p1, p2);
    const side = i % 2 === 0 ? 1 : -1;
    drawLeaf(ctx, pt[0], pt[1], side, leafSize * (1 - 0.3 * t), species, flash, time + i);
  }
  // THE one flower, at the top of the stem (swells + glows during the bloom)
  const open = hp <= 4 ? 0 : (hp - 4) / 6;    // 0 at hp4 .. 1 at hp10
  const fscale = 1 + 0.55 * celebrate;
  if (open < 0.3 && celebrate < 0.08) drawBud(ctx, p2[0], p2[1], open, species, flash, time);
  else {
    // bloom glow
    if (celebrate > 0.02) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.15 * celebrate;
      ctx.fillStyle = species.petal[0]; ctx.beginPath(); ctx.arc(p2[0], p2[1], 40 * fscale, 0, TAU); ctx.fill(); ctx.restore();
    }
    ctx.save();
    ctx.translate(p2[0], p2[1]); ctx.scale(fscale, fscale); ctx.translate(-p2[0], -p2[1]);
    drawFlower(ctx, p2[0], p2[1], species, Math.max(open, celebrate), flash, time + celebrate * 3);
    ctx.restore();
  }
  // pot last, over the stem base -> the stem grows out of the pot
  drawPot(ctx, flash);
  ctx.restore();
}
function drawLeaf(ctx, x, y, side, size, species, flash, time){
  const w = Math.sin(time * 1.3) * 0.06;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(side, 1);
  ctx.rotate(0.5 + w);
  const len = size, wid = size * 0.5;
  const grad = ctx.createLinearGradient(0, -wid, 0, wid);
  grad.addColorStop(0, fcol(species.leaf, flash));
  grad.addColorStop(1, fcol(COL.leafShade, flash));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.4, -wid, len, 0);
  ctx.quadraticCurveTo(len * 0.4, wid, 0, 0);
  ctx.closePath();
  ctx.fill();
  // vein
  ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.5, 0, len, 0); ctx.stroke();
  ctx.restore();
}
function drawBud(ctx, x, y, open, species, flash, time){
  const s = 7 + 13 * open;
  ctx.save();
  ctx.translate(x, y - 2);
  ctx.fillStyle = fcol(species.petal[0], flash);
  ctx.beginPath(); ctx.ellipse(0, -s * 0.35, s * 0.4, s * 0.55, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = fcol(species.stem, flash);
  ctx.beginPath();
  ctx.moveTo(0, 4); ctx.quadraticCurveTo(-s * 0.7, 0, 0, -s * 0.6); ctx.quadraticCurveTo(s * 0.7, 0, 0, 4); ctx.closePath();
  ctx.fill();
  ctx.restore();
}
function drawFlower(ctx, x, y, species, open, flash, time){
  open = clamp(open, 0, 1);
  if (open <= 0.02) return;
  const pulse = 1 + 0.05 * Math.sin(time * 2.4);
  const R = (9 + 25 * open) * species.len * pulse;
  const n = species.petals;
  // soft glow
  ctx.save();
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.06 * open;
  ctx.fillStyle = species.petal[0];
  ctx.beginPath(); ctx.arc(x, y, R * 1.5, 0, TAU); ctx.fill();
  ctx.restore();
  // petals (full teardrops, light->dark toward tip)
  for (let i = 0; i < n; i++){
    const a = (i / n) * TAU + time * 0.12;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(a);
    const wid = R * (0.3 + 0.4 * species.round);
    const grad = ctx.createLinearGradient(0, 0, R, 0);
    grad.addColorStop(0, fcol(species.petal[1], flash));
    grad.addColorStop(1, fcol(species.petal[0], flash));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(R * 0.5, -wid, R, 0);
    ctx.quadraticCurveTo(R * 0.5, wid, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // center
  const c = 5 + 7 * open;
  const cg = ctx.createRadialGradient(x - c * 0.3, y - c * 0.3, c * 0.1, x, y, c);
  cg.addColorStop(0, fcol(species.center, flash));
  cg.addColorStop(1, fcol(shade(species.center, 0.35), flash));
  ctx.fillStyle = cg;
  ctx.beginPath(); ctx.arc(x, y, c, 0, TAU); ctx.fill();
}
// Big celebratory bloom for the bloom animation (uses the species' flower).
function drawBloomFlower(ctx, x, y, open, time, species){
  drawFlower(ctx, x, y, species || PLANT_TYPES[0], open, 0, time);
}

/* ============================ BUGS (6 distinct creatures) ============================ */
// Each: distinct silhouette, color, animation. x,y = center. t = time, s = scale.

// CATERPILLAR — green, 5 segments, big eyes, antennae, wiggle
function bugCaterpillar(ctx, x, y, dir, t, s){
  const wig = Math.sin(t * 8) * 0.5;
  ctx.save(); ctx.translate(x, y);
  ctx.scale(s, s);
  // shadow
  ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0, 12, 20, 5, 0,0,TAU); ctx.fill();
  // segments (tail -> head)
  for (let i = 4; i >= 0; i--){
    const off = Math.sin(t * 8 + i) * 4;
    const px = -i * 8, py = off * (i/5);
    const r = 8 - i * 0.8;
    ctx.save(); setOutline(ctx, 2.5);
    ctx.fillStyle = rGrad(ctx, px, py, r, i%2 ? '#8ef06a' : '#57d13e', i%2 ? '#57d13e' : '#37a52a');
    ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill(); ctx.stroke();
    // tiny legs
    ctx.strokeStyle = COL.outline; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px-4, py+r-2); ctx.lineTo(px-4, py+r+3);
    ctx.moveTo(px+4, py+r-2); ctx.lineTo(px+4, py+r+3); ctx.stroke();
    ctx.restore();
  }
  // head
  const hx = 8, hy = 0;
  ctx.save(); setOutline(ctx, 2.5);
  ctx.fillStyle = rGrad(ctx, hx, hy, 10, '#8ef06a', '#37a52a');
  ctx.beginPath(); ctx.arc(hx, hy, 10, 0, TAU); ctx.fill(); ctx.stroke();
  // antennae
  ctx.strokeStyle = COL.outline; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(hx+4, hy-8); ctx.quadraticCurveTo(hx+10, hy-16, hx+12, hy-14);
  ctx.moveTo(hx+8, hy-8); ctx.quadraticCurveTo(hx+14, hy-14, hx+15, hy-11); ctx.stroke();
  ctx.fillStyle = '#ff8ab0'; ctx.beginPath(); ctx.arc(hx+12, hy-14, 2.5, 0, TAU); ctx.arc(hx+15, hy-11, 2.5, 0, TAU); ctx.fill();
  // eyes
  eye(ctx, hx+1, hy-3, 3.2, 1.4, 0.4, '#2f6b4f');
  eye(ctx, hx+7, hy+1, 2.6, 1.4, 0.4, '#2f6b4f');
  // smile
  ctx.strokeStyle = COL.outline; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(hx+5, hy+4, 3, 0.2*Math.PI, 0.8*Math.PI); ctx.stroke();
  ctx.restore();
  ctx.restore();
}

// LADYBUG — red dome, black head + spots, shiny
function bugLadybug(ctx, x, y, dir, t, s){
  const wig = Math.sin(t * 6) * 0.2;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.rotate(wig);
  // legs
  ctx.strokeStyle = COL.outline; ctx.lineWidth = 2.5;
  for (let i = 0; i < 3; i++){
    const ly = -8 + i * 8;
    const lift = Math.sin(t*10 + i) * 3;
    ctx.beginPath();
    ctx.moveTo(-9, ly); ctx.lineTo(-15, ly+6-lift);
    ctx.moveTo(9, ly); ctx.lineTo(15, ly+6-lift);
    ctx.stroke();
  }
  // body (dome)
  ctx.save(); setOutline(ctx, 3);
  ctx.fillStyle = rGrad(ctx, 0, -4, 14, '#ff6b6b', '#c81e1e');
  ctx.beginPath(); ctx.ellipse(0, 0, 13, 15, 0, 0, TAU); ctx.fill(); ctx.stroke();
  // center line
  ctx.strokeStyle = COL.outline; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(0, 13); ctx.stroke();
  // spots
  ctx.fillStyle = COL.outline;
  const spots = [[-6,-6],[6,-5],[-7,2],[7,3],[-4,8],[4,8],[0,-9]];
  for (const [sx, sy] of spots){ ctx.beginPath(); ctx.arc(sx, sy, 2.6, 0, TAU); ctx.fill(); }
  // shine
  ctx.fillStyle = 'rgba(255,255,255,.5)';
  ctx.beginPath(); ctx.ellipse(-5, -6, 4, 3, 0.5, 0, TAU); ctx.fill();
  ctx.restore();
  // head
  ctx.save(); setOutline(ctx, 2.5);
  ctx.fillStyle = rGrad(ctx, 0, -15, 8, '#3a3a3a', '#111');
  ctx.beginPath(); ctx.arc(0, -14, 7, 0, TAU); ctx.fill(); ctx.stroke();
  eye(ctx, -3, -15, 2.6, 1, -0.4, '#fff');
  eye(ctx, 3, -15, 2.6, 1, -0.4, '#fff');
  ctx.restore();
  ctx.restore();
}

// BEETLE — tan/green oval, elytra split, sturdy (2 hp)
function bugBeetle(ctx, x, y, dir, t, s){
  const wig = Math.sin(t * 5) * 0.15;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(wig);
  // legs
  ctx.strokeStyle = '#5a4a2a'; ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++){
    const ly = -8 + i * 8, lift = Math.sin(t*8 + i) * 3;
    ctx.beginPath();
    ctx.moveTo(-12, ly); ctx.lineTo(-20, ly+7-lift);
    ctx.moveTo(12, ly); ctx.lineTo(20, ly+7-lift);
    ctx.stroke();
  }
  // body (elytra)
  ctx.save(); setOutline(ctx, 3);
  ctx.fillStyle = rGrad(ctx, 0, -4, 16, '#9ad157', '#4a7a2a');
  ctx.beginPath(); ctx.ellipse(0, 0, 15, 16, 0, 0, TAU); ctx.fill(); ctx.stroke();
  // elytra split + ridges
  ctx.strokeStyle = 'rgba(40,70,20,.7)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(0, 15); ctx.stroke();
  for (let i = 1; i < 4; i++){
    ctx.beginPath(); ctx.arc(-8, -2, 8+i*2, -0.6, 0.6); ctx.stroke();
    ctx.beginPath(); ctx.arc(8, -2, 8+i*2, Math.PI-0.6, Math.PI+0.6); ctx.stroke();
  }
  // shine
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  ctx.beginPath(); ctx.ellipse(-5, -6, 5, 3, 0.5, 0, TAU); ctx.fill();
  ctx.restore();
  // head
  ctx.save(); setOutline(ctx, 2.5);
  ctx.fillStyle = rGrad(ctx, 0, -16, 8, '#6a8a3a', '#3a5a1a');
  ctx.beginPath(); ctx.arc(0, -15, 7, 0, TAU); ctx.fill(); ctx.stroke();
  eye(ctx, -3, -16, 2.8, 1, -0.4, '#2a1a0a');
  eye(ctx, 3, -16, 2.8, 1, -0.4, '#2a1a0a');
  // mandibles
  ctx.strokeStyle = '#3a5a1a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-3,-21); ctx.quadraticCurveTo(-6,-25,-8,-23);
  ctx.moveTo(3,-21); ctx.quadraticCurveTo(6,-25,8,-23); ctx.stroke();
  ctx.restore();
  ctx.restore();
}

// EARTHWORM — pink, long undulating body, small head, no legs
function bugEarthworm(ctx, x, y, dir, t, s){
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  // shadow
  ctx.fillStyle='rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(0, 10, 24, 5, 0,0,TAU); ctx.fill();
  // undulating body (a chain of segments along a sine curve)
  const segs = 9;
  const pts = [];
  for (let i = 0; i < segs; i++){
    const px = -i * 5 + 10;
    const py = Math.sin(t * 6 - i * 0.6) * 6;
    pts.push([px, py]);
  }
  for (let i = segs - 1; i >= 0; i--){
    const [px, py] = pts[i];
    const r = 6 - Math.abs(i - 4) * 0.4;
    ctx.save(); setOutline(ctx, 2);
    ctx.fillStyle = rGrad(ctx, px, py, r, '#ffb0c8', '#e06a90');
    ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill(); ctx.stroke();
    // band
    ctx.strokeStyle = 'rgba(180,60,100,.4)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(px-r+1, py); ctx.lineTo(px+r-1, py); ctx.stroke();
    ctx.restore();
  }
  // head
  const [hx, hy] = pts[0];
  ctx.save(); setOutline(ctx, 2.5);
  ctx.fillStyle = rGrad(ctx, hx, hy, 8, '#ffb0c8', '#e06a90');
  ctx.beginPath(); ctx.arc(hx, hy, 8, 0, TAU); ctx.fill(); ctx.stroke();
  eye(ctx, hx+2, hy-2, 2.6, 1.2, 0, '#7a1a3a');
  eye(ctx, hx+6, hy+1, 2.2, 1.2, 0, '#7a1a3a');
  ctx.strokeStyle = COL.outline; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(hx+4, hy+4, 3, 0.2*Math.PI, 0.8*Math.PI); ctx.stroke();
  // tiny suckers
  ctx.fillStyle = 'rgba(180,60,100,.5)';
  for (let i = 2; i < segs; i+=2){ const [px,py]=pts[i]; ctx.beginPath(); ctx.arc(px, py+6, 2, 0, TAU); ctx.fill(); }
  ctx.restore();
  ctx.restore();
}

// FLY — grey body, big red compound eyes, flapping translucent wings, erratic
function bugFly(ctx, x, y, dir, t, s){
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const flap = Math.sin(t * 40) * 0.8;
  // wings (behind, translucent, flapping)
  ctx.save();
  ctx.fillStyle = 'rgba(220,235,255,.5)';
  ctx.strokeStyle = 'rgba(150,180,220,.6)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(-10, -6, 12, 6, -0.5 - flap*0.3, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(10, -6, 12, 6, -0.5 + flap*0.3, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.restore();
  // body
  ctx.save(); setOutline(ctx, 2.5);
  ctx.fillStyle = rGrad(ctx, 0, 0, 9, '#9aa8bd', '#5a6a80');
  ctx.beginPath(); ctx.ellipse(0, 2, 8, 10, 0, 0, TAU); ctx.fill(); ctx.stroke();
  // stripes
  ctx.strokeStyle = 'rgba(40,50,70,.6)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-6, 2); ctx.lineTo(6, 2); ctx.moveTo(-5, 6); ctx.lineTo(5, 6); ctx.stroke();
  // legs
  ctx.strokeStyle = '#3a4a60'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-6, 10); ctx.lineTo(-9, 15); ctx.moveTo(0, 11); ctx.lineTo(0, 16); ctx.moveTo(6, 10); ctx.lineTo(9, 15); ctx.stroke();
  ctx.restore();
  // head + big red eyes
  ctx.save(); setOutline(ctx, 2.5);
  ctx.fillStyle = rGrad(ctx, 0, -8, 7, '#7a8aa0', '#4a5a70');
  ctx.beginPath(); ctx.arc(0, -8, 7, 0, TAU); ctx.fill(); ctx.stroke();
  // compound red eyes
  const er = 4.5;
  ctx.fillStyle = rGrad(ctx, -4, -9, er, '#ff6b6b', '#c01e1e');
  ctx.beginPath(); ctx.arc(-4, -9, er, 0, TAU); ctx.fill();
  ctx.fillStyle = rGrad(ctx, 4, -9, er, '#ff6b6b', '#c01e1e');
  ctx.beginPath(); ctx.arc(4, -9, er, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-5, -10, 1.5, 0, TAU); ctx.arc(3, -10, 1.5, 0, TAU); ctx.fill();
  // antennae
  ctx.strokeStyle = '#4a5a70'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-2,-14); ctx.quadraticCurveTo(-4,-18,-5,-17);
  ctx.moveTo(2,-14); ctx.quadraticCurveTo(4,-18,5,-17); ctx.stroke();
  ctx.restore();
  ctx.restore();
}

// DRAGONFLY — teal long body, 4 translucent wings, darting
function bugDragonfly(ctx, x, y, dir, t, s){
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const flap = Math.sin(t * 30) * 0.6;
  // 4 wings
  ctx.save();
  ctx.fillStyle = 'rgba(180,235,255,.5)';
  ctx.strokeStyle = 'rgba(120,200,240,.6)'; ctx.lineWidth = 1.5;
  const wing = (sx, sy, rot) => { ctx.save(); ctx.translate(sx, sy); ctx.rotate(rot);
    ctx.beginPath(); ctx.ellipse(10, 0, 14, 5, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); };
  wing(-8, -3, -0.4 - flap*0.4); wing(8, -3, 0.4 + flap*0.4);
  wing(-8, 2, -0.9 - flap*0.3); wing(8, 2, 0.9 + flap*0.3);
  ctx.restore();
  // body (long)
  ctx.save(); setOutline(ctx, 2.5);
  ctx.fillStyle = rGrad(ctx, 0, 0, 10, '#5ae0d0', '#1a8a7a');
  ctx.beginPath(); ctx.ellipse(0, 4, 6, 16, 0, 0, TAU); ctx.fill(); ctx.stroke();
  // thorax
  ctx.fillStyle = rGrad(ctx, 0, -6, 7, '#5ae0d0', '#1a8a7a');
  ctx.beginPath(); ctx.arc(0, -6, 6, 0, TAU); ctx.fill(); ctx.stroke();
  // segments
  ctx.strokeStyle = 'rgba(20,100,90,.6)'; ctx.lineWidth = 1.5;
  for (let i = 1; i < 4; i++){ ctx.beginPath(); ctx.moveTo(-5, -2 + i*4); ctx.lineTo(5, -2 + i*4); ctx.stroke(); }
  // head + big eyes
  ctx.fillStyle = rGrad(ctx, 0, -13, 6, '#5ae0d0', '#1a8a7a');
  ctx.beginPath(); ctx.arc(0, -13, 6, 0, TAU); ctx.fill(); ctx.stroke();
  const er = 4;
  ctx.fillStyle = rGrad(ctx, -4, -14, er, '#ffe14d', '#e0a000');
  ctx.beginPath(); ctx.arc(-4, -14, er, 0, TAU); ctx.fill();
  ctx.fillStyle = rGrad(ctx, 4, -14, er, '#ffe14d', '#e0a000');
  ctx.beginPath(); ctx.arc(4, -14, er, 0, TAU); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(-5, -14, 1.6, 0, TAU); ctx.arc(3, -14, 1.6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-5, -15, 1.2, 0, TAU); ctx.arc(3, -15, 1.2, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.restore();
}

const BUG_DRAW = {
  caterpillar: bugCaterpillar,
  ladybug: bugLadybug,
  beetle: bugBeetle,
  earthworm: bugEarthworm,
  fly: bugFly,
  dragonfly: bugDragonfly,
};
function drawBug(ctx, b){
  const fn = BUG_DRAW[b.type];
  if (fn) {
    const dirX = DIRS[b.dir] ? DIRS[b.dir][0] : 1;
    if (dirX < 0) {           // facing left -> flip so the head/eyes point the way it moves
      ctx.save();
      ctx.translate(b.x, b.y); ctx.scale(-1, 1); ctx.translate(-b.x, -b.y);
      fn(ctx, b.x, b.y, b.dir, b.time, b.scale);
      ctx.restore();
    } else {
      fn(ctx, b.x, b.y, b.dir, b.time, b.scale);
    }
  }
}
