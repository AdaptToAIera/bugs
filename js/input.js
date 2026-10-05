"use strict";
/* =====================================================================
   Bugs! Modern Edition — input (keyboard + touch + UI buttons)
   P1: WASD + Space (fire)  ·  P2: Arrows + Shift/Enter (fire)
   In 1-player, arrows also drive player 1.
   ===================================================================== */
const input1 = { up:0, down:0, left:0, right:0, fire:0 };
const input2 = { up:0, down:0, left:0, right:0, fire:0 };
let touchMode = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
function isTouch(){ return touchMode; }

function setKey(map, a, on){ if (a) map[a] = on ? 1 : 0; }

function routeArrows(code, on){
  const arrows = { ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right' };
  const a = arrows[code];
  if (!a) return;
  // arrows drive P1 in 1P, P2 in 2P
  const map = (typeof game !== 'undefined' && game.mode === 2) ? input2 : input1;
  setKey(map, a, on);
}

window.addEventListener('keydown', e => {
  const c = e.code;
  initAudio();
  if (c === 'KeyW') setKey(input1, 'up', 1);
  else if (c === 'KeyS') setKey(input1, 'down', 1);
  else if (c === 'KeyA') setKey(input1, 'left', 1);
  else if (c === 'KeyD') setKey(input1, 'right', 1);
  else if (c === 'Space') setKey(input1, 'fire', 1);
  routeArrows(c, 1);
  if (c === 'ShiftLeft' || c === 'Enter') setKey(input2, 'fire', 1);
  // meta
  if (c === 'KeyP') togglePause();
  else if (c === 'KeyM') { setMuted(!muted); sfx.select(); }
  else if (c === 'KeyR' && game.state === 'gameover') { initAudio(); retry(); }
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(c)) e.preventDefault();
});
window.addEventListener('keyup', e => {
  const c = e.code;
  if (c === 'KeyW') setKey(input1, 'up', 0);
  else if (c === 'KeyS') setKey(input1, 'down', 0);
  else if (c === 'KeyA') setKey(input1, 'left', 0);
  else if (c === 'KeyD') setKey(input1, 'right', 0);
  else if (c === 'Space') setKey(input1, 'fire', 0);
  routeArrows(c, 0);
  if (c === 'ShiftLeft' || c === 'Enter') setKey(input2, 'fire', 0);
});

// ---- touch controls ----
const touchUI = document.getElementById('touchUI');
function showTouchUI(){ if (touchMode) touchUI.style.display = 'block'; }
document.querySelectorAll('#dpad .dbtn').forEach(el => {
  const d = el.dataset.d;
  const on = e => { e.preventDefault(); input1[d] = 1; initAudio(); };
  const off = e => { e.preventDefault(); input1[d] = 0; };
  el.addEventListener('touchstart', on, { passive:false });
  el.addEventListener('touchend', off, { passive:false });
  el.addEventListener('touchcancel', off, { passive:false });
  el.addEventListener('mousedown', on);
  el.addEventListener('mouseup', off);
  el.addEventListener('mouseleave', off);
});
const fireBtn = document.getElementById('fireBtn');
{
  const on = e => { e.preventDefault(); input1.fire = 1; initAudio(); };
  const off = e => { e.preventDefault(); input1.fire = 0; };
  fireBtn.addEventListener('touchstart', on, { passive:false });
  fireBtn.addEventListener('touchend', off, { passive:false });
  fireBtn.addEventListener('touchcancel', off, { passive:false });
  fireBtn.addEventListener('mousedown', on);
  fireBtn.addEventListener('mouseup', off);
}

// UI buttons
document.getElementById('btnPause').addEventListener('click', () => { initAudio(); togglePause(); });
document.getElementById('btnMute').addEventListener('click', () => { initAudio(); setMuted(!muted); });

// auto-pause on blur / hide
document.addEventListener('visibilitychange', () => { if (document.hidden && game.state === 'play' && !game.paused) togglePause(); });
window.addEventListener('blur', () => { if (game.state === 'play' && !game.paused) togglePause(); });

// pre-warm audio on first gesture
['touchstart','mousedown','keydown'].forEach(ev => window.addEventListener(ev, () => initAudio(), { once:true, passive:true }));
