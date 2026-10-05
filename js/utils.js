"use strict";
/* =====================================================================
   Bugs! Modern Edition — utilities
   ===================================================================== */
const TAU = Math.PI * 2;

function clamp(v, a, b){ return v < a ? a : (v > b ? b : v); }
function lerp(a, b, t){ return a + (b - a) * t; }
function rand(a, b){ return a + Math.random() * (b - a); }
function randInt(a, b){ return Math.floor(rand(a, b + 1)); }
function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }
function chance(p){ return Math.random() < p; }

function dist2(ax, ay, bx, by){ const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; }
function dist(ax, ay, bx, by){ const dx = ax - bx, dy = ay - by; return Math.hypot(dx, dy); }

// Smooth 0..1 easing
function easeOut(t){ return 1 - Math.pow(1 - t, 3); }
function easeInOut(t){ return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

// Approach current toward target at a max rate (for smooth, frame-rate independent lerp)
function approach(cur, target, rate, dt){
  const d = target - cur;
  const step = rate * dt;
  if (Math.abs(d) <= step) return target;
  return cur + Math.sign(d) * step;
}

// 8-way direction index from a vector (canvas: +y is down)
function dirIndex(dx, dy){
  const a = Math.atan2(dy, dx);
  return (Math.round(a / (Math.PI / 4)) + 8) % 8;
}
// World Y of a plant's head/flower (top of the stem; grows with health).
function plantTopY(p){ return p.y - (55 + 125 * clamp(p.hp / TUNE.plantMax, 0.15, 1)); }
const DIRS = [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];

// Haptics (mobile). No-op where unsupported.
function vibrate(ms){ try { if (navigator && navigator.vibrate) navigator.vibrate(ms); } catch (e) {}
}

// Deterministic-ish hash for stable per-entity variety
function seedRandom(s){ let h = s >>> 0; return function(){ h = (h * 1664525 + 1013904223) >>> 0; return h / 4294967296; }; }
