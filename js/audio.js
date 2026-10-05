"use strict";
/* =====================================================================
   Bugs! Modern Edition — audio (all generated with WebAudio, no files)
   ===================================================================== */
let AC = null;
let master = null;
let muted = false;

function initAudio(){
  if (AC) return AC;
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain();
    master.gain.value = 0.5;
    master.connect(AC.destination);
  } catch (e) { AC = null; }
  if (AC && AC.state === 'suspended') AC.resume();
  return AC;
}
function out(){ return master || (AC && AC.destination); }

// One-time noise buffer (spray / ambient)
let noiseBuf = null;
function getNoise(){
  if (noiseBuf || !AC) return noiseBuf;
  const n = AC.sampleRate * 0.5;
  noiseBuf = AC.createBuffer(1, n, AC.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 1.6);
  return noiseBuf;
}

function note(freq, type, vol, dur, when){
  if (!AC || muted) return;
  const t = AC.currentTime + (when || 0);
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out()); o.start(t); o.stop(t + dur + 0.02);
}
function glide(f0, f1, type, vol, dur, when){
  if (!AC || muted) return;
  const t = AC.currentTime + (when || 0);
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type || 'square';
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  g.gain.setValueAtTime(vol || 0.15, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out()); o.start(t); o.stop(t + dur + 0.02);
}
function hiss(vol, dur, freq){
  if (!AC || muted) return;
  const b = getNoise(); if (!b) return;
  const src = AC.createBufferSource(); src.buffer = b; src.playbackRate.value = 0.7 + Math.random() * 0.6;
  const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq || 2200; f.Q.value = 0.8;
  const g = AC.createGain();
  g.gain.setValueAtTime(vol || 0.2, AC.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + (dur || 0.18));
  src.connect(f).connect(g).connect(out()); src.start();
}

const sfx = {
  spray(){ hiss(0.16, 0.16, 2400); },
  hit(){ glide(600, 320, 'square', 0.10, 0.06); },
  kill(){ glide(900, 160, 'square', 0.14, 0.12); note(1200, 'sine', 0.06, 0.08, 0); },
  eat(){ glide(260, 60, 'sawtooth', 0.22, 0.24); },
  grow(){ note(520, 'sine', 0.08, 0.12); note(660, 'sine', 0.06, 0.14, 0.08); },
  level(){ [440, 554, 659, 880].forEach((f, i) => note(f, 'square', 0.12, 0.14, i * 0.09)); },
  weapon(){ [523, 659, 784, 1046].forEach((f, i) => note(f, 'triangle', 0.14, 0.16, i * 0.08)); },
  bloom(){ [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => note(f, 'square', 0.13, 0.2, i * 0.1)); },
  over(){ [330, 262, 196, 131].forEach((f, i) => glide(f, f * 0.8, 'sawtooth', 0.16, 0.3, i * 0.18)); },
  select(){ note(680, 'square', 0.08, 0.05); },
  start(){ [392, 523, 659].forEach((f, i) => note(f, 'square', 0.12, 0.12, i * 0.07)); },
  card(){ [660, 880, 1108, 1320].forEach((f, i) => note(f, 'triangle', 0.12, 0.16, i * 0.09)); },
  win(){ [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => note(f, 'square', 0.16, 0.2, i * 0.11)); },
};

// ---- Gentle, motivating background loop (C - G - Am - F), 32 steps ----
// Soft sine pad + light triangle bass + bright triangle lead; low volume so it
// motivates without getting in the way. Only runs while playing (and not muted).
let musicOn = false, mStep = 0, mT = 0;
const mf = m => 440 * Math.pow(2, (m - 69) / 12);
const M_PAT = [
  { c:[60,64,67], b:48, l:72 }, { c:[60,64,67], b:0, l:74 },
  { c:[60,64,67], b:48, l:76 }, { c:[60,64,67], b:0, l:79 },
  { c:[55,59,62], b:43, l:79 }, { c:[55,59,62], b:0, l:77 },
  { c:[55,59,62], b:43, l:74 }, { c:[55,59,62], b:0, l:72 },
  { c:[57,60,64], b:45, l:74 }, { c:[57,60,64], b:0, l:72 },
  { c:[57,60,64], b:45, l:71 }, { c:[57,60,64], b:0, l:69 },
  { c:[53,57,60], b:41, l:69 }, { c:[53,57,60], b:0, l:71 },
  { c:[53,57,60], b:41, l:72 }, { c:[53,57,60], b:0, l:74 },
];
function musicTick(dt, playing){
  if (!AC || muted) { musicOn = false; return; }
  if (!playing) { musicOn = false; return; }
  mT += dt; const STEP = 0.18;
  if (mT >= STEP) {
    mT -= STEP;
    const s = M_PAT[mStep % M_PAT.length];
    for (const m of s.c) note(mf(m - 12), 'sine', 0.02, STEP * 1.5);   // warm pad
    if (s.b) note(mf(s.b), 'triangle', 0.045, STEP * 0.9);           // light bass pulse
    if (s.l) note(mf(s.l), 'triangle', 0.05, STEP * 1.1);           // bright lead
    mStep++;
  }
}
function setMuted(m){
  muted = m;
  const b = document.getElementById('btnMute');
  if (b) b.textContent = m ? '🔇' : '🔊';
}
