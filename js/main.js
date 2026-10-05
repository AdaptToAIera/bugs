"use strict";
/* =====================================================================
   Bugs! Modern Edition — main (canvas setup + 60-120fps loop)
   Uses requestAnimationFrame (runs at the display's refresh rate,
   up to 120Hz) with a clamped delta-time simulation, so motion is
   smooth at any refresh rate.
   ===================================================================== */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function fit(){
  const w = window.innerWidth, h = window.innerHeight;
  const s = Math.min(w / VW, h / VH);
  const dpr = Math.min(2, window.devicePixelRatio || 1);   // cap DPR for perf
  const scale = s * dpr;
  canvas.width = Math.max(1, Math.round(VW * scale));
  canvas.height = Math.max(1, Math.round(VH * scale));
  canvas.style.width = (VW * s) + 'px';
  canvas.style.height = (VH * s) + 'px';
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  bgDirty = true;   // background must be re-rasterized on the next render
  // Portrait: pin the canvas to the top so the bottom touch controls don't cover it.
  const portrait = h / w > 1.15;
  document.getElementById('stage').style.alignItems = portrait ? 'flex-start' : 'center';
  const rh = document.getElementById('rotateHint');
  if (rh) rh.style.display = (portrait && isTouch()) ? 'block' : 'none';
}
window.addEventListener('resize', fit);
fit();

// Safety net: log any runtime error to the console (no visible box). A single
// frame's error must never permanently corrupt rendering.
window.addEventListener('error', (e) => console.error('[BUGS] ' + e.message, e.error && e.error.stack));
window.addEventListener('unhandledrejection', (e) => console.error('[BUGS] ' + e.reason));

let last = 0;
function loop(ts){
  requestAnimationFrame(loop);
  const now = ts / 1000;
  let dt = now - last; last = now;
  if (!(dt > 0)) dt = 0;
  if (dt > 0.05) dt = 0.05;            // clamp big hitches (tab switch)

  game.time += dt;
  updateTimescale(dt);
  const wdt = dt * timeScale;          // scaled sim time (slow-mo aware)

  // effects / shake / pops use scaled time (slow-mo slows them too)
  updateEffects(wdt);
  updateShake(wdt);
  updatePops(wdt);

  if (!game.paused) {
    if (game.state === 'play') updatePlay(wdt);
    else if (game.state === 'bloom') updateBloom(wdt);
  }
  musicTick(dt, !game.paused && (game.state === 'play' || game.state === 'bloom'));
  try {
    render();
    updateHUD();
  } catch (e) { console.error('[BUGS] render: ' + e.message); }
}
requestAnimationFrame(loop);

// ---- boot ----
showStart();
showTouchUI();
