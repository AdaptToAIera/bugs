"use strict";
/* =====================================================================
   Bugs! Modern Edition — configuration
   All tuning/constants live here for easy maintenance & upgrades.
   ===================================================================== */

// Logical (design) resolution — 16:9. Scaled to fit window (DPR-aware).
const VW = 960, VH = 540;

// ---- Modern cartoon palette ----
const COL = {
  skyTop:'#7ec8ff', skyBot:'#cfeaff',
  sun:'#fff08a',
  cloud:'rgba(255,255,255,.92)',
  grassTop:'#7ed957', grassBot:'#4fae3a',
  soil:'#7a4a2b',
  hill:'#5cb84a',
  // gardener
  skin:'#ffd9a8', skinShade:'#f4b877',
  overalls:'#3ea6ff', overallsShade:'#2b7fd6',
  shirt:'#ff9d3b', shirtShade:'#e07a1e',
  hat:'#ffd23b', hatShade:'#e6a817',
  boot:'#5a3a22',
  can:'#e9eef5', canShade:'#aeb8c6', nozzle:'#8892a0',
  outline:'#26303f',
  // plant
  pot:'#d9713b', potShade:'#b4552a', potRim:'#e88b52',
  stem:'#3fae4f', stemShade:'#2c8a3b',
  leaf:'#57d13e', leafShade:'#37a52a', leafLight:'#8ef06a',
  // ui
  text:'#ffffff', textDim:'rgba(255,255,255,.7)',
  accent:'#ffe14d',
};

// ---- Game tuning ----
const TUNE = {
  gardenerSpeed: 260,          // px/sec
  plantR: 26,                  // "head" collision radius
  plantStart: 5, plantMax: 10, // health
  growInt: 5,                  // seconds per +1 regrowth
  bloomDur: 4.5,               // seconds for bloom animation
  baseSpawn: 1.5,             // base seconds between spawns
  minSpawn: 0.45,
  maxBugsBase: 4,
  levelBugs: 1,               // +1 max bugs per level
};

// ---- Weapons (unlocked one per level). range/spread/impact scale with tier. ----
const WEAPONS = [
  { name:'CAN',       range:120, spread:0.50, mist:3, rate:0.10, col:'#cfe6ff' },
  { name:'SPRAY',     range:150, spread:0.62, mist:4, rate:0.10, col:'#a8f0e0' },
  { name:'JET',       range:190, spread:0.40, mist:5, rate:0.08, col:'#fff3a0' },
  { name:'FOAM GUN',  range:200, spread:0.78, mist:6, rate:0.08, col:'#ffd0e8' },
  { name:'CANNON',    range:230, spread:0.66, mist:8, rate:0.07, col:'#d0b0ff' },
];

// ---- Bug types: distinct look, color, behaviour, difficulty. ----
//   hp: hits to kill.  speed: px/sec base.  pts: base score.  move: AI style.
//   move: 'wiggle' (sine) | 'erratic' (fly) | 'straight' (beetle) | 'slither' (worm) | 'dart' (dragonfly)
const BUG_TYPES = {
  caterpillar:  { hp:1, speed:55, pts:10, move:'wiggle',  scale:1.0 },
  ladybug:      { hp:1, speed:80, pts:15, move:'wiggle',  scale:1.0 },
  beetle:       { hp:2, speed:50, pts:25, move:'straight',scale:1.05 },
  earthworm:    { hp:1, speed:60, pts:12, move:'slither', scale:1.0 },
  fly:          { hp:1, speed:120,pts:20, move:'erratic', scale:0.9 },
  dragonfly:    { hp:2, speed:100,pts:30, move:'dart',    scale:0.95 },
};
// Which types can appear, weighted by level (later levels add the fancy ones).
const BUG_POOL = [
  ['caterpillar','ladybug','earthworm'],
  ['caterpillar','ladybug','earthworm','beetle'],
  ['caterpillar','ladybug','beetle','earthworm','fly'],
  ['ladybug','beetle','fly','dragonfly','caterpillar'],
  ['beetle','fly','dragonfly','ladybug','caterpillar','earthworm'],
];

// ---- Plant species (one per level; distinct flower + leaf tint). ----
// petal: [light, dark]; center; petals count; len = petal length factor; round = petal fullness.
const PLANT_TYPES = [
  { name:'TULIP',     stem:'#3fae4f', leaf:'#57d13e', petal:['#ff8ab0','#ff3a7a'], center:'#ffe14d', petals:6,  len:1.15, round:0.55 },
  { name:'SUNFLOWER', stem:'#2f9e46', leaf:'#4fb83a', petal:['#ffd23b','#ff9d3b'], center:'#7a4a2b', petals:14, len:1.05, round:0.35 },
  { name:'DAISY',     stem:'#3fae4f', leaf:'#57d13e', petal:['#ffffff','#d6e2f5'], center:'#ffcf3b', petals:12, len:0.95, round:0.45 },
  { name:'ROSE',      stem:'#2c8a3b', leaf:'#3fae4f', petal:['#ff5a5a','#c81e1e'], center:'#8a1e1e', petals:8,  len:0.85, round:0.75 },
  { name:'ORCHID',    stem:'#3fae4f', leaf:'#4fb83a', petal:['#c08aff','#8a3ae6'], center:'#fff08a', petals:5,  len:1.10, round:0.65 },
  { name:'LAVENDER',  stem:'#3fae4f', leaf:'#4fb83a', petal:['#9a7bff','#6a4ae0'], center:'#ffe14d', petals:10, len:0.75, round:0.50 },
];
